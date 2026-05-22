import { useCallback, useState, useRef, useMemo, memo } from 'react'
import { ChevronRight, ChevronDown, Trash2, GripVertical, Copy } from 'lucide-react'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import type { CanvasObjectRef, ObjectPropertyTrack } from '@/types/keyframes'
import type { EasingType } from '@/types/keyframes'
import { easingToCss } from '@/engine/easing'
import { toast } from '@/stores/useToastStore'
import { TrackShell } from './TrackShell'

interface KeyframeTrackProps {
  pixelsPerFrame: number
}

const OBJECT_TYPE_LABELS: Record<string, string> = {
  text: 'Text',
  media: 'Image',
  lottie: 'Animation',
  video: 'Video',
  character: 'Character',
  dialogueCharacter: 'Dialogue Char',
}

const OBJECT_TYPE_COLORS: Record<string, string> = {
  text: '#f59e0b',
  media: '#3b82f6',
  lottie: '#8b5cf6',
  video: '#ec4899',
  character: '#22c55e',
  dialogueCharacter: '#14b8a6',
}

const EASING_OPTIONS: { label: string; value: EasingType }[] = [
  { label: 'Linear', value: 'linear' },
  { label: 'Ease In', value: 'ease-in' },
  { label: 'Ease Out', value: 'ease-out' },
  { label: 'Ease In-Out', value: 'ease-in-out' },
]

export const KeyframeTrack = memo(function KeyframeTrack({ pixelsPerFrame }: KeyframeTrackProps) {
  // Use s.tracks directly (stable Zustand reference) instead of calling
  // getAllObjectsWithKeyframes() which returns a new array every time and
  // causes an infinite re-render loop.
  const tracks = useKeyframeStore((s) => s.tracks)

  // Derive unique objects and group tracks in a memo (stable between renders
  // as long as the tracks reference doesn't change)
  const objectGroups = useMemo(() => {
    const seen = new Map<string, { ref: CanvasObjectRef; tracks: ObjectPropertyTrack[] }>()
    for (const track of tracks) {
      if (track.keyframes.length > 0) {
        const key = `${track.objectRef.objectType}:${track.objectRef.objectId}`
        if (!seen.has(key)) {
          seen.set(key, { ref: track.objectRef, tracks: [] })
        }
        seen.get(key)!.tracks.push(track)
      }
    }
    return Array.from(seen.values())
  }, [tracks])

  if (objectGroups.length === 0) return null

  return (
    <div>
      {objectGroups.map((group) => (
        <ObjectKeyframeRow
          key={`${group.ref.objectType}:${group.ref.objectId}`}
          objectRef={group.ref}
          propertyTracks={group.tracks}
          pixelsPerFrame={pixelsPerFrame}
        />
      ))}
    </div>
  )
})

interface ObjectKeyframeRowProps {
  objectRef: CanvasObjectRef
  propertyTracks: ObjectPropertyTrack[]
  pixelsPerFrame: number
}

