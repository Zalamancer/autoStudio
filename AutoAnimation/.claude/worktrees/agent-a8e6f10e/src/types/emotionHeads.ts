/**
 * Eye & Eyebrow Variant Type Definitions
 *
 * Replaces the old 24 emotion-head system (6 emotions × 4 intensities = full head swaps)
 * with a modular expression system: 6 eye variants + 6 eyebrow variants.
 *
 * Emotions are now expressed through eye + eyebrow sprite combinations rather than
 * swapping the entire head. The head is integrated into the body sprite.
 */

import type { MouthCurvature } from './nanoBanana'

// ── Eye & Eyebrow Variants ─────────────────────────────────────────────

export type EyeVariant = 'neutral' | 'happy' | 'sad' | 'angry' | 'shocked' | 'suspicious'
export type EyebrowVariant = 'neutral' | 'happy' | 'sad' | 'angry' | 'shocked' | 'suspicious'

export const EYE_VARIANTS: EyeVariant[] = ['neutral', 'happy', 'sad', 'angry', 'shocked', 'suspicious']
export const EYEBROW_VARIANTS: EyebrowVariant[] = ['neutral', 'happy', 'sad', 'angry', 'shocked', 'suspicious']

// Sprite sets for eye/eyebrow variants (6 slots each)
export type EyeVariantSprites = Record<EyeVariant, string | null>
export type EyebrowVariantSprites = Record<EyebrowVariant, string | null>

// ── Emotion → Expression Mapping ────────────────────────────────────────

/** The 6 primary emotion categories (kept for backwards compat & emotion timeline) */
export type EmotionCategory = 'Joy' | 'Anger' | 'Disgust' | 'Fear' | 'Sadness' | 'Surprise'

export const EMOTION_CATEGORIES: EmotionCategory[] = [
  'Joy', 'Anger', 'Disgust', 'Fear', 'Sadness', 'Surprise',
]

/** Maps emotion categories to eye variants */
export const EMOTION_TO_EYE_VARIANT: Record<EmotionCategory, EyeVariant> = {
  Joy: 'happy',
  Anger: 'angry',
  Sadness: 'sad',
  Surprise: 'shocked',
  Disgust: 'suspicious',
  Fear: 'suspicious',
}

/** Maps emotion categories to eyebrow variants */
export const EMOTION_TO_EYEBROW_VARIANT: Record<EmotionCategory, EyebrowVariant> = {
  Joy: 'happy',
  Anger: 'angry',
  Sadness: 'sad',
  Surprise: 'shocked',
  Disgust: 'suspicious',
  Fear: 'suspicious',
}

/** Maps eye variants to their corresponding mouth curvature (for coordination) */
export const EYE_VARIANT_CURVATURE: Record<EyeVariant, MouthCurvature> = {
  neutral: 'neutral',
  happy: 'upward',
  sad: 'downward',
  angry: 'neutral',
  shocked: 'neutral',
  suspicious: 'downward',
}

/** Mapping from emotion category to mouth curvature (for lip sync coordination) */
export const EMOTION_CURVATURE_MAP: Record<EmotionCategory, MouthCurvature> = {
  Joy: 'upward',
  Anger: 'neutral',
  Disgust: 'downward',
  Fear: 'downward',
  Sadness: 'downward',
  Surprise: 'neutral',
}

// ── Helper Functions ────────────────────────────────────────────────────

/**
 * Get eye variant from an emotion name.
 * Supports exact category match and fuzzy matching for common emotion words.
 */
export function getEyeVariantFromEmotion(emotion: string): EyeVariant {
  // Try direct category match
  const category = resolveEmotionCategory(emotion)
  if (category) return EMOTION_TO_EYE_VARIANT[category]
  return 'neutral'
}

/**
 * Get eyebrow variant from an emotion name.
 */
export function getEyebrowVariantFromEmotion(emotion: string): EyebrowVariant {
  const category = resolveEmotionCategory(emotion)
  if (category) return EMOTION_TO_EYEBROW_VARIANT[category]
  return 'neutral'
}

/**
 * Get the index of an eye variant in the EYE_VARIANTS array.
 */
export function getEyeVariantIndex(variant: EyeVariant): number {
  return EYE_VARIANTS.indexOf(variant)
}

/**
 * Get the index of an eyebrow variant in the EYEBROW_VARIANTS array.
 */
export function getEyebrowVariantIndex(variant: EyebrowVariant): number {
  return EYEBROW_VARIANTS.indexOf(variant)
}

/**
 * Create an empty eye variant sprite set (all 6 slots as null)
 */
export function createEmptyEyeVariantSet(): EyeVariantSprites {
  return Object.fromEntries(
    EYE_VARIANTS.map((v) => [v, null])
  ) as EyeVariantSprites
}

/**
 * Create an empty eyebrow variant sprite set (all 6 slots as null)
 */
