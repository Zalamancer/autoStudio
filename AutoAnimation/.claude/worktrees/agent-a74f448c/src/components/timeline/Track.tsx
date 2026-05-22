import { useState, useCallback } from 'react'
import { Lock, Unlock, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTimelineStore } from '@/stores'
import type { Track as TrackType, Clip } from '@/types'
import type { TransitionConfig } from '@/types/transitions'
import {
  getTransitionCategory,
  getTransitionLabel,
  TRANSITION_CATEGORY_COLORS,
} from '@/utils/transitionHelpers'
import { TrackShell } from './TrackShell'

interface TrackProps {
  track: TrackType
  index: number
  pixelsPerFrame: number
  isDragging: boolean
  isDropTarget: boolean
  dropPosition: 'above' | 'below' | null
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragEnd: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, index: number) => void
}

const clipColors: Record<string, string> = {
  video: 'bg-blue-500',
  audio: 'bg-purple-500',
  sprite: 'bg-green-500',
  text: 'bg-orange-500',
  effect: 'bg-pink-500',
}

const clipIndicatorColors: Record<string, string> = {
  video: '#3b82f6',
  audio: '#a855f7',
  sprite: '#22c55e',
  text: '#f97316',
  effect: '#ec4899',
}

export function Track({
  track,
  index,
  pixelsPerFrame,
  isDragging,
  isDropTarget,
  dropPosition,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: TrackProps) {
  const updateTrack = useTimelineStore((s) => s.updateTrack)
  const updateClip = useTimelineStore((s) => s.updateClip)
  const selectedClipIds = useTimelineStore((s) => s.selectedClipIds)
  const selectClip = useTimelineStore((s) => s.selectClip)
  const fps = useTimelineStore((s) => s.fps)

  // Transition drop state
  const [transitionDropClipId, setTransitionDropClipId] = useState<string | null>(null)
  const [transitionDropSide, setTransitionDropSide] = useState<'in' | 'out' | null>(null)

  const handleToggleVisibility = () => {
    updateTrack(track.id, { visible: !track.visible })
  }

  const handleToggleLock = () => {
    updateTrack(track.id, { locked: !track.locked })
  }

  const handleToggleMute = () => {
    updateTrack(track.id, { muted: !track.muted })
  }

  const handleClipClick = (clip: Clip, e: React.MouseEvent) => {
    e.stopPropagation()
    selectClip(clip.id, e.shiftKey)
  }

  // Transition drag-and-drop handlers on clips
  const handleClipDragOver = useCallback(
    (e: React.DragEvent, clip: Clip) => {
      if (!e.dataTransfer.types.includes('application/x-transition-preset')) return
      e.preventDefault()
      e.stopPropagation()
      e.dataTransfer.dropEffect = 'copy'

      const rect = e.currentTarget.getBoundingClientRect()
      const midX = rect.left + rect.width / 2
      const side = e.clientX < midX ? 'in' : 'out'

      setTransitionDropClipId(clip.id)
      setTransitionDropSide(side)
    },
    []
  )

  const handleClipDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null
    if (!e.currentTarget.contains(related)) {
      setTransitionDropClipId(null)
      setTransitionDropSide(null)
    }
  }, [])

  const handleClipDrop = useCallback(
    (e: React.DragEvent, clip: Clip) => {
      const raw = e.dataTransfer.getData('application/x-transition-preset')
      if (!raw) return
      e.preventDefault()
      e.stopPropagation()

      try {
        const data = JSON.parse(raw) as TransitionConfig
        const rect = e.currentTarget.getBoundingClientRect()
        const midX = rect.left + rect.width / 2
        const side = e.clientX < midX ? 'in' : 'out'

        if (side === 'in') {
          updateClip(track.id, clip.id, { transitionIn: data })
        } else {
          updateClip(track.id, clip.id, { transitionOut: data })
        }
      } catch {
        // ignore invalid data
      }

      setTransitionDropClipId(null)
      setTransitionDropSide(null)
    },
    [track.id, updateClip]
  )

  // Extra header controls specific to generic tracks (lock, mute)
  const extraControls = (
    <>
      {track.type === 'audio' && (
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleMute() }}
          className="p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
        >
          {track.muted ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); handleToggleLock() }}
        className="p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
      >
        {track.locked ? <Lock size={12} /> : <Unlock size={12} />}
      </button>
    </>
  )

  return (
    <div
      className={isDragging ? 'opacity-40' : ''}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
    >
      {/* Drop indicator line - above */}
      {isDropTarget && dropPosition === 'above' && (
        <div className="h-0.5 bg-blue-500 -mb-0.5 relative z-20" />
      )}

      <TrackShell
        color={clipIndicatorColors[track.type] || '#888'}
        label={track.name}
        isVisible={track.visible}
        onToggleVisibility={handleToggleVisibility}
        height={track.height}
        extraControls={extraControls}
      >
        {/* Clips */}
        {track.clips.map((clip) => {
          const left = clip.startFrame * pixelsPerFrame
          const width = (clip.endFrame - clip.startFrame) * pixelsPerFrame
          const isSelected = selectedClipIds.includes(clip.id)

          // Transition indicator widths in pixels
          const transInWidth = clip.transitionIn
            ? clip.transitionIn.duration * fps * pixelsPerFrame
            : 0
          const transOutWidth = clip.transitionOut
            ? clip.transitionOut.duration * fps * pixelsPerFrame
            : 0

          // Drop highlight state
          const isDropTargetClip = transitionDropClipId === clip.id
          const dropInHighlight = isDropTargetClip && transitionDropSide === 'in'
          const dropOutHighlight = isDropTargetClip && transitionDropSide === 'out'

          return (
            <div
              key={clip.id}
              onClick={(e) => handleClipClick(clip, e)}
              onDragOver={(e) => handleClipDragOver(e, clip)}
              onDragLeave={handleClipDragLeave}
              onDrop={(e) => handleClipDrop(e, clip)}
              className={cn(
                'absolute top-1 bottom-1 rounded cursor-pointer transition-all',
                'flex items-center px-2 overflow-hidden',
                clipColors[track.type],
                isSelected && 'ring-2 ring-white ring-offset-1 ring-offset-zinc-900',
                track.locked && 'cursor-not-allowed opacity-75'
              )}
              style={{
                left,
                width: Math.max(width, 20),
              }}
            >
              {/* Transition In indicator */}
              {clip.transitionIn && transInWidth > 0 && (
                <TransitionIndicator
                  side="in"
                  width={transInWidth}
                  clipWidth={Math.max(width, 20)}
                  transition={clip.transitionIn}
                />
              )}

              {/* Transition Out indicator */}
              {clip.transitionOut && transOutWidth > 0 && (
                <TransitionIndicator
                  side="out"
                  width={transOutWidth}
                  clipWidth={Math.max(width, 20)}
                  transition={clip.transitionOut}
                />
              )}

              {/* Drop zone highlight */}
              {dropInHighlight && (
                <div className="absolute left-0 top-0 bottom-0 w-1/2 bg-green-400/20 border-r border-green-400/50 pointer-events-none z-10 rounded-l" />
              )}
              {dropOutHighlight && (
                <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-green-400/20 border-l border-green-400/50 pointer-events-none z-10 rounded-r" />
              )}

              {/* Clip label */}
              <span className="text-xs text-white/90 truncate font-medium relative z-[5]">
                {clip.name}
              </span>
            </div>
          )
        })}

        {/* Empty Track Hint */}
        {track.clips.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-xs">
            Drop clips here
          </div>
        )}
      </TrackShell>

      {/* Drop indicator line - below */}
      {isDropTarget && dropPosition === 'below' && (
        <div className="h-0.5 bg-blue-500 -mt-0.5 relative z-20" />
      )}
    </div>
  )
}

// Transition visual indicator overlay on a clip
function TransitionIndicator({
  side,
  width,
  clipWidth,
  transition,
}: {
  side: 'in' | 'out'
  width: number
  clipWidth: number
  transition: { type: import('@/types/transitions').TransitionType; duration: number }
}) {
  const category = getTransitionCategory(transition.type)
  const colors = TRANSITION_CATEGORY_COLORS[category] ?? TRANSITION_CATEGORY_COLORS.fade
  const label = getTransitionLabel(transition.type)

  // Cap indicator width to half the clip width
  const cappedWidth = Math.min(width, clipWidth / 2)

  const gradient =
    side === 'in'
      ? `linear-gradient(to right, ${colors.gradient}, transparent)`
      : `linear-gradient(to left, ${colors.gradient}, transparent)`

  return (
    <div
      className="absolute top-0 bottom-0 flex items-center pointer-events-none z-[2]"
      style={{
        [side === 'in' ? 'left' : 'right']: 0,
        width: cappedWidth,
        background: gradient,
      }}
      title={`${label} (${transition.duration}s)`}
    >
      {cappedWidth > 30 && (
        <span
          className="text-[8px] font-medium truncate px-1 leading-none"
          style={{ color: colors.text }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
