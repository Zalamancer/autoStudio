import { describe, it, expect } from 'vitest'
import {
  binarySearchTimeline,
  TimelineLookupCache,
  getVisemeAtFrame,
  getEmotionAtFrame,
} from '../timelineLookup'

describe('binarySearchTimeline', () => {
  const timeline = [
    { startFrame: 0, endFrame: 10 },
    { startFrame: 10, endFrame: 20 },
    { startFrame: 20, endFrame: 30 },
    { startFrame: 30, endFrame: 40 },
  ]

  it('finds event at beginning', () => {
    expect(binarySearchTimeline(timeline, 0)).toBe(0)
  })

  it('finds event in middle', () => {
    expect(binarySearchTimeline(timeline, 15)).toBe(1)
  })

  it('finds event at end', () => {
    expect(binarySearchTimeline(timeline, 35)).toBe(3)
  })

  it('returns -1 for frame before timeline', () => {
    expect(binarySearchTimeline(timeline, -5)).toBe(-1)
  })

  it('returns -1 for frame after timeline', () => {
    expect(binarySearchTimeline(timeline, 45)).toBe(-1)
  })

  it('returns -1 for empty timeline', () => {
    expect(binarySearchTimeline([], 5)).toBe(-1)
  })

  it('uses hint for fast sequential access', () => {
    // Frame 15 is in index 1, hint at 1 should hit immediately
    expect(binarySearchTimeline(timeline, 15, 1)).toBe(1)
    // Frame 25 is in index 2, hint at 1 should check next and find it
    expect(binarySearchTimeline(timeline, 25, 1)).toBe(2)
  })

  it('handles endFrame boundary (exclusive)', () => {
    expect(binarySearchTimeline(timeline, 10)).toBe(1)
    expect(binarySearchTimeline(timeline, 9)).toBe(0)
  })
})

describe('TimelineLookupCache', () => {
  const cache = new TimelineLookupCache()
  const visemeTimeline = [
    { startFrame: 0, endFrame: 5, viseme: 'Aa' as const },
    { startFrame: 5, endFrame: 10, viseme: 'O' as const },
    { startFrame: 10, endFrame: 15, viseme: 'Rest' as const },
  ]

  const emotionTimeline = [
    { startFrame: 0, endFrame: 10, emotion: 'Joy' },
    { startFrame: 10, endFrame: 20, emotion: 'Sadness' },
  ]

  it('returns correct viseme for frame', () => {
    cache.reset()
    expect(cache.getVisemeAtFrame(visemeTimeline, 3)).toBe('Aa')
    expect(cache.getVisemeAtFrame(visemeTimeline, 7)).toBe('O')
    expect(cache.getVisemeAtFrame(visemeTimeline, 12)).toBe('Rest')
  })

  it('returns Rest for out-of-range frame', () => {
    cache.reset()
    expect(cache.getVisemeAtFrame(visemeTimeline, 20)).toBe('Rest')
  })

  it('returns correct emotion for frame', () => {
    cache.reset()
    expect(cache.getEmotionAtFrame(emotionTimeline, 5)).toBe('Joy')
    expect(cache.getEmotionAtFrame(emotionTimeline, 15)).toBe('Sadness')
  })

  it('returns Neutral for out-of-range frame', () => {
    cache.reset()
    expect(cache.getEmotionAtFrame(emotionTimeline, 25)).toBe('Neutral')
  })
})

describe('stateless getVisemeAtFrame', () => {
  it('returns Rest for empty timeline', () => {
    expect(getVisemeAtFrame([], 5)).toBe('Rest')
  })

  it('finds correct viseme', () => {
    const timeline = [
      { startFrame: 0, endFrame: 10, viseme: 'Aa' as const },
    ]
    expect(getVisemeAtFrame(timeline, 5)).toBe('Aa')
  })
})

describe('stateless getEmotionAtFrame', () => {
  it('returns Neutral for empty timeline', () => {
    expect(getEmotionAtFrame([], 5)).toBe('Neutral')
  })

  it('finds correct emotion', () => {
    const timeline = [
      { startFrame: 0, endFrame: 10, emotion: 'Joy' },
    ]
    expect(getEmotionAtFrame(timeline, 5)).toBe('Joy')
  })
})
