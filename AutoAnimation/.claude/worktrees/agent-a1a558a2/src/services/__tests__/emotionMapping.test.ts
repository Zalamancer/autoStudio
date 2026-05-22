import { describe, it, expect } from 'vitest'
import {
  getCurvatureFromEmotion,
  getMouthSpriteKey,
  detectEmotionFromText,
  extractInlineEmotionCue,
  getExpressionFromEmotion,
} from '../emotionMapping'

describe('getCurvatureFromEmotion', () => {
  it('maps happy emotions to upward', () => {
    expect(getCurvatureFromEmotion('Joy')).toBe('upward')
    expect(getCurvatureFromEmotion('Laughter')).toBe('upward')
    expect(getCurvatureFromEmotion('Amusement')).toBe('upward')
  })

  it('maps anger/surprise emotions to neutral', () => {
    expect(getCurvatureFromEmotion('Anger')).toBe('neutral')
    expect(getCurvatureFromEmotion('Surprise')).toBe('neutral')
    expect(getCurvatureFromEmotion('Neutral')).toBe('neutral')
  })

  it('maps sad emotions to downward', () => {
    expect(getCurvatureFromEmotion('Sadness')).toBe('downward')
    expect(getCurvatureFromEmotion('Fear')).toBe('downward')
    expect(getCurvatureFromEmotion('Disgust')).toBe('downward')
  })

  it('handles case-insensitive matching', () => {
    expect(getCurvatureFromEmotion('joy')).toBe('upward')
    expect(getCurvatureFromEmotion('JOY')).toBe('upward')
    expect(getCurvatureFromEmotion('sadness')).toBe('downward')
  })

  it('handles partial match', () => {
    expect(getCurvatureFromEmotion('very happy emotion')).toBe('upward')
    expect(getCurvatureFromEmotion('feeling sad today')).toBe('downward')
  })

  it('defaults to neutral for unknown emotions', () => {
    expect(getCurvatureFromEmotion('unknown')).toBe('neutral')
    expect(getCurvatureFromEmotion('')).toBe('neutral')
  })
})

describe('getMouthSpriteKey', () => {
  it('combines curvature and viseme', () => {
    expect(getMouthSpriteKey('Joy', 'Aa')).toBe('upward_Aa')
    expect(getMouthSpriteKey('Anger', 'M')).toBe('neutral_M')
    expect(getMouthSpriteKey('Sadness', 'Rest')).toBe('downward_Rest')
  })
})

describe('extractInlineEmotionCue', () => {
  it('extracts bracketed cues', () => {
    expect(extractInlineEmotionCue('[happy] Hello!')).toBe('Joy')
    expect(extractInlineEmotionCue('[angry] Stop!')).toBe('Anger')
    expect(extractInlineEmotionCue('[sad] Oh no...')).toBe('Sadness')
  })

  it('handles unknown cues by capitalizing', () => {
    expect(extractInlineEmotionCue('[mysterious] text')).toBe('Mysterious')
  })

  it('returns null for text without cues', () => {
    expect(extractInlineEmotionCue('No cues here')).toBeNull()
    expect(extractInlineEmotionCue('')).toBeNull()
  })

  it('maps informal cue words', () => {
    expect(extractInlineEmotionCue('[scared] text')).toBe('Fear')
    expect(extractInlineEmotionCue('[surprised] text')).toBe('Surprise')
    expect(extractInlineEmotionCue('[disgusted] text')).toBe('Disgust')
    expect(extractInlineEmotionCue('[neutral] text')).toBe('Neutral')
  })
})

describe('detectEmotionFromText', () => {
  it('returns Neutral for empty text', () => {
    expect(detectEmotionFromText('')).toBe('Neutral')
    expect(detectEmotionFromText('   ')).toBe('Neutral')
  })

  it('detects Joy from happy keywords', () => {
    expect(detectEmotionFromText('This is amazing and wonderful!')).toBe('Joy')
  })

  it('detects Sadness from sad keywords', () => {
    expect(detectEmotionFromText('I feel so sad and lonely')).toBe('Sadness')
  })

  it('detects Anger from angry keywords', () => {
    expect(detectEmotionFromText('I am so angry and furious!')).toBe('Anger')
  })

  it('detects Fear from fearful keywords', () => {
    expect(detectEmotionFromText('I am terrified and scared')).toBe('Fear')
  })

  it('detects Surprise from surprise keywords', () => {
    expect(detectEmotionFromText('Wow, that is unbelievable!')).toBe('Surprise')
  })

  it('uses inline cue when present', () => {
    expect(detectEmotionFromText('[happy] This is terrible')).toBe('Joy')
  })

  it('returns Neutral for text without emotional keywords', () => {
    expect(detectEmotionFromText('The weather is mild today')).toBe('Neutral')
  })
})

describe('getExpressionFromEmotion', () => {
  it('returns eye, eyebrow, and curvature', () => {
    const result = getExpressionFromEmotion('Joy')
    expect(result).toHaveProperty('eye')
    expect(result).toHaveProperty('eyebrow')
    expect(result).toHaveProperty('curvature')
  })

  it('returns consistent curvature with getCurvatureFromEmotion', () => {
    // getExpressionFromEmotion uses EYE_VARIANT_CURVATURE which may differ from
    // getCurvatureFromEmotion for edge cases, but for primary emotions should match
    const result = getExpressionFromEmotion('Joy')
    expect(result.curvature).toBe('upward')
  })
})
