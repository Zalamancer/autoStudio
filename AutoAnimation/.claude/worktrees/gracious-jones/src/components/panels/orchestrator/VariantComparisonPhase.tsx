/**
 * VariantComparisonPhase — Side-by-side comparison of A/B plan variants.
 * Shows either plan previews (pre-execution) or full results with thumbnails + viral scores.
 */

import { useState } from 'react'
import {
  Trophy,
  Play,
  Check,
  Loader2,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Zap,
  Eye,
  RotateCcw,
  RefreshCw,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClipPlan, ExecutedVariant, ViralScore } from '@/types/orchestrator'

interface VariantComparisonPhaseProps {
  originalPlan: ClipPlan
  variations: ClipPlan[]
  executedVariants: ExecutedVariant[]
  selectedVariantIndex: number
  isRunning: boolean
  isGeneratingVariations: boolean
  onSelectVariant: (index: number) => void
  onApplyVariant: (index: number) => void
  onExecuteAll: () => void
  onBack: () => void
  onReset: () => void
}

/** Render a compact viral score radar */
function ViralScoreBadge({ score }: { score: ViralScore }) {
  const color =
    score.overall >= 75
      ? 'text-emerald-400 bg-emerald-900/20 border-emerald-700/30'
      : score.overall >= 50
        ? 'text-amber-400 bg-amber-900/20 border-amber-700/30'
        : 'text-red-400 bg-red-900/20 border-red-700/30'

  return (
    <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold', color)}>
      <TrendingUp size={10} />
      {score.overall}
    </div>
  )
}

/** Compact plan summary for comparison */
function PlanSummary({ plan }: { plan: ClipPlan }) {
  return (
    <div className="space-y-1 text-[10px] text-gray-500">
      <div className="flex items-center gap-2">
        <span>{plan.canvas.aspectRatio}</span>
        <span>{plan.canvas.durationSeconds}s</span>
        <span>{plan.canvas.fps}fps</span>
      </div>
      <div>{plan.characters.length} character{plan.characters.length !== 1 ? 's' : ''}</div>
      <div>{plan.dialogue.length} dialogue line{plan.dialogue.length !== 1 ? 's' : ''}</div>
      {plan.dialogue.length > 0 && (
        <p className="text-[10px] text-gray-400 italic line-clamp-2">
          &ldquo;{plan.dialogue[0].script.slice(0, 80)}{plan.dialogue[0].script.length > 80 ? '...' : ''}&rdquo;
        </p>
      )}
    </div>
  )
}

