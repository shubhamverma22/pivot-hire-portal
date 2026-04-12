import { useState, useEffect } from 'react';
import { profileApi, experiencesApi } from '../api/client';
import { PageLoader, Toast, Modal } from '../components/UI';
import {
  User, Save, Linkedin, Github, FileText, Rocket,
  Tag, Plus, Pencil, Trash2, Star, ExternalLink,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────────

const COUNTRY_CODES = [
  { code: '+91',  label: '🇮🇳 +91'  },
  { code: '+1',   label: '🇺🇸 +1'   },
  { code: '+44',  label: '🇬🇧 +44'  },
  { code: '+61',  label: '🇦🇺 +61'  },
  { code: '+971', label: '🇦🇪 +971' },
  { code: '+65',  label: '🇸🇬 +65'  },
  { code: '+49',  label: '🇩🇪 +49'  },
  { code: '+33',  label: '🇫🇷 +33'  },
];

const STARTUP_ROLES = [
  'Founder', 'Co-founder', 'CEO & Co-founder', 'CTO & Co-founder',
  'COO & Co-founder', 'CPO & Co-founder', 'Technical Co-founder',
  'CEO', 'CTO', 'COO', 'CFO', 'CMO', 'VP Engineering', 'VP Product',
  'VP Sales', 'Other',
];

const FIELD_EXPERTISE = [
  'Product', 'Engineering', 'Growth', 'Sales', 'Marketing',
  'Operations', 'Design', 'Finance', 'Data & Analytics',
  'Business Development', 'HR & People', 'Other',
];

const INDUSTRIES = [
  'SaaS / Enterprise Software', 'Fintech', 'Edtech', 'Healthtech / Medtech',
  'E-commerce', 'Logistics & Supply Chain', 'AI / ML / Deep Tech',
  'D2C / Consumer Brands', 'Gaming & Entertainment', 'Media & Content',
  'Real Estate', 'Travel & Hospitality', 'HR Tech', 'Legal Tech',
  'Climate Tech', 'Social Impact', 'Other',
];

const INDUSTRY_CATEGORIES = [
  'B2B SaaS', 'B2C App', 'B2B2C', 'Marketplace', 'Enterprise',
  'SMB', 'D2C', 'Platform / API', 'Hardware', 'Other',
];

const STARTUP_STATUSES = [
  { value: 'active',       label: 'Active'       },
  { value: 'acquired',     label: 'Acquired'     },
  { value: 'discontinued', label: 'Discontinued' },
  { value: 'closed',       label: 'Closed'       },
  { value: 'bankruptcy',   label: 'Bankruptcy'   },
];

const STATUS_STYLE = {
  active:       'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200',
  acquired:     'bg-blue-50   text-blue-700   ring-1 ring-inset ring-blue-200',
  discontinued: 'bg-amber-50  text-amber-700  ring-1 ring-inset ring-amber-200',
  closed:       'bg-red-50    text-red-700    ring-1 ring-inset ring-red-200',
  bankruptcy:   'bg-red-100   text-red-800    ring-1 ring-inset ring-red-300',
};

const EMPTY_EXP = {
  startup_name: '', startup_link: '', startup_role: '', field_expertise: '',
  industry: '', industry_category: '', startup_status: '',
  startup_description: '', stage_description: '', startup_duration: '',
  is_primary: false,
};

const LOCATIONS = [
  'Bengaluru, India', 'Mumbai, India', 'Delhi NCR, India', 'Hyderabad, India',
  'Pune, India', 'Chennai, India', 'Ahmedabad, India', 'Remote',
  'San Francisco, CA', 'New York, NY', 'London, UK', 'Dubai, UAE', 'Singapore',
];

// ── SkillTagInput ──────────────────────────────────────────────────────────────

function SkillTagInput({ value, onChange, placeholder = 'Type and press Enter…' }) {
  const [input, setInput] = useState('');
  const tags = value ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];

  const add = (raw) => {
    const t = raw.trim();
    if (t && !tags.includes(t)) onChange([...tags, t].join(', '));
    setInput('');
  };
  const remove = (tag) => onChange(tags.filter((t) => t !== tag).join(', '));
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input); }
    if (e.key === 'Backspace' && !input && tags.length) remove(tags[tags.length - 1]);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 p-2.5 border border-slate-300 rounded-lg min-h-[42px] bg-white focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-colors">
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-medium ring-1 ring-inset ring-brand-200">
            {tag}
            <button type="button" onClick={() => remove(tag)} className="hover:text-red-600 leading-none ml-0.5">×</button>
          </span>
        ))}
        <input
          className="flex-1 min-w-[120px] outline-none text-sm text-slate-800 placeholder-slate-400 bg-transparent py-0.5"
          placeholder={tags.length === 0 ? placeholder : 'Add more…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => input.trim() && add(input)}
        />
      </div>
      <p className="text-xs text-slate-400 mt-1">Press Enter or comma to add</p>
    </div>
  );
}

