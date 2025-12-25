import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';
import { captureException } from '../../src/utils/errorTracker';
/// <reference types="@testing-library/jest-dom" />

// Mock dependencies
vi.mock('../../src/utils/errorTracker');

const mockCaptureException = vi.mocked(captureException);

// Component that throws error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

// Suppress console.error for error boundary tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
  vi.clearAllMocks();
});

afterEach(() => {
  console.error = originalError;
});

describe('ErrorBoundary', () => {
  describe('Error catching', () => {
    it('should catch errors and display error UI', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should track error with error tracker', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockCaptureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
          errorBoundary: true,
        })
      );
    });

    it('should display default message when error has no message', () => {
      const ThrowErrorNoMessage = () => {
        throw new Error('');
      };

      render(
        <ErrorBoundary>
          <ThrowErrorNoMessage />
        </ErrorBoundary>
      );

      expect(screen.getByText('An unexpected error occurred')).toBeInTheDocument();
    });

    it('should render children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Fallback prop', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });
  });

  describe('Error recovery', () => {
    it('should reset error state when Try Again is clicked', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();

      const tryAgainButton = screen.getByRole('button', { name: 'Try Again' });
      
      // After clicking Try Again, error state should be reset
      // Re-render with no error BEFORE clicking to ensure the component can render children
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      // Now click Try Again to reset the error state
      await user.click(tryAgainButton);

      // Wait for component to re-render after error reset
      await waitFor(() => {
        expect(screen.getByText('No error')).toBeInTheDocument();
      });
      expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('should navigate to home when Go Home is clicked', async () => {
      const user = userEvent.setup();
      const mockLocation = { href: '' };
      Object.defineProperty(window, 'location', {
        value: mockLocation,
        writable: true,
      });

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const goHomeButton = screen.getByRole('button', { name: 'Go Home' });
      await user.click(goHomeButton);

      expect(mockLocation.href).toBe('/');
    });
  });
});

