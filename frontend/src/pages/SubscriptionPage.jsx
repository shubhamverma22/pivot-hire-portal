import { useState, useEffect } from 'react';
import { subscriptionApi } from '../api/client';
import { PlanBadge, PageLoader, Toast } from '../components/UI';
import { Check, Zap, Crown, ArrowRight } from 'lucide-react';
import clsx from 'clsx';

export default function SubscriptionPage() {
  const [sub, setSub] = useState(null);
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    Promise.all([subscriptionApi.get(), subscriptionApi.plans()])
      .then(([subData, plansData]) => {
        setSub(subData);
        setPlans(plansData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Check for upgrade success from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgraded') === 'true') {
      setToast({ message: 'Upgraded to Premium!', type: 'success' });
      window.history.replaceState({}, '', '/subscription');
    }
  }, []);

  const formatPrice = (amount, symbol) => {
    return `${symbol}${amount.toLocaleString('en-IN')}`;
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.getElementById('razorpay-script')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.id = 'razorpay-script';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      const res = await subscriptionApi.checkout({
        success_url: window.location.origin + '/subscription?upgraded=true',
        cancel_url: window.location.origin + '/subscription',
      });

      if (res.demo) {
        setToast({ message: 'Upgraded to Premium!', type: 'success' });
        subscriptionApi.get().then(setSub);
        setUpgrading(false);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setToast({ message: 'Failed to load payment gateway', type: 'error' });
        setUpgrading(false);
        return;
      }

      const options = {
        key: res.razorpay_key_id,
        subscription_id: res.subscription_id,
        name: res.name,
        description: res.description,
        currency: res.currency,
        prefill: {
          email: res.user_email,
          name: res.user_name,
        },
        theme: {
          color: '#4f46e5',
        },
        handler: async (response) => {
          try {
            await subscriptionApi.verify({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
            });
            setToast({ message: 'Upgraded to Premium!', type: 'success' });
            subscriptionApi.get().then(setSub);
          } catch (err) {
            setToast({ message: 'Payment verification failed. Contact support.', type: 'error' });
          }
          setUpgrading(false);
        },
        modal: {
          ondismiss: () => {
            setUpgrading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your Premium subscription?')) return;
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

  const isPremium = sub?.plan === 'premium';
  const used = sub?.applications_used_this_month || 0;
  const freePlan = plans.free;
  const premiumPlan = plans.premium;
  const sym = premiumPlan.currency_symbol;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-display font-bold text-slate-900">Subscription</h1>
        <p className="text-slate-500 mt-1">Choose the plan that fits your job search needs.</p>
      </div>

      {/* Current Plan Status */}
      <div className="card p-6 text-center">
        <p className="text-sm text-slate-500 mb-2">Current Plan</p>
        <div className="flex items-center justify-center gap-2 mb-2">
          <PlanBadge plan={sub?.plan || 'free'} />
        </div>
        <p className="text-sm text-slate-600">
          {isPremium
            ? 'Unlimited applications per month'
            : `${used}/${freePlan.monthly_limit} applications used this month`}
        </p>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Plan */}
        <div className={clsx(
          'card p-8 relative',
          !isPremium && 'ring-2 ring-brand-500'
        )}>
          {!isPremium && (
            <span className="absolute -top-3 left-6 px-3 py-1 bg-brand-600 text-white text-xs font-medium rounded-full">
              Current
            </span>
          )}
          <div className="mb-6">
            <h3 className="text-xl font-display font-bold text-slate-900">{freePlan.name}</h3>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-display font-bold text-slate-900">{sym}0</span>
              <span className="text-slate-500">/month</span>
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            {freePlan.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          {!isPremium && (
            <div className="px-4 py-3 bg-slate-50 rounded-xl text-sm text-slate-600 text-center">
              Your current plan
            </div>
          )}
        </div>

        {/* Premium Plan */}
        <div className={clsx(
          'card p-8 relative border-2',
          isPremium ? 'ring-2 ring-brand-500 border-brand-200' : 'border-brand-200 bg-gradient-to-b from-brand-50/50 to-white'
        )}>
          {isPremium && (
            <span className="absolute -top-3 left-6 px-3 py-1 bg-brand-600 text-white text-xs font-medium rounded-full">
              Current
            </span>
          )}
          <div className="absolute -top-3 right-6 px-3 py-1 bg-amber-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
            <Crown size={12} /> Recommended
          </div>
          <div className="mb-6">
            <h3 className="text-xl font-display font-bold text-slate-900">Premium</h3>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-display font-bold text-slate-900">
                {formatPrice(premiumPlan.amount, sym)}
              </span>
              <span className="text-slate-500">/month</span>
            </div>
          </div>
          <ul className="space-y-3 mb-8">
            {premiumPlan.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-700">
                <Zap size={16} className="text-brand-600 shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          {isPremium ? (
            <button onClick={handleCancel} disabled={cancelling} className="btn-secondary w-full">
              {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          ) : (
            <button onClick={handleUpgrade} disabled={upgrading} className="btn-primary w-full btn-lg">
              {upgrading ? 'Processing...' : 'Upgrade to Premium'} <ArrowRight size={18} />
            </button>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
