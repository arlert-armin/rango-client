import type { SwapQueueContext, SwapStorage } from '../types';
import type { ExecuterActions } from '@arlert-dev/queue-manager-core';
import type {
  CheckTxStatusRequest,
  Transaction,
  TransactionStatusResponse,
} from 'rango-sdk';

import { warn } from '@arlert-dev/logging-core';
import { type GenericSigner, SignerError } from 'rango-types';

import {
  createStepFailedEvent,
  delay,
  getCurrentStep,
  getCurrentStepTx,
  getCurrentStepTxType,
  getLastFinishedStepInput,
  getLastFinishedStepInputUsd,
  getLastSuccessfulStepOutputUsd,
  inMemoryTransactionsData,
  resetNetworkStatus,
  setCurrentStepTx,
  updateSwapStatus,
} from '../helpers';
import { httpService } from '../services';
import { notifier } from '../services/eventEmitter';
import {
  getCurrentNamespaceOf,
  getNextStep,
  getRelatedWallet,
  getScannerUrl,
  MessageSeverity,
} from '../shared';
import { prettifyErrorMessage } from '../shared-errors';
import { StepEventType, SwapActionTypes } from '../types';

const INTERVAL_FOR_CHECK_STATUS = 5_000;
const INTERVAL_FOR_CHECK_APPROVAL = 5_000;

/**
 * Subscribe to status of swap transaction by checking from server periodically.
 * After getting the status, notify the user and schedule `SCHEDULE_NEXT_STEP`.
 */
