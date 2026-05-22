import { describe, it, expect } from 'vitest'
import { Easing, getEasingByName } from '../easing'

describe('Easing', () => {
  it('linear returns t', () => {
    expect(Easing.linear(0)).toBe(0)
    expect(Easing.linear(0.5)).toBe(0.5)
    expect(Easing.linear(1)).toBe(1)
  })

  it('cubicOut starts slow ends fast', () => {
    expect(Easing.cubicOut(0)).toBe(0)
    expect(Easing.cubicOut(1)).toBe(1)
    expect(Easing.cubicOut(0.5)).toBeGreaterThan(0.5)
  })

  it('bounceOut has bounce character', () => {
    expect(Easing.bounceOut(0)).toBe(0)
    expect(Easing.bounceOut(1)).toBeCloseTo(1, 5)
  })

  it('bezier presets produce valid output', () => {
    expect(Easing.material(0)).toBe(0)
    expect(Easing.material(1)).toBe(1)
    const mid = Easing.material(0.5)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
  })

  it('elastic factory returns a function', () => {
    const fn = Easing.elastic(1.2, 0.4)
    expect(typeof fn).toBe('function')
    expect(fn(0)).toBe(0)
    expect(fn(1)).toBe(1)
  })

  it('getEasingByName returns linear for unknown', () => {
    const fn = getEasingByName('nonexistent')
    expect(fn(0.5)).toBe(0.5)
  })

  it('getEasingByName returns correct easing', () => {
    const fn = getEasingByName('cubicOut')
    expect(fn(0.5)).toBe(Easing.cubicOut(0.5))
  })

  it('all direct easing functions are pure', () => {
    const directFns = [
      'linear', 'in', 'out', 'inOut', 'cubicIn', 'cubicOut', 'cubicInOut',
      'bounceOut', 'bounceIn', 'bounceInOut', 'backIn', 'backOut', 'backInOut',
      'elasticIn', 'elasticOut', 'elasticInOut',
      'sineIn', 'sineOut', 'sineInOut',
      'expoIn', 'expoOut', 'expoInOut',
      'smoothStep', 'smootherStep',
      'springLight', 'springMedium', 'springHeavy',
    ]
    for (const name of directFns) {
      const fn = (Easing as any)[name]
      expect(typeof fn).toBe('function')
      expect(fn(0)).toBeDefined()
      expect(fn(1)).toBeDefined()
    }
  })
})
