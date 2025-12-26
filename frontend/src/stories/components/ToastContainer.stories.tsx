import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import ToastContainer from '../../components/ToastContainer';

const meta: Meta<typeof ToastContainer> = {
  title: 'Components/ToastContainer',
  component: ToastContainer,
  tags: ['autodocs'],
  argTypes: {
    toasts: {
      control: 'object',
    },
    onClose: {
      action: 'toast closed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToastContainer>;

// Interactive wrapper component
const ToastContainerWrapper = (args: any) => {
  const [toasts, setToasts] = useState(args.toasts || []);
  return (
    <ToastContainer
      {...args}
      toasts={toasts}
      onClose={(id) => {
        setToasts(toasts.filter((t: any) => t.id !== id));
        args.onClose?.(id);
      }}
    />
  );
};

export const SingleToast: Story = {
  render: (args) => <ToastContainerWrapper {...args} />,
  args: {
    toasts: [
      {
        id: '1',
        type: 'success',
        message: 'Operation completed successfully!',
      },
    ],
  },
};

export const MultipleToasts: Story = {
  render: (args) => <ToastContainerWrapper {...args} />,
  args: {
    toasts: [
      {
        id: '1',
        type: 'success',
        message: 'Case created successfully!',
      },
      {
        id: '2',
        type: 'info',
        message: 'New updates are available.',
      },
      {
        id: '3',
        type: 'warning',
        message: 'Please review your changes.',
      },
    ],
  },
};

export const AllTypes: Story = {
  render: (args) => <ToastContainerWrapper {...args} />,
  args: {
    toasts: [
      {
        id: '1',
        type: 'success',
        message: 'Success message',
      },
      {
        id: '2',
        type: 'error',
        message: 'Error message',
      },
      {
        id: '3',
        type: 'warning',
        message: 'Warning message',
      },
      {
        id: '4',
        type: 'info',
        message: 'Info message',
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    toasts: [],
  },
};

