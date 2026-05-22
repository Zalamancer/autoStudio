/**
 * 3D pose interpolation using quaternion slerp and vector lerp.
 * Mirrors poseInterpolation.ts but for 3D bone poses with quaternions.
 */
import * as THREE from 'three'
import type { BonePose3D, JointPoseState3D, BonePoseKeyframe3D } from '@/types/rig3d'
import type { EasingType } from '@/types/keyframes'
import { applyEasing } from './interpolation'

// ─── Reusable Three.js objects (avoid per-frame allocations) ────────────────

const _quatA = new THREE.Quaternion()
const _quatB = new THREE.Quaternion()
const _quatResult = new THREE.Quaternion()
const _vecA = new THREE.Vector3()
const _vecB = new THREE.Vector3()

// ─── Identity values ────────────────────────────────────────────────────────

const IDENTITY_JOINT: JointPoseState3D = {
  position: { x: 0, y: 0, z: 0 },
  quaternion: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
}

// ─── Interpolation ──────────────────────────────────────────────────────────

/**
 * Interpolate between two complete 3D bone poses.
 * Uses slerp for quaternions and lerp for position/scale.
 */
export function interpolatePoses3D(
  poseA: BonePose3D,
  poseB: BonePose3D,
  t: number,
  easing: EasingType = 'linear'
): BonePose3D {
  const easedT = applyEasing(t, easing)
  const allBoneNames = new Set([...Object.keys(poseA), ...Object.keys(poseB)])
  const result: BonePose3D = {}

  for (const boneName of allBoneNames) {
    const a = poseA[boneName] || IDENTITY_JOINT
    const b = poseB[boneName] || IDENTITY_JOINT

    // Slerp quaternion
    _quatA.set(a.quaternion.x, a.quaternion.y, a.quaternion.z, a.quaternion.w)
    _quatB.set(b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w)
    _quatResult.slerpQuaternions(_quatA, _quatB, easedT)

    // Lerp position
    _vecA.set(a.position.x, a.position.y, a.position.z)
    _vecB.set(b.position.x, b.position.y, b.position.z)
    _vecA.lerp(_vecB, easedT)

    // Lerp scale
    const scaleX = a.scale.x + (b.scale.x - a.scale.x) * easedT
    const scaleY = a.scale.y + (b.scale.y - a.scale.y) * easedT
    const scaleZ = a.scale.z + (b.scale.z - a.scale.z) * easedT

    result[boneName] = {
      position: { x: _vecA.x, y: _vecA.y, z: _vecA.z },
      quaternion: { x: _quatResult.x, y: _quatResult.y, z: _quatResult.z, w: _quatResult.w },
      scale: { x: scaleX, y: scaleY, z: scaleZ },
    }
  }

  return result
}

/**
 * Get the interpolated 3D pose at a given frame from a sorted list of keyframes.
 * Returns null if no keyframes exist.
 * Uses binary search for efficient lookup.
 */
export function getPose3DAtFrame(
  keyframes: BonePoseKeyframe3D[],
  frame: number
): BonePose3D | null {
  if (keyframes.length === 0) return null
  if (keyframes.length === 1) return keyframes[0].pose

  // Assume sorted (store keeps them sorted)
  const sorted = keyframes

  // Before first keyframe: hold first pose
  if (frame <= sorted[0].frame) return sorted[0].pose

  // After last keyframe: hold last pose
  if (frame >= sorted[sorted.length - 1].frame) return sorted[sorted.length - 1].pose

  // Binary search for surrounding keyframes
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

  return interpolatePoses3D(prev.pose, next.pose, t, prev.easing)
}