export function VariantComparisonPhase({
  originalPlan,
  variations,
  executedVariants,
  selectedVariantIndex,
  isRunning,
  isGeneratingVariations,
  onSelectVariant,
  onApplyVariant,
  onExecuteAll,
  onBack,
  onReset,
}: VariantComparisonPhaseProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const hasExecutedResults = executedVariants.length > 0

  // Build display items: original + variations
  const allPlans: { plan: ClipPlan; label: string }[] = [
    { plan: originalPlan, label: 'Original' },
    ...variations.map((v, i) => ({
      plan: v,
      label: `Variant ${String.fromCharCode(65 + i)}`,
    })),
  ]

  // Find the best variant by viral score (if executed)
  const bestIndex = hasExecutedResults
    ? executedVariants.reduce(
        (best, v, i) => {
          if (!v.viralScore) return best
          if (best === -1 || (v.viralScore.overall > (executedVariants[best]?.viralScore?.overall ?? 0))) return i
          return best
        },
        -1,
      )
    : -1

  if (isGeneratingVariations) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3 animate-fade-in-up">
        <div className="relative">
          <Loader2 size={28} className="animate-spin text-amber-400" />
          <Sparkles size={12} className="absolute -top-1 -right-1 text-amber-300 animate-pulse" />
        </div>
        <p className="text-sm text-gray-300 font-medium">Generating Variants...</p>
        <p className="text-xs text-gray-500">AI is creating alternative approaches</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-2 px-1">
        <button
          onClick={onBack}
          className="p-1 rounded hover:bg-[#3a3a3a] text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={14} />
        </button>
        <Zap size={14} className="text-amber-400" />
        <h4 className="text-xs font-medium text-amber-300">
          {hasExecutedResults ? 'Compare Results' : 'Compare Plans'}
        </h4>
        {bestIndex >= 0 && (
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 ml-auto">
            Best: {executedVariants[bestIndex]?.label}
          </span>
        )}
      </div>

      {/* Variant Cards */}
      <div className="space-y-2">
        {allPlans.map((item, index) => {
          const isSelected = selectedVariantIndex === index
          const isBest = bestIndex === index
          const executed = hasExecutedResults ? executedVariants[index] : null
          const isHovered = hoveredIndex === index

          return (
            <div
              key={index}
              onClick={() => onSelectVariant(index)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={cn(
                'relative rounded-lg border-2 p-3 cursor-pointer transition-all duration-200',
                isSelected
                  ? 'border-amber-500/50 bg-amber-900/10'
                  : 'border-transparent hover:border-white/10 bg-[#1e1e1e]/50',
                isBest && 'ring-1 ring-emerald-500/30',
              )}
            >
              {/* Winner badge */}
              {isBest && (
                <div className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-1 shadow-lg shadow-emerald-500/20">
                  <Trophy size={10} className="text-white" />
                </div>
              )}

              <div className="flex gap-3">
                {/* Thumbnail or placeholder */}
                <div className="w-20 h-14 rounded-md overflow-hidden bg-[#2a2a2a] flex-shrink-0">
                  {executed?.thumbnailDataUrl ? (
                    <img
                      src={executed.thumbnailDataUrl}
                      alt={item.label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Eye size={14} className="text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-200">{item.label}</span>
                    {executed?.viralScore && <ViralScoreBadge score={executed.viralScore} />}
                    {executed && !executed.viralScore && (
                      <span className="text-[9px] text-gray-600">No score</span>
                    )}
                  </div>
                  <PlanSummary plan={item.plan} />
                </div>
              </div>

              {/* Viral score dimensions (expanded on hover/select) */}
              {executed?.viralScore && (isSelected || isHovered) && (
                <div className="mt-2 pt-2 border-t border-white/5">
                  <div className="grid grid-cols-3 gap-x-3 gap-y-1">
                    {Object.entries(executed.viralScore.dimensions).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-[9px] text-gray-500 capitalize">{key}</span>
                        <span
                          className={cn(
                            'text-[9px] font-bold',
                            value >= 75 ? 'text-emerald-400' : value >= 50 ? 'text-amber-400' : 'text-red-400',
                          )}
                        >
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                  {executed.viralScore.suggestions.length > 0 && (
                    <p className="text-[9px] text-gray-500 mt-1.5 line-clamp-2">
                      {executed.viralScore.suggestions[0]}
                    </p>
                  )}
                </div>
              )}

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-2 left-2">
                  <div className="bg-amber-500 rounded-full p-0.5">
                    <Check size={8} className="text-white" />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!hasExecutedResults && (
          <button
            onClick={onExecuteAll}
            disabled={isRunning}
            className="flex-1 py-2.5 rounded-lg text-xs font-medium bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-violet-600/10 disabled:opacity-50"
          >
            <Play size={14} />
            Execute & Compare All
          </button>
        )}
        <button
          onClick={() => onApplyVariant(selectedVariantIndex)}
          disabled={isRunning}
          className={cn(
            'py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all',
            hasExecutedResults
              ? 'flex-1 bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/10'
              : 'flex-1 bg-[#3a3a3a] hover:bg-[#4a4a4a] text-gray-300',
          )}
        >
          <Check size={14} />
          Use {allPlans[selectedVariantIndex]?.label ?? 'Selected'}
        </button>
      </div>

      {hasExecutedResults && (
        <button
          onClick={onBack}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <RefreshCw size={12} />
          Generate New Variants
        </button>
      )}

      <button
        onClick={onReset}
        className="w-full py-2 text-xs text-gray-500 hover:text-gray-300 transition-colors"
      >
        <RotateCcw size={12} className="inline mr-1" />
        Start Over
      </button>
    </div>
  )
}
