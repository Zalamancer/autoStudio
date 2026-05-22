import { useState, useEffect, useCallback } from 'react'
import {
  Brain,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Loader2,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLearningStore } from '@/stores/useLearningStore'
import { useViralityStore } from '@/stores/useViralityStore'
import type { SocialPlatform } from '@/types/social'
import { analyzeClipVirality, extractAnalysisInputFromStores, type EnhancedViralAnalysis } from '@/services/viralScoreAnalyzer'

/**
 * SVG Radar Chart for 6-dimensional viral scoring.
 */
function RadarChart({ data }: { data: { label: string; value: number }[] }) {
  const size = 140
  const cx = size / 2
  const cy = size / 2
  const radius = 55
  const n = data.length

  // Generate polygon points
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2
    const r = (value / 100) * radius
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  // Background rings
  const rings = [25, 50, 75, 100]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background rings */}
      {rings.map((ring) => {
        const points = Array.from({ length: n }, (_, i) => {
          const pt = getPoint(i, ring)
          return `${pt.x},${pt.y}`
        }).join(' ')
        return (
          <polygon
            key={ring}
            points={points}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        )
      })}

      {/* Axis lines */}
      {data.map((_, i) => {
        const pt = getPoint(i, 100)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={pt.x}
            y2={pt.y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={data.map((d, i) => {
          const pt = getPoint(i, d.value)
          return `${pt.x},${pt.y}`
        }).join(' ')}
        fill="rgba(168, 85, 247, 0.15)"
        stroke="rgba(168, 85, 247, 0.6)"
        strokeWidth="1.5"
      />

      {/* Data points */}
      {data.map((d, i) => {
        const pt = getPoint(i, d.value)
        const color = d.value >= 70 ? '#22c55e' : d.value >= 40 ? '#f59e0b' : '#ef4444'
        return (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="3"
            fill={color}
          />
        )
      })}

      {/* Labels */}
      {data.map((d, i) => {
        const pt = getPoint(i, 120)
        return (
          <text
            key={i}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fill="rgba(255,255,255,0.5)"
          >
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

/**
 * Inline sparkline for score history from useViralityStore.
 */
function ScoreHistorySparkline() {
  const scoreHistory = useViralityStore((s) => s.scoreHistory)
  if (scoreHistory.length < 2) return null

  const width = 120
  const height = 24
  const scores = scoreHistory.map((s) => s.overall)
  const min = Math.min(...scores, 0)
  const max = Math.max(...scores, 100)
  const range = max - min || 1

  const points = scores.map((score, i) => {
    const x = (i / (scores.length - 1)) * width
    const y = height - ((score - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  const latestScore = scores[scores.length - 1]

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="flex-shrink-0">
        <polyline
          points={points}
          fill="none"
          stroke="rgba(168, 85, 247, 0.6)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[9px] text-zinc-500">{scoreHistory.length} scores</span>
      {latestScore !== undefined && (
        <span className={cn(
          'text-[9px] font-bold',
          latestScore >= 70 ? 'text-green-400' : latestScore >= 40 ? 'text-amber-400' : 'text-red-400',
        )}>
          {latestScore}
        </span>
      )}
    </div>
  )
}

/**
 * Compact inline component for the SharePanel.
 * Shows predicted performance score and top 3 recommendations.
 * Consumes from useViralityStore for score history sparkline.
 */
export function PrePublishScore({ platform }: { platform: SocialPlatform }) {
  const {
    currentScore,
    isScoring,
    recommendations,
    scoreCurrentProject,
    applyRecommendation,
    dismissRecommendation,
  } = useLearningStore()

  const [expanded, setExpanded] = useState(false)
  const [enhancedAnalysis, setEnhancedAnalysis] = useState<EnhancedViralAnalysis | null>(null)
  const [showRadar, setShowRadar] = useState(false)

  useEffect(() => {
    scoreCurrentProject(platform)
  }, [platform, scoreCurrentProject])

  const handleEnhancedAnalysis = useCallback(() => {
    try {
      const input = extractAnalysisInputFromStores()
      const analysis = analyzeClipVirality(input)
      setEnhancedAnalysis(analysis)
      setShowRadar(true)
    } catch {
      // Non-fatal
    }
  }, [])

  const pendingRecs = recommendations.filter((r) => r.status === 'pending').slice(0, 3)

  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-400'
    if (score >= 40) return 'text-amber-400'
    return 'text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-green-500/10 border-green-500/20'
    if (score >= 40) return 'bg-amber-500/10 border-amber-500/20'
    return 'bg-red-500/10 border-red-500/20'
  }

  return (
    <div className="bg-zinc-800/40 rounded-lg border border-zinc-700/30 overflow-hidden">
      {/* Header - always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-zinc-700/20 transition-colors">
        <div className="flex items-center gap-2">
          <Brain size={14} className="text-purple-400" />
          <span className="text-xs font-medium text-zinc-300">AI Score</span>
        </div>
        <div className="flex items-center gap-2">
          {isScoring ? (
            <Loader2 size={12} className="animate-spin text-zinc-400" />
          ) : currentScore ? (
            <span className={`text-sm font-bold ${getScoreColor(currentScore.score)}`}>
              {currentScore.score}/100
            </span>
          ) : (
            <span className="text-[10px] text-zinc-500">Not scored</span>
          )}
          {expanded ? <ChevronUp size={12} className="text-zinc-500" /> : <ChevronDown size={12} className="text-zinc-500" />}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2.5 border-t border-zinc-700/20 pt-2.5">
          {/* Score Details */}
          {currentScore && (
            <div className={`rounded-md border p-2 ${getScoreBg(currentScore.score)}`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-zinc-400">Predicted Performance</span>
                {currentScore.confidence < 0.5 && (
                  <div className="flex items-center gap-0.5 text-[9px] text-amber-400">
                    <AlertCircle size={8} />
                    Low data
                  </div>
                )}
              </div>
              {/* Top factors */}
              {currentScore.factors.slice(0, 3).map((factor) => (
                <div key={factor.featureKey} className="flex items-center justify-between py-0.5">
                  <span className="text-[10px] text-zinc-300">{factor.label}</span>
                  <span className={`text-[10px] ${
                    factor.impact === 'positive' ? 'text-green-400' :
                    factor.impact === 'negative' ? 'text-red-400' : 'text-zinc-500'
                  }`}>
                    {factor.impact === 'positive' ? 'Good' : factor.impact === 'negative' ? 'Improve' : 'OK'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Score History Sparkline from useViralityStore */}
          <ScoreHistorySparkline />

          {/* Top Recommendations */}
          {pendingRecs.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase tracking-wide text-zinc-500 font-medium">
                Quick Improvements
              </span>
              {pendingRecs.map((rec) => (
                <div key={rec.id} className="flex items-center gap-2 bg-zinc-800/60 rounded p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-white truncate">{rec.title}</p>
                  </div>
                  {rec.actionType && (
                    <button
                      onClick={(e) => { e.stopPropagation(); applyRecommendation(rec) }}
                      className="flex-shrink-0 p-1 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
                      title="Apply">
                      <ArrowRight size={10} />
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); dismissRecommendation(rec.id) }}
                    className="flex-shrink-0 p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/40 transition-colors"
                    title="Dismiss">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Enhanced 6-Dimension Radar Analysis */}
          <div className="border-t border-zinc-700/20 pt-2">
            <button
              onClick={handleEnhancedAnalysis}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-medium bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 text-purple-300 hover:from-purple-500/20 hover:to-blue-500/20 transition-all"
            >
              <Sparkles size={10} />
              6-Dimension Radar Analysis
            </button>

            {showRadar && enhancedAnalysis && (
              <div className="mt-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Radar Chart */}
                <div className="flex justify-center">
                  <RadarChart
                    data={enhancedAnalysis.radarData.map((d) => ({
                      label: d.label,
                      value: d.value,
                    }))}
                  />
                </div>

                {/* Dimension Bars */}
                {enhancedAnalysis.radarData.map((dim) => (
                  <div key={dim.dimension} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-zinc-400">{dim.label}</span>
                      <span className={cn(
                        'text-[9px] font-bold',
                        dim.value >= 70 ? 'text-green-400' : dim.value >= 40 ? 'text-amber-400' : 'text-red-400',
                      )}>
                        {dim.value}
                      </span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-500',
                          dim.value >= 70 ? 'bg-green-500' : dim.value >= 40 ? 'bg-amber-500' : 'bg-red-500',
                        )}
                        style={{ width: `${dim.value}%` }}
                      />
                    </div>
                  </div>
                ))}

                {/* Actionable Suggestions */}
                {enhancedAnalysis.suggestions.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[9px] uppercase tracking-wide text-zinc-500 font-medium">
                      Top Improvements
                    </span>
                    {enhancedAnalysis.suggestions.slice(0, 4).map((sug) => (
                      <div
                        key={sug.id}
                        className={cn(
                          'text-[10px] px-2 py-1.5 rounded-md border',
                          sug.priority === 'high' ? 'bg-red-500/5 border-red-500/10 text-red-300' :
                          sug.priority === 'medium' ? 'bg-amber-500/5 border-amber-500/10 text-amber-300' :
                          'bg-blue-500/5 border-blue-500/10 text-blue-300',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="flex-1">{sug.text}</span>
                          <span className="text-[8px] ml-2 shrink-0 opacity-60">+{sug.impact} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
