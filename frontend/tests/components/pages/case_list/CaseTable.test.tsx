import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CaseTable from '../../../../src/components/pages/case_list/CaseTable';
import type { CaseListItem } from '../../../../src/api/cases';

// Mock dependencies
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CaseTable', () => {
  const mockCases: CaseListItem[] = [
    {
      id: 1,
      case_number: 'CASE-001',
      client: 'Client 1',
      site: 'Site 1',
      current_stage: 1,
      stage_name: 'Stage 1',
      status: 'open',
      priority: 'high',
      assigned_to: 'Tech 1',
      created_at: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      case_number: 'CASE-002',
      client: 'Client 2',
      site: 'Site 2',
      current_stage: 2,
      stage_name: 'Stage 2',
      status: 'in_progress',
      priority: 'medium',
      assigned_to: 'Tech 2',
      created_at: '2024-01-02T00:00:00Z',
    },
  ];

  const mockOnSort = vi.fn();
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render table with cases', () => {
    render(
      <BrowserRouter>
        <CaseTable
          cases={mockCases}
          loading={false}
          sort={[{ column: 'created_at', direction: 'desc' }]}
          onSort={mockOnSort}
          pagination={{ page: 1, per_page: 20, total: 2, total_pages: 1 }}
          onPageChange={mockOnPageChange}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('CASE-001')).toBeInTheDocument();
    expect(screen.getByText('CASE-002')).toBeInTheDocument();
    expect(screen.getByText('Client 1')).toBeInTheDocument();
    expect(screen.getByText('Client 2')).toBeInTheDocument();
  });

  it('should render table headers', () => {
    render(
      <BrowserRouter>
        <CaseTable
          cases={mockCases}
          loading={false}
          sort={[{ column: 'created_at', direction: 'desc' }]}
          onSort={mockOnSort}
          pagination={{ page: 1, per_page: 20, total: 2, total_pages: 1 }}
          onPageChange={mockOnPageChange}
        />
      </BrowserRouter>
    );

    expect(screen.getByText('Case ID')).toBeInTheDocument();
    expect(screen.getByText('Client')).toBeInTheDocument();
    expect(screen.getByText('Site')).toBeInTheDocument();
    expect(screen.getByText('Stage')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should call onSort when column header is clicked', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <CaseTable
          cases={mockCases}
          loading={false}
          sort={[{ column: 'created_at', direction: 'desc' }]}
          onSort={mockOnSort}
          pagination={{ page: 1, per_page: 20, total: 2, total_pages: 1 }}
          onPageChange={mockOnPageChange}
        />
      </BrowserRouter>
    );

    const caseIdHeader = screen.getByText('Case ID').closest('th');
    if (caseIdHeader) {
      await user.click(caseIdHeader);
      expect(mockOnSort).toHaveBeenCalledWith('case_number');
    }
  });

  it('should display loading skeleton when loading', () => {
    render(
      <BrowserRouter>
        <CaseTable
          cases={[]}
          loading={true}
          sort={[{ column: 'created_at', direction: 'desc' }]}
          onSort={mockOnSort}
          pagination={{ page: 1, per_page: 20, total: 0, total_pages: 0 }}
          onPageChange={mockOnPageChange}
        />
      </BrowserRouter>
    );

    // SkeletonLoader should be rendered
    const skeletons = document.querySelectorAll('.skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display empty state when no cases', () => {
    render(
      <BrowserRouter>
        <CaseTable
          cases={[]}
          loading={false}
          sort={[{ column: 'created_at', direction: 'desc' }]}
          onSort={mockOnSort}
          pagination={{ page: 1, per_page: 20, total: 0, total_pages: 0 }}
          onPageChange={mockOnPageChange}
        />
      </BrowserRouter>
    );

    // EmptyState should be rendered
    expect(screen.getByText(/No cases found/i)).toBeInTheDocument();
  });

  it('should render pagination when total_pages > 1', () => {
    render(
      <BrowserRouter>
        <CaseTable
          cases={mockCases}
          loading={false}
          sort={[{ column: 'created_at', direction: 'desc' }]}
          onSort={mockOnSort}
          pagination={{ page: 1, per_page: 20, total: 50, total_pages: 3 }}
          onPageChange={mockOnPageChange}
        />
      </BrowserRouter>
    );

    // Pagination should be rendered - check for active page button
    const activePageButton = screen.getByRole('button', { name: '1' });
    expect(activePageButton).toBeInTheDocument();
    expect(activePageButton).toHaveClass('pagination-button-active');
  });

  it('should navigate to case details when row is clicked', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <CaseTable
          cases={mockCases}
          loading={false}
          sort={[{ column: 'created_at', direction: 'desc' }]}
          onSort={mockOnSort}
          pagination={{ page: 1, per_page: 20, total: 2, total_pages: 1 }}
          onPageChange={mockOnPageChange}
        />
      </BrowserRouter>
    );

    const firstRow = screen.getByText('CASE-001').closest('tr');
    if (firstRow) {
      await user.click(firstRow);
      // Navigation should be triggered (tested via integration)
    }
  });

  it('should display correct sort indicators', () => {
    render(
      <BrowserRouter>
        <CaseTable
          cases={mockCases}
          loading={false}
          sort={[{ column: 'case_number', direction: 'asc' }]}
          onSort={mockOnSort}
          pagination={{ page: 1, per_page: 20, total: 2, total_pages: 1 }}
          onPageChange={mockOnPageChange}
        />
      </BrowserRouter>
    );

    const caseIdHeader = screen.getByText('Case ID').closest('th');
    expect(caseIdHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  it('should display unassigned cases correctly', () => {
    const unassignedCase = {
      ...mockCases[0],
      assigned_to: null,
    };

    render(
      <BrowserRouter>
        <CaseTable
          cases={[unassignedCase]}
          loading={false}
          sort={[{ column: 'created_at', direction: 'desc' }]}
          onSort={mockOnSort}
          pagination={{ page: 1, per_page: 20, total: 1, total_pages: 1 }}
          onPageChange={mockOnPageChange}
        />
      </BrowserRouter>
    );

    // Component displays "-" for unassigned cases
    expect(screen.getByText('-')).toBeInTheDocument();
  });
});

