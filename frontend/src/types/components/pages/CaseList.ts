import type { CaseListItem } from '../../../api/cases';

export interface CaseFiltersProps {
  filter: { status: string; case_type: string; assigned_to: string };
  technicians: { id: number; name: string }[];
  onFilterChange: (filter: { status: string; case_type: string; assigned_to: string }) => void;
}

export interface CaseTableProps {
  cases: CaseListItem[];
  loading: boolean;
  sort: { column: string; direction: 'asc' | 'desc' };
  onSort: (column: string) => void;
  pagination: { page: number; per_page: number; total: number; total_pages: number };
  onPageChange: (page: number) => void;
}


