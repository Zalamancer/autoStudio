/**
 * Per-bone unified gizmo for the 3D rig editor.
 * Uses UnifiedGizmo3D to show translate + rotate + scale in one control.
 *
 * Computes transform offsets relative to the bone's rest pose
 * and stores them via use3DRigStore.setBonePose().
 */
import { useCallback, memo } from 'react'
import * as THREE from 'three'
import { use3DRigStore } from '@/stores/use3DRigStore'
import { UnifiedGizmo3D } from './UnifiedGizmo3D'

interface BoneGizmo3DProps {
  skeleton: THREE.Skeleton
  selectedBoneName: string | null
  coordinateSpace: string
}

// ─── Reusable objects ───────────────────────────────────────────────────────

const _deltaQuat = new THREE.Quaternion()
const _restQuat = new THREE.Quaternion()

export const BoneGizmo3D = memo(function BoneGizmo3D({ skeleton, selectedBoneName }: BoneGizmo3DProps) {
  // Find the selected bone object
  const selectedBone = selectedBoneName ? (skeleton.bones.find((b) => b.name === selectedBoneName) ?? null) : null

  if (selectedBoneName && !selectedBone) {
    console.warn(
      `[BoneGizmo3D] Bone "${selectedBoneName}" not found in skeleton.bones. Available:`,
      skeleton.bones.map((b) => b.name),
    )
  }

  // Compute offset relative to rest pose and store in rig store
  const handleChange = useCallback(() => {
    if (!selectedBone || !selectedBoneName) return

    const rig = use3DRigStore.getState().getActiveRig()
    const restBone = rig?.restPose?.[selectedBoneName]

    // Fallback rest values if rest pose entry is missing (e.g. FBX→GLB converted models
    // where the rig was created from a temporary skeleton load)
    if (!restBone) {
      console.warn(`[BoneGizmo3D] No restPose for "${selectedBoneName}"`, {
        rigRestPoseKeys: rig?.restPose ? Object.keys(rig.restPose).slice(0, 5) : 'null',
        skeletonBoneNames: skeleton.bones.map((b) => b.name).slice(0, 5),
      })
    }
    const restPos = restBone?.position ?? { x: 0, y: 0, z: 0 }
    const restQuatVal = restBone?.quaternion ?? { x: 0, y: 0, z: 0, w: 1 }
    const restScaleVal = restBone?.scale ?? { x: 1, y: 1, z: 1 }

    const setBonePose = use3DRigStore.getState().setBonePose

    // Position offset = current - rest
    const posOffset = {
      x: selectedBone.position.x - restPos.x,
      y: selectedBone.position.y - restPos.y,
      z: selectedBone.position.z - restPos.z,
    }
    setBonePose(selectedBoneName, { position: posOffset })

    // Rotation offset = inverse(restQuat) * currentQuat
    _restQuat.set(restQuatVal.x, restQuatVal.y, restQuatVal.z, restQuatVal.w)
    _deltaQuat.copy(_restQuat).invert().multiply(selectedBone.quaternion)
    const quatOffset = {
      x: _deltaQuat.x,
      y: _deltaQuat.y,
      z: _deltaQuat.z,
      w: _deltaQuat.w,
    }
    setBonePose(selectedBoneName, { quaternion: quatOffset })

    // Scale offset = current / rest
    const scaleOffset = {
      x: restScaleVal.x !== 0 ? selectedBone.scale.x / restScaleVal.x : 1,
      y: restScaleVal.y !== 0 ? selectedBone.scale.y / restScaleVal.y : 1,
      z: restScaleVal.z !== 0 ? selectedBone.scale.z / restScaleVal.z : 1,
    }
    setBonePose(selectedBoneName, { scale: scaleOffset })

    console.log(
      `[BoneGizmo3D] onChange "${selectedBoneName}"`,
      'pos:',
      posOffset,
      'quat:',
      quatOffset,
      'scale:',
      scaleOffset,
      'bonePos:',
      { x: selectedBone.position.x, y: selectedBone.position.y, z: selectedBone.position.z },
      'restPos:',
      restPos,
    )
  }, [selectedBone, selectedBoneName, skeleton])

  if (!selectedBone) return null

  return <UnifiedGizmo3D target={selectedBone} onChange={handleChange} size={0.55} />
})
