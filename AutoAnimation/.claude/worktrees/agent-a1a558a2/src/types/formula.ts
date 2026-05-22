/** A record mapping variable names to their numeric values */
export type FormulaContext = Record<string, number>

/** Describes a formula variable for autocomplete UI */
export interface FormulaVariable {
  /** Variable name used in expressions (e.g., 'width', 'fps') */
  name: string
  /** Current numeric value */
  value: number
  /** Human-readable description */
  description: string
  /** Category for grouping in autocomplete */
  category: 'canvas' | 'playback' | 'timeline' | 'constant' | 'function'
}

/** Result of evaluating a formula expression */
export interface FormulaResult {
  /** Computed numeric value (0 if error) */
  value: number
  /** Error message if evaluation failed */
  error: string | null
  /** Warning messages (e.g., division by zero fell back to 0) */
  warnings: string[]
}

/** A value that can optionally be driven by a formula */
export interface FormulaValue {
  /** Formula string, or null if raw number (no formula) */
  formula: string | null
  /** Computed or directly set numeric value */
  value: number
}
