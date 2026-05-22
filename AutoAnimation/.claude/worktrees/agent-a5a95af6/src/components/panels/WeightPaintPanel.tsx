/**
 * Weight paint controls panel.
 * Shows weight map legend, bone selector, and toggle between normal/weight view.
 */
import { Eye, EyeOff, Paintbrush } from 'lucide-react'
import { PanelSelect } from '@/components/ui/panel-controls'
import { IconButton } from '@/components/ui'
import { use3DRigStore } from '@/stores/use3DRigStore'

export function WeightPaintPanel() {
  const activeRig = use3DRigStore((s) => s.getActiveRig())
  const selectedBoneName = use3DRigStore((s) => s.selectedBoneName)
  const weightPaintVisible = use3DRigStore((s) => s.showWeightPaint)
  const setWeightPaintVisible = use3DRigStore((s) => s.setShowWeightPaint)
  const selectedDisplayBone = use3DRigStore((s) => s.weightPaintBoneName)
  const setSelectedDisplayBone = use3DRigStore((s) => s.setWeightPaintBoneName)

  if (!activeRig) {
    return (
      <div className="p-4 text-center text-xs text-zinc-600">
        No active 3D rig. Create a rig first.
      </div>
    )
  }

  const bones = activeRig.skeletonTree.bones
  const displayBone = selectedDisplayBone || selectedBoneName

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Paintbrush size={14} className="text-green-400" />
          <span className="text-xs text-zinc-300 font-medium">Weight Paint</span>
        </div>
        <IconButton
          icon={weightPaintVisible ? Eye : EyeOff}
          variant="ghost"
          size="sm"
          state={weightPaintVisible ? 'active' : 'default'}
          onClick={() => setWeightPaintVisible(!weightPaintVisible)}
          tooltip={weightPaintVisible ? 'Hide weight paint' : 'Show weight paint'}
        />
      </div>

      {/* Bone selector */}
      <PanelSelect
        label="Display Bone"
        value={displayBone || ''}
        onChange={(v) => setSelectedDisplayBone(v || null)}
        options={[
          { value: '', label: '-- Select bone --' },
          ...bones.map((bone) => ({
            value: bone.name,
            label: bone.standardName ? `${bone.standardName} (${bone.name})` : bone.name,
          })),
        ]}
        fullWidth
      />

      {/* Weight legend */}
      <div>
        <label className="text-xs text-zinc-500 uppercase tracking-wide mb-1 block">
          Weight Legend
        </label>
        <div className="flex items-center gap-1">
          <div
            className="flex-1 h-4 rounded-lg"
            style={{
              background: 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)',
            }}
          />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-xs text-zinc-600">0.0</span>
          <span className="text-xs text-zinc-600">0.5</span>
          <span className="text-xs text-zinc-600">1.0</span>
        </div>
      </div>

      {/* Info */}
      {displayBone && (
        <div className="text-xs text-zinc-500 bg-zinc-800 rounded-lg p-2">
          Showing vertex weights for <span className="text-zinc-300">{displayBone}</span>.
          Red = full influence, blue = no influence.
        </div>
      )}

      {!weightPaintVisible && (
        <div className="text-xs text-zinc-600 text-center">
          Enable weight paint view to visualize bone influences.
        </div>
      )}
    </div>
  )
}
