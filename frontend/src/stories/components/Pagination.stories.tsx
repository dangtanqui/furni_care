import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Pagination from '../../components/Pagination';

const meta: Meta<typeof Pagination> = {
  title: 'Components/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  argTypes: {
    pagination: {
      control: 'object',
    },
    onPageChange: {
      action: 'page changed',
    },
    itemName: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Pagination>;

// Interactive wrapper component
const PaginationWrapper = (args: any) => {
  const [page, setPage] = useState(args.pagination.page || 1);
  return (
    <Pagination
      {...args}
      pagination={{ ...args.pagination, page }}
      onPageChange={(newPage) => {
        setPage(newPage);
        args.onPageChange?.(newPage);
      }}
    />
  );
};

export const Default: Story = {
  render: (args) => <PaginationWrapper {...args} />,
  args: {
    pagination: {
      page: 1,
      per_page: 10,
      total: 100,
      total_pages: 10,
    },
    itemName: 'items',
  },
};

export const MiddlePage: Story = {
  render: (args) => <PaginationWrapper {...args} />,
  args: {
    pagination: {
      page: 5,
      per_page: 10,
      total: 100,
      total_pages: 10,
    },
    itemName: 'items',
  },
};

export const LastPage: Story = {
  render: (args) => <PaginationWrapper {...args} />,
  args: {
    pagination: {
      page: 10,
      per_page: 10,
      total: 100,
      total_pages: 10,
    },
    itemName: 'items',
  },
};

export const FewPages: Story = {
  render: (args) => <PaginationWrapper {...args} />,
  args: {
    pagination: {
      page: 2,
      per_page: 10,
      total: 30,
      total_pages: 3,
    },
    itemName: 'cases',
  },
};

export const ManyPages: Story = {
  render: (args) => <PaginationWrapper {...args} />,
  args: {
    pagination: {
      page: 50,
      per_page: 10,
      total: 1000,
      total_pages: 100,
    },
    itemName: 'records',
  },
};

export const SinglePage: Story = {
  render: (args) => <PaginationWrapper {...args} />,
  args: {
    pagination: {
      page: 1,
      per_page: 10,
      total: 5,
      total_pages: 1,
    },
    itemName: 'items',
  },
};

