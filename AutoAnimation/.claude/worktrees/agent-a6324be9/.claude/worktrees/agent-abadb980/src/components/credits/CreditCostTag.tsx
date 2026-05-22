import { Coins } from 'lucide-react'
import type { CreditOperation } from '@/types/credits'
import { CREDIT_COSTS } from '@/types/credits'

interface CreditCostTagProps {
  operation: CreditOperation
  className?: string
}

export function CreditCostTag({ operation, className = '' }: CreditCostTagProps) {
  const cost = CREDIT_COSTS[operation]
  return (
    <span
      title={`This operation costs ${cost} credits`}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-700/50 text-zinc-400 ${className}`}
    >
      <Coins size={10} />
      {cost}
    </span>
  )
}
