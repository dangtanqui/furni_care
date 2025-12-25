/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ToastContainer from '../../src/components/ToastContainer';

describe('ToastContainer', () => {
  const mockOnClose = vi.fn();

  it('should render nothing when toasts array is empty', () => {
    const { container } = render(
      <ToastContainer toasts={[]} onClose={mockOnClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render single toast', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Success message' },
    ];

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should render multiple toasts', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Success message' },
      { id: '2', type: 'error' as const, message: 'Error message' },
      { id: '3', type: 'warning' as const, message: 'Warning message' },
    ];

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
  });

  it('should pass onClose to each toast', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Success message' },
      { id: '2', type: 'error' as const, message: 'Error message' },
    ];

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    const closeButtons = screen.getAllByRole('button', { name: 'Close notification' });
    expect(closeButtons).toHaveLength(2);
  });

  it('should pass custom duration to toast', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Success message', duration: 3000 },
    ];

    render(<ToastContainer toasts={toasts} onClose={mockOnClose} />);

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should have correct ARIA attributes', () => {
    const toasts = [
      { id: '1', type: 'success' as const, message: 'Success message' },
    ];

    const { container } = render(
      <ToastContainer toasts={toasts} onClose={mockOnClose} />
    );

    const containerElement = container.querySelector('.toast-container');
    expect(containerElement).toHaveAttribute('role', 'region');
    expect(containerElement).toHaveAttribute('aria-label', 'Notifications');
    expect(containerElement).toHaveAttribute('aria-live', 'polite');
  });
});

