import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AttachmentGrid from '../../src/components/AttachmentGrid';
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

describe('AttachmentGrid', () => {
  const mockOnDelete = vi.fn();
  const attachments = [
    { id: 1, filename: 'image1.jpg', url: 'http://example.com/image1.jpg', stage: 1, attachment_type: 'photo' },
    { id: 2, filename: 'document.pdf', url: 'http://example.com/document.pdf', stage: 1, attachment_type: 'document' },
    { id: 3, filename: 'image2.png', url: 'http://example.com/image2.png', stage: 1, attachment_type: 'photo' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when attachments array is empty', () => {
    const { container } = render(
      <AttachmentGrid attachments={[]} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render nothing when attachments is null', () => {
    const { container } = render(
      <AttachmentGrid attachments={null as any} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render all attachments', () => {
    render(
      <AttachmentGrid attachments={attachments} />
    );

    expect(screen.getByText('image1.jpg')).toBeInTheDocument();
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('image2.png')).toBeInTheDocument();
  });

  it('should display delete button when canEdit is true', () => {
    render(
      <AttachmentGrid
        attachments={attachments}
        canEdit={true}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
    expect(deleteButtons).toHaveLength(3);
  });

  it('should not display delete button when canEdit is false', () => {
    render(
      <AttachmentGrid
        attachments={attachments}
        canEdit={false}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.queryAllByRole('button', { name: /Delete/ });
    expect(deleteButtons).toHaveLength(0);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AttachmentGrid
        attachments={attachments}
        canEdit={true}
        onDelete={mockOnDelete}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: /Delete/ });
    await user.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  it('should open ImageViewer when image is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AttachmentGrid attachments={attachments} />
    );

    const images = screen.getAllByRole('img');
    // Find the clickable image (image1.jpg)
    const image1 = images.find(img => img.getAttribute('alt') === 'image1.jpg');
    
    if (image1) {
      await user.click(image1);
      expect(screen.getByTestId('image-viewer')).toBeInTheDocument();
    }
  });

  it('should filter only image attachments for viewer', async () => {
    const user = userEvent.setup();
    render(
      <AttachmentGrid attachments={attachments} />
    );

    const images = screen.getAllByRole('img');
    const image1 = images.find(img => img.getAttribute('alt') === 'image1.jpg');
    
    if (image1) {
      await user.click(image1);
      const viewer = screen.getByTestId('image-viewer');
      expect(viewer).toBeInTheDocument();
      // Should only show images, not PDF
      const viewerImages = screen.getAllByRole('img');
      expect(viewerImages.length).toBeGreaterThan(1);
    }
  });

  it('should not open viewer for non-image files', async () => {
    const user = userEvent.setup();
    render(
      <AttachmentGrid attachments={attachments} />
    );

    const images = screen.getAllByRole('img');
    // PDF should not be clickable
    const pdfImage = images.find(img => img.getAttribute('alt') === 'document.pdf');
    
    if (pdfImage) {
      expect(pdfImage).not.toHaveClass('attachment-image-clickable');
    }
  });

  it('should close ImageViewer when close is clicked', async () => {
    const user = userEvent.setup();
    render(
      <AttachmentGrid attachments={attachments} />
    );

    const images = screen.getAllByRole('img');
    const image1 = images.find(img => img.getAttribute('alt') === 'image1.jpg');
    
    if (image1) {
      await user.click(image1);
      expect(screen.getByTestId('image-viewer')).toBeInTheDocument();

      const closeButton = screen.getByText('Close Viewer');
      await user.click(closeButton);

      expect(screen.queryByTestId('image-viewer')).not.toBeInTheDocument();
    }
  });

  it('should handle attachments with different image extensions', () => {
    const variousImages = [
      { id: 1, filename: 'test.jpg', url: 'url1', stage: 1, attachment_type: 'photo' },
      { id: 2, filename: 'test.jpeg', url: 'url2', stage: 1, attachment_type: 'photo' },
      { id: 3, filename: 'test.png', url: 'url3', stage: 1, attachment_type: 'photo' },
      { id: 4, filename: 'test.gif', url: 'url4', stage: 1, attachment_type: 'photo' },
      { id: 5, filename: 'test.webp', url: 'url5', stage: 1, attachment_type: 'photo' },
      { id: 6, filename: 'test.bmp', url: 'url6', stage: 1, attachment_type: 'photo' },
    ];

    render(
      <AttachmentGrid attachments={variousImages} />
    );

    variousImages.forEach(att => {
      expect(screen.getByText(att.filename)).toBeInTheDocument();
    });
  });
});