const ObjectKeyframeRow = memo(function ObjectKeyframeRow({
  objectRef,
  propertyTracks,
  pixelsPerFrame,
}: ObjectKeyframeRowProps) {
  const [expanded, setExpanded] = useState(false)
  const selectedKeyframeIds = useKeyframeStore((s) => s.selectedKeyframeIds)
  const selectKeyframe = useKeyframeStore((s) => s.selectKeyframe)
  const removeKeyframe = useKeyframeStore((s) => s.removeKeyframe)
  const updateKeyframeEasing = useKeyframeStore((s) => s.updateKeyframeEasing)
  const removeAllKeyframes = useKeyframeStore((s) => s.removeAllKeyframes)
  const seekToFrame = useTimelineStore((s) => s.seekToFrame)
  const currentFrame = useTimelineStore((s) => s.currentFrame)

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    keyframeId: string
  } | null>(null)

  const contextMenuRef = useRef<HTMLDivElement>(null)

  // Collect all unique frames across all property tracks for the combined row
  const allFrames = new Map<number, string[]>() // frame -> keyframe IDs
  for (const track of propertyTracks) {
    for (const kf of track.keyframes) {
      const existing = allFrames.get(kf.frame) || []
      existing.push(kf.id)
      allFrames.set(kf.frame, existing)
    }
  }

  const typeLabel = OBJECT_TYPE_LABELS[objectRef.objectType] || objectRef.objectType
  const typeColor = OBJECT_TYPE_COLORS[objectRef.objectType] || '#888'
  const shortId = objectRef.objectId.length > 8 ? objectRef.objectId.slice(0, 8) : objectRef.objectId

  const handleDiamondClick = useCallback(
    (frame: number, keyframeIds: string[], e: React.MouseEvent) => {
      e.stopPropagation()
      // Select all keyframes at this frame for this object
      for (const kfId of keyframeIds) {
        selectKeyframe(kfId, e.shiftKey || keyframeIds.indexOf(kfId) > 0)
      }
      seekToFrame(frame)
    },
    [selectKeyframe, seekToFrame],
  )

  const handleContextMenu = useCallback((_frame: number, keyframeIds: string[], e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Use the first keyframe ID for context menu operations
    setContextMenu({ x: e.clientX, y: e.clientY, keyframeId: keyframeIds[0] })
  }, [])

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  const handleDeleteKeyframe = useCallback(() => {
    if (contextMenu) {
      // Find all keyframes at this frame and delete them
      const kf = findKeyframeById(contextMenu.keyframeId, propertyTracks)
      if (kf) {
        const kfIds = allFrames.get(kf.frame) || [contextMenu.keyframeId]
        for (const id of kfIds) {
          removeKeyframe(id)
        }
      }
      setContextMenu(null)
    }
  }, [contextMenu, propertyTracks, allFrames, removeKeyframe])

  const handleDeleteAll = useCallback(() => {
    removeAllKeyframes(objectRef)
    setContextMenu(null)
  }, [objectRef, removeAllKeyframes])

  const handleSetEasing = useCallback(
    (easing: EasingType) => {
      if (contextMenu) {
        const kf = findKeyframeById(contextMenu.keyframeId, propertyTracks)
        if (kf) {
          const kfIds = allFrames.get(kf.frame) || [contextMenu.keyframeId]
          for (const id of kfIds) {
            updateKeyframeEasing(id, easing)
          }
        }
        setContextMenu(null)
      }
    },
    [contextMenu, propertyTracks, allFrames, updateKeyframeEasing],
  )

  const handleCopyCss = useCallback(() => {
    if (contextMenu) {
      const kf = findKeyframeById(contextMenu.keyframeId, propertyTracks)
      if (kf) {
        const css = easingToCss(kf.easing, kf.bezierParams)
        navigator.clipboard
          .writeText(css)
          .then(() => {
            toast.success(`Copied: ${css}`, 2000)
          })
          .catch(() => {
            toast.error('Failed to copy to clipboard')
          })
      }
      setContextMenu(null)
    }
  }, [contextMenu, propertyTracks])

  return (
    <>
      {/* Combined row for this object */}
      <TrackShell
        color={typeColor}
        label={typeLabel}
        headerContent={
          <div
            className="flex items-center gap-1 w-full cursor-pointer select-none"
            onClick={() => setExpanded(!expanded)}
          >
            <GripVertical size={12} className="text-zinc-600 flex-shrink-0" />
            <div className="w-1.5 h-full rounded-sm flex-shrink-0" style={{ backgroundColor: typeColor }} />
            {expanded ? (
              <ChevronDown size={12} className="text-zinc-500 flex-shrink-0" />
            ) : (
              <ChevronRight size={12} className="text-zinc-500 flex-shrink-0" />
            )}
            <span className="flex-1 text-xs text-zinc-300 truncate">{typeLabel}</span>
            <span className="text-[9px] text-zinc-500 truncate">{shortId}</span>
          </div>
        }
      >
        {Array.from(allFrames.entries()).map(([frame, kfIds]) => {
          const x = frame * pixelsPerFrame
          const isAtCurrent = frame === currentFrame
          const isSelected = kfIds.some((id) => selectedKeyframeIds.includes(id))

          return (
            <div
              key={frame}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer"
              style={{ left: x }}
              onClick={(e) => handleDiamondClick(frame, kfIds, e)}
              onContextMenu={(e) => handleContextMenu(frame, kfIds, e)}
            >
              <div
                className={`w-[8px] h-[8px] rotate-45 border transition-colors ${
                  isSelected
                    ? 'bg-white border-white'
                    : isAtCurrent
                      ? 'bg-amber-400 border-amber-300'
                      : 'bg-amber-500/80 border-amber-400/60 hover:bg-amber-400'
                }`}
              />
            </div>
          )
        })}
      </TrackShell>

      {/* Expanded per-property rows */}
      {expanded &&
        propertyTracks.map((track) => (
          <PropertyKeyframeRow
            key={track.id}
            track={track}
            pixelsPerFrame={pixelsPerFrame}
            selectedKeyframeIds={selectedKeyframeIds}
            currentFrame={currentFrame}
            onSelect={selectKeyframe}
            onSeek={seekToFrame}
          />
        ))}

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-50" onClick={handleCloseContextMenu} />
          <div
            ref={contextMenuRef}
            className="fixed z-50 bg-zinc-800 border border-zinc-600 rounded shadow-xl py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"
              onClick={handleDeleteKeyframe}
            >
              <Trash2 size={12} />
              Delete Keyframe
            </button>
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-zinc-700 flex items-center gap-2"
              onClick={handleDeleteAll}
            >
              <Trash2 size={12} />
              Delete All Keyframes
            </button>
            <div className="border-t border-zinc-700 my-1" />
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 flex items-center gap-2"
              onClick={handleCopyCss}
            >
              <Copy size={12} />
              Copy CSS Easing
            </button>
            <div className="border-t border-zinc-700 my-1" />
            <div className="px-3 py-1 text-[10px] text-zinc-500 uppercase">Easing</div>
            {EASING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700"
                onClick={() => handleSetEasing(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  )
})

interface PropertyKeyframeRowProps {
  track: ObjectPropertyTrack
  pixelsPerFrame: number
  selectedKeyframeIds: string[]
  currentFrame: number
  onSelect: (id: string, multi?: boolean) => void
  onSeek: (frame: number) => void
}

function PropertyKeyframeRow({
  track,
  pixelsPerFrame,
  selectedKeyframeIds,
  currentFrame,
  onSelect,
  onSeek,
}: PropertyKeyframeRowProps) {
  return (
    <div className="flex border-b border-zinc-700/20" style={{ height: 40 }}>
      {/* Header */}
      <div className="w-40 flex-shrink-0 flex items-center px-6 bg-zinc-800 border-r border-zinc-700/50 sticky left-0 z-10">
        <span className="text-[9px] text-zinc-500 truncate">{track.property}</span>
      </div>

      {/* Diamonds */}
      <div className="flex-1 relative bg-zinc-800/20">
        {track.keyframes.map((kf) => {
          const x = kf.frame * pixelsPerFrame
          const isAtCurrent = kf.frame === currentFrame
          const isSelected = selectedKeyframeIds.includes(kf.id)

          return (
            <div
              key={kf.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 cursor-pointer"
              style={{ left: x }}
              onClick={(e) => {
                e.stopPropagation()
                onSelect(kf.id, e.shiftKey)
                onSeek(kf.frame)
              }}
            >
              <div
                className={`w-[6px] h-[6px] rotate-45 border transition-colors ${
                  isSelected
                    ? 'bg-white border-white'
                    : isAtCurrent
                      ? 'bg-amber-400 border-amber-300'
                      : 'bg-amber-600/60 border-amber-500/40 hover:bg-amber-400'
                }`}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function findKeyframeById(id: string, tracks: ObjectPropertyTrack[]) {
  for (const track of tracks) {
    const kf = track.keyframes.find((k) => k.id === id)
    if (kf) return kf
  }
  return null
}
