/**
 * useMotionTracking — Face-to-Character Mapping Hook
 *
 * Runs a requestAnimationFrame loop that reads FaceTrackingData from the store
 * (via getState(), not subscriptions) and maps it to character transforms:
 *
 * 2D Characters:
 *   - Head rotation → head part position/rotation offset
 *   - Eye blinks → eye variant sprite swap
 *   - Eyebrow raise → eyebrow variant sprite swap
 *   - Jaw open / smile → viseme selection + mouth curvature (when no audio playing)
 *   - Body gets subtle sway from dampened head motion
 *
 * 3D Characters:
 *   - Head rotation → head bone quaternion
 *   - Blendshapes → morph target weights (if model supports them)
 *
 * Audio priority: when dialogue is playing (activeVoiceId + isPlaying),
 * mouth is driven by audio lip sync. Webcam drives head/eyes/eyebrows only.
 */

import { useEffect, useRef } from 'react'
import { useMotionTrackingStore } from '@/stores/useMotionTrackingStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useTimelineStore } from '@/stores'
import type { FaceTrackingData } from '@/types/motionTracking'
import type { EyeVariant, EyebrowVariant } from '@/types/emotionHeads'

/**
 * Ephemeral map of 3D character head rotation driven by motion tracking.
 * Character3DRenderer reads this in its useFrame loop. Using a plain Map
 * instead of Zustand state avoids triggering React re-renders at 30fps.
 */
export const motionTracking3DData = new Map<
  string,
  { headPitch: number; headYaw: number; headRoll: number }
>()

// Pixel offset scale for head movement on canvas
const HEAD_OFFSET_SCALE = 80
// Dampening factor for body sway (fraction of head movement)
const BODY_SWAY_FACTOR = 0.15
// Thresholds for discrete sprite swaps
const BLINK_THRESHOLD = 0.5
const BROW_RAISE_THRESHOLD = 0.3

/** Map face data to 2D eye variant */
function getEyeVariantFromFace(data: FaceTrackingData): EyeVariant {
  const avgBlink = (data.eyeBlinkLeft + data.eyeBlinkRight) / 2
  if (avgBlink > BLINK_THRESHOLD) return 'sad' // use 'sad' eyes for blink (squinted/closed)
  return 'neutral'
}

/** Map face data to 2D eyebrow variant */
function getEyebrowVariantFromFace(data: FaceTrackingData): EyebrowVariant {
  const avgBrow = (data.browOuterUpLeft + data.browOuterUpRight) / 2
  if (data.browInnerUp > BROW_RAISE_THRESHOLD || avgBrow > BROW_RAISE_THRESHOLD) return 'shocked'
  return 'neutral'
}

/** Check if audio-driven lip sync is currently active */
function isAudioLipSyncActive(): boolean {
  const voiceState = useVoiceStore.getState()
  const timelineState = useTimelineStore.getState()
  return timelineState.isPlaying && voiceState.activeVoiceId != null
}

