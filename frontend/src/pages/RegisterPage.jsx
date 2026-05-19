import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Rocket, Building2 } from 'lucide-react';
import { PivotHireLogo } from '../components/Logo';
import clsx from 'clsx';

const HEAD = "'Georgia', 'Times New Roman', serif";
const BODY = "'DM Sans', sans-serif";

export default function RegisterPage() {
  const { registerFounder, registerCompany } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('founder');
  const [form, setForm] = useState({ full_name: '', email: '', password: '', company_name: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (role === 'founder') {
        await registerFounder({ full_name: form.full_name, email: form.email, password: form.password });
      } else {
        await registerCompany({ full_name: form.full_name, email: form.email, password: form.password, company_name: form.company_name });
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0A0F08', fontFamily: BODY }}>
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,102,0,0.12) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(28,60,10,0.3) 0%, transparent 50%)'
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="w-full max-w-lg relative z-10">
        <div className="flex items-center justify-center mb-8">
          <PivotHireLogo size={28} />
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-float">
          <h1 className="text-2xl font-extrabold text-slate-900 text-center mb-2 tracking-tight" style={{ fontFamily: HEAD }}>Create your account</h1>
          <p className="text-slate-500 text-center mb-6" style={{ fontFamily: BODY }}>Join PivotHire and start your next chapter.</p>

          {/* Role Selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('founder')}
              className={clsx(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                role === 'founder'
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              )}
            >
              <Rocket size={24} />
              <div>
                <p className="font-semibold text-sm">Ex-Founder</p>
                <p className="text-xs opacity-70">Looking for jobs</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setRole('company')}
              className={clsx(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                role === 'company'
                  ? 'border-brand-500 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              )}
            >
              <Building2 size={24} />
              <div>
                <p className="font-semibold text-sm">Company</p>
                <p className="text-xs opacity-70">Hiring talent</p>
              </div>
            </button>
          </div>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input
                type="text" required className="input" placeholder="John Doe"
                value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            </div>
            {role === 'company' && (
              <div>
                <label className="label">Company Name</label>
                <input
                  type="text" required className="input" placeholder="Acme Corp"
                  value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input
                type="email" required className="input" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password" required minLength={6} className="input" placeholder="Min. 6 characters"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
              {loading ? 'Creating account...' : 'Create account'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">Sign in</Link>
          </p>
        </div>

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm hover:text-white" style={{ color: 'rgba(248,245,240,0.52)' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
