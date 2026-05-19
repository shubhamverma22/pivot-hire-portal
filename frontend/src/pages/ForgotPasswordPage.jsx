import { useState } from 'react';
import { Link } from 'react-router-dom';
import { passwordApi } from '../api/client';
import { ArrowLeft, Mail } from 'lucide-react';
import { PivotHireLogo } from '../components/Logo';

const HEAD = "'Georgia', 'Times New Roman', serif";
const BODY = "'DM Sans', sans-serif";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await passwordApi.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0A0F08', fontFamily: BODY }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,102,0,0.1) 0%, transparent 60%)'
      }} />

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center mb-8">
          <PivotHireLogo size={28} />
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-float">
          {sent ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
                <Mail size={24} className="text-brand-600" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight" style={{ fontFamily: HEAD }}>Check your email</h1>
              <p className="text-slate-500 mb-6">
                If an account exists with <strong>{email}</strong>, we've sent a password reset link.
                Please check your inbox and spam folder.
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                <ArrowLeft size={16} /> Back to Sign in
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-slate-900 text-center mb-2 tracking-tight" style={{ fontFamily: HEAD }}>
                Forgot your password?
              </h1>
              <p className="text-slate-500 text-center mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    required
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Remember your password?{' '}
                <Link to="/login" className="text-brand-600 font-medium hover:text-brand-700">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>

        <p className="mt-6 text-center">
          <Link to="/" className="text-sm hover:text-white" style={{ color: 'rgba(248,245,240,0.52)' }}>← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
