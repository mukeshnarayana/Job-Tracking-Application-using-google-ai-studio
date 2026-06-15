import React, { useState, useMemo } from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import {
  Search,
  SlidersHorizontal,
  Edit3,
  Trash2,
  ExternalLink,
  MapPin,
  Calendar,
  IndianRupee,
  ChevronUp,
  ChevronDown,
  Mail,
  Smartphone,
} from 'lucide-react';

interface ApplicationTableProps {
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string, company: string, role: string) => Promise<void>;
}

type SortField = 'companyName' | 'roleName' | 'appliedDate' | 'salary' | 'status';
type SortOrder = 'asc' | 'desc';

const STATUS_PILLS: { value: ApplicationStatus | 'all'; label: string; color: string }[] = [
  { value: 'all', label: 'All Jobs', color: 'bg-gray-100 text-gray-700' },
  { value: 'applied', label: 'Applied', color: 'bg-blue-50 text-blue-700 border-blue-150' },
  { value: 'reply', label: 'Reply', color: 'bg-indigo-50 text-indigo-700 border-indigo-150' },
  { value: 'no reply', label: 'No Reply', color: 'bg-amber-50 text-amber-700 border-amber-150' },
  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-sky-50 text-sky-700 border-sky-150' },
  { value: 'not shortlisted', label: 'Not Shortlisted', color: 'bg-orange-50 text-orange-750 border-orange-150' },
  { value: 'selected', label: 'Offers', color: 'bg-emerald-50 text-emerald-700 border-emerald-150' },
  { value: 'notselected', label: 'Not Selected', color: 'bg-rose-50 text-rose-700 border-rose-150' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-150' },
];

const STATUS_BADGE_CLASSES: Record<ApplicationStatus, string> = {
  applied: 'bg-blue-100 text-blue-700 rounded-full text-[10px] font-bold uppercase tracking-tight px-2.5 py-1',
  reply: 'bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold uppercase tracking-tight px-2.5 py-1',
  'no reply': 'bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-tight px-2.5 py-1',
  shortlisted: 'bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-tight px-2.5 py-1',
  'not shortlisted': 'bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-tight px-2.5 py-1',
  selected: 'bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-tight px-2.5 py-1',
  notselected: 'bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold uppercase tracking-tight px-2.5 py-1',
  rejected: 'bg-red-100 text-red-800 rounded-full text-[10px] font-bold uppercase tracking-tight px-2.5 py-1',
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: 'Applied',
  reply: 'Reply Received',
  'no reply': 'Awaiting Reply',
  shortlisted: 'Shortlisted',
  'not shortlisted': 'Not Shortlisted',
  selected: 'Selected / Offer',
  notselected: 'Not Selected',
  rejected: 'Rejected',
};

export const ApplicationTable: React.FC<ApplicationTableProps> = ({
  applications,
  onEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'all'>('all');
  const [sortField, setSortField] = useState<SortField>('appliedDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Multi-field search and filter
  const processedApplications = useMemo(() => {
    let list = [...applications];

    // 1. Status Filter
    if (statusFilter !== 'all') {
      list = list.filter((app) => app.status === statusFilter);
    }

    // 2. Text Search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (app) =>
          app.companyName.toLowerCase().includes(q) ||
          app.roleName.toLowerCase().includes(q) ||
          app.platformName.toLowerCase().includes(q) ||
          app.location.toLowerCase().includes(q) ||
          (app.salary && app.salary.toLowerCase().includes(q)) ||
          (app.contactDetails && app.contactDetails.toLowerCase().includes(q))
      );
    }

    // 3. Sorting
    list.sort((a, b) => {
      let valA = a[sortField]?.toString().toLowerCase() || '';
      let valB = b[sortField]?.toString().toLowerCase() || '';

      // Number comparison for salary if possible
      if (sortField === 'salary') {
        const numA = parseFloat(valA.replace(/[^0-9.]/g, '')) || 0;
        const numB = parseFloat(valB.replace(/[^0-9.]/g, '')) || 0;
        return sortOrder === 'asc' ? numA - numB : numB - numA;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return list;
  }, [applications, searchTerm, statusFilter, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="h-3.5 w-3.5 ml-1 text-slate-500 inline shrink-0" />
    ) : (
      <ChevronDown className="h-3.5 w-3.5 ml-1 text-slate-500 inline shrink-0" />
    );
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden" id="table-container">
      {/* Controls Bar */}
      <div className="p-5 border-b border-slate-200 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search company, job role, channel, or salary..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-2 border border-slate-200 rounded outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 bg-slate-50/50"
              id="search-input"
            />
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Showing {processedApplications.length} of {applications.length} listings</span>
          </div>
        </div>

        {/* Status Quick Filter Pills */}
        <div className="flex flex-wrap gap-1.5 pt-1 overflow-x-auto pb-1" id="filter-pills">
          {STATUS_PILLS.map((pill) => {
            const isActive = statusFilter === pill.value;
            // Count for current pill
            const count = pill.value === 'all' 
              ? applications.length 
              : applications.filter(app => app.status === pill.value).length;

            return (
              <button
                key={pill.value}
                onClick={() => setStatusFilter(pill.value)}
                className={`text-xs px-2.5 py-1 rounded border transition-all flex items-center space-x-1 shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-white border-slate-800 font-semibold shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{pill.label}</span>
                <span className={`px-1 rounded text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid or Table */}
      {processedApplications.length === 0 ? (
        <div className="p-12 text-center text-gray-400 select-none bg-gray-50/20" id="empty-search">
          <Search className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-600">No Applications Match</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            Try adjusting your search filters or add a new job listing to start tracking your submissions.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse" id="data-grid-table">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSort('companyName')}
                  className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Company Name {renderSortIndicator('companyName')}
                </th>
                <th
                  onClick={() => handleSort('roleName')}
                  className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Job / Role {renderSortIndicator('roleName')}
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3.5 px-5 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Submission Status {renderSortIndicator('status')}
                </th>
                <th className="py-3.5 px-4 font-semibold text-slate-500">Channel / Platform</th>
                <th className="py-3.5 px-4 font-semibold text-slate-500">Location</th>
                <th
                  onClick={() => handleSort('salary')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Salary / Comp {renderSortIndicator('salary')}
                </th>
                <th
                  onClick={() => handleSort('appliedDate')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Applied Date {renderSortIndicator('appliedDate')}
                </th>
                <th className="py-3.5 px-5 text-right font-semibold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
              {processedApplications.map((app) => (
                <tr
                  key={app.id}
                  className="hover:bg-slate-50/45 transition-colors group"
                >
                  {/* Company */}
                  <td className="py-4 px-5">
                    <div className="font-semibold text-gray-900 font-sans leading-snug">
                      {app.companyName}
                    </div>
                  </td>

                  {/* Role name */}
                  <td className="py-4 px-5">
                    <div className="font-medium text-slate-700 leading-snug">
                      {app.roleName}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center select-none ${
                        STATUS_BADGE_CLASSES[app.status] || ''
                      }`}
                    >
                      {STATUS_LABELS[app.status] || app.status}
                    </span>
                  </td>

                  {/* Channel / Platform */}
                  <td className="py-4 px-4 text-xs font-medium text-slate-500">
                    <span className="bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-slate-600">
                      {app.platformName}
                    </span>
                  </td>

                  {/* Location */}
                  <td className="py-4 px-4 text-xs">
                    <div className="flex items-center space-x-1 text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                      <span className="truncate max-w-[120px]">{app.location || 'Remote'}</span>
                    </div>
                  </td>

                  {/* Salary / Comp */}
                  <td className="py-4 px-4 text-xs font-mono font-medium">
                    {app.salary ? (
                      <div className="flex items-center text-slate-700">
                        <IndianRupee className="h-3 w-3 text-slate-400 mr-0.5 shrink-0" />
                        <span>{app.salary}</span>
                      </div>
                    ) : (
                      <span className="text-slate-350">-</span>
                    )}
                  </td>

                  {/* Applied Date */}
                  <td className="py-4 px-4 text-xs">
                    <div className="flex items-center space-x-1.5 text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{app.appliedDate}</span>
                    </div>
                  </td>

                  {/* Actions column */}
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end space-x-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Detailed Recruiter tooltip container */}
                      {app.contactDetails && (
                        <div className="relative group/tooltip">
                          <button
                            type="button"
                            title={app.contactDetails}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-help"
                          >
                            <Mail className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 bottom-full mb-1.5 hidden group-hover/tooltip:block bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded shadow-lg whitespace-nowrap z-50 font-sans">
                            {app.contactDetails}
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => onEdit(app)}
                        className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                        title="Edit entry"
                        id={`edit-btn-${app.id}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(app.id, app.companyName, app.roleName)}
                        className="p-1 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded transition-colors"
                        title="Delete entry"
                        id={`delete-btn-${app.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