export function createEmptyEyebrowVariantSet(): EyebrowVariantSprites {
  return Object.fromEntries(
    EYEBROW_VARIANTS.map((v) => [v, null])
  ) as EyebrowVariantSprites
}

// ── Internal helpers ────────────────────────────────────────────────────

/** Maps common emotion words to their primary category */
const EMOTION_WORD_MAP: Record<string, EmotionCategory> = {
  // Joy
  joy: 'Joy', happy: 'Joy', satisfaction: 'Joy', amusement: 'Joy',
  laughter: 'Joy', excited: 'Joy', pleased: 'Joy', delighted: 'Joy',
  cheerful: 'Joy', content: 'Joy',
  // Anger
  anger: 'Anger', angry: 'Anger', sternness: 'Anger', indignation: 'Anger',
  rage: 'Anger', furious: 'Anger', mad: 'Anger', frustrated: 'Anger',
  // Disgust
  disgust: 'Disgust', disdain: 'Disgust', aversion: 'Disgust',
  revulsion: 'Disgust', gross: 'Disgust',
  // Fear
  fear: 'Fear', concern: 'Fear', anxiety: 'Fear', terror: 'Fear',
  scared: 'Fear', worried: 'Fear', nervous: 'Fear',
  // Sadness
  sadness: 'Sadness', sad: 'Sadness', dejection: 'Sadness',
  melancholy: 'Sadness', grief: 'Sadness', crying: 'Sadness',
  disappointed: 'Sadness', hurt: 'Sadness',
  // Surprise
  surprise: 'Surprise', alertness: 'Surprise', wonder: 'Surprise',
  shock: 'Surprise', shocked: 'Surprise', amazed: 'Surprise',
}

/**
 * Resolve a free-text emotion name to an EmotionCategory.
 * Returns null if no match found (caller should default to 'neutral').
 */
function resolveEmotionCategory(emotion: string): EmotionCategory | null {
  if (!emotion) return null

  // Direct category match
  const categories = EMOTION_CATEGORIES as readonly string[]
  if (categories.includes(emotion)) return emotion as EmotionCategory

  // Word map match (case-insensitive)
  const lower = emotion.toLowerCase()
  if (EMOTION_WORD_MAP[lower]) return EMOTION_WORD_MAP[lower]

  // Partial match
  for (const [key, cat] of Object.entries(EMOTION_WORD_MAP)) {
    if (lower.includes(key) || key.includes(lower)) return cat
  }

  return null
}

// ── Legacy 24 Emotion Head Compatibility ──────────────────────────────
// The old system used 6 emotions × 4 intensity levels = 24 full-head swaps.
// These exports are kept so existing UI components (EmotionHeadsSection,
// CharacterGeneratorPanel) continue to compile and render.

export type EmotionLevel = 1 | 2 | 3 | 4

/** Key format: "Category_Level" e.g. "Joy_1", "Anger_3" */
export type EmotionHeadKey = `${EmotionCategory}_${EmotionLevel}`

/** Sprite map for all 24 emotion heads */
export type EmotionHeadSprites = Record<EmotionHeadKey, string | null>

export interface EmotionVariantInfo {
  category: EmotionCategory
  level: EmotionLevel
  name: string
}

const EMOTION_LEVEL_NAMES: Record<EmotionCategory, [string, string, string, string]> = {
  Joy:      ['Satisfaction', 'Amusement', 'Joy', 'Laughter'],
  Anger:    ['Sternness', 'Indignation', 'Anger', 'Rage'],
  Disgust:  ['Disdain', 'Aversion', 'Disgust', 'Revulsion'],
  Fear:     ['Concern', 'Anxiety', 'Fear', 'Terror'],
  Sadness:  ['Dejection', 'Melancholy', 'Sadness', 'Grief'],
  Surprise: ['Alertness', 'Wonder', 'Surprise', 'Shock'],
}

/** All 24 emotion variants (6 categories × 4 intensities) */
export const EMOTION_VARIANTS: EmotionVariantInfo[] = EMOTION_CATEGORIES.flatMap(
  (category) =>
    ([1, 2, 3, 4] as EmotionLevel[]).map((level) => ({
      category,
      level,
      name: EMOTION_LEVEL_NAMES[category][level - 1],
    }))
)

/** Create an empty emotion head sprite set (all 24 slots as null) */
export function createEmptyEmotionHeadSet(): EmotionHeadSprites {
  return Object.fromEntries(
    EMOTION_VARIANTS.map((v) => [`${v.category}_${v.level}`, null])
  ) as EmotionHeadSprites
}

/** Get a human-readable label for an emotion category */
export function getEmotionCategoryLabel(category: EmotionCategory): string {
  const names = EMOTION_LEVEL_NAMES[category]
  return names ? names.join(' → ') : category
}
