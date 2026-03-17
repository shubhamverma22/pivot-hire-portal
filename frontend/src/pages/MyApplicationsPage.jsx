import { useState, useEffect } from 'react';
import { applicationsApi } from '../api/client';
import { StatusBadge, PageLoader, EmptyState, timeAgo, JobTypeLabel } from '../components/UI';
import { FileText, Building2, MapPin, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

const STATUSES = ['all', 'applied', 'viewed', 'shortlisted', 'rejected'];

export default function MyApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const status = filter === 'all' ? undefined : filter;
    setLoading(true);
    applicationsApi.myApplications(status).then(setApps).catch(console.error).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">My Applications</h1>
        <p className="text-slate-500 mt-1">Track the status of all your job applications.</p>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={clsx(
              'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
              filter === s
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border hover:bg-slate-50'
            )}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <PageLoader />
      ) : apps.length > 0 ? (
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="card-hover p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                  <Building2 size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{app.job?.title || 'Position'}</h3>
                      <p className="text-sm text-slate-500 flex items-center gap-2">
                        <span>{app.job?.company?.company_name || 'Company'}</span>
                        <span>·</span>
                        <MapPin size={12} /> {app.job?.location}
                      </p>
                    </div>
                    <StatusBadge status={app.status} />
                  </div>
                  {app.cover_letter && (
                    <p className="text-sm text-slate-500 mt-2 line-clamp-1 italic">"{app.cover_letter}"</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
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
          description="Browse available jobs and submit your first application."
          action={<Link to="/jobs" className="btn-primary btn-sm">Browse Jobs</Link>}
        />
      )}
    </div>
  );
}
