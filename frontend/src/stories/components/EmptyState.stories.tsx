import type { Meta, StoryObj } from '@storybook/react';
import { Inbox } from 'lucide-react';
import EmptyState from '../../components/EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'Components/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: {
    icon: {
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    icon: <Inbox className="w-12 h-12 text-gray-400" />,
    title: 'No items',
    description: 'There are no items to display.',
  },
};

export const WithCustomIcon: Story = {
  args: {
    icon: <Inbox className="w-16 h-16 text-blue-500" />,
    title: 'No cases found',
    description: 'Create a new case to get started.',
  },
};

