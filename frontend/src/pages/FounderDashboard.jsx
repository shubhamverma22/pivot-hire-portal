import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/client';
import { StatCard, StatusBadge, PlanBadge, PageLoader, EmptyState, timeAgo } from '../components/UI';
import {
  Briefcase, FileText, Star, Eye, ArrowRight, Zap, TrendingUp, CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';

export default function FounderDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.founder().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data)   return null;

  const plan      = data.subscription?.plan || 'free';
  const used      = data.applications_this_month || 0;
  const limit     = data.monthly_limit || 5;
  const isPremium = plan === 'premium';
  const pct       = isPremium ? 100 : Math.min((used / limit) * 100, 100);
  const nearLimit = !isPremium && used >= limit - 1;
  const atLimit   = !isPremium && used >= limit;

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mb-1">{greeting()}</p>
          <h1 className="page-title">{user?.full_name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening with your job search.</p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <PlanBadge plan={plan} />
          <Link to="/jobs" className="btn-primary btn-sm">
            Browse Jobs <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* ── Profile completion banner ── */}
      {data.profile && !data.profile.is_profile_complete && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Zap size={17} className="text-amber-600" strokeWidth={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-900">Complete your profile to stand out</p>
            <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
              Companies see your full profile. A complete profile gets 3× more responses.
            </p>
          </div>
          <Link to="/profile" className="btn-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg shrink-0 shadow-sm">
            Complete Profile
          </Link>
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={FileText}  label="Total Applications" value={data.total_applications}               accent="brand" />
        <StatCard icon={Briefcase} label="Jobs Available"      value={data.total_available_jobs}            accent="emerald" />
        <StatCard icon={Star}      label="Shortlisted"         value={data.status_breakdown?.shortlisted || 0} accent="amber" />
        <StatCard icon={Eye}       label="Profile Views"       value={data.status_breakdown?.viewed || 0}   accent="slate" />
      </div>

      {/* ── Usage meter ── */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Monthly Application Quota</span>
          </div>
          <span className="text-xs text-slate-500">
            {isPremium
              ? <span className="text-brand-600 font-semibold flex items-center gap-1"><CheckCircle2 size={12} /> Unlimited</span>
              : <><strong className={clsx('font-semibold', nearLimit ? 'text-red-600' : 'text-slate-800')}>{used}</strong>
                <span className="text-slate-400"> / {limit} used</span></>
            }
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full transition-all duration-700',
              isPremium ? 'bg-brand-400 opacity-40 w-full' :
              atLimit   ? 'bg-red-500' :
              nearLimit ? 'bg-amber-500' : 'bg-brand-500'
            )}
            style={!isPremium ? { width: `${pct}%` } : undefined}
          />
        </div>
        {atLimit && (
          <p className="mt-2.5 text-xs text-red-600 flex items-center gap-1.5">
            Monthly limit reached.{' '}
            <Link to="/subscription" className="font-semibold underline underline-offset-2">
              Upgrade to Premium →
            </Link>
          </p>
        )}
      </div>

      {/* ── Recent Applications ── */}
      <div>
        <div className="section-header">
          <h2 className="section-heading">Recent Applications</h2>
          <Link to="/applications" className="text-xs text-brand-600 font-medium hover:text-brand-700 flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {data.recent_applications?.length > 0 ? (
          <div className="space-y-2">
            {data.recent_applications.map((app) => (
              <div key={app.id} className="card p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                  <Briefcase size={15} className="text-brand-500" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{app.job?.title || 'Position'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {app.job?.company?.company_name || 'Company'} · {timeAgo(app.created_at)}
                  </p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No applications yet"
            description="Start applying to positions that match your founder background."
            action={<Link to="/jobs" className="btn-primary btn-sm mt-1">Browse Jobs</Link>}
          />
        )}
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
