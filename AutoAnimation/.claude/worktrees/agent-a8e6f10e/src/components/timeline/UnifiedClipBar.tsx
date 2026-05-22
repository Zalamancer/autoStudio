import { useCallback, useRef, memo } from 'react'
import {
  Type, Image, Film, Square, Hexagon, Box, LayoutTemplate,
  MessageSquare, Music, Video,
} from 'lucide-react'
import type { ClipSourceType, UnifiedClip } from '@/types/unifiedTimeline'
import { useUnifiedTimelineStore } from '@/stores/useUnifiedTimelineStore'
import { useBeatSyncStore } from '@/stores/useBeatSyncStore'
import { syncClipTimeRangeToNativeStore } from '@/services/unifiedTimelineSync'
import { useTimelineStore, useEditorStore } from '@/stores'
import type { RightPanelTab } from '@/types'

/** Icon per source type (12px) */
function ClipIcon({ sourceType }: { sourceType: ClipSourceType }) {
  const size = 10
  const iconMap: Record<ClipSourceType, React.ReactNode> = {
    text: <Type size={size} />,
    media: <Image size={size} />,
    lottie: <Film size={size} />,
    shape: <Square size={size} />,
    svgObject: <Hexagon size={size} />,
    character3d: <Box size={size} />,
    htmlTemplate: <LayoutTemplate size={size} />,
    dialogue: <MessageSquare size={size} />,
    dialogueLine: <Music size={size} />,
    video: <Video size={size} />,
  }
  return <span className="flex-shrink-0 opacity-70">{iconMap[sourceType]}</span>
}

/** Map ClipSourceType to the appropriate right-panel tab */
const SOURCE_TO_PANEL: Partial<Record<ClipSourceType, RightPanelTab>> = {
  text: 'text-properties',
  media: 'media-properties',
  shape: 'shape-properties',
  character3d: '3d-character-properties',
  htmlTemplate: 'html-template-properties',
  lottie: 'animation-properties',
  svgObject: 'svg-object-properties',
}

const SNAP_THRESHOLD = 3 // frames

/** Snap a frame value to nearby targets (playhead, adjacent clip edges) */
function snapFrame(
  frame: number,
  playheadFrame: number,
  allClips: UnifiedClip[],
  excludeClipId: string,
  shiftHeld: boolean,
): number {
  if (shiftHeld) return frame // Shift disables snapping

  let best = frame
  let bestDist = SNAP_THRESHOLD + 1

  // Snap to playhead
  const phDist = Math.abs(frame - playheadFrame)
  if (phDist <= SNAP_THRESHOLD && phDist < bestDist) {
    best = playheadFrame
    bestDist = phDist
  }

  // Snap to adjacent clip edges
  for (const c of allClips) {
    if (c.id === excludeClipId) continue
    const dStart = Math.abs(frame - c.startFrame)
    const dEnd = Math.abs(frame - c.endFrame)
    if (dStart <= SNAP_THRESHOLD && dStart < bestDist) {
      best = c.startFrame
      bestDist = dStart
    }
    if (dEnd <= SNAP_THRESHOLD && dEnd < bestDist) {
      best = c.endFrame
      bestDist = dEnd
    }
  }

  return best
}

interface UnifiedClipBarProps {
  clip: UnifiedClip
  pixelsPerFrame: number
  onContextMenu?: (e: React.MouseEvent, clip: UnifiedClip) => void
}

