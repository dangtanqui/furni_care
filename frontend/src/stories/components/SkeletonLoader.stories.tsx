import type { Meta, StoryObj } from '@storybook/react';
import SkeletonLoader from '../../components/SkeletonLoader';

const meta: Meta<typeof SkeletonLoader> = {
  title: 'Components/SkeletonLoader',
  component: SkeletonLoader,
  tags: ['autodocs'],
  argTypes: {
    width: {
      control: 'text',
    },
    height: {
      control: 'text',
    },
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular'],
    },
    lines: {
      control: 'number',
      min: 1,
      max: 10,
    },
  },
};

export default meta;
type Story = StoryObj<typeof SkeletonLoader>;

export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    width: '200px',
    height: '100px',
  },
};

export const Circular: Story = {
  args: {
    variant: 'circular',
    width: '60px',
    height: '60px',
  },
};

export const Text: Story = {
  args: {
    variant: 'text',
    width: '300px',
    height: '1rem',
  },
};

export const TextMultipleLines: Story = {
  args: {
    variant: 'text',
    lines: 3,
    height: '1rem',
  },
};

export const TextFiveLines: Story = {
  args: {
    variant: 'text',
    lines: 5,
    height: '1rem',
  },
};

export const FullWidth: Story = {
  args: {
    variant: 'rectangular',
    width: '100%',
    height: '200px',
  },
};

export const Small: Story = {
  args: {
    variant: 'rectangular',
    width: '100px',
    height: '50px',
  },
};

export const Large: Story = {
  args: {
    variant: 'rectangular',
    width: '400px',
    height: '300px',
  },
};

