import { useState, useEffect } from 'react';
import { profileApi } from '../api/client';
import { PageLoader, Toast } from '../components/UI';
import { User, Save, Linkedin, FileText, Rocket, MapPin, Tag } from 'lucide-react';

export default function FounderProfilePage() {
  const [profile, setProfile] = useState({
    location: '', phone: '', bio: '', startup_name: '', startup_role: '',
    startup_duration: '', startup_description: '', linkedin_url: '',
    resume_url: '', portfolio_url: '', skills: '', experience_years: '',
    desired_roles: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    profileApi.getFounderProfile()
      .then((data) => {
        setProfile({
          location: data.location || '',
          phone: data.phone || '',
          bio: data.bio || '',
          startup_name: data.startup_name || '',
          startup_role: data.startup_role || '',
          startup_duration: data.startup_duration || '',
          startup_description: data.startup_description || '',
          linkedin_url: data.linkedin_url || '',
          resume_url: data.resume_url || '',
          portfolio_url: data.portfolio_url || '',
          skills: data.skills || '',
          experience_years: data.experience_years || '',
          desired_roles: data.desired_roles || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...profile, experience_years: profile.experience_years ? parseInt(profile.experience_years) : null };
      await profileApi.updateFounderProfile(payload);
      setToast({ message: 'Profile saved!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const update = (field) => (e) => setProfile({ ...profile, [field]: e.target.value });

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Complete your profile so companies know what makes you unique.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Info */}
        <div className="card p-6">
          <h2 className="text-lg font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User size={20} className="text-brand-600" /> Personal Info
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Location</label>
              <input className="input" placeholder="City, Country" value={profile.location} onChange={update('location')} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input" placeholder="+1 234 567 890" value={profile.phone} onChange={update('phone')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Bio</label>
              <textarea className="input min-h-[80px] resize-y" placeholder="Tell companies about yourself..." value={profile.bio} onChange={update('bio')} />
            </div>
          </div>
        </div>

        {/* Startup Experience */}
        <div className="card p-6">
          <h2 className="text-lg font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Rocket size={20} className="text-brand-600" /> Startup Experience
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Startup Name</label>
              <input className="input" placeholder="e.g. MyStartup Inc" value={profile.startup_name} onChange={update('startup_name')} />
            </div>
            <div>
              <label className="label">Your Role</label>
              <input className="input" placeholder="e.g. CEO & Co-founder" value={profile.startup_role} onChange={update('startup_role')} />
            </div>
            <div>
              <label className="label">Duration</label>
              <input className="input" placeholder="e.g. 2020-2023" value={profile.startup_duration} onChange={update('startup_duration')} />
            </div>
            <div>
              <label className="label">Years of Experience</label>
              <input className="input" type="number" placeholder="e.g. 5" value={profile.experience_years} onChange={update('experience_years')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Startup Description</label>
              <textarea className="input min-h-[80px] resize-y" placeholder="What did your startup do?" value={profile.startup_description} onChange={update('startup_description')} />
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="card p-6">
          <h2 className="text-lg font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Linkedin size={20} className="text-brand-600" /> Links
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">LinkedIn URL</label>
              <input className="input" placeholder="https://linkedin.com/in/..." value={profile.linkedin_url} onChange={update('linkedin_url')} />
            </div>
            <div>
              <label className="label">Resume URL</label>
              <input className="input" placeholder="Link to your resume" value={profile.resume_url} onChange={update('resume_url')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Portfolio URL</label>
              <input className="input" placeholder="Link to portfolio or personal site" value={profile.portfolio_url} onChange={update('portfolio_url')} />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="card p-6">
          <h2 className="text-lg font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Tag size={20} className="text-brand-600" /> Skills & Preferences
          </h2>
          <div className="space-y-4">
            <div>
              <label className="label">Skills (comma-separated)</label>
              <input className="input" placeholder="React, Python, Product Management" value={profile.skills} onChange={update('skills')} />
              {profile.skills && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {profile.skills.split(',').filter(Boolean).map((s) => (
                    <span key={s} className="px-2.5 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs">{s.trim()}</span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="label">Desired Roles (comma-separated)</label>
              <input className="input" placeholder="Product Manager, Engineering Lead" value={profile.desired_roles} onChange={update('desired_roles')} />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary btn-lg">
          <Save size={18} /> {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
