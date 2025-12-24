import { useState, useEffect } from 'react';
import { getCases } from '../../api/cases';
import type { CaseListItem } from '../../api/cases';
import { useTechnicians } from '../useTechnicians';
import { useToast } from '../../contexts/ToastContext';

export function useCaseList() {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [filter, setFilter] = useState({ status: '', case_type: '', assigned_to: '' });
  const { technicians } = useTechnicians();
  const { showInfo } = useToast();
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, total_pages: 0 });
  const [sort, setSort] = useState<Array<{ column: string; direction: 'asc' | 'desc' }>>([{ column: 'created_at', direction: 'desc' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCases();
  }, [filter, pagination.page, sort]);

  useEffect(() => {
  }, []);

  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {
        page: String(pagination.page),
        per_page: String(pagination.per_page),
      };
      // Send all sorts as JSON array for multiple column sorting
      if (sort.length > 0) {
        params.sorts = JSON.stringify(sort.map(s => ({ column: s.column, direction: s.direction })));
      } else {
        // Default sort if no sort is active
        params.sorts = JSON.stringify([{ column: 'created_at', direction: 'desc' }]);
      }
      if (filter.status) params.status = filter.status;
      if (filter.case_type) params.case_type = filter.case_type;
      if (filter.assigned_to) params.assigned_to = filter.assigned_to;
      const res = await getCases(params);
      setCases(res.data.data);
      setPagination(res.data.pagination);
    } catch (error) {
      setError('Failed to load cases. Please try again.');
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    setSort(prev => {
      const existingIndex = prev.findIndex(s => s.column === column);
      
      if (existingIndex !== -1) {
        const existing = prev[existingIndex];
        if (existing.direction === 'asc') {
          // Click 2: Change to desc, keep all other sorts
          const newSort = [...prev];
          newSort[existingIndex] = { column, direction: 'desc' };
          return newSort;
        } else {
          // Click 3: Remove from sort array (clear sort for this column), keep other sorts
          return prev.filter((_, index) => index !== existingIndex);
        }
      } else {
        // Click 1: Add new sort with asc direction, add to beginning (highest priority)
        // Keep all existing sorts - they will be secondary sorts
        return [{ column, direction: 'asc' }, ...prev];
      }
    });
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when sorting
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    const hasActiveFilters = newFilter.status || newFilter.case_type || newFilter.assigned_to;
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when filter changes
    if (hasActiveFilters) {
      showInfo('Filters applied', 2000);
    }
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

