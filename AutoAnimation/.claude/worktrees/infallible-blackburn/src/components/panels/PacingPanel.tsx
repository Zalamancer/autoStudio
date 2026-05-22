import { useCallback } from 'react'
import {
  Activity,
  AlertTriangle,
  ChevronRight,
  Eye,
  EyeOff,
  Gauge,
  Loader2,
  Play,
  RefreshCw,
  Trash2,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelSelect } from '@/components/ui/panel-controls'
import { usePacingStore } from '@/stores/usePacingStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { PACING_PROFILES, type PacingProfileId, type PacingIssueType } from '@/services/pacingAnalyzer'

// ---------------------------------------------------------------------------
// Score gauge SVG — circular arc
// ---------------------------------------------------------------------------

function ScoreGauge({ score }: { score: number }) {
  const size = 100
  const strokeWidth = 8
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference

  const color =
    score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  const bgColor =
    score >= 70
      ? 'rgba(34,197,94,0.1)'
      : score >= 40
        ? 'rgba(245,158,11,0.1)'
        : 'rgba(239,68,68,0.1)'

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill={bgColor}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          strokeDashoffset={circumference * 0.25}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider">
          Score
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inline heatmap strip preview
// ---------------------------------------------------------------------------

function HeatmapStripPreview() {
  const segments = usePacingStore((s) => s.segments)
  const fps = useTimelineStore((s) => s.fps)

  if (segments.length === 0) return null

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wide text-zinc-500 font-medium">
          Pacing Heatmap
        </span>
        <div className="flex items-center gap-2 text-[8px] text-zinc-500">
          <span className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded-sm bg-green-500 inline-block" /> Good
          </span>
          <span className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded-sm bg-amber-500 inline-block" /> Slow
          </span>
          <span className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded-sm bg-red-500 inline-block" /> Fast
          </span>
          <span className="flex items-center gap-0.5">
            <span className="w-2 h-2 rounded-sm bg-zinc-700 inline-block" /> Empty
          </span>
        </div>
      </div>
      <div className="flex h-3 rounded overflow-hidden bg-zinc-800 border border-zinc-700/30">
        {segments.map((seg, i) => {
          const bgColor =
            seg.rating === 'good'
              ? 'bg-green-500'
              : seg.rating === 'slow'
                ? 'bg-amber-500'
                : seg.rating === 'fast'
                  ? 'bg-red-500'
                  : 'bg-zinc-700'
          return (
            <div
              key={i}
              className={cn('flex-1 transition-colors', bgColor)}
              title={`${(seg.startFrame / fps).toFixed(1)}s - ${seg.rating} (${seg.dialogueWps.toFixed(1)} wps, ${seg.keyframeChanges} kf)`}
            />
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Issue icon and label
// ---------------------------------------------------------------------------

function issueIcon(type: PacingIssueType) {
  switch (type) {
    case 'too-fast':
      return <Zap size={10} className="text-red-400" />
    case 'too-slow':
      return <Activity size={10} className="text-amber-400" />
    case 'gap':
      return <AlertTriangle size={10} className="text-orange-400" />
    case 'monotonous':
      return <Gauge size={10} className="text-purple-400" />
  }
}

function issueLabel(type: PacingIssueType) {
  switch (type) {
    case 'too-fast':
      return 'Too Fast'
    case 'too-slow':
      return 'Too Slow'
    case 'gap':
      return 'Gap'
    case 'monotonous':
      return 'Monotonous'
  }
}

// ---------------------------------------------------------------------------
// Main PacingPanel
// ---------------------------------------------------------------------------

export function PacingPanel() {
  const analysis = usePacingStore((s) => s.analysis)
  const overallScore = usePacingStore((s) => s.overallScore)
  const issues = usePacingStore((s) => s.issues)
  const isAnalyzing = usePacingStore((s) => s.isAnalyzing)
  const profileId = usePacingStore((s) => s.profileId)
  const heatmapVisible = usePacingStore((s) => s.heatmapVisible)
  const analyze = usePacingStore((s) => s.analyze)
  const setProfile = usePacingStore((s) => s.setProfile)
  const clearResults = usePacingStore((s) => s.clearResults)
  const toggleHeatmap = usePacingStore((s) => s.toggleHeatmap)
  const seekToFrame = useTimelineStore((s) => s.seekToFrame)
  const fps = useTimelineStore((s) => s.fps)

  const handleAnalyze = useCallback(() => {
    analyze()
  }, [analyze])

  const handleSeekToIssue = useCallback(
    (frame: number) => {
      seekToFrame(frame)
    },
    [seekToFrame]
  )

  return (
    <div className="flex flex-col h-full overflow-y-auto px-3 py-3 space-y-4">
      {/* Header section */}
      <div className="space-y-3">
        {/* Profile selector */}
        <PanelSelect
          label="Pacing Profile"
          value={profileId}
          onChange={(v) => setProfile(v as PacingProfileId)}
          options={PACING_PROFILES.map((p) => ({
            value: p.id,
            label: `${p.label} — ${p.description}`,
          }))}
          fullWidth
        />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-xs font-medium bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Analyzing...
              </>
            ) : analysis ? (
              <>
                <RefreshCw size={14} />
                Re-analyze
              </>
            ) : (
              <>
                <Play size={14} />
                Analyze Pacing
              </>
            )}
          </button>

          {analysis && (
            <>
              <button
                onClick={toggleHeatmap}
                className={cn(
                  'p-2.5 rounded-lg border transition-colors',
                  heatmapVisible
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                    : 'bg-zinc-800 border-zinc-700/50 text-zinc-500 hover:text-zinc-300'
                )}
                title={heatmapVisible ? 'Hide heatmap' : 'Show heatmap'}
              >
                {heatmapVisible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              <button
                onClick={clearResults}
                className="p-2.5 rounded-lg bg-zinc-800 border border-zinc-700/50 text-zinc-500 hover:text-red-400 hover:border-red-500/30 transition-colors"
                title="Clear results"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Results */}
      {analysis && (
        <>
          {/* Score gauge */}
          <div className="flex justify-center py-2">
            <ScoreGauge score={overallScore} />
          </div>

          {/* Segment summary */}
          <div className="grid grid-cols-4 gap-1.5">
            {(['good', 'slow', 'fast', 'empty'] as const).map((rating) => {
              const count = analysis.segments.filter((s) => s.rating === rating).length
              const pct = analysis.segments.length > 0
                ? Math.round((count / analysis.segments.length) * 100)
                : 0
              const colors = {
                good: 'text-green-400 bg-green-500/10 border-green-500/20',
                slow: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                fast: 'text-red-400 bg-red-500/10 border-red-500/20',
                empty: 'text-zinc-400 bg-zinc-700/30 border-zinc-600/30',
              }
              return (
                <div
                  key={rating}
                  className={cn('rounded-lg border px-2 py-1.5 text-center', colors[rating])}
                >
                  <div className="text-sm font-bold tabular-nums">{pct}%</div>
                  <div className="text-[9px] uppercase tracking-wider opacity-70">
                    {rating}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Heatmap strip */}
          <HeatmapStripPreview />

          {/* Issues list */}
          {issues.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-wide text-zinc-500 font-medium">
                  Issues ({issues.length})
                </span>
              </div>
              <div className="space-y-1">
                {issues.map((issue, i) => (
                  <button
                    key={i}
                    onClick={() => handleSeekToIssue(issue.frame)}
                    className="w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-left bg-zinc-800/50 border border-zinc-700/30 hover:bg-zinc-700/40 hover:border-zinc-600/40 transition-colors group"
                  >
                    <div className="shrink-0 mt-0.5">{issueIcon(issue.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium text-zinc-300">
                          {issueLabel(issue.type)}
                        </span>
                        <span className="text-[9px] text-zinc-600">
                          {(issue.frame / fps).toFixed(1)}s
                        </span>
                        <span
                          className={cn(
                            'text-[8px] px-1 rounded-full',
                            issue.severity === 'high'
                              ? 'bg-red-500/20 text-red-400'
                              : issue.severity === 'medium'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-zinc-600/30 text-zinc-400'
                          )}
                        >
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                        {issue.suggestion}
                      </p>
                    </div>
                    <ChevronRight
                      size={12}
                      className="shrink-0 text-zinc-600 group-hover:text-zinc-400 transition-colors mt-1"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No issues state */}
          {issues.length === 0 && (
            <div className="text-center py-4">
              <div className="text-green-400 text-xs font-medium">
                No pacing issues detected
              </div>
              <div className="text-[10px] text-zinc-500 mt-1">
                Your content has well-balanced pacing for the selected profile.
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!analysis && !isAnalyzing && (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700/30 flex items-center justify-center">
            <Activity size={20} className="text-zinc-500" />
          </div>
          <div>
            <p className="text-xs text-zinc-400">No analysis yet</p>
            <p className="text-[10px] text-zinc-600 mt-1 max-w-[200px]">
              Click "Analyze Pacing" to evaluate your timeline's content density and get improvement suggestions.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
