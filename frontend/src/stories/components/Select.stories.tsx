import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import Select from '../../components/Select';

const meta: Meta<typeof Select> = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
    },
    onChange: {
      action: 'changed',
    },
    options: {
      control: 'object',
    },
    placeholder: {
      control: 'text',
    },
    disabled: {
      control: 'boolean',
    },
    error: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

const options = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'option4', label: 'Option 4' },
  { value: 'option5', label: 'Option 5' },
];

// Interactive wrapper component
const SelectWrapper = (args: any) => {
  const [value, setValue] = useState(args.value || '');
  return (
    <Select
      {...args}
      value={value}
      onChange={(newValue) => {
        setValue(newValue);
        args.onChange?.(newValue);
      }}
    />
  );
};

export const Default: Story = {
  render: (args) => <SelectWrapper {...args} />,
  args: {
    options,
    placeholder: 'Select an option...',
  },
};

export const WithValue: Story = {
  render: (args) => <SelectWrapper {...args} />,
  args: {
    value: 'option2',
    options,
    placeholder: 'Select an option...',
  },
};

export const Disabled: Story = {
  render: (args) => <SelectWrapper {...args} />,
  args: {
    options,
    placeholder: 'Select an option...',
    disabled: true,
  },
};

export const WithError: Story = {
  render: (args) => <SelectWrapper {...args} />,
  args: {
    options,
    placeholder: 'Select an option...',
    error: true,
  },
};

export const ManyOptions: Story = {
  render: (args) => <SelectWrapper {...args} />,
  args: {
    options: Array.from({ length: 20 }, (_, i) => ({
      value: `option${i + 1}`,
      label: `Option ${i + 1}`,
    })),
    placeholder: 'Select an option...',
  },
};

export const EmptyOptions: Story = {
  render: (args) => <SelectWrapper {...args} />,
  args: {
    options: [],
    placeholder: 'No options available',
  },
};

