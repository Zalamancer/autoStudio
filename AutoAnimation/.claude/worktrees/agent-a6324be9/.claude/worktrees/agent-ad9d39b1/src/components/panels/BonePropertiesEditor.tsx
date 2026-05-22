/**
 * Compact transform editor for the selected bone.
 * Horizontal X/Y/Z draggable fields per row (position, rotation, scale).
 * Rotation is displayed as Euler angles (degrees) but stored as quaternions.
 * Click to type, drag horizontally to scrub values.
 *
 * UI primitives (DragField, TransformRow, etc.) live in BonePropertyControls.tsx
 * so consumers that only need the controls don't pull in Three.js.
 */
import { useState, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { Lock, Unlock } from 'lucide-react'
import { use3DRigStore } from '@/stores/use3DRigStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { DragField, TransformRow, SENSITIVITIES, type Axis } from './BonePropertyControls'

// Re-export shared primitives for backward compatibility
export { DragField, TransformRow, SENSITIVITIES, type Axis } from './BonePropertyControls'
export type { DragFieldProps } from './BonePropertyControls'

const RAD_TO_DEG = 180 / Math.PI
const DEG_TO_RAD = Math.PI / 180

// ─── Main component ─────────────────────────────────────────────────────────

export function BonePropertiesEditor() {
  const selectedBoneName = use3DRigStore((s) => s.selectedBoneName)
  const currentPose = use3DRigStore((s) => s.currentPose)
  const activeRig = use3DRigStore((s) => s.getActiveRig())
  const setBonePose = use3DRigStore((s) => s.setBonePose)
  const resetBonePose = use3DRigStore((s) => s.resetBonePose)
  const addPoseKeyframe = use3DRigStore((s) => s.addPoseKeyframe)
  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const [scaleLocked, setScaleLocked] = useState(true)

  const poseState = selectedBoneName && currentPose
    ? currentPose[selectedBoneName]
    : null

  // Convert quaternion to euler for display
  const euler = useMemo(() => {
    if (!poseState) return { x: 0, y: 0, z: 0 }
    const q = new THREE.Quaternion(
      poseState.quaternion.x,
      poseState.quaternion.y,
      poseState.quaternion.z,
      poseState.quaternion.w
    )
    const e = new THREE.Euler().setFromQuaternion(q)
    return {
      x: e.x * RAD_TO_DEG,
      y: e.y * RAD_TO_DEG,
      z: e.z * RAD_TO_DEG,
    }
  }, [poseState])

  const handlePositionChange = useCallback(
    (axis: Axis, value: number) => {
      if (!selectedBoneName) return
      const current = poseState?.position ?? { x: 0, y: 0, z: 0 }
      setBonePose(selectedBoneName, {
        position: { ...current, [axis]: value },
      })
    },
    [selectedBoneName, setBonePose, poseState]
  )

  const handleRotationChange = useCallback(
    (axis: Axis, degrees: number) => {
      if (!selectedBoneName) return
      const e = new THREE.Euler(
        axis === 'x' ? degrees * DEG_TO_RAD : (euler.x * DEG_TO_RAD),
        axis === 'y' ? degrees * DEG_TO_RAD : (euler.y * DEG_TO_RAD),
        axis === 'z' ? degrees * DEG_TO_RAD : (euler.z * DEG_TO_RAD)
      )
      const q = new THREE.Quaternion().setFromEuler(e)
      setBonePose(selectedBoneName, {
        quaternion: { x: q.x, y: q.y, z: q.z, w: q.w },
      })
    },
    [selectedBoneName, setBonePose, euler]
  )

  const handleScaleChange = useCallback(
    (axis: Axis, value: number) => {
      if (!selectedBoneName || !poseState) return
      if (scaleLocked) {
        const old = poseState.scale[axis]
        if (old === 0) return
        const ratio = value / old
        setBonePose(selectedBoneName, {
          scale: {
            x: Math.round(poseState.scale.x * ratio * 1000) / 1000,
            y: Math.round(poseState.scale.y * ratio * 1000) / 1000,
            z: Math.round(poseState.scale.z * ratio * 1000) / 1000,
          },
        })
      } else {
        const current = poseState?.scale ?? { x: 1, y: 1, z: 1 }
        setBonePose(selectedBoneName, {
          scale: { ...current, [axis]: value },
        })
      }
    },
    [selectedBoneName, setBonePose, scaleLocked, poseState]
  )

  const handleReset = useCallback(() => {
    if (!selectedBoneName) return
    resetBonePose(selectedBoneName)
  }, [selectedBoneName, resetBonePose])

  const handleAddKeyframe = useCallback(() => {
    if (!activeRig || !currentPose || Object.keys(currentPose).length === 0) return
    addPoseKeyframe(activeRig.characterId, currentFrame, currentPose)
  }, [activeRig, currentPose, currentFrame, addPoseKeyframe])

  if (!selectedBoneName) {
    return (
      <div className="text-sm text-zinc-600 p-3 text-center">
        Select a bone to edit its properties
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 p-3">
      {/* Bone name */}
      <div className="text-sm text-zinc-200 font-semibold truncate tracking-wide">
        {selectedBoneName}
      </div>

      <div className="h-px bg-zinc-700/50" />

      {/* Position */}
      <TransformRow label="Position">
        {(['x', 'y', 'z'] as Axis[]).map((axis) => (
          <DragField
            key={axis}
            axis={axis}
            value={poseState?.position[axis] ?? 0}
            onChange={(v) => handlePositionChange(axis, v)}
            sensitivity={SENSITIVITIES.position}
          />
        ))}
      </TransformRow>

      {/* Rotation */}
      <TransformRow label="Rotation">
        {(['x', 'y', 'z'] as Axis[]).map((axis) => (
          <DragField
            key={axis}
            axis={axis}
            value={euler[axis]}
            onChange={(v) => handleRotationChange(axis, v)}
            sensitivity={SENSITIVITIES.rotation}
            decimals={1}
          />
        ))}
      </TransformRow>

      {/* Scale */}
      <TransformRow
        label="Scale"
        extra={
          <button
            onClick={() => setScaleLocked(!scaleLocked)}
            className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
            title={scaleLocked ? 'Unlock scale axes' : 'Lock scale axes'}
          >
            {scaleLocked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
        }
      >
        {(['x', 'y', 'z'] as Axis[]).map((axis) => (
          <DragField
            key={axis}
            axis={axis}
            value={poseState?.scale[axis] ?? 1}
            onChange={(v) => handleScaleChange(axis, v)}
            sensitivity={SENSITIVITIES.scale}
          />
        ))}
      </TransformRow>

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={handleReset}
          className="flex-1 px-3 py-2 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
        >
          Reset
        </button>
        <button
          onClick={handleAddKeyframe}
          className="flex-1 px-3 py-2 text-sm font-medium bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
        >
          Keyframe
        </button>
      </div>
    </div>
  )
}
