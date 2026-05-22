import { X } from 'lucide-react'
import { useCreditsStore } from '@/stores/useCreditsStore'
import { useBillingStore } from '@/stores/useBillingStore'
import { PlanCard } from './PlanCard'

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    credits: '150 credits/day',
    priceId: null,
    features: ['150 daily credits', 'All AI features', 'Resets every day'],
  },
  {
    name: 'Pro',
    price: '$17',
    period: 'mo',
    credits: '8,500 credits/month',
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || '',
    features: ['8,500 monthly credits', '2D animation', 'All AI voices', 'Priority generation', '100+ templates', 'No watermark'],
    highlight: true,
  },
  {
    name: 'Business',
    price: '$33',
    period: 'mo',
    credits: '25,000 credits/month',
    priceId: import.meta.env.VITE_STRIPE_BUSINESS_PRICE_ID || '',
    features: ['25,000 monthly credits', '2D + 3D animation', 'All AI voices', 'Priority generation', '100+ templates', 'No watermark', 'Team support'],
  },
]

export function UpgradeModal() {
  const show = useCreditsStore((s) => s.showUpgradeModal)
  const reason = useCreditsStore((s) => s.upgradeReason)
  const balance = useCreditsStore((s) => s.balance)
  const hideUpgrade = useCreditsStore((s) => s.hideUpgrade)
  const startCheckout = useBillingStore((s) => s.startCheckout)

  if (!show) return null

  const currentPlan = balance?.plan ?? 'free'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl mx-4 bg-zinc-900 border border-zinc-700/50 rounded-2xl shadow-2xl p-6">
        {/* Close */}
        <button
          onClick={hideUpgrade}
          className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <h2 className="text-xl font-bold text-white">Upgrade Your Plan</h2>
        {reason && (
          <p className="mt-1 text-sm text-zinc-400">{reason}</p>
        )}
        {balance && (
          <p className="mt-1 text-xs text-zinc-500">
            Current balance: {balance.credits_remaining.toLocaleString()} / {balance.plan_credits_total.toLocaleString()} credits
          </p>
        )}

        {/* Plan cards */}
        <div className="mt-6 grid grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.name}
              name={plan.name}
              price={plan.price}
              period={plan.period}
              credits={plan.credits}
              features={plan.features}
              isCurrent={currentPlan === plan.name.toLowerCase()}
              highlight={plan.highlight}
              onSelect={() => {
                if (plan.priceId) {
                  startCheckout(plan.priceId)
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
