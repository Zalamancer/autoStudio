import { useState, useMemo } from 'react'
import type { SchemaVariable } from '@/types/projectSchema'
import { useProjectSchemaStore } from '@/stores/useProjectSchemaStore'
import { SchemaVariableRow } from './SchemaVariableRow'
import { SchemaBindingEditor } from './SchemaBindingEditor'
import { Wand2, Plus, RotateCcw, ChevronDown, ChevronRight, Search, Database } from 'lucide-react'

export function SchemaPanel() {
  const schema = useProjectSchemaStore((s) => s.schema)
  const initSchema = useProjectSchemaStore((s) => s.initSchema)
  const autoDetectVariables = useProjectSchemaStore((s) => s.autoDetectVariables)
  const reset = useProjectSchemaStore((s) => s.reset)

  const [editingBindingKey, setEditingBindingKey] = useState<string | null>(null)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  const q = search.toLowerCase().trim()

  // Group variables
  const groupedVariables = useMemo(() => {
    if (!schema) return new Map<string, SchemaVariable[]>()
    const groups = new Map<string, SchemaVariable[]>()
    for (const groupName of schema.groupOrder) {
      let vars = schema.variables.filter((v) => v.group === groupName).sort((a, b) => a.order - b.order)
      if (q) vars = vars.filter((v) => v.key.toLowerCase().includes(q) || v.label.toLowerCase().includes(q))
      if (vars.length > 0) {
        groups.set(groupName, vars)
      }
    }
    // Catch any variables in groups not in groupOrder
    for (const v of schema.variables) {
      if (!schema.groupOrder.includes(v.group)) {
        if (q && !v.key.toLowerCase().includes(q) && !v.label.toLowerCase().includes(q)) continue
        const existing = groups.get(v.group) || []
        existing.push(v)
        groups.set(v.group, existing)
      }
    }
    return groups
  }, [schema, q])

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  // Empty state — no schema initialized
  if (!schema) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
            <Wand2 size={24} className="text-accent" />
          </div>
          <h3 className="text-sm font-medium text-zinc-200 mb-1">Project Schema</h3>
          <p className="text-[11px] text-zinc-500 mb-6 leading-relaxed max-w-[220px]">
            Create a variable system for your project. Auto-detect variables from your current canvas or start from
            scratch.
          </p>
          <div className="space-y-2 w-full max-w-[200px]">
            <button
              onClick={() => {
                initSchema()
                autoDetectVariables()
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-[#5a8aff] text-white text-xs font-medium transition-colors"
            >
              <Wand2 size={14} />
              Auto-detect Variables
            </button>
            <button
              onClick={initSchema}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-panel-surface hover:bg-panel-surface-hover text-zinc-300 text-xs font-medium transition-colors border border-white/5"
            >
              <Plus size={14} />
              Start Empty
            </button>
          </div>
        </div>
      </div>
    )
  }

  const totalFiltered = Array.from(groupedVariables.values()).reduce((sum, vars) => sum + vars.length, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Search Bar ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search variables..."
            className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none"
          />
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="shrink-0 flex items-center gap-1.5 px-3 pb-2">
        <button
          onClick={autoDetectVariables}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-panel-surface hover:bg-panel-surface-hover text-zinc-300 text-[11px] font-medium transition-colors border border-white/5"
          title="Auto-detect new variables"
        >
          <Wand2 size={12} />
          Detect
        </button>
        <div className="flex-1" />
        <span className="text-[10px] text-zinc-500">{schema.variables.length} vars</span>
        <button
          onClick={reset}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Reset schema"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      {/* ── Variable list grouped ── */}
      <div className="flex-1 overflow-y-auto py-1">
        {totalFiltered === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Database size={28} className="mb-3" />
            <span className="text-sm text-gray-400">{q ? 'No variables found' : 'No variables yet'}</span>
            <span className="text-xs text-gray-600 mt-1">
              {q ? 'Try a different keyword' : 'Click "Detect" to scan your project'}
            </span>
          </div>
        )}
        {Array.from(groupedVariables.entries()).map(([groupName, variables]) => (
          <div key={groupName}>
            <button
              onClick={() => toggleGroup(groupName)}
              className="w-full flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              {collapsedGroups.has(groupName) ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
              {groupName}
              <span className="text-zinc-600 ml-auto">{variables.length}</span>
            </button>
            {!collapsedGroups.has(groupName) && (
              <div className="space-y-0.5 mb-2">
                {variables.map((variable) => (
                  <SchemaVariableRow key={variable.key} variable={variable} onEditBinding={setEditingBindingKey} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Binding editor modal */}
      {editingBindingKey && (
        <SchemaBindingEditor variableKey={editingBindingKey} onClose={() => setEditingBindingKey(null)} />
      )}
    </div>
  )
}
