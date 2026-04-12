import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { jobsApi, applicationsApi } from '../api/client';
import { Modal, PageLoader, EmptyState, JobTypeLabel, formatSalary, timeAgo, Toast } from '../components/UI';
import { Search, MapPin, Briefcase, Building2, IndianRupee, Send, CheckCircle2, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

const JOB_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'full_time',  label: 'Full-Time' },
  { value: 'part_time',  label: 'Part-Time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote',     label: 'Remote' },
];

export default function BrowseJobsPage() {
  const { isFounder } = useAuth();
  const [jobs,        setJobs]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [roleType,    setRoleType]    = useState('');
  const [location,    setLocation]    = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [applyModal,  setApplyModal]  = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeUrl,   setResumeUrl]   = useState('');
  const [applying,    setApplying]    = useState(false);
  const [toast,       setToast]       = useState(null);

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
    const t = setTimeout(fetchJobs, 300);
    return () => clearTimeout(t);
  }, [fetchJobs]);

  const handleApply = async () => {
    if (!selectedJob) return;
    setApplying(true);
    try {
      await applicationsApi.apply({
        job_id: selectedJob.id,
        cover_letter: coverLetter,
        resume_url: resumeUrl || undefined,
      });
      setToast({ message: 'Application submitted successfully!', type: 'success' });
      setApplyModal(false);
      setCoverLetter('');
      setResumeUrl('');
      fetchJobs();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setApplying(false);
    }
  };

  const openApply = () => { setApplyModal(true); };
  const closeApply = () => { setApplyModal(false); };
  const closeDetail = () => { setSelectedJob(null); };

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div>
        <h1 className="page-title">Browse Jobs</h1>
        <p className="page-subtitle">Curated roles that value your founder experience.</p>
      </div>

      {/* ── Filters ── */}
      <div className="card p-4">
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search jobs or skills…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative">
            <select
              className="input appearance-none pr-9"
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
            >
              {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Location…"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Results ── */}
      {loading ? (
        <PageLoader />
      ) : jobs.length > 0 ? (
        <div className="space-y-2">
          {jobs.map((job) => (
            <button
              key={job.id}
              className="card-hover p-5 w-full text-left"
              onClick={() => setSelectedJob(job)}
            >
              <div className="flex gap-4">
                {/* Company icon */}
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                  <Building2 size={18} strokeWidth={1.5} />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Top row */}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{job.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {job.company?.company_name || 'Company'} · {job.location}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <JobTypeLabel type={job.role_type} />
                      {job.has_applied && (
                        <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                          <CheckCircle2 size={11} /> Applied
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">{job.description}</p>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400">
                    {job.salary_disclosed && formatSalary(job.salary_min, job.salary_max) && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <IndianRupee size={11} />
                        {formatSalary(job.salary_min, job.salary_max)}
                      </span>
                    )}
                    {!job.salary_disclosed && (
                      <span className="text-slate-400">Competitive</span>
                    )}
                    <span>{timeAgo(job.created_at)}</span>
                    <span>{job.application_count} applicant{job.application_count !== 1 ? 's' : ''}</span>
                  </div>

                  {/* Skills */}
                  {job.skills_required && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.skills_required.split(',').slice(0, 5).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">
                          {s.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Briefcase}
          title="No jobs found"
          description="Try adjusting your search or filters."
        />
      )}

      {/* ── Job Detail Modal ── */}
      <Modal
        open={!!selectedJob && !applyModal}
        onClose={closeDetail}
        title={selectedJob?.title || 'Job'}
        subtitle={`${selectedJob?.company?.company_name || ''} · ${selectedJob?.location || ''}`}
        wide
        footer={isFounder && (
          selectedJob?.has_applied ? (
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium justify-center py-1">
              <CheckCircle2 size={15} /> Already applied to this position
            </div>
          ) : (
            <button onClick={openApply} className="btn-primary w-full">
              <Send size={15} /> Apply Now
            </button>
          )
        )}
      >
        {selectedJob && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <JobTypeLabel type={selectedJob.role_type} />
              {selectedJob.salary_disclosed && formatSalary(selectedJob.salary_min, selectedJob.salary_max) && (
                <span className="badge bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200">
                  {formatSalary(selectedJob.salary_min, selectedJob.salary_max)}
                </span>
              )}
              {!selectedJob.salary_disclosed && (
                <span className="badge bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200">Competitive</span>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{selectedJob.description}</p>
            </div>

            {selectedJob.requirements && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Requirements</p>
                <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{selectedJob.requirements}</p>
              </div>
            )}

            {selectedJob.skills_required && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedJob.skills_required.split(',').map((s) => (
                    <span key={s} className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Apply Modal ── */}
      <Modal
        open={applyModal}
        onClose={closeApply}
        title="Submit Application"
        subtitle={`${selectedJob?.title} at ${selectedJob?.company?.company_name}`}
        footer={
          <button onClick={handleApply} disabled={applying} className="btn-primary w-full">
            {applying ? 'Submitting…' : 'Submit Application'}
          </button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Cover Letter <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea
              className="input min-h-[120px] resize-y"
              placeholder="Tell the hiring team why you're a great fit for this role…"
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Resume URL <span className="text-slate-400 font-normal">(optional)</span></label>
            <input
              className="input"
              placeholder="https://drive.google.com/… or your resume link"
              value={resumeUrl}
              onChange={(e) => setResumeUrl(e.target.value)}
            />
            <p className="text-xs text-slate-400 mt-1.5">Link a tailored resume for this specific role.</p>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
