import type { MouthCurvature } from '@/types/nanoBanana'
import type { Viseme } from '@/types/voice'
import type { EyeVariant, EyebrowVariant } from '@/types/emotionHeads'
import { getEyeVariantFromEmotion, getEyebrowVariantFromEmotion, EYE_VARIANT_CURVATURE } from '@/types/emotionHeads'

/**
 * Maps emotion names to mouth curvature
 * - Upward: Happy emotions (mouth corners turned up)
 * - Neutral: Neutral/intense emotions (mouth corners level)
 * - Downward: Sad/negative emotions (mouth corners turned down)
 */
export const emotionToMouthCurvature: Record<string, MouthCurvature> = {
  // Happy emotions → upward mouth
  'Satisfaction': 'upward',
  'Amusement': 'upward',
  'Joy': 'upward',
  'Laughter': 'upward',
  'Happy': 'upward',
  'Excited': 'upward',
  'Pleased': 'upward',
  'Delighted': 'upward',
  'Content': 'upward',
  'Cheerful': 'upward',

  // Neutral/intense emotions → neutral mouth
  'Sternness': 'neutral',
  'Indignation': 'neutral',
  'Anger': 'neutral',
  'Rage': 'neutral',
  'Alertness': 'neutral',
  'Wonder': 'neutral',
  'Surprise': 'neutral',
  'Shock': 'neutral',
  'Neutral': 'neutral',
  'Focused': 'neutral',
  'Determined': 'neutral',
  'Serious': 'neutral',
  'Confused': 'neutral',
  'Curious': 'neutral',

  // Sad/negative emotions → downward mouth
  'Disdain': 'downward',
  'Aversion': 'downward',
  'Disgust': 'downward',
  'Revulsion': 'downward',
  'Concern': 'downward',
  'Anxiety': 'downward',
  'Fear': 'downward',
  'Terror': 'downward',
  'Dejection': 'downward',
  'Melancholy': 'downward',
  'Sadness': 'downward',
  'Grief': 'downward',
  'Sad': 'downward',
  'Worried': 'downward',
  'Disappointed': 'downward',
  'Frustrated': 'downward',
  'Upset': 'downward',
  'Hurt': 'downward',
}

/**
 * Get mouth curvature from emotion name
 * Supports exact match, partial match (contains), and case-insensitive matching
 */
export function getCurvatureFromEmotion(emotion: string): MouthCurvature {
  // Try exact match first
  if (emotionToMouthCurvature[emotion]) {
    return emotionToMouthCurvature[emotion]
  }

  // Try case-insensitive match
  const lowerEmotion = emotion.toLowerCase()
  for (const [key, value] of Object.entries(emotionToMouthCurvature)) {
    if (key.toLowerCase() === lowerEmotion) {
      return value
    }
  }

  // Try partial match (emotion contains a known emotion word)
  for (const [key, value] of Object.entries(emotionToMouthCurvature)) {
    if (emotion.toLowerCase().includes(key.toLowerCase())) {
      return value
    }
  }

  // Default to neutral if no match found
  return 'neutral'
}

/**
 * Get the correct mouth sprite key based on emotion and viseme
 * @param emotion - Current emotion name
 * @param viseme - Current viseme type
 * @returns Combined key like "upward_AI" or "downward_REST"
 */
export function getMouthSpriteKey(emotion: string, viseme: Viseme): `${MouthCurvature}_${Viseme}` {
  const curvature = getCurvatureFromEmotion(emotion)
  return `${curvature}_${viseme}`
}

/**
 * Group emotions by their curvature for display/UI purposes
 */
export const emotionsByCategory = {
  upward: [
    'Satisfaction', 'Amusement', 'Joy', 'Laughter',
    'Happy', 'Excited', 'Pleased', 'Delighted', 'Content', 'Cheerful'
  ],
  neutral: [
    'Sternness', 'Indignation', 'Anger', 'Rage',
    'Alertness', 'Wonder', 'Surprise', 'Shock',
    'Neutral', 'Focused', 'Determined', 'Serious', 'Confused', 'Curious'
  ],
  downward: [
    'Disdain', 'Aversion', 'Disgust', 'Revulsion',
    'Concern', 'Anxiety', 'Fear', 'Terror',
    'Dejection', 'Melancholy', 'Sadness', 'Grief',
    'Sad', 'Worried', 'Disappointed', 'Frustrated', 'Upset', 'Hurt'
  ],
} as const

