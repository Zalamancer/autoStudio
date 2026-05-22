/**
 * Enhanced Virality Scoring Types
 */

export interface ViralityDimension {
  name: string
  score: number // 0-100
  label: string
  description: string
  weight: number // contribution to overall score
}

export interface ViralityImprovement {
  dimension: string
  description: string
  impact: 'high' | 'medium' | 'low'
  /** Action that can be auto-applied */
  autoApply?: () => void
}

export interface ViralityAnalysis {
  overall: number // 0-100 weighted average
  dimensions: ViralityDimension[]
  improvements: ViralityImprovement[]
  /** Percentile relative to historical benchmarks (0-100) */
  percentile?: number
  /** Whether this used deep analysis (Gemini) or fast (client-side) */
  mode: 'fast' | 'deep'
  /** Timestamp of analysis */
  timestamp: number
}

/** Input data collected from stores for fast analysis */
export interface ViralityAnalysisInput {
  // Timing
  durationSeconds: number
  fps: number
  totalFrames: number

  // Content
  dialogueLineCount: number
  totalWordCount: number
  /** Words per minute speaking rate */
  wpm: number
  /** Number of distinct emotions used */
  emotionVariety: number
  /** Whether the first 3 seconds have dialogue */
  hasEarlyHook: boolean
  /** First line text (for hook analysis) */
  firstLineText: string

  // Visual
  sceneChangeCount: number
  templateCount: number
  stockMediaCount: number
  svgObjectCount: number
  shapeCount: number

  // Audio
  hasBackgroundMusic: boolean
  hasSoundEffects: boolean
  soundEffectCount: number

  // Captions
  captionStyle: string
  hasCaptions: boolean

  // Text
  textOverlayCount: number
  hasCTA: boolean

  // Platform
  aspectRatio: string
  targetPlatform?: string
}
