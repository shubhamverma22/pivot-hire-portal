import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobsApi } from '../api/client';
import { PageLoader, EmptyState, JobTypeLabel, formatSalary, timeAgo, Toast } from '../components/UI';
import { Briefcase, PlusCircle, Users, Eye, EyeOff, Trash2, Edit } from 'lucide-react';

export default function MyJobsPage() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchJobs = () => {
    setLoading(true);
    jobsApi.myPostings().then(setJobs).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(fetchJobs, []);

  const toggleActive = async (job) => {
    try {
      await jobsApi.update(job.id, { is_active: !job.is_active });
      setToast({ message: `Job ${job.is_active ? 'deactivated' : 'activated'}`, type: 'success' });
      fetchJobs();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  const handleDelete = async (job) => {
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Job Postings</h1>
          <p className="text-slate-500 mt-1">Manage all your active and past job listings.</p>
        </div>
        <Link to="/post-job" className="btn-primary"><PlusCircle size={18} /> New Job</Link>
      </div>

      {jobs.length > 0 ? (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="card-hover p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-slate-900">{job.title}</h3>
                    <JobTypeLabel type={job.role_type} />
                    <span className={`badge ${job.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {job.is_active ? 'Active' : 'Closed'}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 mt-1">
                    {job.location} · {formatSalary(job.salary_min, job.salary_max) || 'Salary not specified'} · {timeAgo(job.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    to={`/candidates?job=${job.id}`}
                    className="btn-secondary btn-sm"
                  >
                    <Users size={14} /> {job.application_count || 0} Applicants
                  </Link>
                  <button onClick={() => toggleActive(job)} className="btn-ghost btn-sm" title={job.is_active ? 'Deactivate' : 'Activate'}>
                    {job.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => handleDelete(job)} className="btn-ghost btn-sm text-red-500 hover:bg-red-50" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Briefcase} title="No jobs posted yet" description="Create your first job posting to attract candidates."
          action={<Link to="/post-job" className="btn-primary btn-sm">Post a Job</Link>}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
