import { useEffect, useState, useMemo } from 'react'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTemplateRatingStore, type TemplateScores } from '@/stores/useTemplateRatingStore'

/**
 * Pure analytics panel — no controls, no search, no filter.
 * Reads rating data and displays stats. That's it.
 */
export function MotionStyleBrowser() {
  const ratings = useTemplateRatingStore((s) => s.ratings)

  const [supabaseRatings, setSupabaseRatings] = useState<Record<string, any>>({})
  useEffect(() => {
    fetch('/api/template-ratings')
      .then((r) => (r.ok ? r.json() : {}))
      .then(setSupabaseRatings)
      .catch(() => {})
  }, [])

  const allRatings = { ...supabaseRatings, ...ratings }
  const entries = Object.entries(allRatings)
  const totalRated = entries.length
  const withScores = entries.filter(([, v]) => v?.scores != null)
  const scoredCount = withScores.length
  const liked = entries.filter(([, v]) => (typeof v === 'string' ? v : v?.verdict) === 'liked').length

  const metricKeys = ['quality'] as const
  const metricStats = metricKeys.map((m) => {
    const vals = withScores.map(([, v]) => v?.scores?.[m]).filter((v): v is number => v != null)
    return {
      key: m,
      label: m.charAt(0).toUpperCase() + m.slice(1),
      avg: vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0,
      count: vals.length,
    }
  })
  const weakest = scoredCount > 0 ? metricStats.reduce((a, b) => (a.avg < b.avg ? a : b)) : null
  const strongest = scoredCount > 0 ? metricStats.reduce((a, b) => (a.avg > b.avg ? a : b)) : null

  const dist = [0, 0, 0, 0, 0]
  for (const [, v] of withScores) {
    const scores = v?.scores as TemplateScores | undefined
    if (!scores) continue
    for (const m of metricKeys) {
      const s = scores[m]
      if (s >= 1 && s <= 4) dist[s]++
    }
  }
  const totalPoints = dist.slice(1).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
        <BarChart3 size={14} className="text-accent" />
        <span className="text-[13px] font-medium text-accent">Rating Analytics</span>
      </div>

      {/* Stat rows */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="space-y-1">
          {/* Total Rated */}
          <div className="w-full px-3 py-2.5 rounded-lg border bg-panel-surface border-white/5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-gray-200">Total Rated</div>
              <div className="text-xs font-bold text-gray-200">{totalRated}</div>
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">
              {scoredCount} multi-scored · {totalRated - scoredCount} binary
            </div>
          </div>

          {/* Approval */}
          <div className="w-full px-3 py-2.5 rounded-lg border bg-panel-surface border-white/5">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-gray-200">Approval Rate</div>
              <div className="text-xs font-bold text-emerald-400">
                {totalRated > 0 ? ((liked / totalRated) * 100).toFixed(0) : 0}%
              </div>
            </div>
            <div className="text-[9px] text-gray-500 mt-0.5">
              {liked} liked · {totalRated - liked} disliked
            </div>
          </div>

          {/* Metric Averages */}
          {scoredCount > 0 && (
            <div className="w-full px-3 py-2.5 rounded-lg border bg-panel-surface border-white/5">
              <div className="text-xs font-medium text-gray-200 mb-2">Metric Averages</div>
              <div className="space-y-1.5">
                {metricStats.map((m) => {
                  const pct = (m.avg / 4) * 100
                  const color =
                    m.avg >= 3
                      ? 'bg-emerald-500'
                      : m.avg >= 2.5
                        ? 'bg-accent'
                        : m.avg >= 2
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                  return (
                    <div key={m.key} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-16 shrink-0">{m.label}</span>
                      <div className="flex-1 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px] text-gray-300 font-mono w-6 text-right">{m.avg.toFixed(1)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Strongest */}
          {strongest && strongest.avg > 0 && (
            <div className="w-full px-3 py-2.5 rounded-lg border flex items-center gap-2 bg-accent/10 border-accent/30">
              <TrendingUp size={14} className="shrink-0 text-accent" />
              <div>
                <div className="text-xs font-medium text-gray-200">Strongest: {strongest.label}</div>
                <div className="text-[9px] text-gray-500 mt-0.5">Avg {strongest.avg.toFixed(2)}</div>
              </div>
            </div>
          )}

          {/* Weakest */}
          {weakest && weakest.avg > 0 && (
            <div className="w-full px-3 py-2.5 rounded-lg border flex items-center gap-2 bg-red-500/10 border-red-500/30">
              <TrendingDown size={14} className="shrink-0 text-red-400" />
              <div>
                <div className="text-xs font-medium text-gray-200">Weakest: {weakest.label}</div>
                <div className="text-[9px] text-gray-500 mt-0.5">Avg {weakest.avg.toFixed(2)} — focus here</div>
              </div>
            </div>
          )}

          {/* Distribution */}
          {totalPoints > 0 && (
            <div className="w-full px-3 py-2.5 rounded-lg border bg-panel-surface border-white/5">
              <div className="text-xs font-medium text-gray-200 mb-2">Score Distribution</div>
              <div className="space-y-1">
                {[4, 3, 2, 1].map((score) => {
                  const count = dist[score]
                  const pct = (count / totalPoints) * 100
                  const color =
                    score === 4
                      ? 'bg-emerald-500'
                      : score === 3
                        ? 'bg-accent'
                        : score === 2
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                  return (
                    <div key={score} className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-400 w-3 text-right font-mono">{score}</span>
                      <div className="flex-1 h-2.5 bg-[#1a1a1a] rounded overflow-hidden">
                        <div className={cn('h-full rounded', color)} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[9px] text-gray-500 w-7 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty */}
          {scoredCount === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <BarChart3 size={28} className="mb-3" />
              <span className="text-sm text-gray-400">No scored ratings yet</span>
              <span className="text-xs text-gray-600 mt-1">Use ⭐ to rate templates</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
