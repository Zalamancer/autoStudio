/**
 * FormulaInput — standalone formula input with autocomplete and preview.
 *
 * Shows available variables with current values, highlights syntax errors,
 * displays computed result in real-time. Can be embedded in DraggableNumberInput.
 */

import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import type { FormulaContext } from '@/types/formula'
import { evaluateFormula } from '@/services/formulaEngine'
import { FormulaAutocomplete } from './FormulaAutocomplete'

interface FormulaInputProps {
  /** Current formula string */
  formula: string
  /** Called when formula changes */
  onFormulaChange: (formula: string) => void
  /** Called when the formula is confirmed (blur or Enter) */
  onConfirm: (value: number, formula: string) => void
  /** Current formula context with variable values */
  context: FormulaContext
  /** CSS class name */
  className?: string
  /** Placeholder text */
  placeholder?: string
}

export function FormulaInput({
  formula,
  onFormulaChange,
  onConfirm,
  context,
  className,
  placeholder = 'Enter formula...',
}: FormulaInputProps) {
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Evaluate formula in real-time
  const result = evaluateFormula(formula, context)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onFormulaChange(value)
    setShowAutocomplete(value.length > 0)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      setShowAutocomplete(false)
      onConfirm(result.value, formula)
    } else if (e.key === 'Escape') {
      setShowAutocomplete(false)
    }
  }

  const handleBlur = () => {
    // Slight delay to allow autocomplete clicks
    setTimeout(() => {
      setShowAutocomplete(false)
      if (formula.trim()) {
        onConfirm(result.value, formula)
      }
    }, 150)
  }

  const handleAutocompleteSelect = useCallback((variable: string) => {
    // Replace the last partial word with the selected variable
    const parts = formula.split(/(\s+|[+\-*/()^%,])/)
    const lastPart = parts[parts.length - 1]

    if (lastPart && variable.toLowerCase().startsWith(lastPart.toLowerCase())) {
      parts[parts.length - 1] = variable
    } else {
      parts.push(variable)
    }

    const newFormula = parts.join('')
    onFormulaChange(newFormula)
    setShowAutocomplete(false)
    inputRef.current?.focus()
  }, [formula, onFormulaChange])

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  const hasError = result.error !== null && formula.trim().length > 0

  return (
    <div className={cn('relative', className)}>
      <input
        ref={inputRef}
        type="text"
        value={formula}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={cn(
          'w-full bg-transparent text-sm text-white outline-none font-mono',
          hasError && 'text-red-400'
        )}
      />

      {/* Result preview / error indicator */}
      {formula.trim().length > 0 && (
        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
          {hasError ? (
            <span className="text-[9px] text-red-400 bg-red-500/10 px-1 rounded" title={result.error || ''}>
              err
            </span>
          ) : (
            <span className="text-[9px] text-zinc-500 font-mono">
              = {result.value % 1 === 0 ? result.value : result.value.toFixed(2)}
            </span>
          )}
        </div>
      )}

      {/* Autocomplete dropdown */}
      <FormulaAutocomplete
        query={formula}
        context={context}
        onSelect={handleAutocompleteSelect}
        onClose={() => setShowAutocomplete(false)}
        visible={showAutocomplete}
      />
    </div>
  )
}
