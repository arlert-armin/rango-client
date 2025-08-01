import { styled } from '@arlert-dev/ui';

export const SliderContainer = styled('div', {
  display: 'flex',
  padding: '0 0 0 $10',
  flexDirection: 'column',
});
export const Content = styled('div', {
  display: 'flex',
  justifyContent: 'space-between',
});
export const ValueSection = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  border: '1px solid $neutral300',
  borderRadius: '$xs',
  padding: '$4',
  width: '$32',
});
export const RangeWrapper = styled('div', {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexGrow: '0.8',

  '& .range': {
    width: '100%',
    cursor: 'pointer',
  },
  '& .range-custom': {
    height: '3px',
    backgroundColor: '$neutral300',
    '-webkit-appearance': 'none',
    outline: 'none',
    appearance: 'none',
    borderRadius: '3px',

    '&::-webkit-slider-thumb': {
      '-webkit-appearance': 'none',
      appearance: 'none',
      width: '10px',
      height: '8px',
      borderRadius: '2.5px',
      backgroundColor: '$secondary500',
      transition: '.2s ease-in-out',
    },

    '&::-moz-range-thumb': {
      width: '10px',
      height: '8px',
      borderRadius: '2.5px',
      backgroundColor: '$secondary500',
      transition: '.2s ease-in-out',
    },
  },
});
