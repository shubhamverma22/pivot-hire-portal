import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationsApi } from '../api/client';
import { StatusBadge, PageLoader, EmptyState, timeAgo, JobTypeLabel } from '../components/UI';
import { FileText, Building2, MapPin } from 'lucide-react';
import clsx from 'clsx';

const STATUSES = [
  { key: 'all',         label: 'All' },
  { key: 'applied',     label: 'Applied' },
  { key: 'viewed',      label: 'Viewed' },
  { key: 'shortlisted', label: 'Shortlisted' },
  { key: 'rejected',    label: 'Rejected' },
];

export default function MyApplicationsPage() {
  const [apps,    setApps]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    const status = filter === 'all' ? undefined : filter;
    setLoading(true);
    applicationsApi.myApplications(status)
      .then(setApps)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div>
        <h1 className="page-title">My Applications</h1>
        <p className="page-subtitle">Track every application you've submitted.</p>
      </div>

      {/* ── Status Filters ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mb-0.5">
        {STATUSES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={clsx(
              'px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150 shrink-0',
              filter === key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Results ── */}
      {loading ? (
        <PageLoader />
      ) : apps.length > 0 ? (
        <div className="space-y-2">
          {apps.map((app) => (
            <div key={app.id} className="card p-4">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Building2 size={16} strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{app.job?.title || 'Position'}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        {app.job?.company?.company_name || 'Company'}
                        <span className="text-slate-300">·</span>
                        <MapPin size={11} className="shrink-0" />
                        {app.job?.location}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>

                  {app.cover_letter && (
                    <p className="text-xs text-slate-500 mt-2 line-clamp-1 italic">
                      "{app.cover_letter}"
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2.5 mt-2 text-xs text-slate-400">
                    <span>Applied {timeAgo(app.created_at)}</span>
                    {app.job?.role_type && <JobTypeLabel type={app.job.role_type} />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title={filter === 'all' ? 'No applications yet' : `No ${filter} applications`}
          description="Browse available jobs and start applying to positions that match your background."
          action={<Link to="/jobs" className="btn-primary btn-sm">Browse Jobs</Link>}
        />
      )}
    </div>
  );
}
