import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowRight, Rocket, Building2 } from 'lucide-react';
import clsx from 'clsx';

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
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center shadow-sm">
            <Sparkles size={17} className="text-brand-400" />
          </div>
          <span className="text-lg font-display font-bold text-slate-900">PivotHire</span>
        </div>

        <div className="card p-8">
          <h1 className="text-2xl font-display font-bold text-slate-900 text-center mb-2">Create your account</h1>
          <p className="text-slate-500 text-center mb-6">Join PivotHire and start your next chapter.</p>

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
      </div>
    </div>
  );
}