async function checkTransactionStatus({
  getStorage,
  setStorage,
  next,
  schedule,
  retry,
  failed,
  context,
}: ExecuterActions<
  SwapStorage,
  SwapActionTypes,
  SwapQueueContext
>): Promise<void> {
  const swap = getStorage().swapDetails;
  const { meta } = context;
  const checkStatusError = new Error('check status Error');

  const currentStep = getCurrentStep(swap)!;

  if (!currentStep?.executedTransactionId) {
    return;
  }
  const tx = getCurrentStepTx(currentStep);
  let txId = currentStep.executedTransactionId;
  let getTxReceiptFailed = false;
  let status: TransactionStatusResponse | null = null;
  let signer: GenericSigner<Transaction> | null = null;
  const { getTransactionDataByHash, setTransactionDataByHash } =
    inMemoryTransactionsData();

  try {
    const txType = getCurrentStepTxType(currentStep);
    const sourceWallet = getRelatedWallet(swap, currentStep);
    if (txType && sourceWallet) {
      signer = (await context.getSigners(sourceWallet.walletType)).getSigner(
        txType
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    /*
     * wallet is not connected yet
     * no need to do anything
     */
  }

  try {
    // if wallet is connected, try to get transaction reciept
    const { response: txResponse, receiptReceived } =
      getTransactionDataByHash(txId);
    if (signer?.wait && !receiptReceived) {
      const chainId =
        (tx?.blockChain && meta.blockchains?.[tx?.blockChain]?.chainId) ||
        undefined;
      const { hash: updatedTxHash, response: updatedTxResponse } =
        await signer.wait(txId, chainId, txResponse);
      if (updatedTxHash !== txId) {
        currentStep.executedTransactionId =
          updatedTxHash || currentStep.executedTransactionId;
        const currentStepNamespace = getCurrentNamespaceOf(swap, currentStep);
        let explorerUrl: string | undefined;
        const blockchainsMetaNotEmpty = !!Object.keys(meta.blockchains).length;
        if (blockchainsMetaNotEmpty) {
          explorerUrl = getScannerUrl(
            currentStep.executedTransactionId,
            currentStepNamespace.network,
            meta.blockchains
          );
        }
        if (explorerUrl) {
          if (currentStep.explorerUrl && currentStep.explorerUrl?.length >= 1) {
            currentStep.explorerUrl[currentStep.explorerUrl.length - 1] = {
              url: explorerUrl,
              description: 'Replaced Swap',
            };
          }
        }
        txId = currentStep.executedTransactionId;
        if (updatedTxHash && updatedTxResponse) {
          setTransactionDataByHash(updatedTxHash, {
            response: updatedTxResponse,
          });
        }
      } else {
        setTransactionDataByHash(updatedTxHash, {
          receiptReceived: true,
        });
      }
    }
  } catch (error) {
    const { extraMessage, extraMessageDetail, extraMessageErrorCode } =
      prettifyErrorMessage(error);
    const updateResult = updateSwapStatus({
      getStorage,
      setStorage,
      nextStatus: 'failed',
      nextStepStatus: 'failed',
      message: extraMessage,
      details: extraMessageDetail,
      errorCode: extraMessageErrorCode,
    });

    const event = createStepFailedEvent(
      swap,
      extraMessage,
      updateResult.failureType
    );

    warn(checkStatusError, {
      tags: {
        type: 'singer-error',
        reason: event.reason,
        reasonCode: event.reasonCode,
        message: extraMessage,
        messageDetail: extraMessageDetail,
        pendingSwap: swap,
      },
      context: SignerError.isSignerError(error) ? error.getErrorContext() : {},
    });

    getTxReceiptFailed = true;
    /*
     * We shouldn't return here, because we need to trigger check status job in backend.
     * This is not a ui requirement but the backend one.
     */
  }

  const requestBody: CheckTxStatusRequest = {
    requestId: swap.requestId,
    txId,
    step: currentStep.id,
  };

  try {
    status = await httpService().checkStatus(requestBody);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    await delay(INTERVAL_FOR_CHECK_STATUS);
    retry();
    warn(checkStatusError, {
      tags: { type: 'request-error', requestBody, pendingSwap: swap },
    });
    return;
  }

  /*
   * If user cancel swap during check status api call,
   * or getting transaction receipt failed,
   * we should ignore check status response and return
   */
  if (getTxReceiptFailed) {
    return failed();
  }
  if (currentStep?.status === 'failed') {
    return;
  }

  const outputAmount: string | null =
    status?.outputAmount ||
    (currentStep.outputAmount ? currentStep.outputAmount : null);
  const prevOutputAmount = currentStep.outputAmount || null;
  swap.extraMessage = status?.extraMessage || swap.extraMessage;
  swap.extraMessageSeverity = MessageSeverity.info;
  swap.extraMessageDetail = '';

  currentStep.status = status?.status || currentStep.status;
  currentStep.diagnosisUrl =
    status?.diagnosisUrl || currentStep.diagnosisUrl || null;
  currentStep.outputAmount = outputAmount || currentStep.outputAmount;
  currentStep.explorerUrl = status?.explorerUrl || currentStep.explorerUrl;
  currentStep.internalSteps = status?.steps || null;

  const newTransaction = status?.newTx;

  if (newTransaction) {
    currentStep.status = 'created';
    currentStep.executedTransactionId = null;
    currentStep.executedTransactionTime = null;
    setCurrentStepTx(currentStep, newTransaction);
  }

  if (prevOutputAmount === null && outputAmount !== null) {
    notifier({
      event: { type: StepEventType.OUTPUT_REVEALED, outputAmount },
      swap: swap,
      step: currentStep,
    });
  } else if (prevOutputAmount === null && outputAmount === null) {
    // it is needed to set notification after reloading the page
    notifier({
      event: { type: StepEventType.CHECK_STATUS },
      swap: swap,
      step: currentStep,
    });
  }

  if (currentStep.status === 'success') {
    const nextStep = getNextStep(swap, currentStep);
    swap.extraMessageDetail = '';
    swap.extraMessage = nextStep
      ? `starting next step: ${nextStep.swapperId}: ${nextStep.fromBlockchain} -> ${nextStep.toBlockchain}`
      : '';
    notifier({
      event: {
        type: StepEventType.SUCCEEDED,
        inputAmount: getLastFinishedStepInput(swap),
        inputAmountUsd: getLastFinishedStepInputUsd(swap),
        outputAmount: currentStep.outputAmount ?? '',
        outputAmountUsd: getLastSuccessfulStepOutputUsd(swap),
      },
      swap,
      step: currentStep,
    });
  } else if (currentStep.status === 'failed') {
    swap.extraMessage = 'Transaction failed in blockchain';
    swap.extraMessageSeverity = MessageSeverity.error;
    swap.extraMessageDetail = status?.extraMessage || '';
    swap.status = 'failed';
    swap.finishTime = new Date().getTime().toString();
    warn(checkStatusError, {
      tags: {
        type: 'transaction-failed',
        message: swap.extraMessage,
        messageDetails: swap.extraMessageDetail,
        pendingSwap: swap,
      },
    });
  }

  // Sync data with storage
  setStorage({ ...getStorage(), swapDetails: swap });

  if (status?.status === 'failed') {
    failed();
  } else if (
    status?.status === 'success' ||
    (status?.status === 'running' && !!status.newTx)
  ) {
    schedule(SwapActionTypes.SCHEDULE_NEXT_STEP);
    next();
  } else {
    await delay(INTERVAL_FOR_CHECK_STATUS);
    retry();
  }
}

/**
 * Subscribe to status of approval transaction by checking from server periodically.
 * After getting the status, notify the user and schedule `SCHEDULE_NEXT_STEP`.
 */
async function checkApprovalStatus({
  getStorage,
  setStorage,
  next,
  schedule,
  retry,
  failed,
  context,
}: ExecuterActions<
  SwapStorage,
  SwapActionTypes,
  SwapQueueContext
>): Promise<void> {
  const swap = getStorage().swapDetails;
  const { meta } = context;
  const { getTransactionDataByHash, setTransactionDataByHash } =
    inMemoryTransactionsData();
  const checkApprovalStatusError = new Error('check approval status error');

  const currentStep = getCurrentStep(swap);
  if (!currentStep) {
    console.log('ignore check status, current step is null');
    return;
  }
  const tx = getCurrentStepTx(currentStep);

  if (!currentStep?.executedTransactionId) {
    return;
  }
  let txId = currentStep.executedTransactionId;

  let signer: GenericSigner<Transaction> | null = null;
  try {
    const txType = getCurrentStepTxType(currentStep);
    const sourceWallet = getRelatedWallet(swap, currentStep);
    if (txType && sourceWallet) {
      const walletSigners = await context.getSigners(sourceWallet.walletType);
      signer = walletSigners.getSigner(txType);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    /*
     * wallet is not connected yet
     * no need to do anything
     */
  }

  try {
    const { response: txResponse, receiptReceived } =
      getTransactionDataByHash(txId);
    // if wallet is connected, try to get transaction reciept
    if (signer?.wait && !receiptReceived) {
      const chainId =
        (tx?.blockChain && meta.blockchains?.[tx?.blockChain]?.chainId) ||
        undefined;
      const { hash: updatedTxHash, response: updatedTxResponse } =
        await signer.wait(txId, chainId, txResponse);
      if (updatedTxHash !== txId) {
        currentStep.executedTransactionId =
          updatedTxHash || currentStep.executedTransactionId;
        const currentStepNamespace = getCurrentNamespaceOf(swap, currentStep);
        let explorerUrl: string | undefined;
        const blockchainsMetaNotEmpty = !!Object.keys(meta.blockchains).length;
        if (blockchainsMetaNotEmpty) {
          explorerUrl = getScannerUrl(
            currentStep.executedTransactionId,
            currentStepNamespace.network,
            meta.blockchains
          );
        }
        if (explorerUrl) {
          if (currentStep.explorerUrl && currentStep.explorerUrl?.length >= 1) {
            currentStep.explorerUrl[currentStep.explorerUrl.length - 1] = {
              url: explorerUrl,
              description: 'Replaced Approve',
            };
          }
        }
        txId = currentStep.executedTransactionId;
        if (updatedTxHash && updatedTxResponse) {
          setTransactionDataByHash(updatedTxHash, {
            response: updatedTxResponse,
          });
        }
      } else {
        setTransactionDataByHash(updatedTxHash, {
          receiptReceived: true,
        });
      }
    }
  } catch (error) {
    const { extraMessage, extraMessageDetail, extraMessageErrorCode } =
      prettifyErrorMessage(error);
    const updateResult = updateSwapStatus({
      getStorage,
      setStorage,
      nextStatus: 'failed',
      nextStepStatus: 'failed',
      message: extraMessage,
      details: extraMessageDetail,
      errorCode: extraMessageErrorCode,
    });

    const event = createStepFailedEvent(
      swap,
      extraMessage,
      updateResult.failureType
    );

    notifier({
      event,
      ...updateResult,
    });
    warn(checkApprovalStatusError, {
      tags: {
        type: 'singer-error',
        reason: event.reason,
        reasonCode: event.reasonCode,
        message: extraMessage,
        messageDetail: extraMessageDetail,
        pendingSwap: swap,
      },
      context: SignerError.isSignerError(error) ? error.getErrorContext() : {},
    });
    return failed();
  }

  let isApproved = false;
  const request: { requestId: string; txId?: string } = {
    requestId: swap.requestId,
    txId: currentStep.executedTransactionId,
  };

  try {
    const response = await httpService().checkApproval(
      request.requestId,
      request.txId
    );
    // If user cancel swap during check status api call, we should ignore check approval response
    if (currentStep?.status === 'failed') {
      return;
    }

    isApproved = response.isApproved;
    if (
      !isApproved &&
      (response.txStatus === 'failed' || response.txStatus === 'success')
    ) {
      let message, details;
      if (response.txStatus === 'failed') {
        message = 'Approve transaction failed';
        details = 'Smart contract approval tx failed in blockchain.';
      } else {
        message = 'Not enough approval';
        if (response.requiredApprovedAmount && response.currentApprovedAmount) {
          details = `Required approval: ${response.requiredApprovedAmount}, current approval: ${response.currentApprovedAmount}`;
        } else {
          details = `You still don't have enough approval for this swap.`;
        }
      }
      /*
       * approve transaction failed on
       * we should fail the whole swap
       */
      const updateResult = updateSwapStatus({
        getStorage,
        setStorage,
        nextStatus: 'failed',
        nextStepStatus: 'failed',
        errorCode: 'INSUFFICIENT_APPROVE',
        message: message,
        details: details,
      });

      const event = createStepFailedEvent(
        swap,
        message,
        updateResult.failureType
      );

      notifier({
        event,
        ...updateResult,
      });

      warn(checkApprovalStatusError, {
        tags: {
          type: 'approval-failed',
          message: swap.extraMessage,
          messageDetails: swap.extraMessageDetail,
          pendingSwap: swap,
        },
      });

      failed();
    } else if (!isApproved) {
      // it is needed to set notification after reloading the page
      notifier({
        event: { type: StepEventType.CHECK_STATUS },
        swap,
        step: currentStep,
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    isApproved = false;
    warn(checkApprovalStatusError, {
      tags: { type: 'request-error', requestBody: request, pendingSwap: swap },
    });
  }
  if (isApproved) {
    currentStep.status = 'approved';
    swap.extraMessage = `Spending ${currentStep.fromSymbol} approved successfully.`;
    swap.extraMessageDetail = null;
    swap.extraMessageSeverity = MessageSeverity.success;
    currentStep.evmApprovalTransaction = null;
    currentStep.executedTransactionId = null;
    currentStep.executedTransactionTime = null;
    currentStep.starknetApprovalTransaction = null;
    currentStep.tronApprovalTransaction = null;

    setStorage({
      ...getStorage(),
      swapDetails: swap,
    });

    notifier({
      event: { type: StepEventType.APPROVAL_TX_SUCCEEDED },
      swap: swap,
      step: currentStep,
    });

    schedule(SwapActionTypes.SCHEDULE_NEXT_STEP);
    next();
  } else {
    await delay(INTERVAL_FOR_CHECK_APPROVAL);
    retry();
  }
}

/**
 *
 * For doing a swap the user needs to accept a `contract` so it can use the user balance.
 * There is two types of check status:
 *  1. Checking approval transaction (Give permission to a contract)
 *  2. Checking swap transaction.
 *
 */
export async function checkStatus(
  actions: ExecuterActions<SwapStorage, SwapActionTypes, SwapQueueContext>
): Promise<void> {
  const swap = actions.getStorage().swapDetails;
  const currentStep = getCurrentStep(swap);
  if (!currentStep) {
    console.log('ignore check status, current step is null', swap.requestId);
    return;
  }

  /*
   * Reset network status
   * Because when check status is on `loading` or `failed` status, it shows previous message that isn't related to current state.
   */
  resetNetworkStatus(actions);

  if (currentStep.status === 'running') {
    await checkTransactionStatus(actions);
  } else if (currentStep.status === 'waitingForApproval') {
    await checkApprovalStatus(actions);
  }
}
