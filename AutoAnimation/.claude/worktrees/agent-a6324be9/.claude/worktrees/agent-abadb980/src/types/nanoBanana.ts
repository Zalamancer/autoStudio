import type { Viseme } from './voice'

// Mouth curvature based on emotion
export type MouthCurvature = 'upward' | 'neutral' | 'downward'

// Combined key for 27-sprite system: curvature_viseme (3 curvatures × 9 visemes)
export type CurvedVisemeKey = `${MouthCurvature}_${Viseme}`

// All possible viseme types (9 visemes)
export const VISEMES: Viseme[] = ['Rest', 'Aa', 'Ee', 'Oh', 'Oo', 'FV', 'MBP', 'DTL', 'ChR']

// All possible curvatures
export const CURVATURES: MouthCurvature[] = ['upward', 'neutral', 'downward']

// Generation options for sprite creation
export interface GenerationOptions {
  referenceImage: string  // base64 data URL
  stylePrompt?: string    // optional style description (e.g., "anime style", "cartoon")
}

// Progress tracking for generation
export interface GenerationProgress {
  total: number
  completed: number
  current: string  // e.g., "upward_AI"
  status: 'idle' | 'generating' | 'complete' | 'error'
  error?: string
}

// Result from single sprite generation
export interface SpriteGenerationResult {
  key: CurvedVisemeKey
  image?: string  // base64 data
  error?: string
}

// Full character sprite set (27 sprites: 9 visemes × 3 curvatures)
export type CurvedVisemeSprites = Record<CurvedVisemeKey, string | null>

// Helper to get all 27 viseme keys
export function getAllVisemeKeys(): CurvedVisemeKey[] {
  return CURVATURES.flatMap(curvature =>
    VISEMES.map(viseme => `${curvature}_${viseme}` as CurvedVisemeKey)
  )
}

// Helper to parse a curved viseme key
export function parseCurvedVisemeKey(key: CurvedVisemeKey): { curvature: MouthCurvature; viseme: Viseme } {
  const [curvature, viseme] = key.split('_') as [MouthCurvature, Viseme]
  return { curvature, viseme }
}

// Create an empty sprite set
export function createEmptySpriteSet(): CurvedVisemeSprites {
  return Object.fromEntries(
    getAllVisemeKeys().map(key => [key, null])
  ) as CurvedVisemeSprites
}
