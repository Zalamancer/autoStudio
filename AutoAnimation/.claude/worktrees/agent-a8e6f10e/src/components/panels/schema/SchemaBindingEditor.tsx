import { useState } from 'react'
import { useProjectSchemaStore } from '@/stores/useProjectSchemaStore'
import type { BindingTargetType } from '@/types/projectSchema'
import { X, Plus, Trash2 } from 'lucide-react'
import { PanelSelect } from '@/components/ui/panel-controls'

const TARGET_STORES: { value: BindingTargetType; label: string }[] = [
  { value: 'text-overlay', label: 'Text Overlay' },
  { value: 'shape', label: 'Shape' },
  { value: 'html-template', label: 'HTML Template' },
  { value: 'multi-character', label: 'Character' },
  { value: 'canvas', label: 'Canvas' },
  { value: 'editor', label: 'Editor' },
  { value: 'voice', label: 'Voice' },
  { value: 'animation', label: 'Animation' },
  { value: 'media', label: 'Media' },
  { value: 'video-layer', label: 'Video Layer' },
  { value: 'svg-object', label: 'SVG Object' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'playback', label: 'Playback' },
]

interface Props {
  variableKey: string
  onClose: () => void
}

export function SchemaBindingEditor({ variableKey, onClose }: Props) {
  const bindings = useProjectSchemaStore((s) =>
    s.schema?.bindings.filter((b) => b.variableKey === variableKey) ?? []
  )
  const addBinding = useProjectSchemaStore((s) => s.addBinding)
  const removeBinding = useProjectSchemaStore((s) => s.removeBinding)
  const variable = useProjectSchemaStore((s) =>
    s.schema?.variables.find((v) => v.key === variableKey)
  )

  const [newStore, setNewStore] = useState<BindingTargetType>('text-overlay')
  const [newEntityId, setNewEntityId] = useState('')
  const [newProperty, setNewProperty] = useState('')

  const handleAdd = () => {
    if (!newProperty) return
    addBinding({
      variableKey,
      mode: 'store-action',
      targetStore: newStore,
      entityId: newEntityId || undefined,
      property: newProperty,
      transform: 'direct',
    })
    setNewEntityId('')
    setNewProperty('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/10 rounded-xl shadow-2xl w-[420px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div>
            <div className="text-sm font-medium text-zinc-200">Edit Bindings</div>
            <div className="text-[11px] text-zinc-500 mt-0.5">{variable?.label || variableKey}</div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Existing bindings */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {bindings.length === 0 && (
            <div className="text-xs text-zinc-500 text-center py-4">No bindings yet</div>
          )}
          {bindings.map((binding, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-zinc-800/50 rounded-lg px-3 py-2 text-xs"
            >
              <div className="flex-1 min-w-0">
                <span className="text-green-400">{binding.targetStore}</span>
                {binding.entityId && <span className="text-zinc-500">.{binding.entityId.slice(0, 8)}</span>}
                <span className="text-zinc-300">.{binding.property}</span>
              </div>
              <button
                onClick={() => removeBinding(variableKey, index)}
                className="w-5 h-5 rounded flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={11} />
              </button>
            </div>
          ))}
        </div>

        {/* Add new binding */}
        <div className="border-t border-white/5 px-4 py-3 space-y-2">
          <div className="text-[11px] text-zinc-400 font-medium">Add binding</div>
          <div className="grid grid-cols-3 gap-2">
            <PanelSelect
              value={newStore}
              onChange={(v) => setNewStore(v as BindingTargetType)}
              options={TARGET_STORES}
            />
            <input
              type="text"
              placeholder="Entity ID"
              value={newEntityId}
              onChange={(e) => setNewEntityId(e.target.value)}
              className="col-span-1 bg-zinc-800 border border-white/10 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-green-500/50"
            />
            <input
              type="text"
              placeholder="Property"
              value={newProperty}
              onChange={(e) => setNewProperty(e.target.value)}
              className="col-span-1 bg-zinc-800 border border-white/10 rounded px-2 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-green-500/50"
            />
          </div>
          <button
            onClick={handleAdd}
            disabled={!newProperty}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
          >
            <Plus size={13} />
            Add Binding
          </button>
        </div>
      </div>
    </div>
  )
}
