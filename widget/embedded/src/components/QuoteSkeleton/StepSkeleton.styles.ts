import { styled } from '@arlert-dev/ui';

export const StepContent = styled('div', {
  display: 'flex',
  alignItems: 'start',
});

export const StepTokens = styled('div', {
  flexGrow: 1,
  paddingTop: '$5',
  paddingBottom: '$10',
  display: 'flex',
  alignItems: 'center',
  variants: {
    extraSpace: {
      true: {
        paddingBottom: '$40',
      },
    },
  },
});

export const StepTokenInfo = styled('div', {
  display: 'flex',
  alignItems: 'center',
  flexGrow: 1,
});

export const StepIconContainer = styled('div', {
  margin: '$0 $2',
  padding: '$4',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
});

export const StepTitle = styled('div', {
  display: 'flex',
  alignItems: 'center',
});
