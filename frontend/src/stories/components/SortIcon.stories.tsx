import type { Meta, StoryObj } from '@storybook/react';
import SortIcon from '../../components/SortIcon';

const meta: Meta<typeof SortIcon> = {
  title: 'Components/SortIcon',
  component: SortIcon,
  tags: ['autodocs'],
  argTypes: {
    column: {
      control: 'text',
    },
    currentColumn: {
      control: 'object',
    },
    direction: {
      control: 'select',
      options: ['asc', 'desc'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof SortIcon>;

export const Default: Story = {
  args: {
    column: 'name',
    currentColumn: 'status',
    direction: 'asc',
  },
};

export const ActiveAscending: Story = {
  args: {
    column: 'name',
    currentColumn: 'name',
    direction: 'asc',
  },
};

export const ActiveDescending: Story = {
  args: {
    column: 'name',
    currentColumn: 'name',
    direction: 'desc',
  },
};

export const WithArrayFormat: Story = {
  args: {
    column: 'name',
    currentColumn: [
      { column: 'name', direction: 'asc' },
      { column: 'status', direction: 'desc' },
    ],
    direction: 'asc',
  },
};

export const WithArrayFormatDescending: Story = {
  args: {
    column: 'status',
    currentColumn: [
      { column: 'name', direction: 'asc' },
      { column: 'status', direction: 'desc' },
    ],
    direction: 'desc',
  },
};

export const NotInArray: Story = {
  args: {
    column: 'date',
    currentColumn: [
      { column: 'name', direction: 'asc' },
      { column: 'status', direction: 'desc' },
    ],
    direction: 'asc',
  },
};

