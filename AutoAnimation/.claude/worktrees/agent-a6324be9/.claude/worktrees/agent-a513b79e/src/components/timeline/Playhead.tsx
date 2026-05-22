import { useRef, useState, useCallback, memo} from 'react'
import { useTimelineStore } from '@/stores'

interface PlayheadProps {
  containerHeight: number
}

export const Playhead = memo(function Playhead({ containerHeight }: PlayheadProps) {
  const playheadRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const totalFrames = useTimelineStore((s) => s.totalFrames)
  const fps = useTimelineStore((s) => s.fps)
  const zoom = useTimelineStore((s) => s.zoom)
  const seekToFrame = useTimelineStore((s) => s.seekToFrame)
  const inPoint = useTimelineStore((s) => s.inPoint)
  const outPoint = useTimelineStore((s) => s.outPoint)

  const pixelsPerFrame = (100 * zoom) / fps
  const position = currentFrame * pixelsPerFrame
  const inPos = inPoint !== null ? inPoint * pixelsPerFrame : null
  const outPos = outPoint !== null ? outPoint * pixelsPerFrame : null

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    setIsDragging(true)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !playheadRef.current) return

      const container = playheadRef.current.closest('.timeline-scroll') as HTMLElement
      if (!container) return
      const rect = container.getBoundingClientRect()
      const x = e.clientX - rect.left + container.scrollLeft
      const frame = Math.round(x / pixelsPerFrame)

      seekToFrame(Math.max(0, Math.min(frame, totalFrames - 1)))
    },
    [isDragging, pixelsPerFrame, totalFrames, seekToFrame],
  )

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false)
    ;(e.target as HTMLElement).releasePointerCapture(e.pointerId)
  }, [])

  return (
    <div
      ref={playheadRef}
      className="absolute top-0 z-20 pointer-events-auto cursor-col-resize"
      style={{
        left: position,
        height: containerHeight,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Playhead Handle — centered on left:0 via -translate-x-1/2 */}
      <div
        className="absolute top-0 left-0 -translate-x-1/2 w-3 h-4 bg-green-500 rounded-b-sm"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)',
        }}
      />

      {/* Playhead Line — centered on left:0 via -translate-x-1/2 */}
      <div
        className="absolute top-4 left-0 -translate-x-1/2 w-0.5 bg-green-500"
        style={{ height: containerHeight - 16 }}
      />

      {/* In/Out point markers and dimmed regions */}
      {inPos !== null && (
        <>
          {/* Dim area before in-point */}
          <div
            className="absolute top-0 pointer-events-none bg-black/30"
            style={{ left: -position, width: inPos, height: containerHeight }}
          />
          {/* In-point marker line */}
          <div
            className="absolute top-0 pointer-events-none w-0.5 bg-blue-400"
            style={{ left: inPos - position, height: containerHeight }}
          />
        </>
      )}
      {outPos !== null && (
        <>
          {/* Dim area after out-point */}
          <div
            className="absolute top-0 pointer-events-none bg-black/30"
            style={{ left: outPos - position, width: totalFrames * pixelsPerFrame - outPos, height: containerHeight }}
          />
          {/* Out-point marker line */}
          <div
            className="absolute top-0 pointer-events-none w-0.5 bg-blue-400"
            style={{ left: outPos - position, height: containerHeight }}
          />
        </>
      )}
    </div>
  )
})
