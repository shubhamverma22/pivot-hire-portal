import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobsApi, applicationsApi } from '../api/client';
import { Modal, PageLoader, EmptyState, JobTypeLabel, formatSalary, timeAgo, Toast } from '../components/UI';
import { Search, MapPin, Filter, Briefcase, Building2, DollarSign, Send, CheckCircle2, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

const JOB_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
];

export default function BrowseJobsPage() {
  const { user, isFounder } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleType, setRoleType] = useState('');
  const [location, setLocation] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyModal, setApplyModal] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [applying, setApplying] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await jobsApi.list({ search, role_type: roleType, location });
      setJobs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, roleType, location]);

  useEffect(() => {
    const timer = setTimeout(fetchJobs, 300);
    return () => clearTimeout(timer);
  }, [fetchJobs]);

  const handleApply = async () => {
    if (!selectedJob) return;
    setApplying(true);
    try {
      await applicationsApi.apply({ job_id: selectedJob.id, cover_letter: coverLetter });
      setToast({ message: 'Application submitted!', type: 'success' });
      setApplyModal(false);
      setCoverLetter('');
      fetchJobs();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">Browse Jobs</h1>
        <p className="text-slate-500 mt-1">Find your next opportunity — built for founders like you.</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Search jobs..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="input" value={roleType} onChange={(e) => setRoleType(e.target.value)}>
            {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="relative">
            <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Location..." value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <PageLoader />
      ) : jobs.length > 0 ? (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="card-hover p-5 cursor-pointer" onClick={() => setSelectedJob(job)}>
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                  <Building2 size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">{job.title}</h3>
                      <p className="text-sm text-slate-500">{job.company?.company_name || 'Company'} · {job.location}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <JobTypeLabel type={job.role_type} />
                      {job.has_applied && (
                        <span className="badge bg-emerald-100 text-emerald-700"><CheckCircle2 size={12} className="mr-1" /> Applied</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-2">{job.description}</p>
                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                    {formatSalary(job.salary_min, job.salary_max) && (
                      <span className="flex items-center gap-1"><DollarSign size={12} /> {formatSalary(job.salary_min, job.salary_max)}</span>
                    )}
                    <span>{timeAgo(job.created_at)}</span>
                    <span>{job.application_count} applicant{job.application_count !== 1 ? 's' : ''}</span>
                  </div>
                  {job.skills_required && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.skills_required.split(',').map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Briefcase} title="No jobs found" description="Try adjusting your search filters." />
      )}

      {/* Job Detail Modal */}
      <Modal open={!!selectedJob && !applyModal} onClose={() => setSelectedJob(null)} title={selectedJob?.title || 'Job'} wide>
        {selectedJob && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600">
                <Building2 size={22} />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{selectedJob.company?.company_name}</p>
                <p className="text-sm text-slate-500">{selectedJob.location}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <JobTypeLabel type={selectedJob.role_type} />
              {formatSalary(selectedJob.salary_min, selectedJob.salary_max) && (
                <span className="badge bg-emerald-50 text-emerald-700">{formatSalary(selectedJob.salary_min, selectedJob.salary_max)}</span>
              )}
            </div>

            <div>
              <h4 className="font-medium text-slate-800 mb-2">Description</h4>
              <p className="text-sm text-slate-600 whitespace-pre-line">{selectedJob.description}</p>
            </div>

            {selectedJob.requirements && (
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Requirements</h4>
                <p className="text-sm text-slate-600 whitespace-pre-line">{selectedJob.requirements}</p>
              </div>
            )}

            {selectedJob.skills_required && (
              <div>
                <h4 className="font-medium text-slate-800 mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills_required.split(',').map((s) => (
                    <span key={s} className="px-3 py-1 rounded-lg bg-brand-50 text-brand-700 text-sm">{s.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            {isFounder && !selectedJob.has_applied && (
              <button onClick={() => setApplyModal(true)} className="btn-primary w-full btn-lg">
                <Send size={18} /> Apply Now
              </button>
            )}
            {selectedJob.has_applied && (
              <div className="flex items-center gap-2 text-emerald-600 font-medium justify-center py-3">
                <CheckCircle2 size={20} /> You've already applied to this job
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Apply Modal */}
      <Modal open={applyModal} onClose={() => setApplyModal(false)} title="Apply to Position">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Applying to <strong>{selectedJob?.title}</strong> at {selectedJob?.company?.company_name}
          </p>
          <div>
            <label className="label">Cover Letter (optional)</label>
            <textarea
              className="input min-h-[120px] resize-y"
              placeholder="Tell the hiring team why you're a great fit..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>
          <button onClick={handleApply} disabled={applying} className="btn-primary w-full">
            {applying ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