// ── ExperienceCard ─────────────────────────────────────────────────────────────

function ExperienceCard({ exp, onEdit, onDelete }) {
  return (
    <div className="group relative border border-slate-200 rounded-xl p-4 bg-white hover:border-slate-300 hover:shadow-sm transition-all duration-150">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
          <Rocket size={16} className="text-brand-600" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900">{exp.startup_name || 'Unnamed Startup'}</h4>
            {exp.is_primary && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium ring-1 ring-inset ring-amber-200">
                <Star size={10} /> Primary
              </span>
            )}
            {exp.startup_status && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLE[exp.startup_status] || 'badge bg-slate-100 text-slate-600'}`}>
                {exp.startup_status}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {[exp.startup_role, exp.startup_duration].filter(Boolean).join(' · ')}
          </p>
          {(exp.field_expertise || exp.industry) && (
            <p className="text-xs text-slate-400 mt-0.5">
              {[exp.field_expertise, exp.industry, exp.industry_category].filter(Boolean).join(' · ')}
            </p>
          )}
          {exp.startup_description && (
            <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">{exp.startup_description}</p>
          )}
          {exp.startup_link && (
            <a href={exp.startup_link} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline mt-1">
              <ExternalLink size={10} /> {exp.startup_link}
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button type="button" onClick={() => onEdit(exp)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors">
            <Pencil size={13} />
          </button>
          <button type="button" onClick={() => onDelete(exp.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ExperienceForm ─────────────────────────────────────────────────────────────

function ExperienceForm({ form, onChange }) {
  const set = (field) => (e) => onChange({ ...form, [field]: e.target.value });
  const setCheck = (field) => (e) => onChange({ ...form, [field]: e.target.checked });

  return (
    <div className="space-y-5">

      {/* Section: Startup Identity */}
      <div>
        <p className="section-title mb-3">Startup</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Startup Name *</label>
            <input className="input" required placeholder="e.g. MyStartup Inc."
              value={form.startup_name} onChange={set('startup_name')} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Startup URL <span className="text-slate-400 font-normal">(optional)</span></label>
            <input className="input" placeholder="https://mystartup.com"
              value={form.startup_link} onChange={set('startup_link')} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.startup_status} onChange={set('startup_status')}>
              <option value="">Select status…</option>
              {STARTUP_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Duration</label>
            <input className="input" placeholder="e.g. 2020 – 2023"
              value={form.startup_duration} onChange={set('startup_duration')} />
          </div>
        </div>
      </div>

      {/* Section: Your Role */}
      <div>
        <p className="section-title mb-3">Your Role</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Role / Title</label>
            <select className="input" value={form.startup_role} onChange={set('startup_role')}>
              <option value="">Select role…</option>
              {STARTUP_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Field of Expertise</label>
            <select className="input" value={form.field_expertise} onChange={set('field_expertise')}>
              <option value="">Select field…</option>
              {FIELD_EXPERTISE.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Industry</label>
            <select className="input" value={form.industry} onChange={set('industry')}>
              <option value="">Select industry…</option>
              {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.industry_category} onChange={set('industry_category')}>
              <option value="">Select category…</option>
              {INDUSTRY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section: Details */}
      <div>
        <p className="section-title mb-3">Details</p>
        <div className="space-y-3">
          <div>
            <label className="label">What did your startup do?</label>
            <textarea className="input min-h-[80px] resize-y"
              placeholder="Describe the product/service, target market, and any traction…"
              value={form.startup_description} onChange={set('startup_description')} />
          </div>
          <div>
            <label className="label">Lessons learned <span className="text-slate-400 font-normal">(optional)</span></label>
            <textarea className="input min-h-[72px] resize-y"
              placeholder="Companies value founders who reflect honestly on failure…"
              value={form.stage_description} onChange={set('stage_description')} />
          </div>
        </div>
      </div>

      {/* Primary flag */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors">
        <input type="checkbox" className="w-4 h-4 rounded accent-brand-600"
          checked={form.is_primary} onChange={setCheck('is_primary')} />
        <div>
          <p className="text-sm font-medium text-slate-800">Mark as primary experience</p>
          <p className="text-xs text-slate-500">Shown first on your profile</p>
        </div>
      </label>
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({ icon: Icon, title, children }) {
  return (
    <div className="card p-5">
      <h2 className="card-title">
        <Icon size={13} className="text-brand-500" /> {title}
      </h2>
      {children}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function FounderProfilePage() {
  const [profile, setProfile] = useState({
    location: '', phone: '', headline: '', bio: '', avatar_url: '',
    linkedin_url: '', github_url: '', resume_url: '', portfolio_url: '',
    skills: '', experience_years: '', desired_roles: '',
  });
  const [countryCode,  setCountryCode]  = useState('+91');
  const [experiences,  setExperiences]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);
  const [expModal,     setExpModal]     = useState(false);
  const [editingExpId, setEditingExpId] = useState(null);
  const [expForm,      setExpForm]      = useState(EMPTY_EXP);
  const [savingExp,    setSavingExp]    = useState(false);

  // ── Load data ──
  useEffect(() => {
    Promise.all([profileApi.getFounderProfile(), experiencesApi.list()])
      .then(([pd, exps]) => {
        let phone = pd.phone || '';
        let code = '+91';
        const match = COUNTRY_CODES.find((c) => phone.startsWith(c.code));
        if (match) { code = match.code; phone = phone.slice(match.code.length).trim(); }
        setCountryCode(code);
        setProfile({
          location:      pd.location      || '',
          phone,
          headline:      pd.headline      || '',
          bio:           pd.bio           || '',
          avatar_url:    pd.avatar_url    || '',
          linkedin_url:  pd.linkedin_url  || '',
          github_url:    pd.github_url    || '',
          resume_url:    pd.resume_url    || '',
          portfolio_url: pd.portfolio_url || '',
          skills:        pd.skills        || '',
          experience_years: pd.experience_years || '',
          desired_roles: pd.desired_roles || '',
        });
        setExperiences(exps || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (field) => (e) => setProfile({ ...profile, [field]: e.target.value });

  // ── Save profile ──
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...profile,
        phone: profile.phone ? `${countryCode} ${profile.phone}` : '',
        experience_years: profile.experience_years ? parseInt(profile.experience_years) : null,
      };
      await profileApi.updateFounderProfile(payload);
      setToast({ message: 'Profile saved!', type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ── Experience CRUD ──
  const openAdd = () => { setEditingExpId(null); setExpForm(EMPTY_EXP); setExpModal(true); };
  const openEdit = (exp) => {
    setEditingExpId(exp.id);
    setExpForm({
      startup_name:        exp.startup_name        || '',
      startup_link:        exp.startup_link        || '',
      startup_role:        exp.startup_role        || '',
      field_expertise:     exp.field_expertise     || '',
      industry:            exp.industry            || '',
      industry_category:   exp.industry_category   || '',
      startup_status:      exp.startup_status      || '',
      startup_description: exp.startup_description || '',
      stage_description:   exp.stage_description   || '',
      startup_duration:    exp.startup_duration    || '',
      is_primary:          exp.is_primary          || false,
    });
    setExpModal(true);
  };

  const handleSaveExp = async () => {
    if (!expForm.startup_name.trim()) {
      setToast({ message: 'Startup name is required', type: 'error' }); return;
    }
    setSavingExp(true);
    try {
      const payload = { ...expForm, startup_status: expForm.startup_status || null };
      if (editingExpId) {
        const updated = await experiencesApi.update(editingExpId, payload);
        setExperiences((prev) => prev.map((e) => e.id === editingExpId ? updated : e));
      } else {
        const created = await experiencesApi.create(payload);
        setExperiences((prev) => [...prev, created]);
      }
      setExpModal(false);
      setToast({ message: `Experience ${editingExpId ? 'updated' : 'added'}!`, type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setSavingExp(false);
    }
  };

  const handleDeleteExp = async (id) => {
    if (!window.confirm('Delete this startup experience?')) return;
    try {
      await experiencesApi.delete(id);
      setExperiences((prev) => prev.filter((e) => e.id !== id));
      setToast({ message: 'Experience removed', type: 'success' });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">

      {/* Header */}
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Complete your profile so companies know what makes you unique.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">

        {/* ── Personal Info ── */}
        <Section icon={User} title="Personal Info">
          <div className="space-y-4">
            {/* Avatar preview inline */}
            {profile.avatar_url && (
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <img src={profile.avatar_url} alt="Avatar preview"
                  className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                  onError={(e) => { e.target.style.display = 'none'; }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700">Profile Photo</p>
                  <input className="input mt-1 text-xs py-1.5" placeholder="https://example.com/photo.jpg"
                    value={profile.avatar_url} onChange={update('avatar_url')} />
                </div>
              </div>
            )}
            {!profile.avatar_url && (
              <div>
                <label className="label">Profile Photo URL <span className="text-slate-400 font-normal">(optional)</span></label>
                <input className="input" placeholder="https://example.com/photo.jpg"
                  value={profile.avatar_url} onChange={update('avatar_url')} />
              </div>
            )}

            <div>
              <label className="label">Headline</label>
              <input className="input" placeholder="e.g. Ex-founder · Product & Growth · 2x Startup"
                value={profile.headline} onChange={update('headline')} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Location</label>
                <input className="input" list="loc-list" placeholder="City, Country"
                  value={profile.location} onChange={update('location')} />
                <datalist id="loc-list">
                  {LOCATIONS.map((l) => <option key={l} value={l} />)}
                </datalist>
              </div>
              <div>
                <label className="label">Phone <span className="text-slate-400 font-normal">(optional)</span></label>
                <div className="flex gap-2">
                  <select className="input w-28 shrink-0" value={countryCode} onChange={(e) => setCountryCode(e.target.value)}>
                    {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                  <input className="input flex-1" placeholder="98765 43210"
                    value={profile.phone} onChange={update('phone')} />
                </div>
              </div>
            </div>

            <div>
              <label className="label">Bio</label>
              <textarea className="input min-h-[90px] resize-y"
                placeholder="Tell companies about your journey and what you're looking for…"
                value={profile.bio} onChange={update('bio')} />
            </div>
          </div>
        </Section>

        {/* ── Links ── */}
        <Section icon={Linkedin} title="Links">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">LinkedIn *</label>
              <input className="input" placeholder="https://linkedin.com/in/…"
                value={profile.linkedin_url} onChange={update('linkedin_url')} />
            </div>
            <div>
              <label className="label">GitHub <span className="text-slate-400 font-normal">(optional)</span></label>
              <input className="input" placeholder="https://github.com/…"
                value={profile.github_url} onChange={update('github_url')} />
            </div>
            <div>
              <label className="label">Resume Link *</label>
              <input className="input" placeholder="Google Drive or Dropbox link…"
                value={profile.resume_url} onChange={update('resume_url')} />
            </div>
            <div>
              <label className="label">Portfolio / Site <span className="text-slate-400 font-normal">(optional)</span></label>
              <input className="input" placeholder="https://yoursite.com"
                value={profile.portfolio_url} onChange={update('portfolio_url')} />
            </div>
          </div>
        </Section>

        {/* ── Skills & Preferences ── */}
        <Section icon={Tag} title="Skills & Preferences">
          <div className="space-y-4">
            <div>
              <label className="label">Skills *</label>
              <SkillTagInput value={profile.skills}
                onChange={(v) => setProfile({ ...profile, skills: v })}
                placeholder="React, Python, Product Management…" />
            </div>
            <div>
              <label className="label">Desired Roles <span className="text-slate-400 font-normal">(optional)</span></label>
              <SkillTagInput value={profile.desired_roles}
                onChange={(v) => setProfile({ ...profile, desired_roles: v })}
                placeholder="Product Manager, VP Engineering…" />
            </div>
            <div className="w-36">
              <label className="label">Years of Experience</label>
              <input className="input" type="number" min="0" max="50" placeholder="e.g. 7"
                value={profile.experience_years} onChange={update('experience_years')} />
            </div>
          </div>
        </Section>

        <button type="submit" disabled={saving} className="btn-primary btn-lg">
          <Save size={16} /> {saving ? 'Saving…' : 'Save Profile'}
        </button>
      </form>

      {/* ── Startup Experiences ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="card-title mb-0.5">
              <Rocket size={13} className="text-brand-500" /> Startup Experiences
            </h2>
            <p className="text-xs text-slate-400">At least one required for a complete profile</p>
          </div>
          <button type="button" onClick={openAdd} className="btn-secondary btn-sm">
            <Plus size={13} /> Add
          </button>
        </div>

        {experiences.length === 0 ? (
          <button type="button" onClick={openAdd}
            className="w-full border-2 border-dashed border-slate-200 rounded-xl py-8 flex flex-col items-center gap-2 text-slate-400 hover:border-brand-300 hover:text-brand-600 transition-colors">
            <Rocket size={24} strokeWidth={1.5} />
            <p className="text-sm font-medium">Add your first startup experience</p>
            <p className="text-xs">Tell companies about your founder journey</p>
          </button>
        ) : (
          <div className="space-y-2">
            {experiences.map((exp) => (
              <ExperienceCard key={exp.id} exp={exp} onEdit={openEdit} onDelete={handleDeleteExp} />
            ))}
            <button type="button" onClick={openAdd}
              className="w-full border border-dashed border-slate-200 rounded-xl py-3 text-xs text-slate-400 hover:border-brand-300 hover:text-brand-600 transition-colors flex items-center justify-center gap-1.5">
              <Plus size={13} /> Add another experience
            </button>
          </div>
        )}
      </div>

      {/* ── Experience Modal ── */}
      <Modal
        open={expModal}
        onClose={() => setExpModal(false)}
        title={editingExpId ? 'Edit Experience' : 'Add Startup Experience'}
        subtitle="Tell companies about your founder journey"
        wide
        footer={
          <div className="flex gap-2">
            <button type="button" onClick={handleSaveExp} disabled={savingExp} className="btn-primary flex-1">
              {savingExp ? 'Saving…' : editingExpId ? 'Update Experience' : 'Add Experience'}
            </button>
            <button type="button" onClick={() => setExpModal(false)} className="btn-secondary px-5">
              Cancel
            </button>
          </div>
        }
      >
        <ExperienceForm form={expForm} onChange={setExpForm} />
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
