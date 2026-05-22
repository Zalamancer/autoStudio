import { Info } from 'lucide-react'
import { useCharacterContext } from '../../contexts/CharacterContext'
import { useToolContext } from '../../contexts/ToolContext'
import { PanelSlider } from '@/components/ui/panel-controls'

/** Clean bone names: "leftElbow_to_leftWrist" → "L Elbow → L Wrist" */
const shortBoneName = (name: string) => {
  const cleaned = name.replace(/_to_/g, ' → ').replace(/([a-z])([A-Z])/g, '$1 $2')
  return cleaned.replace(/\bleft /gi, 'L ').replace(/\bright /gi, 'R ')
}

const CATEGORY_PATTERNS: Record<string, RegExp> = {
  head: /head|neck/i,
  body: /spine|chest|hips/i,
  arms: /shoulder|collar|elbow|wrist|forearm|upper.?arm/i,
  legs: /hip|thigh|knee|shin|ankle|foot/i,
  hands: /hand|thumb|index|middle|ring|pinky/i,
}

function matchesCategory(boneName: string, category: string): boolean {
  if (category === 'all') return true
  return CATEGORY_PATTERNS[category]?.test(boneName) ?? true
}

export interface WeightPanelProps {
  onRadiusChange?: (boneIndex: number, radius: number) => void
  boneCategory?: string
}

export function WeightPanel({ onRadiusChange, boneCategory = 'all' }: WeightPanelProps) {
  const { state: charState } = useCharacterContext()
  const { state: toolState } = useToolContext()

  const { skeleton, selectedJoint } = charState
  const isEditMode = toolState.editMode

  if (!skeleton || !selectedJoint || !isEditMode) return null

  const connectedBones = skeleton.bones.filter((b) => b.from === selectedJoint || b.to === selectedJoint)

  if (connectedBones.length === 0) return null

  const filteredBones = skeleton.bones.filter((b) => matchesCategory(b.name, boneCategory))

  return (
    <div className="p-4 border-b border-white/5">
      <h2 className="text-white text-sm font-semibold mb-3">Bone Influence — {shortBoneName(selectedJoint)}</h2>

      {connectedBones.map((bone) => {
        const radius = bone.radiusMul ?? 1.0
        return (
          <PanelSlider
            key={bone.name}
            label={shortBoneName(bone.name)}
            value={radius}
            onChange={(v) => onRadiusChange?.(bone.index, v)}
            min={0.001}
            max={3.0}
            step={0.001}
            precision={3}
            suffix="×"
          />
        )
      })}

      {/* Filtered bones list */}
      <div className="mt-3 pt-3 border-t border-white/5">
        {filteredBones.map((bone) => {
          const radius = bone.radiusMul ?? 1.0
          const isConnected = bone.from === selectedJoint || bone.to === selectedJoint
          return (
            <div key={bone.name} style={isConnected ? { opacity: 0.4 } : undefined}>
              <PanelSlider
                label={shortBoneName(bone.name)}
                value={radius}
                onChange={(v) => onRadiusChange?.(bone.index, v)}
                min={0.001}
                max={3.0}
                step={0.001}
                precision={3}
                suffix="×"
              />
            </div>
          )
        })}
      </div>

      <div className="flex justify-end mt-2">
        <div className="relative group">
          <button className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.06] transition-colors">
            <Info size={14} />
          </button>
          <div className="absolute bottom-full right-0 mb-1.5 w-52 px-3 py-2 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-xl text-[10px] text-zinc-400 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
            Adjust radius to control bone envelope size. Envelopes are shown as capsules on the character.
          </div>
        </div>
      </div>
    </div>
  )
}
