import { useCallback, useState, useRef } from 'react'
import { Eye, EyeOff, Lock, Unlock, Volume2, VolumeX, GripVertical, ChevronRight } from 'lucide-react'
import type { UnifiedTrack, UnifiedClip } from '@/types/unifiedTimeline'
import { useUnifiedTimelineStore } from '@/stores/useUnifiedTimelineStore'
import { syncZOrderToStores } from '@/services/unifiedTimelineSync'
import { UnifiedClipBar } from './UnifiedClipBar'
import { DialogueSubTracks } from './DialogueSubTracks'
import { ClipContextMenu } from './ClipContextMenu'

const ROW_HEIGHT = 48

interface UnifiedTrackRowProps {
  track: UnifiedTrack
  index: number
  pixelsPerFrame: number
  isDragging: boolean
  isDropTarget: boolean
  dropPosition: 'above' | 'below' | null
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent, index: number) => void
}

export function UnifiedTrackRow({
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
}: UnifiedTrackRowProps) {
  const selectedTrackId = useUnifiedTimelineStore((s) => s.selectedTrackId)
  const selectTrack = useUnifiedTimelineStore((s) => s.selectTrack)
  const toggleVisible = useUnifiedTimelineStore((s) => s.toggleTrackVisible)
  const toggleLocked = useUnifiedTimelineStore((s) => s.toggleTrackLocked)
  const toggleMuted = useUnifiedTimelineStore((s) => s.toggleTrackMuted)
  const toggleExpanded = useUnifiedTimelineStore((s) => s.toggleTrackExpanded)
  const moveClip = useUnifiedTimelineStore((s) => s.moveClip)
  const setTrackHeight = useUnifiedTimelineStore((s) => s.setTrackHeight)

  const isSelected = selectedTrackId === track.id

  // Clip drop state (cross-track drag)
  const [isClipDropTarget, setIsClipDropTarget] = useState(false)

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clip: UnifiedClip } | null>(null)

  const handleTrackClick = useCallback(() => {
    selectTrack(track.id)
    setContextMenu(null)
  }, [selectTrack, track.id])

  // ── Cross-track clip drop handlers ──
  const handleClipDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-unified-clip-id')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      setIsClipDropTarget(true)
    }
  }, [])

  const handleClipDragLeave = useCallback((e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as Node | null
    if (!e.currentTarget.contains(relatedTarget)) {
      setIsClipDropTarget(false)
    }
  }, [])

  const handleClipDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsClipDropTarget(false)
      const clipId = e.dataTransfer.getData('application/x-unified-clip-id')
      if (clipId) {
        // Calculate new start frame from drop position, accounting for horizontal scroll
        const scrollContainer = (e.currentTarget as HTMLElement).closest('.timeline-scroll') as HTMLElement | null
        const scrollLeft = scrollContainer?.scrollLeft ?? 0
        const rect = e.currentTarget.getBoundingClientRect()
        const offsetX = e.clientX - rect.left + scrollLeft
        const newStartFrame = Math.max(0, Math.round(offsetX / pixelsPerFrame))
        moveClip(clipId, track.id, newStartFrame)
        // Sync z-order after cross-track move
        if (track.kind === 'video') {
          syncZOrderToStores()
        }
      }
    },
    [moveClip, track.id, track.kind, pixelsPerFrame],
  )

  const handleClipContextMenu = useCallback((e: React.MouseEvent, clip: UnifiedClip) => {
    setContextMenu({ x: e.clientX, y: e.clientY, clip })
  }, [])

  // ── Track height resize ──
  const resizeStartRef = useRef({ y: 0, height: 0 })

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      resizeStartRef.current = { y: e.clientY, height: track.height }

      const handlePointerMove = (pe: PointerEvent) => {
        const dy = pe.clientY - resizeStartRef.current.y
        setTrackHeight(track.id, resizeStartRef.current.height + dy)
      }

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    },
    [track.id, track.height, setTrackHeight],
  )

  // Count dialogue clips that could have sub-tracks
  const dialogueClips = track.expanded ? track.clips.filter((c) => c.sourceType === 'dialogue') : []

  return (
    <>
      <div
        className={`flex border-b border-zinc-700/50 relative ${isDragging ? 'opacity-40' : ''}`}
        style={{ height: track.height || ROW_HEIGHT }}
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        onDragEnd={onDragEnd}
        onDragOver={(e) => onDragOver(e, index)}
        onDragLeave={onDragLeave}
        onDrop={(e) => onDrop(e, index)}
      >
        {/* Drop indicator line */}
        {isDropTarget && dropPosition === 'above' && (
          <div className="absolute left-0 right-0 top-0 h-0.5 bg-blue-500 z-20" />
        )}
        {isDropTarget && dropPosition === 'below' && (
          <div className="absolute left-0 right-0 bottom-0 h-0.5 bg-blue-500 z-20" />
        )}

        {/* Track Header */}
        <div
          className={`w-40 flex-shrink-0 flex items-center gap-0.5 px-1 bg-zinc-800 border-r border-zinc-700/50 sticky left-0 z-10 cursor-pointer ${
            isSelected ? 'bg-zinc-700/50' : ''
          }`}
          onClick={handleTrackClick}
        >
          {/* Drag handle */}
          {track.kind === 'video' && (
            <GripVertical size={10} className="flex-shrink-0 text-zinc-600 cursor-grab active:cursor-grabbing" />
          )}

          {/* Expand chevron (for tracks with dialogue clips) */}
          {track.clips.some((c) => c.sourceType === 'dialogue') ? (
            <button
              className="flex-shrink-0 p-0"
              onClick={(e) => {
                e.stopPropagation()
                toggleExpanded(track.id)
              }}
            >
              <ChevronRight
                size={10}
                className="text-zinc-500 transition-transform duration-150"
                style={{ transform: track.expanded ? 'rotate(90deg)' : undefined }}
              />
            </button>
          ) : (
            <div className="w-2.5 flex-shrink-0" />
          )}

          {/* Track label */}
          <span
            className={`text-[10px] font-semibold select-none flex-shrink-0 ${
              track.kind === 'video' ? 'text-blue-400' : 'text-green-400'
            }`}
          >
            {track.name}
          </span>

          {/* Track controls */}
          <div className="flex items-center gap-0.5 ml-auto">
            {/* Visibility */}
            <button
              className="p-0.5 hover:bg-zinc-700/50 rounded"
              onClick={(e) => {
                e.stopPropagation()
                toggleVisible(track.id)
              }}
              title={track.visible ? 'Hide' : 'Show'}
            >
              {track.visible ? (
                <Eye size={10} className="text-zinc-500" />
              ) : (
                <EyeOff size={10} className="text-zinc-600" />
              )}
            </button>

            {/* Lock */}
            <button
              className="p-0.5 hover:bg-zinc-700/50 rounded"
              onClick={(e) => {
                e.stopPropagation()
                toggleLocked(track.id)
              }}
              title={track.locked ? 'Unlock' : 'Lock'}
            >
              {track.locked ? (
                <Lock size={10} className="text-amber-500" />
              ) : (
                <Unlock size={10} className="text-zinc-600" />
              )}
            </button>

            {/* Mute (audio tracks) */}
            {track.kind === 'audio' && (
              <button
                className="p-0.5 hover:bg-zinc-700/50 rounded"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMuted(track.id)
                }}
                title={track.muted ? 'Unmute' : 'Mute'}
              >
                {track.muted ? (
                  <VolumeX size={10} className="text-red-500" />
                ) : (
                  <Volume2 size={10} className="text-zinc-500" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Clip Area */}
        <div
          className={`flex-1 relative bg-zinc-900/30 ${isClipDropTarget ? 'ring-1 ring-inset ring-blue-500/50' : ''}`}
          style={{ opacity: track.visible ? 1 : 0.3 }}
          onDragOver={handleClipDragOver}
          onDragLeave={handleClipDragLeave}
          onDrop={handleClipDrop}
        >
          {track.clips.map((clip) => (
            <UnifiedClipBar
              key={clip.id}
              clip={clip}
              pixelsPerFrame={pixelsPerFrame}
              onContextMenu={handleClipContextMenu}
            />
          ))}
        </div>

        {/* Bottom-edge resize handle */}
        <div
          className="absolute left-0 right-0 bottom-0 h-1 cursor-row-resize hover:bg-blue-500/30 z-20 touch-none"
          onPointerDown={handleResizePointerDown}
        />
      </div>

      {/* Context menu */}
      {contextMenu && (
        <ClipContextMenu
          clip={contextMenu.clip}
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Expanded dialogue sub-tracks */}
      {dialogueClips.map((clip) => (
        <DialogueSubTracks key={`sub-${clip.id}`} characterId={clip.sourceId} pixelsPerFrame={pixelsPerFrame} />
      ))}
    </>
  )
}
