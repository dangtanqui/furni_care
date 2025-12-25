/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from '../../src/components/Pagination';

describe('Pagination', () => {
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when total_pages is 1', () => {
      const { container } = render(
        <Pagination
          pagination={{ page: 1, per_page: 20, total: 10, total_pages: 1 }}
          onPageChange={mockOnPageChange}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should not render when total_pages is 0', () => {
      const { container } = render(
        <Pagination
          pagination={{ page: 1, per_page: 20, total: 0, total_pages: 0 }}
          onPageChange={mockOnPageChange}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render when total_pages is greater than 1', () => {
      render(
        <Pagination
          pagination={{ page: 1, per_page: 20, total: 100, total_pages: 5 }}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText(/Showing 1 to 20 of 100/)).toBeInTheDocument();
    });

    it('should display correct item name', () => {
      render(
        <Pagination
          pagination={{ page: 1, per_page: 20, total: 100, total_pages: 5 }}
          onPageChange={mockOnPageChange}
          itemName="cases"
        />
      );
      expect(screen.getByText(/cases/)).toBeInTheDocument();
    });

    it('should show correct range for first page', () => {
      render(
        <Pagination
          pagination={{ page: 1, per_page: 20, total: 100, total_pages: 5 }}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText(/Showing 1 to 20 of 100/)).toBeInTheDocument();
    });

    it('should show correct range for middle page', () => {
      render(
        <Pagination
          pagination={{ page: 3, per_page: 20, total: 100, total_pages: 5 }}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText(/Showing 41 to 60 of 100/)).toBeInTheDocument();
    });

    it('should show correct range for last page', () => {
      render(
        <Pagination
          pagination={{ page: 5, per_page: 20, total: 95, total_pages: 5 }}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText(/Showing 81 to 95 of 95/)).toBeInTheDocument();
    });
  });

  describe('Page numbers', () => {
    it('should show all pages when total_pages is 5 or less', () => {
      render(
        <Pagination
          pagination={{ page: 1, per_page: 20, total: 100, total_pages: 5 }}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should show first 5 pages when on page 1-3', () => {
      render(
        <Pagination
          pagination={{ page: 2, per_page: 20, total: 200, total_pages: 10 }}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.queryByText('6')).not.toBeInTheDocument();
    });

    it('should show last 5 pages when near end', () => {
      render(
        <Pagination
          pagination={{ page: 9, per_page: 20, total: 200, total_pages: 10 }}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });

    it('should show 5 pages around current page in middle', () => {
      render(
        <Pagination
          pagination={{ page: 5, per_page: 20, total: 200, total_pages: 10 }}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('should highlight current page', () => {
      render(
        <Pagination
          pagination={{ page: 3, per_page: 20, total: 100, total_pages: 5 }}
          onPageChange={mockOnPageChange}
        />
      );
      const currentPageButton = screen.getByText('3');
      expect(currentPageButton).toHaveClass('pagination-button-active');
    });
  });

  describe('Navigation', () => {
    it('should call onPageChange when Previous is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Pagination
          pagination={{ page: 2, per_page: 20, total: 100, total_pages: 5 }}
          onPageChange={mockOnPageChange}
        />
      );

      await user.click(screen.getByText('Previous'));
      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it('should call onPageChange when Next is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Pagination
          pagination={{ page: 2, per_page: 20, total: 100, total_pages: 5 }}
          onPageChange={mockOnPageChange}
        />
      );

      await user.click(screen.getByText('Next'));
      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it('should call onPageChange when page number is clicked', async () => {
      const user = userEvent.setup();
      render(
        <Pagination
          pagination={{ page: 1, per_page: 20, total: 100, total_pages: 5 }}
          onPageChange={mockOnPageChange}
        />
      );

      await user.click(screen.getByText('3'));
      expect(mockOnPageChange).toHaveBeenCalledWith(3);
    });

    it('should disable Previous button on first page', () => {
      render(
        <Pagination
          pagination={{ page: 1, per_page: 20, total: 100, total_pages: 5 }}
          onPageChange={mockOnPageChange}
        />
      );
      const prevButton = screen.getByText('Previous').closest('button');
      expect(prevButton).toBeDisabled();
    });

    it('should disable Next button on last page', () => {
      render(
        <Pagination
          pagination={{ page: 5, per_page: 20, total: 100, total_pages: 5 }}
          onPageChange={mockOnPageChange}
        />
      );
      const nextButton = screen.getByText('Next').closest('button');
      expect(nextButton).toBeDisabled();
    });
  });
});

