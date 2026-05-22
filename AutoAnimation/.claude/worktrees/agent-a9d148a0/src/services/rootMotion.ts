/**
 * Root motion extraction and application.
 * Separates root bone XZ translation into a world-space path,
 * leaving the clip with in-place animation.
 */
import * as THREE from 'three'

export interface RootMotionTrack {
  /** Extracted world-space positions per frame */
  positions: { frame: number; x: number; z: number }[]
  /** Original clip duration in frames (at the given fps) */
  totalFrames: number
  fps: number
}

/**
 * Extract root motion from an AnimationClip.
 * Removes XZ translation from the root bone track and returns it as a separate path.
 * The clip is modified in-place to produce in-place animation.
 */
export function extractRootMotion(
  clip: THREE.AnimationClip,
  rootBoneName: string,
  fps: number
): RootMotionTrack {
  const positions: { frame: number; x: number; z: number }[] = []
  const totalFrames = Math.ceil(clip.duration * fps)

  // Find the root bone's position track
  const posTrack = clip.tracks.find(
    (t) => t.name === `${rootBoneName}.position` && t instanceof THREE.VectorKeyframeTrack
  ) as THREE.VectorKeyframeTrack | undefined

  if (!posTrack) {
    // No root position track — return empty
    return { positions: [], totalFrames, fps }
  }

  const times = posTrack.times
  const values = posTrack.values

  // Sample the XZ translation at each frame
  for (let f = 0; f <= totalFrames; f++) {
    const t = f / fps
    // Find the two surrounding keyframes and interpolate
    const pos = sampleVectorTrackXZ(times, values, t)
    positions.push({ frame: f, x: pos.x, z: pos.z })
  }

  // Zero out the XZ component in the original track (in-place modification)
  // Keep Y (vertical) as-is for jumps, crouches, etc.
  const firstX = values[0]
  const firstZ = values[2]
  for (let i = 0; i < values.length; i += 3) {
    values[i] -= (values[i] - firstX) // Remove XZ delta, keep at first frame position
    values[i + 2] -= (values[i + 2] - firstZ)
  }

  // Rebuild the track with zeroed XZ
  posTrack.validate()

  return { positions, totalFrames, fps }
}

/**
 * Apply root motion to a character's world position at a given frame.
 * Returns the XZ offset to add to the character's base position.
 */
export function getRootMotionAtFrame(
  track: RootMotionTrack,
  frame: number
): { x: number; z: number } {
  if (track.positions.length === 0) return { x: 0, z: 0 }

  // Clamp frame
  const f = Math.max(0, Math.min(frame, track.totalFrames))

  // Find surrounding entries
  const floorIdx = Math.floor(f)
  const ceilIdx = Math.min(floorIdx + 1, track.positions.length - 1)

  if (floorIdx >= track.positions.length) {
    const last = track.positions[track.positions.length - 1]
    return { x: last.x, z: last.z }
  }

  const a = track.positions[floorIdx]
  const b = track.positions[ceilIdx]
  const t = f - floorIdx

  return {
    x: a.x + (b.x - a.x) * t,
    z: a.z + (b.z - a.z) * t,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sampleVectorTrackXZ(
  times: Float32Array | ArrayLike<number>,
  values: Float32Array | ArrayLike<number>,
  t: number
): { x: number; z: number } {
  const len = times.length

  if (len === 0) return { x: 0, z: 0 }
  if (t <= times[0]) return { x: values[0], z: values[2] }
  if (t >= times[len - 1]) return { x: values[(len - 1) * 3], z: values[(len - 1) * 3 + 2] }

  // Binary search for surrounding keyframes
  let lo = 0
  let hi = len - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (times[mid] <= t) lo = mid
    else hi = mid
  }

  const alpha = (t - times[lo]) / (times[hi] - times[lo])
  return {
    x: values[lo * 3] + (values[hi * 3] - values[lo * 3]) * alpha,
    z: values[lo * 3 + 2] + (values[hi * 3 + 2] - values[lo * 3 + 2]) * alpha,
  }
}