/**
 * Get a list of common/recommended emotions for each curvature
 */
export const recommendedEmotions: Record<MouthCurvature, string[]> = {
  upward: ['Joy', 'Happy', 'Amusement', 'Laughter'],
  neutral: ['Neutral', 'Surprise', 'Anger', 'Focused'],
  downward: ['Sadness', 'Fear', 'Disgust', 'Worried'],
}

/**
 * Get full expression data (eye, eyebrow, curvature) from an emotion name.
 * Used by the 8-layer rendering system to determine eye + eyebrow + mouth curvature.
 */
export function getExpressionFromEmotion(emotion: string): {
  eye: EyeVariant
  eyebrow: EyebrowVariant
  curvature: MouthCurvature
} {
  const eye = getEyeVariantFromEmotion(emotion)
  const eyebrow = getEyebrowVariantFromEmotion(emotion)
  const curvature = EYE_VARIANT_CURVATURE[eye]
  return { eye, eyebrow, curvature }
}

/**
 * Extract the inline [emotion] cue from a script text.
 * Returns the capitalized emotion name, or null if none found.
 * Supports cues like [happy], [sad], [angry], [surprised], [curious], [serious], etc.
 */
export function extractInlineEmotionCue(text: string): string | null {
  if (!text) return null
  const match = text.match(/\[([\w-]+)\]/)
  if (!match) return null
  const raw = match[1].toLowerCase()

  // Map common informal cue words to emotion categories
  const cueToEmotion: Record<string, string> = {
    'happy': 'Joy',
    'joy': 'Joy',
    'joyful': 'Joy',
    'excited': 'Joy',
    'cheerful': 'Joy',
    'delighted': 'Joy',
    'thrilled': 'Joy',
    'laughing': 'Joy',
    'amused': 'Joy',
    'pleased': 'Joy',
    'satisfied': 'Joy',

    'angry': 'Anger',
    'anger': 'Anger',
    'furious': 'Anger',
    'mad': 'Anger',
    'frustrated': 'Anger',
    'annoyed': 'Anger',
    'stern': 'Anger',
    'indignant': 'Anger',

    'sad': 'Sadness',
    'sadness': 'Sadness',
    'crying': 'Sadness',
    'depressed': 'Sadness',
    'melancholy': 'Sadness',
    'gloomy': 'Sadness',
    'disappointed': 'Sadness',
    'heartbroken': 'Sadness',
    'grief': 'Sadness',
    'upset': 'Sadness',

    'scared': 'Fear',
    'afraid': 'Fear',
    'fear': 'Fear',
    'terrified': 'Fear',
    'anxious': 'Fear',
    'worried': 'Fear',
    'nervous': 'Fear',
    'concerned': 'Fear',
    'panic': 'Fear',

    'surprised': 'Surprise',
    'surprise': 'Surprise',
    'shocked': 'Surprise',
    'amazed': 'Surprise',
    'astonished': 'Surprise',
    'curious': 'Surprise',
    'wondering': 'Surprise',
    'intrigued': 'Surprise',

    'disgusted': 'Disgust',
    'disgust': 'Disgust',
    'gross': 'Disgust',
    'revolted': 'Disgust',

    'neutral': 'Neutral',
    'serious': 'Neutral',
    'calm': 'Neutral',
    'thoughtful': 'Neutral',
    'focused': 'Neutral',
    'determined': 'Neutral',
    'confident': 'Neutral',
    'informative': 'Neutral',
    'explaining': 'Neutral',
    'skeptical': 'Neutral',
  }

  if (cueToEmotion[raw]) return cueToEmotion[raw]

  // Capitalize first letter as fallback
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

/**
 * Simple keyword-based emotion detection from script text.
 * Returns the primary emotion category detected, or 'Neutral' if none found.
 *
 * This is used for "Auto" emotion detection on dialogue lines.
 */
type DetectableEmotion = 'Joy' | 'Anger' | 'Disgust' | 'Fear' | 'Sadness' | 'Surprise' | 'Neutral'

const emotionKeywords: Record<Exclude<DetectableEmotion, 'Neutral'>, string[]> = {
  Joy: [
    'happy', 'joy', 'love', 'great', 'amazing', 'wonderful', 'fantastic',
    'awesome', 'excited', 'thrilled', 'laugh', 'fun', 'celebrate', 'cheerful',
    'glad', 'delighted', 'pleased', 'brilliant', 'yay', 'hooray', 'haha',
    'lol', 'smile', 'grin', 'beautiful', 'perfect', 'excellent',
  ],
  Anger: [
    'angry', 'furious', 'rage', 'hate', 'mad', 'annoyed', 'frustrated',
    'irritated', 'outraged', 'livid', 'infuriated', 'damn', 'hell',
    'stupid', 'idiot', 'terrible', 'worst', 'unacceptable', 'disgusting',
  ],
  Disgust: [
    'gross', 'disgusting', 'revolting', 'nasty', 'yuck', 'ew', 'ugh',
    'vile', 'repulsive', 'sickening', 'nauseating', 'awful', 'horrible',
    'repugnant', 'loathsome',
  ],
  Fear: [
    'scared', 'afraid', 'fear', 'terrified', 'horror', 'panic', 'dread',
    'nightmare', 'creepy', 'spooky', 'frightened', 'alarmed', 'anxious',
    'worried', 'nervous', 'trembling', 'haunted', 'eerie', 'danger',
  ],
  Sadness: [
    'sad', 'cry', 'tears', 'depressed', 'miserable', 'heartbroken',
    'grief', 'mourning', 'lonely', 'hopeless', 'sorry', 'regret',
    'miss', 'lost', 'painful', 'hurt', 'suffering', 'disappointed',
    'melancholy', 'gloomy', 'sigh',
  ],
  Surprise: [
    'wow', 'what', 'really', 'surprise', 'shocked', 'unexpected',
    'unbelievable', 'incredible', 'omg', 'oh my', 'no way', 'whoa',
    'astonishing', 'stunning', 'remarkable', 'suddenly',
  ],
}

export function detectEmotionFromText(text: string): DetectableEmotion {
  if (!text.trim()) return 'Neutral'

  // First: try extracting an inline [emotion] cue (most reliable)
  const inlineCue = extractInlineEmotionCue(text)
  if (inlineCue) {
    const emotions: DetectableEmotion[] = ['Joy', 'Anger', 'Disgust', 'Fear', 'Sadness', 'Surprise']
    for (const e of emotions) {
      if (inlineCue === e) return e
    }
    // If the cue mapped to 'Neutral' or an unknown string, fall through to keyword scan
  }

  const lowerText = text.toLowerCase()
  const scores: Record<DetectableEmotion, number> = {
    Joy: 0,
    Anger: 0,
    Disgust: 0,
    Fear: 0,
    Sadness: 0,
    Surprise: 0,
    Neutral: 0,
  }

  for (const [emotion, keywords] of Object.entries(emotionKeywords) as [Exclude<DetectableEmotion, 'Neutral'>, string[]][]) {
    for (const keyword of keywords) {
      // Use word boundary check for short keywords, includes for longer ones
      if (keyword.length <= 3) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
        const matches = lowerText.match(regex)
        if (matches) scores[emotion] += matches.length
      } else {
        if (lowerText.includes(keyword)) scores[emotion]++
      }
    }
  }

  // Boost for exclamation marks (more intense emotion) and question marks (surprise)
  const exclamationCount = (text.match(/!/g) || []).length
  const questionCount = (text.match(/\?/g) || []).length

  // Exclamation marks slightly boost the highest non-neutral score
  if (exclamationCount > 0) {
    const topEmotion = (Object.entries(scores) as [DetectableEmotion, number][])
      .filter(([e]) => e !== 'Neutral')
      .sort(([, a], [, b]) => b - a)[0]
    if (topEmotion && topEmotion[1] > 0) {
      scores[topEmotion[0]] += exclamationCount * 0.5
    }
  }

  if (questionCount > 0) {
    scores.Surprise += questionCount * 0.3
  }

  // Find highest scoring emotion
  let topEmotion: DetectableEmotion = 'Neutral'
  let topScore = 0

  for (const [emotion, score] of Object.entries(scores) as [DetectableEmotion, number][]) {
    if (emotion !== 'Neutral' && score > topScore) {
      topScore = score
      topEmotion = emotion
    }
  }

  return topScore > 0 ? topEmotion : 'Neutral'
}
