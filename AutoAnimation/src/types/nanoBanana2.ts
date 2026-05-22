/**
 * Nano Banana 2 Character Generator Types
 *
 * Defines types for the NB2 pipeline that generates all character parts
 * (body, head, hair, visemes, eyes, eyebrows, clothing) in a single
 * automated pipeline using the Gemini 3.1 Flash Image model.
 */

import type { CurvedVisemeSprites } from './nanoBanana'
import type { EyeVariantSprites, EyebrowVariantSprites } from './emotionHeads'

// ── Grid Size ────────────────────────────────────────────────────────

export interface NB2GridSize {
  cols: number
  rows: number
}

// ── Resolution & Aspect Ratio ─────────────────────────────────────────

export type NB2Resolution = '512' | '1024' | '2048' | '4096'

export type NB2AspectRatio = '1:1' | '3:2' | '2:3' | '3:4' | '4:3' | '9:16' | '16:9'

// ── Part Types ────────────────────────────────────────────────────────

export type NB2PartType =
  | 'concept'
  | 'body'
  | 'head'
  | 'hair'
  | 'viseme-sheet'
  | 'eye-strip'
  | 'eyebrow-strip'
  | 'clothing'

export const NB2_PART_TYPES: NB2PartType[] = [
  'concept',
  'body',
  'head',
  'hair',
  'viseme-sheet',
  'eye-strip',
  'eyebrow-strip',
  'clothing',
]

export const NB2_PART_LABELS: Record<NB2PartType, string> = {
  concept: 'Character Concept',
  body: 'Body Sprite',
  head: 'Head Sprite',
  hair: 'Hair Grid (24)',
  'viseme-sheet': 'Viseme Sheet (36)',
  'eye-strip': 'Eye Grid (6)',
  'eyebrow-strip': 'Eyebrow Grid (6)',
  clothing: 'Clothing Grid (9)',
}

// ── Character Category ───────────────────────────────────────────────

export type NB2CharacterCategory = 'humanoid' | 'animal' | 'insect' | 'object' | 'vehicle' | 'food' | 'plant'

export const NB2_CHARACTER_CATEGORIES: { id: NB2CharacterCategory; label: string }[] = [
  { id: 'humanoid', label: 'Humanoid' },
  { id: 'animal', label: 'Animal' },
  { id: 'insect', label: 'Insect' },
  { id: 'object', label: 'Object' },
  { id: 'vehicle', label: 'Vehicle' },
  { id: 'food', label: 'Food' },
  { id: 'plant', label: 'Plant' },
]

/** Which generation steps each category uses. Steps not listed are auto-skipped. */
export const NB2_CATEGORY_STEPS: Record<NB2CharacterCategory, NB2PartType[]> = {
  humanoid: ['concept', 'body', 'head', 'hair', 'viseme-sheet', 'eye-strip', 'eyebrow-strip', 'clothing'],
  animal: ['concept', 'body', 'head', 'viseme-sheet', 'eye-strip'],
  insect: ['concept', 'body', 'head', 'eye-strip'],
  object: ['concept'],
  vehicle: ['concept'],
  food: ['concept', 'viseme-sheet', 'eye-strip'],
  plant: ['concept', 'body', 'viseme-sheet', 'eye-strip'],
}

// ── Pipeline Options & Progress ──────────────────────────────────────

export type NB2Gender = 'male' | 'female' | 'neutral'

// ── Viseme Phase ─────────────────────────────────────────────────────

/** Multi-phase viseme generation: neutral first, then curvatures after confirmation */
export type NB2VisemePhase = 'neutral' | 'confirming' | 'curvatures' | 'done'

export interface NB2PipelineOptions {
  prompt: string
  styleReference: string | null // base64 data URL
  layoutReference: string | null // base64 data URL
  characterName?: string
  gender?: NB2Gender
  resolution?: NB2Resolution
  aspectRatio?: NB2AspectRatio
}

export interface NB2StepStatus {
  id: NB2PartType
  label: string
  status: 'pending' | 'generating' | 'complete' | 'error' | 'skipped'
  result?: string // base64 data URL of generated image
  error?: string
  prompt?: string // the full prompt sent to AI (echoed by server)
}

// ── Pipeline Result ──────────────────────────────────────────────────

export interface NB2PipelineResult {
  concept: string | null
  body: string | null
  head: string | null
  hair: string[] | null
  hairSheet: string | null
  curvedVisemes: CurvedVisemeSprites | null
  visemeSheet: string | null
  visemeNeutralSheet: string | null
  visemeUpwardSheet: string | null
  visemeDownwardSheet: string | null
  eyeVariants: EyeVariantSprites | null
  eyeSheet: string | null
  eyebrowVariants: EyebrowVariantSprites | null
  eyebrowSheet: string | null
  clothing: {
    shirt: string[]
    pants: string[]
    shoes: string[]
  } | null
  clothingSheet: string | null
}

// ── API Request/Response ─────────────────────────────────────────────

export interface NB2GenerateRequest {
  partType: NB2PartType
  prompt: string
  styleReference?: string // base64 (no data: prefix)
  layoutReference?: string // base64 (no data: prefix)
  conceptImage?: string // base64 (no data: prefix)
  gridReference?: string // base64 (no data: prefix) — tiled head grid for spatial context
  resolution?: NB2Resolution
  aspectRatio?: NB2AspectRatio
  customPrompt?: string // override server-side buildPrompt — send the full prompt directly
}

export interface NB2GenerateResponse {
  image: string // base64
  mimeType: string
  partType: NB2PartType
  gridSize?: { columns: number; rows: number }
  prompt?: string // server echoes the built prompt
}
