/**
 * Eye & Eyebrow Variant Sprite Sheet Generation Service
 *
 * Generates eye variant and eyebrow variant sprite sheets via the backend
 * Vertex AI endpoint, then slices them into individual sprites.
 *
 * Eye variants (6): neutral, happy, sad, angry, shocked, suspicious
 * Eyebrow variants (6): neutral, happy, sad, angry, shocked, suspicious
 *
 * Replaces the old 6x4 emotion head sheet (24 heads) with two 1x6 strips
 * (or a single 2x6 sheet with row 0 = eyes, row 1 = eyebrows).
 */

import type { GenerationProgress } from '@/types/nanoBanana'
import { withCreditGate } from './creditGate'
import {
  EYE_VARIANTS,
  EYEBROW_VARIANTS,
  EMOTION_CATEGORIES,
  createEmptyEyeVariantSet,
  createEmptyEyebrowVariantSet,
  type EyeVariant,
  type EyebrowVariant,
  type EyeVariantSprites,
  type EyebrowVariantSprites,
  type EmotionCategory,
} from '@/types/emotionHeads'

export interface ExpressionSheetResult {
  /** base64 image of the eye variants strip (1x6 or row 0 of 2x6) */
  eyeSheet: string
  /** base64 image of the eyebrow variants strip (1x6 or row 1 of 2x6) */
  eyebrowSheet: string
  gridSize: { columns: number; rows: number }
}

export interface ExpressionVariantGenerationOptions {
  referenceImage: string // base64 data URL
  stylePrompt?: string
}

/** Result type for the main generation function */
export interface ExpressionVariantsResult {
  eyeVariants: EyeVariantSprites
  eyebrowVariants: EyebrowVariantSprites
}

/**
 * Generate the eye + eyebrow variant sprite sheets via the backend API.
 *
 * The backend endpoint is expected to return either:
 * - A single 2x6 sheet (row 0 = eyes, row 1 = eyebrows), or
 * - Two separate 1x6 sheets (eyeSheet + eyebrowSheet).
 */
