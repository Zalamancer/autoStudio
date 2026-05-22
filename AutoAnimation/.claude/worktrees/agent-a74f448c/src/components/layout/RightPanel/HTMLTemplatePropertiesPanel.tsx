import { useState, useMemo } from 'react'
import { Trash2, Code, Eye, EyeOff, Minus, Plus } from 'lucide-react'
import { ColorPicker } from '@/components/ui'
import { PanelSlider } from '@/components/ui/panel-controls'
import { useCanvasStore } from '@/stores'
import { useHTMLTemplateLayerStore, computeTemplateDimensions } from '@/stores/useHTMLTemplateLayerStore'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { cn } from '@/lib/utils'
import type { TemplateConfigProperty, ConfigPropertyType } from '@/services/templateConfigParser'

const TEMPLATE_AR_OPTIONS = ['canvas', '16:9', '9:16', '1:1', '4:3', '21:9'] as const
const TEMPLATE_AR_LABELS: Record<string, string> = {
  canvas: 'Canvas (Full)',
  '16:9': '16:9',
  '9:16': '9:16',
  '1:1': '1:1',
  '4:3': '4:3',
  '21:9': '21:9',
}

export function HTMLTemplatePropertiesPanel() {
  const selectedTemplateId = useHTMLTemplateLayerStore((s) => s.selectedTemplateId)
  const templates = useHTMLTemplateLayerStore((s) => s.templates)
  const updateTemplate = useHTMLTemplateLayerStore((s) => s.updateTemplate)
  const updateTemplateConfig = useHTMLTemplateLayerStore((s) => s.updateTemplateConfig)
  const removeTemplate = useHTMLTemplateLayerStore((s) => s.removeTemplate)
  const setSelectedTemplateId = useHTMLTemplateLayerStore((s) => s.setSelectedTemplateId)

  // Canvas dimensions for computing template display size
  const canvasWidth = useCanvasStore((s) => s.canvasWidth)
  const canvasHeight = useCanvasStore((s) => s.canvasHeight)

  // Subscribe to live transform for real-time updates during canvas manipulation
  const liveTransform = useLiveTransformStore((s) => s.active)

  const tpl = templates.find((t) => t.id === selectedTemplateId)

  // Group customConfig properties by group — must be above early return to preserve hook order
  const groupedConfig = useMemo(() => {
    if (!tpl) return {} as Record<string, TemplateConfigProperty[]>
    const groups: Record<string, TemplateConfigProperty[]> = {}
    for (const prop of tpl.customConfig) {
      if (!groups[prop.group]) groups[prop.group] = []
      groups[prop.group].push(prop)
    }
    return groups
  }, [tpl?.customConfig])

  // Compute template dimensions for display info and position presets
  const dims = useMemo(() => {
    if (!tpl) return null
    return computeTemplateDimensions(tpl.templateAspectRatio, canvasWidth, canvasHeight, tpl.scale)
  }, [tpl?.templateAspectRatio, tpl?.scale, canvasWidth, canvasHeight])

  if (!tpl || !dims) {
    return (
      <div className="p-4 text-center text-zinc-500">
        <Code size={24} className="mx-auto mb-2 opacity-50" />
        <p className="text-xs">No template selected</p>
        <p className="text-[10px] mt-1">Click a template on the canvas or timeline</p>
      </div>
    )
  }

  // Use live values when actively transforming on canvas
  const isLive = liveTransform?.type === 'html-template' && liveTransform.id === tpl.id
  const displayX = isLive ? Math.round(liveTransform.x ?? tpl.position.x) : Math.round(tpl.position.x)
  const displayY = isLive ? Math.round(liveTransform.y ?? tpl.position.y) : Math.round(tpl.position.y)
  const displayRotation = isLive ? (liveTransform.rotation ?? tpl.rotation) : tpl.rotation
  const displayScale = isLive ? (liveTransform.scale ?? tpl.scale) : tpl.scale

  const groupOrder = ['Text', 'Colors', 'Animation', 'Numbers', 'Data']
  const hasConfig = tpl.customConfig.length > 0

  const hasCustomAR = !!tpl.templateAspectRatio
  const activeAR = tpl.templateAspectRatio || 'canvas'

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-400" />
        <span className="text-sm font-medium text-zinc-200 truncate">{tpl.name}</span>
        <span className="text-[10px] text-zinc-600 ml-auto">🌐 HTML</span>
      </div>

      {/* Visibility */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateTemplate(tpl.id, { visible: !tpl.visible })}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs bg-zinc-900/50 hover:bg-zinc-800 transition-colors"
        >
          {tpl.visible ? <Eye size={12} className="text-blue-400" /> : <EyeOff size={12} className="text-zinc-500" />}
          <span className={tpl.visible ? 'text-zinc-300' : 'text-zinc-500'}>{tpl.visible ? 'Visible' : 'Hidden'}</span>
        </button>
      </div>

      {/* Aspect Ratio */}
      <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-zinc-800/50">
          <span className="text-xs text-zinc-300">Aspect Ratio</span>
        </div>
        <div className="p-3 bg-zinc-900/30">
          <div className="flex flex-wrap gap-1">
            {TEMPLATE_AR_OPTIONS.map((ratio) => {
              const isActive = ratio === activeAR
              return (
                <button
                  key={ratio}
                  onClick={() => updateTemplate(tpl.id, {
                    templateAspectRatio: ratio === 'canvas' ? undefined : ratio,
                  })}
                  className={cn(
                    'px-2.5 py-1 text-[10px] font-medium rounded-full transition-all',
                    isActive
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                  )}
                >
                  {TEMPLATE_AR_LABELS[ratio]}
                </button>
              )
            })}
          </div>
          {hasCustomAR && (
            <>
              <p className="text-[9px] text-zinc-500 mt-2">
                Container: {Math.round(dims.displayWidth)} x {Math.round(dims.displayHeight)}px
                {' | '}
                Native: {dims.nativeWidth} x {dims.nativeHeight}px
              </p>
              {/* Quick position presets */}
              <div className="flex gap-1 mt-2">
                {(['Top', 'Center', 'Bottom'] as const).map((pos) => {
                  const yMap: Record<string, number> = {
                    Top: 0,
                    Center: (canvasHeight - dims.displayHeight) / 2,
                    Bottom: canvasHeight - dims.displayHeight,
                  }
                  return (
                    <button
                      key={pos}
                      onClick={() => updateTemplate(tpl.id, {
                        position: {
                          x: (canvasWidth - dims.displayWidth) / 2,
                          y: Math.max(0, yMap[pos]),
                        },
                      })}
                      className="flex-1 px-2 py-1 text-[9px] font-medium rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                    >
                      {pos}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dynamic Template Config Properties */}
      {hasConfig && groupOrder.map((group) => {
        const props = groupedConfig[group]
        if (!props || props.length === 0) return null
        return (
          <TemplateConfigGroup
            key={group}
            group={group}
            properties={props}
            templateId={tpl.id}
            updateConfig={updateTemplateConfig}
          />
        )
      })}

      {/* Transform */}
      <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
        <div className="px-3 py-2 bg-zinc-800/50">
          <span className="text-xs text-zinc-300">Transform</span>
        </div>
        <div className="p-3 space-y-0 bg-zinc-900/30">
          <PanelSlider label="X" value={displayX} onChange={(v) => updateTemplate(tpl.id, { position: { ...tpl.position, x: v } })} min={-2000} max={2000} step={1} precision={0} compact />
          <PanelSlider label="Y" value={displayY} onChange={(v) => updateTemplate(tpl.id, { position: { ...tpl.position, y: v } })} min={-2000} max={2000} step={1} precision={0} compact />
          <PanelSlider label="Scale" value={Math.round(displayScale * 100)} onChange={(v) => updateTemplate(tpl.id, { scale: Math.min(3, Math.max(0.01, v / 100)) })} min={1} max={300} step={1} suffix="%" precision={0} />
          <PanelSlider label="Rotation" value={displayRotation} onChange={(v) => updateTemplate(tpl.id, { rotation: Math.round(v) })} min={-360} max={360} step={1} suffix="°" precision={0} />
          <PanelSlider label="Opacity" value={tpl.opacity * 100} onChange={(v) => updateTemplate(tpl.id, { opacity: Math.min(1, Math.max(0, v / 100)) })} min={0} max={100} step={1} suffix="%" precision={0} />
          <PanelSlider label="Z-Index" value={tpl.zIndex} onChange={(v) => updateTemplate(tpl.id, { zIndex: Math.round(v) })} min={-100} max={100} step={1} precision={0} />
        </div>
      </div>

      {/* Remove */}
      <button onClick={() => { removeTemplate(tpl.id); setSelectedTemplateId(null) }} className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs bg-red-600/10 text-red-400 hover:bg-red-600/20 transition-colors">
        <Trash2 size={12} /> Remove from Canvas
      </button>

      {/* Other Templates */}
      {templates.length > 1 && (
        <div className="space-y-1 pt-2 border-t border-zinc-700/50">
          <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Other Templates</span>
          {templates.filter((t) => t.id !== tpl.id).map((t) => (
            <button key={t.id} onClick={() => setSelectedTemplateId(t.id)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md bg-zinc-900/50 hover:bg-zinc-800 transition-colors text-left">
              <Code size={10} className="text-blue-400 flex-shrink-0" />
              <span className="text-xs text-zinc-300 truncate">{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Template Config Group — renders a group of config properties (Text, Colors, etc.)
// ---------------------------------------------------------------------------

function TemplateConfigGroup({
  group,
  properties,
  templateId,
  updateConfig,
}: {
  group: string
  properties: TemplateConfigProperty[]
  templateId: string
  updateConfig: (id: string, key: string, value: unknown) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  const groupColors: Record<string, string> = {
    Text: 'text-emerald-400',
    Colors: 'text-pink-400',
    Animation: 'text-amber-400',
    Numbers: 'text-sky-400',
    Data: 'text-violet-400',
  }

  return (
    <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full px-3 py-2 bg-zinc-800/50 flex items-center gap-2 hover:bg-zinc-800 transition-colors"
      >
        <span className={cn('text-xs font-medium', groupColors[group] || 'text-zinc-300')}>{group}</span>
        <span className="text-[10px] text-zinc-600 ml-auto">{properties.length}</span>
        <span className="text-zinc-500 text-[10px]">{collapsed ? '\u25B8' : '\u25BE'}</span>
      </button>
      {!collapsed && (
        <div className="p-3 space-y-2.5 bg-zinc-900/30">
          {properties.map((prop) => (
            <TemplateConfigControl
              key={prop.key}
              prop={prop}
              onChange={(value) => updateConfig(templateId, prop.key, value)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Template Config Control — renders the right input for a single config property
// ---------------------------------------------------------------------------

function TemplateConfigControl({
  prop,
  onChange,
}: {
  prop: TemplateConfigProperty
  onChange: (value: unknown) => void
}) {
  const type: ConfigPropertyType = prop.type

  if (type === 'text') {
    return (
      <div>
        <label className="text-[10px] text-zinc-500 block mb-1">{prop.label}</label>
        <input
          type="text"
          value={String(prop.value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1.5 rounded-md text-xs bg-zinc-800 border border-zinc-700/50 text-zinc-200 focus:outline-none focus:border-blue-500/50"
        />
      </div>
    )
  }

  if (type === 'color') {
    const colorVal = String(prop.value ?? '#000000')
    const hexVal = colorVal.startsWith('#') ? colorVal.slice(0, 7) : '#000000'
    return (
      <div className="flex items-center gap-2">
        <ColorPicker color={hexVal} onChange={(c) => onChange(c)} />
        <span className="text-[10px] text-zinc-500">{prop.label}</span>
      </div>
    )
  }

  if (type === 'number') {
    const numVal = typeof prop.value === 'number' ? prop.value : 0
    return (
      <PanelSlider
        label={prop.label}
        value={numVal}
        onChange={(v) => onChange(v)}
        min={0}
        max={1000}
        step={numVal >= 100 ? 10 : numVal >= 1 ? 1 : 0.1}
        precision={numVal < 1 ? 2 : numVal < 100 ? 1 : 0}
      />
    )
  }

  if (type === 'boolean') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!!prop.value}
          onChange={() => onChange(!prop.value)}
          className="accent-blue-500 w-3 h-3"
        />
        <span className="text-xs text-zinc-400">{prop.label}</span>
      </label>
    )
  }

  if (type === 'text-array') {
    const arr = Array.isArray(prop.value) ? (prop.value as string[]) : []
    return (
      <div>
        <label className="text-[10px] text-zinc-500 block mb-1">{prop.label}</label>
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
                className="flex-1 px-2 py-1 rounded text-[10px] bg-zinc-800 border border-zinc-700/50 text-zinc-300 focus:outline-none focus:border-blue-500/50"
              />
              <button
                onClick={() => {
                  const newArr = arr.filter((_, idx) => idx !== i)
                  onChange(newArr)
                }}
                className="px-1.5 rounded text-zinc-500 hover:text-red-400 hover:bg-red-600/10 transition-colors"
                title="Remove"
              >
                <Minus size={10} />
              </button>
            </div>
          ))}
          <button
            onClick={() => onChange([...arr, ''])}
            className="w-full flex items-center justify-center gap-1 py-1 rounded text-[10px] text-zinc-500 hover:text-blue-400 hover:bg-blue-600/10 transition-colors border border-dashed border-zinc-700/50"
          >
            <Plus size={10} /> Add
          </button>
        </div>
      </div>
    )
  }

  // object-array / nested-colors fallback: JSON textarea
  if (type === 'object-array') {
    const jsonStr = typeof prop.value === 'string' ? prop.value : JSON.stringify(prop.value, null, 2)
    return (
      <div>
        <label className="text-[10px] text-zinc-500 block mb-1">{prop.label}</label>
        <textarea
          value={jsonStr}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value)
              onChange(parsed)
            } catch {
              // Don't update if invalid JSON — user is still typing
            }
          }}
          rows={Math.min(8, Math.max(3, String(jsonStr).split('\n').length))}
          className="w-full px-2 py-1.5 rounded-md text-[10px] bg-zinc-800 border border-zinc-700/50 text-zinc-300 focus:outline-none focus:border-blue-500/50 font-mono resize-y"
          spellCheck={false}
        />
      </div>
    )
  }

  return null
}
