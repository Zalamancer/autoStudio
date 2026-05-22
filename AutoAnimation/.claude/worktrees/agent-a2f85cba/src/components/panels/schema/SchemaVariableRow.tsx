import { useCallback, useRef } from 'react'
import type { SchemaVariable } from '@/types/projectSchema'
import { useProjectSchemaStore } from '@/stores/useProjectSchemaStore'
import { ColorPicker } from '@/components/ui'
import { PanelSlider } from '@/components/ui/panel-controls'
import { Trash2, Link } from 'lucide-react'
import { PanelSelect } from '@/components/ui/panel-controls'

interface Props {
  variable: SchemaVariable
  onEditBinding: (key: string) => void
}

export function SchemaVariableRow({ variable, onEditBinding }: Props) {
  const setVariable = useProjectSchemaStore((s) => s.setVariable)
  const removeVariable = useProjectSchemaStore((s) => s.removeVariable)
  const bindings = useProjectSchemaStore((s) =>
    s.schema?.bindings.filter((b) => b.variableKey === variable.key) ?? []
  )

  const handleChange = useCallback(
    (value: unknown) => {
      setVariable(variable.key, value)
    },
    [variable.key, setVariable]
  )

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 group hover:bg-white/[0.03] rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-zinc-400 truncate">{variable.label}</div>
        <div className="mt-0.5">
          <VariableEditor variable={variable} onChange={handleChange} />
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEditBinding(variable.key)}
          className="w-6 h-6 rounded flex items-center justify-center text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
          title={`${bindings.length} binding(s)`}
        >
          <Link size={12} />
        </button>
        <button
          onClick={() => removeVariable(variable.key)}
          className="w-6 h-6 rounded flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Remove variable"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}

function VariableEditor({ variable, onChange }: { variable: SchemaVariable; onChange: (v: unknown) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)

  switch (variable.type) {
    case 'text':
      return (
        <input
          ref={inputRef}
          type="text"
          value={(variable.value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-zinc-800 border border-white/10 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-green-500/50"
        />
      )

    case 'text-multiline':
      return (
        <textarea
          value={(variable.value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="w-full bg-zinc-800 border border-white/10 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-green-500/50 resize-y"
        />
      )

    case 'number':
      return (
        <PanelSlider
          label=""
          value={(variable.value as number) || 0}
          onChange={onChange as (v: number) => void}
          min={variable.validation?.min ?? -9999}
          max={variable.validation?.max ?? 9999}
          step={variable.validation?.step || 1}
          compact
        />
      )

    case 'color':
      return (
        <ColorPicker color={(variable.value as string) || '#ffffff'} onChange={(c) => onChange(c)} />
      )

    case 'boolean':
      return (
        <button
          onClick={() => onChange(!variable.value)}
          className={`w-8 h-4 rounded-full transition-colors relative ${
            variable.value ? 'bg-green-500' : 'bg-zinc-600'
          }`}
        >
          <div
            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
              variable.value ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      )

    case 'select':
      return (
        <PanelSelect
          value={(variable.value as string) || ''}
          onChange={(v) => onChange(v)}
          options={variable.options?.map((opt) => ({ value: opt.value, label: opt.label })) ?? []}
          fullWidth
        />
      )

    default:
      return (
        <input
          type="text"
          value={String(variable.value ?? '')}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-zinc-800 border border-white/10 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-green-500/50"
        />
      )
  }
}
