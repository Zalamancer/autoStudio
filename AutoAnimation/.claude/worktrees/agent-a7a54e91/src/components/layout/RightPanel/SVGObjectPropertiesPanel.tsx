import { Palette, Trash2, RotateCcw, Eye, EyeOff } from 'lucide-react'
import { ColorPicker } from '@/components/ui'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { cn } from '@/lib/utils'
import { BlendModeSelector } from '@/components/ui/BlendModeSelector'
import type { BlendMode } from '@/types/blendModes'
import type { BlurType } from '@/types/blurEffect'
import { BLUR_PRESETS } from '@/services/effects/blurEffect'
import { PanelSelect, PanelSlider } from '@/components/ui/panel-controls'

/** Color palette matching the SVGObjectTrack for header dot consistency */
const SVG_OBJECT_COLORS = [
  '#a78bfa', '#60a5fa', '#34d399', '#fbbf24',
  '#f472b6', '#fb923c', '#22d3ee', '#c084fc',
]

export function SVGObjectPropertiesPanel() {
  const composition = useSVGObjectStore((s) => s.composition)
  const selectedObjectId = useSVGObjectStore((s) => s.selectedObjectId)
  const setObjectColor = useSVGObjectStore((s) => s.setObjectColor)
  const resetObjectColors = useSVGObjectStore((s) => s.resetObjectColors)
  const toggleObjectVisibility = useSVGObjectStore((s) => s.toggleObjectVisibility)
  const setObjectOpacity = useSVGObjectStore((s) => s.setObjectOpacity)
  const setObjectZIndex = useSVGObjectStore((s) => s.setObjectZIndex)
  const updateObject = useSVGObjectStore((s) => s.updateObject)
  const removeObject = useSVGObjectStore((s) => s.removeObject)
  const selectObject = useSVGObjectStore((s) => s.selectObject)

  if (!composition || composition.objects.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Palette size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No SVG composition</p>
        <p className="text-[10px] mt-1">Use "Generate Editable" in the AI Animation panel</p>
      </div>
    )
  }

  const obj = composition.objects.find((o) => o.id === selectedObjectId)

  if (!obj) {
    return (
      <div className="p-4 space-y-3">
        <div className="text-center text-zinc-500 mb-3">
          <Palette size={20} className="mx-auto mb-1.5 opacity-50" />
          <p className="text-xs">Select an object</p>
          <p className="text-[10px] mt-0.5">Click a track in the timeline to edit</p>
        </div>

        {/* Object List */}
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Objects</span>
          {composition.objects.map((o, index) => {
            const dotColor = SVG_OBJECT_COLORS[index % SVG_OBJECT_COLORS.length]
            return (
              <button
                key={o.id}
                onClick={() => selectObject(o.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-zinc-900/50 hover:bg-zinc-800 transition-colors text-left"
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: dotColor }}
                />
                <span className={cn('text-xs truncate', o.visible ? 'text-zinc-300' : 'text-zinc-600')}>
                  {o.name}
                </span>
                {!o.visible && <span className="text-[8px] text-zinc-600 ml-auto">hidden</span>}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  const objIndex = composition.objects.findIndex((o) => o.id === obj.id)
  const dotColor = SVG_OBJECT_COLORS[objIndex % SVG_OBJECT_COLORS.length]
  const colorEntries = Object.entries(obj.colors)

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: dotColor }}
        />
        <span className="text-sm font-medium text-zinc-200 truncate">{obj.name}</span>
      </div>

      {/* Color Pickers */}
      {colorEntries.length > 0 && (
        <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50">
            <div className="flex items-center gap-2">
              <Palette size={12} className="text-zinc-400" />
              <span className="text-xs text-zinc-300">Colors</span>
            </div>
            <button
              onClick={() => resetObjectColors(obj.id)}
              className="p-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
              title="Reset all colors to defaults"
            >
              <RotateCcw size={10} />
            </button>
          </div>

          <div className="p-3 space-y-2.5 bg-zinc-900/30">
            {colorEntries.map(([key, value]) => {
              const isModified = value !== obj.defaultColors[key]
              return (
                <div key={key} className="flex items-center gap-2">
                  <ColorPicker color={value} onChange={(c) => setObjectColor(obj.id, key, c)} />
                  {/* Label */}
                  <span className={cn(
                    'text-xs flex-1 truncate',
                    isModified ? 'text-zinc-200' : 'text-zinc-400'
                  )}>
                    {key}
                  </span>
                  {/* Hex value */}
                  <span className="text-[10px] text-zinc-500 font-mono">{value}</span>
                  {/* Reset single */}
                  {isModified && (
                    <button
                      onClick={() => setObjectColor(obj.id, key, obj.defaultColors[key])}
                      className="p-0.5 rounded text-zinc-600 hover:text-zinc-400 transition-colors"
                      title={`Reset to ${obj.defaultColors[key]}`}
                    >
                      <RotateCcw size={10} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Opacity + Z-Index + Visibility */}
      <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-zinc-800/50">
          <span className="text-xs text-zinc-300">Properties</span>
          <button
            onClick={() => toggleObjectVisibility(obj.id)}
            className={cn(
              'p-1 rounded transition-colors',
              obj.visible
                ? 'text-zinc-400 hover:text-zinc-200'
                : 'text-zinc-600 hover:text-zinc-400'
            )}
            title={obj.visible ? 'Hide' : 'Show'}
          >
            {obj.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>

        <div className={cn('p-3 space-y-3 bg-zinc-900/30', !obj.visible && 'opacity-50 pointer-events-none')}>
          {/* Opacity */}
          <PanelSlider
            label="Opacity"
            value={obj.opacity * 100}
            onChange={(v) => setObjectOpacity(obj.id, Math.min(1, Math.max(0, v / 100)))}
            min={0}
            max={100}
            step={1}
            precision={0}
            suffix="%"
          />

          {/* Z-Index */}
          <PanelSlider
            label="Z-Index"
            value={obj.zIndex}
            onChange={(v) => setObjectZIndex(obj.id, Math.round(v))}
            min={-100}
            max={100}
            step={1}
            precision={0}
          />

          {/* Blend Mode */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Blend Mode</span>
            <BlendModeSelector
              value={(obj.blendMode ?? 'source-over') as BlendMode}
              onChange={(mode) => updateObject(obj.id, { blendMode: mode } as any)}
            />
          </div>

          {/* Blur */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Blur</span>
            <PanelSlider
              label="Amount"
              value={obj.blur ?? 0}
              onChange={(v) => updateObject(obj.id, { blur: Math.max(0, v) } as any)}
              min={0}
              max={50}
              step={0.5}
              precision={1}
              suffix="px"
            />
            {(obj.blur ?? 0) > 0 && (
              <>
                <PanelSelect
                  value={obj.blurType ?? 'gaussian'}
                  onChange={(v) => updateObject(obj.id, { blurType: v as BlurType } as any)}
                  options={[
                    { value: 'gaussian', label: 'Gaussian' },
                    { value: 'motion', label: 'Motion' },
                    { value: 'tilt-shift', label: 'Tilt-Shift' },
                  ]}
                  fullWidth
                />
                <PanelSelect
                  value=""
                  onChange={(v) => {
                    const preset = BLUR_PRESETS.find((p) => p.label === v)
                    if (preset) {
                      updateObject(obj.id, {
                        blur: preset.blur,
                        blurType: preset.type,
                        motionBlurAngle: preset.angle ?? 0,
                      } as any)
                    }
                  }}
                  options={[
                    { value: '', label: 'Apply Preset...' },
                    ...BLUR_PRESETS.map((p) => ({ value: p.label, label: p.label })),
                  ]}
                  fullWidth
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={() => {
          removeObject(obj.id)
          selectObject(null)
        }}
        className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors"
        title="Remove this object"
      >
        <Trash2 size={12} />
        Remove Object
      </button>

      {/* Other Objects Quick Select */}
      {composition.objects.length > 1 && (
        <div className="space-y-1 pt-2 border-t border-zinc-700/50">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Other Objects</span>
          {composition.objects
            .filter((o) => o.id !== obj.id)
            .map((o, i) => {
              const oIdx = composition.objects.findIndex((x) => x.id === o.id)
              const oColor = SVG_OBJECT_COLORS[oIdx % SVG_OBJECT_COLORS.length]
              return (
                <button
                  key={o.id + i}
                  onClick={() => selectObject(o.id)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-zinc-900/50 hover:bg-zinc-800 transition-colors text-left"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: oColor }}
                  />
                  <span className={cn('text-xs truncate', o.visible ? 'text-zinc-300' : 'text-zinc-600')}>
                    {o.name}
                  </span>
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}
