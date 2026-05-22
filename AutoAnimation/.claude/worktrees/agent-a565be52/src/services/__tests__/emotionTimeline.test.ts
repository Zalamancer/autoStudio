import { describe, it, expect } from 'vitest'
import { buildEmotionTimeline, getEmotionAtFrame } from '../emotionTimeline'
import type { WordEvent } from '@/types/voice'

const mkWord = (word: string, startFrame: number, endFrame: number): WordEvent => ({
  word,
  startFrame,
  endFrame,
  startTime: startFrame / 30,
  endTime: endFrame / 30,
})

describe('buildEmotionTimeline', () => {
  it('returns empty for empty script', () => {
    expect(buildEmotionTimeline('', [])).toEqual([])
  })

  it('returns empty for script without cues', () => {
    const words = [mkWord('hello', 0, 15), mkWord('world', 15, 30)]
    expect(buildEmotionTimeline('hello world', words)).toEqual([])
  })

  it('returns empty for empty word timeline', () => {
    expect(buildEmotionTimeline('[happy] hello', [])).toEqual([])
  })

  it('parses a single cue at the start', () => {
    const words = [mkWord('hello', 0, 15), mkWord('world', 15, 30)]
    const result = buildEmotionTimeline('[happy] hello world', words)

    expect(result).toHaveLength(1)
    expect(result[0].emotion).toBe('Happy')
    expect(result[0].startFrame).toBe(0) // maps to first word
    expect(result[0].endFrame).toBe(30)
  })

  it('parses multiple cues', () => {
    const words = [
      mkWord('hey', 0, 10),
      mkWord('everyone', 10, 25),
      mkWord('whoa', 25, 35),
      mkWord('amazing', 35, 50),
    ]
    const result = buildEmotionTimeline(
      '[happy] hey everyone [surprised] whoa amazing',
      words
    )

    expect(result).toHaveLength(2)
    expect(result[0].emotion).toBe('Happy')
    expect(result[0].startFrame).toBe(0)
    expect(result[1].emotion).toBe('Surprised')
    expect(result[1].startFrame).toBe(25)
  })

  it('capitalizes emotion names', () => {
    const words = [mkWord('ok', 0, 10)]
    const result = buildEmotionTimeline('[ANGRY] ok', words)
    expect(result[0].emotion).toBe('Angry')
  })
})

describe('getEmotionAtFrame', () => {
  const timeline = [
    { emotion: 'Happy', startFrame: 0, endFrame: 15 },
    { emotion: 'Sad', startFrame: 15, endFrame: 30 },
  ]

  it('returns correct emotion within range', () => {
    expect(getEmotionAtFrame(timeline, 5)).toBe('Happy')
    expect(getEmotionAtFrame(timeline, 20)).toBe('Sad')
  })

  it('returns Neutral when no event covers the frame', () => {
    expect(getEmotionAtFrame(timeline, 50)).toBe('Neutral')
  })

  it('returns Neutral for empty timeline', () => {
    expect(getEmotionAtFrame([], 0)).toBe('Neutral')
  })

  it('handles exact boundary frames', () => {
    expect(getEmotionAtFrame(timeline, 0)).toBe('Happy')
    expect(getEmotionAtFrame(timeline, 15)).toBe('Sad')
  })
})
