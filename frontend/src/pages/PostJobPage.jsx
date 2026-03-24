import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../api/client';
import { Toast } from '../components/UI';
import { PlusCircle, Save } from 'lucide-react';

const JOB_TYPES = [
  { value: 'full_time', label: 'Full-Time' },
  { value: 'part_time', label: 'Part-Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'remote', label: 'Remote' },
];

export default function PostJobPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', role_type: 'full_time', location: '', salary_min: '',
    salary_max: '', currency: 'INR', description: '', requirements: '', skills_required: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        salary_min: form.salary_min ? parseInt(form.salary_min) : null,
        salary_max: form.salary_max ? parseInt(form.salary_max) : null,
      };
      await jobsApi.create(payload);
      setToast({ message: 'Job posted successfully!', type: 'success' });
      setTimeout(() => navigate('/my-jobs'), 1000);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">Post a Job</h1>
        <p className="text-slate-500 mt-1">Create a new job listing to attract top ex-founder talent.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-display font-semibold text-slate-900">Job Details</h2>
          <div>
            <label className="label">Job Title *</label>
            <input className="input" required placeholder="e.g. Senior Product Manager" value={form.title} onChange={update('title')} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Role Type</label>
              <select className="input" value={form.role_type} onChange={update('role_type')}>
                {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Location *</label>
              <input className="input" required placeholder="e.g. San Francisco, CA or Remote" value={form.location} onChange={update('location')} />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Min Salary</label>
              <input className="input" type="number" placeholder="e.g. 120000" value={form.salary_min} onChange={update('salary_min')} />
            </div>
            <div>
              <label className="label">Max Salary</label>
              <input className="input" type="number" placeholder="e.g. 180000" value={form.salary_max} onChange={update('salary_max')} />
            </div>
            <div>
              <label className="label">Currency</label>
              <select className="input" value={form.currency} onChange={update('currency')}>
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-display font-semibold text-slate-900">Description</h2>
          <div>
            <label className="label">Job Description *</label>
            <textarea className="input min-h-[150px] resize-y" required placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..." value={form.description} onChange={update('description')} />
          </div>
          <div>
            <label className="label">Requirements</label>
            <textarea className="input min-h-[100px] resize-y" placeholder="List key requirements, one per line..." value={form.requirements} onChange={update('requirements')} />
          </div>
          <div>
            <label className="label">Required Skills (comma-separated)</label>
            <input className="input" placeholder="e.g. Python, React, Product Management" value={form.skills_required} onChange={update('skills_required')} />
            {form.skills_required && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.skills_required.split(',').filter(Boolean).map((s) => (
                  <span key={s} className="px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs">{s.trim()}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary btn-lg">
          <PlusCircle size={18} /> {saving ? 'Posting...' : 'Publish Job'}
        </button>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
