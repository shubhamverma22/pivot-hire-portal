import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsApi } from '../api/client';
import { PageLoader, EmptyState, JobTypeLabel, formatSalary, timeAgo, Toast } from '../components/UI';
import { Briefcase, PlusCircle, Users, Eye, EyeOff, Trash2 } from 'lucide-react';

export default function MyJobsPage() {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast,   setToast]   = useState(null);

  const fetchJobs = () => {
    setLoading(true);
    jobsApi.myPostings().then(setJobs).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(fetchJobs, []);

  const toggleActive = async (job) => {
    try {
      await jobsApi.update(job.id, { is_active: !job.is_active });
      setToast({ message: `Job ${job.is_active ? 'closed' : 'activated'}`, type: 'success' });
      fetchJobs();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = async (job) => {
    if (!window.confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    try {
      await jobsApi.delete(job.id);
      setToast({ message: 'Job deleted', type: 'success' });
      fetchJobs();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Job Postings</h1>
          <p className="page-subtitle">Manage your active and past listings.</p>
        </div>
        <Link to="/post-job" className="btn-primary btn-sm">
          <PlusCircle size={14} /> New Job
        </Link>
      </div>

      {/* ── List ── */}
      {jobs.length > 0 ? (
        <div className="space-y-2">
          {jobs.map((job) => (
            <div key={job.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-slate-900">{job.title}</h3>
                  <JobTypeLabel type={job.role_type} />
                  <span className={`badge ${job.is_active
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                    : 'bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200'}`}>
                    {job.is_active ? 'Active' : 'Closed'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {job.location}
                  {formatSalary(job.salary_min, job.salary_max) && (
                    <> · {formatSalary(job.salary_min, job.salary_max)}</>
                  )}
                  {' · '}{timeAgo(job.created_at)}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/candidates?job=${job.id}`}
                  className="btn-secondary btn-sm"
                >
                  <Users size={13} /> {job.application_count || 0}
                </Link>
                <button
                  onClick={() => toggleActive(job)}
                  className="btn-ghost btn-sm"
                  title={job.is_active ? 'Close job' : 'Activate job'}
                >
                  {job.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={() => handleDelete(job)}
                  className="btn-danger btn-sm"
                  title="Delete job"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No jobs posted yet"
          description="Create your first listing to start receiving applications from ex-founders."
          action={<Link to="/post-job" className="btn-primary btn-sm">Post a Job</Link>}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
