/**
 * Camera Track — Timeline track showing camera keyframe markers.
 *
 * Renders diamond-shaped keyframe indicators at each camera keyframe position.
 */

import { memo } from 'react'
import { useCameraStore } from '@/stores/useCameraStore'
import { useTimelineStore } from '@/stores'
import { useShallow } from 'zustand/react/shallow'
import { cn } from '@/lib/utils'
import { TrackShell } from './TrackShell'

export const CameraTrack = memo(function CameraTrack() {
  const { enabled, keyframes } = useCameraStore(
    useShallow((s) => ({ enabled: s.enabled, keyframes: s.keyframes }))
  )
  const { fps, zoom } = useTimelineStore(
    useShallow((s) => ({ fps: s.fps, zoom: s.zoom }))
  )
  const seekToFrame = useTimelineStore((s) => s.seekToFrame)

  if (!enabled || keyframes.length === 0) return null

  const pixelsPerFrame = (100 * zoom) / fps

  return (
    <TrackShell color="#38bdf8" label="Camera">
      {keyframes.map((kf, i) => {
        const left = kf.frame * pixelsPerFrame
        return (
          <button
            key={i}
            onClick={() => seekToFrame(kf.frame)}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rotate-45 transition-colors',
              'bg-sky-400 hover:bg-sky-300 border border-sky-300/50 hover:border-sky-200',
              'shadow-[0_0_6px_rgba(56,189,248,0.3)]'
            )}
            style={{ left: left - 5 }}
            title={`${(kf.frame / fps).toFixed(1)}s — zoom:${kf.zoom.toFixed(2)} pan:${kf.panX.toFixed(0)},${kf.panY.toFixed(0)}`}
          />
        )
      })}
    </TrackShell>
  )
})
