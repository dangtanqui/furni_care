/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Toast from '../../src/components/Toast';

describe('Toast', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Rendering', () => {
    it('should render toast with message', () => {
      render(
        <Toast
          id="1"
          type="success"
          message="Test message"
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should render success toast with correct class', () => {
      const { container } = render(
        <Toast
          id="1"
          type="success"
          message="Success message"
          onClose={mockOnClose}
        />
      );

      const toast = container.querySelector('.toast');
      expect(toast).toHaveClass('toast-success');
    });

    it('should render error toast with correct class', () => {
      const { container } = render(
        <Toast
          id="1"
          type="error"
          message="Error message"
          onClose={mockOnClose}
        />
      );

      const toast = container.querySelector('.toast');
      expect(toast).toHaveClass('toast-error');
    });

    it('should render warning toast with correct class', () => {
      const { container } = render(
        <Toast
          id="1"
          type="warning"
          message="Warning message"
          onClose={mockOnClose}
        />
      );

      const toast = container.querySelector('.toast');
      expect(toast).toHaveClass('toast-warning');
    });

    it('should render info toast with correct class', () => {
      const { container } = render(
        <Toast
          id="1"
          type="info"
          message="Info message"
          onClose={mockOnClose}
        />
      );

      const toast = container.querySelector('.toast');
      expect(toast).toHaveClass('toast-info');
    });

    it('should have correct ARIA attributes', () => {
      render(
        <Toast
          id="1"
          type="success"
          message="Test message"
          onClose={mockOnClose}
        />
      );

      const toast = screen.getByRole('alert');
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Auto-dismiss', () => {
    it('should auto-dismiss after default duration', async () => {
      render(
        <Toast
          id="1"
          type="success"
          message="Test message"
          onClose={mockOnClose}
        />
      );

      expect(mockOnClose).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(5000);

      expect(mockOnClose).toHaveBeenCalledWith('1');
    });

    it('should auto-dismiss after custom duration', async () => {
      render(
        <Toast
          id="1"
          type="success"
          message="Test message"
          duration={3000}
          onClose={mockOnClose}
        />
      );

      await vi.advanceTimersByTimeAsync(3000);

      expect(mockOnClose).toHaveBeenCalledWith('1');
    });

    it('should not auto-dismiss when duration is 0', async () => {
      render(
        <Toast
          id="1"
          type="success"
          message="Test message"
          duration={0}
          onClose={mockOnClose}
        />
      );

      vi.advanceTimersByTime(10000);

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('Manual close', () => {
    it('should call onClose when close button is clicked', async () => {
      // Use real timers for user interaction
      vi.useRealTimers();
      const user = userEvent.setup({ delay: null });
      
      render(
        <Toast
          id="1"
          type="success"
          message="Test message"
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: 'Close notification' });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledWith('1');
      
      // Restore fake timers
      vi.useFakeTimers();
    });
  });
});

