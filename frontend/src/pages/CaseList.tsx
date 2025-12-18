import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCases } from '../api/cases';
import type { CaseListItem } from '../api/cases';
import { getTechnicians } from '../api/data';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Filter, ChevronRight, Clock, CheckCircle, AlertCircle, ChevronLeft, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import Select from '../components/Select';

const statusColors: Record<string, string> = {
  open: 'bg-blue-100 text-blue-700',
  pending: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-700',
};

const priorityColors: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-yellow-600',
  high: 'text-red-600',
};

export default function CaseList() {
  const [cases, setCases] = useState<CaseListItem[]>([]);
  const [filter, setFilter] = useState({ status: '', case_type: '', assigned_to: '' });
  const [technicians, setTechnicians] = useState<{ id: number; name: string }[]>([]);
  const [pagination, setPagination] = useState({ page: 1, per_page: 20, total: 0, total_pages: 0 });
  const [sort, setSort] = useState<{ column: string; direction: 'asc' | 'desc' }>({ column: 'created_at', direction: 'desc' });
  const [loading, setLoading] = useState(false);
  const { isCS } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCases();
  }, [filter, pagination.page, sort]);

  useEffect(() => {
    getTechnicians().then(res => setTechnicians(res.data));
  }, []);

  const loadCases = async () => {
    setLoading(true);
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
      console.error('Failed to load cases:', error);
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

  const SortIcon = ({ column }: { column: string }) => {
    if (sort.column !== column) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sort.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-[var(--accent)]" />
      : <ArrowDown className="w-4 h-4 text-[var(--accent)]" />;
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 when filter changes
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Case List</h1>
        {isCS && (
          <Link to="/cases/new" className="btn-accent flex items-center gap-2">
            <Plus className="w-5 h-5" /> Create Case
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-6" style={{ overflow: 'visible' }}>
        <div className="flex flex-col md:flex-row md:flex-nowrap md:items-center gap-3 md:overflow-x-auto" style={{ overflowY: 'visible' }}>
          <div className="flex items-center gap-1 pl-1 flex-shrink-0">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Filter</span>
          </div>
          <Select
            value={filter.status}
            onChange={(value) => handleFilterChange({ ...filter, status: value })}
            options={[
              { value: '', label: 'All Status' },
              { value: 'open', label: 'Open' },
              { value: 'pending', label: 'Pending' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'closed', label: 'Closed' },
            ]}
            className="w-full md:flex-1 md:min-w-[160px]"
          />
          <Select
            value={filter.case_type}
            onChange={(value) => handleFilterChange({ ...filter, case_type: value })}
            options={[
              { value: '', label: 'All Types' },
              { value: 'warranty', label: 'Warranty' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'repair', label: 'Repair' },
            ]}
            className="w-full md:flex-1 md:min-w-[160px]"
          />
          <Select
            value={filter.assigned_to}
            onChange={(value) => handleFilterChange({ ...filter, assigned_to: value })}
            options={[
              { value: '', label: 'All Assigned' },
              { value: 'unassigned', label: 'Unassigned' },
              ...technicians.map(t => ({ value: String(t.id), label: t.name })),
            ]}
            className="w-full md:flex-1 md:min-w-[192px]"
          />
        </div>
      </div>

      {/* Case Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: '800px' }}>
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('case_number')}
                >
                  <div className="flex items-center gap-2">
                    Case ID
                    <SortIcon column="case_number" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('client')}
                >
                  <div className="flex items-center gap-2">
                    Client
                    <SortIcon column="client" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('site')}
                >
                  <div className="flex items-center gap-2">
                    Site
                    <SortIcon column="site" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('current_stage')}
                >
                  <div className="flex items-center gap-2">
                    Stage
                    <SortIcon column="current_stage" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center gap-2">
                    Status
                    <SortIcon column="status" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('priority')}
                >
                  <div className="flex items-center gap-2">
                    Priority
                    <SortIcon column="priority" />
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-600 cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('assigned_to')}
                >
                  <div className="flex items-center gap-2">
                    Assigned
                    <SortIcon column="assigned_to" />
                  </div>
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : cases.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No cases found
                </td>
              </tr>
            ) : (
              cases.map(c => (
                <tr
                  key={c.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/cases/${c.id}`)}
                >
                  <td className="px-4 py-3 font-medium text-[#1e3a5f] whitespace-nowrap">{c.case_number}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{c.client}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{c.site}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      {c.current_stage < 5 ? (
                        <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                      <span>Stage {c.current_stage}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`flex items-center gap-1 ${priorityColors[c.priority]}`}>
                      {c.priority === 'high' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.assigned_to || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
        
        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="text-sm text-gray-600 text-center md:text-left">
              Showing {(pagination.page - 1) * pagination.per_page + 1} to {Math.min(pagination.page * pagination.per_page, pagination.total)} of {pagination.total} cases
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.total_pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.total_pages - 2) {
                    pageNum = pagination.total_pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        pagination.page === pageNum
                          ? 'bg-[var(--accent)] text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

