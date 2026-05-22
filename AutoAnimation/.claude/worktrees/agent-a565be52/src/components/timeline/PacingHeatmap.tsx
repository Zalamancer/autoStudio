import { useState, useCallback, useRef } from 'react'
import { usePacingStore } from '@/stores/usePacingStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import type { PacingRating } from '@/services/pacingAnalyzer'

// ---------------------------------------------------------------------------
// Color mapping for pacing ratings
// ---------------------------------------------------------------------------

function ratingToColor(rating: PacingRating): string {
  switch (rating) {
    case 'good':
      return '#22c55e'
    case 'slow':
      return '#f59e0b'
    case 'fast':
      return '#ef4444'
    case 'empty':
      return '#3f3f46' // zinc-700
  }
}

function ratingToLabel(rating: PacingRating): string {
  switch (rating) {
    case 'good':
      return 'Good pace'
    case 'slow':
      return 'Slow'
    case 'fast':
      return 'Too fast'
    case 'empty':
      return 'Empty'
  }
}

// ---------------------------------------------------------------------------
// PacingHeatmap — thin bar rendered above the timeline ruler
// ---------------------------------------------------------------------------

interface PacingHeatmapProps {
  /** Total width of the timeline content area in pixels */
  totalWidth: number
}

export function PacingHeatmap({ totalWidth }: PacingHeatmapProps) {
  const segments = usePacingStore((s) => s.segments)
  const analysis = usePacingStore((s) => s.analysis)
  const heatmapVisible = usePacingStore((s) => s.heatmapVisible)
  const fps = useTimelineStore((s) => s.fps)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<{
    x: number
    rating: PacingRating
    wps: number
    kf: number
    time: string
  } | null>(null)

  const pixelsPerFrame = totalWidth / totalFrames

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const frame = Math.round(x / pixelsPerFrame)

      const seg = segments.find((s) => frame >= s.startFrame && frame < s.endFrame)
      if (seg) {
        setTooltip({
          x: e.clientX - rect.left,
          rating: seg.rating,
          wps: seg.dialogueWps,
          kf: seg.keyframeChanges,
          time: `${(seg.startFrame / fps).toFixed(1)}s`,
        })
      }
    },
    [segments, pixelsPerFrame, fps],
  )

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  // Don't render if no analysis or heatmap is hidden
  if (!analysis || !heatmapVisible || segments.length === 0) {
    return null
  }

  return (
    <div className="relative flex" style={{ minWidth: totalWidth + 160 }}>
      {/* Label area (matches timeline track label column) */}
      <div className="w-40 flex-shrink-0 bg-zinc-800 border-r border-zinc-700/50 sticky left-0 z-10 flex items-center px-3">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium truncate">Pacing</span>
      </div>

      {/* Heatmap bar */}
      <div
        ref={containerRef}
        className="h-3 relative cursor-crosshair"
        style={{ width: totalWidth }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {segments.map((seg, i) => {
          const left = seg.startFrame * pixelsPerFrame
          const width = (seg.endFrame - seg.startFrame) * pixelsPerFrame
          return (
            <div
              key={i}
              className="absolute top-0 h-full transition-opacity"
              style={{
                left,
                width: Math.max(width, 1),
                backgroundColor: ratingToColor(seg.rating),
                opacity: 0.7 + seg.density * 0.3,
              }}
            />
          )
        })}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute -top-[52px] z-50 pointer-events-none"
            style={{
              left: tooltip.x,
              transform: 'translateX(-50%)',
            }}
          >
            <div className="bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1.5 shadow-xl text-[9px] whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-sm inline-block"
                  style={{ backgroundColor: ratingToColor(tooltip.rating) }}
                />
                <span className="text-zinc-300 font-medium">{ratingToLabel(tooltip.rating)}</span>
                <span className="text-zinc-500">at {tooltip.time}</span>
              </div>
              <div className="text-zinc-500 mt-0.5">
                {tooltip.wps.toFixed(1)} wps, {tooltip.kf} keyframes
              </div>
            </div>
            {/* Arrow */}
            <div className="flex justify-center -mt-px">
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-zinc-700" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
