import { describe, it, expect } from 'vitest'
import { lerp, interpolateProps, interpolateConfig } from '../interpolation'

describe('lerp', () => {
  it('interpolates between two numbers', () => {
    expect(lerp(0, 10, 0.5)).toBe(5)
    expect(lerp(0, 10, 0)).toBe(0)
    expect(lerp(0, 10, 1)).toBe(10)
  })
})

describe('interpolateProps', () => {
  it('interpolates partial props with defaults', () => {
    const result = interpolateProps({ opacity: 0 }, { opacity: 1 }, 0.5)
    expect(result.opacity).toBe(0.5)
    expect(result.x).toBe(0)
    expect(result.scale).toBe(1)
  })

  it('handles different keys in from and to', () => {
    const result = interpolateProps({ x: 10 }, { y: 20 }, 0.5)
    expect(result.x).toBe(5)
    expect(result.y).toBe(10)
  })
})

describe('interpolateConfig', () => {
  it('replaces {{key}} with config values', () => {
    expect(interpolateConfig('Hello {{name}}!', { name: 'World' })).toBe('Hello World!')
  })

  it('replaces missing keys with empty string', () => {
    expect(interpolateConfig('{{missing}}', {})).toBe('')
  })
})
