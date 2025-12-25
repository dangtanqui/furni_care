import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from '../../src/components/FileUpload';
/// <reference types="@testing-library/jest-dom" />

// Mock ImageViewer
vi.mock('../../src/components/ImageViewer', () => ({
  default: ({ images, currentIndex, onClose }: any) => (
    <div data-testid="image-viewer">
      <button onClick={onClose}>Close Viewer</button>
      <img src={images[currentIndex]} alt={`Viewer ${currentIndex}`} />
    </div>
  ),
}));

describe('FileUpload', () => {
  const mockOnFileChange = vi.fn();
  const mockOnDeletePreview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render file upload input', () => {
      render(
        <FileUpload onFileChange={mockOnFileChange} />
      );

      const inputs = screen.getAllByLabelText('Photos / Attachments');
      const input = inputs.find(el => el.tagName === 'INPUT') as HTMLInputElement;
      expect(input).toBeDefined();
      expect(input).toHaveAttribute('type', 'file');
      expect(input).toHaveAttribute('multiple');
    });

    it('should render with custom label', () => {
      render(
        <FileUpload label="Custom Label" onFileChange={mockOnFileChange} />
      );

      expect(screen.getByText('Custom Label')).toBeInTheDocument();
    });

    it('should render with custom accept types', () => {
      render(
        <FileUpload accept=".pdf,.doc" onFileChange={mockOnFileChange} />
      );

      const inputs = screen.getAllByLabelText('Photos / Attachments');
      const input = inputs.find(el => el.tagName === 'INPUT') as HTMLInputElement;
      expect(input).toBeDefined();
      expect(input).toHaveAttribute('accept', '.pdf,.doc');
    });

    it('should render with custom id and name', () => {
      render(
        <FileUpload id="custom-id" name="custom-name" onFileChange={mockOnFileChange} />
      );

      const inputs = screen.getAllByLabelText('Photos / Attachments');
      const input = inputs.find(el => el.tagName === 'INPUT') as HTMLInputElement;
      expect(input).toBeDefined();
      expect(input).toHaveAttribute('id', 'custom-id');
      expect(input).toHaveAttribute('name', 'custom-name');
    });

    it('should render with custom upload text', () => {
      render(
        <FileUpload uploadText="Custom upload text" onFileChange={mockOnFileChange} />
      );

      expect(screen.getByText('Custom upload text')).toBeInTheDocument();
    });
  });

  describe('File selection', () => {
    it('should call onFileChange when file is selected', async () => {
      const user = userEvent.setup();
      render(
        <FileUpload onFileChange={mockOnFileChange} />
      );

      const inputs = screen.getAllByLabelText('Photos / Attachments');
      const input = inputs.find(el => el.tagName === 'INPUT') as HTMLInputElement;
      expect(input).toBeDefined();
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => (index === 0 ? file : null),
        [Symbol.iterator]: function* () {
          for (let i = 0; i < this.length; i++) {
            const item = this.item(i);
            if (item) yield item;
          }
        },
      } as unknown as FileList;

      // Create a proper change event with files
      const changeEvent = {
        target: {
          files: fileList,
          value: '',
        },
      } as unknown as React.ChangeEvent<HTMLInputElement>;

      // Simulate file input change
      fireEvent.change(input, changeEvent);

      expect(mockOnFileChange).toHaveBeenCalled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <FileUpload disabled={true} onFileChange={mockOnFileChange} />
      );

      const inputs = screen.getAllByLabelText('Photos / Attachments');
      const input = inputs.find(el => el.tagName === 'INPUT') as HTMLInputElement;
      expect(input).toBeDefined();
      expect(input).toBeDisabled();
    });
  });

  describe('Preview display', () => {
    it('should not show preview when showPreview is false', () => {
      render(
        <FileUpload
          showPreview={false}
          previews={['preview1.jpg', 'preview2.jpg']}
          onFileChange={mockOnFileChange}
        />
      );

      expect(screen.queryByAltText(/Upload/)).not.toBeInTheDocument();
    });

    it('should show previews when showPreview is true', () => {
      const previews = ['preview1.jpg', 'preview2.jpg'];
      render(
        <FileUpload
          showPreview={true}
          previews={previews}
          onFileChange={mockOnFileChange}
        />
      );

      expect(screen.getByAltText('Upload 1')).toBeInTheDocument();
      expect(screen.getByAltText('Upload 2')).toBeInTheDocument();
    });

    it('should not show preview when previews array is empty', () => {
      render(
        <FileUpload
          showPreview={true}
          previews={[]}
          onFileChange={mockOnFileChange}
        />
      );

      expect(screen.queryByAltText(/Upload/)).not.toBeInTheDocument();
    });

    it('should call onDeletePreview when delete button is clicked', async () => {
      const user = userEvent.setup();
      const previews = ['preview1.jpg'];
      render(
        <FileUpload
          showPreview={true}
          previews={previews}
          onFileChange={mockOnFileChange}
          onDeletePreview={mockOnDeletePreview}
        />
      );

      const deleteButton = screen.getByRole('button', { name: 'Delete image 1' });
      await user.click(deleteButton);

      expect(mockOnDeletePreview).toHaveBeenCalledWith(0);
    });

    it('should open ImageViewer when preview is clicked', async () => {
      const user = userEvent.setup();
      const previews = ['preview1.jpg', 'preview2.jpg'];
      render(
        <FileUpload
          showPreview={true}
          previews={previews}
          onFileChange={mockOnFileChange}
        />
      );

      const previewImage = screen.getByAltText('Upload 1');
      await user.click(previewImage);

      expect(screen.getByTestId('image-viewer')).toBeInTheDocument();
    });

    it('should close ImageViewer when close is clicked', async () => {
      const user = userEvent.setup();
      const previews = ['preview1.jpg'];
      render(
        <FileUpload
          showPreview={true}
          previews={previews}
          onFileChange={mockOnFileChange}
        />
      );

      const previewImage = screen.getByAltText('Upload 1');
      await user.click(previewImage);

      const closeButton = screen.getByText('Close Viewer');
      await user.click(closeButton);

      expect(screen.queryByTestId('image-viewer')).not.toBeInTheDocument();
    });
  });
});

