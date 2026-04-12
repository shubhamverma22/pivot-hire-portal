import { useState, useEffect } from 'react';
import { profileApi } from '../api/client';
import { PageLoader, Toast } from '../components/UI';
import { Building2, Save, Globe, MapPin } from 'lucide-react';

const INDUSTRIES = [
  'Technology', 'Fintech', 'Edtech', 'Healthtech / Medtech', 'E-commerce',
  'Logistics & Supply Chain', 'AI / ML', 'D2C / Consumer Brands',
  'Gaming & Entertainment', 'Media & Content', 'Real Estate',
  'Travel & Hospitality', 'HR Tech', 'Legal Tech', 'Climate Tech',
  'Consulting', 'Manufacturing', 'Retail', 'Other',
];

const CATEGORIES = [
  'B2B SaaS', 'B2C App', 'B2B2C', 'Marketplace', 'Enterprise Software',
  'Consumer App', 'Platform / API', 'D2C Brand', 'Hardware', 'Other',
];

const LOCATIONS = [
  'Bengaluru, India', 'Mumbai, India', 'Delhi NCR, India', 'Hyderabad, India',
  'Pune, India', 'Chennai, India', 'Ahmedabad, India', 'Pan India',
  'San Francisco, CA', 'New York, NY', 'London, UK', 'Dubai, UAE', 'Singapore',
];

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState({
    company_name: '', logo_url: '', website: '', industry: '',
    category: '', company_size: '', location: '', description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [toast,   setToast]   = useState(null);

  useEffect(() => {
    profileApi.getCompanyProfile()
      .then((data) => setProfile({
        company_name: data.company_name || '',
        logo_url:     data.logo_url     || '',
        website:      data.website      || '',
        industry:     data.industry     || '',
        category:     data.category     || '',
        company_size: data.company_size || '',
        location:     data.location     || '',
        description:  data.description  || '',
      }))
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
    <div className="space-y-6 animate-fade-in max-w-2xl">

      {/* ── Header ── */}
      <div>
        <h1 className="page-title">Company Profile</h1>
        <p className="page-subtitle">Keep your profile complete to attract the best founder talent.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* ── Identity ── */}
        <div className="card p-6 space-y-5">
          <h2 className="card-title">
            <Building2 size={13} className="text-brand-500" /> Company Info
          </h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="label">Company Name *</label>
              <input className="input" required value={profile.company_name} onChange={update('company_name')} />
            </div>

            <div>
              <label className="label">Industry *</label>
              <select className="input" required value={profile.industry} onChange={update('industry')}>
                <option value="">Select industry…</option>
                {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Category *</label>
              <select className="input" required value={profile.category} onChange={update('category')}>
                <option value="">Select category…</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Location *</label>
              <input
                className="input" required list="company-loc-list"
                placeholder="e.g. Bengaluru, India"
                value={profile.location} onChange={update('location')}
              />
              <datalist id="company-loc-list">
                {LOCATIONS.map((l) => <option key={l} value={l} />)}
              </datalist>
            </div>

            <div>
              <label className="label">Company Size *</label>
              <select className="input" required value={profile.company_size} onChange={update('company_size')}>
                <option value="">Select size…</option>
                <option value="1-10">1 – 10</option>
                <option value="10-50">10 – 50</option>
                <option value="50-200">50 – 200</option>
                <option value="200-500">200 – 500</option>
                <option value="500+">500+</option>
              </select>
            </div>

            <div>
              <label className="label">Website *</label>
              <input className="input" required placeholder="https://yourcompany.com"
                value={profile.website} onChange={update('website')} />
            </div>

            <div>
              <label className="label">Logo URL <span className="text-slate-400 font-normal">(optional)</span></label>
              <input className="input" placeholder="https://yourcompany.com/logo.png"
                value={profile.logo_url} onChange={update('logo_url')} />
              {profile.logo_url && (
                <img
                  src={profile.logo_url} alt="Logo preview"
                  className="mt-2 h-9 w-auto object-contain rounded border border-slate-200"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>
          </div>
        </div>

        {/* ── About ── */}
        <div className="card p-6">
          <h2 className="card-title">About</h2>
          <label className="label">Company Description *</label>
          <textarea
            className="input min-h-[130px] resize-y" required
            placeholder="Tell candidates about your company, culture, mission, and what makes you unique…"
            value={profile.description} onChange={update('description')}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary btn-lg">
          <Save size={16} /> {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
