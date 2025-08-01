import type { WidgetConfig } from '@arlert-dev/widget-embedded';

import { Widget } from '@arlert-dev/widget-embedded';
import React, { useRef } from 'react';
import { Route, Routes, useSearchParams } from 'react-router-dom';

import {
  TON_CONNECT_MANIFEST_URL,
  TREZOR_MANIFEST,
  WC_PROJECT_ID,
} from './constants';

export function App() {
  const [searchParams] = useSearchParams();
  const configRef = useRef<WidgetConfig>();
  const configParam = searchParams.get('config');

  let config: WidgetConfig | undefined = undefined;

  if (!configRef.current) {
    if (!!configParam) {
      try {
        config = JSON.parse(configParam, (_, value) => {
          if (typeof value === 'string' && value[0] === '$') {
            return value.replace('$', '#');
          }
          return value;
        });
      } catch (error) {
        console.error('Widget config param is invalid!', error);
      }
    } else {
      /*
       *TODO:
       *The assumption here is this object won't be created on iframe so we are on dev mode.
       *We should consider a more proper way.
       */

      config = {
        apiKey: '',
        walletConnectProjectId: WC_PROJECT_ID,
        trezorManifest: TREZOR_MANIFEST,
        tonConnect: { manifestUrl: TON_CONNECT_MANIFEST_URL },
      };
    }
    if (!!config) {
      configRef.current = config;
    }
  }

  return (
    <Routes>
      <Route path="/*" element={<Widget config={configRef.current} />} />
    </Routes>
  );
}
