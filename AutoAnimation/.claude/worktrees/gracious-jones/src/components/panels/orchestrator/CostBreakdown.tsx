import { useState } from 'react'
import { ChevronRight, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatCost, SOURCE_COLORS, SOURCE_LABELS } from './constants'
import type { OrchestrationCost } from '@/types/orchestrator'

interface CostBreakdownProps {
  cost: OrchestrationCost
}

export function CostBreakdown({ cost }: CostBreakdownProps) {
  const [expanded, setExpanded] = useState(false)

  // Group entries by source for summary
  const bySource = cost.entries.reduce<
    Record<string, { cost: number; count: number; credits: number; totalTokens?: number; totalChars?: number }>
  >((acc, entry) => {
    if (!acc[entry.source]) acc[entry.source] = { cost: 0, count: 0, credits: 0 }
    acc[entry.source].cost += entry.cost
    acc[entry.source].count += 1
    if (!entry.refunded) {
      acc[entry.source].credits += entry.credits || 0
    }
    if (entry.tokenUsage) {
      acc[entry.source].totalTokens =
        (acc[entry.source].totalTokens || 0) + entry.tokenUsage.totalTokenCount
    }
    if (entry.characters) {
      acc[entry.source].totalChars =
        (acc[entry.source].totalChars || 0) + entry.characters
    }
    return acc
  }, {})

  return (
    <div className="bg-[#1e1e1e]/80 border border-white/5 rounded-lg px-3 py-2 space-y-1.5">
      {/* Total cost header — credits prominent */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 group"
      >
        <Coins size={13} className="text-amber-400 shrink-0" />
        {cost.totalCredits > 0 && (
          <span className="text-xs font-medium text-amber-300">
            {cost.totalCredits.toLocaleString()} credits
          </span>
        )}
        <span className="text-[10px] text-gray-500">
          {cost.entries.length} operation{cost.entries.length !== 1 ? 's' : ''}
          {cost.totalCost > 0 && ` \u00b7 ${formatCost(cost.totalCost)} API`}
        </span>
        <ChevronRight
          size={10}
          className={cn(
            'ml-auto text-gray-500 transition-transform duration-200',
            expanded && 'rotate-90',
          )}
        />
      </button>

      {/* Source summary (always visible) */}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 pl-5">
        {Object.entries(bySource).map(([source, data]) => (
          <div key={source} className="flex items-center gap-1 text-[10px]">
            <span className={SOURCE_COLORS[source] || 'text-gray-400'}>
              {SOURCE_LABELS[source] || source}
            </span>
            {data.credits > 0 && (
              <span className="text-amber-400/70">{data.credits} cr</span>
            )}
            {data.totalTokens != null && data.totalTokens > 0 && (
              <span className="text-gray-600">({data.totalTokens.toLocaleString()} tok)</span>
            )}
            {data.totalChars != null && data.totalChars > 0 && (
              <span className="text-gray-600">({data.totalChars.toLocaleString()} chars)</span>
            )}
          </div>
        ))}
      </div>

      {/* Expanded: individual entries */}
      {expanded && (
        <div className="pl-5 pt-1 border-t border-white/5 space-y-0.5">
          {cost.entries.map((entry, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <span className={cn('shrink-0', SOURCE_COLORS[entry.source] || 'text-gray-400')}>
                &bull;
              </span>
              <span className={cn('truncate flex-1', entry.refunded ? 'text-gray-600 line-through' : 'text-gray-400')}>
                {entry.label}
              </span>
              {entry.credits != null && entry.credits > 0 && (
                <span className={cn('shrink-0', entry.refunded ? 'text-green-500' : 'text-amber-400/70')}>
                  {entry.refunded ? '+' : '-'}{entry.credits} cr
                </span>
              )}
              {entry.cost > 0 && (
                <span className="text-gray-600 shrink-0">{formatCost(entry.cost)}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
