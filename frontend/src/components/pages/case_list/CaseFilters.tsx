import { useState } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';
import Select from '../../Select';
import '../../../styles/components/pages/case_list/CaseFilters.css';
import type { CaseFiltersProps } from '../../../types/components/pages/CaseList';

export default function CaseFilters({ filter, technicians, onFilterChange }: CaseFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasActiveFilters = filter.status || filter.case_type || filter.assigned_to;

  return (
    <div className="case-filters-card" style={{ overflow: 'visible' }}>
      <button
        className="case-filters-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-label="Toggle filters"
      >
        <div className="case-filters-label">
          <Filter className="case-filters-icon" />
          <span className="case-filters-text">Filter</span>
          {hasActiveFilters && <span className="case-filters-badge" aria-label="Active filters">•</span>}
        </div>
        {isExpanded ? (
          <ChevronUp className="case-filters-chevron" aria-hidden="true" />
        ) : (
          <ChevronDown className="case-filters-chevron" aria-hidden="true" />
        )}
      </button>
      <div className={`case-filters-container ${isExpanded ? 'case-filters-container-expanded' : 'case-filters-container-collapsed'}`} style={{ overflowY: 'visible' }}>
        {/* Desktop: Show Filter label with icon */}
        <div className="case-filters-label-desktop">
          <Filter className="case-filters-icon" />
          <span className="case-filters-text">FILTER</span>
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
          placeholder="Filter by Status"
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
          placeholder="Filter by Type"
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
          placeholder="Filter by Technician"
          className="case-filters-select-wide"
        />
      </div>
    </div>
  );
}

