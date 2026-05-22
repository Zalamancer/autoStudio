/**
 * Motion Recorder Service
 *
 * Handles recording of face tracking data into takes and exporting
 * recorded takes as keyframes on the timeline.
 *
 * Uses Douglas-Peucker simplification to thin 30fps data down to
 * only the significant keyframes (reducing data by ~70-90%).
 */

import type { MotionRecordingTake } from '@/types/motionTracking'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useKeyframeStore } from '@/stores'

// ── Douglas-Peucker Simplification ──────────────────────────────────────

/**
 * Douglas-Peucker algorithm for 1D signal simplification.
 * Given an array of { frame, value } points, returns indices of significant points.
 */
function douglasPeucker1D(
  points: Array<{ frame: number; value: number }>,
  epsilon: number,
): number[] {
  if (points.length <= 2) {
    return points.map((_, i) => i)
  }

  // Find the point with maximum distance from the line between first and last
  const first = points[0]
  const last = points[points.length - 1]

  let maxDist = 0
  let maxIdx = 0

  const dx = last.frame - first.frame
  const dy = last.value - first.value
  const len = Math.sqrt(dx * dx + dy * dy)

  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i]
    let dist: number

    if (len === 0) {
      dist = Math.abs(p.value - first.value)
    } else {
      // Perpendicular distance from point to line
      dist = Math.abs(dy * (first.frame - p.frame) - dx * (first.value - p.value)) / len
    }

    if (dist > maxDist) {
      maxDist = dist
      maxIdx = i
    }
  }

  if (maxDist > epsilon) {
    const left = douglasPeucker1D(points.slice(0, maxIdx + 1), epsilon)
    const right = douglasPeucker1D(points.slice(maxIdx), epsilon)

    // Merge (avoid duplicate of the splitting point)
    return [
      ...left.map((i) => i),
      ...right.slice(1).map((i) => i + maxIdx),
    ]
  } else {
    return [0, points.length - 1]
  }
}

// ── Take to Keyframe Export ─────────────────────────────────────────────

/** Epsilon values for Douglas-Peucker simplification per property type */
const EPSILON_HEAD_POSITION = 2 // pixels
const EPSILON_HEAD_ROTATION = 0.5 // degrees

/** Head offset scale (must match useMotionTracking.ts) */
const HEAD_OFFSET_SCALE = 80

/**
 * Export a recorded take to keyframes on the timeline.
 * Applies Douglas-Peucker simplification to reduce keyframe count.
 */
export function exportTakeToKeyframes(
  take: MotionRecordingTake,
  options: {
    headRotationScale?: number
    mirrorMode?: boolean
  } = {},
): { keyframeCount: number } {
  const { headRotationScale = 1, mirrorMode = true } = options

  if (take.frames.length === 0) return { keyframeCount: 0 }

  const yawSign = mirrorMode ? -1 : 1
  const kfStore = useKeyframeStore.getState()

  // Extract 1D signals from the take
  const headXSignal = take.frames.map((f) => ({
    frame: f.frame,
    value: f.data.headRotation.yaw * HEAD_OFFSET_SCALE * headRotationScale * yawSign,
  }))

  const headYSignal = take.frames.map((f) => ({
    frame: f.frame,
    value: f.data.headRotation.pitch * HEAD_OFFSET_SCALE * headRotationScale,
  }))

  const headRotSignal = take.frames.map((f) => ({
    frame: f.frame,
    value: f.data.headRotation.roll * (180 / Math.PI) * headRotationScale * yawSign,
  }))

  // Simplify each signal
  const headXIndices = douglasPeucker1D(headXSignal, EPSILON_HEAD_POSITION)
  const headYIndices = douglasPeucker1D(headYSignal, EPSILON_HEAD_POSITION)
  const headRotIndices = douglasPeucker1D(headRotSignal, EPSILON_HEAD_ROTATION)

  let keyframeCount = 0

  // Get initial eye transform as reference for head offset base
  const initialHead = useCharacterPartsStore.getState().transforms.eye

  const objectRef = { objectType: 'character' as const, objectId: 'eye' }

  // Add head X keyframes
  for (const idx of headXIndices) {
    const point = headXSignal[idx]
    kfStore.setKeyframe(objectRef, 'x', point.frame, initialHead.x + point.value)
    keyframeCount++
  }

  // Add head Y keyframes
  for (const idx of headYIndices) {
    const point = headYSignal[idx]
    kfStore.setKeyframe(objectRef, 'y', point.frame, initialHead.y + point.value)
    keyframeCount++
  }

  // Add head rotation keyframes
  for (const idx of headRotIndices) {
    const point = headRotSignal[idx]
    kfStore.setKeyframe(objectRef, 'rotation', point.frame, initialHead.rotation + point.value)
    keyframeCount++
  }

  return { keyframeCount }
}

/**
 * Get stats about a take for display in the UI.
 */
export function getTakeStats(take: MotionRecordingTake): {
  frameCount: number
  durationSeconds: number
  avgJawOpen: number
  maxHeadYaw: number
} {
  if (take.frames.length === 0) {
    return { frameCount: 0, durationSeconds: 0, avgJawOpen: 0, maxHeadYaw: 0 }
  }

  const firstFrame = take.frames[0].frame
  const lastFrame = take.frames[take.frames.length - 1].frame
  const fps = 30

  let totalJawOpen = 0
  let maxYaw = 0

  for (const f of take.frames) {
    totalJawOpen += f.data.jawOpen
    maxYaw = Math.max(maxYaw, Math.abs(f.data.headRotation.yaw))
  }

  return {
    frameCount: take.frames.length,
    durationSeconds: (lastFrame - firstFrame) / fps,
    avgJawOpen: totalJawOpen / take.frames.length,
    maxHeadYaw: maxYaw * (180 / Math.PI),
  }
}
