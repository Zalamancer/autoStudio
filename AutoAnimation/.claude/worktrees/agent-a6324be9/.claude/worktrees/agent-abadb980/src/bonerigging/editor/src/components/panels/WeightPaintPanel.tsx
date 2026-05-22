import { useCharacterContext } from '../../contexts/CharacterContext'
import { useToolContext } from '../../contexts/ToolContext'
import type { WeightPaintState } from '../../contexts/ToolContext'
import { PanelSlider, PanelSelect } from '@/components/ui/panel-controls'

export interface WeightPaintPanelProps {
  visible: boolean
  onReset: () => void
  onDone: () => void
}

export function WeightPaintPanel({ visible, onReset, onDone }: WeightPaintPanelProps) {
  const { state: charState } = useCharacterContext()
  const { state: toolState, dispatch: toolDispatch } = useToolContext()

  if (!visible) return null

  const { skeleton } = charState
  const { wpState } = toolState
  const bones = skeleton?.bones ?? []

  const shortName = (name: string) => {
    const cleaned = name.replace(/_to_/g, ' → ').replace(/([a-z])([A-Z])/g, '$1 $2')
    return cleaned.replace(/\bleft /gi, 'L ').replace(/\bright /gi, 'R ')
  }
  const boneOptions = bones.map((b, i) => ({ value: String(i), label: shortName(b.name) }))

  const setMode = (mode: WeightPaintState['mode']) => {
    toolDispatch({ type: 'SET_WP_STATE', state: { mode } })
  }

  return (
    <div className="p-4 border-b border-white/5">
      <h2 className="text-white text-base font-semibold mb-4">Weight Paint</h2>

      <PanelSelect
        label="Bone"
        value={String(wpState.bone)}
        options={boneOptions}
        onChange={(v) => toolDispatch({ type: 'SET_WP_STATE', state: { bone: Number(v) } })}
      />

      <PanelSlider
        label="Brush Size"
        value={wpState.radius}
        onChange={(v) => toolDispatch({ type: 'SET_WP_STATE', state: { radius: v } })}
        min={5}
        max={100}
        step={1}
        suffix="px"
      />

      <PanelSlider
        label="Strength"
        value={wpState.strength}
        onChange={(v) => toolDispatch({ type: 'SET_WP_STATE', state: { strength: v } })}
        min={0.01}
        max={0.5}
        step={0.01}
        precision={2}
      />

      <div className="flex items-center gap-3 mb-3">
        <span className="text-gray-400 text-sm w-20 shrink-0">Mode</span>
        <div className="flex gap-1 flex-1">
          {(['add', 'subtract', 'smooth'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 px-2 py-2 text-sm rounded-lg transition-colors ${
                wpState.mode === m ? 'bg-[#4a7eff] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-white'
              }`}
            >
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={onReset}
          className="flex-1 bg-[#2a2a2a] text-gray-400 text-sm px-3 py-2 rounded-lg hover:text-white transition-colors"
        >
          Reset to Auto
        </button>
        <button
          onClick={onDone}
          className="flex-1 bg-[#4a7eff] text-white text-sm px-3 py-2 rounded-lg hover:bg-[#3a6eef] transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )
}
