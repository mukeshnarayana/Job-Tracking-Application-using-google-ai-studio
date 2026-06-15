import React, { useMemo } from 'react';
import { JobApplication, ApplicationStatus } from '../types';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Briefcase,
  Layers,
  CalendarDays,
  Percent,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
} from 'lucide-react';

interface AnalyticsPanelProps {
  applications: JobApplication[];
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  applied: { label: 'Applied', color: '#3b82f6' }, // Blue
  reply: { label: 'Reply Received', color: '#6366f1' }, // Indigo
  'no reply': { label: 'Awaiting' , color: '#f59e0b' }, // Amber
  shortlisted: { label: 'Shortlisted', color: '#0ea5e9' }, // Cyan / Sky
  'not shortlisted': { label: 'Not Shortlisted', color: '#f97316' }, // Orange
  selected: { label: 'Selected / Offer', color: '#10b981' }, // Emerald
  notselected: { label: 'Not Selected', color: '#f43f5e' }, // Rose
  rejected: { label: 'Rejected', color: '#ef4444' }, // Red
};

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ applications }) => {
  // 1. KPI Calculations
  const metrics = useMemo(() => {
    const total = applications.length;
    if (total === 0) {
      return { total: 0, pending: 0, hearingBack: 0, successRate: 0, interviewRate: 0 };
    }

    // Awaiting reply are: 'applied' and 'no reply'
    const pending = applications.filter((app) => app.status === 'applied' || app.status === 'no reply').length;
    
    // Responded applications
    const responded = applications.filter((app) => 
      app.status !== 'applied' && app.status !== 'no reply'
    ).length;

    // Interviewed / Shortlisted applications
    const shortlistedCount = applications.filter(
      (app) => app.status === 'shortlisted' || app.status === 'selected'
    ).length;

    // Selected / Offers
    const selectedCount = applications.filter((app) => app.status === 'selected').length;

    // Success rate is selected over total completed outcomes
    const resolvedOutcomes = applications.filter(
      (app) => app.status === 'selected' || app.status === 'notselected' || app.status === 'rejected'
    ).length;

    const successRate = resolvedOutcomes > 0 ? Math.round((selectedCount / resolvedOutcomes) * 100) : 0;
    const responseRate = Math.round((responded / total) * 100);
    const interviewRate = Math.round((shortlistedCount / total) * 100);

    return {
      total,
      pending,
      responded,
      successRate,
      interviewRate,
      responseRate,
    };
  }, [applications]);

  // 2. Chart 1: Status Distribution
  const statusData = useMemo(() => {
    const counts: Record<ApplicationStatus, number> = {
      applied: 0,
      reply: 0,
      'no reply': 0,
      shortlisted: 0,
      'not shortlisted': 0,
      selected: 0,
      notselected: 0,
      rejected: 0,
    };

    applications.forEach((app) => {
      if (counts[app.status] !== undefined) {
        counts[app.status]++;
      } else {
        counts.applied++;
      }
    });

    return Object.entries(counts)
      .map(([status, value]) => ({
        name: STATUS_CONFIG[status as ApplicationStatus]?.label || status,
        value,
        color: STATUS_CONFIG[status as ApplicationStatus]?.color || '#94a3b8',
      }))
      .filter((item) => item.value > 0);
  }, [applications]);

  // 3. Chart 2: Timeline (Grouped by Date)
  const timelineData = useMemo(() => {
    const datesMap: Record<string, number> = {};
    
    applications.forEach((app) => {
      if (app.appliedDate) {
        datesMap[app.appliedDate] = (datesMap[app.appliedDate] || 0) + 1;
      }
    });

    // Sort by chronological order
    const sortedDates = Object.keys(datesMap).sort();
    return sortedDates.map((date) => ({
      date,
      count: datesMap[date],
    })).slice(-10); // Look at last 10 dates for cleanliness
  }, [applications]);

  // 4. Chart 3: Platform Counts
  const platformData = useMemo(() => {
    const platformMap: Record<string, number> = {};
    applications.forEach((app) => {
      const platform = app.platformName.trim() || 'Direct';
      // Capitalize first letter beautifully
      const formatted = platform.charAt(0).toUpperCase() + platform.slice(1);
      platformMap[formatted] = (platformMap[formatted] || 0) + 1;
    });

    return Object.entries(platformMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // top 5 platforms
  }, [applications]);

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center" id="empty-analytics">
        <Layers className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-gray-700">No Application Analytics</h3>
        <p className="text-sm text-gray-400 mt-1 max-w-sm mx-auto">
          Add some job logs in the database table below to generate real-time metrics, status breakdowns, and pipeline charts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="analytics-panel">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Submissions</p>
            <p className="text-2xl font-bold font-sans text-slate-800">{metrics.total}</p>
          </div>
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
            <Briefcase className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Awaiting Reply</p>
            <p className="text-2xl font-bold font-sans text-amber-600">{metrics.pending}</p>
          </div>
          <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded flex items-center justify-center">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Interview / Shortlist Rate</p>
            <p className="text-2xl font-bold font-sans text-blue-600">{metrics.interviewRate}%</p>
          </div>
          <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded flex items-center justify-center">
            <Percent className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Offer Conversion</p>
            <p className="text-2xl font-bold font-sans text-emerald-600">{metrics.successRate}%</p>
          </div>
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="charts-grid">
        {/* Donut Chart - Status Breakdown */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between lg:col-span-1">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 tracking-wide mb-1">
              Status Distribution
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Breakdown of current application pipeline stages.
            </p>
          </div>
          <div className="h-48 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} Apps`, 'Volume']}
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <p className="text-xs text-slate-400 font-medium">Active Stages</p>
              <p className="text-xl font-bold text-slate-800">{statusData.length}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs max-h-24 overflow-y-auto">
            {statusData.map((item, index) => (
              <div key={index} className="flex items-center space-x-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 truncate">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Area Chart */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between lg:col-span-1">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 tracking-wide mb-1">
              Submission Velocity
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Daily trend of application submittals.
            </p>
          </div>
          {timelineData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sm text-slate-400 font-mono">
              Timeline data blank
            </div>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: '#94a3b8', fontSize: 10 }} 
                    stroke="#e2e8f0"
                    tickFormatter={(str) => {
                      try {
                        const parts = str.split('-');
                        return `${parts[1]}/${parts[2]}`;
                      } catch {
                        return str;
                      }
                    }}
                  />
                  <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#e2e8f0" />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px' }}
                  />
                  <Area type="monotone" dataKey="count" name="Applications" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-4 flex items-center space-x-2 text-xs text-gray-400">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Chronological list of recent application dates.</span>
          </div>
        </div>

        {/* Top Channels Bar Chart */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs flex flex-col justify-between lg:col-span-1">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 tracking-wide mb-1">
              Application Channels
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Successful job platforms with the highest pipeline activity.
            </p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={platformData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10 }} stroke="#e2e8f0" />
                <YAxis dataKey="name" type="category" tick={{ fill: '#475569', fontSize: 10 }} stroke="#e2e8f0" width={70} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '11px' }}
                />
                <Bar dataKey="value" name="Submissions" fill="#3b82f6" radius={[0, 4, 4, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex items-center space-x-1.5 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Sorted by total logged volume.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
