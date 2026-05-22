/**
 * SmartZoomPanel — Configure and apply AI-powered camera zoom from transcript.
 *
 * Sections:
 * 1. Style selector (Smooth, Crash, Expo, Linear)
 * 2. Intensity controls (max zoom, frequency)
 * 3. Trigger toggles (sentence starts, exclamation, etc.)
 * 4. AI Enhancement toggle
 * 5. Preview (zoom curve)
 * 6. Apply/Clear buttons
 */

import { useState, useCallback, useMemo } from 'react'
import {
  ZoomIn, Zap, TrendingUp, Minus,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranscriptStore } from '@/stores/useTranscriptStore'
import { useCameraStore } from '@/stores/useCameraStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { getSmartZoomService } from '@/services/smartZoom'
import { toast } from '@/stores/useToastStore'
import { PanelToggle } from '@/components/ui/panel-controls/PanelToggle'
import { PanelSection } from '@/components/ui/panel-controls/PanelSection'
import { PanelSlider } from '@/components/ui/panel-controls'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { SmartZoomConfig, ZoomStyle, ZoomPoint } from '@/types/smartZoom'

const ZOOM_STYLES: { id: ZoomStyle; name: string; description: string; icon: typeof ZoomIn }[] = [
  { id: 'smooth', name: 'Smooth', description: 'Ease-in-out over ~500ms', icon: TrendingUp },
  { id: 'crash', name: 'Crash', description: 'Instant jump, ease-out return', icon: Zap },
  { id: 'expo', name: 'Expo', description: 'Fast accelerating zoom', icon: ZoomIn },
  { id: 'linear', name: 'Linear', description: 'Constant speed zoom', icon: Minus },
]

const FREQUENCY_OPTIONS = [
  { id: 'conservative' as const, name: 'Conservative', description: 'Top 20% emphasis', pct: '20%' },
  { id: 'moderate' as const, name: 'Moderate', description: 'Top 50% emphasis', pct: '50%' },
  { id: 'aggressive' as const, name: 'Aggressive', description: 'Top 80% emphasis', pct: '80%' },
]

const DEFAULT_CONFIG: SmartZoomConfig = {
  style: 'smooth',
  intensity: 0.7,
  frequency: 'moderate',
  maxZoom: 1.3,
  includeTopicTransitions: true,
  includeSpeakerChanges: true,
  includeEmphasis: true,
  includePunctuation: true,
  useAI: false,
}

