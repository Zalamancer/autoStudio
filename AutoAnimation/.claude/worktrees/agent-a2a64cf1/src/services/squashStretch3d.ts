/**
 * Volume-preserving squash & stretch for 3D bones.
 * Computes bone length ratio (current vs rest), applies inverse perpendicular
 * scale to maintain volume.
 *
 * Formula: if bone stretches by factor S along its primary axis,
 * perpendicular axes scale by 1/sqrt(S) to preserve volume (det=1).
 */
import * as THREE from 'three'

export interface SquashStretchConfig {
  /** Bone name to apply squash & stretch to */
  boneName: string
  /** Whether this bone has S&S enabled */
  enabled: boolean
  /** Intensity multiplier (0 = no effect, 1 = full volume preservation) */
  intensity: number
  /** Primary axis of the bone (which axis "stretches") */
  primaryAxis: 'x' | 'y' | 'z'
}

// Pre-allocated objects
const _boneWorldPos = new THREE.Vector3()
const _childWorldPos = new THREE.Vector3()
const _restBoneWorldPos = new THREE.Vector3()
const _restChildWorldPos = new THREE.Vector3()

/**
 * Apply squash & stretch to a set of bones.
 * Call this after all pose offsets and spring bone simulation, before rendering.
 */
export function applySquashStretch(
  skeleton: THREE.Skeleton,
  configs: SquashStretchConfig[],
  restLengths: Map<string, number>
) {
  for (const config of configs) {
    if (!config.enabled || config.intensity <= 0) continue

    const bone = skeleton.bones.find((b) => b.name === config.boneName)
    if (!bone) continue

    // Find the first child bone to measure current length
    const childBone = bone.children.find((c) => c instanceof THREE.Bone) as THREE.Bone | undefined
    if (!childBone) continue

    // Get current bone length (distance to first child in world space)
    bone.getWorldPosition(_boneWorldPos)
    childBone.getWorldPosition(_childWorldPos)
    const currentLength = _boneWorldPos.distanceTo(_childWorldPos)

    // Get rest length
    const restLength = restLengths.get(config.boneName) ?? currentLength
    if (restLength <= 0.0001) continue

    // Stretch ratio
    const stretchRatio = currentLength / restLength

    // Volume-preserving perpendicular scale: 1/sqrt(S)
    const perpScale = 1 / Math.sqrt(Math.max(stretchRatio, 0.01))

    // Blend with intensity
    const primaryScale = 1 + (stretchRatio - 1) * config.intensity
    const perpFinal = 1 + (perpScale - 1) * config.intensity

    // Apply scale based on primary axis
    switch (config.primaryAxis) {
      case 'x':
        bone.scale.set(primaryScale, perpFinal, perpFinal)
        break
      case 'y':
        bone.scale.set(perpFinal, primaryScale, perpFinal)
        break
      case 'z':
        bone.scale.set(perpFinal, perpFinal, primaryScale)
        break
    }
  }
}

/**
 * Capture rest bone lengths from a skeleton at rest pose.
 * Returns a map of boneName → distance to first child bone.
 */
export function captureRestBoneLengths(skeleton: THREE.Skeleton): Map<string, number> {
  const lengths = new Map<string, number>()

  for (const bone of skeleton.bones) {
    const child = bone.children.find((c) => c instanceof THREE.Bone) as THREE.Bone | undefined
    if (!child) continue

    bone.getWorldPosition(_restBoneWorldPos)
    child.getWorldPosition(_restChildWorldPos)
    lengths.set(bone.name, _restBoneWorldPos.distanceTo(_restChildWorldPos))
  }

  return lengths
}
