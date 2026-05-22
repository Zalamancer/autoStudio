import React, { useEffect, useState, useRef, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTemplateRatingStore, METRICS, type MetricName } from '@/stores/useTemplateRatingStore'

// ── Score label helpers ──────────────────────────────────────────────

const SCORE_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Bad', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40' },
  2: { label: 'Below avg', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/40' },
  3: { label: 'Above avg', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/40' },
  4: { label: 'Great', color: 'text-emerald-300', bg: 'bg-emerald-500/20 border-emerald-500/40' },
}

function getMetricInfo(key: MetricName) {
  return METRICS.find((m) => m.key === key)!
}

// ── Error boundary for preview isolation ─────────────────────────────

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch() {
    // Auto-skip this broken template after a brief delay
    setTimeout(() => this.props.onError(), 500)
  }
  componentDidUpdate(prevProps: { children: React.ReactNode }) {
    if (prevProps.children !== this.props.children) {
      this.setState({ hasError: false })
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full aspect-video rounded-xl bg-red-950/50 border border-red-500/30 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-400 text-sm font-medium">Template crashed</div>
            <div className="text-red-500/60 text-xs mt-1">Auto-skipping...</div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Template preview (large, auto-playing) ───────────────────────────

function LargePreview({ registration }: { registration: any }) {
  const Component = registration.component as React.ComponentType<any>
  const [frame, setFrame] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef(performance.now())
  const fps = 30
  const durationInFrames = fps * 5

  useEffect(() => {
    startRef.current = performance.now()
    const tick = (now: number) => {
      const elapsed = (now - startRef.current) / 1000
      setFrame(Math.floor(elapsed * fps) % durationInFrames)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [registration.id])

  return (
    <div className="w-full aspect-video relative overflow-hidden rounded-xl bg-black">
      <Component
        config={registration.defaultConfig}
        frame={frame}
        durationInFrames={durationInFrames}
        fps={fps}
        width={960}
        height={540}
        progress={frame / durationInFrames}
      />
    </div>
  )
}

// ── Main overlay ─────────────────────────────────────────────────────

export function TemplateRaterOverlay() {
  const active = useTemplateRatingStore((s) => s.active)
  const templates = useTemplateRatingStore((s) => s.templates)
  const currentIndex = useTemplateRatingStore((s) => s.currentIndex)
  const metricOrder = useTemplateRatingStore((s) => s.metricOrder)
  const currentMetricIdx = useTemplateRatingStore((s) => s.currentMetricIdx)
  const pendingScores = useTemplateRatingStore((s) => s.pendingScores)
  const ratings = useTemplateRatingStore((s) => s.ratings)

  const rateCurrentMetric = useTemplateRatingStore((s) => s.rateCurrentMetric)
  const rateAllMetrics = useTemplateRatingStore((s) => s.rateAllMetrics)
  const nextMetric = useTemplateRatingStore((s) => s.nextMetric)
  const prevMetric = useTemplateRatingStore((s) => s.prevMetric)
  const skipTemplate = useTemplateRatingStore((s) => s.skipTemplate)
  const prevTemplate = useTemplateRatingStore((s) => s.prevTemplate)
  const stopRating = useTemplateRatingStore((s) => s.stopRating)

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!active) return

      switch (e.key) {
        case '`':
          rateAllMetrics(1)
          break
        case '1':
          rateCurrentMetric(1)
          break
        case '2':
          rateCurrentMetric(2)
          break
        case '3':
          rateCurrentMetric(3)
          break
        case '4':
          rateCurrentMetric(4)
          break
        case ']':
          nextMetric()
          break
        case '[':
          prevMetric()
          break
        case 'd':
          skipTemplate()
          break
        case 'a':
          prevTemplate()
          break
        case 'Escape':
          stopRating()
          break
      }
    },
    [active, rateCurrentMetric, rateAllMetrics, nextMetric, prevMetric, skipTemplate, prevTemplate, stopRating],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!active || templates.length === 0) return null

  const template = templates[currentIndex]
  if (!template) return null

  const currentMetricKey = metricOrder[currentMetricIdx]
  const metricInfo = getMetricInfo(currentMetricKey)
  const existingScore = pendingScores[currentMetricKey]
  const totalRated = Object.keys(ratings).length
  const totalTemplates = templates.length

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-zinc-400 text-sm font-mono">
            {currentIndex + 1}/{totalTemplates}
          </span>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-300 text-sm font-medium truncate max-w-[300px]">{template.title}</span>
          <span className="text-zinc-600 text-xs">{template.id}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-zinc-500 text-xs">Rated: {totalRated}</span>
          <button
            onClick={stopRating}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="w-full max-w-4xl mb-6">
        <PreviewErrorBoundary onError={skipTemplate}>
          <LargePreview registration={template} />
        </PreviewErrorBoundary>
      </div>

      {/* Metric rating area */}
      <div className="w-full max-w-4xl">
        {/* Metric progress dots */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {metricOrder.map((key, idx) => {
            const scored = pendingScores[key] != null
            const isCurrent = idx === currentMetricIdx
            return (
              <div
                key={key}
                className={cn(
                  'w-2.5 h-2.5 rounded-full transition-all',
                  isCurrent ? 'w-8 bg-blue-500' : scored ? 'bg-green-500/60' : 'bg-zinc-700',
                )}
              />
            )
          })}
        </div>

        {/* Current metric */}
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-white mb-1">{metricInfo.label}</div>
          <div className="text-zinc-400 text-sm">{metricInfo.question}</div>
          <div className="text-zinc-600 text-xs mt-1">
            Metric {currentMetricIdx + 1} of {metricOrder.length}
          </div>
        </div>

        {/* Score buttons */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {([1, 2, 3, 4] as const).map((score) => {
            const info = SCORE_LABELS[score]
            const isSelected = existingScore === score
            return (
              <button
                key={score}
                onClick={() => rateCurrentMetric(score)}
                className={cn(
                  'flex flex-col items-center gap-1 px-6 py-3 rounded-xl border-2 transition-all',
                  isSelected ? info.bg : 'border-zinc-700/50 bg-zinc-800/50 hover:bg-zinc-700/50 hover:border-zinc-600',
                )}
              >
                <span className={cn('text-3xl font-bold', isSelected ? info.color : 'text-zinc-300')}>{score}</span>
                <span className={cn('text-xs', isSelected ? info.color : 'text-zinc-500')}>{info.label}</span>
              </button>
            )
          })}
        </div>

        {/* Navigation hints */}
        <div className="flex items-center justify-center gap-6 text-zinc-600 text-xs">
          <span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono">`</kbd> all 1
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono">1</kbd>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono mx-0.5">2</kbd>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono">3</kbd>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono ml-0.5">4</kbd> rate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono">[</kbd>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono ml-0.5">]</kbd> metric
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono">A</kbd> prev
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono ml-0.5">D</kbd> next
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono">Esc</kbd> exit
          </span>
        </div>
      </div>
    </div>
  )
}
