/**
 * Generic settings panel for all Canvas 2D style effects.
 * Renders preset dropdown + per-effect sliders/toggles based on the
 * STYLE_EFFECT_REGISTRY metadata and the current settings object.
 */

import { useCallback, useMemo } from 'react'
import { CustomSelect } from '@/components/ui'
import { PanelSlider } from '@/components/ui/panel-controls'
import {
  type ActiveStyleEffect,
  getEffectRegistryEntry,
} from '@/types/styleEffects'

interface StyleEffectSectionProps {
  effect: ActiveStyleEffect
  onChange: (effect: ActiveStyleEffect | undefined) => void
}

// ---------------------------------------------------------------------------
// Per-effect field definitions (label, key, min, max, step, type)
// ---------------------------------------------------------------------------

interface FieldDef {
  key: string
  label: string
  type: 'number' | 'boolean' | 'color'
  min?: number
  max?: number
  step?: number
  precision?: number
  unit?: string
}

const EFFECT_FIELDS: Record<string, FieldDef[]> = {
  'woodcut': [
    { key: 'threshold', label: 'Threshold', type: 'number', min: 40, max: 220, step: 1, precision: 0 },
    { key: 'lineWeight', label: 'Line Weight', type: 'number', min: 1, max: 5, step: 1, precision: 0, unit: 'px' },
    { key: 'contrast', label: 'Contrast', type: 'number', min: 1.0, max: 3.0, step: 0.1, precision: 1 },
    { key: 'invert', label: 'Invert', type: 'boolean' },
  ],
  'woodcut-mask': [
    { key: 'threshold', label: 'Threshold', type: 'number', min: 40, max: 220, step: 1, precision: 0 },
    { key: 'lineWeight', label: 'Line Weight', type: 'number', min: 1, max: 5, step: 1, precision: 0, unit: 'px' },
    { key: 'contrast', label: 'Contrast', type: 'number', min: 1.0, max: 3.0, step: 0.1, precision: 1 },
    { key: 'invert', label: 'Invert', type: 'boolean' },
  ],
  'noise-grain': [
    { key: 'intensity', label: 'Intensity', type: 'number', min: 0.05, max: 1.0, step: 0.05, precision: 2 },
    { key: 'grainSize', label: 'Grain Size', type: 'number', min: 1, max: 4, step: 1, precision: 0, unit: 'px' },
    { key: 'monochrome', label: 'Mono', type: 'boolean' },
    { key: 'speed', label: 'Speed', type: 'number', min: 1, max: 5, step: 1, precision: 0 },
  ],
  'cel-shade': [
    { key: 'levels', label: 'Levels', type: 'number', min: 2, max: 8, step: 1, precision: 0 },
    { key: 'edgeThickness', label: 'Edge', type: 'number', min: 0, max: 4, step: 1, precision: 0, unit: 'px' },
    { key: 'edgeColor', label: 'Edge Color', type: 'color' },
    { key: 'edgeSensitivity', label: 'Sensitivity', type: 'number', min: 10, max: 100, step: 5, precision: 0 },
  ],
  'neon-outline': [
    { key: 'glowColor', label: 'Glow Color', type: 'color' },
    { key: 'glowRadius', label: 'Radius', type: 'number', min: 2, max: 30, step: 1, precision: 0, unit: 'px' },
    { key: 'glowIntensity', label: 'Intensity', type: 'number', min: 0.5, max: 3.0, step: 0.1, precision: 1 },
    { key: 'edgeThreshold', label: 'Edge Threshold', type: 'number', min: 10, max: 100, step: 5, precision: 0 },
    { key: 'backgroundDarken', label: 'BG Darken', type: 'number', min: 0, max: 1, step: 0.1, precision: 1 },
  ],
  'glitch': [
    { key: 'intensity', label: 'Intensity', type: 'number', min: 1, max: 10, step: 1, precision: 0 },
    { key: 'rgbSplit', label: 'RGB Split', type: 'number', min: 0, max: 20, step: 1, precision: 0, unit: 'px' },
    { key: 'scanlineOpacity', label: 'Scanlines', type: 'number', min: 0, max: 1, step: 0.1, precision: 1 },
    { key: 'blockDisplace', label: 'Block Shift', type: 'number', min: 0, max: 30, step: 1, precision: 0, unit: 'px' },
    { key: 'speed', label: 'Speed', type: 'number', min: 1, max: 5, step: 1, precision: 0 },
  ],
  'vhs-retro': [
    { key: 'chromaticAberration', label: 'Chromatic', type: 'number', min: 0, max: 10, step: 1, precision: 0, unit: 'px' },
    { key: 'scanlineOpacity', label: 'Scanlines', type: 'number', min: 0, max: 1, step: 0.05, precision: 2 },
    { key: 'scanlineSpacing', label: 'Spacing', type: 'number', min: 2, max: 8, step: 1, precision: 0, unit: 'px' },
    { key: 'tracking', label: 'Tracking', type: 'number', min: 0, max: 20, step: 1, precision: 0, unit: 'px' },
    { key: 'colorBleed', label: 'Color Bleed', type: 'number', min: 0, max: 1, step: 0.05, precision: 2 },
    { key: 'speed', label: 'Speed', type: 'number', min: 1, max: 5, step: 1, precision: 0 },
  ],
  'sketch-hatch': [
    { key: 'lineSpacing', label: 'Spacing', type: 'number', min: 2, max: 10, step: 1, precision: 0, unit: 'px' },
    { key: 'lineThickness', label: 'Thickness', type: 'number', min: 1, max: 3, step: 1, precision: 0, unit: 'px' },
    { key: 'crossHatch', label: 'Cross Hatch', type: 'boolean' },
    { key: 'lineDarkness', label: 'Darkness', type: 'number', min: 0.1, max: 1.0, step: 0.1, precision: 1 },
    { key: 'paperColor', label: 'Paper', type: 'color' },
  ],
  'halftone': [
    { key: 'dotSize', label: 'Dot Size', type: 'number', min: 3, max: 16, step: 1, precision: 0, unit: 'px' },
    { key: 'dotScale', label: 'Dot Scale', type: 'number', min: 0.3, max: 1.0, step: 0.1, precision: 1 },
    { key: 'dotColor', label: 'Dot Color', type: 'color' },
    { key: 'backgroundColor', label: 'Background', type: 'color' },
    { key: 'angle', label: 'Angle', type: 'number', min: 0, max: 90, step: 5, precision: 0, unit: 'deg' },
  ],
  'voxel': [
    { key: 'cubeSize', label: 'Cube Size', type: 'number', min: 4, max: 24, step: 1, precision: 0, unit: 'px' },
    { key: 'heightScale', label: 'Height', type: 'number', min: 0.5, max: 3.0, step: 0.1, precision: 1 },
    { key: 'topBrightness', label: 'Top Light', type: 'number', min: 0.8, max: 1.2, step: 0.05, precision: 2 },
    { key: 'ambient', label: 'Ambient', type: 'number', min: 0, max: 0.5, step: 0.05, precision: 2 },
    { key: 'gridLines', label: 'Grid Lines', type: 'boolean' },
  ],
  'watercolor-bleed': [
    { key: 'bleedAmount', label: 'Bleed', type: 'number', min: 2, max: 20, step: 1, precision: 0, unit: 'px' },
    { key: 'edgeRoughness', label: 'Roughness', type: 'number', min: 0, max: 1, step: 0.1, precision: 1 },
    { key: 'saturation', label: 'Saturation', type: 'number', min: 0.8, max: 2.0, step: 0.1, precision: 1 },
    { key: 'paperTexture', label: 'Paper', type: 'number', min: 0, max: 0.5, step: 0.05, precision: 2 },
    { key: 'wetEdge', label: 'Wet Edge', type: 'number', min: 0, max: 1, step: 0.1, precision: 1 },
  ],
  'mosaic': [
    { key: 'cellCount', label: 'Cells', type: 'number', min: 20, max: 500, step: 10, precision: 0 },
    { key: 'borderWidth', label: 'Border', type: 'number', min: 0, max: 4, step: 1, precision: 0, unit: 'px' },
    { key: 'borderColor', label: 'Border Color', type: 'color' },
    { key: 'seed', label: 'Seed', type: 'number', min: 1, max: 999, step: 1, precision: 0 },
    { key: 'colorVariation', label: 'Variation', type: 'number', min: 0, max: 0.5, step: 0.05, precision: 2 },
  ],
}

