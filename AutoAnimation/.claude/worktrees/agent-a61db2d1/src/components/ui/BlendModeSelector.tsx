import { BLEND_MODE_OPTIONS, type BlendMode } from '@/types/blendModes'
import { PanelSelect } from '@/components/ui/panel-controls'

interface BlendModeSelectorProps {
  value: BlendMode
  onChange: (mode: BlendMode) => void
  className?: string
}

export function BlendModeSelector({ value, onChange, className }: BlendModeSelectorProps) {
  return (
    <PanelSelect
      value={value}
      onChange={(v) => onChange(v as BlendMode)}
      options={BLEND_MODE_OPTIONS}
      className={className}
      fullWidth
    />
  )
}
