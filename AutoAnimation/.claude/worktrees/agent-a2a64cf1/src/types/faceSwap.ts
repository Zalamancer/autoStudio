export interface FaceSwapConfig {
  sourceImageUrl: string
  targetImageUrl: string
  blendStrength: number // 0-1
  preserveExpression: boolean
  preserveLighting: boolean
  enhanceResult: boolean
}

export interface VideoFaceSwapConfig {
  sourceFaceUrl: string
  targetVideoUrl: string
  trackingSmoothing: number // 0-1
  faceIndex: number // which face in multi-face
  preserveAudio: boolean
  frameSkip: number // process every N frames
}

export interface CharacterSwapConfig {
  sourceCharacterId: string
  targetCharacterId: string
  preserveMotion: boolean
  preserveStyle: boolean
  blendMode: 'replace' | 'blend' | 'morph'
}

export interface MixedMediaPreset {
  id: string
  name: string
  category: MixedMediaCategory
  description: string
  overlayUrl?: string
  blendMode: string
  opacity: number
  filters: Record<string, number>
  animation?: { type: string; speed: number; amplitude: number }
}

export type MixedMediaCategory =
  | 'film-grain'
  | 'light-leak'
  | 'bokeh'
  | 'texture'
  | 'gradient'
  | 'vintage'
  | 'glitch'
  | 'organic'
  | 'abstract'

export interface MoodboardItem {
  id: string
  imageUrl: string
  tags: string[]
  dominantColors: string[]
  mood: string
  addedAt: number
}

export interface MoodboardConfig {
  items: MoodboardItem[]
  extractedTheme: {
    colorPalette: string[]
    mood: string
    style: string
    typography: string
    keywords: string[]
  }
}

export interface ContentScore {
  overall: number // 0-100
  composition: number
  pacing: number
  audioQuality: number
  visualAppeal: number
  hookStrength: number
  retentionPrediction: number
  suggestions: string[]
}

export interface SoulHexPalette {
  primary: string
  secondary: string
  accent: string
  background: string
  text: string
  mood: string
  harmony: 'complementary' | 'analogous' | 'triadic' | 'split-complementary'
}

export interface StyleProfile {
  colorPalette: string[]
  contrast: number
  saturation: number
  brightness: number
  grain: number
  vignetting: number
  warmth: number
  mood: string
}

export interface MotionDesignPlan {
  keyframes: Array<{
    time: number
    properties: Record<string, number | string>
    easing: string
  }>
  duration: number
  fps: number
}
