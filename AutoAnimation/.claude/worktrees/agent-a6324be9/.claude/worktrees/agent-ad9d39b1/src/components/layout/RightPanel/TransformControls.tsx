import { PanelSlider } from '@/components/ui/panel-controls'
import { useCanvasStore } from '@/stores'

export function TransformControls() {
  const { characters, selectedCharacterId, updateCharacterTransform } = useCanvasStore()

  const selectedCharacter = characters.find((c) => c.id === selectedCharacterId)

  if (!selectedCharacter) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        Select a character to edit transforms
      </div>
    )
  }

  const { transform } = selectedCharacter

  const handleChange = (key: keyof typeof transform, value: number) => {
    updateCharacterTransform(selectedCharacterId!, { [key]: value })
  }

  return (
    <div className="p-4 space-y-4">
      <h4 className="text-sm font-medium text-zinc-300">Transform</h4>

      {/* Position */}
      <PanelSlider label="X" value={transform.x} onChange={(v) => handleChange('x', v)} min={-2000} max={2000} step={1} precision={0} compact />
      <PanelSlider label="Y" value={transform.y} onChange={(v) => handleChange('y', v)} min={-2000} max={2000} step={1} precision={0} compact />

      {/* Rotation */}
      <PanelSlider label="Rotation" value={transform.rotation} onChange={(v) => handleChange('rotation', v)} min={-180} max={180} step={1} precision={1} suffix="°" />

      {/* Size */}
      <PanelSlider label="W" value={transform.scaleX * 100} onChange={(v) => handleChange('scaleX', v / 100)} min={10} max={500} step={1} suffix="%" precision={0} compact />
      <PanelSlider label="H" value={transform.scaleY * 100} onChange={(v) => handleChange('scaleY', v / 100)} min={10} max={500} step={1} suffix="%" precision={0} compact />
    </div>
  )
}
