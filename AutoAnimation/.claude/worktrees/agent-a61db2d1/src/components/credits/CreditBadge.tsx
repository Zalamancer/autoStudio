import { useNavigate } from 'react-router-dom'
import { Coins } from 'lucide-react'
import { useCreditsStore } from '@/stores/useCreditsStore'
import { useAuthStore } from '@/stores/useAuthStore'

export function CreditBadge() {
  const navigate = useNavigate()
  const balance = useCreditsStore((s) => s.balance)
  const user = useAuthStore((s) => s.user)

  // Don't show if not logged in or balance not loaded
  if (!user || !balance) return null

  const remaining = balance.credits_remaining
  const total = balance.plan_credits_total
  const pct = total > 0 ? remaining / total : 0

  const color =
    pct > 0.5
      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
      : pct > 0.25
        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
        : 'bg-red-500/15 text-red-400 border-red-500/30'

  const planLabel = balance.plan === 'free' ? 'Free' : balance.plan === 'pro' ? 'Pro' : 'Business'
  const resetInfo = balance.plan === 'free' ? 'Resets daily' : `Resets ${balance.current_period_end ? new Date(balance.current_period_end).toLocaleDateString() : 'monthly'}`

  return (
    <button
      onClick={() => navigate('/billing')}
      title={`${planLabel} plan - ${remaining}/${total} credits - ${resetInfo}`}
      className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium transition-colors hover:brightness-125 ${color}`}
    >
      <Coins size={12} />
      {remaining.toLocaleString()}
    </button>
  )
}
