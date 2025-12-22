import { useState, useEffect } from 'react';
import { getCases } from '../../api/cases';
import type { CaseListItem } from '../../api/cases';
import { useTechnicians } from '../useTechnicians';

export function useCaseList() {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [filter, setFilter] = useState({ status: '', case_type: '', assigned_to: '' });
  const { technicians } = useTechnicians();
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, total_pages: 0 });
  const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' }>({ column: 'created_at', direction: 'desc' });
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
        sort_by: sort.column,
        sort_direction: sort.direction,
      };
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
      if (prev.column === column) {
        // Toggle direction if same column
        return { column, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      // New column, default to asc
      return { column, direction: 'asc' };
    });
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when sorting
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when filter changes
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

