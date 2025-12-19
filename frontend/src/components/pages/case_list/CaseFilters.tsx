import { Filter } from 'lucide-react';
import Select from '../../Select';
import '../../../styles/components/pages/case_list/CaseFilters.css';
import type { CaseFiltersProps } from '../../../types/components/pages/CaseList';

export default function CaseFilters({ filter, technicians, onFilterChange }: CaseFiltersProps) {
  return (
    <div className="case-filters-card" style={{ overflow: 'visible' }}>
      <div className="case-filters-container" style={{ overflowY: 'visible' }}>
        <div className="case-filters-label">
          <Filter className="case-filters-icon" />
          <span className="case-filters-text">Filter</span>
        </div>
        <Select
          value={filter.status}
          onChange={(value) => onFilterChange({ ...filter, status: value })}
          options={[
            { value: '', label: 'All Status' },
            { value: 'open', label: 'Open' },
            { value: 'pending', label: 'Pending' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'completed', label: 'Completed' },
            { value: 'closed', label: 'Closed' },
            { value: 'rejected', label: 'Rejected' },
            { value: 'cancelled', label: 'Cancelled' },
          ]}
          className="case-filters-select"
        />
        <Select
          value={filter.case_type}
          onChange={(value) => onFilterChange({ ...filter, case_type: value })}
          options={[
            { value: '', label: 'All Types' },
            { value: 'warranty', label: 'Warranty' },
            { value: 'maintenance', label: 'Maintenance' },
            { value: 'repair', label: 'Repair' },
          ]}
          className="case-filters-select"
        />
        <Select
          value={filter.assigned_to}
          onChange={(value) => onFilterChange({ ...filter, assigned_to: value })}
          options={[
            { value: '', label: 'All Assigned' },
            { value: 'unassigned', label: 'Unassigned' },
            ...technicians.map(t => ({ value: String(t.id), label: t.name })),
          ]}
          className="case-filters-select-wide"
        />
      </div>
    </div>
  );
}

