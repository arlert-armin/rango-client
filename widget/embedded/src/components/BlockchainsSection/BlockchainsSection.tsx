import type { PropTypes } from './BlockchainsSection.types';

import { i18n } from '@lingui/core';
import {
  BlockchainsChip,
  Divider,
  Image,
  Skeleton,
  Tooltip,
  Typography,
} from '@arlert-dev/ui';
import React from 'react';

import {
  BLOCKCHAIN_LIST_SIZE,
  BLOCKCHAIN_LIST_SIZE_COMPACT_MODE,
} from '../../constants/configs';
import { usePrepareBlockchainList } from '../../hooks/usePrepareBlockchainList';
import { useAppStore } from '../../store/AppStore';
import { useQuoteStore } from '../../store/quote';
import { useUiStore } from '../../store/ui';
import { getContainer } from '../../utils/common';

import { Blockchains } from './BlockchainsSection.styles';

const NUMBER_OF_LOADING_COMPACT_MODE = 6;
const NUMBER_OF_LOADING = 12;

export function BlockchainsSection(props: PropTypes) {
  const { blockchains, type, blockchain, onChange, onMoreClick } = props;
  const { showCompactTokenSelector } = useUiStore();
  const blockchainsList = usePrepareBlockchainList(blockchains, {
    limit: showCompactTokenSelector
      ? BLOCKCHAIN_LIST_SIZE_COMPACT_MODE
      : BLOCKCHAIN_LIST_SIZE,
    selected: blockchain?.name,
  });

  const { fetchStatus } = useAppStore();
  const resetToBlockchain = useQuoteStore.use.resetToBlockchain();
  const resetFromBlockchain = useQuoteStore.use.resetFromBlockchain();
  const hasMoreItemsInList = blockchainsList.more.length > 0;
  /**
   * When only one item is left on list, we will not show the `More` button and will show the item itself instead.
   */
  const onlyOneItemInList = blockchainsList.more.length === 1;
  const showMoreButton = !onlyOneItemInList && hasMoreItemsInList;

  return (
    <>
      {!showCompactTokenSelector && (
        <>
          <Divider size={12} />
          <Typography variant="label" size="large">
            {i18n.t('Select Chain')}
          </Typography>
        </>
      )}
      <Divider size={12} />
      <Blockchains id="widget-blockchains-section-container">
        {fetchStatus === 'loading' &&
          Array.from(
            Array(
              showCompactTokenSelector
                ? NUMBER_OF_LOADING_COMPACT_MODE
                : NUMBER_OF_LOADING
            ),
            (_, index) => <Skeleton key={index} variant="rounded" height={50} />
          )}
        {fetchStatus === 'success' && (
          <>
            <BlockchainsChip
              className="widget-blockchains-section-all-btn"
              selected={!blockchain}
              onClick={() => {
                if (type === 'from') {
                  resetFromBlockchain();
                } else {
                  resetToBlockchain();
                }
              }}>
              <Typography variant="body" size="xsmall" color="secondary500">
                {i18n.t('All')}
              </Typography>
            </BlockchainsChip>
            {blockchainsList.list.map((item) => (
              <Tooltip
                key={item.name}
                content={item.shortName}
                side="bottom"
                sideOffset={2}
                container={getContainer()}>
                <BlockchainsChip
                  className="widget-blockchains-section-item-btn"
                  key={item.name}
                  selected={!!blockchain && blockchain.name === item.name}
                  onClick={() => onChange(item)}>
                  <Image src={item.logo} size={30} />
                </BlockchainsChip>
              </Tooltip>
            ))}

            {onlyOneItemInList ? (
              <BlockchainsChip
                className="widget-blockchains-section-only-item-btn"
                key={blockchainsList.more[0].name}
                selected={
                  !!blockchain &&
                  blockchain.name === blockchainsList.more[0].name
                }
                onClick={() => onChange(blockchainsList.more[0])}>
                <Image src={blockchainsList.more[0].logo} size={30} />
              </BlockchainsChip>
            ) : null}

            {showMoreButton ? (
              <BlockchainsChip
                onClick={onMoreClick}
                key="more-blockchains"
                className="widget-blockchains-section-more-items-btn">
                <Typography variant="body" size="xsmall" color="secondary500">
                  {i18n._('More +{count}', {
                    count: blockchainsList.more.length,
                  })}
                </Typography>
              </BlockchainsChip>
            ) : null}
          </>
        )}
      </Blockchains>
    </>
  );
}
