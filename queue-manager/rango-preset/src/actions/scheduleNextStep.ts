import type { SwapQueueContext, SwapStorage } from '../types';
import type { ExecuterActions } from '@arlert-dev/queue-manager-core';
import type { PendingSwapStep } from 'rango-types';

import {
  getCurrentStep,
  getLastFinishedStepInput,
  getLastFinishedStepInputUsd,
  getLastSuccessfulStep,
  getLastSuccessfulStepOutputUsd,
  isTxAlreadyCreated,
} from '../helpers';
import { notifier } from '../services/eventEmitter';
import { StepEventType, SwapActionTypes } from '../types';

/**
 *
 * This function is responsibe for scheduling the correct `action` based on `PendingSwap` status.
 * It means `action`s schedule this step to decide what should be the next step/task.
 *
 * It's acts like a `while(true)` and will `break` the loop on certain `action`s like `CHECK_STATUS`.
 *
 *
 */
export function scheduleNextStep({
  schedule,
  next,
  failed,
  setStorage,
  getStorage,
}: ExecuterActions<SwapStorage, SwapActionTypes, SwapQueueContext>): void {
  const swap = getStorage().swapDetails;
  const currentStep = getCurrentStep(swap);
  const isFailed = swap.steps.find(
    (step: PendingSwapStep) => step.status === 'failed'
  );

  if (!!currentStep && !isFailed) {
    if (isTxAlreadyCreated(swap, currentStep)) {
      schedule(SwapActionTypes.EXECUTE_TRANSACTION);
      return next();
    }

    if (currentStep?.executedTransactionId) {
      schedule(SwapActionTypes.CHECK_TRANSACTION_STATUS);
      return next();
    }

    swap.status = 'running';

    setStorage({ ...getStorage(), swapDetails: swap });

    notifier({
      event: { type: StepEventType.STARTED },
      swap,
      step: currentStep,
    });

    schedule(SwapActionTypes.CREATE_TRANSACTION);
    next();
  } else {
    swap.status = isFailed ? 'failed' : 'success';
    swap.finishTime = new Date().getTime().toString();

    setStorage({
      ...getStorage(),
      swapDetails: swap,
    });

    const inputAmount = getLastFinishedStepInput(swap);
    const inputAmountUsd = getLastFinishedStepInputUsd(swap);

    notifier({
      ...(isFailed
        ? {
            event: {
              type: StepEventType.FAILED,
              reason: swap.extraMessage ?? undefined,
              reasonCode: 'CALL_OR_SEND_FAILED',
              inputAmount,
              inputAmountUsd,
            },
          }
        : {
            event: {
              type: StepEventType.SUCCEEDED,
              inputAmount,
              inputAmountUsd,
              outputAmount:
                getLastSuccessfulStep(swap.steps)?.outputAmount ?? '',
              outputAmountUsd: getLastSuccessfulStepOutputUsd(swap),
            },
          }),
      swap: swap,
      step: null,
    });

    if (isFailed) {
      failed();
    } else {
      next();
    }
  }
}
