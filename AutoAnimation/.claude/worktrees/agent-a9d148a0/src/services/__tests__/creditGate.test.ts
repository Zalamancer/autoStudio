import { describe, it, expect } from 'vitest'
import { InsufficientCreditsError } from '../creditGate'
import { CREDIT_COSTS } from '@/types/credits'
import type { CreditOperation } from '@/types/credits'

describe('InsufficientCreditsError', () => {
  it('creates error with correct properties', () => {
    const err = new InsufficientCreditsError('elevenlabs-tts', 30, 10)
    expect(err).toBeInstanceOf(Error)
    expect(err.name).toBe('InsufficientCreditsError')
    expect(err.operation).toBe('elevenlabs-tts')
    expect(err.required).toBe(30)
    expect(err.remaining).toBe(10)
    expect(err.message).toContain('elevenlabs-tts')
    expect(err.message).toContain('30')
    expect(err.message).toContain('10')
  })
})

describe('CREDIT_COSTS', () => {
  it('has costs defined for all operations', () => {
    const operations: CreditOperation[] = [
      'elevenlabs-tts',
      'elevenlabs-music',
      'elevenlabs-sfx',
      'gemini-script',
      'orchestrator-plan',
      'svg-object',
      'vertex-sprite-sheet',
      'vertex-emotion-heads',
      'auto-rig-2d',
      'meshy-text-to-3d',
      'meshy-image-to-3d',
      'meshy-auto-rig',
      'hunyuan-motion',
      'ai-video',
      'recraft-vectorize',
      'recraft-bg-remove',
    ]
    for (const op of operations) {
      expect(CREDIT_COSTS[op]).toBeGreaterThan(0)
    }
  })

  it('all costs are positive integers', () => {
    for (const [, cost] of Object.entries(CREDIT_COSTS)) {
      expect(cost).toBeGreaterThan(0)
      expect(Number.isInteger(cost)).toBe(true)
    }
  })
})
