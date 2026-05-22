/**
 * Nano Banana Pro - Character Sprite Sheet Generation
 *
 * Generates a single 8x3 sprite sheet containing all 24 visemes:
 * - Row 1: Upward curvature (happy emotions) - 8 visemes
 * - Row 2: Neutral curvature (neutral emotions) - 8 visemes
 * - Row 3: Downward curvature (sad emotions) - 8 visemes
 *
 * Viseme order per row: REST, AI, E, O, U, MBP, FV, LTH
 */

import type {
  MouthCurvature,
  CurvedVisemeKey,
  GenerationOptions,
  GenerationProgress,
  CurvedVisemeSprites,
} from '@/types/nanoBanana'
import { VISEMES, CURVATURES, createEmptySpriteSet } from '@/types/nanoBanana'
import { withCreditGate } from './creditGate'

export interface FullSheetResult {
  fullSheet: string // base64 image of the full 8x3 grid
  gridSize: { columns: number; rows: number }
  visemeOrder: string[]
  curvatureOrder: string[]
}

/**
 * Get human-readable description for a curvature
 */
export function getCurvatureLabel(curvature: MouthCurvature): string {
  switch (curvature) {
    case 'upward': return 'Upward (Happy)'
    case 'neutral': return 'Neutral'
    case 'downward': return 'Downward (Sad)'
  }
}

/**
 * Generate the full 8x3 sprite sheet (24 visemes in one image)
 */
export async function generateFullSpriteSheet(
  options: GenerationOptions,
  onProgress?: (progress: GenerationProgress) => void
): Promise<FullSheetResult | null> {
  return withCreditGate('vertex-sprite-sheet', async () => {
    onProgress?.({
      total: 1,
      completed: 0,
      current: 'Generating sprite sheet...',
      status: 'generating',
    })

    try {
      const apiBase = import.meta.env.VITE_API_URL || ''
      const response = await fetch(`${apiBase}/api/generate-all-sheets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referenceImage: options.referenceImage,
        stylePrompt: options.stylePrompt,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `Generation failed: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.fullSheet) {
      onProgress?.({
        total: 1,
        completed: 1,
        current: 'Sprite sheet complete!',
        status: 'complete',
      })

      return {
        fullSheet: data.fullSheet,
        gridSize: data.gridSize || { columns: 8, rows: 3 },
        visemeOrder: data.visemeOrder || VISEMES,
        curvatureOrder: data.curvatureOrder || CURVATURES,
      }
    }

    throw new Error('No sprite sheet in response')

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
 * Slice an 8x3 sprite sheet into 24 individual viseme images
 * Grid layout: 8 columns × 3 rows
 * Row 0: upward, Row 1: neutral, Row 2: downward
 * Columns: REST, AI, E, O, U, MBP, FV, LTH
 */
export async function sliceFullSpriteSheet(
  sheetDataUrl: string
): Promise<CurvedVisemeSprites> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const columns = VISEMES.length
      const rows = 3
      const cellWidth = img.width / columns
      const cellHeight = img.height / rows
      const results = createEmptySpriteSet()

      // Create canvas for slicing
      const canvas = document.createElement('canvas')
      canvas.width = cellWidth
      canvas.height = cellHeight
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Could not create canvas context'))
        return
      }

      // Slice each cell
      // Row index maps to curvature: 0=upward, 1=neutral, 2=downward
      CURVATURES.forEach((curvature, rowIndex) => {
        VISEMES.forEach((viseme, colIndex) => {
          ctx.clearRect(0, 0, cellWidth, cellHeight)
          ctx.drawImage(
            img,
            colIndex * cellWidth, rowIndex * cellHeight, cellWidth, cellHeight,
            0, 0, cellWidth, cellHeight
          )

          const key = `${curvature}_${viseme}` as CurvedVisemeKey
          results[key] = canvas.toDataURL('image/png')
        })
      })

      resolve(results)
    }

    img.onerror = () => reject(new Error('Failed to load sprite sheet'))
    img.src = sheetDataUrl.startsWith('data:') ? sheetDataUrl : `data:image/png;base64,${sheetDataUrl}`
  })
}

/**
 * Main function: Generate the full sprite sheet and slice it into individual sprites
 */
export async function generateAllVisemeSprites(
  options: GenerationOptions,
  onProgress?: (progress: GenerationProgress) => void
): Promise<CurvedVisemeSprites> {
  onProgress?.({
    total: 24,
    completed: 0,
    current: 'Generating 8×3 sprite sheet...',
    status: 'generating',
  })

  // Step 1: Generate the full 8x3 sprite sheet
  const sheetResult = await generateFullSpriteSheet(options, (p) => {
    onProgress?.({
      total: 24,
      completed: p.status === 'complete' ? 12 : 0,
      current: p.current,
      status: p.status,
      error: p.error,
    })
  })

  if (!sheetResult) {
    throw new Error('Failed to generate sprite sheet')
  }

  onProgress?.({
    total: 24,
    completed: 12,
    current: 'Slicing into individual sprites...',
    status: 'generating',
  })

  // Step 2: Slice into 24 individual sprites
  const sprites = await sliceFullSpriteSheet(sheetResult.fullSheet)

  const successCount = Object.values(sprites).filter(s => s !== null).length

  onProgress?.({
    total: 24,
    completed: successCount,
    current: successCount === 24 ? 'All sprites ready!' : `${successCount}/24 sprites`,
    status: successCount > 0 ? 'complete' : 'error',
  })

  return sprites
}

// Re-export types and constants for convenience
export { VISEMES, CURVATURES, createEmptySpriteSet }
export type { GenerationProgress, CurvedVisemeSprites, MouthCurvature, CurvedVisemeKey }
