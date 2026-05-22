/**
 * SingingVisemePreview — Canvas overlay that shows a real-time viseme strip during singing preview.
 *
 * Displays a horizontal bar showing upcoming visemes color-coded by type,
 * synced to audio playback.
 */

import { useMemo, memo } from 'react'
import { useTimelineStore } from '@/stores/useTimelineStore'
import type { VisemeEvent, Viseme } from '@/types/voice'

const VISEME_COLORS: Partial<Record<Viseme, string>> = {
  Rest: '#3f3f46',
  Aa: '#ef4444',
  D: '#a78bfa',
  Ee: '#fbbf24',
  F: '#f472b6',
  L: '#34d399',
  M: '#60a5fa',
  O: '#fb923c',
  R: '#c084fc',
  S: '#94a3b8',
  U: '#2dd4bf',
  W: '#e879f9',
}

interface SingingVisemePreviewProps {
  visemeTimeline: VisemeEvent[]
  totalFrames: number
}

export const SingingVisemePreview = memo(function SingingVisemePreview({ visemeTimeline, totalFrames }: SingingVisemePreviewProps) {
  const currentFrame = useTimelineStore((s) => s.currentFrame)

  // Build visible window: show ~60 frames ahead of current position
  const windowSize = 60
  const windowStart = currentFrame
  const windowEnd = Math.min(currentFrame + windowSize, totalFrames)

  const visibleEvents = useMemo(() => {
    return visemeTimeline.filter(
      (e) => e.endFrame > windowStart && e.startFrame < windowEnd,
    )
  }, [visemeTimeline, windowStart, windowEnd])

  const currentViseme = visemeTimeline.find(
    (e) => currentFrame >= e.startFrame && currentFrame < e.endFrame,
  )

  return (
    <div className="absolute bottom-0 inset-x-0 h-8 bg-black/50 backdrop-blur-sm flex items-center px-2 gap-1">
      {/* Current viseme indicator */}
      <div
        className="w-6 h-6 rounded flex items-center justify-center text-[8px] font-bold text-white shrink-0"
        style={{ backgroundColor: VISEME_COLORS[currentViseme?.viseme ?? 'Rest'] }}
      >
        {currentViseme?.viseme ?? 'R'}
      </div>

      {/* Viseme strip */}
      <div className="flex-1 h-4 bg-zinc-900/50 rounded overflow-hidden flex">
        {visibleEvents.map((event, i) => {
          const start = Math.max(event.startFrame - windowStart, 0)
          const end = Math.min(event.endFrame - windowStart, windowSize)
          const widthPercent = ((end - start) / windowSize) * 100

          return (
            <div
              key={`${event.startFrame}-${i}`}
              className="h-full shrink-0"
              style={{
                width: `${widthPercent}%`,
                backgroundColor: VISEME_COLORS[event.viseme],
                opacity: 0.8,
              }}
            />
          )
        })}
      </div>
    </div>
  )
})
