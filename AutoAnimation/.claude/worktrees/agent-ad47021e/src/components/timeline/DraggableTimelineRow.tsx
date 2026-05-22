import { useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useTimelineStore } from '@/stores'
import { TrackShell } from './TrackShell'

export interface TimelineRowColors {
  bg: string
  text: string
  border: string
}

interface DraggableTimelineRowProps {
  label: string
  colors: TimelineRowColors
  startFrame: number
  endFrame: number
  isSelected: boolean
  isVisible: boolean
  pixelsPerFrame: number
  totalFrames: number
  onClick: () => void
  onTimeRangeChange: (startFrame: number, endFrame: number) => void
  /** Toggle visibility callback — shows eye icon in header */
  onToggleVisibility?: () => void
  /** Optional custom header content — replaces the default strip + label in the track header */
  headerContent?: ReactNode
  /** Optional content rendered inside the bar (e.g. sub-clips) */
  children?: ReactNode
}

export function DraggableTimelineRow({
  label,
  colors,
  startFrame,
  endFrame,
  isSelected,
  isVisible,
  pixelsPerFrame,
  totalFrames: _totalFrames,
  onClick,
  onTimeRangeChange,
  onToggleVisibility,
  headerContent,
  children,
}: DraggableTimelineRowProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ x: 0, startFrame: 0, endFrame: 0 })
  const didDragRef = useRef(false)
  const cleanupRef = useRef<(() => void) | null>(null)

  // Clean up window event listeners on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.()
    }
  }, [])

  const left = startFrame * pixelsPerFrame
  const width = (endFrame - startFrame) * pixelsPerFrame

  const handleClick = useCallback(() => {
    if (didDragRef.current) {
      didDragRef.current = false
      return
    }
    onClick()
  }, [onClick])

  const handleEdgeMouseDown = useCallback(
    (e: React.MouseEvent, edge: 'left' | 'right') => {
      e.stopPropagation()
      e.preventDefault()
      didDragRef.current = false
      dragRef.current = { x: e.clientX, startFrame, endFrame }
      const bar = barRef.current
      // Snapshot for closure
      const ppf = pixelsPerFrame
      const snap = { startFrame, endFrame }
      let finalStart = startFrame
      let finalEnd = endFrame

      const onMove = (me: MouseEvent) => {
        didDragRef.current = true
        const dx = me.clientX - dragRef.current.x
        const frameDelta = Math.round(dx / ppf)

        if (edge === 'left') {
          finalStart = Math.max(0, Math.min(snap.startFrame + frameDelta, snap.endFrame - 1))
          finalEnd = snap.endFrame
        } else {
          finalStart = snap.startFrame
          finalEnd = Math.max(snap.startFrame + 1, snap.endFrame + frameDelta)
        }

        // Auto-expand timeline when dragging past current end
        const currentTotal = useTimelineStore.getState().totalFrames
        if (finalEnd > currentTotal) {
          const fps = useTimelineStore.getState().fps
          useTimelineStore.getState().setTotalFrames(finalEnd + fps * 2)
        }

        // Direct DOM update — no React re-render
        if (bar) {
          bar.style.left = `${finalStart * ppf}px`
          bar.style.width = `${Math.max((finalEnd - finalStart) * ppf, 20)}px`
        }
      }

      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        cleanupRef.current = null
        if (didDragRef.current) {
          onTimeRangeChange(finalStart, finalEnd)
        }
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      cleanupRef.current = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
    },
    [startFrame, endFrame, pixelsPerFrame, onTimeRangeChange]
  )

  const handleMoveMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()
      didDragRef.current = false
      dragRef.current = { x: e.clientX, startFrame, endFrame }
      const bar = barRef.current
      const ppf = pixelsPerFrame
      const duration = endFrame - startFrame
      const snap = { startFrame }
      let finalStart = startFrame

      const onMove = (me: MouseEvent) => {
        didDragRef.current = true
        const dx = me.clientX - dragRef.current.x
        const frameDelta = Math.round(dx / ppf)
        finalStart = Math.max(0, snap.startFrame + frameDelta)
        const newEnd = finalStart + duration

        // Auto-expand timeline when dragging past current end
        const currentTotal = useTimelineStore.getState().totalFrames
        if (newEnd > currentTotal) {
          const fps = useTimelineStore.getState().fps
          useTimelineStore.getState().setTotalFrames(newEnd + fps * 2)
        }

        if (bar) {
          bar.style.left = `${finalStart * ppf}px`
        }
      }

      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
        cleanupRef.current = null
        if (didDragRef.current) {
          onTimeRangeChange(finalStart, finalStart + duration)
        }
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
      cleanupRef.current = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }
    },
    [startFrame, endFrame, pixelsPerFrame, onTimeRangeChange]
  )

  return (
    <TrackShell
      color={colors.text}
      label={label}
      isVisible={isVisible}
      onToggleVisibility={onToggleVisibility}
      onClick={handleClick}
      headerContent={headerContent}
    >
      <div
        ref={barRef}
        className={`absolute top-1 bottom-1 rounded cursor-pointer flex items-center px-2 overflow-hidden select-none ${
          isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900' : ''
        }`}
        style={{
          left,
          width: Math.max(width, 20),
          backgroundColor: isVisible ? colors.bg : 'rgba(63, 63, 70, 0.3)',
        }}
      >
        {/* Left drag handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/20 z-10"
          onMouseDown={(e) => handleEdgeMouseDown(e, 'left')}
        />
        {/* Center drag area */}
        <div
          className="absolute left-1.5 right-1.5 top-0 bottom-0 cursor-grab active:cursor-grabbing z-[5]"
          onMouseDown={handleMoveMouseDown}
        />
        {/* Right drag handle */}
        <div
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/20 z-10"
          onMouseDown={(e) => handleEdgeMouseDown(e, 'right')}
        />
        {/* Clip label */}
        <span className="text-xs text-white/90 truncate font-medium relative z-[5] pointer-events-none">
          {label}
        </span>
        {/* Optional sub-clip content */}
        {children}
      </div>
    </TrackShell>
  )
}
