import { css, darkTheme, styled, Typography } from '@arlert-dev/ui';

import { PageContainer } from '../Layout';

export const Container = styled(PageContainer, {
  overflowY: 'auto',

  '& ._icon-button': {
    '&:hover': {
      '& svg': {
        color: '$secondary550',
        [`.${darkTheme} &`]: {
          color: '$secondary500',
        },
      },
    },
  },
});

export const SkeletonContainer = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  flexGrow: 1,
  overflow: 'hidden',
});

export const RequestIdContainer = styled('div', {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  backgroundColor: '$background',
});

export const StepsList = styled('div', {
  padding: '$0 $20 $20 $20',
});

export const Alerts = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$10',
});

export const PlaceholderContainer = styled('div', {
  height: '450px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const LoaderContainer = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  paddingTop: '33%',
  flex: 1,
});

export const rowStyles = css({
  display: 'flex',
  width: '100%',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '$10 $20',
  borderBottom: '1px solid',
  $$color: '$colors$neutral300',
  [`.${darkTheme} &`]: {
    $$color: '$colors$neutral400',
  },
  borderColor: '$$color',
  color: '$neutral500',
});

export const datePlaceholderStyles = css({
  padding: '$5 0',
});

export const requestIdStyles = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '$24',
});

export const outputStyles = css({
  display: 'flex',
  width: '100%',
  padding: '$15 $20 $20',
  flexDirection: 'column',
  alignItems: 'start',
});

export const titleStepsStyles = css({
  width: '100%',
  padding: '0 $20 $10',
});

export const StyledLink = styled('a', {
  fontSize: '$16',
  fontWeight: '$400',
  color: '$neutral700',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const ErrorMessages = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$5',
});
export const MessageText = styled(Typography, {
  wordBreak: 'break-word',
});
