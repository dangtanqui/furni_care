import type { Meta, StoryObj } from '@storybook/react';
import Toast from '../../components/Toast';

const meta: Meta<typeof Toast> = {
  title: 'Components/Toast',
  component: Toast,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['success', 'error', 'warning', 'info'],
    },
    message: {
      control: 'text',
    },
    duration: {
      control: 'number',
    },
    onClose: {
      action: 'closed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Success: Story = {
  args: {
    id: '1',
    type: 'success',
    message: 'Operation completed successfully!',
    duration: 5000,
    onClose: () => {},
  },
};

export const Error: Story = {
  args: {
    id: '2',
    type: 'error',
    message: 'An error occurred. Please try again.',
    duration: 5000,
    onClose: () => {},
  },
};

export const Warning: Story = {
  args: {
    id: '3',
    type: 'warning',
    message: 'Please review your changes before submitting.',
    duration: 5000,
    onClose: () => {},
  },
};

export const Info: Story = {
  args: {
    id: '4',
    type: 'info',
    message: 'New updates are available.',
    duration: 5000,
    onClose: () => {},
  },
};

export const LongMessage: Story = {
  args: {
    id: '5',
    type: 'success',
    message: 'This is a very long message that should wrap properly and display nicely in the toast notification component.',
    duration: 5000,
    onClose: () => {},
  },
};

export const Persistent: Story = {
  args: {
    id: '6',
    type: 'info',
    message: 'This toast will not auto-close (duration: 0)',
    duration: 0,
    onClose: () => {},
  },
};

