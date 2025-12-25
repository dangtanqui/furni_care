/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../../src/contexts/ToastContext';

describe('ToastContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ToastProvider', () => {
    it('should provide toast functions to children', () => {
      const TestComponent = () => {
        const { showSuccess } = useToast();
        return <button onClick={() => showSuccess('Test message')}>Show Toast</button>;
      };

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      expect(screen.getByText('Show Toast')).toBeInTheDocument();
    });

    it('should show success toast', async () => {
      const TestComponent = () => {
        const { showSuccess } = useToast();
        return <button onClick={() => showSuccess('Success message')}>Show</button>;
      };

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show');
      await act(async () => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Success message')).toBeInTheDocument();
      });
    });

    it('should show error toast', async () => {
      const TestComponent = () => {
        const { showError } = useToast();
        return <button onClick={() => showError('Error message')}>Show</button>;
      };

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show');
      await act(async () => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });
    });

    it('should show warning toast', async () => {
      const TestComponent = () => {
        const { showWarning } = useToast();
        return <button onClick={() => showWarning('Warning message')}>Show</button>;
      };

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show');
      await act(async () => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Warning message')).toBeInTheDocument();
      });
    });

    it('should show info toast', async () => {
      const TestComponent = () => {
        const { showInfo } = useToast();
        return <button onClick={() => showInfo('Info message')}>Show</button>;
      };

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show');
      await act(async () => {
        button.click();
      });

      await waitFor(() => {
        expect(screen.getByText('Info message')).toBeInTheDocument();
      });
    });

    it('should prevent duplicate toasts within 500ms', async () => {
      const TestComponent = () => {
        const { showSuccess } = useToast();
        return (
          <button onClick={() => {
            showSuccess('Duplicate message');
            showSuccess('Duplicate message');
          }}>
            Show
          </button>
        );
      };

      render(
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      );

      const button = screen.getByText('Show');
      await act(async () => {
        button.click();
      });

      await waitFor(() => {
        const messages = screen.getAllByText('Duplicate message');
        // Should only have one toast despite two calls
        expect(messages.length).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('useToast hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useToast());
      }).toThrow('useToast must be used within ToastProvider');

      consoleSpy.mockRestore();
    });

    it('should return toast functions when used within provider', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <ToastProvider>{children}</ToastProvider>
      );

      const { result } = renderHook(() => useToast(), { wrapper });

      expect(result.current.showSuccess).toBeDefined();
      expect(result.current.showError).toBeDefined();
      expect(result.current.showWarning).toBeDefined();
      expect(result.current.showInfo).toBeDefined();
      expect(result.current.showToast).toBeDefined();
    });
  });
});

