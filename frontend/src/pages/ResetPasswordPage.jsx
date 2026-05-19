import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { passwordApi } from '../api/client';
import { ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { PivotHireLogo } from '../components/Logo';

const HEAD = "'Georgia', 'Times New Roman', serif";
const BODY = "'DM Sans', sans-serif";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await passwordApi.resetPassword({ token, new_password: password });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0A0F08', fontFamily: BODY }}>
        <div className="fixed inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,102,0,0.1) 0%, transparent 60%)'
        }} />
        <div className="w-full max-w-md relative z-10">
          <div className="bg-white rounded-2xl p-8 shadow-float text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={24} className="text-red-600" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight" style={{ fontFamily: HEAD }}>Invalid link</h1>
            <p className="text-slate-500 mb-6">
              This password reset link is invalid or incomplete. Please request a new one.
            </p>
            <Link to="/forgot-password" className="btn-primary inline-flex items-center gap-2">
              Request new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
          {success ? (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 mb-2 tracking-tight" style={{ fontFamily: HEAD }}>Password reset!</h1>
              <p className="text-slate-500 mb-6">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>
              <Link to="/login" className="btn-primary inline-flex items-center gap-2">
                Sign in <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-extrabold text-slate-900 text-center mb-2 tracking-tight" style={{ fontFamily: HEAD }}>
                Set new password
              </h1>
              <p className="text-slate-500 text-center mb-6">
                Enter your new password below.
              </p>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="label">New password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="input"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Confirm password</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className="input"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full btn-lg">
                  {loading ? 'Resetting...' : 'Reset password'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
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
