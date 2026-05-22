import { useCallback, useMemo } from 'react'

import { CustomSelect } from '@/components/ui'
import { PanelSlider } from '@/components/ui/panel-controls'
import type { PixelArtEffectSettings } from '@/types/pixelArtEffect'
import { PIXEL_ART_EFFECT_PRESETS } from '@/types/pixelArtEffect'

interface PixelArtEffectSectionProps {
  settings: PixelArtEffectSettings | undefined
  onChange: (settings: PixelArtEffectSettings | undefined) => void
}

const DEFAULT_SETTINGS: PixelArtEffectSettings = { enabled: true, pixelSize: 8, colorLevels: 8, outline: true }

const PRESET_OPTIONS = [
  { value: 'none', label: 'None' },
  ...PIXEL_ART_EFFECT_PRESETS.map((p, i) => ({ value: String(i), label: p.label })),
]

export function PixelArtEffectSection({ settings, onChange }: PixelArtEffectSectionProps) {
  const enabled = settings?.enabled ?? false
  const current = settings ?? DEFAULT_SETTINGS

  const update = useCallback(
    (patch: Partial<PixelArtEffectSettings>) => {
      onChange({ ...current, ...patch, enabled: true })
    },
    [current, onChange],
  )

  const activePresetValue = useMemo(() => {
    if (!enabled) return 'none'
    const idx = PIXEL_ART_EFFECT_PRESETS.findIndex(
      (p) =>
        current.pixelSize === p.settings.pixelSize &&
        current.colorLevels === p.settings.colorLevels &&
        current.outline === p.settings.outline,
    )
    return idx >= 0 ? String(idx) : ''
  }, [enabled, current])

  const handlePresetChange = useCallback(
    (v: string) => {
      if (v === 'none') {
        onChange({ ...current, enabled: false })
      } else {
        const preset = PIXEL_ART_EFFECT_PRESETS[Number(v)]
        if (preset) update(preset.settings)
      }
    },
    [current, onChange, update],
  )

  return (
    <div>
      {/* Preset dropdown (includes None to disable) */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Preset</span>
          <div className="flex-1 min-w-0">
            <CustomSelect value={activePresetValue} onChange={handlePresetChange} options={PRESET_OPTIONS} />
          </div>
        </div>
      </div>

      {enabled && (
        <div className="px-4 pb-4 space-y-4">
          {/* Pixel Size */}
          <PanelSlider
            label="Pixel Size"
            value={current.pixelSize}
            onChange={(v) => update({ pixelSize: Math.round(Math.min(32, Math.max(2, v))) })}
            min={2}
            max={32}
            step={1}
            precision={0}
            suffix="px"
          />

          {/* Color Levels */}
          <PanelSlider
            label="Colors"
            value={current.colorLevels}
            onChange={(v) => update({ colorLevels: Math.round(Math.min(32, Math.max(0, v))) })}
            min={0}
            max={32}
            step={1}
            precision={0}
          />
          {/* Outline */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm w-20 shrink-0">Outline</span>
            <div className="flex-1 min-w-0 flex gap-1.5">
              {([true, false] as const).map((v) => (
                <button
                  key={String(v)}
                  onClick={() => update({ outline: v })}
                  className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${
                    current.outline === v
                      ? 'bg-[#4a7eff] text-white'
                      : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white'
                  }`}
                >
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
