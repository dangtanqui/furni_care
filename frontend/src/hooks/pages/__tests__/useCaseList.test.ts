import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCaseList } from '../useCaseList';
import { getCases } from '../../../api/cases';
import { useTechnicians } from '../../useTechnicians';
import { useToast } from '../../../contexts/ToastContext';

// Mock dependencies
vi.mock('../../../api/cases');
vi.mock('../../useTechnicians');
vi.mock('../../../contexts/ToastContext');

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
    it('should initialize with default values', () => {
      mockGetCases.mockResolvedValue({
        data: {
          data: [],
          pagination: { page: 1, per_page: 20, total: 0, total_pages: 0 },
        },
      });

      const { result } = renderHook(() => useCaseList());

      expect(result.current.cases).toEqual([]);
      expect(result.current.filter).toEqual({ status: '', case_type: '', assigned_to: '' });
      expect(result.current.pagination.page).toBe(1);
      expect(result.current.sort).toEqual([{ column: 'created_at', direction: 'desc' }]);
      expect(result.current.loading).toBe(false);
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
      });

      const { result } = renderHook(() => useCaseList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.handleSort('status');

      await waitFor(() => {
        expect(result.current.sort).toEqual([
          { column: 'status', direction: 'asc' },
          { column: 'created_at', direction: 'desc' },
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
      });

      const { result } = renderHook(() => useCaseList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // First click: add with asc
      result.current.handleSort('status');
      await waitFor(() => {
        expect(result.current.sort[0].direction).toBe('asc');
      });

      // Second click: change to desc
      result.current.handleSort('status');
      await waitFor(() => {
        expect(result.current.sort[0].direction).toBe('desc');
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
      });

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
      });

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
      mockGetCases.mockResolvedValue({
        data: {
          data: [],
          pagination: { page: 1, per_page: 20, total: 100, total_pages: 5 },
        },
      });

      const { result } = renderHook(() => useCaseList());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      result.current.handlePageChange(2);

      await waitFor(() => {
        expect(result.current.pagination.page).toBe(2);
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

