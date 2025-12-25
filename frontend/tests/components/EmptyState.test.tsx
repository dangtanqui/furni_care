/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState from '../../src/components/EmptyState';
import { AlertCircle } from 'lucide-react';

describe('EmptyState', () => {
  describe('Rendering', () => {
    it('should render title', () => {
      render(<EmptyState title="No items found" />);
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(<EmptyState title="Title" description="Description text" />);
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      render(<EmptyState title="Title" />);
      expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });

    it('should render icon when provided', () => {
      const icon = <AlertCircle data-testid="icon" />;
      render(<EmptyState title="Title" icon={icon} />);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });

    it('should not render icon when not provided', () => {
      render(<EmptyState title="Title" />);
      expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
    });

    it('should render action button when actionLabel and onAction are provided', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="Title"
          actionLabel="Create New"
          onAction={handleAction}
        />
      );
      expect(screen.getByRole('button', { name: 'Create New' })).toBeInTheDocument();
    });

    it('should not render action button when actionLabel is not provided', () => {
      const handleAction = vi.fn();
      render(<EmptyState title="Title" onAction={handleAction} />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should not render action button when onAction is not provided', () => {
      render(<EmptyState title="Title" actionLabel="Create New" />);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onAction when action button is clicked', async () => {
      const handleAction = vi.fn();
      const user = userEvent.setup();
      render(
        <EmptyState
          title="Title"
          actionLabel="Create New"
          onAction={handleAction}
        />
      );

      await user.click(screen.getByRole('button', { name: 'Create New' }));
      expect(handleAction).toHaveBeenCalledTimes(1);
    });
  });

  describe('Variants', () => {
    it('should render with primary variant by default', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="Title"
          actionLabel="Action"
          onAction={handleAction}
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-primary');
    });

    it('should render with secondary variant', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="Title"
          actionLabel="Action"
          onAction={handleAction}
          actionVariant="secondary"
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-secondary');
    });

    it('should render with tertiary variant', () => {
      const handleAction = vi.fn();
      render(
        <EmptyState
          title="Title"
          actionLabel="Action"
          onAction={handleAction}
          actionVariant="tertiary"
        />
      );
      const button = screen.getByRole('button');
      expect(button).toHaveClass('btn-tertiary');
    });
  });
});

