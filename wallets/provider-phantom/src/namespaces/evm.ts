import type { EvmActions } from '@rango-dev/wallets-core/namespaces/evm';

import { NamespaceBuilder } from '@rango-dev/wallets-core';
import { utils } from '@rango-dev/wallets-core/namespaces/common';
import {
  actions,
  after,
  and,
  before,
} from '@rango-dev/wallets-core/namespaces/evm';

import { WALLET_ID } from '../constants.js';
import { evmPhantom } from '../legacy/helpers.js';

const [changeAccountSubscriber, changeAccountCleanup] =
  actions.changeAccountSubscriber(evmPhantom);

const evm = new NamespaceBuilder<EvmActions>('evm', WALLET_ID)
  .action('init', () => {
    console.log('[phantom]init called from evm cb');
  })
  .action([...actions.recommended, actions.connect(evmPhantom)])
  .andUse(and.recommended)
  .orUse([['connect', changeAccountCleanup]])
  .build();

utils.apply(
  'before',
  [...before.recommended, ['connect', changeAccountSubscriber]],
  evm
);
utils.apply(
  'after',
  [...after.recommended, ['disconnect', changeAccountCleanup]],
  evm
);

export { evm };
