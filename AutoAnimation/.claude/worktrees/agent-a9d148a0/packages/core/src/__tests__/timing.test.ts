import { describe, it, expect } from 'vitest'
import { computeKineticPhase } from '../timing'

describe('computeKineticPhase', () => {
  it('returns first word in enter phase at time 0', () => {
    const result = computeKineticPhase(0, 2, 3)
    expect(result!.wordIndex).toBe(0)
    expect(result!.phase).toBe('enter')
    expect(result!.enterProgress).toBe(0)
  })

  it('returns hold phase at mid-cycle', () => {
    const result = computeKineticPhase(0.8, 2, 3)
    expect(result!.wordIndex).toBe(0)
    expect(result!.phase).toBe('hold')
  })

  it('advances to second word after cycleDuration', () => {
    const result = computeKineticPhase(2.1, 2, 3)
    expect(result!.wordIndex).toBe(1)
  })

  it('cycles back to first word after all words', () => {
    const result = computeKineticPhase(6.1, 2, 3)
    expect(result!.wordIndex).toBe(0)
  })

  it('returns null for 0 words', () => {
    const result = computeKineticPhase(1, 2, 0)
    expect(result).toBeNull()
  })
})
