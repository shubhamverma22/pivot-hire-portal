import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/client';
import { StatCard, StatusBadge, PageLoader, EmptyState, timeAgo } from '../components/UI';
import {
  Briefcase, Users, UserCheck, PlusCircle, ArrowRight, Eye, Clock
} from 'lucide-react';

export default function CompanyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.company().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return null;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">
            {data.profile?.company_name || 'Company'} Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Manage your job postings and review candidates.</p>
        </div>
        <Link to="/post-job" className="btn-primary">
          <PlusCircle size={18} /> Post a Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Total Jobs" value={data.total_jobs} accent="brand" />
        <StatCard icon={Eye} label="Active Jobs" value={data.active_jobs} accent="emerald" />
        <StatCard icon={Users} label="Total Applicants" value={data.total_applicants} accent="amber" />
        <StatCard icon={UserCheck} label="Shortlisted" value={data.shortlisted} accent="slate" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Jobs */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-slate-900">Recent Postings</h2>
            <Link to="/my-jobs" className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {data.recent_jobs?.length > 0 ? (
            <div className="space-y-3">
              {data.recent_jobs.map((job) => (
                <div key={job.id} className="card-hover p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{job.title}</p>
                      <p className="text-sm text-slate-500">{job.location} · {timeAgo(job.created_at)}</p>
                    </div>
                    <span className={`badge ${job.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {job.is_active ? 'Active' : 'Closed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Briefcase} title="No jobs posted yet" description="Create your first job posting to start attracting talent."
              action={<Link to="/post-job" className="btn-primary btn-sm">Post a Job</Link>}
            />
          )}
        </div>

        {/* Recent Applicants */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-display font-semibold text-slate-900">Recent Applicants</h2>
            <Link to="/candidates" className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {data.recent_applicants?.length > 0 ? (
            <div className="space-y-3">
              {data.recent_applicants.map((app) => (
                <div key={app.id} className="card-hover p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                    {app.candidate?.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{app.candidate?.full_name}</p>
                    <p className="text-sm text-slate-500 truncate">Applied to {app.job?.title}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Users} title="No applicants yet" description="Once you post jobs, candidates will show up here." />
          )}
        </div>
      </div>
    </div>
  );
}
