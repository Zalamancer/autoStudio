import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, CreditCard, ExternalLink, Coins, Loader2 } from 'lucide-react'
import { useCreditsStore } from '@/stores/useCreditsStore'
import { useBillingStore } from '@/stores/useBillingStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { PlanCard } from './PlanCard'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    credits: '150 credits/day',
    priceId: null as string | null,
    features: ['150 daily credits', 'All AI features', 'Resets every day'],
  },
  {
    name: 'Pro',
    price: '$17',
    period: 'mo',
    credits: '8,500 credits/month',
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || '',
    features: ['8,500 monthly credits', '2D animation', 'All AI voices', 'Priority generation', '100+ templates', 'No watermark'],
    highlight: true as const,
  },
  {
    name: 'Business',
    price: '$33',
    period: 'mo',
    credits: '25,000 credits/month',
    priceId: import.meta.env.VITE_STRIPE_BUSINESS_PRICE_ID || '',
    features: ['25,000 monthly credits', '2D + 3D animation', 'All AI voices', 'Priority generation', '100+ templates', 'No watermark', 'Team support'],
  },
  {
    name: 'Enterprise',
    price: '$199',
    period: 'mo',
    credits: '100,000 credits/month',
    priceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID || '',
    features: [
      '100,000 monthly credits',
      '2D + 3D animation',
      'All AI voices',
      'Priority generation',
      '100+ templates',
      'No watermark',
      'Team support',
      'Promotion marketplace',
      'Creator matching',
      'Bulk credit packages',
    ],
  },
]

const CREDIT_PACKAGES = [
  { label: '50K Credits', credits: 50000, priceId: import.meta.env.VITE_STRIPE_CREDITS_50K_PRICE_ID || '' },
  { label: '100K Credits', credits: 100000, priceId: import.meta.env.VITE_STRIPE_CREDITS_100K_PRICE_ID || '' },
  { label: '250K Credits', credits: 250000, priceId: import.meta.env.VITE_STRIPE_CREDITS_250K_PRICE_ID || '' },
]

export function BillingPage() {
  const user = useAuthStore((s) => s.user)
  const balance = useCreditsStore((s) => s.balance)
  const fetchBalance = useCreditsStore((s) => s.fetchBalance)
  const subscription = useBillingStore((s) => s.subscription)
  const fetchSubscription = useBillingStore((s) => s.fetchSubscription)
  const startCheckout = useBillingStore((s) => s.startCheckout)
  const openPortal = useBillingStore((s) => s.openPortal)

  useEffect(() => {
    if (user) {
      fetchBalance()
      fetchSubscription()
    }
  }, [user, fetchBalance, fetchSubscription])

  const currentPlan = balance?.plan ?? 'free'
  const remaining = balance?.credits_remaining ?? 0
  const total = balance?.plan_credits_total ?? 150
  const usagePct = total > 0 ? ((total - remaining) / total) * 100 : 0

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-zinc-800">
        <Link to="/editor" className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-semibold">Billing & Credits</h1>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {!user ? (
          <div className="text-center py-16">
            <p className="text-zinc-400">Please sign in to manage your billing.</p>
            <Link to="/editor" className="mt-4 inline-block text-amber-400 hover:text-amber-300 text-sm">
              Back to Editor
            </Link>
          </div>
        ) : (
          <>
            {/* Current plan + usage */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-400">Current Plan</p>
                  <p className="text-2xl font-bold capitalize">{currentPlan}</p>
                  {subscription?.cancel_at_period_end && (
                    <p className="text-xs text-amber-400 mt-1">Cancels at end of period</p>
                  )}
                </div>
                {currentPlan !== 'free' && (
                  <button
                    onClick={openPortal}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
                  >
                    <CreditCard size={14} />
                    Manage Subscription
                    <ExternalLink size={12} />
                  </button>
                )}
              </div>

              {/* Usage bar */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
                  <span>Credits used</span>
                  <span>{remaining.toLocaleString()} / {total.toLocaleString()} remaining</span>
                </div>
                <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      usagePct > 75 ? 'bg-red-500' : usagePct > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(usagePct, 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">
                  {balance?.plan === 'free'
                    ? 'Resets daily'
                    : balance?.current_period_end
                      ? `Resets ${new Date(balance.current_period_end).toLocaleDateString()}`
                      : 'Resets monthly'}
                </p>
              </div>
            </div>

            {/* Plan comparison */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Choose a Plan</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {PLANS.map((plan) => (
                  <PlanCard
                    key={plan.name}
                    name={plan.name}
                    price={plan.price}
                    period={plan.period}
                    credits={plan.credits}
                    features={plan.features}
                    isCurrent={currentPlan === plan.name.toLowerCase()}
                    highlight={'highlight' in plan}
                    onSelect={() => {
                      if (plan.priceId) startCheckout(plan.priceId)
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Credit packages (enterprise users) */}
            {currentPlan === 'enterprise' && (
              <CreditTopUpSection />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function CreditTopUpSection() {
  const [loadingPackage, setLoadingPackage] = useState<string | null>(null)

  const handleBuyCredits = async (credits: number, priceId: string) => {
    if (!priceId) return
    setLoadingPackage(priceId)
    try {
      const { supabase } = await import('@/services/supabase')
      const { data: sessionData } = await supabase!.auth.getSession()
      const token = sessionData.session?.access_token
      if (!token) return

      const res = await fetch('/api/stripe/credit-top-up', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ creditAmount: credits, priceId }),
      })

      const data = await res.json()
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl
      }
    } catch (err) {
      console.error('[Billing] Credit top-up error:', err)
    } finally {
      setLoadingPackage(null)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Coins size={18} className="text-amber-400" />
        <h2 className="text-lg font-semibold">Bulk Credit Packages</h2>
      </div>
      <p className="text-sm text-zinc-400 mb-4">
        Purchase additional credits for promotion requests and high-volume projects.
      </p>
      <div className="grid grid-cols-3 gap-4">
        {CREDIT_PACKAGES.map((pkg) => (
          <div
            key={pkg.label}
            className="flex flex-col items-center p-4 rounded-xl border border-zinc-700/50 bg-zinc-800/50 hover:border-amber-500/30 transition-all"
          >
            <span className="text-2xl font-bold text-amber-400">{(pkg.credits / 1000).toFixed(0)}K</span>
            <span className="text-xs text-zinc-400 mt-1">{pkg.label}</span>
            <button
              onClick={() => handleBuyCredits(pkg.credits, pkg.priceId)}
              disabled={!pkg.priceId || loadingPackage === pkg.priceId}
              className="mt-3 w-full py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              {loadingPackage === pkg.priceId ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                'Buy Now'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
