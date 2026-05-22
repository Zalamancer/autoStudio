/**
 * Translation Timing Service.
 *
 * Adjusts TTS speed and silence padding for translated dialogue lines
 * to fit within original time slots.
 */

export interface TimingAdjustment {
  /** TTS speed multiplier (0.85-1.2) */
  speed: number
  /** Silence padding before the line in seconds */
  silenceBefore: number
  /** Silence padding after the line in seconds */
  silenceAfter: number
}

/**
 * Language-specific length multipliers relative to English.
 * e.g., German text is typically ~20% longer than English.
 */
const LANGUAGE_LENGTH_FACTORS: Record<string, number> = {
  en: 1.0,
  es: 1.15,
  fr: 1.20,
  de: 1.25,
  it: 1.15,
  pt: 1.15,
  ja: 0.70,
  ko: 0.75,
  zh: 0.65,
  ar: 0.90,
  hi: 1.10,
  tr: 1.10,
  ru: 1.20,
  nl: 1.15,
  sv: 1.10,
  pl: 1.15,
  id: 1.05,
  th: 0.80,
  vi: 0.90,
  uk: 1.20,
}

/**
 * Estimate how long a translated text will take to speak
 * relative to the original line duration.
 */
export function estimateTranslatedDuration(
  originalDurationSec: number,
  originalCharCount: number,
  translatedCharCount: number,
  targetLanguage: string,
): number {
  if (originalCharCount === 0 || originalDurationSec === 0) return originalDurationSec

  const langFactor = LANGUAGE_LENGTH_FACTORS[targetLanguage] || 1.0
  const charRatio = translatedCharCount / originalCharCount
  const estimatedDuration = originalDurationSec * charRatio * langFactor

  return estimatedDuration
}

/**
 * Compute optimal timing adjustments for a translated line.
 *
 * Strategies:
 * 1. Speed adjustment (preferred): adjust TTS speed within 0.85x-1.2x
 * 2. Silence padding: add silence before/after to fill the time slot
 * 3. Overlap tolerance: allow up to maxOverlap seconds overlap with neighbors
 */
export function computeTimingAdjustment(
  originalDurationSec: number,
  estimatedTranslatedDurationSec: number,
  _minSpeed: number = 0.85,
  maxSpeed: number = 1.2,
  maxOverlapSec: number = 0.3,
): TimingAdjustment {
  if (originalDurationSec <= 0) {
    return { speed: 1.0, silenceBefore: 0, silenceAfter: 0 }
  }

  const ratio = estimatedTranslatedDurationSec / originalDurationSec

  // If translated text fits within the original duration, pad with silence
  if (ratio <= 1.0) {
    const excessTime = originalDurationSec - estimatedTranslatedDurationSec
    return {
      speed: 1.0,
      silenceBefore: 0,
      silenceAfter: excessTime,
    }
  }

  // Try speed adjustment first
  const requiredSpeed = ratio
  if (requiredSpeed <= maxSpeed) {
    return {
      speed: Math.round(requiredSpeed * 100) / 100,
      silenceBefore: 0,
      silenceAfter: 0,
    }
  }

  // Speed alone insufficient — use max speed + allow overlap
  const durationAtMaxSpeed = estimatedTranslatedDurationSec / maxSpeed
  const overflowSec = durationAtMaxSpeed - originalDurationSec

  if (overflowSec <= maxOverlapSec) {
    return {
      speed: maxSpeed,
      silenceBefore: 0,
      silenceAfter: 0,
    }
  }

  // Even with max speed and overlap tolerance, it still doesn't fit
  // Use max speed and accept the overflow
  return {
    speed: maxSpeed,
    silenceBefore: 0,
    silenceAfter: 0,
  }
}
