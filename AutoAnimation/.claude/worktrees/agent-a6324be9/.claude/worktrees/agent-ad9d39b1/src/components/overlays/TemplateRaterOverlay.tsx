import React, { useEffect, useState, useRef, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTemplateRatingStore, CALIBRATION_ANCHORS } from '@/stores/useTemplateRatingStore'

// ── Score label helpers ──────────────────────────────────────────────

const SCORE_LABELS: Record<number, { label: string; color: string; bg: string }> = {
  1: { label: 'Bad', color: 'text-red-400', bg: 'bg-red-500/20 border-red-500/40' },
  2: { label: 'Below avg', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/40' },
  3: { label: 'Above avg', color: 'text-green-400', bg: 'bg-green-500/20 border-green-500/40' },
  4: { label: 'Great', color: 'text-emerald-300', bg: 'bg-emerald-500/20 border-emerald-500/40' },
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
  const calibrating = useTemplateRatingStore((s) => s.calibrating)
  const calibrationIndex = useTemplateRatingStore((s) => s.calibrationIndex)
  const templates = useTemplateRatingStore((s) => s.templates)
  const currentIndex = useTemplateRatingStore((s) => s.currentIndex)
  const ratings = useTemplateRatingStore((s) => s.ratings)

  const rateCurrentMetric = useTemplateRatingStore((s) => s.rateCurrentMetric)
  const advanceCalibration = useTemplateRatingStore((s) => s.advanceCalibration)
  const skipTemplate = useTemplateRatingStore((s) => s.skipTemplate)
  const prevTemplate = useTemplateRatingStore((s) => s.prevTemplate)
  const stopRating = useTemplateRatingStore((s) => s.stopRating)

  // Keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!active) return

      // During calibration, any key advances
      if (calibrating) {
        if (e.key === 'Escape') {
          stopRating()
          return
        }
        if (['1', '2', '3', '4', ' ', 'Enter', 'd'].includes(e.key)) {
          advanceCalibration()
        }
        return
      }

      switch (e.key) {
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
    [active, calibrating, rateCurrentMetric, advanceCalibration, skipTemplate, prevTemplate, stopRating],
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!active || templates.length === 0) return null

  // ── Calibration phase (text-only — no template previews to avoid style bias) ──
  if (calibrating) {
    const anchor = CALIBRATION_ANCHORS[calibrationIndex]

    return (
      <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div className="text-zinc-500 text-xs mb-6">
            Calibration {calibrationIndex + 1}/{CALIBRATION_ANCHORS.length}
          </div>
          <div className="text-5xl font-black text-white mb-4">{anchor.score}</div>
          <div className="text-xl font-bold text-white mb-3">{anchor.label}</div>
          <div className="text-zinc-400 text-base leading-relaxed mb-8">{anchor.description}</div>
          <div className="text-zinc-600 text-xs">Press any key to continue</div>
        </div>
        <div className="flex items-center justify-center gap-4 mt-8">
          {CALIBRATION_ANCHORS.map((a, i) => (
            <div
              key={a.score}
              className={cn(
                'w-3 h-3 rounded-full transition-all',
                i === calibrationIndex ? 'w-8 bg-blue-500' : i < calibrationIndex ? 'bg-green-500/60' : 'bg-zinc-700',
              )}
            />
          ))}
        </div>
      </div>
    )
  }

  // ── Normal rating phase ──
  const template = templates[currentIndex]
  if (!template) return null

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

      {/* Rating area — single metric, press 1-4 to rate and advance */}
      <div className="w-full max-w-4xl">
        <div className="text-center mb-4">
          <div className="text-zinc-400 text-sm">Would you ship this?</div>
        </div>

        {/* Score buttons */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {([1, 2, 3, 4] as const).map((score) => {
            const info = SCORE_LABELS[score]
            return (
              <button
                key={score}
                onClick={() => rateCurrentMetric(score)}
                className={cn(
                  'flex flex-col items-center gap-1 px-6 py-3 rounded-xl border-2 transition-all',
                  'border-zinc-700/50 bg-zinc-800/50 hover:bg-zinc-700/50 hover:border-zinc-600',
                )}
              >
                <span className="text-3xl font-bold text-zinc-300">{score}</span>
                <span className="text-xs text-zinc-500">{info.label}</span>
              </button>
            )
          })}
        </div>

        {/* Navigation hints */}
        <div className="flex items-center justify-center gap-6 text-zinc-600 text-xs">
          <span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono">1</kbd>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono mx-0.5">2</kbd>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono">3</kbd>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono ml-0.5">4</kbd> rate
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono">A</kbd> prev
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono ml-0.5">D</kbd> skip
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono">Esc</kbd> exit
          </span>
        </div>
      </div>
    </div>
  )
}
