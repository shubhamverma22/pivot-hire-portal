import { X } from 'lucide-react';
import clsx from 'clsx';

// ── Status Badge ──────────────────────────────────────────────────────────────
const statusStyles = {
  applied: 'badge-applied',
  viewed: 'badge-viewed',
  shortlisted: 'badge-shortlisted',
  rejected: 'badge-rejected',
};

export function StatusBadge({ status }) {
  return (
    <span className={statusStyles[status] || 'badge bg-slate-100 text-slate-600'}>
      {status?.replace('_', ' ')}
    </span>
  );
}

// ── Plan Badge ────────────────────────────────────────────────────────────────
export function PlanBadge({ plan }) {
  return (
    <span className={plan === 'premium' ? 'badge-premium' : 'badge-free'}>
      {plan === 'premium' ? '★ Premium' : 'Free'}
    </span>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
export function StatCard({ icon: Icon, label, value, accent = 'brand' }) {
  const colors = {
    brand: 'text-brand-600 bg-brand-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
    slate: 'text-slate-600 bg-slate-100',
  };
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center gap-3">
        <div className={clsx('p-2 rounded-xl', colors[accent])}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-2xl font-display font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx(
        'relative bg-white rounded-3xl shadow-float max-h-[85vh] overflow-y-auto animate-fade-in',
        wide ? 'w-full max-w-2xl' : 'w-full max-w-lg'
      )}>
        <div className="sticky top-0 bg-white/90 backdrop-blur-md flex items-center justify-between px-6 py-4 border-b rounded-t-3xl z-10">
          <h2 className="text-lg font-display font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="p-4 bg-slate-100 rounded-2xl mb-4">
          <Icon size={32} className="text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-display font-semibold text-slate-800 mb-1">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  );
}

// ── Loading Spinner ───────────────────────────────────────────────────────────
export function Spinner({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin text-brand-600">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Spinner size={36} />
    </div>
  );
}

// ── Toast Notification ────────────────────────────────────────────────────────
export function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;
  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-red-600',
    info: 'bg-brand-600',
  };
  return (
    <div className={clsx(
      'fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-float animate-fade-in',
      colors[type]
    )}>
      {message}
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X size={16} /></button>
    </div>
  );
}

// ── Job Type Label ────────────────────────────────────────────────────────────
const typeLabels = {
  full_time: 'Full-Time',
  part_time: 'Part-Time',
  contract: 'Contract',
  internship: 'Internship',
  remote: 'Remote',
};
export function JobTypeLabel({ type }) {
  return <span className="badge bg-brand-50 text-brand-700">{typeLabels[type] || type}</span>;
}

// ── Salary Format ─────────────────────────────────────────────────────────────
export function formatSalary(min, max, currency = 'INR') {
  const sym = currency === 'INR' ? '₹' : '$';
  const fmt = (n) => {
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
    return `${n}`;
  };
  if (!min && !max) return null;
  if (min && max) return `${sym}${fmt(min)} – ${sym}${fmt(max)}`;
  if (min) return `From ${sym}${fmt(min)}`;
  return `Up to ${sym}${fmt(max)}`;
}

// ── Time Ago ──────────────────────────────────────────────────────────────────
export function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}
