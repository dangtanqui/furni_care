import { useState, useEffect } from 'react';
import { useCases } from '../api/useCases';
import { useTechnicians } from '../useTechnicians';
import {
  DEFAULT_SORT,
  SORT_DIRECTION,
  PAGINATION,
  ERROR_MESSAGES,
} from '../../constants/pages/CaseList';

export function useCaseList() {
  const [filter, setFilter] = useState({ status: '', case_type: '', assigned_to: '' });
  const { technicians } = useTechnicians();
  const [pagination, setPagination] = useState<{
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
  }>({
    page: PAGINATION.DEFAULT_PAGE,
    per_page: PAGINATION.DEFAULT_PER_PAGE,
    total: 0,
    total_pages: 0,
  });
  const [sort, setSort] = useState<Array<{ column: string; direction: 'asc' | 'desc' }>>([
    { column: DEFAULT_SORT.column, direction: DEFAULT_SORT.direction },
  ]);

  // Use React Query hook for data fetching
  const {
    data: casesResponse,
    isLoading: loading,
    error: queryError,
  } = useCases({
    page: pagination.page,
    per_page: pagination.per_page,
    sorts: sort.length > 0 ? sort : [{ column: DEFAULT_SORT.column, direction: DEFAULT_SORT.direction }],
    status: filter.status || undefined,
    case_type: filter.case_type || undefined,
    assigned_to: filter.assigned_to || undefined,
  });

  // Update pagination when data changes
  useEffect(() => {
    if (casesResponse?.pagination) {
      setPagination(casesResponse.pagination);
    }
  }, [casesResponse]);

  // Convert React Query error to string
  const error = queryError
    ? (queryError as Error)?.message || ERROR_MESSAGES.LOAD_CASES_FAILED
    : null;

  const cases = casesResponse?.data || [];

  const handleSort = (column: string) => {
    setSort(prev => {
      const existingIndex = prev.findIndex(s => s.column === column);
      
      if (existingIndex !== -1) {
        const existing = prev[existingIndex];
        if (existing.direction === SORT_DIRECTION.ASC) {
          // Click 2: Change to desc, keep position and all other sorts
          const newSort = [...prev];
          newSort[existingIndex] = { column, direction: SORT_DIRECTION.DESC };
          return newSort;
        } else {
          // Click 3: Remove from sort array (clear sort for this column), keep other sorts
          return prev.filter((_, index) => index !== existingIndex);
        }
      } else {
        // Click 1: Add new sort with asc direction, add to END (lowest priority)
        // This ensures the first clicked column has highest priority, subsequent columns are secondary
        return [...prev, { column, direction: SORT_DIRECTION.ASC }];
      }
    });
    setPagination(prev => ({ ...prev, page: PAGINATION.DEFAULT_PAGE })); // Reset to page 1 when sorting
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, page: PAGINATION.DEFAULT_PAGE })); // Reset to page 1 when filter changes
  };

  return {
    cases,
    filter,
    technicians,
    pagination,
    sort,
    loading,
    error,
    handleSort,
    handlePageChange,
    handleFilterChange,
  };
}
