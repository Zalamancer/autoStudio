import { useCallback } from 'react'
import { Gauge, Loader2, Lightbulb, TrendingUp } from 'lucide-react'
import { PanelCheckbox } from '@/components/ui/panel-controls'
import { useContentScoreStore } from '@/stores/useContentScoreStore'
import { scoreContent } from '@/services/contentScoringService'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { useEditorStore } from '@/stores/useEditorStore'

const METRIC_LABELS: Record<string, string> = {
  composition: 'Composition',
  pacing: 'Pacing',
  audioQuality: 'Audio Quality',
  visualAppeal: 'Visual Appeal',
  hookStrength: 'Hook Strength',
}

function ScoreGauge({ value }: { value: number }) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const progress = (value / 100) * circumference
  const color = value >= 70 ? '#22c55e' : value >= 40 ? '#eab308' : '#ef4444'

  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={circumference - progress}
          strokeLinecap="round" className="transition-all duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-zinc-100">{value}</span>
        <span className="text-[10px] text-zinc-500">/ 100</span>
      </div>
    </div>
  )
}

function MetricBar({ label, value }: { label: string; value: number }) {
  const color = value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-300 font-medium">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

export function ContentScorePanel() {
  const { currentScore, isScoring, autoScoreEnabled, setCurrentScore, addToHistory, setIsScoring, setAutoScoreEnabled } = useContentScoreStore()

  const handleScore = useCallback(async () => {
    setIsScoring(true)
    try {
      const timelineState = useTimelineStore.getState()
      const voiceState = useVoiceStore.getState()
      const textState = useTextOverlayStore.getState()
      const charState = useMultiCharacterStore.getState()
      const playbackState = usePlaybackStore.getState()
      const editorState = useEditorStore.getState()

      const projectState = {
        tracks: timelineState.tracks?.map((t: { clips?: Array<{ startFrame: number; endFrame: number }> }) => ({
          clips: t.clips?.map((c: { startFrame: number; endFrame: number }) => ({
            startFrame: c.startFrame,
            endFrame: c.endFrame,
          })),
        })),
        textOverlays: textState.overlays?.map((o: { content: string; startFrame?: number }) => ({
          text: o.content,
          startFrame: o.startFrame ?? 0,
        })),
        voiceGenerated: voiceState.generatedVoices.length > 0,
        musicEnabled: false,
        captionsEnabled: voiceState.captionStyle !== undefined,
        totalDuration: playbackState.duration ?? 0,
        fps: playbackState.fps ?? 30,
        characters: charState.characters?.map((c: { id: string }) => ({ id: c.id })),
        aspectRatio: editorState.aspectRatio,
      }

      const score = scoreContent(projectState)
      setCurrentScore(score)
      addToHistory(score)
    } finally {
      setIsScoring(false)
    }
  }, [setCurrentScore, addToHistory, setIsScoring])

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Gauge size={14} className="text-green-400" />
          <span className="text-sm font-medium text-zinc-200">Content Score</span>
        </div>
        <PanelCheckbox
          label="Auto"
          checked={autoScoreEnabled}
          onChange={(v) => setAutoScoreEnabled(v)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {/* Score button */}
        <button
          onClick={handleScore}
          disabled={isScoring}
          className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors bg-green-600 hover:bg-green-500 text-white disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isScoring ? (
            <><Loader2 size={14} className="animate-spin" /> Analyzing...</>
          ) : (
            <><TrendingUp size={14} /> Score Now</>
          )}
        </button>

        {currentScore && (
          <>
            {/* Overall gauge */}
            <ScoreGauge value={currentScore.overall} />

            {/* Retention prediction */}
            <div className="text-center">
              <div className="text-[11px] text-zinc-500">Predicted Retention</div>
              <div className="text-lg font-semibold text-zinc-200">{currentScore.retentionPrediction}%</div>
            </div>

            {/* Metric breakdown */}
            <div className="space-y-3">
              {Object.entries(METRIC_LABELS).map(([key, label]) => (
                <MetricBar
                  key={key}
                  label={label}
                  value={currentScore[key as keyof typeof currentScore] as number}
                />
              ))}
            </div>

            {/* Suggestions */}
            {currentScore.suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                  <Lightbulb size={12} className="text-yellow-400" />
                  Suggestions
                </div>
                <div className="space-y-1.5">
                  {currentScore.suggestions.map((s, i) => (
                    <div key={i} className="text-[11px] text-zinc-500 pl-4 relative before:content-[''] before:absolute before:left-1 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-zinc-600">
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {!currentScore && !isScoring && (
          <div className="text-center py-8 text-zinc-600 text-xs">
            Click "Score Now" to analyze your content
          </div>
        )}
      </div>
    </div>
  )
}
