/**
 * Timeline track showing 3D bone pose keyframes as diamonds.
 * Mirrors BonePoseTrack.tsx but uses use3DRigStore for 3D rig data.
 */
import { useCallback } from 'react'
import { Plus } from 'lucide-react'
import { use3DRigStore } from '@/stores/use3DRigStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import type { BonePoseKeyframe3D } from '@/types/rig3d'
import { TrackShell } from './TrackShell'

interface BonePoseTrack3DProps {
  pixelsPerFrame: number
}

export function BonePoseTrack3D({ pixelsPerFrame }: BonePoseTrack3DProps) {
  const activeRigId = use3DRigStore((s) => s.activeRigId)
  const rigs = use3DRigStore((s) => s.rigs)
  const activeRig = activeRigId ? rigs[activeRigId] ?? null : null

  if (!activeRig) return null

  const poseTracks = activeRig.poseTracks

  return (
    <div>
      {/* Show track for active rig even if no keyframes yet */}
      {poseTracks.length === 0 && (
        <PoseTrackRow3D
          characterId={activeRig.characterId}
          keyframes={[]}
          trackId={null}
          pixelsPerFrame={pixelsPerFrame}
        />
      )}
      {poseTracks.map((track) => (
        <PoseTrackRow3D
          key={track.id}
          characterId={track.characterId}
          keyframes={track.keyframes}
          trackId={track.id}
          pixelsPerFrame={pixelsPerFrame}
        />
      ))}
    </div>
  )
}

interface PoseTrackRow3DProps {
  characterId: string
  keyframes: BonePoseKeyframe3D[]
  trackId: string | null
  pixelsPerFrame: number
}

function PoseTrackRow3D({ characterId, keyframes, trackId, pixelsPerFrame }: PoseTrackRow3DProps) {
  const currentFrame = useTimelineStore((s) => s.currentFrame)

  const handleAddKeyframe = useCallback(() => {
    const store = use3DRigStore.getState()
    const pose = store.currentPose
    if (!pose || Object.keys(pose).length === 0) return
    store.addPoseKeyframe(characterId, currentFrame, pose)
  }, [characterId, currentFrame])

  const handleClickKeyframe = useCallback((kf: BonePoseKeyframe3D) => {
    useTimelineStore.getState().seekToFrame(kf.frame)
    use3DRigStore.getState().setCurrentPose(kf.pose)
  }, [])

  const handleRemoveKeyframe = useCallback(
    (kfId: string) => {
      if (!trackId) return
      use3DRigStore.getState().removePoseKeyframe(trackId, kfId)
    },
    [trackId]
  )

  const label = `3D Rig: ${characterId.slice(-5)}`

  return (
    <TrackShell
      color="#4ade80"
      label={label}
      extraControls={
        <button
          onClick={handleAddKeyframe}
          className="p-0.5 text-zinc-500 hover:text-green-400 transition-colors flex-shrink-0"
          title="Add 3D pose keyframe at current frame"
        >
          <Plus size={12} />
        </button>
      }
    >
      {keyframes.map((kf) => {
        const x = kf.frame * pixelsPerFrame
        const isAtCurrent = kf.frame === currentFrame

        return (
          <div
            key={kf.id}
            className="absolute top-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ left: x }}
            onClick={() => handleClickKeyframe(kf)}
            onContextMenu={(e) => {
              e.preventDefault()
              handleRemoveKeyframe(kf.id)
            }}
            title={`Frame ${kf.frame} (right-click to remove)`}
          >
            <div
              className={`w-3 h-3 rotate-45 border-2 transition-colors ${
                isAtCurrent
                  ? 'bg-green-400 border-green-300'
                  : 'bg-green-500/50 border-green-500 group-hover:bg-green-400'
              }`}
              style={{ marginLeft: -6, marginTop: -6 }}
            />
          </div>
        )
      })}
    </TrackShell>
  )
}
