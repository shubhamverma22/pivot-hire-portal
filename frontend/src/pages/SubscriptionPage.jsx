import { useState, useEffect } from 'react';
import { subscriptionApi } from '../api/client';
import { PlanBadge, PageLoader, Toast } from '../components/UI';
import { Check, Zap, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export default function SubscriptionPage() {
  const [sub,        setSub]        = useState(null);
  const [plans,      setPlans]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [upgrading,  setUpgrading]  = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast,      setToast]      = useState(null);

  useEffect(() => {
    Promise.all([subscriptionApi.get(), subscriptionApi.plans()])
      .then(([subData, plansData]) => { setSub(subData); setPlans(plansData); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      setToast({ message: 'Upgraded to Premium!', type: 'success' });
      window.history.replaceState({}, '', '/subscription');
    }
  }, []);

  const loadRazorpay = () => new Promise((resolve) => {
    if (document.getElementById('rzp-script')) return resolve(true);
    const s = document.createElement('script');
    s.id = 'rzp-script';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await subscriptionApi.checkout({
        success_url: `${window.location.origin}/subscription?upgraded=true`,
        cancel_url:  `${window.location.origin}/subscription`,
      });

      if (res.demo) {
        setToast({ message: 'Upgraded to Premium!', type: 'success' });
        subscriptionApi.get().then(setSub);
        setUpgrading(false);
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) {
        setToast({ message: 'Failed to load payment gateway', type: 'error' });
        setUpgrading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: res.razorpay_key_id,
        subscription_id: res.subscription_id,
        name: res.name,
        description: res.description,
        currency: res.currency,
        prefill: { email: res.user_email, name: res.user_name },
        theme: { color: '#4f46e5' },
        handler: async (response) => {
          try {
            await subscriptionApi.verify({
              razorpay_payment_id:       response.razorpay_payment_id,
              razorpay_subscription_id:  response.razorpay_subscription_id,
              razorpay_signature:        response.razorpay_signature,
            });
            setToast({ message: 'Upgraded to Premium!', type: 'success' });
            subscriptionApi.get().then(setSub);
          } catch {
            setToast({ message: 'Payment verification failed. Contact support.', type: 'error' });
          }
          setUpgrading(false);
        },
        modal: { ondismiss: () => setUpgrading(false) },
      });
      rzp.open();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Cancel your Premium subscription?')) return;
    setCancelling(true);
    try {
      await subscriptionApi.cancel();
      setToast({ message: 'Subscription cancelled', type: 'info' });
      subscriptionApi.get().then(setSub);
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setCancelling(false);
    }
  };

  if (loading || !plans) return <PageLoader />;

  const isPremium   = sub?.plan === 'premium';
  const used        = sub?.applications_used_this_month || 0;
  const freePlan    = plans.free;
  const premiumPlan = plans.premium;
  const sym         = premiumPlan.currency_symbol;
  const fmtPrice    = (n) => `${sym}${n.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">

      {/* ── Header ── */}
      <div>
        <h1 className="page-title">Subscription</h1>
        <p className="page-subtitle">Choose the plan that fits your job search.</p>
      </div>

      {/* ── Current status ── */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 mb-1">Current Plan</p>
          <PlanBadge plan={sub?.plan || 'free'} />
        </div>
        <p className="text-sm text-slate-600">
          {isPremium
            ? 'Unlimited applications / month'
            : <><strong className="text-slate-800">{used}</strong> / {freePlan.monthly_limit} applications used this month</>}
        </p>
      </div>

      {/* ── Plans ── */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Free */}
        <div className={clsx(
          'card p-6 relative',
          !isPremium && 'ring-2 ring-brand-500'
        )}>
          {!isPremium && (
            <span className="absolute -top-px left-5 -translate-y-1/2 px-2.5 py-0.5 bg-brand-600 text-white text-xs font-medium rounded-full">
              Current Plan
            </span>
          )}
          <h3 className="text-base font-display font-semibold text-slate-900 mb-1">{freePlan.name}</h3>
          <div className="flex items-baseline gap-1 mb-5">
            <span className="text-3xl font-display font-bold text-slate-900">{sym}0</span>
            <span className="text-sm text-slate-500">/ month</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {freePlan.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          {!isPremium && (
            <p className="text-center text-xs text-slate-400 py-2">Your current plan</p>
          )}
        </div>

        {/* Premium */}
        <div className={clsx(
          'card p-6 relative border-brand-200',
          isPremium ? 'ring-2 ring-brand-500' : 'bg-gradient-to-b from-brand-50/40 to-white'
        )}>
          {isPremium && (
            <span className="absolute -top-px left-5 -translate-y-1/2 px-2.5 py-0.5 bg-brand-600 text-white text-xs font-medium rounded-full">
              Current Plan
            </span>
          )}
          <span className="absolute -top-px right-5 -translate-y-1/2 px-2.5 py-0.5 bg-amber-400 text-white text-xs font-medium rounded-full">
            Recommended
          </span>

          <h3 className="text-base font-display font-semibold text-slate-900 mb-1">Premium</h3>
          <div className="flex items-baseline gap-1 mb-5">
            <span className="text-3xl font-display font-bold text-slate-900">{fmtPrice(premiumPlan.amount)}</span>
            <span className="text-sm text-slate-500">/ month</span>
          </div>
          <ul className="space-y-2.5 mb-6">
            {premiumPlan.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                <Zap size={15} className="text-brand-600 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          {isPremium ? (
            <button onClick={handleCancel} disabled={cancelling} className="btn-secondary w-full">
              {cancelling ? 'Cancelling…' : 'Cancel Subscription'}
            </button>
          ) : (
            <button onClick={handleUpgrade} disabled={upgrading} className="btn-primary w-full btn-lg">
              {upgrading ? 'Processing…' : 'Upgrade to Premium'}
              {!upgrading && <ArrowRight size={16} />}
            </button>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