export function StyleEffectSection({ effect, onChange }: StyleEffectSectionProps) {
  const entry = getEffectRegistryEntry(effect.type)
  const fields = EFFECT_FIELDS[effect.type] || []
  const settings = effect.settings

  const update = useCallback(
    (patch: Record<string, any>) => {
      onChange({ type: effect.type, settings: { ...settings, ...patch, enabled: true } })
    },
    [effect.type, settings, onChange],
  )

  // Preset dropdown
  const presets = entry?.presets || []
  const PRESET_OPTIONS = useMemo(
    () => [
      { value: 'none', label: 'None' },
      ...presets.map((p, i) => ({ value: String(i), label: p.label })),
    ],
    [presets],
  )

  const activePresetValue = useMemo(() => {
    if (!settings?.enabled) return 'none'
    const idx = presets.findIndex((p) => {
      return Object.entries(p.settings).every(([k, v]) => settings[k] === v)
    })
    return idx >= 0 ? String(idx) : ''
  }, [settings, presets])

  const handlePresetChange = useCallback(
    (v: string) => {
      if (v === 'none') {
        onChange({ type: effect.type, settings: { ...settings, enabled: false } })
      } else {
        const preset = presets[Number(v)]
        if (preset) update(preset.settings)
      }
    },
    [effect.type, settings, onChange, presets, update],
  )

  return (
    <div>
      {/* Preset */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm w-20 shrink-0">Preset</span>
          <div className="flex-1 min-w-0">
            <CustomSelect
              value={activePresetValue}
              onChange={handlePresetChange}
              options={PRESET_OPTIONS}
            />
          </div>
        </div>
      </div>

      {settings?.enabled && (
        <div className="px-4 pb-4 space-y-4">
          {fields.map((field) => {
            if (field.type === 'number') {
              return (
                <PanelSlider
                  key={field.key}
                  label={field.label}
                  value={settings[field.key] ?? 0}
                  onChange={(v) => {
                    const clamped = Math.min(field.max!, Math.max(field.min!, v))
                    update({ [field.key]: field.precision === 0 ? Math.round(clamped) : +clamped.toFixed(field.precision!) })
                  }}
                  min={field.min!}
                  max={field.max!}
                  step={field.step!}
                  precision={field.precision}
                  suffix={field.unit}
                />
              )
            }
            if (field.type === 'boolean') {
              return (
                <div key={field.key} className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm w-20 shrink-0">{field.label}</span>
                  <div className="flex-1 min-w-0 flex gap-1.5">
                    {([true, false] as const).map((v) => (
                      <button
                        key={String(v)}
                        onClick={() => update({ [field.key]: v })}
                        className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${
                          settings[field.key] === v
                            ? 'bg-blue-600 text-white'
                            : 'bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a] hover:text-white'
                        }`}
                      >
                        {v ? 'Yes' : 'No'}
                      </button>
                    ))}
                  </div>
                </div>
              )
            }
            if (field.type === 'color') {
              return (
                <div key={field.key} className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm w-20 shrink-0">{field.label}</span>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <input
                      type="color"
                      value={settings[field.key] || '#000000'}
                      onChange={(e) => update({ [field.key]: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border border-white/10 bg-transparent"
                    />
                    <span className="text-xs text-gray-500 font-mono">{settings[field.key]}</span>
                  </div>
                </div>
              )
            }
            return null
          })}
        </div>
      )}
    </div>
  )
}
