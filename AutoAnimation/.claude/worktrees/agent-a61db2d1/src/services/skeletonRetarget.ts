/**
 * Skeleton retargeting service.
 * Retargets SMPL-H animations (from HunyuanMotion) onto custom character skeletons.
 * Uses Three.js SkeletonUtils for animation clip retargeting.
 */
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import type { BoneMapping, StandardBoneName } from '@/types/character3d'

/**
 * Retarget an animation clip from a source skeleton to a target skeleton.
 *
 * @param sourceClip - The animation clip from HunyuanMotion (SMPL-H skeleton)
 * @param sourceObject - The source 3D object with SMPL-H skeleton
 * @param targetObject - The target 3D object (user's character)
 * @param sourceMapping - Bone mapping for the source skeleton (SMPL → standard)
 * @param targetMapping - Bone mapping for the target skeleton (standard → actual)
 */
export function retargetAnimationClip(
  sourceClip: THREE.AnimationClip,
  sourceObject: THREE.Object3D,
  targetObject: THREE.Object3D,
  sourceMapping: BoneMapping,
  targetMapping: BoneMapping
): THREE.AnimationClip {
  // Build a direct source-bone-name → target-bone-name map
  const retargetOptions: Record<string, string> = {}

  for (const [standardName, sourceBoneName] of Object.entries(sourceMapping)) {
    const targetBoneName = targetMapping[standardName as StandardBoneName]
    if (sourceBoneName && targetBoneName) {
      retargetOptions[sourceBoneName] = targetBoneName
    }
  }

  // Use Three.js SkeletonUtils.retargetClip
  const retargetedClip = SkeletonUtils.retargetClip(
    targetObject,
    sourceObject,
    sourceClip,
    { getBoneName: (bone: THREE.Bone) => retargetOptions[bone.name] || bone.name }
  )

  return retargetedClip
}

/**
 * Retarget all animation clips from a source GLTF onto a target character.
 */
export function retargetAllClips(
  sourceClips: THREE.AnimationClip[],
  sourceObject: THREE.Object3D,
  targetObject: THREE.Object3D,
  sourceMapping: BoneMapping,
  targetMapping: BoneMapping
): THREE.AnimationClip[] {
  return sourceClips.map((clip) =>
    retargetAnimationClip(clip, sourceObject, targetObject, sourceMapping, targetMapping)
  )
}
