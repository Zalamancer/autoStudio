import { lerp, lerpAngle, applyEasing, interpolatePropertyKeyframes } from '../interpolation'
import type { PropertyKeyframe } from '@/types/keyframes'

describe('lerp', () => {
  it('returns a when t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10)
  })

  it('returns b when t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20)
  })

  it('returns midpoint when t=0.5', () => {
    expect(lerp(0, 100, 0.5)).toBe(50)
  })

  it('handles negative values', () => {
    expect(lerp(-10, 10, 0.5)).toBe(0)
  })
})

describe('lerpAngle', () => {
  it('interpolates angles on shortest path', () => {
    // 10 to 350 should go backwards (350 is -10, so shortest path is 20 degrees)
    const result = lerpAngle(10, 350, 0.5)
    expect(result).toBe(0)
  })

  it('returns a when t=0', () => {
    expect(lerpAngle(45, 90, 0)).toBe(45)
  })

  it('returns b when t=1', () => {
    expect(lerpAngle(45, 90, 1)).toBeCloseTo(90)
  })
})

describe('applyEasing', () => {
  it('linear returns t unchanged', () => {
    expect(applyEasing(0.5, 'linear')).toBe(0.5)
  })

  it('clamps at 0 and 1', () => {
    expect(applyEasing(-0.1, 'ease-in')).toBe(0)
    expect(applyEasing(1.5, 'ease-out')).toBe(1)
  })

  it('ease-in starts slow (value < t at midpoint)', () => {
    expect(applyEasing(0.5, 'ease-in')).toBeLessThan(0.5)
  })

  it('ease-out starts fast (value > t at midpoint)', () => {
    expect(applyEasing(0.5, 'ease-out')).toBeGreaterThan(0.5)
  })

  it('ease-in-out is symmetric at t=0.5', () => {
    expect(applyEasing(0.5, 'ease-in-out')).toBe(0.5)
  })

  it('cubic-bezier without params falls back to linear', () => {
    expect(applyEasing(0.5, 'cubic-bezier')).toBe(0.5)
  })

  it('cubic-bezier with params returns correct value', () => {
    const result = applyEasing(0.5, 'cubic-bezier', { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1.0 })
    expect(result).toBeGreaterThan(0)
    expect(result).toBeLessThan(1)
  })
})

describe('interpolatePropertyKeyframes', () => {
  const mkKf = (frame: number, value: number, easing: 'linear' | 'ease-in' = 'linear'): PropertyKeyframe => ({
    id: `kf-${frame}`,
    frame,
    value,
    easing,
  })

  it('returns undefined for empty keyframes', () => {
    expect(interpolatePropertyKeyframes([], 5)).toBeUndefined()
  })

  it('returns the single value when only one keyframe', () => {
    expect(interpolatePropertyKeyframes([mkKf(10, 42)], 0)).toBe(42)
    expect(interpolatePropertyKeyframes([mkKf(10, 42)], 10)).toBe(42)
    expect(interpolatePropertyKeyframes([mkKf(10, 42)], 100)).toBe(42)
  })

  it('holds first value before first keyframe', () => {
    const kfs = [mkKf(10, 0), mkKf(20, 100)]
    expect(interpolatePropertyKeyframes(kfs, 5)).toBe(0)
  })

  it('holds last value after last keyframe', () => {
    const kfs = [mkKf(10, 0), mkKf(20, 100)]
    expect(interpolatePropertyKeyframes(kfs, 30)).toBe(100)
  })

  it('linearly interpolates between keyframes', () => {
    const kfs = [mkKf(0, 0), mkKf(10, 100)]
    expect(interpolatePropertyKeyframes(kfs, 5)).toBeCloseTo(50)
  })

  it('handles multiple keyframes', () => {
    const kfs = [mkKf(0, 0), mkKf(10, 100), mkKf(20, 0)]
    expect(interpolatePropertyKeyframes(kfs, 5)).toBeCloseTo(50)
    expect(interpolatePropertyKeyframes(kfs, 15)).toBeCloseTo(50)
  })

  it('applies ease-in easing', () => {
    const kfs = [mkKf(0, 0, 'ease-in'), mkKf(10, 100)]
    // With ease-in, at midpoint the value should be less than 50
    const val = interpolatePropertyKeyframes(kfs, 5)!
    expect(val).toBeLessThan(50)
    expect(val).toBeGreaterThan(0)
  })

  it('handles unsorted keyframes', () => {
    const kfs = [mkKf(20, 200), mkKf(0, 0), mkKf(10, 100)]
    expect(interpolatePropertyKeyframes(kfs, 5)).toBeCloseTo(50)
  })

  it('returns exact value at exact keyframe frames', () => {
    const kfs = [mkKf(0, 0), mkKf(10, 100), mkKf(20, 50)]
    expect(interpolatePropertyKeyframes(kfs, 0)).toBe(0)
    expect(interpolatePropertyKeyframes(kfs, 10)).toBe(100)
    expect(interpolatePropertyKeyframes(kfs, 20)).toBe(50)
  })

  it('applies ease-out easing', () => {
    const kfs: PropertyKeyframe[] = [
      { id: 'kf-0', frame: 0, value: 0, easing: 'ease-out' },
      mkKf(10, 100),
    ]
    // With ease-out, at midpoint the value should be more than 50
    const val = interpolatePropertyKeyframes(kfs, 5)!
    expect(val).toBeGreaterThan(50)
    expect(val).toBeLessThan(100)
  })

  describe('angle interpolation', () => {
    it('uses lerpAngle when isAngle is true', () => {
      const kfs = [mkKf(0, 350), mkKf(10, 10)]
      const result = interpolatePropertyKeyframes(kfs, 5, true)!
      // Should take short path: 350 -> 360/0 -> 10, midpoint around 360/0
      expect(result).toBeCloseTo(360)
    })

    it('uses standard lerp when isAngle is false', () => {
      const kfs = [mkKf(0, 350), mkKf(10, 10)]
      const result = interpolatePropertyKeyframes(kfs, 5, false)!
      // Standard lerp: (350 + 10) / 2 = 180
      expect(result).toBeCloseTo(180)
    })
  })
})
