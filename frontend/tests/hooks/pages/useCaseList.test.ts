import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCaseList } from '../../../src/hooks/pages/useCaseList';
import { getCases } from '../../../src/api/cases';
import { useTechnicians } from '../../../src/hooks/useTechnicians';
import { useToast } from '../../../src/contexts/ToastContext';

// Mock dependencies
vi.mock('../../../src/api/cases');
vi.mock('../../../src/hooks/useTechnicians');
vi.mock('../../../src/contexts/ToastContext');

const mockGetCases = vi.mocked(getCases);
const mockUseTechnicians = vi.mocked(useTechnicians);
const mockUseToast = vi.mocked(useToast);

describe('useCaseList', () => {
  const mockTechnicians = [
    { id: 1, name: 'Tech 1' },
    { id: 2, name: 'Tech 2' },
  ];

  const mockShowInfo = vi.fn();

  beforeEach(() => {
    mockUseTechnicians.mockReturnValue({
      technicians: mockTechnicians,
      loading: false,
      error: null,
    });

    mockUseToast.mockReturnValue({
      showToast: vi.fn(),
      showSuccess: vi.fn(),
      showError: vi.fn(),
      showWarning: mockShowInfo,
      showInfo: mockShowInfo,
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('should initialize with default values', async () => {
      mockGetCases.mockResolvedValue({
        data: {
          data: [],
          pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseList());

      // Wait for initial load to complete
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.cases).toEqual([]);
      expect(result.current.filter).toEqual({ status: '', case_type: '', assigned_to: '' });
      expect(result.current.pagination.page).toBe(1);
      expect(result.current.sort).toEqual([{ column: 'created_at', direction: 'desc' }]);
      expect(result.current.error).toBeNull();
    });
  });

  describe('handleSort', () => {
    it('should add new sort column with asc direction', async () => {
      mockGetCases.mockResolvedValue({
        data: {
          data: [],
          pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.handleSort('status');

      await waitFor(() => {
        // New sort is added to the end (lowest priority)
        expect(result.current.sort).toEqual([
          { column: 'created_at', direction: 'desc' },
          { column: 'status', direction: 'asc' },
        ]);
        expect(result.current.pagination.page).toBe(1);
      });
    });

    it('should toggle direction when clicking same column', async () => {
      mockGetCases.mockResolvedValue({
        data: {
          data: [],
          pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First click: add with asc (added to end)
      result.current.handleSort('status');
      await waitFor(() => {
        const statusSort = result.current.sort.find(s => s.column === 'status');
        expect(statusSort?.direction).toBe('asc');
      });

      // Second click: change to desc
      result.current.handleSort('status');
      await waitFor(() => {
        const statusSort = result.current.sort.find(s => s.column === 'status');
        expect(statusSort?.direction).toBe('desc');
      });

      // Third click: remove from sort
      result.current.handleSort('status');
      await waitFor(() => {
        expect(result.current.sort.find(s => s.column === 'status')).toBeUndefined();
      });
    });
  });

  describe('handleFilterChange', () => {
    it('should update filter and reset pagination', async () => {
      mockGetCases.mockResolvedValue({
        data: {
          data: [],
          pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.handleFilterChange({ status: 'open', case_type: '', assigned_to: '' });

      await waitFor(() => {
        expect(result.current.filter.status).toBe('open');
        expect(result.current.pagination.page).toBe(1);
      });
    });

    it('should show info toast when filters are applied', async () => {
      mockGetCases.mockResolvedValue({
        data: {
          data: [],
          pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.handleFilterChange({ status: 'open', case_type: 'warranty', assigned_to: '' });

      await waitFor(() => {
        expect(mockShowInfo).toHaveBeenCalledWith('Filters applied', 2000);
      });
    });
  });

  describe('handlePageChange', () => {
    it('should update pagination page', async () => {
      // Mock initial load
      mockGetCases.mockResolvedValueOnce({
        data: {
          data: [],
          pagination: { page: 1, per_page: 20, total: 100, total_pages: 5 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      const { result } = renderHook(() => useCaseList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Mock the second call with page 2
      mockGetCases.mockResolvedValueOnce({
        data: {
          data: [],
          pagination: { page: 2, per_page: 20, total: 100, total_pages: 5 },
        },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any,
      } as any);

      result.current.handlePageChange(2);

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(2);
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Error handling', () => {
    it('should set error when API call fails', async () => {
      mockGetCases.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() => useCaseList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Failed to load cases. Please try again.');
        expect(result.current.cases).toEqual([]);
      });
    });
  });
});

