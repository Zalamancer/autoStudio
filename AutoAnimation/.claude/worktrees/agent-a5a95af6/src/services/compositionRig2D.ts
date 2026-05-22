/**
 * Build RigExportData[] for 2D rigged character export.
 */

import type { RigExportData } from '@/remotion/types'
import { useRigStore } from '@/stores/useRigStore'

export function buildRigExportData(): RigExportData[] | undefined {
  const rigStore = useRigStore.getState()
  const allRigs = Object.values(rigStore.rigs)
  if (allRigs.length === 0) return undefined

  const result: RigExportData[] = []
  for (const rig of allRigs) {
    result.push({
      id: rig.id,
      sourceImageUrl: rig.sourceImageUrl,
      imageWidth: rig.imageWidth,
      imageHeight: rig.imageHeight,
      skeleton: {
        joints: rig.skeleton.joints.map((j) => ({
          id: j.id,
          name: j.name,
          parentId: j.parentId,
          restPosition: j.restPosition,
          category: j.category,
        })),
        rootJointId: rig.skeleton.rootJointId,
      },
      meshGridSpacing: rig.meshGridSpacing,
      restPose: rig.restPose,
      poseTracks: rigStore.poseTracks
        .filter((t) => t.characterId === 'primary' || t.characterId === rig.id)
        .map((t) => ({
          characterId: t.characterId,
          keyframes: t.keyframes.map((kf) => ({
            frame: kf.frame,
            pose: kf.pose,
            easing: kf.easing,
          })),
        })),
      boneriggingSerializedData: rig.boneriggingSerializedData,
    })
  }

  return result.length > 0 ? result : undefined
}
