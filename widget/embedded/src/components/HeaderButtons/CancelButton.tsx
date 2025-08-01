import type { PropTypes } from './HeaderButtons.types';

import { i18n } from '@lingui/core';
import { Button, Typography } from '@arlert-dev/ui';
import React from 'react';

import { SuffixContainer } from './HeaderButtons.styles';

function CancelButton(props: PropTypes) {
  return (
    <SuffixContainer>
      <Button
        id="widget-header-cancel-btn"
        variant="ghost"
        onClick={props.onClick}
        size="xsmall">
        <Typography variant="label" size="medium" color="error500">
          {i18n.t('Cancel')}
        </Typography>
      </Button>
    </SuffixContainer>
  );
}

export { CancelButton };
