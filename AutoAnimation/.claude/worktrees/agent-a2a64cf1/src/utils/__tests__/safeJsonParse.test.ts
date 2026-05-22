import { describe, it, expect } from 'vitest'
import { safeJsonParse } from '../safeJsonParse'

describe('safeJsonParse', () => {
  it('parses valid JSON', () => {
    expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 })
  })

  it('returns null for invalid JSON', () => {
    expect(safeJsonParse('not json')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(safeJsonParse('')).toBeNull()
  })

  it('passes validation for valid data', () => {
    const result = safeJsonParse<{ name: string }>(
      '{"name":"test"}',
      (val): val is { name: string } =>
        typeof val === 'object' && val !== null && 'name' in val
    )
    expect(result).toEqual({ name: 'test' })
  })

  it('returns null when validation fails', () => {
    const result = safeJsonParse<{ name: string }>(
      '{"age":5}',
      (val): val is { name: string } =>
        typeof val === 'object' && val !== null && 'name' in val
    )
    expect(result).toBeNull()
  })

  it('handles arrays', () => {
    expect(safeJsonParse('[1,2,3]')).toEqual([1, 2, 3])
  })

  it('handles primitives', () => {
    expect(safeJsonParse('"hello"')).toBe('hello')
    expect(safeJsonParse('42')).toBe(42)
    expect(safeJsonParse('true')).toBe(true)
    expect(safeJsonParse('null')).toBeNull()
  })
})
