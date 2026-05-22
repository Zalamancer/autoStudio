/**
 * ViralityPanel -- full scoring panel with radar chart, dimension bars,
 * suggestion cards, score history sparkline, comparison mode, and manual trigger.
 */

import { useState, useCallback } from 'react'
import {
  Brain,
  Loader2,
  Camera,
  Trash2,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  Lightbulb,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useViralityStore, type ViralitySnapshot } from '@/stores/useViralityStore'
import type { ViralScore, ViralScoreDimensions } from '@/types/orchestrator'

// -- Radar Chart SVG --

const DIMENSION_LABELS: { key: keyof ViralScoreDimensions; label: string }[] = [
  { key: 'hook', label: 'Hook' },
  { key: 'pacing', label: 'Pacing' },
  { key: 'trend', label: 'Trend' },
  { key: 'emotion', label: 'Emotion' },
  { key: 'visual', label: 'Visual' },
  { key: 'rewatch', label: 'Rewatch' },
]

function RadarChart({ data, size = 160 }: { data: ViralScoreDimensions; size?: number }) {
  const cx = size / 2
  const cy = size / 2
  const radius = (size - 40) / 2
  const n = DIMENSION_LABELS.length

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / n - Math.PI / 2
    const r = (value / 100) * radius
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  }

  const rings = [25, 50, 75, 100]

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
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
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={0.5}
          />
        )
      })}

      {DIMENSION_LABELS.map((_, i) => {
        const pt = getPoint(i, 100)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={pt.x}
            y2={pt.y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={0.5}
          />
        )
      })}

      <polygon
        points={DIMENSION_LABELS.map((d, i) => {
          const pt = getPoint(i, data[d.key] || 0)
          return `${pt.x},${pt.y}`
        }).join(' ')}
        fill="rgba(59, 130, 246, 0.25)"
        stroke="rgb(59, 130, 246)"
        strokeWidth={1.5}
      />

      {DIMENSION_LABELS.map((d, i) => {
        const pt = getPoint(i, 110)
        return (
          <text
            key={d.key}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(255,255,255,0.6)"
            fontSize={9}
          >
            {d.label}
          </text>
        )
      })}
    </svg>
  )
}

// -- Score History Sparkline --