export function useMotionTracking(): void {
  const rafRef = useRef<number>(0)
  const prevEyeVariant = useRef<EyeVariant>('neutral')
  const prevBrowVariant = useRef<EyebrowVariant>('neutral')

  // Store initial head position for restoring on cleanup
  const initialHeadTransform = useRef<{ x: number; y: number; rotation: number } | null>(null)

  useEffect(() => {
    // Check if tracking is active (subscribe only to isActive)
    let prevActive = useMotionTrackingStore.getState().isActive
    const unsub = useMotionTrackingStore.subscribe((state) => {
      if (state.isActive !== prevActive) {
        prevActive = state.isActive
        if (state.isActive) {
          startLoop()
        } else {
          stopLoop()
        }
      }
    })

    // Start immediately if already active
    if (useMotionTrackingStore.getState().isActive) {
      startLoop()
    }

    return () => {
      unsub()
      stopLoop()
    }
  }, [])

  function startLoop() {
    if (rafRef.current) return

    // Save initial eye transform as reference for head-group restoration
    const eyeT = useCharacterPartsStore.getState().transforms.eye
    initialHeadTransform.current = { x: eyeT.x, y: eyeT.y, rotation: eyeT.rotation }

    const tick = () => {
      const state = useMotionTrackingStore.getState()
      if (!state.isActive || !state.faceData) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const { faceData, settings } = state
      const audioActive = isAudioLipSyncActive()

      // ── 2D Character Mapping ──────────────────────────────────────
      apply2DCharacterTransforms(faceData, settings.enableHead, settings.enableEyes, settings.enableEyebrows, settings.enableMouth && !audioActive, settings.headRotationScale, settings.expressionScale, settings.mirrorMode)

      // ── 3D Character Mapping ──────────────────────────────────────
      apply3DCharacterTransforms(faceData, settings.enableHead, settings.headRotationScale, settings.mirrorMode)

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }

  function stopLoop() {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }

    // Restore face part transforms to initial values
    if (initialHeadTransform.current) {
      const store = useCharacterPartsStore.getState()
      const restore = initialHeadTransform.current
      store.updateTransform('eye', restore)
      store.updateTransform('eyebrow', restore)
      store.updateTransform('viseme', { x: restore.x, y: restore.y })
      store.updateTransform('hair', restore)
      store.updateTransform('body', { x: 0, y: 0 })
      initialHeadTransform.current = null
    }

    prevEyeVariant.current = 'neutral'
    prevBrowVariant.current = 'neutral'

    // Clear 3D tracking data
    motionTracking3DData.clear()
  }

  function apply2DCharacterTransforms(
    data: FaceTrackingData,
    enableHead: boolean,
    enableEyes: boolean,
    enableEyebrows: boolean,
    enableMouth: boolean,
    headScale: number,
    exprScale: number,
    mirror: boolean,
  ) {
    const partsStore = useCharacterPartsStore.getState()
    const configStore = useCharacterConfigStore.getState()
    const yawSign = mirror ? -1 : 1

    // Head rotation → position offset + rotation for all face parts
    if (enableHead) {
      const yawOffset = data.headRotation.yaw * HEAD_OFFSET_SCALE * headScale * yawSign
      const pitchOffset = data.headRotation.pitch * HEAD_OFFSET_SCALE * headScale
      const rollDeg = data.headRotation.roll * (180 / Math.PI) * headScale * yawSign

      const headTransform = { x: yawOffset, y: pitchOffset, rotation: rollDeg }
      partsStore.updateTransform('eye', headTransform)
      partsStore.updateTransform('eyebrow', headTransform)
      partsStore.updateTransform('viseme', { x: yawOffset, y: pitchOffset })

      // Subtle body sway from dampened head motion
      partsStore.updateTransform('body', {
        x: yawOffset * BODY_SWAY_FACTOR,
        y: pitchOffset * BODY_SWAY_FACTOR * 0.5,
      })

      // Hair follows head with slight extra sway
      partsStore.updateTransform('hair', {
        x: yawOffset * 1.1,
        y: pitchOffset * 1.1,
        rotation: rollDeg * 1.05,
      })
    }

    // Eye variant swap (discrete)
    if (enableEyes) {
      const eyeVariant = getEyeVariantFromFace(data)
      if (eyeVariant !== prevEyeVariant.current) {
        prevEyeVariant.current = eyeVariant
        // Find the sprite index for this eye variant
        const eyeSprite = configStore.eyeVariantSprites[eyeVariant]
        if (eyeSprite) {
          // Find the index of this sprite in savedImages.eye
          const idx = configStore.savedImages.eye.indexOf(eyeSprite)
          if (idx >= 0) {
            partsStore.setSelectedSprite('eye', idx)
          }
        }
      }
    }

    // Eyebrow variant swap (discrete)
    if (enableEyebrows) {
      const browVariant = getEyebrowVariantFromFace(data)
      if (browVariant !== prevBrowVariant.current) {
        prevBrowVariant.current = browVariant
        const browSprite = configStore.eyebrowVariantSprites[browVariant]
        if (browSprite) {
          const idx = configStore.savedImages.eyebrow.indexOf(browSprite)
          if (idx >= 0) {
            partsStore.setSelectedSprite('eyebrow', idx)
          }
        }
      }
    }

    // Mouth control from webcam (only when no audio lip sync)
    if (enableMouth) {
      // Map jawOpen → viseme sprite selection
      const jawOpen = data.jawOpen * exprScale
      if (jawOpen > 0.3) {
        // Open mouth: find Aa viseme sprite
        const aaIndex = configStore.visemeMapping['Aa']
        if (aaIndex !== null) {
          partsStore.setSelectedSprite('viseme', aaIndex)
        }
      } else if (jawOpen > 0.15) {
        // Slightly open: O viseme
        const oIndex = configStore.visemeMapping['Oh']
        if (oIndex !== null) {
          partsStore.setSelectedSprite('viseme', oIndex)
        }
      } else {
        // Closed: Rest viseme
        const restIndex = configStore.visemeMapping['Rest']
        if (restIndex !== null) {
          partsStore.setSelectedSprite('viseme', restIndex)
        }
      }
    }
  }

  function apply3DCharacterTransforms(
    data: FaceTrackingData,
    enableHead: boolean,
    headScale: number,
    mirror: boolean,
  ) {
    if (!enableHead) {
      motionTracking3DData.clear()
      return
    }

    const yawSign = mirror ? -1 : 1

    // Write head rotation to the ephemeral map.
    // Character3DRenderer reads this in its useFrame() loop.
    // Using a well-known key 'all' to apply to all 3D characters.
    motionTracking3DData.set('__global__', {
      headPitch: data.headRotation.pitch * headScale,
      headYaw: data.headRotation.yaw * headScale * yawSign,
      headRoll: data.headRotation.roll * headScale * yawSign,
    })
  }
}
