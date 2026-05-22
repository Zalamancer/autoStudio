import { useCallback, useMemo } from 'react'

import { CustomSelect } from '@/components/ui'
import { PanelSlider } from '@/components/ui/panel-controls'
import type { BoilingLineSettings } from '@/types/boilingLine'
import { BOILING_LINE_PRESETS } from '@/types/boilingLine'

interface BoilingLineSectionProps {
  settings: BoilingLineSettings | undefined
  onChange: (settings: BoilingLineSettings | undefined) => void
}

const DETAIL_OPTIONS: BoilingLineSettings['detail'][] = ['low', 'medium', 'high']
const DETAIL_LABELS: Record<BoilingLineSettings['detail'], string> = { low: 'Low', medium: 'Med', high: 'High' }

const DEFAULT_SETTINGS: BoilingLineSettings = {
  enabled: true,
  intensity: 4,
  detail: 'medium',
  frameHold: 2,
  roughenEdges: false,
  strokeJitter: 0,
}

const PRESET_OPTIONS = [
  { value: 'none', label: 'None' },
  ...BOILING_LINE_PRESETS.map((p, i) => ({ value: String(i), label: p.label })),
]

export function BoilingLineSection({ settings, onChange }: BoilingLineSectionProps) {
  const enabled = settings?.enabled ?? false
  const current = settings ?? DEFAULT_SETTINGS

  const update = useCallback(
    (patch: Partial<BoilingLineSettings>) => {
      onChange({ ...current, ...patch, enabled: true })
    },
    [current, onChange],
  )

  const activePresetValue = useMemo(() => {
    if (!enabled) return 'none'
    const idx = BOILING_LINE_PRESETS.findIndex(
      (p) =>
        current.intensity === p.settings.intensity &&
        current.detail === p.settings.detail &&
        current.frameHold === p.settings.frameHold &&
        (current.roughenEdges ?? false) === (p.settings.roughenEdges ?? false) &&
        (current.strokeJitter ?? 0) === (p.settings.strokeJitter ?? 0),
    )
    return idx >= 0 ? String(idx) : ''
  }, [enabled, current])

  const handlePresetChange = useCallback(
    (v: string) => {
      if (v === 'none') {
        onChange({ ...current, enabled: false })
      } else {
        const preset = BOILING_LINE_PRESETS[Number(v)]
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
          {/* Intensity */}
          <PanelSlider
            label="Intensity"
            value={current.intensity}
            onChange={(v) => update({ intensity: Math.round(Math.min(10, Math.max(1, v))) })}
            min={1}
            max={10}
            step={1}
            precision={0}
          />

          {/* Detail */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm w-20 shrink-0">Detail</span>
            <div className="flex-1 min-w-0 flex gap-1.5">
              {DETAIL_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => update({ detail: d })}
                  className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${
                    current.detail === d
                      ? 'bg-accent text-white'
                      : 'bg-panel-surface text-gray-400 hover:bg-panel-surface-hover hover:text-white'
                  }`}
                >
                  {DETAIL_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Frame Hold */}
          <PanelSlider
            label="Frame Hold"
            value={current.frameHold}
            onChange={(v) => update({ frameHold: Math.round(Math.min(4, Math.max(1, v))) })}
            min={1}
            max={4}
            step={1}
            precision={0}
          />

          {/* Roughen Edges */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm w-20 shrink-0">Roughen</span>
            <div className="flex-1 min-w-0 flex gap-1.5">
              {([true, false] as const).map((v) => (
                <button
                  key={String(v)}
                  onClick={() => update({ roughenEdges: v })}
                  className={`flex-1 py-1.5 text-sm rounded-lg transition-colors ${
                    current.roughenEdges === v
                      ? 'bg-accent text-white'
                      : 'bg-panel-surface text-gray-400 hover:bg-panel-surface-hover hover:text-white'
                  }`}
                >
                  {v ? 'Yes' : 'No'}
                </button>
              ))}
            </div>
          </div>

          {/* Stroke Jitter */}
          <PanelSlider
            label="Jitter"
            value={current.strokeJitter ?? 0}
            onChange={(v) => update({ strokeJitter: Math.round(Math.min(10, Math.max(0, v))) })}
            min={0}
            max={10}
            step={1}
            precision={0}
          />
        </div>
      )}
    </div>
  )
}
