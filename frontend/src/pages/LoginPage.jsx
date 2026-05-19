import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';
import { PivotHireLogo } from '../components/Logo';

const HEAD = "'Georgia', 'Times New Roman', serif";
const BODY = "'DM Sans', sans-serif";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel — dark branded */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#0A0F08', fontFamily: BODY }}>
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse 80% 60% at 30% 50%, rgba(28,60,10,0.5) 0%, transparent 65%)'
          }} />
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative z-10">
          <PivotHireLogo size={28} />
        </div>

        <div className="relative z-10" style={{ maxWidth: 400 }}>
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6"
            style={{ background: 'rgba(255,102,0,0.1)', border: '1px solid rgba(255,102,0,0.3)', color: '#FF6600', letterSpacing: '1px', fontFamily: BODY }}>
            The Relentless Registry
          </div>
          <h1 className="text-[42px] font-extrabold leading-[1.12] tracking-tight mb-5"
            style={{ color: '#F8F5F0', letterSpacing: '-1.5px', fontFamily: HEAD }}>
            "Startups don't just need employees. They need believers."
          </h1>
          <p className="text-base leading-relaxed" style={{ color: 'rgba(248,245,240,0.52)', fontFamily: BODY }}>
            The curated marketplace for ex-founders and the startups that need them most.
          </p>

          {/* Testimonial */}
          <div className="mt-10 rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-sm leading-relaxed mb-4 italic" style={{ color: '#F8F5F0', fontFamily: HEAD }}>
              "PivotHire got me a role at a Series A in 9 days. They matched my chaos-handling skills perfectly—no resume needed."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #1C3C0A, #FF6600)' }}>R</div>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#F8F5F0', fontFamily: BODY }}>Rahul M.</div>
                <div className="text-xs" style={{ color: 'rgba(248,245,240,0.52)', fontFamily: BODY }}>Ex-founder → Head of Growth, Fintech startup</div>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-sm" style={{ color: 'rgba(248,245,240,0.52)' }}>© 2026 PivotHire</p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white" style={{ fontFamily: BODY }}>
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <PivotHireLogo size={24} dark />
          </div>

          <h1 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight" style={{ fontFamily: HEAD }}>Welcome back</h1>
          <p className="text-slate-500 mb-8" style={{ fontFamily: BODY }}>Sign in to your account to continue.</p>

          {error && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                type="email" required className="input" placeholder="you@example.com"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="label">Password</label>
                <Link to="/forgot-password" className="text-xs text-brand-600 font-medium hover:text-brand-700">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password" required className="input" placeholder="••••••••"
                value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:text-brand-700">Create one</Link>
          </div>

          {/* Demo credentials */}
          <div className="mt-8 p-4 rounded-xl" style={{ background: '#FFF7ED', border: '1px solid #FFEDD5' }}>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="font-medium text-slate-700">Founder</p>
                <p className="text-slate-500">alex@example.com</p>
              </div>
              <div>
                <p className="font-medium text-slate-700">Company</p>
                <p className="text-slate-500">hire@acme.com</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-2">Password: password123</p>
          </div>

          <p className="mt-6 text-center">
            <Link to="/" className="text-sm text-slate-400 hover:text-slate-600">← Back to home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
