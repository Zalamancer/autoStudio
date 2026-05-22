import { useState, useMemo } from 'react'
import { Trash2, Sparkles, Minus, Plus, ChevronDown } from 'lucide-react'
import { ColorPicker } from '@/components/ui'
import { useMotionGraphicStore } from '@/stores/useMotionGraphicStore'
import { getMotionGraphic } from '@/motionGraphics'
import { cn } from '@/lib/utils'
import { PanelSelect, PanelSlider } from '@/components/ui/panel-controls'
import type { FieldDescriptor } from '@/types/motionGraphic'

export function MotionGraphicPropertiesPanel() {
  const selectedInstanceId = useMotionGraphicStore((s) => s.selectedInstanceId)
  const instances = useMotionGraphicStore((s) => s.instances)
  const updateInstance = useMotionGraphicStore((s) => s.updateInstance)
  const updateConfig = useMotionGraphicStore((s) => s.updateConfig)
  const removeInstance = useMotionGraphicStore((s) => s.removeInstance)
  const setSelectedInstanceId = useMotionGraphicStore((s) => s.setSelectedInstanceId)

  const inst = instances.find((i) => i.id === selectedInstanceId)
  const registration = inst ? getMotionGraphic(inst.templateId) : undefined

  // Group config schema by group
  const groupedSchema = useMemo(() => {
    if (!registration) return {} as Record<string, FieldDescriptor[]>
    const groups: Record<string, FieldDescriptor[]> = {}
    for (const field of registration.configSchema) {
      if (!groups[field.group]) groups[field.group] = []
      groups[field.group].push(field)
    }
    return groups
  }, [registration])

  if (!inst) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Sparkles size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No motion graphic selected</p>
        <p className="text-[10px] mt-1">Click a motion graphic on the canvas or timeline</p>
      </div>
    )
  }

  const label = inst.name || registration?.title || inst.templateId
  const groupOrder = ['Text', 'Colors', 'Animation', 'Numbers']
  const hasConfig = registration && registration.configSchema.length > 0

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#4a7eff]" />
          <span className="text-sm font-medium text-zinc-200 truncate">{label}</span>
          <span className="text-[10px] text-zinc-600 ml-auto">React</span>
        </div>

        {/* Visibility */}
        <div className="flex items-center gap-3">
          <span className="text-gray-400 text-sm w-20 shrink-0">Visible</span>
          <button
            onClick={() => updateInstance(inst.id, { visible: !inst.visible })}
            className={cn(
              'relative w-10 h-6 rounded-full transition-colors',
              inst.visible ? 'bg-[#4a7eff]' : 'bg-[#3a3a3a]',
            )}
          >
            <span
              className={cn(
                'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
                inst.visible && 'translate-x-4',
              )}
            />
          </button>
        </div>
      </div>

      {/* ── Dynamic Config Properties ──────────────────────────── */}
      {hasConfig &&
        groupOrder.map((group) => {
          const fields = groupedSchema[group]
          if (!fields || fields.length === 0) return null
          return (
            <div key={group} className="p-4 border-b border-white/5">
              <ConfigGroup
                group={group}
                fields={fields}
                config={inst.config}
                onUpdate={(key, value) => updateConfig(inst.id, key, value)}
              />
            </div>
          )
        })}

      {/* ── Transform ──────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Transform</h2>
        <div className="space-y-0">
          <PanelSlider
            label="X"
            value={Math.round(inst.position.x)}
            onChange={(v) => updateInstance(inst.id, { position: { ...inst.position, x: v } })}
            min={-2000}
            max={2000}
            step={1}
            precision={0}
            compact
          />
          <PanelSlider
            label="Y"
            value={Math.round(inst.position.y)}
            onChange={(v) => updateInstance(inst.id, { position: { ...inst.position, y: v } })}
            min={-2000}
            max={2000}
            step={1}
            precision={0}
            compact
          />
          <PanelSlider
            label="Scale"
            value={Math.round(inst.scale * 100)}
            onChange={(v) => updateInstance(inst.id, { scale: Math.min(3, Math.max(0.01, v / 100)) })}
            min={1}
            max={300}
            step={1}
            suffix="%"
            precision={0}
          />
          <PanelSlider
            label="Rotation"
            value={inst.rotation}
            onChange={(v) => updateInstance(inst.id, { rotation: Math.round(v) })}
            min={-360}
            max={360}
            step={1}
            suffix="°"
            precision={0}
          />
          <PanelSlider
            label="Opacity"
            value={inst.opacity * 100}
            onChange={(v) => updateInstance(inst.id, { opacity: Math.min(1, Math.max(0, v / 100)) })}
            min={0}
            max={100}
            step={1}
            suffix="%"
            precision={0}
          />
          <PanelSlider
            label="Z-Index"
            value={inst.zIndex}
            onChange={(v) => updateInstance(inst.id, { zIndex: Math.round(v) })}
            min={-100}
            max={100}
            step={1}
            precision={0}
          />
        </div>
      </div>

      {/* ── Time Range ─────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <h2 className="text-white text-base font-semibold mb-4">Time Range</h2>
        <div className="space-y-0">
          <PanelSlider
            label="Start"
            value={inst.startFrame}
            onChange={(v) => updateInstance(inst.id, { startFrame: Math.max(0, Math.round(v)) })}
            min={0}
            max={9999}
            step={1}
            precision={0}
            suffix="f"
          />
          <PanelSlider
            label="End"
            value={inst.endFrame}
            onChange={(v) => updateInstance(inst.id, { endFrame: Math.max(inst.startFrame + 1, Math.round(v)) })}
            min={1}
            max={9999}
            step={1}
            precision={0}
            suffix="f"
          />
        </div>
      </div>

      {/* ── Actions ────────────────────────────────────────────── */}
      <div className="p-4 border-b border-white/5">
        <button
          onClick={() => {
            removeInstance(inst.id)
            setSelectedInstanceId(null)
          }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors"
        >
          <Trash2 size={14} /> Remove from Canvas
        </button>
      </div>

      {/* ── Other Instances ────────────────────────────────────── */}
      {instances.length > 1 && (
        <div className="p-4">
          <h4 className="text-xs font-medium text-zinc-400 tracking-wider uppercase mb-3">Other Motion Graphics</h4>
          <div className="space-y-1">
            {instances
              .filter((i) => i.id !== inst.id)
              .map((i) => {
                const reg = getMotionGraphic(i.templateId)
                return (
                  <button
                    key={i.id}
                    onClick={() => setSelectedInstanceId(i.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors text-left border border-white/5"
                  >
                    <Sparkles size={10} className="text-[#4a7eff] flex-shrink-0" />
                    <span className="text-sm text-zinc-300 truncate">{i.name || reg?.title || i.templateId}</span>
                  </button>
                )
              })}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Config Group — renders a group of config fields
// ---------------------------------------------------------------------------

function ConfigGroup({
  group,
  fields,
  config,
  onUpdate,
}: {
  group: string
  fields: FieldDescriptor[]
  config: Record<string, unknown>
  onUpdate: (key: string, value: unknown) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div>
      <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center gap-2 mb-3">
        <h2 className="text-white text-base font-semibold">{group}</h2>
        <span className="text-[10px] text-zinc-600 ml-auto">{fields.length}</span>
        <ChevronDown size={14} className={cn('text-zinc-500 transition-transform', collapsed && '-rotate-90')} />
      </button>
      {!collapsed && (
        <div className="space-y-2.5">
          {fields.map((field) => (
            <ConfigControl
              key={field.key}
              field={field}
              value={config[field.key] ?? field.defaultValue}
              onChange={(value) => onUpdate(field.key, value)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Config Control — renders the right input for a single config field
// ---------------------------------------------------------------------------

function ConfigControl({
  field,
  value,
  onChange,
}: {
  field: FieldDescriptor
  value: unknown
  onChange: (value: unknown) => void
}) {
  if (field.type === 'text') {
    return (
      <div>
        <label className="text-gray-400 text-sm block mb-1">{field.label}</label>
        <input
          type="text"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg border border-white/5 focus:outline-none focus:ring-1 focus:ring-[#4a7eff]"
        />
      </div>
    )
  }

  if (field.type === 'color') {
    const colorVal = String(value ?? '#000000')
    const hexVal = colorVal.startsWith('#') ? colorVal.slice(0, 7) : '#000000'
    return (
      <div className="flex items-center gap-2">
        <ColorPicker color={hexVal} onChange={(c) => onChange(c)} />
        <span className="text-gray-400 text-sm">{field.label}</span>
      </div>
    )
  }

  if (field.type === 'number') {
    const numVal = typeof value === 'number' ? value : 0
    return (
      <PanelSlider
        label={field.label}
        value={numVal}
        onChange={(v) => onChange(v)}
        min={field.min ?? 0}
        max={field.max ?? 1000}
        step={numVal >= 100 ? 10 : numVal >= 1 ? 1 : 0.1}
        precision={numVal < 1 ? 2 : numVal < 100 ? 1 : 0}
      />
    )
  }

  if (field.type === 'boolean') {
    return (
      <div className="flex items-center gap-3">
        <span className="text-gray-400 text-sm w-20 shrink-0">{field.label}</span>
        <button
          onClick={() => onChange(!value)}
          className={cn('relative w-10 h-6 rounded-full transition-colors', value ? 'bg-[#4a7eff]' : 'bg-[#3a3a3a]')}
        >
          <span
            className={cn(
              'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
              !!value && 'translate-x-4',
            )}
          />
        </button>
      </div>
    )
  }

  if (field.type === 'text-array') {
    const arr = Array.isArray(value) ? (value as string[]) : []
    return (
      <div>
        <label className="text-gray-400 text-sm block mb-1">{field.label}</label>
        <div className="space-y-1">
          {arr.map((item, i) => (
            <div key={i} className="flex gap-1">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const newArr = [...arr]
                  newArr[i] = e.target.value
                  onChange(newArr)
                }}
                className="flex-1 bg-[#2a2a2a] text-white text-sm px-3 py-2 rounded-lg border border-white/5 focus:outline-none focus:ring-1 focus:ring-[#4a7eff]"
              />
              <button
                onClick={() => onChange(arr.filter((_, idx) => idx !== i))}
                className="px-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-600/10 transition-colors"
                title="Remove"
              >
                <Minus size={10} />
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange([...arr, ''])}
            className="w-full flex items-center justify-center gap-1 py-2 rounded-lg text-xs text-zinc-500 hover:text-[#4a7eff] hover:bg-[#4a7eff]/10 transition-colors border border-dashed border-white/5"
          >
            <Plus size={10} /> Add
          </button>
        </div>
      </div>
    )
  }

  if (field.type === 'select' && field.options) {
    return (
      <div>
        <label className="text-gray-400 text-sm block mb-1">{field.label}</label>
        <PanelSelect
          value={String(value ?? '')}
          onChange={onChange}
          options={field.options.map((opt) => ({ value: opt, label: opt }))}
          fullWidth
        />
      </div>
    )
  }

  return null
}
