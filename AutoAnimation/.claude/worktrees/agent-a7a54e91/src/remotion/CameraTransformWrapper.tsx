/**
 * CameraTransformWrapper — Applies virtual camera transforms (zoom/pan/rotation/shake)
 * to all child layers during Remotion export and live preview.
 *
 * Uses the full camera pipeline from useCameraStore which includes:
 * - Keyframe-based zoom/pan/rotation interpolation
 * - Camera shake effects (additive displacement + rotation)
 * - Focus pull effects (zoom + pan toward a focal point)
 *
 * Reads from useCameraStore or from exported keyframe data.
 */

import { useFrame, useComposition } from '@/engine'
import {
  useCameraStore,
  getCameraAtFrame as getCameraAtFrameFromKeyframes,
  getCameraShakeAtFrame,
  type CameraKeyframe,
  type CameraShakeConfig,
  type FocusPullConfig,
} from '@/stores/useCameraStore'

interface CameraTransformWrapperProps {
  children: React.ReactNode
  canvasWidth: number
  canvasHeight: number
  /** Optional: pass pre-exported camera keyframes instead of reading from store */
  cameraKeyframes?: CameraKeyframe[]
}

/**
 * Compute the full camera transform at a given frame, matching the logic in
 * useCameraStore.getCameraAtFrame — keyframes + shake + focus pull.
 */
function computeFullCameraTransform(
  frame: number,
  fps: number,
  keyframes: CameraKeyframe[],
  shakes: CameraShakeConfig[],
  focusPull: FocusPullConfig | null,
): { zoom: number; panX: number; panY: number; rotation: number } {
  // Base camera from keyframes
  const base = keyframes.length > 0
    ? getCameraAtFrameFromKeyframes(keyframes, frame)
    : { zoom: 1, panX: 0, panY: 0, rotation: 0 }

  // Apply shakes (additive)
  let totalShakeX = 0
  let totalShakeY = 0
  let totalShakeRot = 0
  for (const shake of shakes) {
    const { shakeX, shakeY, shakeRotation } = getCameraShakeAtFrame(frame, fps, shake)
    totalShakeX += shakeX
    totalShakeY += shakeY
    totalShakeRot += shakeRotation
  }

  // Apply focus pull
  let focusZoom = 0
  let focusPanX = 0
  let focusPanY = 0
  if (focusPull) {
    const elapsed = frame - focusPull.startFrame
    if (elapsed >= 0) {
      const transIn = focusPull.transitionFrames
      const hold = focusPull.holdFrames
      const total = focusPull.pullBack ? transIn + hold + transIn : transIn + hold

      let progress = 0
      if (elapsed < transIn) {
        progress = elapsed / transIn
        progress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress
      } else if (elapsed < transIn + hold) {
        progress = 1
      } else if (focusPull.pullBack && elapsed < total) {
        progress = 1 - (elapsed - transIn - hold) / transIn
        progress = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress
      } else if (focusPull.pullBack) {
        progress = 0
      } else {
        progress = 1
      }

      focusZoom = (focusPull.targetZoom - 1) * progress
      focusPanX = (focusPull.focusX - 0.5) * -100 * progress * focusPull.targetZoom
      focusPanY = (focusPull.focusY - 0.5) * -100 * progress * focusPull.targetZoom
    }
  }

  return {
    zoom: base.zoom + focusZoom,
    panX: base.panX + totalShakeX + focusPanX,
    panY: base.panY + totalShakeY + focusPanY,
    rotation: base.rotation + totalShakeRot,
  }
}

export function CameraTransformWrapper({
  children,
  canvasWidth,
  canvasHeight,
  cameraKeyframes,
}: CameraTransformWrapperProps) {
  const frame = useFrame()
  const { fps } = useComposition()

  // Read full camera state from store
  const storeEnabled = useCameraStore((s) => s.enabled)
  const storeKeyframes = useCameraStore((s) => s.keyframes)
  const storeShakes = useCameraStore((s) => s.shakes)
  const storeFocusPull = useCameraStore((s) => s.focusPull)

  const keyframes = cameraKeyframes ?? storeKeyframes
  const enabled = cameraKeyframes ? cameraKeyframes.length > 0 : storeEnabled

  // Camera is active if enabled, or if there are shakes/focus-pull even without keyframes
  const hasEffects = keyframes.length > 0 || storeShakes.length > 0 || storeFocusPull !== null

  if (!enabled || !hasEffects) {
    return <>{children}</>
  }

  const { zoom, panX, panY, rotation } = computeFullCameraTransform(
    frame,
    fps,
    keyframes,
    storeShakes,
    storeFocusPull,
  )

  // Convert panX/panY from percentage (-50 to 50) to pixels
  const translateX = (panX / 100) * canvasWidth
  const translateY = (panY / 100) * canvasHeight

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        transformOrigin: 'center center',
        transform: `scale(${zoom}) translate(${-translateX}px, ${-translateY}px) rotate(${rotation}deg)`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  )
}
