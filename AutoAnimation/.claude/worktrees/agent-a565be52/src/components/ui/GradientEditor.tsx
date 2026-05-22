import React, { useCallback, useRef, useState } from 'react'
import type { GradientFill, GradientType, GradientColorStop } from '@/types/gradient'
import { GRADIENT_PRESETS } from '@/types/gradient'
import { Trash2 } from 'lucide-react'
import { PanelSlider } from '@/components/ui/panel-controls'

interface GradientEditorProps {
  value: GradientFill
  onChange: (fill: GradientFill) => void
}

const GRADIENT_TYPES: { value: GradientType; label: string }[] = [
  { value: 'linear', label: 'Linear' },
  { value: 'radial', label: 'Radial' },
  { value: 'conic', label: 'Conic' },
]

export const GradientEditor: React.FC<GradientEditorProps> = ({ value, onChange }) => {
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null)
  const barRef = useRef<HTMLDivElement>(null)

  const gradientCSS = buildCSSGradient(value)

  const handleStopDrag = useCallback(
    (e: React.MouseEvent, stopId: string) => {
      e.preventDefault()
      const bar = barRef.current
      if (!bar) return

      const onMove = (ev: MouseEvent) => {
        const rect = bar.getBoundingClientRect()
        const pos = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
        const newStops = value.stops.map((s) =>
          s.id === stopId ? { ...s, position: Math.round(pos * 100) / 100 } : s
        )
        newStops.sort((a, b) => a.position - b.position)
        onChange({ ...value, stops: newStops })
      }

      const onUp = () => {
        window.removeEventListener('mousemove', onMove)
        window.removeEventListener('mouseup', onUp)
      }

      window.addEventListener('mousemove', onMove)
      window.addEventListener('mouseup', onUp)
    },
    [value, onChange]
  )

  const handleRemoveStop = (stopId: string) => {
    if (value.stops.length <= 2) return
    const newStops = value.stops.filter((s) => s.id !== stopId)
    onChange({ ...value, stops: newStops })
    if (selectedStopId === stopId) setSelectedStopId(null)
  }

  const handleStopColorChange = (stopId: string, color: string) => {
    const newStops = value.stops.map((s) =>
      s.id === stopId ? { ...s, color } : s
    )
    onChange({ ...value, stops: newStops })
  }

  const selectedStop = value.stops.find((s) => s.id === selectedStopId)

  return (
    <div className="space-y-3">
      {/* Gradient type */}
      <div className="flex gap-1">
        {GRADIENT_TYPES.map((gt) => (
          <button
            key={gt.value}
            onClick={() => onChange({ ...value, type: gt.value })}
            className={`flex-1 px-2 py-1 rounded text-xs transition-colors ${
              value.type === gt.value
                ? 'bg-blue-500/30 text-blue-400 border border-blue-500/50'
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
            }`}
          >
            {gt.label}
          </button>
        ))}
      </div>

      {/* Gradient preview bar with stops */}
      <div className="relative">
        <div
          ref={barRef}
          className="h-8 rounded-lg border border-zinc-700 cursor-crosshair"
          style={{ background: gradientCSS }}
          onClick={(e) => {
            if ((e.target as HTMLElement).tagName !== 'DIV') return
            const rect = barRef.current?.getBoundingClientRect()
            if (!rect) return
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
            const newId = `s${Date.now()}`
            const newStop: GradientColorStop = { id: newId, color: '#ffffff', position: Math.round(pos * 100) / 100 }
            const newStops = [...value.stops, newStop].sort((a, b) => a.position - b.position)
            onChange({ ...value, stops: newStops })
            setSelectedStopId(newId)
          }}
        />
        {/* Stop markers */}
        {value.stops.map((stop) => (
          <div
            key={stop.id}
            className={`absolute top-full mt-0.5 w-3 h-3 -translate-x-1/2 cursor-grab border-2 rounded-sm ${
              selectedStopId === stop.id ? 'border-blue-400 ring-1 ring-blue-400/50' : 'border-zinc-400'
            }`}
            style={{
              left: `${stop.position * 100}%`,
              backgroundColor: stop.color,
            }}
            onMouseDown={(e) => {
              setSelectedStopId(stop.id)
              handleStopDrag(e, stop.id)
            }}
          />
        ))}
      </div>

      {/* Selected stop editor */}
      {selectedStop && (
        <div className="flex items-center gap-2 mt-4">
          <input
            type="color"
            value={selectedStop.color}
            onChange={(e) => handleStopColorChange(selectedStop.id, e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-zinc-600"
          />
          <div className="flex-1">
            <PanelSlider
              label="Pos"
              value={Math.round(selectedStop.position * 100)}
              onChange={(v) => {
                const pos = Math.max(0, Math.min(100, v)) / 100
                const newStops = value.stops.map((s) =>
                  s.id === selectedStop.id ? { ...s, position: pos } : s
                ).sort((a, b) => a.position - b.position)
                onChange({ ...value, stops: newStops })
              }}
              min={0}
              max={100}
              step={1}
              suffix="%"
              inline
            />
          </div>
          <button
            onClick={() => handleRemoveStop(selectedStop.id)}
            disabled={value.stops.length <= 2}
            className="p-1 rounded text-zinc-500 hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}

      {/* Angle control (linear) */}
      {value.type === 'linear' && (
        <PanelSlider
          label="Angle"
          value={value.angle}
          onChange={(v) => onChange({ ...value, angle: v })}
          min={0}
          max={360}
          step={1}
          suffix="deg"
          compact
        />
      )}

      {/* Center point (radial/conic) */}
      {(value.type === 'radial' || value.type === 'conic') && (
        <div className="space-y-1">
          <PanelSlider
            label="Center X"
            value={value.centerX}
            onChange={(v) => onChange({ ...value, centerX: v })}
            min={0}
            max={1}
            step={0.01}
            precision={0}
            compact
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
          <PanelSlider
            label="Center Y"
            value={value.centerY}
            onChange={(v) => onChange({ ...value, centerY: v })}
            min={0}
            max={1}
            step={0.01}
            precision={0}
            compact
            formatValue={(v) => `${Math.round(v * 100)}%`}
          />
        </div>
      )}

      {/* Radius (radial) */}
      {value.type === 'radial' && (
        <PanelSlider
          label="Radius"
          value={value.radius}
          onChange={(v) => onChange({ ...value, radius: v })}
          min={0.1}
          max={2}
          step={0.01}
          precision={0}
          compact
          formatValue={(v) => `${Math.round(v * 100)}%`}
        />
      )}

      {/* Presets */}
      <div>
        <span className="text-xs text-zinc-400 block mb-1.5">Presets</span>
        <div className="flex flex-wrap gap-1.5">
          {GRADIENT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => onChange({ ...preset.fill })}
              className="w-8 h-8 rounded border border-zinc-700 hover:border-blue-500/50 transition-colors"
              style={{ background: buildCSSGradient(preset.fill) }}
              title={preset.label}
            />
          ))}
        </div>
      </div>

      {/* Animate Rotation toggle */}
      {value.type === 'linear' && (
        <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
          <input
            type="checkbox"
            checked={value.animateAngle ?? false}
            onChange={(e) => onChange({ ...value, animateAngle: e.target.checked, animateSpeed: value.animateSpeed ?? 2 })}
            className="rounded border-zinc-600 bg-zinc-800"
          />
          Animate Rotation
        </label>
      )}
    </div>
  )
}

/** Build a CSS gradient string from a GradientFill for preview rendering */
function buildCSSGradient(fill: GradientFill): string {
  const stops = fill.stops.map((s) => `${s.color} ${s.position * 100}%`).join(', ')
  switch (fill.type) {
    case 'linear':
      return `linear-gradient(${fill.angle}deg, ${stops})`
    case 'radial':
      return `radial-gradient(circle at ${fill.centerX * 100}% ${fill.centerY * 100}%, ${stops})`
    case 'conic':
      return `conic-gradient(from ${fill.startAngle ?? 0}deg at ${fill.centerX * 100}% ${fill.centerY * 100}%, ${stops})`
  }
}
