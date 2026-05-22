/**
 * ABComparisonPanel — Side-by-side comparison of A/B test variants.
 *
 * Shows variant labels, dimension comparison bars, and "Pick Winner" button.
 */

import { Trophy, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import { useABTestStore } from '@/stores/useABTestStore'

const DIMENSION_LABELS: Record<string, string> = {
  hook: 'Hook Strength',
  pacing: 'Pacing',
  trend: 'Trend Relevance',
  emotion: 'Emotional Impact',
  visual: 'Visual Appeal',
  rewatch: 'Rewatch Factor',
}

export function ABComparisonPanel() {
  const executedVariants = useOrchestratorStore((s) => s.executedVariants)
  const applyVariant = useOrchestratorStore((s) => s.applyVariant)
  const activeComparison = useABTestStore((s) => s.activeComparison)
  const setComparison = useABTestStore((s) => s.setComparison)
  const pickWinner = useABTestStore((s) => s.pickWinner)

  if (executedVariants.length < 2) {
    return (
      <div className="p-4 text-center text-xs text-zinc-500">
        Need at least 2 executed variants to compare
      </div>
    )
  }

  const varA = activeComparison
    ? executedVariants[activeComparison.variantA]
    : executedVariants[0]
  const varB = activeComparison
    ? executedVariants[activeComparison.variantB]
    : executedVariants[1]

  if (!varA || !varB) return null

  const dimA = varA.viralScore?.dimensions
  const dimB = varB.viralScore?.dimensions

  const handlePickWinner = (variantIndex: number) => {
    pickWinner(variantIndex)
    applyVariant(variantIndex)
  }

  return (
    <div className="flex flex-col gap-4 p-3">
      {/* Variant selector */}
      <div className="flex items-center gap-2">
        <BarChart3 size={16} className="text-indigo-400" />
        <h3 className="text-sm font-semibold text-white">Compare Variants</h3>
      </div>

      {/* Quick selector */}
      <div className="flex gap-1 flex-wrap">
        {executedVariants.map((v, i) => (
          <button
            key={v.index}
            onClick={() => {
              if (!activeComparison || activeComparison.variantA !== i) {
                setComparison(i, activeComparison?.variantB ?? (i === 0 ? 1 : 0))
              }
            }}
            className={cn(
              'text-[10px] px-2 py-0.5 rounded border transition-all',
              (activeComparison?.variantA === i || activeComparison?.variantB === i)
                ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400'
                : 'border-white/5 text-zinc-500 hover:text-zinc-300',
            )}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Side-by-side cards */}
      <div className="grid grid-cols-2 gap-3">
        {[varA, varB].map((variant) => (
          <div
            key={variant.index}
            className="border border-white/5 rounded-lg p-3 bg-zinc-900/50"
          >
            {/* Thumbnail */}
            <div className="aspect-video bg-zinc-800 rounded mb-2 overflow-hidden">
              {variant.thumbnailDataUrl ? (
                <img src={variant.thumbnailDataUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-zinc-600 text-[10px]">
                  No preview
                </div>
              )}
            </div>

            <div className="text-xs font-medium text-zinc-200">{variant.label}</div>
            <div className="text-[10px] text-zinc-500 mt-1">
              Score: {variant.viralScore?.overall ?? '-'}/100
            </div>
            <div className="text-[10px] text-zinc-600">
              {variant.totalCredits} credits
            </div>

            <button
              onClick={() => handlePickWinner(variant.index)}
              className="mt-2 w-full flex items-center justify-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 border border-amber-500/20 hover:border-amber-500/40 rounded px-2 py-1 transition-colors"
            >
              <Trophy size={10} /> Pick Winner
            </button>
          </div>
        ))}
      </div>

      {/* Dimension comparison */}
      {dimA && dimB && (
        <div className="space-y-2">
          <h4 className="text-[10px] text-zinc-500 uppercase tracking-wider">Dimensions</h4>
          {Object.entries(DIMENSION_LABELS).map(([key, label]) => {
            const scoreA = (dimA as unknown as Record<string, number>)[key] ?? 0
            const scoreB = (dimB as unknown as Record<string, number>)[key] ?? 0
            const maxScore = Math.max(scoreA, scoreB, 1)

            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-zinc-400">{label}</span>
                  <span className="text-zinc-500">{scoreA} vs {scoreB}</span>
                </div>
                <div className="flex gap-1 h-2">
                  <div
                    className={cn(
                      'rounded-l h-full transition-all',
                      scoreA >= scoreB ? 'bg-green-500/50' : 'bg-red-500/30',
                    )}
                    style={{ width: `${(scoreA / maxScore) * 50}%` }}
                  />
                  <div
                    className={cn(
                      'rounded-r h-full transition-all',
                      scoreB >= scoreA ? 'bg-green-500/50' : 'bg-red-500/30',
                    )}
                    style={{ width: `${(scoreB / maxScore) * 50}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
