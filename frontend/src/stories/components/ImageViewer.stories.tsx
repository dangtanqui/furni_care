import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import ImageViewer from '../../components/ImageViewer';

const meta: Meta<typeof ImageViewer> = {
  title: 'Components/ImageViewer',
  component: ImageViewer,
  tags: ['autodocs'],
  argTypes: {
    images: {
      control: 'object',
    },
    currentIndex: {
      control: 'number',
      min: 0,
    },
    onClose: {
      action: 'closed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ImageViewer>;

// Mock images
const mockImages = [
  'https://via.placeholder.com/800x600/4F46E5/FFFFFF?text=Image+1',
  'https://via.placeholder.com/800x600/10B981/FFFFFF?text=Image+2',
  'https://via.placeholder.com/800x600/F59E0B/FFFFFF?text=Image+3',
  'https://via.placeholder.com/800x600/EF4444/FFFFFF?text=Image+4',
  'https://via.placeholder.com/800x600/8B5CF6/FFFFFF?text=Image+5',
];

// Interactive wrapper component
const ImageViewerWrapper = (args: any) => {
  const [isOpen, setIsOpen] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(args.currentIndex || 0);

  if (!isOpen) {
    return (
      <div style={{ padding: '20px' }}>
        <button
          onClick={() => {
            setIsOpen(true);
            setCurrentIndex(args.currentIndex || 0);
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4F46E5',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Open Image Viewer
        </button>
      </div>
    );
  }

  return (
    <ImageViewer
      {...args}
      currentIndex={currentIndex}
      onClose={() => {
        setIsOpen(false);
        args.onClose?.();
      }}
    />
  );
};

export const SingleImage: Story = {
  render: (args) => <ImageViewerWrapper {...args} />,
  args: {
    images: [mockImages[0]],
    currentIndex: 0,
  },
};

export const MultipleImages: Story = {
  render: (args) => <ImageViewerWrapper {...args} />,
  args: {
    images: mockImages,
    currentIndex: 0,
  },
};

export const StartAtMiddle: Story = {
  render: (args) => <ImageViewerWrapper {...args} />,
  args: {
    images: mockImages,
    currentIndex: 2,
  },
};

export const StartAtLast: Story = {
  render: (args) => <ImageViewerWrapper {...args} />,
  args: {
    images: mockImages,
    currentIndex: mockImages.length - 1,
  },
};

export const TwoImages: Story = {
  render: (args) => <ImageViewerWrapper {...args} />,
  args: {
    images: mockImages.slice(0, 2),
    currentIndex: 0,
  },
};