export async function generateExpressionVariantSheets(
  options: ExpressionVariantGenerationOptions,
  onProgress?: (progress: GenerationProgress) => void
): Promise<ExpressionSheetResult | null> {
  return withCreditGate('vertex-emotion-heads', async () => {
    onProgress?.({
      total: 1,
      completed: 0,
      current: 'Generating expression variant sheets...',
      status: 'generating',
    })

    try {
      const apiBase = import.meta.env.VITE_API_URL || ''
      const response = await fetch(`${apiBase}/api/generate-emotion-heads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceImage: options.referenceImage,
          stylePrompt: options.stylePrompt,
          // Signal to backend that we want eye/eyebrow variants (not legacy 24-head grid)
          variantMode: 'eye-eyebrow',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `Generation failed: ${response.statusText}`)
      }

      const data = await response.json()

      // Support both new (eyeSheet/eyebrowSheet) and legacy (emotionSheet) response formats
      if (data.eyeSheet && data.eyebrowSheet) {
        onProgress?.({
          total: 1,
          completed: 1,
          current: 'Expression variant sheets complete!',
          status: 'complete',
        })
        return {
          eyeSheet: data.eyeSheet,
          eyebrowSheet: data.eyebrowSheet,
          gridSize: data.gridSize || { columns: 6, rows: 1 },
        }
      }

      // Fallback: if backend returns a single 2-row sheet (row 0 = eyes, row 1 = eyebrows)
      if (data.emotionSheet) {
        onProgress?.({
          total: 1,
          completed: 1,
          current: 'Expression sheet complete (legacy format)!',
          status: 'complete',
        })
        return {
          eyeSheet: data.emotionSheet,
          eyebrowSheet: data.emotionSheet,
          gridSize: data.gridSize || { columns: 6, rows: 2 },
        }
      }

      throw new Error('No expression variant sheets in response')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      onProgress?.({
        total: 1,
        completed: 0,
        current: errorMessage,
        status: 'error',
        error: errorMessage,
      })
      throw error
    }
  })
}

/**
 * Slice a 1x6 strip into 6 individual variant sprites.
 * Column order: neutral, happy, sad, angry, shocked, suspicious
 */
export async function sliceVariantStrip(
  sheetDataUrl: string,
  variants: readonly string[]
): Promise<Record<string, string | null>> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const columns = variants.length // 6
      const cellWidth = img.width / columns
      const cellHeight = img.height
      const results: Record<string, string | null> = {}
      for (const v of variants) results[v] = null

      const canvas = document.createElement('canvas')
      canvas.width = cellWidth
      canvas.height = cellHeight
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Could not create canvas context'))
        return
      }

      variants.forEach((variant, colIndex) => {
        ctx.clearRect(0, 0, cellWidth, cellHeight)
        ctx.drawImage(
          img,
          colIndex * cellWidth,
          0,
          cellWidth,
          cellHeight,
          0,
          0,
          cellWidth,
          cellHeight
        )
        results[variant] = canvas.toDataURL('image/png')
      })

      resolve(results)
    }

    img.onerror = () => reject(new Error('Failed to load variant strip'))
    img.src = sheetDataUrl.startsWith('data:')
      ? sheetDataUrl
      : `data:image/png;base64,${sheetDataUrl}`
  })
}

/**
 * Slice a 2-row combined sheet (row 0 = eyes, row 1 = eyebrows) into variants.
 */
export async function sliceCombinedExpressionSheet(
  sheetDataUrl: string
): Promise<ExpressionVariantsResult> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const columns = 6
      const rows = 2
      const cellWidth = img.width / columns
      const cellHeight = img.height / rows
      const eyeResults = createEmptyEyeVariantSet()
      const eyebrowResults = createEmptyEyebrowVariantSet()

      const canvas = document.createElement('canvas')
      canvas.width = cellWidth
      canvas.height = cellHeight
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Could not create canvas context'))
        return
      }

      // Row 0: eyes
      EYE_VARIANTS.forEach((variant, colIndex) => {
        ctx.clearRect(0, 0, cellWidth, cellHeight)
        ctx.drawImage(
          img,
          colIndex * cellWidth,
          0, // row 0
          cellWidth,
          cellHeight,
          0,
          0,
          cellWidth,
          cellHeight
        )
        eyeResults[variant] = canvas.toDataURL('image/png')
      })

      // Row 1: eyebrows
      EYEBROW_VARIANTS.forEach((variant, colIndex) => {
        ctx.clearRect(0, 0, cellWidth, cellHeight)
        ctx.drawImage(
          img,
          colIndex * cellWidth,
          cellHeight, // row 1
          cellWidth,
          cellHeight,
          0,
          0,
          cellWidth,
          cellHeight
        )
        eyebrowResults[variant] = canvas.toDataURL('image/png')
      })

      resolve({ eyeVariants: eyeResults, eyebrowVariants: eyebrowResults })
    }

    img.onerror = () => reject(new Error('Failed to load expression sheet'))
    img.src = sheetDataUrl.startsWith('data:')
      ? sheetDataUrl
      : `data:image/png;base64,${sheetDataUrl}`
  })
}

/**
 * Main function: Generate eye + eyebrow variant sheets and slice into individual sprites.
 *
 * This replaces the old `generateAllEmotionHeads` function.
 * The function name is kept as `generateAllEmotionHeads` for backward compatibility
 * with existing callers (e.g. CharacterGeneratorPanel), but the return type has changed.
 */
export async function generateAllEmotionHeads(
  options: ExpressionVariantGenerationOptions,
  onProgress?: (progress: GenerationProgress) => void
): Promise<ExpressionVariantsResult> {
  const totalVariants = EYE_VARIANTS.length + EYEBROW_VARIANTS.length // 12

  onProgress?.({
    total: totalVariants,
    completed: 0,
    current: 'Generating eye & eyebrow variant sheets...',
    status: 'generating',
  })

  // Step 1: Generate the sheets
  const sheetResult = await generateExpressionVariantSheets(options, (p) => {
    onProgress?.({
      total: totalVariants,
      completed: p.status === 'complete' ? 6 : 0,
      current: p.current,
      status: p.status,
      error: p.error,
    })
  })

  if (!sheetResult) {
    throw new Error('Failed to generate expression variant sheets')
  }

  onProgress?.({
    total: totalVariants,
    completed: 6,
    current: 'Slicing into individual variants...',
    status: 'generating',
  })

  // Step 2: Slice into individual sprites
  let eyeVariants: EyeVariantSprites
  let eyebrowVariants: EyebrowVariantSprites

  if (sheetResult.gridSize.rows === 2 && sheetResult.eyeSheet === sheetResult.eyebrowSheet) {
    // Combined 2-row sheet
    const combined = await sliceCombinedExpressionSheet(sheetResult.eyeSheet)
    eyeVariants = combined.eyeVariants
    eyebrowVariants = combined.eyebrowVariants
  } else {
    // Separate 1-row strips
    const eyeSliced = await sliceVariantStrip(sheetResult.eyeSheet, EYE_VARIANTS)
    const eyebrowSliced = await sliceVariantStrip(sheetResult.eyebrowSheet, EYEBROW_VARIANTS)
    eyeVariants = eyeSliced as EyeVariantSprites
    eyebrowVariants = eyebrowSliced as EyebrowVariantSprites
  }

  const eyeCount = Object.values(eyeVariants).filter((s) => s !== null).length
  const eyebrowCount = Object.values(eyebrowVariants).filter((s) => s !== null).length
  const successCount = eyeCount + eyebrowCount

  onProgress?.({
    total: totalVariants,
    completed: successCount,
    current:
      successCount === totalVariants
        ? 'All expression variants ready!'
        : `${eyeCount}/6 eyes, ${eyebrowCount}/6 eyebrows`,
    status: successCount > 0 ? 'complete' : 'error',
  })

  return { eyeVariants, eyebrowVariants }
}

/**
 * Convenience alias for the main generation function.
 */
export const generateAllExpressionVariants = generateAllEmotionHeads

/**
 * Get human-readable label for a variant.
 */
export function getVariantLabel(variant: EyeVariant | EyebrowVariant): string {
  return variant.charAt(0).toUpperCase() + variant.slice(1)
}

/**
 * Get human-readable label for an emotion category (backward compat).
 */
export function getEmotionLabel(category: EmotionCategory): string {
  return category
}

// Re-export types for convenience
export { EYE_VARIANTS, EYEBROW_VARIANTS, EMOTION_CATEGORIES, createEmptyEyeVariantSet, createEmptyEyebrowVariantSet }
export type { EyeVariantSprites, EyebrowVariantSprites, EyeVariant, EyebrowVariant, EmotionCategory }
