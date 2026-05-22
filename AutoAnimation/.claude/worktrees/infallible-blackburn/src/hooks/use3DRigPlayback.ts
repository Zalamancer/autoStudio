/**
 * Playback integration hook for 3D rig bone pose animation.
 * Reads current frame from timeline, interpolates bone poses, and updates the rig store.
 * Mirrors useDialoguePlayback.ts pattern.
 */
import { useEffect, useRef } from 'react'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { use3DRigStore } from '@/stores/use3DRigStore'

/**
 * Call this hook in any component that needs 3D rig pose playback.
 * It reads the current frame from the timeline and updates the rig store's
 * currentPose with the interpolated pose from keyframes.
 *
 * @param characterId - The Character3D.id to play back poses for
 */
export function use3DRigPlayback(characterId: string | null) {
  const isPlaying = usePlaybackStore((s) => s.isPlaying)
  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const lastFrameRef = useRef(-1)

  useEffect(() => {
    if (!isPlaying || !characterId) return
    if (currentFrame === lastFrameRef.current) return
    lastFrameRef.current = currentFrame

    const store = use3DRigStore.getState()
    const interpolated = store.getInterpolatedPoseAtFrame(characterId, currentFrame)
    if (interpolated) {
      store.setCurrentPose(interpolated)
    }
  }, [isPlaying, currentFrame, characterId])
}
