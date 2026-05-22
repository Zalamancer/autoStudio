/**
 * AI Person Clone Type Definitions
 *
 * Types for analyzing video to learn gesture patterns, voice characteristics,
 * and movement style, then generating a character that mimics them.
 */

/** Extracted facial features from a photo/video */
export interface FacialFeatures {
  faceShape: string
  eyeSpacing: string
  eyeShape: string
  eyeColor: string
  noseShape: string
  mouthShape: string
  chinShape: string
  cheekStructure: string
  foreheadSize: string
}

/** Extracted hair characteristics */
export interface HairFeatures {
  style: string
  color: string
  length: string
  texture: string
  partSide: string
}

/** Extracted body characteristics */
export interface BodyFeatures {
  height: string
  build: string
  skinTone: string
  posture: string
}

/** Extracted clothing/style characteristics */
export interface StyleFeatures {
  clothingStyle: string
  primaryColors: string[]
  accessories: string[]
  distinctiveFeatures: string[]
}

/** Gesture pattern extracted from video analysis */
export interface GesturePattern {
  id: string
  name: string
  /** Description of the gesture */
  description: string
  /** Frequency: how often this gesture occurs per minute */
  frequency: number
  /** Duration in seconds of a typical occurrence */
  duration: number
  /** Body parts involved */
  involvedParts: string[]
  /** Extracted keyframe data for the gesture */
  keyframes: GestureKeyframe[]
}

/** A single keyframe in a gesture pattern */
export interface GestureKeyframe {
  /** Normalized time 0-1 within the gesture */
  time: number
  /** Joint positions (normalized) */
  joints: Record<string, { x: number; y: number; z: number }>
}

/** Voice characteristics extracted from audio analysis */
export interface VoiceCharacteristics {
  /** Estimated pitch range (Hz) */
  pitchRange: { low: number; high: number; average: number }
  /** Speaking speed (words per minute) */
  speakingSpeed: number
  /** Estimated voice quality descriptors */
  qualities: string[]
  /** Recommended ElevenLabs voice ID (closest match) */
  recommendedVoiceId: string | null
  /** Recommended voice settings */
  voiceSettings: {
    stability: number
    similarityBoost: number
    style: number
  }
}

/** Movement style analysis results */
export interface MovementStyle {
  /** Overall energy level (0-1): calm to energetic */
  energyLevel: number
  /** Movement smoothness (0-1): jerky to smooth */
  smoothness: number
  /** Gesture amplitude (0-1): minimal to expressive */
  gestureAmplitude: number
  /** Head movement frequency (movements per minute) */
  headMovementFrequency: number
  /** Common idle behaviors */
  idleBehaviors: string[]
  /** Dominant hand (left/right/ambidextrous) */
  dominantHand: string
}

/** Complete person clone profile */
export interface PersonCloneProfile {
  id: string
  name: string
  createdAt: number
  /** Source photo data URL */
  sourcePhoto: string | null
  /** Source video URL (if video analysis was done) */
  sourceVideoUrl: string | null
  /** Facial features */
  facialFeatures: FacialFeatures
  /** Hair features */
  hairFeatures: HairFeatures
  /** Body features */
  bodyFeatures: BodyFeatures
  /** Style features */
  styleFeatures: StyleFeatures
  /** Gesture patterns (from video) */
  gesturePatterns: GesturePattern[]
  /** Voice characteristics (from audio) */
  voiceCharacteristics: VoiceCharacteristics | null
  /** Movement style (from video) */
  movementStyle: MovementStyle | null
  /** Character generation prompt (assembled from features) */
  generationPrompt: string
  /** Likeness strength 0-100 */
  likenessStrength: number
  /** Art style for generation */
  artStyle: PersonCloneStyle
  /** Generated character ID (once character is created) */
  generatedCharacterId: string | null
}

/** Available art styles for clone generation */
export type PersonCloneStyle =
  | 'cartoon'
  | 'anime'
  | 'semi-realistic'
  | 'chibi'
  | 'pixel-art'
  | 'comic-book'
  | 'watercolor'

/** Style modifiers for each art style */
export const CLONE_STYLE_MODIFIERS: Record<PersonCloneStyle, string> = {
  cartoon: 'modern cartoon style, clean bold lines, vibrant colors, slightly exaggerated proportions',
  anime: 'anime art style, large expressive eyes, detailed hair, Japanese animation aesthetic',
  'semi-realistic': 'semi-realistic digital art, detailed shading, natural proportions, painterly rendering',
  chibi: 'chibi style, super deformed proportions, large head, small body, cute and simple',
  'pixel-art': 'pixel art style, retro 16-bit aesthetic, clean pixel edges, limited color palette',
  'comic-book': 'comic book style, bold outlines, dramatic shading, halftone dots, dynamic poses',
  watercolor: 'watercolor illustration style, soft edges, translucent colors, gentle brush strokes',
}

/** Status of the person clone pipeline */
export type PersonCloneStatus =
  | 'idle'
  | 'analyzing-photo'
  | 'analyzing-video'
  | 'extracting-gestures'
  | 'analyzing-voice'
  | 'building-profile'
  | 'generating-character'
  | 'complete'
  | 'error'

/** Progress info for the person clone pipeline */
export interface PersonCloneProgress {
  status: PersonCloneStatus
  message: string
  percentage: number
  error?: string
}

/** Create an empty person clone profile */
export function createEmptyCloneProfile(id: string, name: string): PersonCloneProfile {
  return {
    id,
    name,
    createdAt: Date.now(),
    sourcePhoto: null,
    sourceVideoUrl: null,
    facialFeatures: {
      faceShape: '',
      eyeSpacing: '',
      eyeShape: '',
      eyeColor: '',
      noseShape: '',
      mouthShape: '',
      chinShape: '',
      cheekStructure: '',
      foreheadSize: '',
    },
    hairFeatures: { style: '', color: '', length: '', texture: '', partSide: '' },
    bodyFeatures: { height: '', build: '', skinTone: '', posture: '' },
    styleFeatures: { clothingStyle: '', primaryColors: [], accessories: [], distinctiveFeatures: [] },
    gesturePatterns: [],
    voiceCharacteristics: null,
    movementStyle: null,
    generationPrompt: '',
    likenessStrength: 75,
    artStyle: 'cartoon',
    generatedCharacterId: null,
  }
}
