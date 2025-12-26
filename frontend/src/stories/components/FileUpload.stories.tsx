import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import FileUpload from '../../components/FileUpload';

const meta: Meta<typeof FileUpload> = {
  title: 'Components/FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
    },
    accept: {
      control: 'text',
    },
    showPreview: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    uploadText: {
      control: 'text',
    },
    onFileChange: {
      action: 'files changed',
    },
    onDeletePreview: {
      action: 'preview deleted',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FileUpload>;

// Mock images for preview
const mockImages = [
  'https://via.placeholder.com/300x200?text=Image+1',
  'https://via.placeholder.com/300x200?text=Image+2',
  'https://via.placeholder.com/300x200?text=Image+3',
];

// Interactive wrapper component
const FileUploadWrapper = (args: any) => {
  const [previews, setPreviews] = useState(args.previews || []);
  
  return (
    <FileUpload
      {...args}
      previews={previews}
      onFileChange={(e) => {
        args.onFileChange?.(e);
        // Simulate adding files to preview
        if (e.target.files && e.target.files.length > 0) {
          const newFiles = Array.from(e.target.files).map(file => URL.createObjectURL(file));
          setPreviews([...previews, ...newFiles]);
        }
      }}
      onDeletePreview={(index) => {
        setPreviews(previews.filter((_: any, i: number) => i !== index));
        args.onDeletePreview?.(index);
      }}
    />
  );
};

export const Default: Story = {
  render: (args) => <FileUploadWrapper {...args} />,
  args: {
    label: 'Photos / Attachments',
    accept: 'image/*,.pdf,.doc,.docx',
    showPreview: false,
    uploadText: 'Click to upload photos/documents',
  },
};

export const WithPreview: Story = {
  render: (args) => <FileUploadWrapper {...args} />,
  args: {
    label: 'Photos / Attachments',
    accept: 'image/*,.pdf,.doc,.docx',
    showPreview: true,
    previews: mockImages,
    uploadText: 'Click to upload photos/documents',
  },
};

export const ImagesOnly: Story = {
  render: (args) => <FileUploadWrapper {...args} />,
  args: {
    label: 'Photos',
    accept: 'image/*',
    showPreview: false,
    uploadText: 'Click to upload images',
  },
};

export const DocumentsOnly: Story = {
  render: (args) => <FileUploadWrapper {...args} />,
  args: {
    label: 'Documents',
    accept: '.pdf,.doc,.docx',
    showPreview: false,
    uploadText: 'Click to upload documents',
  },
};

export const Disabled: Story = {
  render: (args) => <FileUploadWrapper {...args} />,
  args: {
    label: 'Photos / Attachments',
    accept: 'image/*,.pdf,.doc,.docx',
    showPreview: false,
    disabled: true,
    uploadText: 'Click to upload photos/documents',
  },
};

export const CustomLabel: Story = {
  render: (args) => <FileUploadWrapper {...args} />,
  args: {
    label: 'Upload Case Attachments',
    accept: 'image/*,.pdf,.doc,.docx',
    showPreview: false,
    uploadText: 'Drag and drop files here or click to browse',
  },
};

export const WithManyPreviews: Story = {
  render: (args) => <FileUploadWrapper {...args} />,
  args: {
    label: 'Photos / Attachments',
    accept: 'image/*,.pdf,.doc,.docx',
    showPreview: true,
    previews: [
      ...mockImages,
      'https://via.placeholder.com/300x200?text=Image+4',
      'https://via.placeholder.com/300x200?text=Image+5',
      'https://via.placeholder.com/300x200?text=Image+6',
    ],
    uploadText: 'Click to upload photos/documents',
  },
};

