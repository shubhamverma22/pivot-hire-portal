import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight } from 'lucide-react';

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
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 -left-24 w-96 h-96 rounded-full bg-brand-600/20 blur-3xl" />
          <div className="absolute bottom-10 right-0 w-72 h-72 rounded-full bg-indigo-600/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-brand-500/10 blur-2xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center shadow-glow">
              <Sparkles size={17} className="text-white" />
            </div>
            <span className="text-xl font-display font-bold text-white">PivotHire</span>
          </div>
          <h2 className="text-4xl font-display font-bold leading-tight mb-6">
            Where founders<br />find their next<br />chapter.
          </h2>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed">
            The hiring platform built for ex-founders. Showcase your startup experience and connect with companies that value your unique perspective.
          </p>
        </div>
        <div className="relative z-10 text-slate-500 text-sm">
          © 2026 PivotHire. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center">
              <Sparkles size={17} className="text-brand-400" />
            </div>
            <span className="text-lg font-display font-bold text-slate-900">PivotHire</span>
          </div>

          <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Welcome back</h1>
          <p className="text-slate-500 mb-8">Sign in to your account to continue.</p>

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
          <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs font-medium text-slate-500 mb-2">Demo Credentials</p>
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
        </div>
      </div>
    </div>
  );
}
