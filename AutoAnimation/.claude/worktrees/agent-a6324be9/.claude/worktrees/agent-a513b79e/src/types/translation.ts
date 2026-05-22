import type { VisemeEvent, WordEvent } from '@/types/voice'
import type { SentenceEvent } from '@/services/captions'

/** A single translated dialogue line with regenerated audio and viseme data */
export interface TranslatedDialogueLine {
  /** Original dialogue line ID */
  originalLineId: string
  /** Character ID from the dialogue */
  characterId: string
  /** Translated script text (with emotion cues reinjected) */
  translatedScript: string
  /** Target language code */
  languageCode: string
  /** Generated audio URL for the translated line */
  audioUrl: string | null
  /** Audio duration in seconds */
  audioDuration: number
  /** Viseme timeline for lip sync */
  visemeTimeline: VisemeEvent[]
  /** Word timeline for captions */
  wordTimeline: WordEvent[]
  /** TTS speed adjustment applied (1.0 = normal) */
  speedAdjustment: number
}

/** Complete translation result for a project */
export interface TranslatedProject {
  /** Target language code */
  languageCode: string
  /** Target language display label */
  languageLabel: string
  /** All translated dialogue lines */
  lines: TranslatedDialogueLine[]
  /** Translated sentence timeline for captions */
  sentenceTimeline: SentenceEvent[]
  /** Total credits consumed for this translation */
  creditsUsed: number
}

/** Progress status for each step of the translation pipeline */
export type TranslationLineStatus =
  | 'pending'
  | 'translating'
  | 'generating-voice'
  | 'syncing'
  | 'complete'
  | 'error'

/** Per-line progress tracking */
export interface TranslationLineProgress {
  lineId: string
  status: TranslationLineStatus
  error?: string
}

/** Overall translation progress */
export interface TranslationProgress {
  /** Per-line progress */
  lines: TranslationLineProgress[]
  /** Overall percentage 0-100 */
  overallPercent: number
}

/** Configuration for a translation job */
export interface TranslationConfig {
  /** Target language code (e.g., 'es', 'fr', 'de') */
  targetLanguage: string
  /** Minimum TTS speed multiplier (default 0.85) */
  minSpeed: number
  /** Maximum TTS speed multiplier (default 1.2) */
  maxSpeed: number
  /** Maximum overlap tolerance in seconds between adjacent lines (default 0.3) */
  maxOverlapSeconds: number
}
