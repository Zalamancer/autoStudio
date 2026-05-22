import { useState, useMemo } from 'react'
import { Trash2, Sparkles, Minus, Plus, ChevronDown, ChevronRight } from 'lucide-react'
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
      <div className="p-4 text-center text-zinc-500 text-sm">
        <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No motion graphic selected</p>
        <p className="text-xs mt-1">Click a motion graphic on the canvas to edit its properties</p>
      </div>
    )
  }

  const label = inst.name || registration?.title || inst.templateId
  const groupOrder = ['Text', 'Colors', 'Animation', 'Numbers']
  const hasConfig = registration && registration.configSchema.length > 0

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* ── Transform ── */}
      <div className="p-4 border-b border-white/5">
        <PanelSlider
          label="X"
          value={Math.round(inst.position.x)}
          onChange={(v) => updateInstance(inst.id, { position: { ...inst.position, x: v } })}
          min={-2000}
          max={2000}
          step={1}
          precision={0}
          suffix="px"
        />
        <PanelSlider
          label="Y"
          value={Math.round(inst.position.y)}
          onChange={(v) => updateInstance(inst.id, { position: { ...inst.position, y: v } })}
          min={-2000}
          max={2000}
          step={1}
          precision={0}
          suffix="px"
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
          value={Math.round(inst.opacity * 100)}
          onChange={(v) => updateInstance(inst.id, { opacity: Math.max(0, Math.min(100, v)) / 100 })}
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

        {/* Visible — matches PanelSlider row dimensions */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-gray-400 text-sm shrink-0 w-20">Visible</span>
          <div className="flex-1">
            <button
              onClick={() => updateInstance(inst.id, { visible: !inst.visible })}
              className={cn(
                'w-full px-3 py-2 rounded-lg text-sm transition-colors',
                inst.visible
                  ? 'bg-accent/10 text-accent'
                  : 'bg-panel-surface text-gray-500 hover:bg-panel-surface-hover',
              )}
            >
              {inst.visible ? 'Visible' : 'Hidden'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Dynamic Config Properties ── */}
      {hasConfig &&
        groupOrder.map((group) => {
          const fields = groupedSchema[group]
          if (!fields || fields.length === 0) return null
          return (
            <ConfigGroup
              key={group}
              group={group}
              fields={fields}
              config={inst.config}
              onUpdate={(key, value) => updateConfig(inst.id, key, value)}
            />
          )
        })}

      {/* ── Time Range ── */}
      <div className="p-4 border-b border-white/5">
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

      {/* ── Remove — sticky bottom ── */}
      <div className="mt-auto p-4 border-t border-white/5">
        <button
          onClick={() => {
            removeInstance(inst.id)
            setSelectedInstanceId(null)
          }}
          className="w-full py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
        >
          <Trash2 size={12} />
          Remove
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Config Group — Cinema collapsible section
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
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="border-b border-white/5">
      <div
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] cursor-pointer transition-colors"
      >
        {expanded ? (
          <ChevronDown size={14} className="text-zinc-500" />
        ) : (
          <ChevronRight size={14} className="text-zinc-500" />
        )}
        <span className="text-xs font-medium text-gray-200">{group}</span>
        <span className="text-[10px] text-zinc-600 ml-auto">{fields.length}</span>
      </div>
      {expanded && (
        <div className="px-4 py-2.5 space-y-2.5">
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
          className="w-full bg-panel-surface text-white text-sm px-3 py-2 rounded-lg border border-white/5 focus:outline-none focus:ring-1 focus:ring-accent"
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
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm w-20 shrink-0">{field.label}</span>
        <button
          onClick={() => onChange(!value)}
          className={cn(
            'text-xs px-3 py-1 rounded-md transition-colors',
            value ? 'bg-accent/10 text-accent' : 'bg-panel-surface text-gray-500',
          )}
        >
          {value ? 'On' : 'Off'}
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
                className="flex-1 bg-panel-surface text-white text-sm px-3 py-2 rounded-lg border border-white/5 focus:outline-none focus:ring-1 focus:ring-accent"
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
            className="w-full flex items-center justify-center gap-1 py-2 rounded-lg text-xs text-zinc-500 hover:text-accent hover:bg-accent/10 transition-colors border border-dashed border-white/5"
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