export function SmartZoomPanel() {
  const editedSegments = useTranscriptStore((s) => s.editedSegments)
  const smartZoomConfig = useCameraStore((s) => s.smartZoomConfig)
  const applySmartZoom = useCameraStore((s) => s.applySmartZoom)
  const clearSmartZoom = useCameraStore((s) => s.clearSmartZoom)
  const fps = useTimelineStore((s) => s.fps)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  const [config, setConfig] = useState<SmartZoomConfig>(smartZoomConfig || DEFAULT_CONFIG)
  const [isGenerating, setIsGenerating] = useState(false)
  const [zoomPoints, setZoomPoints] = useState<ZoomPoint[]>([])

  const hasTranscript = editedSegments.length > 0

  const handleGenerate = useCallback(async () => {
    if (!hasTranscript) return

    setIsGenerating(true)
    try {
      const words = editedSegments.flatMap((seg) => seg.words)
      const service = getSmartZoomService()

      const points = await service.analyzeForZoom(editedSegments, words, config, fps)
      setZoomPoints(points)

      const keyframes = service.generateCameraKeyframes(points, config, fps, totalFrames)
      applySmartZoom(keyframes, config)

      toast.success(`Applied ${points.length} smart zoom points`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Smart zoom generation failed')
    } finally {
      setIsGenerating(false)
    }
  }, [hasTranscript, editedSegments, config, fps, totalFrames, applySmartZoom])

  const handleClear = useCallback(() => {
    clearSmartZoom()
    setZoomPoints([])
    toast.success('Smart zoom cleared')
  }, [clearSmartZoom])

  const updateConfig = useCallback(<K extends keyof SmartZoomConfig>(key: K, value: SmartZoomConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }, [])

  if (!hasTranscript) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
        <ZoomIn size={20} className="text-zinc-600" />
        <p className="text-xs text-zinc-500">Transcribe audio first</p>
        <p className="text-[10px] text-zinc-600">
          Smart zoom requires transcript data to detect emphasis points
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Style selector */}
      <PanelSection title="Zoom Style">
        <div className="grid grid-cols-2 gap-1.5">
          {ZOOM_STYLES.map((style) => {
            const Icon = style.icon
            const isActive = config.style === style.id
            return (
              <button
                key={style.id}
                onClick={() => updateConfig('style', style.id)}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg border transition-all',
                  isActive
                    ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                    : 'bg-zinc-800/40 border-white/5 text-zinc-400 hover:border-white/10 hover:text-zinc-300',
                )}
              >
                <Icon size={14} />
                <div className="text-left">
                  <p className="text-[10px] font-medium">{style.name}</p>
                  <p className="text-[8px] text-zinc-500">{style.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </PanelSection>

      {/* Max zoom */}
      <PanelSlider
        label="Max Zoom"
        value={config.maxZoom}
        onChange={(v) => updateConfig('maxZoom', v)}
        min={1.1}
        max={2.0}
        step={0.1}
        precision={1}
        suffix="x"
      />

      {/* Intensity */}
      <PanelSlider
        label="Intensity"
        value={Math.round(config.intensity * 100)}
        onChange={(v) => updateConfig('intensity', v / 100)}
        min={10}
        max={100}
        step={10}
        suffix="%"
      />

      {/* Frequency selector */}
      <PanelSection title="Frequency">
        <div className="flex gap-1">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => updateConfig('frequency', opt.id)}
              className={cn(
                'flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all text-center',
                config.frequency === opt.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-zinc-800/40 text-zinc-500 border border-white/5 hover:text-zinc-300',
              )}
            >
              {opt.name}
              <div className="text-[8px] opacity-60">{opt.pct}</div>
            </button>
          ))}
        </div>
      </PanelSection>

      {/* Trigger toggles */}
      <PanelSection title="Triggers">
        <PanelToggle
          label="Sentence starts"
          checked={config.includeEmphasis}
          onChange={(v) => updateConfig('includeEmphasis', v)}
        />
        <PanelToggle
          label="Exclamation marks"
          checked={config.includePunctuation}
          onChange={(v) => updateConfig('includePunctuation', v)}
        />
        <PanelToggle
          label="Question marks"
          checked={config.includePunctuation}
          onChange={(v) => updateConfig('includePunctuation', v)}
        />
        <PanelToggle
          label="Speaker changes"
          checked={config.includeSpeakerChanges}
          onChange={(v) => updateConfig('includeSpeakerChanges', v)}
        />
        <PanelToggle
          label="Topic transitions"
          checked={config.includeTopicTransitions}
          onChange={(v) => updateConfig('includeTopicTransitions', v)}
        />
      </PanelSection>

      {/* AI Enhancement */}
      <div className="space-y-1">
        <PanelToggle
          label="AI Enhancement (Gemini)"
          checked={config.useAI}
          onChange={(v) => updateConfig('useAI', v)}
        />
        {config.useAI && (
          <p className="text-[9px] text-zinc-600 pl-6">
            Uses Gemini to detect semantic emphasis beyond rules. ~1000 tokens.
          </p>
        )}
      </div>

      {/* Preview: zoom curve visualization */}
      {zoomPoints.length > 0 && (
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-500">Zoom Points ({zoomPoints.length})</span>
          <ZoomCurvePreview points={zoomPoints} totalFrames={totalFrames} fps={fps} />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium bg-cyan-500 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
        >
          {isGenerating ? (
            <LoadingSpinner size={14} />
          ) : (
            <ZoomIn size={14} />
          )}
          {isGenerating ? 'Generating...' : smartZoomConfig ? 'Regenerate' : 'Apply Smart Zoom'}
        </button>

        {smartZoomConfig && (
          <button
            onClick={handleClear}
            className="px-3 py-2 rounded-xl text-xs font-medium bg-zinc-700 text-zinc-300 hover:bg-zinc-600 transition-all"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

function ZoomCurvePreview({ points, totalFrames, fps }: { points: ZoomPoint[]; totalFrames: number; fps: number }) {
  const width = 200
  const height = 40

  const pathData = useMemo(() => {
    if (points.length === 0 || totalFrames === 0) return ''

    const segments: string[] = [`M 0 ${height}`]

    for (const point of points) {
      const x = (point.frame / totalFrames) * width
      const y = height - point.intensity * height
      // Simple peak visualization
      segments.push(`L ${Math.max(0, x - 3)} ${height}`)
      segments.push(`L ${x} ${y}`)
      segments.push(`L ${Math.min(width, x + 3)} ${height}`)
    }

    segments.push(`L ${width} ${height}`)
    return segments.join(' ')
  }, [points, totalFrames, width, height])

  return (
    <div className="p-2 rounded-lg bg-zinc-800/40 border border-white/5">
      <svg width={width} height={height} className="w-full" viewBox={`0 0 ${width} ${height}`}>
        <path d={pathData} fill="rgba(34, 211, 238, 0.15)" stroke="rgba(34, 211, 238, 0.6)" strokeWidth={1} />
        {/* Dots at zoom points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={(p.frame / totalFrames) * width}
            cy={height - p.intensity * height}
            r={2}
            fill="#22d3ee"
          />
        ))}
      </svg>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[8px] text-zinc-600">0s</span>
        <span className="text-[8px] text-zinc-600">{(totalFrames / fps).toFixed(0)}s</span>
      </div>
    </div>
  )
}
