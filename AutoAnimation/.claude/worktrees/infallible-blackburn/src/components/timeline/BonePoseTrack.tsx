import { useRef, useMemo } from 'react'
import { useRigStore } from '@/stores/useRigStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import type { BonePoseTrack as BonePoseTrackType } from '@/types/rig'
import type { SerializedRigData } from '@bonerigging/core'
import { TrackShell } from './TrackShell'

interface BonePoseTrackProps {
  pixelsPerFrame: number
}

const MIN_BLOCK_PX = 24 // minimum block width so it's always grabbable

export function BonePoseTrack({ pixelsPerFrame }: BonePoseTrackProps) {
  const poseTracks = useRigStore((s) => s.poseTracks)
  const activeRigId = useRigStore((s) => s.activeRigId)

  if (poseTracks.length === 0 && !activeRigId) return null

  return (
    <div>
      {poseTracks.map((track) => (
        <PoseTrackRow
          key={track.id}
          track={track}
          pixelsPerFrame={pixelsPerFrame}
        />
      ))}
    </div>
  )
}

interface PoseTrackRowProps {
  track: BonePoseTrackType
  pixelsPerFrame: number
}

function PoseTrackRow({ track, pixelsPerFrame }: PoseTrackRowProps) {
  const rigs = useRigStore((s) => s.rigs)
  const characterPoseTrackIds = useRigStore((s) => s.characterPoseTrackIds)
  const dialogueChars = useMultiCharacterStore((s) => s.characters)

  // Derive animation name from the rig's serialized data
  const animName = useMemo(() => {
    const char = dialogueChars.find((c) => c.id === track.characterId)
    const rigId = char?.rigId ?? null
    const rig = rigId ? rigs[rigId] : null
    if (!rig?.boneriggingSerializedData) return null
    try {
      const parsed = JSON.parse(rig.boneriggingSerializedData) as SerializedRigData
      // Find this track's index among the character's tracks to match animation index
      const rigStore = useRigStore.getState()
      const seen = new Set<string>()
      const charTracks = rigStore.poseTracks.filter((t) => {
        if (t.characterId !== track.characterId && t.characterId !== 'primary') return false
        if (seen.has(t.id)) return false
        seen.add(t.id)
        return true
      })
      const trackIdx = charTracks.findIndex((t) => t.id === track.id)
      const anim = parsed.animations[trackIdx >= 0 ? trackIdx : 0]
      return anim?.name || null
    } catch { return null }
  }, [track.id, track.characterId, rigs, dialogueChars])

  // Character display name
  const charName = useMemo(() => {
    const char = dialogueChars.find((c) => c.id === track.characterId)
    return char?.name || (track.characterId === 'primary' ? 'Character' : track.characterId.slice(-5))
  }, [track.characterId, dialogueChars])

  const label = animName || `Anim (${charName})`

  // Block span derived from keyframe positions
  const frames = track.keyframes.map((kf) => kf.frame)
  const startFrame = frames.length ? Math.min(...frames) : 0
  const endFrame = frames.length ? Math.max(...frames) : 0
  const blockLeft = startFrame * pixelsPerFrame
  const naturalWidth = (endFrame - startFrame) * pixelsPerFrame
  const blockWidth = Math.max(MIN_BLOCK_PX, naturalWidth)

  // Whether this track is the active one for this character
  const isActive = characterPoseTrackIds[track.characterId] === track.id

  // Drag state stored in a ref (not state) to avoid re-renders mid-drag
  const dragRef = useRef<{
    type: 'move' | 'left' | 'right'
    startX: number
    origStart: number
    origEnd: number
    origFrames: number[]
  } | null>(null)

  const startDrag = (e: React.MouseEvent, type: 'move' | 'left' | 'right') => {
    e.preventDefault()
    e.stopPropagation()

    dragRef.current = {
      type,
      startX: e.clientX,
      origStart: startFrame,
      origEnd: endFrame,
      origFrames: track.keyframes.map((kf) => kf.frame),
    }

    const onMove = (ev: MouseEvent) => {
      const d = dragRef.current
      if (!d) return
      const deltaX = ev.clientX - d.startX
      const rawDelta = deltaX / pixelsPerFrame
      const deltaFrames = Math.round(rawDelta)
      const span = d.origEnd - d.origStart

      useRigStore.setState((state) => {
        const t = state.poseTracks.find((pt) => pt.id === track.id)
        if (!t) return

        if (d.type === 'move') {
          const clampedDelta = Math.max(-d.origStart, deltaFrames)
          t.keyframes.forEach((kf, i) => {
            kf.frame = d.origFrames[i] + clampedDelta
          })
        } else if (d.type === 'right') {
          // Scale keyframes relative to the left edge
          if (span <= 0) {
            // Single-frame block: just shift the frame
            t.keyframes.forEach((kf) => {
              kf.frame = Math.max(0, d.origStart + deltaFrames)
            })
            return
          }
          const newEnd = Math.max(d.origStart + 1, d.origEnd + deltaFrames)
          const scale = (newEnd - d.origStart) / span
          t.keyframes.forEach((kf, i) => {
            kf.frame = Math.max(0, d.origStart + Math.round((d.origFrames[i] - d.origStart) * scale))
          })
        } else {
          // 'left': scale keyframes relative to the right edge
          if (span <= 0) {
            t.keyframes.forEach((kf) => {
              kf.frame = Math.max(0, d.origEnd + deltaFrames)
            })
            return
          }
          const newStart = Math.max(0, Math.min(d.origEnd - 1, d.origStart + deltaFrames))
          const scale = (d.origEnd - newStart) / span
          t.keyframes.forEach((kf, i) => {
            kf.frame = Math.max(0, d.origEnd - Math.round((d.origEnd - d.origFrames[i]) * scale))
          })
        }
      })
    }

    const onUp = () => {
      dragRef.current = null
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <TrackShell color={isActive ? '#d946ef' : '#71717a'} label={label}>
      {track.keyframes.length > 0 && (
        <div
          className="absolute inset-y-1 group"
          style={{ left: blockLeft, width: blockWidth }}
        >
          {/* Main block body — drag to move */}
          <div
            className={`absolute inset-0 rounded flex items-center overflow-hidden select-none transition-colors cursor-grab active:cursor-grabbing ${
              isActive
                ? 'bg-fuchsia-500/35 border border-fuchsia-500/70'
                : 'bg-fuchsia-900/30 border border-fuchsia-700/40 hover:border-fuchsia-600/60'
            }`}
            onMouseDown={(e) => startDrag(e, 'move')}
          >
            <span className="pointer-events-none px-2 text-xs font-medium text-white/90 truncate leading-none">
              {label}
            </span>
          </div>

          {/* Left resize handle */}
          <div
            className="absolute left-0 inset-y-0 w-2 cursor-ew-resize z-10 flex items-center justify-start"
            onMouseDown={(e) => startDrag(e, 'left')}
          >
            <div className="w-[3px] h-4 rounded-full bg-fuchsia-400/60 group-hover:bg-fuchsia-400 transition-colors" />
          </div>

          {/* Right resize handle */}
          <div
            className="absolute right-0 inset-y-0 w-2 cursor-ew-resize z-10 flex items-center justify-end"
            onMouseDown={(e) => startDrag(e, 'right')}
          >
            <div className="w-[3px] h-4 rounded-full bg-fuchsia-400/60 group-hover:bg-fuchsia-400 transition-colors" />
          </div>
        </div>
      )}
    </TrackShell>
  )
}
