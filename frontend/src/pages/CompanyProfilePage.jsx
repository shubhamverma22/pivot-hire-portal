import { useState, useEffect } from 'react';
import { profileApi } from '../api/client';
import { PageLoader, Toast } from '../components/UI';
import { Building2, Save, Globe, MapPin, Users } from 'lucide-react';

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState({
    company_name: '', logo_url: '', website: '', industry: '',
    company_size: '', location: '', description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    profileApi.getCompanyProfile()
      .then((data) => {
        setProfile({
          company_name: data.company_name || '',
          logo_url: data.logo_url || '',
          website: data.website || '',
          industry: data.industry || '',
          company_size: data.company_size || '',
          location: data.location || '',
          description: data.description || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (field) => (e) => setProfile({ ...profile, [field]: e.target.value });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileApi.updateCompanyProfile(profile);
      setToast({ message: 'Company profile saved!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-display font-bold text-slate-900">Company Profile</h1>
        <p className="text-slate-500 mt-1">Keep your company profile up to date to attract the best candidates.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="card p-6">
          <h2 className="text-lg font-display font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-brand-600" /> Company Info
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Company Name *</label>
              <input className="input" required value={profile.company_name} onChange={update('company_name')} />
            </div>
            <div>
              <label className="label">Industry</label>
              <input className="input" placeholder="e.g. Technology, Healthcare" value={profile.industry} onChange={update('industry')} />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" placeholder="e.g. San Francisco, CA" value={profile.location} onChange={update('location')} />
            </div>
            <div>
              <label className="label">Company Size</label>
              <select className="input" value={profile.company_size} onChange={update('company_size')}>
                <option value="">Select...</option>
                <option value="1-10">1-10</option>
                <option value="10-50">10-50</option>
                <option value="50-200">50-200</option>
                <option value="200-500">200-500</option>
                <option value="500+">500+</option>
              </select>
            </div>
            <div>
              <label className="label">Website</label>
              <input className="input" placeholder="https://yourcompany.com" value={profile.website} onChange={update('website')} />
            </div>
            <div>
              <label className="label">Logo URL</label>
              <input className="input" placeholder="https://..." value={profile.logo_url} onChange={update('logo_url')} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Company Description</label>
              <textarea className="input min-h-[100px] resize-y" placeholder="Tell candidates about your company, culture, and mission..."
                value={profile.description} onChange={update('description')} />
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
