import { keyframes, styled } from '@arlert-dev/ui';

export const LogoContainer = styled('div', {
  position: 'relative',
});

const SpinAnimation = keyframes({
  '0%': {
    transform: 'rotate(0deg)',
  },
  '100%': {
    transform: 'rotate(360deg)',
  },
});

export const Spinner = styled('div', {
  position: 'absolute',
  border: '2px solid rgba(0, 0, 0, 0.1)',
  borderTop: '2px solid $info500',
  borderRadius: '$lg',
  width: '$45',
  height: '$45',
  animation: `${SpinAnimation} 1s linear infinite`,
  top: 0,
  bottom: 0,
  right: 0,
  left: 0,
});

export const WalletImageContainer = styled('div', {
  '& img': {
    borderRadius: '50%',
  },
});
