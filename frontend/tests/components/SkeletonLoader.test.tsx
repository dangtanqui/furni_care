/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SkeletonLoader from '../../src/components/SkeletonLoader';

describe('SkeletonLoader', () => {
  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<SkeletonLoader />);
      const skeleton = screen.getByLabelText('Loading...');
      expect(skeleton).toBeInTheDocument();
      expect(skeleton).toHaveClass('skeleton', 'skeleton-rectangular');
    });

    it('should render with custom width and height', () => {
      render(<SkeletonLoader width="200px" height="50px" />);
      const skeleton = screen.getByLabelText('Loading...');
      expect(skeleton).toHaveStyle({ width: '200px', height: '50px' });
    });

    it('should render with custom className', () => {
      render(<SkeletonLoader className="custom-skeleton" />);
      const skeleton = screen.getByLabelText('Loading...');
      expect(skeleton).toHaveClass('custom-skeleton');
    });
  });

  describe('Variants', () => {
    it('should render rectangular variant by default', () => {
      render(<SkeletonLoader />);
      const skeleton = screen.getByLabelText('Loading...');
      expect(skeleton).toHaveClass('skeleton-rectangular');
    });

    it('should render circular variant', () => {
      render(<SkeletonLoader variant="circular" />);
      const skeleton = screen.getByLabelText('Loading...');
      expect(skeleton).toHaveClass('skeleton-circular');
    });

    it('should render text variant', () => {
      render(<SkeletonLoader variant="text" />);
      const skeleton = screen.getByLabelText('Loading...');
      expect(skeleton).toHaveClass('skeleton-text');
    });
  });

  describe('Text variant with multiple lines', () => {
    it('should render single line when lines is 1', () => {
      render(<SkeletonLoader variant="text" lines={1} />);
      const skeleton = screen.getByLabelText('Loading...');
      expect(skeleton).toHaveClass('skeleton-text');
    });

    it('should render multiple lines when lines > 1', () => {
      const { container } = render(<SkeletonLoader variant="text" lines={3} />);
      const skeletons = container.querySelectorAll('.skeleton-text');
      expect(skeletons).toHaveLength(3);
    });

    it('should render last line with 80% width', () => {
      const { container } = render(<SkeletonLoader variant="text" lines={3} height="1rem" />);
      const skeletons = container.querySelectorAll('.skeleton-text');
      const lastLine = skeletons[skeletons.length - 1] as HTMLElement;
      expect(lastLine).toHaveStyle({ width: '80%' });
    });

    it('should render other lines with 100% width', () => {
      const { container } = render(<SkeletonLoader variant="text" lines={3} height="1rem" />);
      const skeletons = container.querySelectorAll('.skeleton-text');
      const firstLine = skeletons[0] as HTMLElement;
      expect(firstLine).toHaveStyle({ width: '100%' });
    });
  });

  describe('Accessibility', () => {
    it('should have aria-label', () => {
      render(<SkeletonLoader />);
      expect(screen.getByLabelText('Loading...')).toBeInTheDocument();
    });

    it('should have role="status"', () => {
      render(<SkeletonLoader />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});

