import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { jobsApi, applicationsApi } from '../api/client';
import { StatusBadge, PageLoader, EmptyState, Modal, Toast, timeAgo } from '../components/UI';
import { Users, Search, MapPin, Filter, CheckCircle2, XCircle, Eye, Linkedin, FileText, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export default function ManageCandidatesPage() {
  const [searchParams] = useSearchParams();
  const preselectedJob = searchParams.get('job');

  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(preselectedJob || '');
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [filters, setFilters] = useState({ skill: '', location: '', status: '' });
  const [selectedApp, setSelectedApp] = useState(null);
  const [toast, setToast] = useState(null);

  // Load jobs
  useEffect(() => {
    jobsApi.myPostings().then((data) => {
      setJobs(data);
      if (!selectedJobId && data.length > 0) setSelectedJobId(data[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  // Load applicants for selected job
  useEffect(() => {
    if (!selectedJobId) return;
    setLoadingApps(true);
    applicationsApi.jobApplications(selectedJobId, filters)
      .then(setApplicants).catch(console.error).finally(() => setLoadingApps(false));
  }, [selectedJobId, filters]);

  const handleStatusUpdate = async (appId, status) => {
    try {
      await applicationsApi.update(appId, { status });
      setToast({ message: `Candidate ${status}`, type: 'success' });
      // Refresh
      applicationsApi.jobApplications(selectedJobId, filters).then(setApplicants);
      setSelectedApp(null);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">Manage Candidates</h1>
        <p className="text-slate-500 mt-1">Review applicants, filter by skill and experience, and manage their status.</p>
      </div>

      {/* Job Selector */}
      <div className="card p-4">
        <div className="grid sm:grid-cols-4 gap-3">
          <div className="sm:col-span-1">
            <label className="label text-xs">Select Job</label>
            <select className="input" value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)}>
              <option value="">Choose a job...</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Filter by Skill</label>
            <input className="input" placeholder="e.g. Python" value={filters.skill}
              onChange={(e) => setFilters({ ...filters, skill: e.target.value })} />
          </div>
          <div>
            <label className="label text-xs">Filter by Location</label>
            <input className="input" placeholder="e.g. Austin" value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })} />
          </div>
          <div>
            <label className="label text-xs">Status</label>
            <select className="input" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">All</option>
              <option value="applied">Applied</option>
              <option value="viewed">Viewed</option>
              <option value="shortlisted">Shortlisted</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Applicants List */}
      {!selectedJobId ? (
        <EmptyState icon={Users} title="Select a job" description="Choose a job posting above to view its applicants." />
      ) : loadingApps ? (
        <PageLoader />
      ) : applicants.length > 0 ? (
        <div className="space-y-3">
          {applicants.map((app) => (
            <div key={app.id} className="card-hover p-5 cursor-pointer" onClick={() => setSelectedApp(app)}>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-sm shrink-0">
                  {app.candidate?.full_name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-slate-900">{app.candidate?.full_name}</h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {app.candidate_profile?.location || 'Location not set'} · {app.candidate_profile?.experience_years || '?'} years exp · Applied {timeAgo(app.created_at)}
                  </p>
                  {app.candidate_profile?.skills && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {app.candidate_profile.skills.split(',').slice(0, 5).map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-xs">{s.trim()}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {app.status !== 'shortlisted' && (
                    <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(app.id, 'shortlisted'); }}
                      className="btn-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg">
                      <CheckCircle2 size={14} /> Shortlist
                    </button>
                  )}
                  {app.status !== 'rejected' && (
                    <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(app.id, 'rejected'); }}
                      className="btn-sm bg-red-50 text-red-600 hover:bg-red-100 rounded-lg">
                      <XCircle size={14} /> Reject
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

      {/* Candidate Detail Modal */}
      <Modal open={!!selectedApp} onClose={() => setSelectedApp(null)} title="Candidate Details" wide>
        {selectedApp && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xl">
                {selectedApp.candidate?.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{selectedApp.candidate?.full_name}</h3>
                <p className="text-sm text-slate-500">{selectedApp.candidate?.email}</p>
                <StatusBadge status={selectedApp.status} />
              </div>
            </div>

            {selectedApp.candidate_profile && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><p className="text-slate-500">Location</p><p className="font-medium">{selectedApp.candidate_profile.location || '—'}</p></div>
                  <div><p className="text-slate-500">Experience</p><p className="font-medium">{selectedApp.candidate_profile.experience_years || '—'} years</p></div>
                  <div><p className="text-slate-500">Startup</p><p className="font-medium">{selectedApp.candidate_profile.startup_name || '—'}</p></div>
                  <div><p className="text-slate-500">Role at Startup</p><p className="font-medium">{selectedApp.candidate_profile.startup_role || '—'}</p></div>
                </div>

                {selectedApp.candidate_profile.bio && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Bio</p>
                    <p className="text-sm text-slate-700">{selectedApp.candidate_profile.bio}</p>
                  </div>
                )}

                {selectedApp.candidate_profile.startup_description && (
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Startup Experience</p>
                    <p className="text-sm text-slate-700">{selectedApp.candidate_profile.startup_description}</p>
                  </div>
                )}

                {selectedApp.candidate_profile.skills && (
                  <div>
                    <p className="text-sm text-slate-500 mb-2">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedApp.candidate_profile.skills.split(',').map((s) => (
                        <span key={s} className="px-3 py-1 rounded-lg bg-brand-50 text-brand-700 text-sm">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  {selectedApp.candidate_profile.linkedin_url && (
                    <a href={selectedApp.candidate_profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
                      <Linkedin size={14} /> LinkedIn
                    </a>
                  )}
                  {selectedApp.candidate_profile.resume_url && (
                    <a href={selectedApp.candidate_profile.resume_url} target="_blank" rel="noopener noreferrer" className="btn-secondary btn-sm">
                      <FileText size={14} /> Resume
                    </a>
                  )}
                </div>
              </>
            )}

            {selectedApp.cover_letter && (
              <div>
                <p className="text-sm text-slate-500 mb-1">Cover Letter</p>
                <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-700 italic">
                  "{selectedApp.cover_letter}"
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              {selectedApp.status !== 'viewed' && (
                <button onClick={() => handleStatusUpdate(selectedApp.id, 'viewed')} className="btn-secondary flex-1">
                  <Eye size={16} /> Mark Viewed
                </button>
              )}
              {selectedApp.status !== 'shortlisted' && (
                <button onClick={() => handleStatusUpdate(selectedApp.id, 'shortlisted')} className="btn-primary flex-1">
                  <CheckCircle2 size={16} /> Shortlist
                </button>
              )}
              {selectedApp.status !== 'rejected' && (
                <button onClick={() => handleStatusUpdate(selectedApp.id, 'rejected')} className="btn-danger flex-1">
                  <XCircle size={16} /> Reject
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
