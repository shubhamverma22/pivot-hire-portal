import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { jobsApi, applicationsApi } from '../api/client';
import { StatusBadge, PageLoader, EmptyState, Modal, Toast, timeAgo } from '../components/UI';
import {
  Users, CheckCircle2, XCircle, Eye, Linkedin, FileText, ChevronDown,
} from 'lucide-react';

export default function ManageCandidatesPage() {
  const [searchParams] = useSearchParams();
  const preselectedJob = searchParams.get('job');

  const [jobs,          setJobs]          = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(preselectedJob || '');
  const [applicants,    setApplicants]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [loadingApps,   setLoadingApps]   = useState(false);
  const [filters,       setFilters]       = useState({ skill: '', location: '', status: '' });
  const [selectedApp,   setSelectedApp]   = useState(null);
  const [toast,         setToast]         = useState(null);

  useEffect(() => {
    jobsApi.myPostings().then((data) => {
      setJobs(data);
      if (!selectedJobId && data.length > 0) setSelectedJobId(data[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedJobId) return;
    setLoadingApps(true);
    applicationsApi.jobApplications(selectedJobId, filters)
      .then(setApplicants).catch(console.error).finally(() => setLoadingApps(false));
  }, [selectedJobId, filters]);

  const handleStatusUpdate = async (appId, status) => {
    try {
      await applicationsApi.update(appId, { status });
      setToast({ message: `Candidate marked as ${status}`, type: 'success' });
      applicationsApi.jobApplications(selectedJobId, filters).then(setApplicants);
      setSelectedApp(null);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div>
        <h1 className="page-title">Candidates</h1>
        <p className="page-subtitle">Review applicants, filter by skills, and manage their status.</p>
      </div>

      {/* ── Filters ── */}
      <div className="card p-4">
        <div className="grid sm:grid-cols-4 gap-3">
          <div>
            <label className="label text-xs">Job Posting</label>
            <div className="relative">
              <select
                className="input appearance-none pr-8"
                value={selectedJobId}
                onChange={(e) => setSelectedJobId(e.target.value)}
              >
                <option value="">Select a job…</option>
                {jobs.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="label text-xs">Skill</label>
            <input className="input" placeholder="e.g. Python"
              value={filters.skill} onChange={(e) => setFilters({ ...filters, skill: e.target.value })} />
          </div>
          <div>
            <label className="label text-xs">Location</label>
            <input className="input" placeholder="e.g. Bengaluru"
              value={filters.location} onChange={(e) => setFilters({ ...filters, location: e.target.value })} />
          </div>
          <div>
            <label className="label text-xs">Status</label>
            <div className="relative">
              <select
                className="input appearance-none pr-8"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="applied">Applied</option>
                <option value="viewed">Viewed</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="rejected">Rejected</option>
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── List ── */}
      {!selectedJobId ? (
        <EmptyState icon={Users} title="Select a job" description="Choose a job posting above to see its applicants." />
      ) : loadingApps ? (
        <PageLoader />
      ) : applicants.length > 0 ? (
        <div className="space-y-2">
          {applicants.map((app) => (
            <div
              key={app.id}
              className="card-hover p-4 cursor-pointer"
              onClick={() => setSelectedApp(app)}
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex items-center justify-center shrink-0">
                  {app.candidate?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{app.candidate?.full_name}</h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {app.candidate_profile?.location || 'No location'}
                    {app.candidate_profile?.experience_years ? ` · ${app.candidate_profile.experience_years} yrs exp` : ''}
                    {' · '}Applied {timeAgo(app.created_at)}
                  </p>
                  {app.candidate_profile?.skills && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {app.candidate_profile.skills.split(',').slice(0, 5).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {app.status !== 'shortlisted' && (
                    <button
                      onClick={() => handleStatusUpdate(app.id, 'shortlisted')}
                      className="btn-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg"
                    >
                      <CheckCircle2 size={13} /> Shortlist
                    </button>
                  )}
                  {app.status !== 'rejected' && (
                    <button
                      onClick={() => handleStatusUpdate(app.id, 'rejected')}
                      className="btn-danger btn-sm"
                    >
                      <XCircle size={13} /> Reject
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={Users} title="No applicants" description="No candidates match your current filters." />
      )}

      {/* ── Candidate Detail Modal ── */}
      <Modal
        open={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        title={selectedApp?.candidate?.full_name || 'Candidate'}
        subtitle={selectedApp?.candidate?.email}
        wide
        footer={selectedApp && (
          <div className="flex gap-2">
            {selectedApp.status !== 'viewed' && (
              <button onClick={() => handleStatusUpdate(selectedApp.id, 'viewed')} className="btn-secondary flex-1">
                <Eye size={14} /> Mark Viewed
              </button>
            )}
            {selectedApp.status !== 'shortlisted' && (
              <button onClick={() => handleStatusUpdate(selectedApp.id, 'shortlisted')} className="btn-primary flex-1">
                <CheckCircle2 size={14} /> Shortlist
              </button>
            )}
            {selectedApp.status !== 'rejected' && (
              <button onClick={() => handleStatusUpdate(selectedApp.id, 'rejected')} className="btn-danger flex-1">
                <XCircle size={14} /> Reject
              </button>
            )}
          </div>
        )}
      >
        {selectedApp && (
          <div className="space-y-5">
            <StatusBadge status={selectedApp.status} />

            {selectedApp.candidate_profile && (
              <>
                {/* Meta grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['Location', selectedApp.candidate_profile.location],
                    ['Experience', selectedApp.candidate_profile.experience_years
                      ? `${selectedApp.candidate_profile.experience_years} years`
                      : null],
                  ].map(([label, val]) => val ? (
                    <div key={label} className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-slate-800">{val}</p>
                    </div>
                  ) : null)}
                </div>

                {selectedApp.candidate_profile.headline && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Headline</p>
                    <p className="text-sm text-slate-700">{selectedApp.candidate_profile.headline}</p>
                  </div>
                )}

                {selectedApp.candidate_profile.bio && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Bio</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{selectedApp.candidate_profile.bio}</p>
                  </div>
                )}

                {/* Startup experiences */}
                {selectedApp.candidate_profile.startup_experiences?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Startup Experience</p>
                    <div className="space-y-3">
                      {selectedApp.candidate_profile.startup_experiences.map((exp) => (
                        <div key={exp.id} className="bg-slate-50 rounded-lg p-3 text-sm">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-800">{exp.startup_name || 'Startup'}</p>
                            {exp.startup_status && (
                              <span className="text-xs text-slate-500 capitalize">{exp.startup_status}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {exp.startup_role}{exp.startup_duration ? ` · ${exp.startup_duration}` : ''}
                          </p>
                          {exp.startup_description && (
                            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{exp.startup_description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedApp.candidate_profile.skills && (
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedApp.candidate_profile.skills.split(',').map((s) => (
                        <span key={s} className="px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Links */}
                <div className="flex gap-2">
                  {selectedApp.candidate_profile.linkedin_url && (
                    <a href={selectedApp.candidate_profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
                      <Linkedin size={13} /> LinkedIn
                    </a>
                  )}
                  {(selectedApp.candidate_profile.resume_url || selectedApp.resume_url) && (
                    <a href={selectedApp.candidate_profile.resume_url || selectedApp.resume_url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
                      <FileText size={13} /> Resume
                    </a>
                  )}
                </div>
              </>
            )}

            {selectedApp.cover_letter && (
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cover Letter</p>
                <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 italic leading-relaxed border-l-2 border-brand-200">
                  "{selectedApp.cover_letter}"
                </div>
              </div>
            )}

          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
