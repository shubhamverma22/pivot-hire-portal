import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/client';
import { StatCard, StatusBadge, PageLoader, EmptyState, timeAgo } from '../components/UI';
import { Briefcase, Users, UserCheck, PlusCircle, ArrowRight, Activity, Building2 } from 'lucide-react';
import clsx from 'clsx';

export default function CompanyDashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.company().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data)   return null;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">Company Overview</p>
          <h1 className="page-title">{data.profile?.company_name || 'Dashboard'}</h1>
          <p className="page-subtitle">Manage your job postings and review candidates.</p>
        </div>
        <Link to="/post-job" className="btn-primary btn-sm shrink-0">
          <PlusCircle size={14} /> Post a Job
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Briefcase} label="Total Jobs"       value={data.total_jobs}       accent="brand" />
        <StatCard icon={Activity}  label="Active Jobs"      value={data.active_jobs}      accent="emerald" />
        <StatCard icon={Users}     label="Total Applicants" value={data.total_applicants} accent="amber" />
        <StatCard icon={UserCheck} label="Shortlisted"      value={data.shortlisted}      accent="slate" />
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Recent Job Postings */}
        <div>
          <div className="section-header">
            <h2 className="section-heading">Recent Postings</h2>
            <Link to="/my-jobs" className="text-xs text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {data.recent_jobs?.length > 0 ? (
            <div className="space-y-2">
              {data.recent_jobs.map((job) => (
                <div key={job.id} className="card p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Briefcase size={15} className="text-slate-500" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{job.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{job.location} · {timeAgo(job.created_at)}</p>
                  </div>
                  <span className={clsx(
                    'badge',
                    job.is_active
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                      : 'bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200'
                  )}>
                    {job.is_active ? 'Active' : 'Closed'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Briefcase}
              title="No jobs posted yet"
              description="Create your first listing to start attracting founder talent."
              action={<Link to="/post-job" className="btn-primary btn-sm mt-1">Post a Job</Link>}
            />
          )}
        </div>

        {/* Recent Applicants */}
        <div>
          <div className="section-header">
            <h2 className="section-heading">Recent Applicants</h2>
            <Link to="/candidates" className="text-xs text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {data.recent_applicants?.length > 0 ? (
            <div className="space-y-2">
              {data.recent_applicants.map((app) => (
                <div key={app.id} className="card p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {app.candidate?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{app.candidate?.full_name}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">Applied to {app.job?.title}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="No applicants yet" description="Once you post a job, candidates will appear here." />
          )}
        </div>
      </div>
    </div>
  );
}
