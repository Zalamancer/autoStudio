/**
 * Right panel showing 3D rig properties: bone transform editor (position/rotation/scale)
 * and reset pose button. Skeleton info, animation stats, and bone mapping are now
 * available via the info (ℹ) overlay on the canvas viewport.
 */
import { use3DRigStore } from '@/stores/use3DRigStore'
import { BonePropertiesEditor } from '@/components/panels/BonePropertiesEditor'

export function Rig3DPropertiesPanel() {
  const activeRig = use3DRigStore((s) => s.getActiveRig())
  const resetPose = use3DRigStore((s) => s.resetPose)

  if (!activeRig) {
    return (
      <div className="p-4 text-center text-sm text-zinc-600">
        No active 3D rig
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      {/* Bone Properties (position / rotation / scale) */}
      <BonePropertiesEditor />

      <div className="border-b border-zinc-700/50" />

      {/* Reset All Poses */}
      <div className="p-4">
        <button
          onClick={resetPose}
          className="w-full px-3 py-2.5 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-400 rounded-lg transition-colors"
        >
          Reset All Poses
        </button>
      </div>
    </div>
  )
}