function ScoreHistorySparkline({ history }: { history: ViralScore[] }) {
  if (history.length < 2) return null
  const w = 120
  const h = 32
  const maxScore = 100
  const points = history
    .slice(0, 20)
    .reverse()
    .map((s, i, arr) => {
      const x = (i / Math.max(arr.length - 1, 1)) * w
      const y = h - (s.overall / maxScore) * h
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline
        points={points}
        fill="none"
        stroke="rgb(59, 130, 246)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  )
}

// -- Dimension Bar --

function DimensionBar({ label, value }: { label: string; value: number }) {
  const color =
    value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-blue-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-white/50 truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-6 text-right text-white/70">{value}</span>
    </div>
  )
}

// -- Suggestion Card --

function SuggestionCard({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 p-2 rounded bg-white/5 text-xs">
      <Lightbulb className="w-3.5 h-3.5 text-yellow-400 mt-0.5 shrink-0" />
      <span className="text-white/70">{text}</span>
    </div>
  )
}

// -- Snapshot Comparison --

function SnapshotComparison({
  snapshots,
  onRemove,
}: {
  snapshots: ViralitySnapshot[]
  onRemove: (id: string) => void
}) {
  if (snapshots.length < 2) return null

  const a = snapshots[0]
  const b = snapshots[1]

  return (
    <div className="space-y-2">
      <div className="text-xs text-white/40 font-medium">Comparison</div>
      <div className="grid grid-cols-2 gap-2">
        {[a, b].map((snap) => (
          <div key={snap.id} className="p-2 rounded bg-white/5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-white/70 truncate">{snap.name}</span>
              <button
                onClick={() => onRemove(snap.id)}
                className="text-white/30 hover:text-red-400"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <div className="text-lg font-bold text-blue-400">{snap.score.overall}</div>
            <RadarChart data={snap.score.dimensions} size={100} />
          </div>
        ))}
      </div>
    </div>
  )
}

// -- Main Panel --

export function ViralityPanel() {
  const currentScore = useViralityStore((s) => s.currentScore)
  const scoreHistory = useViralityStore((s) => s.scoreHistory)
  const isScoring = useViralityStore((s) => s.isScoring)
  const error = useViralityStore((s) => s.error)
  const snapshots = useViralityStore((s) => s.comparisonSnapshots)
  const scoringConfig = useViralityStore((s) => s.scoringConfig)
  const triggerScore = useViralityStore((s) => s.triggerScore)
  const saveSnapshot = useViralityStore((s) => s.saveSnapshot)
  const removeSnapshot = useViralityStore((s) => s.removeSnapshot)
  const clearHistory = useViralityStore((s) => s.clearHistory)
  const setScoringConfig = useViralityStore((s) => s.setScoringConfig)

  const [snapshotName, setSnapshotName] = useState('')

  const handleScore = useCallback(() => {
    triggerScore()
  }, [triggerScore])

  const handleSaveSnapshot = useCallback(() => {
    const name = snapshotName.trim() || `Snapshot ${snapshots.length + 1}`
    saveSnapshot(name)
    setSnapshotName('')
  }, [snapshotName, snapshots.length, saveSnapshot])

  return (
    <div className="space-y-4 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-white/80">Virality Score</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScoringConfig({ autoScore: !scoringConfig.autoScore })}
            className={cn(
              'px-2 py-0.5 text-xs rounded',
              scoringConfig.autoScore
                ? 'bg-blue-500/20 text-blue-400'
                : 'bg-white/5 text-white/40'
            )}
          >
            Auto
          </button>
          <button
            onClick={handleScore}
            disabled={isScoring}
            className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white"
          >
            {isScoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Score Now
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Score Display */}
      {currentScore && (
        <>
          {/* Overall Score + Radar */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">{currentScore.overall}</div>
              <div className="text-xs text-white/40">Overall</div>
            </div>
            <RadarChart data={currentScore.dimensions} />
          </div>

          {/* Dimension Bars */}
          <div className="space-y-1.5">
            {DIMENSION_LABELS.map((d) => (
              <DimensionBar
                key={d.key}
                label={d.label}
                value={currentScore.dimensions[d.key] || 0}
              />
            ))}
          </div>

          {/* Score History Sparkline */}
          {scoreHistory.length > 1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-white/40" />
                <span className="text-xs text-white/40">History ({scoreHistory.length})</span>
              </div>
              <ScoreHistorySparkline history={scoreHistory} />
              <button onClick={clearHistory} className="text-white/30 hover:text-white/60">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Suggestions */}
          {currentScore.suggestions.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs text-white/40 font-medium flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> Suggestions
              </div>
              {currentScore.suggestions.slice(0, 5).map((s, i) => (
                <SuggestionCard key={i} text={s} />
              ))}
            </div>
          )}

          {/* Save Snapshot */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Snapshot name..."
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              className="flex-1 px-2 py-1 text-xs rounded bg-white/5 border border-white/10 text-white placeholder:text-white/30"
            />
            <button
              onClick={handleSaveSnapshot}
              disabled={snapshots.length >= 3}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white/70"
            >
              <Camera className="w-3 h-3" /> Save
            </button>
          </div>

          {/* Snapshot Comparison */}
          <SnapshotComparison snapshots={snapshots} onRemove={removeSnapshot} />
        </>
      )}

      {/* Empty State */}
      {!currentScore && !isScoring && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <BarChart3 className="w-8 h-8 text-white/20 mb-2" />
          <p className="text-xs text-white/40">
            Click "Score Now" or enable Auto to analyze your clip's viral potential.
          </p>
        </div>
      )}

      {/* Loading State */}
      {isScoring && !currentScore && (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-blue-400 animate-spin mb-2" />
          <p className="text-xs text-white/40">Analyzing viral potential...</p>
        </div>
      )}
    </div>
  )
}
