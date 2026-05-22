import { describe, it, expect } from 'vitest'
import { remapTimeline, type SilenceRegion } from '../videoExport'

describe('remapTimeline', () => {
  it('returns events unchanged when silence map is empty', () => {
    const events = [
      { time: 0, viseme: 'REST' },
      { time: 0.5, viseme: 'AI' },
      { time: 1.0, viseme: 'E' },
    ]
    const result = remapTimeline(events, [])
    expect(result).toEqual(events)
  })

  it('shifts events after a silence region', () => {
    const silenceMap: SilenceRegion[] = [
      { startSec: 1.0, endSec: 2.0, removedSec: 0.8 },
    ]
    const events = [
      { time: 0.5, label: 'before' },
      { time: 2.5, label: 'after' },
    ]
    const result = remapTimeline(events, silenceMap)
    expect(result[0].time).toBe(0.5) // before silence — unchanged
    expect(result[1].time).toBeCloseTo(1.7, 1) // 2.5 - 0.8 = 1.7
  })

  it('shifts events after multiple silence regions', () => {
    const silenceMap: SilenceRegion[] = [
      { startSec: 1.0, endSec: 1.5, removedSec: 0.3 },
      { startSec: 3.0, endSec: 4.0, removedSec: 0.8 },
    ]
    const events = [
      { time: 0.5, label: 'start' },
      { time: 2.0, label: 'middle' },
      { time: 5.0, label: 'end' },
    ]
    const result = remapTimeline(events, silenceMap)
    expect(result[0].time).toBe(0.5) // unaffected
    expect(result[1].time).toBeCloseTo(1.7, 1) // 2.0 - 0.3
    expect(result[2].time).toBeCloseTo(3.9, 1) // 5.0 - 0.3 - 0.8
  })

  it('clamps events inside a silence to compressed boundary', () => {
    const silenceMap: SilenceRegion[] = [
      { startSec: 1.0, endSec: 2.0, removedSec: 0.8 },
    ]
    const events = [
      { time: 1.5, label: 'inside-silence' },
    ]
    const result = remapTimeline(events, silenceMap)
    // Event at 1.5 is inside silence [1.0, 2.0] with keepSec = 1.0 - 0.8 = 0.2
    // Offset = 1.5 - 1.0 - 0.2 = 0.3
    // Result = 1.5 - 0.3 = 1.2
    expect(result[0].time).toBeCloseTo(1.2, 1)
  })

  it('never produces negative times', () => {
    const silenceMap: SilenceRegion[] = [
      { startSec: 0.0, endSec: 1.0, removedSec: 0.9 },
    ]
    const events = [
      { time: 0.05, label: 'very-early' },
    ]
    const result = remapTimeline(events, silenceMap)
    expect(result[0].time).toBeGreaterThanOrEqual(0)
  })
})