export const UnifiedClipBar = memo(function UnifiedClipBar({ clip, pixelsPerFrame, onContextMenu }: UnifiedClipBarProps) {
  const totalFrames = useTimelineStore((s) => s.totalFrames)
  const selectedClipId = useUnifiedTimelineStore((s) => s.selectedClipId)
  const selectClip = useUnifiedTimelineStore((s) => s.selectClip)
  const updateClipTimeRange = useUnifiedTimelineStore((s) => s.updateClipTimeRange)

  const beatSyncKey = `${clip.sourceType === 'dialogue' || clip.sourceType === 'dialogueLine' ? '' : clip.sourceType}:${clip.sourceId}`
  const isBeatSynced = useBeatSyncStore((s) => !!s.objectConfigs[beatSyncKey])

  const isSelected = selectedClipId === clip.id
  const dragStartRef = useRef({ x: 0, startFrame: 0, endFrame: 0 })

  const left = clip.startFrame * pixelsPerFrame
  const width = (clip.endFrame - clip.startFrame) * pixelsPerFrame

  // ── Cross-track drag (HTML5 Drag API) ──
  const handleClipDragStart = useCallback(
    (e: React.DragEvent) => {
      e.stopPropagation()
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('application/x-unified-clip-id', clip.id)
      e.dataTransfer.setData('text/plain', clip.id)
      selectClip(clip.id)
    },
    [clip.id, selectClip]
  )

  // ── Right-click context menu ──
  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      selectClip(clip.id)
      onContextMenu?.(e, clip)
    },
    [clip, selectClip, onContextMenu]
  )

  // ── Click to select + open right panel ──
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      selectClip(clip.id)

      // Open appropriate right-panel tab
      const tab = SOURCE_TO_PANEL[clip.sourceType]
      if (tab) {
        useEditorStore.getState().setRightPanelTab(tab)
      }
    },
    [clip.id, clip.sourceType, selectClip]
  )

  // Helper to get sibling clips for snapping
  const getSiblingClips = useCallback((): UnifiedClip[] => {
    const found = useUnifiedTimelineStore.getState().findClipById(clip.id)
    return found ? found.track.clips : []
  }, [clip.id])

  // ── Edge drag (resize) — Pointer Events for mouse+touch ──
  const handleEdgePointerDown = useCallback(
    (e: React.PointerEvent, edge: 'left' | 'right') => {
      e.stopPropagation()
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      dragStartRef.current = { x: e.clientX, startFrame: clip.startFrame, endFrame: clip.endFrame }

      const handlePointerMove = (pe: PointerEvent) => {
        const dx = pe.clientX - dragStartRef.current.x
        const frameDelta = Math.round(dx / pixelsPerFrame)
        const playhead = useTimelineStore.getState().currentFrame
        const siblings = getSiblingClips()

        let newStart = clip.startFrame
        let newEnd = clip.endFrame

        if (edge === 'left') {
          newStart = Math.max(
            0,
            Math.min(dragStartRef.current.startFrame + frameDelta, dragStartRef.current.endFrame - 1)
          )
          newStart = snapFrame(newStart, playhead, siblings, clip.id, pe.shiftKey)
          newEnd = dragStartRef.current.endFrame
        } else {
          newStart = dragStartRef.current.startFrame
          newEnd = Math.max(
            dragStartRef.current.startFrame + 1,
            dragStartRef.current.endFrame + frameDelta,
          )
          newEnd = snapFrame(newEnd, playhead, siblings, clip.id, pe.shiftKey)
        }

        // Auto-expand timeline when dragging past current end
        const currentTotal = useTimelineStore.getState().totalFrames
        if (newEnd > currentTotal) {
          const currentFps = useTimelineStore.getState().fps
          useTimelineStore.getState().setTotalFrames(newEnd + currentFps * 2)
        }

        updateClipTimeRange(clip.id, newStart, newEnd)
        syncClipTimeRangeToNativeStore(clip.sourceType, clip.sourceId, newStart, newEnd)
      }

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    },
    [clip, pixelsPerFrame, totalFrames, updateClipTimeRange, getSiblingClips]
  )

  // ── Center drag (move) — Pointer Events for mouse+touch ──
  const handleMovePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation()
      e.preventDefault()
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
      dragStartRef.current = { x: e.clientX, startFrame: clip.startFrame, endFrame: clip.endFrame }

      const duration = clip.endFrame - clip.startFrame

      const handlePointerMove = (pe: PointerEvent) => {
        const dx = pe.clientX - dragStartRef.current.x
        const frameDelta = Math.round(dx / pixelsPerFrame)
        const playhead = useTimelineStore.getState().currentFrame
        const siblings = getSiblingClips()

        let newStart = Math.max(0, dragStartRef.current.startFrame + frameDelta)
        newStart = snapFrame(newStart, playhead, siblings, clip.id, pe.shiftKey)
        const newEnd = newStart + duration

        // Auto-expand timeline when dragging past current end
        const currentTotal = useTimelineStore.getState().totalFrames
        if (newEnd > currentTotal) {
          const currentFps = useTimelineStore.getState().fps
          useTimelineStore.getState().setTotalFrames(newEnd + currentFps * 2)
        }

        updateClipTimeRange(clip.id, newStart, newEnd)
        syncClipTimeRangeToNativeStore(clip.sourceType, clip.sourceId, newStart, newEnd)
      }

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerup', handlePointerUp)
      }

      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    },
    [clip, pixelsPerFrame, totalFrames, updateClipTimeRange, getSiblingClips]
  )

  return (
    <div
      className="absolute top-0.5 bottom-0.5 rounded-sm overflow-hidden select-none"
      style={{
        left,
        width: Math.max(width, 8),
        backgroundColor: `${clip.color}33`,
        borderLeft: `2px solid ${clip.color}99`,
        outline: isSelected ? `1px solid ${clip.color}` : 'none',
        opacity: clip.locked ? 0.5 : 1,
      }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      draggable={!clip.locked}
      onDragStart={handleClipDragStart}
    >
      {/* Left drag handle */}
      {!clip.locked && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/20 z-10 touch-none"
          onPointerDown={(e) => handleEdgePointerDown(e, 'left')}
        />
      )}

      {/* Center drag area */}
      {!clip.locked && (
        <div
          className="absolute left-1.5 right-1.5 top-0 bottom-0 cursor-grab active:cursor-grabbing z-[5] touch-none"
          onPointerDown={handleMovePointerDown}
        />
      )}

      {/* Right drag handle */}
      {!clip.locked && (
        <div
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/20 z-10 touch-none"
          onPointerDown={(e) => handleEdgePointerDown(e, 'right')}
        />
      )}

      {/* Label with icon */}
      {width > 40 && (
        <span
          className="absolute inset-0 flex items-center gap-1 px-2 text-[9px] font-medium truncate leading-none pointer-events-none"
          style={{ color: clip.color }}
        >
          <ClipIcon sourceType={clip.sourceType} />
          {clip.name}
          {isBeatSynced && <Music size={8} className="text-pink-400 flex-shrink-0" />}
        </span>
      )}
    </div>
  )
})
