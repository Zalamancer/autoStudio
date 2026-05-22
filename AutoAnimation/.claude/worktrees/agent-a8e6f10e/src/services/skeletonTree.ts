/**
 * Builds a SkeletonTree from a Three.js Skeleton.
 * Wraps gltfUtils.ts functions and captures rest pose data as plain objects.
 */
import * as THREE from 'three'
import type { BoneMapping, StandardBoneName } from '@/types/character3d'
import type { SkeletonTree, BoneNode, BonePose3D } from '@/types/rig3d'
import {
  detectSkeletonType,
  generateBoneMapping,
} from '@/services/gltfUtils'

/**
 * Build a SkeletonTree from a Three.js Skeleton and an existing bone mapping.
 * Captures the current bone positions/rotations as the rest pose.
 */
export function buildSkeletonTree(
  skeleton: THREE.Skeleton,
  boneMapping: BoneMapping
): SkeletonTree {
  const boneNames = skeleton.bones.map((b) => b.name)
  const boneNameSet = new Set(boneNames)
  const skeletonType = detectSkeletonType(boneNames)

  // Use provided mapping if it references bones that exist in this skeleton.
  // Otherwise regenerate (handles stale mappings from before suffix-stripping fix,
  // and rigs whose stored mapping references different bone names).
  let mapping = boneMapping
  if (Object.keys(boneMapping).length > 0) {
    const mappingValues = Object.values(boneMapping).filter(Boolean) as string[]
    const matchCount = mappingValues.filter((v) => boneNameSet.has(v)).length
    if (matchCount === 0) {
      // Stored mapping doesn't match any skeleton bones — regenerate
      console.log('[buildSkeletonTree] Stored mapping has 0 matches against skeleton bones, regenerating.')
      mapping = generateBoneMapping(boneNames, skeletonType)
    }
  } else {
    mapping = generateBoneMapping(boneNames, skeletonType)
  }

  // Invert the mapping: standard → actual → standard (for lookup)
  const actualToStandard: Record<string, StandardBoneName> = {}
  for (const [standard, actual] of Object.entries(mapping)) {
    if (actual) {
      actualToStandard[actual] = standard as StandardBoneName
    }
  }

  // Build bone nodes
  const bones: BoneNode[] = skeleton.bones.map((bone) => {
    const parentName = (bone.parent as any)?.isBone && boneNameSet.has(bone.parent!.name)
      ? bone.parent!.name
      : null
    const childrenNames = bone.children
      .filter((c) => (c as any).isBone && boneNameSet.has(c.name))
      .map((c) => c.name)

    return {
      name: bone.name,
      parentName,
      childrenNames,
      restPosition: {
        x: bone.position.x,
        y: bone.position.y,
        z: bone.position.z,
      },
      restQuaternion: {
        x: bone.quaternion.x,
        y: bone.quaternion.y,
        z: bone.quaternion.z,
        w: bone.quaternion.w,
      },
      restScale: {
        x: bone.scale.x,
        y: bone.scale.y,
        z: bone.scale.z,
      },
      standardName: actualToStandard[bone.name],
    }
  })

  // Find root bone (bone whose parent is not another bone)
  const rootBones = bones.filter((b) => b.parentName === null)
  if (rootBones.length !== 1) {
    console.warn(`[buildSkeletonTree] Expected 1 root bone, found ${rootBones.length}:`, rootBones.map(b => b.name))
  }
  const rootBone = rootBones[0]
  const rootBoneName = rootBone?.name || (bones.length > 0 ? bones[0].name : '')

  return {
    bones,
    rootBoneName,
    skeletonType,
    boneMapping: mapping,
  }
}

/**
 * Capture the current skeleton bone transforms as a BonePose3D.
 * Used to record the rest pose at import time.
 * Values are stored as plain objects (not THREE instances) for Zustand/Immer compatibility.
 */
export function captureRestPose(skeleton: THREE.Skeleton): BonePose3D {
  const pose: BonePose3D = {}

  for (const bone of skeleton.bones) {
    pose[bone.name] = {
      position: {
        x: bone.position.x,
        y: bone.position.y,
        z: bone.position.z,
      },
      quaternion: {
        x: bone.quaternion.x,
        y: bone.quaternion.y,
        z: bone.quaternion.z,
        w: bone.quaternion.w,
      },
      scale: {
        x: bone.scale.x,
        y: bone.scale.y,
        z: bone.scale.z,
      },
    }
  }

  return pose
}

/**
 * Extract a Three.js Skeleton from a cloned scene.
 * Returns the first skeleton found on any SkinnedMesh.
 */
export function extractSkeletonFromScene(scene: THREE.Object3D): THREE.Skeleton | null {
  let skeleton: THREE.Skeleton | null = null
  scene.traverse((obj) => {
    if ((obj as THREE.SkinnedMesh).isSkinnedMesh && (obj as THREE.SkinnedMesh).skeleton && !skeleton) {
      skeleton = (obj as THREE.SkinnedMesh).skeleton
    }
  })
  return skeleton
}
