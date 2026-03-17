import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardApi } from '../api/client';
import { StatCard, StatusBadge, PlanBadge, PageLoader, EmptyState, timeAgo } from '../components/UI';
import {
  Briefcase, FileText, Star, Eye, CheckCircle2, XCircle,
  ArrowRight, CreditCard, TrendingUp
} from 'lucide-react';

export default function FounderDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.founder().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return null;

  const plan = data.subscription?.plan || 'free';
  const usedApps = data.applications_this_month || 0;
  const limit = data.monthly_limit || 5;
  const usagePercent = plan === 'premium' ? 5 : Math.min((usedApps / limit) * 100, 100);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">
            Welcome back, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 mt-1">Here's an overview of your job search activity.</p>
        </div>
        <div className="flex items-center gap-3">
          <PlanBadge plan={plan} />
          <Link to="/jobs" className="btn-primary btn-sm">
            Browse Jobs <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Profile completion banner */}
      {data.profile && !data.profile.is_profile_complete && (
        <div className="card p-5 border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="font-medium text-amber-800">Complete your profile to stand out</p>
            <p className="text-sm text-amber-600">Companies see your full profile when you apply. A complete profile gets 3x more responses.</p>
          </div>
          <Link to="/profile" className="btn-sm bg-amber-600 text-white hover:bg-amber-700 rounded-xl">
            Complete Profile
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Applications" value={data.total_applications} accent="brand" />
        <StatCard icon={Briefcase} label="Available Jobs" value={data.total_available_jobs} accent="emerald" />
        <StatCard icon={Star} label="Shortlisted" value={data.status_breakdown?.shortlisted || 0} accent="amber" />
        <StatCard icon={Eye} label="Viewed" value={data.status_breakdown?.viewed || 0} accent="slate" />
      </div>

      {/* Usage meter */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-brand-600" />
            <span className="font-medium text-slate-800">Monthly Application Usage</span>
          </div>
          <span className="text-sm text-slate-500">
            {plan === 'premium' ? (
              <span className="text-brand-600 font-medium">Unlimited</span>
            ) : (
              <>{usedApps} / {limit} used</>
            )}
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${usagePercent >= 80 ? 'bg-red-500' : 'bg-brand-500'}`}
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        {plan === 'free' && usedApps >= limit && (
          <div className="mt-3 flex items-center gap-2">
            <p className="text-sm text-red-600">Monthly limit reached.</p>
            <Link to="/subscription" className="text-sm text-brand-600 font-medium hover:underline">
              Upgrade to Premium →
            </Link>
          </div>
        )}
      </div>

      {/* Recent Applications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-semibold text-slate-900">Recent Applications</h2>
          <Link to="/applications" className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {data.recent_applications?.length > 0 ? (
          <div className="space-y-3">
            {data.recent_applications.map((app) => (
              <div key={app.id} className="card-hover p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 truncate">{app.job?.title || 'Job'}</p>
                  <p className="text-sm text-slate-500">{app.job?.location} · {timeAgo(app.created_at)}</p>
                </div>
                <StatusBadge status={app.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="No applications yet"
            description="Start browsing jobs and apply to positions that match your skills."
            action={<Link to="/jobs" className="btn-primary btn-sm">Browse Jobs</Link>}
          />
        )}
      </div>
    </div>
  );
}
