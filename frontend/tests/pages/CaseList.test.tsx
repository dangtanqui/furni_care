import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CaseList from '../../src/pages/CaseList';
import { useAuth } from '../../src/contexts/AuthContext';
import { useCaseList } from '../../src/hooks/pages/useCaseList';

// Mock dependencies
vi.mock('../../src/contexts/AuthContext');
vi.mock('../../src/hooks/pages/useCaseList');

const mockUseAuth = vi.mocked(useAuth);
const mockUseCaseList = vi.mocked(useCaseList);

describe('CaseList', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' },
      token: 'test-token',
      login: vi.fn(),
      logout: vi.fn(),
      isCS: true,
      isTechnician: false,
      isLeader: false,
    });

    mockUseCaseList.mockReturnValue({
      cases: [],
      filter: { status: '', case_type: '', assigned_to: '' },
      technicians: [],
      pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 },
      sort: [{ column: 'created_at', direction: 'desc' }],
      loading: false,
      error: null,
      handleSort: vi.fn(),
      handlePageChange: vi.fn(),
      handleFilterChange: vi.fn(),
    });
  });

  it('should render case list page', () => {
    render(
      <BrowserRouter>
        <CaseList />
      </BrowserRouter>
    );

    expect(screen.getByText('Case List')).toBeInTheDocument();
  });

  it('should show Create Case button for CS users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'cs' },
      token: 'test-token',
      login: vi.fn(),
      logout: vi.fn(),
      isCS: true,
      isTechnician: false,
      isLeader: false,
    });

    render(
      <BrowserRouter>
        <CaseList />
      </BrowserRouter>
    );

    expect(screen.getByRole('link', { name: /Create Case/i })).toBeInTheDocument();
  });

  it('should not show Create Case button for non-CS users', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, email: 'test@example.com', name: 'Test User', role: 'technician' },
      token: 'test-token',
      login: vi.fn(),
      logout: vi.fn(),
      isCS: false,
      isTechnician: true,
      isLeader: false,
    });

    render(
      <BrowserRouter>
        <CaseList />
      </BrowserRouter>
    );

    expect(screen.queryByRole('link', { name: /Create Case/i })).not.toBeInTheDocument();
  });

  it('should display error message when error exists', () => {
    mockUseCaseList.mockReturnValue({
      cases: [],
      filter: { status: '', case_type: '', assigned_to: '' },
      technicians: [],
      pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 },
      sort: [{ column: 'created_at', direction: 'desc' }],
      loading: false,
      error: 'Failed to load cases',
      handleSort: vi.fn(),
      handlePageChange: vi.fn(),
      handleFilterChange: vi.fn(),
    });

    render(
      <BrowserRouter>
        <CaseList />
      </BrowserRouter>
    );

    expect(screen.getByText('Failed to load cases')).toBeInTheDocument();
  });

  it('should render CaseFilters and CaseTable', () => {
    render(
      <BrowserRouter>
        <CaseList />
      </BrowserRouter>
    );

    // CaseFilters should be rendered (tested via its toggle button)
    expect(screen.getByText('Filter')).toBeInTheDocument();
  });
});

