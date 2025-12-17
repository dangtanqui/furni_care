import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCases } from '../api/cases';
import type { CaseListItem } from '../api/cases';
import { getTechnicians } from '../api/data';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Filter, ChevronRight, Clock, CheckCircle, AlertCircle } from 'lucide-react';

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
  const { isCS } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCases();
  }, [filter]);

  useEffect(() => {
    getTechnicians().then(res => setTechnicians(res.data));
  }, []);

  const loadCases = async () => {
    const params: Record<string, string> = {};
    if (filter.status) params.status = filter.status;
    if (filter.case_type) params.case_type = filter.case_type;
    if (filter.assigned_to) params.assigned_to = filter.assigned_to;
    const res = await getCases(params);
    setCases(res.data);
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
      <div className="card p-4 mb-6 overflow-visible">
        <div className="flex flex-row flex-nowrap items-center gap-3 overflow-x-auto">
          <div className="flex items-center gap-1 pl-1">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Filter</span>
          </div>
          <select
            value={filter.status}
            onChange={e => setFilter({ ...filter, status: e.target.value })}
            className="input-field w-40"
          >
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
          <select
            value={filter.case_type}
            onChange={e => setFilter({ ...filter, case_type: e.target.value })}
            className="input-field w-40"
          >
            <option value="">All Types</option>
            <option value="warranty">Warranty</option>
            <option value="maintenance">Maintenance</option>
            <option value="repair">Repair</option>
          </select>
          <select
            value={filter.assigned_to}
            onChange={e => setFilter({ ...filter, assigned_to: e.target.value })}
            className="input-field w-48"
          >
            <option value="">All Assigned</option>
            <option value="unassigned">Unassigned</option>
            {technicians.map(t => (
              <option key={t.id} value={String(t.id)}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Case Table */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Case ID</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Client</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Site</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Stage</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Priority</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Assigned</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cases.map(c => (
              <tr
                key={c.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/cases/${c.id}`)}
              >
                <td className="px-4 py-3 font-medium text-[#1e3a5f]">{c.case_number}</td>
                <td className="px-4 py-3">{c.client}</td>
                <td className="px-4 py-3">{c.site}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1">
                    {c.current_stage < 5 ? (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    Stage {c.current_stage}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[c.status]}`}>
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`flex items-center gap-1 ${priorityColors[c.priority]}`}>
                    {c.priority === 'high' && <AlertCircle className="w-4 h-4" />}
                    {c.priority}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{c.assigned_to || '-'}</td>
                <td className="px-4 py-3">
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </td>
              </tr>
            ))}
            {cases.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  No cases found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

