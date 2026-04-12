import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../api/client';
import { Toast } from '../components/UI';
import { PlusCircle, IndianRupee, EyeOff } from 'lucide-react';

const WORK_TYPES = [
  { value: 'full_time',  label: 'Full-Time' },
  { value: 'part_time',  label: 'Part-Time' },
  { value: 'contract',   label: 'Contract' },
  { value: 'internship', label: 'Internship' },
];

const LOCATION_TYPES = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

const SUGGESTED_TITLES = [
  'Senior Product Manager', 'Engineering Manager', 'Head of Growth',
  'VP Engineering', 'CTO', 'Backend Engineer', 'Full Stack Engineer',
  'Data Scientist', 'Head of Sales', 'DevOps Lead', 'Chief of Staff',
  'Business Development Manager', 'Head of Marketing', 'Product Designer',
];

export default function PostJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', role_type: 'full_time', location: '',
    salary_min: '', salary_max: '', currency: 'INR',
    salary_disclosed: true,
    description: '', requirements: '', skills_required: '',
  });
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState(null);
  const [skillInput,  setSkillInput]  = useState('');

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const addSkill = (raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const existing = form.skills_required
      ? form.skills_required.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    if (!existing.includes(trimmed)) {
      setForm({ ...form, skills_required: [...existing, trimmed].join(', ') });
    }
    setSkillInput('');
  };

  const removeSkill = (skill) => {
    const tags = form.skills_required.split(',').map((s) => s.trim()).filter((s) => s !== skill);
    setForm({ ...form, skills_required: tags.join(', ') });
  };

  const handleSkillKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput); }
    if (e.key === 'Backspace' && !skillInput) {
      const tags = form.skills_required ? form.skills_required.split(',').map((s) => s.trim()).filter(Boolean) : [];
      if (tags.length > 0) removeSkill(tags[tags.length - 1]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await jobsApi.create({
        ...form,
        salary_min: form.salary_disclosed && form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_disclosed && form.salary_max ? parseInt(form.salary_max) : null,
      });
      setToast({ message: 'Job posted successfully!', type: 'success' });
      setTimeout(() => navigate('/my-jobs'), 1200);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const skillTags = form.skills_required
    ? form.skills_required.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">

      {/* ── Header ── */}
      <div>
        <h1 className="page-title">Post a Job</h1>
        <p className="page-subtitle">Create a listing to attract experienced founder talent.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Basic Details ── */}
        <div className="card p-6 space-y-5">
          <h2 className="card-title">Job Details</h2>

          <div>
            <label className="label">Job Title *</label>
            <input
              className="input" required list="title-suggestions"
              placeholder="e.g. Senior Product Manager"
              value={form.title} onChange={update('title')}
            />
            <datalist id="title-suggestions">
              {SUGGESTED_TITLES.map((t) => <option key={t} value={t} />)}
            </datalist>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Work Type</label>
              <select className="input" value={form.role_type} onChange={update('role_type')}>
                {WORK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Location *</label>
              <input
                className="input" required list="location-suggestions"
                placeholder="e.g. Bengaluru, India"
                value={form.location} onChange={update('location')}
              />
              <datalist id="location-suggestions">
                {['Remote', 'Bengaluru, India', 'Mumbai, India', 'Delhi NCR, India',
                  'Hyderabad, India', 'Pune, India', 'Chennai, India', 'Pan India'].map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Salary */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Salary</label>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-brand-600"
                  checked={!form.salary_disclosed}
                  onChange={(e) => setForm({ ...form, salary_disclosed: !e.target.checked })}
                />
                <span className="text-xs text-slate-600 flex items-center gap-1">
                  <EyeOff size={12} /> Don't disclose salary
                </span>
              </label>
            </div>

            {form.salary_disclosed ? (
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="label text-xs text-slate-500">Min</label>
                  <div className="relative">
                    <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="input pl-8" type="number" placeholder="1500000"
                      value={form.salary_min} onChange={update('salary_min')} />
                  </div>
                </div>
                <div>
                  <label className="label text-xs text-slate-500">Max</label>
                  <div className="relative">
                    <IndianRupee size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input className="input pl-8" type="number" placeholder="2500000"
                      value={form.salary_max} onChange={update('salary_max')} />
                  </div>
                </div>
                <div>
                  <label className="label text-xs text-slate-500">Currency</label>
                  <select className="input" value={form.currency} onChange={update('currency')}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 border border-slate-200">
                <EyeOff size={13} /> Shown as "Competitive" to candidates
              </div>
            )}
          </div>
        </div>

        {/* ── Description ── */}
        <div className="card p-6 space-y-5">
          <h2 className="card-title">Description</h2>

          <div>
            <label className="label">Job Description *</label>
            <textarea className="input min-h-[140px] resize-y" required
              placeholder="Describe the role, responsibilities, and what makes this opportunity exciting…"
              value={form.description} onChange={update('description')} />
          </div>

          <div>
            <label className="label">Requirements <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea className="input min-h-[100px] resize-y"
              placeholder="List key requirements, one per line…"
              value={form.requirements} onChange={update('requirements')} />
          </div>

          <div>
            <label className="label">Required Skills <span className="text-slate-400 font-normal">(optional)</span></label>
            <div className="flex flex-wrap gap-1.5 p-2.5 border border-slate-300 rounded-lg min-h-[44px] bg-white focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-colors">
              {skillTags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-medium">
                  {tag}
                  <button type="button" onClick={() => removeSkill(tag)} className="hover:text-brand-900 text-sm leading-none">×</button>
                </span>
              ))}
              <input
                className="flex-1 min-w-[140px] outline-none text-sm placeholder-slate-400 bg-transparent py-0.5"
                placeholder={skillTags.length === 0 ? 'Python, React, Product Management…' : 'Add more…'}
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                onBlur={() => skillInput.trim() && addSkill(skillInput)}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1">Press Enter or comma to add a skill</p>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary btn-lg">
          <PlusCircle size={18} /> {saving ? 'Posting…' : 'Publish Job'}
        </button>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
