/**
 * ViralityScorePanel — AI-powered virality analysis with score gauge,
 * dimension breakdown, and actionable suggestions.
 *
 * Cinema-standardized workflow: shell, blue accent, matching styles.
 */

import { useCallback, useState } from 'react'
import { Loader2, RefreshCw, Zap, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useViralityStore } from '@/stores/useViralityStore'
import { useViralityScore } from '@/hooks/useViralityScore'
import type { SocialPlatform } from '@/types/social'

const PLATFORMS: { id: SocialPlatform; label: string }[] = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
]

const DIMENSION_LABELS: Record<string, string> = {
  hook: 'Hook Strength',
  pacing: 'Pacing',
  trend: 'Trend Match',
  emotion: 'Emotional Arc',
  visual: 'Visual Quality',
  rewatch: 'Rewatch Value',
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 75 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
  const bgColor = score >= 75 ? 'bg-emerald-500/10' : score >= 50 ? 'bg-amber-500/10' : 'bg-red-500/10'

  return (
    <div className={cn('flex flex-col items-center py-4 rounded-lg border border-white/5', bgColor)}>
      <div className={cn('text-4xl font-bold tabular-nums', color)}>{score}</div>
      <div className="text-[10px] text-zinc-400 mt-1">/ 100</div>
    </div>
  )
}

function DimensionBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? 'bg-accent' : value >= 50 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-400">{label}</span>
        <span className="text-[10px] text-zinc-300 tabular-nums">{value}</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export function ViralityScorePanel() {
  const [platform, setPlatform] = useState<SocialPlatform>('tiktok')
  const currentScore = useViralityStore((s) => s.currentScore)
  const isAIScoring = useViralityStore((s) => s.isScoring)
  const aiError = useViralityStore((s) => s.error)

  // Heuristic real-time score
  const { result: heuristicResult } = useViralityScore(platform)

  const handleAIScore = useCallback(() => {
    useViralityStore.getState().triggerScore()
  }, [])

  // Use AI score if available, fall back to heuristic
  const displayScore = currentScore?.overall ?? heuristicResult?.score ?? null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Platform Selector ── */}
      <div className="shrink-0 px-3 py-2 border-b border-white/5">
        <div className="flex gap-1">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-[11px] font-medium transition-colors border',
                platform === p.id
                  ? 'bg-accent/10 text-accent border-accent/30'
                  : 'bg-panel-surface text-zinc-500 border-white/5 hover:text-zinc-300 hover:bg-panel-surface-hover',
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* Score Display */}
        {displayScore !== null && <ScoreGauge score={displayScore} />}

        {/* Heuristic Factors */}
        {heuristicResult && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Analysis</p>
            {heuristicResult.factors.map((factor) => (
              <div
                key={factor.name}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] border',
                  factor.impact === 'positive'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                    : factor.impact === 'negative'
                      ? 'bg-red-500/10 text-red-300 border-red-500/20'
                      : 'bg-panel-surface text-zinc-400 border-white/5',
                )}
              >
                {factor.label}
              </div>
            ))}
          </div>
        )}

        {/* AI Dimension Breakdown */}
        {currentScore && (
          <div className="space-y-2">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">AI Analysis</p>
            {(Object.entries(currentScore.dimensions) as [string, number][]).map(([key, value]) => (
              <DimensionBar key={key} label={DIMENSION_LABELS[key] || key} value={value} />
            ))}
          </div>
        )}

        {/* Suggestions */}
        {(currentScore?.suggestions ?? heuristicResult?.suggestions ?? []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Suggestions</p>
            {(currentScore?.suggestions ?? heuristicResult?.suggestions?.map((s) => s.text) ?? []).map(
              (suggestion, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 px-3 py-2 bg-accent/5 border border-accent/10 rounded-lg"
                >
                  <Zap size={12} className="text-accent mt-0.5 shrink-0" />
                  <span className="text-[11px] text-zinc-300">{suggestion}</span>
                </div>
              ),
            )}
          </div>
        )}

        {aiError && (
          <div className="flex items-start gap-1.5 text-[11px] text-red-400">
            <AlertCircle size={12} className="mt-0.5 shrink-0" />
            {aiError}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5">
        <button
          onClick={handleAIScore}
          disabled={isAIScoring}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium transition-colors',
            isAIScoring
              ? 'bg-panel-surface text-zinc-600 cursor-not-allowed border border-white/5'
              : 'bg-accent hover:bg-[#5a8eff] text-white shadow-lg shadow-accent/20',
          )}
        >
          {isAIScoring ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Analyzing with AI...
            </>
          ) : (
            <>
              <RefreshCw size={13} />
              {currentScore ? 'Re-score with AI' : 'Deep AI Analysis'}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
