import { useEffect, useCallback, useState, memo} from 'react'
import { Trash2, Copy, Scissors, Lock, Unlock, Music } from 'lucide-react'
import type { UnifiedClip } from '@/types/unifiedTimeline'
import { useUnifiedTimelineStore } from '@/stores/useUnifiedTimelineStore'
import { useTimelineStore } from '@/stores'
import { useBeatSyncStore } from '@/stores/useBeatSyncStore'
import { clipSourceToKeyframableType } from '@/services/beatSync'
import { BeatSyncPopover } from './BeatSyncPopover'

interface ClipContextMenuProps {
  clip: UnifiedClip
  x: number
  y: number
  onClose: () => void
}

export const ClipContextMenu = memo(function ClipContextMenu({ clip, x, y, onClose }: ClipContextMenuProps) {
  const removeClip = useUnifiedTimelineStore((s) => s.removeClip)
  const addClip = useUnifiedTimelineStore((s) => s.addClip)
  const updateClipTimeRange = useUnifiedTimelineStore((s) => s.updateClipTimeRange)
  const findClipById = useUnifiedTimelineStore((s) => s.findClipById)
  const hasAnalysis = useBeatSyncStore((s) => s.analysis !== null)
  const [showBeatPopover, setShowBeatPopover] = useState(false)

  const isKeyframable = clipSourceToKeyframableType(clip.sourceType) !== null

  useEffect(() => {
    if (showBeatPopover) return // Don't close menu while popover is open
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const handleClick = () => onClose()
    window.addEventListener('keydown', handleKey)
    window.addEventListener('click', handleClick)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener('click', handleClick)
    }
  }, [onClose, showBeatPopover])

  const handleDelete = useCallback(() => {
    removeClip(clip.id)
    onClose()
  }, [clip.id, removeClip, onClose])

  const handleDuplicate = useCallback(() => {
    const found = findClipById(clip.id)
    if (!found) return

    const duration = clip.endFrame - clip.startFrame
    const newClip: UnifiedClip = {
      id: `uclip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sourceType: clip.sourceType,
      sourceId: clip.sourceId,
      startFrame: clip.endFrame,
      endFrame: clip.endFrame + duration,
      name: `${clip.name} (copy)`,
      color: clip.color,
      locked: false,
    }
    addClip(found.track.id, newClip)
    onClose()
  }, [clip, findClipById, addClip, onClose])

  const handleSplit = useCallback(() => {
    const playhead = useTimelineStore.getState().currentFrame
    if (playhead <= clip.startFrame || playhead >= clip.endFrame) {
      onClose()
      return
    }

    const found = findClipById(clip.id)
    if (!found) return

    // Shrink original to end at playhead
    updateClipTimeRange(clip.id, clip.startFrame, playhead)

    // Create second half
    const newClip: UnifiedClip = {
      id: `uclip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sourceType: clip.sourceType,
      sourceId: clip.sourceId,
      startFrame: playhead,
      endFrame: clip.endFrame,
      name: `${clip.name} (split)`,
      color: clip.color,
      locked: clip.locked,
    }
    addClip(found.track.id, newClip)
    onClose()
  }, [clip, findClipById, updateClipTimeRange, addClip, onClose])

  const handleToggleLock = useCallback(() => {
    useUnifiedTimelineStore.setState((state) => {
      for (const track of [...state.videoTracks, ...state.audioTracks]) {
        const c = track.clips.find((tc) => tc.id === clip.id)
        if (c) {
          c.locked = !c.locked
          break
        }
      }
    })
    onClose()
  }, [clip.id, onClose])

  const playhead = useTimelineStore.getState().currentFrame
  const canSplit = playhead > clip.startFrame && playhead < clip.endFrame

  const handleBeatSync = useCallback(() => {
    setShowBeatPopover(true)
  }, [])

  const menuItems = [
    { label: 'Delete', icon: Trash2, action: handleDelete, danger: true },
    { label: 'Duplicate', icon: Copy, action: handleDuplicate },
    { label: 'Split at Playhead', icon: Scissors, action: handleSplit, disabled: !canSplit },
    {
      label: clip.locked ? 'Unlock' : 'Lock',
      icon: clip.locked ? Unlock : Lock,
      action: handleToggleLock,
    },
    ...(isKeyframable
      ? [{
          label: 'Sync to Beats...',
          icon: Music,
          action: handleBeatSync,
          disabled: !hasAnalysis,
        }]
      : []),
  ]

  if (showBeatPopover) {
    return (
      <BeatSyncPopover
        clips={[clip]}
        x={x}
        y={y}
        onClose={onClose}
      />
    )
  }

  return (
    <div
      className="fixed z-[100] bg-zinc-800 border border-zinc-600 rounded-lg shadow-xl py-1 min-w-[160px]"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      {menuItems.map((item) => (
        <button
          key={item.label}
          className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] text-left transition-colors
            ${item.disabled ? 'text-zinc-600 cursor-not-allowed' : item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-zinc-300 hover:bg-zinc-700/50'}
          `}
          onClick={item.disabled ? undefined : item.action}
          disabled={item.disabled}
        >
          <item.icon size={12} />
          {item.label}
        </button>
      ))}
    </div>
  )
})
