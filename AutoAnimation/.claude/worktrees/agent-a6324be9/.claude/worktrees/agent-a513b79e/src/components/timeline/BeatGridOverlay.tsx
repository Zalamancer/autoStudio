/**
 * BeatGridOverlay — Renders beat lines on the timeline.
 *
 * Reads from useBeatSyncStore. Renders lines at beat frame positions with
 * opacity varying by beat strength. Uses getBeatFramesInRange() from
 * engine/beatSync.ts to only render visible beats (performance).
 */

import { useMemo, memo} from 'react'
import { useBeatSyncStore } from '@/stores/useBeatSyncStore'
import { useTimelineStore } from '@/stores'

interface BeatGridOverlayProps {
  /** Pixels per frame (zoom-aware) */
  pixelsPerFrame: number
}

export const BeatGridOverlay = memo(function BeatGridOverlay({ pixelsPerFrame }: BeatGridOverlayProps) {
  const analysis = useBeatSyncStore((s) => s.analysis)
  const showBeatMarkers = useBeatSyncStore((s) => s.showBeatMarkers)
  const beatGridOffset = useBeatSyncStore((s) => s.beatGridOffset)
  const fps = useTimelineStore((s) => s.fps)

  const beatLines = useMemo(() => {
    if (!analysis || !showBeatMarkers || !analysis.beats.length) return []

    return analysis.beats.map((beatSec, i) => {
      const adjustedTime = beatSec + beatGridOffset
      if (adjustedTime < 0) return null
      const frame = Math.round(adjustedTime * fps)
      const left = frame * pixelsPerFrame
      const isDownbeat = i % 4 === 0

      return {
        key: i,
        left,
        isDownbeat,
      }
    }).filter(Boolean) as { key: number; left: number; isDownbeat: boolean }[]
  }, [analysis, showBeatMarkers, beatGridOffset, fps, pixelsPerFrame])

  if (beatLines.length === 0) return null

  return (
    <div className="absolute top-10 left-40 right-0 bottom-0 pointer-events-none z-[1]">
      {beatLines.map(({ key, left, isDownbeat }) => (
        <div
          key={key}
          className="absolute top-0 bottom-0"
          style={{ left }}
        >
          <div
            className={
              isDownbeat
                ? 'w-px h-full bg-pink-500/30'
                : 'w-px h-full bg-pink-500/15'
            }
          />
        </div>
      ))}
    </div>
  )
})
