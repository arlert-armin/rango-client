import type { Meta, StoryObj } from '@storybook/react';

import { Header } from '@arlert-dev/ui';

const meta: Meta<typeof Header> = {
  component: Header,
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Main: Story = {
  args: {
    title: 'Swap',
    prefix: 'hello',
    suffix: 'world',
  },
};
