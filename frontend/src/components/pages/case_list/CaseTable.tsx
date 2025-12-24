import { useNavigate } from 'react-router-dom';
import { ChevronRight, Clock, CheckCircle, Inbox } from 'lucide-react';
import { getStatusColorClass, getPriorityColorClass, formatCaseStatus, getStatusIcon, getPriorityIcon } from '../../../utils/caseHelpers';
import SortIcon from '../../SortIcon';
import Pagination from '../../Pagination';
import EmptyState from '../../EmptyState';
import SkeletonLoader from '../../SkeletonLoader';
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
                aria-sort={(() => {
                  const sortEntry = sort.find(s => s.column === 'case_number');
                  return sortEntry ? (sortEntry.direction === 'asc' ? 'ascending' : 'descending') : 'none';
                })()}
              >
                <div className="case-table-header-content">
                  Case ID
                  <SortIcon column="case_number" currentColumn={sort} direction={sort.find(s => s.column === 'case_number')?.direction || 'asc'} />
                </div>
              </th>
              <th 
                className="case-table-header-cell-full"
                onClick={() => onSort('client')}
                role="columnheader"
                aria-sort={(() => {
                  const sortEntry = sort.find(s => s.column === 'client');
                  return sortEntry ? (sortEntry.direction === 'asc' ? 'ascending' : 'descending') : 'none';
                })()}
              >
                <div className="case-table-header-content">
                  Client
                  <SortIcon column="client" currentColumn={sort} direction={sort.find(s => s.column === 'client')?.direction || 'asc'} />
                </div>
              </th>
              <th 
                className="case-table-header-cell-full"
                onClick={() => onSort('site')}
                role="columnheader"
                aria-sort={(() => {
                  const sortEntry = sort.find(s => s.column === 'site');
                  return sortEntry ? (sortEntry.direction === 'asc' ? 'ascending' : 'descending') : 'none';
                })()}
              >
                <div className="case-table-header-content">
                  Site
                  <SortIcon column="site" currentColumn={sort} direction={sort.find(s => s.column === 'site')?.direction || 'asc'} />
                </div>
              </th>
              <th 
                className="case-table-header-cell-full"
                onClick={() => onSort('current_stage')}
                role="columnheader"
                aria-sort={(() => {
                  const sortEntry = sort.find(s => s.column === 'current_stage');
                  return sortEntry ? (sortEntry.direction === 'asc' ? 'ascending' : 'descending') : 'none';
                })()}
              >
                <div className="case-table-header-content">
                  Stage
                  <SortIcon column="current_stage" currentColumn={sort} direction={sort.find(s => s.column === 'current_stage')?.direction || 'asc'} />
                </div>
              </th>
              <th 
                className="case-table-header-cell-full"
                onClick={() => onSort('status')}
                role="columnheader"
                aria-sort={(() => {
                  const sortEntry = sort.find(s => s.column === 'status');
                  return sortEntry ? (sortEntry.direction === 'asc' ? 'ascending' : 'descending') : 'none';
                })()}
              >
                <div className="case-table-header-content">
                  Status
                  <SortIcon column="status" currentColumn={sort} direction={sort.find(s => s.column === 'status')?.direction || 'asc'} />
                </div>
              </th>
              <th 
                className="case-table-header-cell-full"
                onClick={() => onSort('priority')}
                role="columnheader"
                aria-sort={(() => {
                  const sortEntry = sort.find(s => s.column === 'priority');
                  return sortEntry ? (sortEntry.direction === 'asc' ? 'ascending' : 'descending') : 'none';
                })()}
              >
                <div className="case-table-header-content">
                  Priority
                  <SortIcon column="priority" currentColumn={sort} direction={sort.find(s => s.column === 'priority')?.direction || 'asc'} />
                </div>
              </th>
              <th 
                className="case-table-header-cell-full"
                onClick={() => onSort('assigned_to')}
                role="columnheader"
                aria-sort={(() => {
                  const sortEntry = sort.find(s => s.column === 'assigned_to');
                  return sortEntry ? (sortEntry.direction === 'asc' ? 'ascending' : 'descending') : 'none';
                })()}
              >
                <div className="case-table-header-content">
                  Assigned
                  <SortIcon column="assigned_to" currentColumn={sort} direction={sort.find(s => s.column === 'assigned_to')?.direction || 'asc'} />
                </div>
              </th>
              <th className="case-table-empty-cell"></th>
            </tr>
          </thead>
          <tbody className="case-table-body">
            {loading ? (
              <>
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={`skeleton-${index}`} className="case-table-row-skeleton">
                    <td className="case-table-cell-number" data-label="Case ID"><SkeletonLoader width="80px" height="20px" /></td>
                    <td className="case-table-cell-full" data-label="Client"><SkeletonLoader width="120px" height="20px" /></td>
                    <td className="case-table-cell-full" data-label="Site"><SkeletonLoader width="150px" height="20px" /></td>
                    <td className="case-table-cell-full" data-label="Stage"><SkeletonLoader width="100px" height="20px" /></td>
                    <td className="case-table-cell-full" data-label="Status"><SkeletonLoader width="90px" height="24px" /></td>
                    <td className="case-table-cell-full" data-label="Priority"><SkeletonLoader width="70px" height="20px" /></td>
                    <td className="case-table-cell-assigned" data-label="Assigned"><SkeletonLoader width="100px" height="20px" /></td>
                    <td className="case-table-cell-full" data-label=""><SkeletonLoader width="24px" height="24px" variant="circular" /></td>
                  </tr>
                ))}
              </>
            ) : cases.length === 0 ? (
              <tr>
                <td colSpan={8} className="case-table-empty">
                  <EmptyState
                    icon={<Inbox />}
                    title="No cases found"
                    description="Try adjusting your filters or create a new case to get started."
                  />
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
                  <td className="case-table-cell-number" data-label="Case ID">{c.case_number}</td>
                  <td className="case-table-cell-full" data-label="Client">{c.client}</td>
                  <td className="case-table-cell-full" data-label="Site">{c.site}</td>
                  <td className="case-table-cell-full" data-label="Stage">
                    <span className="case-table-stage-container">
                      {c.current_stage < 5 ? (
                        <Clock className="case-table-stage-icon-clock" />
                      ) : (
                        <CheckCircle className="case-table-stage-icon-check" />
                      )}
                      <span>Stage {c.current_stage}</span>
                    </span>
                  </td>
                  <td className="case-table-cell-full" data-label="Status">
                    <span className={`case-table-status-badge ${getStatusColorClass(c.status)} case-table-status-with-icon`}>
                      {(() => {
                        const StatusIcon = getStatusIcon(c.status);
                        return <StatusIcon className="case-table-status-icon" aria-hidden="true" />;
                      })()}
                      {formatCaseStatus(c.status)}
                    </span>
                  </td>
                  <td className="case-table-cell-full" data-label="Priority">
                    <span className={`case-table-priority-text ${getPriorityColorClass(c.priority)} case-table-priority-with-icon`}>
                      {(() => {
                        const PriorityIcon = getPriorityIcon(c.priority);
                        return <PriorityIcon className="case-table-priority-icon" aria-hidden="true" />;
                      })()}
                      {c.priority}
                    </span>
                  </td>
                  <td className="case-table-cell-assigned" data-label="Assigned">{c.assigned_to || '-'}</td>
                  <td className="case-table-cell-full" data-label="">
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

