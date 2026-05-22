import { describe, it, expect } from 'vitest'
import { validateMotionDesignDescription } from '../motionDesignValidator'

describe('validateMotionDesignDescription', () => {
  const validDescription = {
    name: 'Test Template',
    description: 'A test',
    background: '#000',
    configSchema: [],
    defaultConfig: {},
    enterDuration: 0.2,
    exitDuration: 0.2,
    elements: [
      { id: 'el-1', type: 'text', text: 'Hello', style: { color: '#fff' } },
    ],
  }

  it('accepts a valid description', () => {
    const result = validateMotionDesignDescription(validDescription)
    expect(result.valid).toBe(true)
  })

  it('rejects when element count exceeds 200', () => {
    const tooMany = {
      ...validDescription,
      elements: Array.from({ length: 201 }, (_, i) => ({
        id: `el-${i}`, type: 'text', text: 'x',
      })),
    }
    const result = validateMotionDesignDescription(tooMany)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('element count')
  })

  it('rejects nesting depth > 10', () => {
    let nested: any = { id: 'leaf', type: 'text', text: 'x' }
    for (let i = 0; i < 11; i++) {
      nested = { id: `g-${i}`, type: 'group', children: [nested] }
    }
    const deep = { ...validDescription, elements: [nested] }
    const result = validateMotionDesignDescription(deep)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('nesting depth')
  })

  it('strips dangerous style values', () => {
    const dangerous = {
      ...validDescription,
      elements: [{
        id: 'el-1', type: 'text', text: 'x',
        style: { background: 'expression(alert(1))', color: '#fff' },
      }],
    }
    const result = validateMotionDesignDescription(dangerous)
    expect(result.valid).toBe(true)
    expect(result.sanitized!.elements[0].style!.background).toBeUndefined()
    expect(result.sanitized!.elements[0].style!.color).toBe('#fff')
  })

  it('rejects payloads larger than 1MB when serialized', () => {
    const huge = {
      ...validDescription,
      elements: [{ id: 'el-1', type: 'text', text: 'x'.repeat(1_100_000) }],
    }
    const result = validateMotionDesignDescription(huge)
    expect(result.valid).toBe(false)
    expect(result.error).toContain('payload size')
  })
})
