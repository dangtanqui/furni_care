/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ImageViewer from '../../src/components/ImageViewer';

describe('ImageViewer', () => {
  const mockOnClose = vi.fn();
  const images = ['image1.jpg', 'image2.jpg', 'image3.jpg'];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('should render nothing when images array is empty', () => {
    const { container } = render(
      <ImageViewer images={[]} currentIndex={0} onClose={mockOnClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render image at current index', () => {
    render(
      <ImageViewer images={images} currentIndex={1} onClose={mockOnClose} />
    );

    const img = screen.getByAltText('Image 2 of 3');
    expect(img).toHaveAttribute('src', 'image2.jpg');
  });

  it('should display image counter for multiple images', () => {
    render(
      <ImageViewer images={images} currentIndex={1} onClose={mockOnClose} />
    );

    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('should not display counter for single image', () => {
    render(
      <ImageViewer images={['image1.jpg']} currentIndex={0} onClose={mockOnClose} />
    );

    expect(screen.queryByText(/\/ 1/)).not.toBeInTheDocument();
  });

  it('should navigate to previous image', async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer images={images} currentIndex={1} onClose={mockOnClose} />
    );

    const prevButton = screen.getByRole('button', { name: 'Previous image' });
    await user.click(prevButton);

    const img = screen.getByAltText(/Image/);
    expect(img).toHaveAttribute('src', 'image1.jpg');
  });

  it('should wrap to last image when going previous from first', async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer images={images} currentIndex={0} onClose={mockOnClose} />
    );

    const prevButton = screen.getByRole('button', { name: 'Previous image' });
    await user.click(prevButton);

    const img = screen.getByAltText(/Image/);
    expect(img).toHaveAttribute('src', 'image3.jpg');
  });

  it('should navigate to next image', async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer images={images} currentIndex={1} onClose={mockOnClose} />
    );

    const nextButton = screen.getByRole('button', { name: 'Next image' });
    await user.click(nextButton);

    const img = screen.getByAltText(/Image/);
    expect(img).toHaveAttribute('src', 'image3.jpg');
  });

  it('should wrap to first image when going next from last', async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer images={images} currentIndex={2} onClose={mockOnClose} />
    );

    const nextButton = screen.getByRole('button', { name: 'Next image' });
    await user.click(nextButton);

    const img = screen.getByAltText(/Image/);
    expect(img).toHaveAttribute('src', 'image1.jpg');
  });

  it('should close when close button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer images={images} currentIndex={0} onClose={mockOnClose} />
    );

    const closeButton = screen.getByRole('button', { name: 'Close' });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close when overlay is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ImageViewer images={images} currentIndex={0} onClose={mockOnClose} />
    );

    const overlay = container.querySelector('.image-viewer-overlay');
    if (overlay) {
      await user.click(overlay);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    }
  });

  it('should not close when image container is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ImageViewer images={images} currentIndex={0} onClose={mockOnClose} />
    );

    const containerElement = container.querySelector('.image-viewer-container');
    if (containerElement) {
      await user.click(containerElement);
      expect(mockOnClose).not.toHaveBeenCalled();
    }
  });

  it('should handle keyboard navigation - ArrowLeft', async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer images={images} currentIndex={1} onClose={mockOnClose} />
    );

    await user.keyboard('{ArrowLeft}');

    const img = screen.getByAltText(/Image/);
    expect(img).toHaveAttribute('src', 'image1.jpg');
  });

  it('should handle keyboard navigation - ArrowRight', async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer images={images} currentIndex={1} onClose={mockOnClose} />
    );

    await user.keyboard('{ArrowRight}');

    const img = screen.getByAltText(/Image/);
    expect(img).toHaveAttribute('src', 'image3.jpg');
  });

  it('should close on Escape key', async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer images={images} currentIndex={0} onClose={mockOnClose} />
    );

    await user.keyboard('{Escape}');

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should zoom in', async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer images={images} currentIndex={0} onClose={mockOnClose} />
    );

    const zoomInButton = screen.getByRole('button', { name: 'Zoom in' });
    await user.click(zoomInButton);

    const img = screen.getByAltText(/Image/);
    expect(img).toHaveStyle({ transform: 'scale(1.25)' });
  });

  it('should zoom out', async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer images={images} currentIndex={0} onClose={mockOnClose} />
    );

    const zoomOutButton = screen.getByRole('button', { name: 'Zoom out' });
    await user.click(zoomOutButton);

    const img = screen.getByAltText(/Image/);
    expect(img).toHaveStyle({ transform: 'scale(0.75)' });
  });

  it('should reset zoom', async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer images={images} currentIndex={0} onClose={mockOnClose} />
    );

    const zoomInButton = screen.getByRole('button', { name: 'Zoom in' });
    await user.click(zoomInButton);

    const resetButton = screen.getByRole('button', { name: 'Reset zoom' });
    await user.click(resetButton);

    const img = screen.getByAltText(/Image/);
    expect(img).toHaveStyle({ transform: 'scale(1)' });
  });

  it('should disable zoom out at minimum zoom', async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer images={images} currentIndex={0} onClose={mockOnClose} />
    );

    const zoomOutButton = screen.getByRole('button', { name: 'Zoom out' });
    
    // Zoom out multiple times to reach minimum
    for (let i = 0; i < 3; i++) {
      await user.click(zoomOutButton);
    }

    expect(zoomOutButton).toBeDisabled();
  });

  it('should disable zoom in at maximum zoom', async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer images={images} currentIndex={0} onClose={mockOnClose} />
    );

    const zoomInButton = screen.getByRole('button', { name: 'Zoom in' });
    
    // Zoom in multiple times to reach maximum
    for (let i = 0; i < 9; i++) {
      await user.click(zoomInButton);
    }

    expect(zoomInButton).toBeDisabled();
  });

  it('should update current index when initialIndex changes', () => {
    const { rerender } = render(
      <ImageViewer images={images} currentIndex={0} onClose={mockOnClose} />
    );

    let img = screen.getByAltText('Image 1 of 3');
    expect(img).toHaveAttribute('src', 'image1.jpg');

    rerender(
      <ImageViewer images={images} currentIndex={2} onClose={mockOnClose} />
    );

    img = screen.getByAltText('Image 3 of 3');
    expect(img).toHaveAttribute('src', 'image3.jpg');
  });

  it('should reset zoom when navigating between images', async () => {
    const user = userEvent.setup();
    render(
      <ImageViewer images={images} currentIndex={0} onClose={mockOnClose} />
    );

    // Zoom in first
    const zoomInButton = screen.getByRole('button', { name: 'Zoom in' });
    await user.click(zoomInButton);

    // Navigate to next image
    const nextButton = screen.getByRole('button', { name: 'Next image' });
    await user.click(nextButton);

    // Zoom should be reset
    const img = screen.getByAltText(/Image/);
    expect(img).toHaveStyle({ transform: 'scale(1)' });
  });

  it('should prevent body scroll when open', () => {
    render(
      <ImageViewer images={images} currentIndex={0} onClose={mockOnClose} />
    );

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body scroll when closed', () => {
    const { unmount } = render(
      <ImageViewer images={images} currentIndex={0} onClose={mockOnClose} />
    );

    unmount();

    expect(document.body.style.overflow).toBe('');
  });
});

