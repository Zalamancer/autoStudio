/**
 * Type-safe JSON.parse wrapper with optional validation.
 * Returns `null` on parse failure instead of throwing.
 */

/**
 * Parse a JSON string and validate the result with an optional validator function.
 * Returns null on parse failure or validation failure.
 *
 * @example
 * ```ts
 * const data = safeJsonParse<MyType>(str, (val) => typeof val === 'object' && val !== null)
 * ```
 */
export function safeJsonParse<T>(
  str: string,
  validator?: (value: unknown) => value is T,
): T | null {
  try {
    const parsed = JSON.parse(str)
    if (validator && !validator(parsed)) return null
    return parsed as T
  } catch {
    return null
  }
}
