/**
 * Formula Autocomplete Dropdown.
 *
 * Filters variables by typed prefix, shows variable name + current value.
 * Keyboard navigable (up/down/enter/escape).
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type { FormulaContext } from '@/types/formula'
import { getAvailableVariables } from '@/services/formulaEngine'

interface FormulaAutocompleteProps {
  /** Current input text to match against */
  query: string
  /** Current formula context with variable values */
  context: FormulaContext
  /** Called when a variable is selected */
  onSelect: (variable: string) => void
  /** Called when dropdown should close */
  onClose: () => void
  /** Whether the dropdown is visible */
  visible: boolean
}

export function FormulaAutocomplete({
  query,
  context,
  onSelect,
  onClose,
  visible,
}: FormulaAutocompleteProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const allVariables = getAvailableVariables()

  // Extract the last word being typed (after operators/spaces)
  const lastWord = query.split(/[\s+\-*/()^%,]/).pop()?.toLowerCase() || ''

  // Filter to matching variables
  const filtered = lastWord.length > 0
    ? allVariables.filter((v) => v.name.toLowerCase().startsWith(lastWord))
    : []

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!visible || filtered.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      if (filtered[selectedIndex]) {
        e.preventDefault()
        onSelect(filtered[selectedIndex].name)
      }
    } else if (e.key === 'Escape') {
      onClose()
    }
  }, [visible, filtered, selectedIndex, onSelect, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  if (!visible || filtered.length === 0) return null

  return (
    <div
      ref={listRef}
      className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-white/10 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto"
    >
      {filtered.map((variable, index) => {
        const value = context[variable.name]
        return (
          <button
            key={variable.name}
            className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors ${
              index === selectedIndex
                ? 'bg-[#4a7eff]/20 text-white'
                : 'text-zinc-300 hover:bg-white/5'
            }`}
            onMouseDown={(e) => {
              e.preventDefault()
              onSelect(variable.name)
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-mono text-blue-400 shrink-0">{variable.name}</span>
              <span className="text-[10px] text-zinc-500 truncate">{variable.description}</span>
            </div>
            {value !== undefined && (
              <span className="text-[10px] text-zinc-400 font-mono ml-2 shrink-0">
                {typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 2) : String(value)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
