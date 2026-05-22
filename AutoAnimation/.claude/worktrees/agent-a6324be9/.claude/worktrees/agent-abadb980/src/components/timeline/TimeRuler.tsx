import { useRef, useMemo, useCallback, memo} from 'react'
import { useTimelineStore } from '@/stores'
import { useBeatSyncStore } from '@/stores/useBeatSyncStore'

interface TimeRulerProps {
  onSeek: (frame: number) => void
}

export const TimeRuler = memo(function TimeRuler({ onSeek }: TimeRulerProps) {
  const rulerRef = useRef<HTMLDivElement>(null)
  const fps = useTimelineStore((s) => s.fps)
  const totalFrames = useTimelineStore((s) => s.totalFrames)
  const zoom = useTimelineStore((s) => s.zoom)
  const timeDisplayMode = useTimelineStore((s) => s.timeDisplayMode)

  // User markers
  const markers = useTimelineStore((s) => s.markers)

  // Beat markers
  const beatAnalysis = useBeatSyncStore((s) => s.analysis)
  const showBeatMarkers = useBeatSyncStore((s) => s.showBeatMarkers)

  const pixelsPerFrame = (100 * zoom) / fps
  const totalWidth = totalFrames * pixelsPerFrame

  // Adaptive intervals based on zoom (zoom range: 0.1 to 10)
  // Always show at least 1 minor tick between major ticks
  const getIntervals = (zoomLevel: number): { major: number; minor: number } => {
    if (zoomLevel >= 4) {
      return { major: 1, minor: 0.2 }   // 1s major, 5 minor ticks (0.2s each)
    }
    if (zoomLevel >= 2) {
      return { major: 1, minor: 0.5 }   // 1s major, 2 minor ticks
    }
    if (zoomLevel >= 1.2) {
      return { major: 2, minor: 1 }     // 2s major, 1s minor
    }
    if (zoomLevel >= 0.8) {
      return { major: 2, minor: 1 }     // 2s major, 1s minor
    }
    if (zoomLevel >= 0.5) {
      return { major: 4, minor: 1 }     // 4s major, 1s minor
    }
    if (zoomLevel >= 0.3) {
      return { major: 5, minor: 1 }     // 5s major, 1s minor
    }
    if (zoomLevel >= 0.2) {
      return { major: 10, minor: 2 }    // 10s major, 2s minor
    }
    if (zoomLevel >= 0.15) {
      return { major: 10, minor: 5 }    // 10s major, 5s minor
    }
    return { major: 20, minor: 5 }      // 20s major, 5s minor
  }

  // Format time display
  const formatTime = (seconds: number): string => {
    if (timeDisplayMode === 'frames') {
      return String(Math.round(seconds * fps))
    }
    if (seconds === 0) return '0'
    if (seconds >= 60) {
      const mins = Math.floor(seconds / 60)
      const secs = seconds % 60
      return secs === 0 ? `${mins}m` : `${mins}m${secs}s`
    }
    return `${seconds}s`
  }

  // Calculate tick marks
  const ticks = useMemo(() => {
    const result: { frame: number; major: boolean; label: string }[] = []
    const intervals = getIntervals(zoom)
    const totalSeconds = totalFrames / fps

    // Generate major ticks
    for (let sec = 0; sec <= totalSeconds; sec += intervals.major) {
      const frame = sec * fps
      result.push({
        frame,
        major: true,
        label: formatTime(sec),
      })
    }

    // Generate minor ticks (always show at least 1 between majors)
    if (intervals.minor < intervals.major) {
      for (let sec = intervals.minor; sec <= totalSeconds; sec += intervals.minor) {
        // Skip if this is a major tick position
        if (Math.abs(sec % intervals.major) < 0.001) continue

        const frame = sec * fps
        result.push({
          frame,
          major: false,
          label: '',
        })
      }
    }

    // Sort by frame
    result.sort((a, b) => a.frame - b.frame)

    return result
  }, [fps, totalFrames, zoom, timeDisplayMode])

  const seekFromMouseEvent = useCallback(
    (clientX: number) => {
      if (!rulerRef.current) return
      const rect = rulerRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      if (x < 0) return
      const frame = Math.round(x / pixelsPerFrame)
      onSeek(Math.max(0, Math.min(frame, totalFrames - 1)))
    },
    [pixelsPerFrame, totalFrames, onSeek]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Seek immediately on click
      seekFromMouseEvent(e.clientX)

      // Then follow the mouse while dragging
      const handleMouseMove = (me: MouseEvent) => {
        seekFromMouseEvent(me.clientX)
      }
      const handleMouseUp = () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [seekFromMouseEvent]
  )

  return (
    <div
      ref={rulerRef}
      className="h-10 bg-zinc-900 cursor-pointer relative select-none"
      onMouseDown={handleMouseDown}
      style={{ width: totalWidth }}
    >
      {/* Time labels at top */}
      <div className="absolute top-1 left-0 right-0">
        {ticks
          .filter((t) => t.major)
          .map(({ frame, label }) => (
            <span
              key={`label-${frame}`}
              className="absolute text-xs text-zinc-400 font-normal whitespace-nowrap"
              style={{
                left: frame * pixelsPerFrame,
                transform: frame === 0 ? 'none' : 'translateX(-50%)'
              }}
            >
              {label}
            </span>
          ))}
      </div>

      {/* Tick marks at bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        {ticks.map(({ frame, major }) => (
          <div
            key={`tick-${frame}`}
            className="absolute bottom-0"
            style={{ left: frame * pixelsPerFrame }}
          >
            <div
              className={`w-px ${
                major
                  ? 'h-3 bg-zinc-500'
                  : 'h-2 bg-zinc-700'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Beat marker ticks on the ruler */}
      {showBeatMarkers && beatAnalysis && beatAnalysis.beats.map((beatSec, i) => {
        const left = Math.round(beatSec * fps) * pixelsPerFrame
        const isStrong = i % 4 === 0
        return (
          <div
            key={`beat-tick-${i}`}
            className="absolute bottom-0"
            style={{ left }}
          >
            <div
              className="w-px"
              style={{
                height: isStrong ? 6 : 4,
                backgroundColor: isStrong ? 'rgba(236, 72, 153, 0.6)' : 'rgba(236, 72, 153, 0.3)',
              }}
            />
          </div>
        )
      })}

      {/* User markers rendered as colored flag indicators */}
      {markers.map((marker) => (
        <div
          key={marker.id}
          className="absolute top-0 pointer-events-auto cursor-pointer group"
          style={{ left: marker.frame * pixelsPerFrame }}
          title={marker.name}
        >
          {/* Flag triangle */}
          <div
            className="w-0 h-0 -translate-x-1/2"
            style={{
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: `8px solid ${marker.color}`,
            }}
          />
          {/* Marker line (small, within ruler) */}
          <div
            className="w-px absolute top-2 -translate-x-1/2"
            style={{
              height: 18,
              backgroundColor: marker.color,
              opacity: 0.6,
            }}
          />
          {/* Tooltip label on hover */}
          <div
            className="absolute top-[-18px] left-1/2 -translate-x-1/2 whitespace-nowrap px-1 py-0.5 rounded text-[8px] font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{
              backgroundColor: marker.color,
              color: '#fff',
            }}
          >
            {marker.name}
          </div>
        </div>
      ))}
    </div>
  )
})
