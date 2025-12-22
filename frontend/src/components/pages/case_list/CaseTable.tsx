import { useNavigate } from 'react-router-dom';
import { ChevronRight, Clock, CheckCircle } from 'lucide-react';
import { getStatusColorClass, getPriorityColorClass } from '../../../utils/caseHelpers';
import SortIcon from '../../SortIcon';
import Pagination from '../../Pagination';
import '../../../styles/components/pages/case_list/CaseTable.css';
import type { CaseTableProps } from '../../../types/components/pages/CaseList';

export default function CaseTable({ cases, loading, sort, onSort, pagination, onPageChange }: CaseTableProps) {
  const navigate = useNavigate();

  return (
    <div className="case-table-container">
      <div className="overflow-x-auto">
        <table className="case-table case-table-min-width">
          <thead className="case-table-header">
            <tr>
              <th 
                className="case-table-header-cell-full"
                onClick={() => onSort('case_number')}
                role="columnheader"
                aria-sort={sort.column === 'case_number' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="case-table-header-content">
                  Case ID
                  <SortIcon column="case_number" currentColumn={sort.column} direction={sort.direction} />
                </div>
              </th>
              <th 
                className="case-table-header-cell-full"
                onClick={() => onSort('client')}
                role="columnheader"
                aria-sort={sort.column === 'client' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="case-table-header-content">
                  Client
                  <SortIcon column="client" currentColumn={sort.column} direction={sort.direction} />
                </div>
              </th>
              <th 
                className="case-table-header-cell-full"
                onClick={() => onSort('site')}
                role="columnheader"
                aria-sort={sort.column === 'site' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="case-table-header-content">
                  Site
                  <SortIcon column="site" currentColumn={sort.column} direction={sort.direction} />
                </div>
              </th>
              <th 
                className="case-table-header-cell-full"
                onClick={() => onSort('current_stage')}
                role="columnheader"
                aria-sort={sort.column === 'current_stage' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="case-table-header-content">
                  Stage
                  <SortIcon column="current_stage" currentColumn={sort.column} direction={sort.direction} />
                </div>
              </th>
              <th 
                className="case-table-header-cell-full"
                onClick={() => onSort('status')}
                role="columnheader"
                aria-sort={sort.column === 'status' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="case-table-header-content">
                  Status
                  <SortIcon column="status" currentColumn={sort.column} direction={sort.direction} />
                </div>
              </th>
              <th 
                className="case-table-header-cell-full"
                onClick={() => onSort('priority')}
                role="columnheader"
                aria-sort={sort.column === 'priority' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="case-table-header-content">
                  Priority
                  <SortIcon column="priority" currentColumn={sort.column} direction={sort.direction} />
                </div>
              </th>
              <th 
                className="case-table-header-cell-full"
                onClick={() => onSort('assigned_to')}
                role="columnheader"
                aria-sort={sort.column === 'assigned_to' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <div className="case-table-header-content">
                  Assigned
                  <SortIcon column="assigned_to" currentColumn={sort.column} direction={sort.direction} />
                </div>
              </th>
              <th className="case-table-empty-cell"></th>
            </tr>
          </thead>
          <tbody className="case-table-body">
            {loading ? (
              <tr>
                <td colSpan={8} className="case-table-loading">
                  Loading...
                </td>
              </tr>
            ) : cases.length === 0 ? (
              <tr>
                <td colSpan={8} className="case-table-empty">
                  No cases found
                </td>
              </tr>
            ) : (
              cases.map(c => (
                <tr
                  key={c.id}
                  className="case-table-row"
                  onClick={() => navigate(`/cases/${c.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/cases/${c.id}`);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`View case ${c.case_number}`}
                >
                  <td className="case-table-cell-number">{c.case_number}</td>
                  <td className="case-table-cell-full">{c.client}</td>
                  <td className="case-table-cell-full">{c.site}</td>
                  <td className="case-table-cell-full">
                    <span className="case-table-stage-container">
                      {c.current_stage < 5 ? (
                        <Clock className="case-table-stage-icon-clock" />
                      ) : (
                        <CheckCircle className="case-table-stage-icon-check" />
                      )}
                      <span>Stage {c.current_stage}</span>
                    </span>
                  </td>
                  <td className="case-table-cell-full">
                    <span className={`case-table-status-badge ${getStatusColorClass(c.status)}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="case-table-cell-full">
                    <span className={`case-table-priority-text ${getPriorityColorClass(c.priority)}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="case-table-cell-assigned">{c.assigned_to || '-'}</td>
                  <td className="case-table-cell-full">
                    <ChevronRight className="case-table-icon-full" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <Pagination 
        pagination={pagination}
        onPageChange={onPageChange}
        itemName="cases"
      />
    </div>
  );
}

