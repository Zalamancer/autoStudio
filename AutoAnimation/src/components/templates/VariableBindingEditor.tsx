import { useState, useCallback } from 'react'
import { Plus, Trash2, Link } from 'lucide-react'
import type {
  TemplateVariable,
  TemplateBinding,
  BindingTransform,
} from '@/types/projectTemplate'

interface VariableBindingEditorProps {
  variables: TemplateVariable[]
  bindings: TemplateBinding[]
  onBindingsChange: (bindings: TemplateBinding[]) => void
  /** Available snapshot paths for the autocomplete dropdown */
  availablePaths?: string[]
}

export function VariableBindingEditor({
  variables,
  bindings,
  onBindingsChange,
  availablePaths = [],
}: VariableBindingEditorProps) {
  const [expandedVarKey, setExpandedVarKey] = useState<string | null>(null)

  const getBindingsForVariable = useCallback(
    (variableKey: string) => bindings.filter((b) => b.variableKey === variableKey),
    [bindings],
  )

  const handleAddBinding = useCallback(
    (variableKey: string) => {
      onBindingsChange([
        ...bindings,
        {
          variableKey,
          snapshotPath: '',
          transform: 'direct',
        },
      ])
    },
    [bindings, onBindingsChange],
  )

  const handleUpdateBinding = useCallback(
    (index: number, updates: Partial<TemplateBinding>) => {
      const updated = [...bindings]
      updated[index] = { ...updated[index], ...updates }
      onBindingsChange(updated)
    },
    [bindings, onBindingsChange],
  )

  const handleRemoveBinding = useCallback(
    (index: number) => {
      onBindingsChange(bindings.filter((_, i) => i !== index))
    },
    [bindings, onBindingsChange],
  )

  if (variables.length === 0) {
    return (
      <div className="text-xs text-gray-600 py-4 text-center">
        No variables defined. Add variables first.
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Variable Bindings
      </h4>
      <p className="text-[11px] text-gray-600">
        Map each variable to one or more snapshot paths. When a user fills in a variable value,
        it will be applied to all bound paths.
      </p>

      <div className="space-y-1.5">
        {variables.map((variable) => {
          const varBindings = getBindingsForVariable(variable.key)
          const isExpanded = expandedVarKey === variable.key

          return (
            <div
              key={variable.key}
              className="rounded-md border border-panel-border bg-panel-surface overflow-hidden"
            >
              {/* Variable header */}
              <button
                onClick={() => setExpandedVarKey(isExpanded ? null : variable.key)}
                className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-[#333] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Link size={12} className="text-gray-500" />
                  <span className="text-xs font-medium text-white">{variable.label}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#1a1a1a] text-gray-500 capitalize">
                    {variable.type}
                  </span>
                </div>
                <span className="text-[10px] text-gray-600">
                  {varBindings.length} binding{varBindings.length !== 1 ? 's' : ''}
                </span>
              </button>

              {/* Expanded bindings list */}
              {isExpanded && (
                <div className="border-t border-panel-border px-3 py-2 space-y-2">
                  {varBindings.map((binding) => {
                    const globalIndex = bindings.indexOf(binding)
                    return (
                      <div key={globalIndex} className="flex items-center gap-2">
                        {/* Path input with datalist */}
                        <input
                          type="text"
                          value={binding.snapshotPath}
                          onChange={(e) =>
                            handleUpdateBinding(globalIndex, {
                              snapshotPath: e.target.value,
                            })
                          }
                          list={`paths-${variable.key}`}
                          placeholder="snapshot.path.here"
                          className="flex-1 px-2 py-1 text-xs bg-[#1a1a1a] border border-panel-border rounded text-white font-mono focus:border-blue-500 focus:outline-none"
                        />

                        {/* Transform selector */}
                        <select
                          value={binding.transform}
                          onChange={(e) =>
                            handleUpdateBinding(globalIndex, {
                              transform: e.target.value as BindingTransform,
                            })
                          }
                          className="px-2 py-1 text-xs bg-[#1a1a1a] border border-panel-border rounded text-white"
                        >
                          <option value="direct">Direct</option>
                          <option value="character-swap">Character Swap</option>
                          <option value="voice-regenerate">Voice Regen</option>
                          <option value="image-upload">Image Upload</option>
                        </select>

                        {/* Remove binding */}
                        <button
                          onClick={() => handleRemoveBinding(globalIndex)}
                          className="p-1 text-gray-500 hover:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )
                  })}

                  {/* Datalist for path autocomplete */}
                  {availablePaths.length > 0 && (
                    <datalist id={`paths-${variable.key}`}>
                      {availablePaths.slice(0, 200).map((path) => (
                        <option key={path} value={path} />
                      ))}
                    </datalist>
                  )}

                  {/* Add binding button */}
                  <button
                    onClick={() => handleAddBinding(variable.key)}
                    className="flex items-center gap-1 px-2 py-1 text-[11px] text-blue-400 hover:text-blue-300 rounded hover:bg-blue-500/10"
                  >
                    <Plus size={10} />
                    Add Binding
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
