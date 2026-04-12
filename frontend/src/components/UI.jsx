import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import clsx from 'clsx';

// ── Status Badge ──────────────────────────────────────────────────────────────
const statusConfig = {
  applied:    { cls: 'badge-applied',     label: 'Applied' },
  viewed:     { cls: 'badge-viewed',      label: 'Viewed' },
  shortlisted:{ cls: 'badge-shortlisted', label: 'Shortlisted' },
  rejected:   { cls: 'badge-rejected',    label: 'Rejected' },
  draft:      { cls: 'badge-free',        label: 'Draft' },
};

export function StatusBadge({ status }) {
  const cfg = statusConfig[status];
  return (
    <span className={cfg ? cfg.cls : 'badge bg-slate-100 text-slate-600'}>
      {cfg ? cfg.label : status}
    </span>
  );
}

// ── Plan Badge ────────────────────────────────────────────────────────────────
export function PlanBadge({ plan }) {
  return plan === 'premium'
    ? <span className="badge-premium">✦ Premium</span>
    : <span className="badge-free">Free</span>;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
const accentColors = {
  brand:   'text-brand-600 bg-brand-50',
  emerald: 'text-emerald-600 bg-emerald-50',
  amber:   'text-amber-600 bg-amber-50',
  red:     'text-red-600 bg-red-50',
  slate:   'text-slate-500 bg-slate-100',
};

export function StatCard({ icon: Icon, label, value, accent = 'brand', hint }) {
  return (
    <div className="stat-card animate-fade-in">
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', accentColors[accent])}>
        <Icon size={19} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-display font-bold text-slate-900 leading-none tracking-tight">{value ?? 0}</p>
        <p className="text-xs text-slate-500 font-medium mt-1 truncate">{label}</p>
        {hint && <p className="text-xs text-slate-400 mt-0.5">{hint}</p>}
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, wide, subtitle }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  // Render into document.body via portal — this completely escapes any parent
  // CSS transforms (animate-fade-in uses translateY) which would otherwise break
  // position:fixed and cause the modal to appear in the wrong position.
  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(15,23,42,0.65)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Centering shell */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        pointerEvents: 'none',
      }}>
        {/* Panel */}
        <div
          className={clsx('animate-scale-in', wide ? 'max-w-2xl' : 'max-w-lg')}
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxHeight: 'calc(100vh - 40px)',
            display: 'flex',
            flexDirection: 'column',
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.20), 0 8px 24px rgba(0,0,0,0.12)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #f1f5f9',
            flexShrink: 0,
          }}>
            <div style={{ minWidth: 0, paddingRight: '16px' }}>
              <h2 className="text-[15px] font-display font-semibold text-slate-900 truncate">{title}</h2>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5 truncate">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Body — flex:1 1 auto shrinks when panel hits maxHeight, then scrolls */}
          <div style={{ flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>
            <div style={{ padding: '20px' }}>{children}</div>
          </div>

          {/* Footer */}
          {footer && (
            <div style={{
              flexShrink: 0,
              padding: '16px 20px',
              borderTop: '1px solid #f1f5f9',
              background: 'rgba(248,250,252,0.85)',
            }}>
              {footer}
            </div>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-4">
          <Icon size={22} className="text-slate-400" strokeWidth={1.5} />
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-xs leading-relaxed mb-5">{description}</p>
      )}
      {action}
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 22, className = '' }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      className={clsx('animate-spin text-brand-600', className)}
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" opacity="0.15" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Spinner size={32} />
    </div>
  );
}

// ── Toast Notification ────────────────────────────────────────────────────────
const toastConfig = {
  success: { icon: CheckCircle, bg: 'bg-slate-900', iconCls: 'text-emerald-400' },
  error:   { icon: AlertCircle, bg: 'bg-slate-900', iconCls: 'text-red-400' },
  info:    { icon: Info,        bg: 'bg-slate-900', iconCls: 'text-blue-400' },
};

export function Toast({ message, type = 'success', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, onClose, duration]);

  if (!message) return null;
  const { icon: Icon, bg, iconCls } = toastConfig[type] || toastConfig.info;

  return (
    <div className={clsx(
      'fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-float text-white text-sm font-medium animate-slide-up max-w-sm',
      bg
    )}>
      <Icon size={16} className={clsx('shrink-0', iconCls)} />
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="ml-1 p-0.5 hover:opacity-70 shrink-0 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
}

// ── Job Type Label ────────────────────────────────────────────────────────────
const typeLabels = {
  full_time:  'Full-Time',
  part_time:  'Part-Time',
  contract:   'Contract',
  internship: 'Internship',
  remote:     'Remote',
  hybrid:     'Hybrid',
  onsite:     'On-site',
};

export function JobTypeLabel({ type }) {
  return (
    <span className="badge bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
      {typeLabels[type] || type}
    </span>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ label }) {
  if (!label) return <hr className="border-slate-200 my-4" />;
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

// ── Salary Formatter ──────────────────────────────────────────────────────────
export function formatSalary(min, max, currency = 'INR') {
  const sym = { INR: '₹', USD: '$', EUR: '€', GBP: '£' }[currency] || currency;
  const fmt = (n) => {
    if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000)   return `${(n / 100000).toFixed(1)}L`;
    if (n >= 1000)     return `${(n / 1000).toFixed(0)}K`;
    return `${n}`;
  };
  if (!min && !max) return null;
  if (min && max)   return `${sym}${fmt(min)} – ${sym}${fmt(max)}`;
  if (min)          return `From ${sym}${fmt(min)}`;
  return `Up to ${sym}${fmt(max)}`;
}

// ── Time Ago ──────────────────────────────────────────────────────────────────
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60)      return 'just now';
  if (diff < 3600)    return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)   return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
