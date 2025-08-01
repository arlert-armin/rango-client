import type {
  MuliSelectPropTypes,
  MultiSelectChipProps,
} from './MultiSelect.types';

import {
  ChainsIcon,
  ChevronRightIcon,
  Divider,
  Typography,
  WalletIcon,
} from '@arlert-dev/ui';
import React, { useState } from 'react';

import { MultiList } from '../MultiList';
import { OverlayPanel } from '../OverlayPanel';
import { TokensPanel } from '../TokensPanel';

import { Label, Select, WalletChip } from './MultiSelect.styles';

const MAX_CHIPS = 4;
const Chip = (props: MultiSelectChipProps) => {
  const { label, variant = 'contained' } = props;
  return (
    <WalletChip variant={variant}>
      <Typography size="small" variant="label" color="secondary500">
        {label}
      </Typography>
    </WalletChip>
  );
};

export function MultiSelect(props: MuliSelectPropTypes) {
  const [showNextModal, setShowNextModal] = useState(false);
  const { label, type, value, list, disabled } = props;
  const valueAll = !value;
  const noneSelected = !valueAll && !value.length;
  const hasValue = !valueAll;
  const showMore = hasValue && value.length > MAX_CHIPS;
  const onBack = () => setShowNextModal(false);
  const onOpenNextModal = () => {
    if (!disabled) {
      setShowNextModal(true);
    }
  };

  return (
    <>
      <Label>
        {props.icon}
        <Divider direction="horizontal" size={4} />
        <Typography size="medium" variant="body">
          {label}
        </Typography>
      </Label>
      <Divider size={4} />
      <Select disabled={!!disabled}>
        <div className="field" onClick={onOpenNextModal}>
          <div className="chips">
            {valueAll && <Chip label={`All ${type}`} />}
            {noneSelected && <Chip label="None Selected" />}
            {hasValue &&
              value.slice(0, MAX_CHIPS).map((v) => <Chip key={v} label={v} />)}
            {showMore && (
              <Chip label={`+${value.length - MAX_CHIPS}`} variant="outlined" />
            )}
          </div>
          <ChevronRightIcon size={12} color="gray" />
        </div>
      </Select>
      {showNextModal && (
        <OverlayPanel onBack={onBack}>
          {type !== 'Tokens' ? (
            <MultiList
              defaultSelectedItems={props.defaultSelectedItems}
              type={type}
              list={list}
              showCategory={type === 'Blockchains' || type === 'Wallets'}
              icon={
                type === 'Wallets' ? (
                  <WalletIcon size={18} />
                ) : (
                  <ChainsIcon size={24} />
                )
              }
              onChange={(items) => {
                props.onChange(items);
                onBack();
              }}
              label={label}
            />
          ) : (
            <TokensPanel
              list={list}
              tokensConfig={props.tokensConfig}
              onChange={(selectedTokens, pinnedTokens) => {
                props.onChange(selectedTokens, pinnedTokens);
                onBack();
              }}
              selectedBlockchains={props.selectedBlockchains}
            />
          )}
        </OverlayPanel>
      )}
    </>
  );
}
