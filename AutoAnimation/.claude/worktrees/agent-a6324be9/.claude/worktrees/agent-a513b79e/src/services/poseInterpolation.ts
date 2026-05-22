import type { BonePose, JointPoseState, BonePoseKeyframe } from '@/types/rig'
import type { EasingType } from '@/types/keyframes'
import { lerp, lerpAngle, applyEasing } from './interpolation'

const DEFAULT_JOINT: JointPoseState = { dx: 0, dy: 0, rotation: 0 }

/**
 * Interpolate between two complete bone poses.
 * Handles the case where one pose has joints the other doesn't.
 */
export function interpolatePoses(
  poseA: BonePose,
  poseB: BonePose,
  t: number,
  easing: EasingType = 'linear'
): BonePose {
  const easedT = applyEasing(t, easing)
  const allJointIds = new Set([...Object.keys(poseA), ...Object.keys(poseB)])
  const result: BonePose = {}

  for (const jointId of allJointIds) {
    const a = poseA[jointId] || DEFAULT_JOINT
    const b = poseB[jointId] || DEFAULT_JOINT
    result[jointId] = {
      dx: lerp(a.dx, b.dx, easedT),
      dy: lerp(a.dy, b.dy, easedT),
      rotation: lerpAngle(a.rotation, b.rotation, easedT),
    }
  }

  return result
}

/**
 * Get the interpolated pose at a given frame from a sorted list of pose keyframes.
 * Returns null if no keyframes exist.
 */
export function getPoseAtFrame(
  keyframes: BonePoseKeyframe[],
  frame: number
): BonePose | null {
  if (keyframes.length === 0) return null
  if (keyframes.length === 1) return { ...keyframes[0].pose }

  const sorted = keyframes[0].frame <= keyframes[1].frame
    ? keyframes
    : [...keyframes].sort((a, b) => a.frame - b.frame)

  // Before first keyframe: hold first pose
  if (frame <= sorted[0].frame) return { ...sorted[0].pose }

  // After last keyframe: hold last pose
  if (frame >= sorted[sorted.length - 1].frame) return { ...sorted[sorted.length - 1].pose }

  // Find surrounding keyframes
  let lo = 0
  let hi = sorted.length - 1
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1
    if (sorted[mid].frame <= frame) {
      lo = mid
    } else {
      hi = mid
    }
  }

  const prev = sorted[lo]
  const next = sorted[hi]
  const range = next.frame - prev.frame
  const t = range > 0 ? (frame - prev.frame) / range : 0

  return interpolatePoses(prev.pose, next.pose, t, prev.easing)
}
