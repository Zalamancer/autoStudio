/**
 * Nano Banana 2 — Full Character Generation Pipeline
 *
 * Orchestrates 8 sequential API calls to generate all character parts:
 * 1. concept — full character image from style + layout refs + prompt
 * 2. body — body sprite (no head/hair, T-pose, underwear)
 * 3. head — featureless head sprite (no hair)
 * 4. hair — 6×4 grid of hairstyle options → 24 individual sprites
 * 5. viseme-sheet — 12×3 mouth grid → 36 viseme sprites
 * 6. eye-strip — 3×2 grid of eye variants → 6 sprites
 * 7. eyebrow-strip — 3×2 grid of eyebrow variants → 6 sprites
 * 8. clothing — 3×3 grid (3 outfits × shirt/pants/shoes)
 */

import type {
  NB2PartType,
  NB2PipelineOptions,
  NB2StepStatus,
  NB2PipelineResult,
  NB2GenerateResponse,
  NB2Resolution,
  NB2AspectRatio,
  NB2GridSize,
} from '@/types/nanoBanana2'
import { NB2_PART_TYPES, NB2_PART_LABELS } from '@/types/nanoBanana2'
import type { CurvedVisemeSprites, CurvedVisemeKey } from '@/types/nanoBanana'
import { VISEMES, createEmptySpriteSet } from '@/types/nanoBanana'
import type { EyeVariantSprites, EyebrowVariantSprites } from '@/types/emotionHeads'
import { EYE_VARIANTS, EYEBROW_VARIANTS } from '@/types/emotionHeads'
import {
  createEmptyGridReference,
  gridRefDimensionsForAR,
  removeGridLines,
  removeChromaKey,
} from './gridReferenceGenerator'
import { buildVisemeCurvaturePrompt } from './nb2Prompts'
import { withCreditGate } from './creditGate'
import { useAuthStore } from '@/stores/useAuthStore'

// ── API Call ─────────────────────────────────────────────────────────

const apiBase = import.meta.env.VITE_API_URL || ''

async function callNB2API(
  partType: NB2PartType,
  prompt: string,
  styleReference: string | null,
  layoutReference: string | null,
  conceptImage: string | null,
  signal?: AbortSignal,
  resolution?: NB2Resolution,
  customPrompt?: string,
  gridReference?: string | null,
  aspectRatio?: NB2AspectRatio,
): Promise<NB2GenerateResponse> {
  const body: Record<string, string> = { partType, prompt }

  if (styleReference) {
    body.styleReference = styleReference
  }
  if (layoutReference) {
    body.layoutReference = layoutReference
  }
  if (conceptImage) {
    body.conceptImage = conceptImage
  }
  if (gridReference) {
    body.gridReference = gridReference
  }
  if (resolution) {
    body.resolution = resolution
  }
  if (aspectRatio) {
    body.aspectRatio = aspectRatio
  }
  if (customPrompt) {
    body.customPrompt = customPrompt
  }

  // Combine user abort signal with a 3-minute timeout
  const timeout = AbortSignal.timeout(180_000)
  const combinedSignal = signal ? AbortSignal.any([signal, timeout]) : timeout

  const token = useAuthStore.getState().session?.access_token
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${apiBase}/api/nb2/generate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: combinedSignal,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || errorData.error || `Generation failed: ${response.statusText}`)
  }

  return response.json()
}

// ── Post-process: remove grid lines + chroma key from generated grids ──

/**
 * Post-process a generated grid image:
 * 1. Remove grid lines at expected positions (Gemini often renders them despite instructions)
 * 2. Remove chroma key background (green/blue screen → transparent)
 */
async function postProcessGridImage(
  dataUrl: string,
  cols: number,
  rows: number,
  rowRatios?: readonly number[],
): Promise<string> {
  let result = dataUrl
  try {
    result = await removeGridLines(result, cols, rows, rowRatios)
  } catch {
    /* skip */
  }
  try {
    result = await removeChromaKey(result)
  } catch {
    /* skip */
  }
  return result
}

/**
 * Post-process a non-grid image (concept/body/head): remove chroma key only.
 */
async function postProcessSingleImage(dataUrl: string): Promise<string> {
  try {
    return await removeChromaKey(dataUrl)
  } catch {
    return dataUrl
  }
}

// ── Hair Grid Slicer (dynamic cols×rows) ─────────────────────────────

async function sliceHairGrid(sheetDataUrl: string, cols = 6, rows = 4): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const cellWidth = img.width / cols
      const cellHeight = img.height / rows
      const results: string[] = []

      const canvas = document.createElement('canvas')
      canvas.width = cellWidth
      canvas.height = cellHeight
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Could not create canvas context'))
        return
      }

      // Row-major order
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          ctx.clearRect(0, 0, cellWidth, cellHeight)
          ctx.drawImage(img, col * cellWidth, row * cellHeight, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight)
          results.push(canvas.toDataURL('image/png'))
        }
      }

      resolve(results)
    }

    img.onerror = () => reject(new Error('Failed to load hair grid'))
    img.src = sheetDataUrl.startsWith('data:') ? sheetDataUrl : `data:image/png;base64,${sheetDataUrl}`
  })
}

// ── Grid Variant Slicer (3×2 → 6 keyed variants) ────────────────────

/**
 * Slice a grid into keyed variants (row-major order).
 * Used for eye and eyebrow grids.
 */
async function sliceGridVariants(
  sheetDataUrl: string,
  variants: readonly string[],
  cols = 3,
  rows = 2,
): Promise<Record<string, string | null>> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const cellWidth = img.width / cols
      const cellHeight = img.height / rows
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

      // Row-major: top-left to bottom-right
      let idx = 0
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (idx >= variants.length) break
          ctx.clearRect(0, 0, cellWidth, cellHeight)
          ctx.drawImage(img, col * cellWidth, row * cellHeight, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight)
          results[variants[idx]] = canvas.toDataURL('image/png')
          idx++
        }
      }

      resolve(results)
    }

    img.onerror = () => reject(new Error('Failed to load variant grid'))
    img.src = sheetDataUrl.startsWith('data:') ? sheetDataUrl : `data:image/png;base64,${sheetDataUrl}`
  })
}

// ── Clothing Grid Slicer (proportional rows: 40% shirt, 50% pants, 10% shoes) ─

/** Default row height ratios for clothing grid */
export const DEFAULT_CLOTHING_ROW_RATIOS = [0.4, 0.5, 0.1] as const

async function sliceClothingGrid(
  sheetDataUrl: string,
  cols = 3,
  _rows = 3,
  rowRatios: readonly number[] = DEFAULT_CLOTHING_ROW_RATIOS,
): Promise<{ shirt: string[]; pants: string[]; shoes: string[] }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const colWidth = img.width / cols
      const rowKeys = ['shirt', 'pants', 'shoes'] as const
      const results: { shirt: string[]; pants: string[]; shoes: string[] } = {
        shirt: [],
        pants: [],
        shoes: [],
      }

      // Calculate proportional row heights
      const rowHeights = rowRatios.map((ratio) => Math.round(img.height * ratio))

      const canvas = document.createElement('canvas')
      canvas.width = colWidth
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Could not create canvas context'))
        return
      }

      let yOffset = 0
      for (let rowIdx = 0; rowIdx < rowKeys.length; rowIdx++) {
        const rowH = rowHeights[rowIdx]
        canvas.height = rowH

        for (let col = 0; col < cols; col++) {
          ctx.clearRect(0, 0, colWidth, rowH)
          ctx.drawImage(img, col * colWidth, yOffset, colWidth, rowH, 0, 0, colWidth, rowH)
          results[rowKeys[rowIdx]].push(canvas.toDataURL('image/png'))
        }
        yOffset += rowH
      }

      resolve(results)
    }

    img.onerror = () => reject(new Error('Failed to load clothing grid'))
    img.src = sheetDataUrl.startsWith('data:') ? sheetDataUrl : `data:image/png;base64,${sheetDataUrl}`
  })
}

// ── Single Viseme Sheet Slicer (cols×rows → 12 keyed visemes) ────────

/**
 * Slice a single-curvature viseme sheet into individual viseme sprites.
 * Maps grid cells (row-major) to VISEMES array order (Aa, D, Ee, ..., Rest).
 */
export async function sliceSingleVisemeSheet(
  sheetDataUrl: string,
  cols: number,
  rows: number,
): Promise<Record<string, string | null>> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const cellWidth = img.width / cols
      const cellHeight = img.height / rows
      const results: Record<string, string | null> = {}
      for (const v of VISEMES) results[v] = null

      const canvas = document.createElement('canvas')
      canvas.width = cellWidth
      canvas.height = cellHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not create canvas context'))
        return
      }

      let idx = 0
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (idx >= VISEMES.length) break
          ctx.clearRect(0, 0, cellWidth, cellHeight)
          ctx.drawImage(img, col * cellWidth, row * cellHeight, cellWidth, cellHeight, 0, 0, cellWidth, cellHeight)
          results[VISEMES[idx]] = canvas.toDataURL('image/png')
          idx++
        }
      }

      resolve(results)
    }
    img.onerror = () => reject(new Error('Failed to load viseme sheet'))
    img.src = sheetDataUrl.startsWith('data:') ? sheetDataUrl : `data:image/png;base64,${sheetDataUrl}`
  })
}

/**
 * Combine three single-curvature viseme maps into one CurvedVisemeSprites.
 */
export function combineVisemeSheetsIntoCurved(
  neutral: Record<string, string | null>,
  upward: Record<string, string | null>,
  downward: Record<string, string | null>,
): CurvedVisemeSprites {
  const result = createEmptySpriteSet()
  for (const viseme of VISEMES) {
    result[`upward_${viseme}` as CurvedVisemeKey] = upward[viseme] ?? null
    result[`neutral_${viseme}` as CurvedVisemeKey] = neutral[viseme] ?? null
    result[`downward_${viseme}` as CurvedVisemeKey] = downward[viseme] ?? null
  }
  return result
}

// ── Grid Reference Generation (empty grids, no tiled heads) ─────────

interface GridRefs {
  hair: string
  viseme: string
  eye: string
  eyebrow: string
  clothing: string
}

function generateGridRefs(
  sizes?: Partial<Record<NB2PartType, NB2GridSize>>,
  aspectRatio?: string,
  clothingRowRatios?: readonly number[],
): GridRefs {
  const [w, h] = gridRefDimensionsForAR(aspectRatio)
  const hair = sizes?.['hair'] ?? { cols: 4, rows: 3 }
  const viseme = sizes?.['viseme-sheet'] ?? { cols: 3, rows: 9 }
  const eye = sizes?.['eye-strip'] ?? { cols: 3, rows: 2 }
  const eyebrow = sizes?.['eyebrow-strip'] ?? { cols: 3, rows: 2 }
  const clothing = sizes?.['clothing'] ?? { cols: 3, rows: 3 }

  // No labels on grid refs sent to Gemini — labels caused AI to reproduce them in output.
  // Labels are shown only in the UI overlay (NB2ImageViewer GridOverlay component).
  return {
    hair: createEmptyGridReference(hair.cols, hair.rows, w, h),
    viseme: createEmptyGridReference(viseme.cols, viseme.rows, w, h),
    eye: createEmptyGridReference(eye.cols, eye.rows, w, h),
    eyebrow: createEmptyGridReference(eyebrow.cols, eyebrow.rows, w, h),
    clothing: createEmptyGridReference(clothing.cols, clothing.rows, w, h, clothingRowRatios),
  }
}

// ── SVG-aware Grid Slicer (preserves vector format via viewBox) ──────

function isSvgDataUrl(url: string): boolean {
  return url.startsWith('data:image/svg+xml')
}

/**
 * Slice an SVG data URL into grid cells using viewBox manipulation,
 * preserving the vector format (no canvas rasterization).
 *
 * @param svgDataUrl - SVG data URL (base64 or URL-encoded)
 * @param cols - Number of columns
 * @param rows - Number of rows
 * @param rowRatios - Optional proportional row heights (for clothing grids)
 * @returns Array of SVG data URLs (one per cell, row-major order)
 */
function sliceSvgGrid(svgDataUrl: string, cols: number, rows: number, rowRatios?: readonly number[]): string[] {
  // Decode SVG string from data URL
  let svgString: string
  const commaIdx = svgDataUrl.indexOf(',')
  const meta = svgDataUrl.slice(0, commaIdx)
  const payload = svgDataUrl.slice(commaIdx + 1)
  if (meta.includes('base64')) {
    svgString = decodeURIComponent(escape(atob(payload)))
  } else {
    svgString = decodeURIComponent(payload)
  }

  // Parse SVG to extract dimensions
  const parser = new DOMParser()
  const doc = parser.parseFromString(svgString, 'image/svg+xml')
  const svgEl = doc.documentElement

  let origWidth = 0,
    origHeight = 0,
    vbMinX = 0,
    vbMinY = 0
  const viewBox = svgEl.getAttribute('viewBox')
  if (viewBox) {
    const parts = viewBox
      .trim()
      .split(/[\s,]+/)
      .map(Number)
    vbMinX = parts[0] || 0
    vbMinY = parts[1] || 0
    origWidth = parts[2] || 0
    origHeight = parts[3] || 0
  }
  if (!origWidth) origWidth = parseFloat(svgEl.getAttribute('width') || '0')
  if (!origHeight) origHeight = parseFloat(svgEl.getAttribute('height') || '0')

  const cellW = origWidth / cols
  const innerContent = svgEl.innerHTML

  // Collect namespace declarations
  const nsAttrs: string[] = []
  for (const attr of Array.from(svgEl.attributes)) {
    if (attr.name.startsWith('xmlns')) {
      nsAttrs.push(`${attr.name}="${attr.value}"`)
    }
  }
  const xmlns = nsAttrs.length > 0 ? nsAttrs.join(' ') : 'xmlns="http://www.w3.org/2000/svg"'

  // Compute row heights (proportional or equal)
  const rowHeights: number[] = []
  if (rowRatios && rowRatios.length === rows) {
    for (const ratio of rowRatios) rowHeights.push(origHeight * ratio)
  } else {
    const cellH = origHeight / rows
    for (let i = 0; i < rows; i++) rowHeights.push(cellH)
  }

  const slices: string[] = []
  let yOffset = vbMinY
  for (let row = 0; row < rows; row++) {
    const cellH = rowHeights[row]
    for (let col = 0; col < cols; col++) {
      const x = vbMinX + col * cellW
      const sliceSvg = `<svg ${xmlns} width="${cellW}" height="${cellH}" viewBox="${x} ${yOffset} ${cellW} ${cellH}">${innerContent}</svg>`
      const encoded = btoa(unescape(encodeURIComponent(sliceSvg)))
      slices.push(`data:image/svg+xml;base64,${encoded}`)
    }
    yOffset += cellH
  }
  return slices
}

// ── Crop Step Result (post-processing pipeline entry point) ──────────

/**
 * Dispatch to the right slicer based on step type.
 * Returns { savedImages, labels } ready for the right panel.
 */
export async function cropStepResult(
  partType: NB2PartType,
  imageDataUrl: string,
  gridSize?: NB2GridSize,
  clothingRowRatios?: readonly number[],
): Promise<{ savedImages: Record<string, string[]>; labels: Record<string, string[]> }> {
  const svg = isSvgDataUrl(imageDataUrl)

  switch (partType) {
    case 'body':
      return { savedImages: { body: [imageDataUrl] }, labels: { body: ['Body'] } }

    case 'head':
      return { savedImages: { head: [imageDataUrl] }, labels: { head: ['Head'] } }

    case 'hair': {
      const cols = gridSize?.cols ?? 6
      const rows = gridSize?.rows ?? 4
      const sprites = svg ? sliceSvgGrid(imageDataUrl, cols, rows) : await sliceHairGrid(imageDataUrl, cols, rows)
      const hairLabels = sprites.map((_, i) => `Hairstyle ${i + 1}`)
      return { savedImages: { hair: sprites }, labels: { hair: hairLabels } }
    }

    case 'eye-strip': {
      const cols = gridSize?.cols ?? 3
      const rows = gridSize?.rows ?? 2
      if (svg) {
        const sprites = sliceSvgGrid(imageDataUrl, cols, rows)
        const labels = EYE_VARIANTS.slice(0, sprites.length)
        return { savedImages: { eye: sprites }, labels: { eye: [...labels] } }
      }
      const sliced = await sliceGridVariants(imageDataUrl, EYE_VARIANTS, cols, rows)
      const sprites = EYE_VARIANTS.map((v) => sliced[v]).filter((v): v is string => v !== null)
      return { savedImages: { eye: sprites }, labels: { eye: [...EYE_VARIANTS] } }
    }

    case 'eyebrow-strip': {
      const cols = gridSize?.cols ?? 3
      const rows = gridSize?.rows ?? 2
      if (svg) {
        const sprites = sliceSvgGrid(imageDataUrl, cols, rows)
        const labels = EYEBROW_VARIANTS.slice(0, sprites.length)
        return { savedImages: { eyebrow: sprites }, labels: { eyebrow: [...labels] } }
      }
      const sliced = await sliceGridVariants(imageDataUrl, EYEBROW_VARIANTS, cols, rows)
      const sprites = EYEBROW_VARIANTS.map((v) => sliced[v]).filter((v): v is string => v !== null)
      return { savedImages: { eyebrow: sprites }, labels: { eyebrow: [...EYEBROW_VARIANTS] } }
    }

    case 'viseme-sheet': {
      const cols = gridSize?.cols ?? 3
      const rows = gridSize?.rows ?? 4
      if (svg) {
        const sprites = sliceSvgGrid(imageDataUrl, cols, rows)
        const labels = VISEMES.slice(0, sprites.length)
        return { savedImages: { viseme: sprites }, labels: { viseme: [...labels] } }
      }
      const sliced = await sliceSingleVisemeSheet(imageDataUrl, cols, rows)
      const sprites = VISEMES.map((v) => sliced[v]).filter((v): v is string => v !== null)
      return { savedImages: { viseme: sprites }, labels: { viseme: [...VISEMES] } }
    }

    case 'clothing': {
      const cols = gridSize?.cols ?? 3
      const rows = gridSize?.rows ?? 3
      if (svg) {
        const allSlices = sliceSvgGrid(imageDataUrl, cols, rows, clothingRowRatios)
        // Split row-major slices into shirt/pants/shoes rows
        const shirt = allSlices.slice(0, cols)
        const pants = allSlices.slice(cols, cols * 2)
        const shoes = allSlices.slice(cols * 2, cols * 3)
        return {
          savedImages: { shirt, pants, shoes },
          labels: {
            shirt: shirt.map((_, i) => `Shirt ${i + 1}`),
            pants: pants.map((_, i) => `Pants ${i + 1}`),
            shoes: shoes.map((_, i) => `Shoes ${i + 1}`),
          },
        }
      }
      const result = await sliceClothingGrid(imageDataUrl, cols, rows, clothingRowRatios)
      return {
        savedImages: {
          shirt: result.shirt,
          pants: result.pants,
          shoes: result.shoes,
        },
        labels: {
          shirt: result.shirt.map((_, i) => `Shirt ${i + 1}`),
          pants: result.pants.map((_, i) => `Pants ${i + 1}`),
          shoes: result.shoes.map((_, i) => `Shoes ${i + 1}`),
        },
      }
    }

    case 'concept':
    default:
      return { savedImages: {}, labels: {} }
  }
}

// ── All-at-once viseme slicing (36 visemes → CurvedVisemeSprites) ────

/**
 * Slice a single sheet containing all 36 visemes (3 curvatures × 12 visemes)
 * into a CurvedVisemeSprites map. The curvature axis is auto-detected.
 */
export async function sliceAllAtOnceVisemeSheet(
  sheetDataUrl: string,
  gridSize: NB2GridSize,
): Promise<CurvedVisemeSprites> {
  const { getVisemeCurvatureAxis } = await import('./nb2Prompts')
  const curvatureAxis = getVisemeCurvatureAxis(gridSize)

  // Determine how to split: if curvatures are on rows, each row is a curvature
  // If curvatures are on cols, each col is a curvature
  const curvatureCount = curvatureAxis === 'rows' ? gridSize.rows : gridSize.cols
  const visemeCount = curvatureAxis === 'rows' ? gridSize.cols : gridSize.rows

  if (curvatureCount < 3) {
    throw new Error(`Grid needs at least 3 on the curvature axis, got ${curvatureCount}`)
  }

  const svg = isSvgDataUrl(sheetDataUrl)

  // Slice all cells
  let allSprites: string[]
  if (svg) {
    allSprites = sliceSvgGrid(sheetDataUrl, gridSize.cols, gridSize.rows)
  } else {
    allSprites = await new Promise<string[]>((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const cellW = img.width / gridSize.cols
        const cellH = img.height / gridSize.rows
        const results: string[] = []
        const canvas = document.createElement('canvas')
        canvas.width = cellW
        canvas.height = cellH
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not create canvas context'))
          return
        }
        for (let row = 0; row < gridSize.rows; row++) {
          for (let col = 0; col < gridSize.cols; col++) {
            ctx.clearRect(0, 0, cellW, cellH)
            ctx.drawImage(img, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH)
            results.push(canvas.toDataURL('image/png'))
          }
        }
        resolve(results)
      }
      img.onerror = () => reject(new Error('Failed to load viseme sheet'))
      img.src = sheetDataUrl.startsWith('data:') ? sheetDataUrl : `data:image/png;base64,${sheetDataUrl}`
    })
  }

  // Map cells to curvatures. In row-major order:
  // If curvatures on rows: row 0 = neutral (12 cells), row 1 = upward (12), row 2 = downward (12)
  // If curvatures on cols: col 0 = neutral, col 1 = upward, col 2 = downward (interleaved)
  const curvatureSprites: Record<string, string[]> = { neutral: [], upward: [], downward: [] }
  const curvatureOrder = ['neutral', 'upward', 'downward']

  if (curvatureAxis === 'rows') {
    // Row-major: cells 0..cols-1 = row 0 (neutral), cols..2*cols-1 = row 1 (upward), etc.
    for (let curv = 0; curv < 3; curv++) {
      const label = curvatureOrder[curv]
      for (let v = 0; v < visemeCount && v < VISEMES.length; v++) {
        const idx = curv * gridSize.cols + v
        if (idx < allSprites.length) curvatureSprites[label].push(allSprites[idx])
      }
    }
  } else {
    // Col-major: in row-major output, cells go [row0col0, row0col1, row0col2, row1col0, ...]
    // curvature axis is cols, so col 0/1/2 = neutral/upward/downward
    for (let row = 0; row < gridSize.rows && row < VISEMES.length; row++) {
      for (let curv = 0; curv < 3; curv++) {
        const label = curvatureOrder[curv]
        const idx = row * gridSize.cols + curv
        if (idx < allSprites.length) curvatureSprites[label].push(allSprites[idx])
      }
    }
  }

  // Build CurvedVisemeSprites
  const result = createEmptySpriteSet()
  for (const curv of curvatureOrder) {
    const sprites = curvatureSprites[curv]
    for (let i = 0; i < VISEMES.length; i++) {
      const key = `${curv}_${VISEMES[i]}` as CurvedVisemeKey
      result[key] = i < sprites.length ? sprites[i] : null
    }
  }

  return result
}

// ── Main Pipeline ────────────────────────────────────────────────────

export type NB2ProgressCallback = (steps: NB2StepStatus[]) => void

function createInitialSteps(): NB2StepStatus[] {
  return NB2_PART_TYPES.map((id) => ({
    id,
    label: NB2_PART_LABELS[id],
    status: 'pending' as const,
  }))
}

function updateStep(steps: NB2StepStatus[], id: NB2PartType, update: Partial<NB2StepStatus>): NB2StepStatus[] {
  return steps.map((s) => (s.id === id ? { ...s, ...update } : s))
}

/**
 * Run the full NB2 character generation pipeline.
 */
export async function runNB2Pipeline(
  options: NB2PipelineOptions,
  onProgress?: NB2ProgressCallback,
  abortSignal?: AbortSignal,
  promptOverrides?: Partial<Record<NB2PartType, string>>,
  gridSizes?: Partial<Record<NB2PartType, NB2GridSize>>,
  clothingRowRatios?: readonly number[],
  visemeAllAtOnce?: boolean,
): Promise<NB2PipelineResult> {
  let steps = createInitialSteps()
  const notify = () => onProgress?.(steps)

  const result: NB2PipelineResult = {
    concept: null,
    body: null,
    head: null,
    hair: null,
    hairSheet: null,
    curvedVisemes: null,
    visemeSheet: null,
    visemeNeutralSheet: null,
    visemeUpwardSheet: null,
    visemeDownwardSheet: null,
    eyeVariants: null,
    eyeSheet: null,
    eyebrowVariants: null,
    eyebrowSheet: null,
    clothing: null,
    clothingSheet: null,
  }

  let conceptImage: string | null = null

  // Helper to run a single step with credit gating
  async function runStep(partType: NB2PartType, gridReference?: string | null): Promise<NB2GenerateResponse> {
    if (abortSignal?.aborted) {
      throw new Error('Pipeline cancelled')
    }

    steps = updateStep(steps, partType, { status: 'generating' })
    notify()

    try {
      const stepCustomPrompt = promptOverrides?.[partType]
      const response = await withCreditGate('nb2-generate', () =>
        callNB2API(
          partType,
          options.prompt,
          options.styleReference,
          options.layoutReference,
          conceptImage,
          abortSignal,
          options.resolution,
          stepCustomPrompt,
          gridReference,
          options.aspectRatio,
        ),
      )

      const dataUrl = `data:${response.mimeType};base64,${response.image}`
      steps = updateStep(steps, partType, { status: 'complete', result: dataUrl, prompt: response.prompt })
      notify()

      return response
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      steps = updateStep(steps, partType, { status: 'error', error: message })
      notify()
      throw error
    }
  }

  // Step 1: Concept (no chroma key removal — keep original for reference)
  const conceptRes = await runStep('concept')
  conceptImage = `data:${conceptRes.mimeType};base64,${conceptRes.image}`
  result.concept = conceptImage

  // Step 2: Body — remove chroma key
  const bodyRes = await runStep('body')
  result.body = await postProcessSingleImage(`data:${bodyRes.mimeType};base64,${bodyRes.image}`)

  // Step 3: Head — remove chroma key
  const headRes = await runStep('head')
  result.head = await postProcessSingleImage(`data:${headRes.mimeType};base64,${headRes.image}`)

  // Generate empty grid references (no tiled heads — that caused AI to include heads)
  const gridRefs = generateGridRefs(gridSizes, options.aspectRatio, clothingRowRatios)

  // Read user grid sizes (fall back to defaults)
  const hairGrid = gridSizes?.['hair'] ?? { cols: 6, rows: 4 }
  const eyeGrid = gridSizes?.['eye-strip'] ?? { cols: 3, rows: 2 }
  const eyebrowGrid = gridSizes?.['eyebrow-strip'] ?? { cols: 3, rows: 2 }
  const clothingGrid = gridSizes?.['clothing'] ?? { cols: 3, rows: 3 }

  // Step 4: Hair grid → individual hairstyles (post-process: remove grid lines + chroma key)
  const hairRes = await runStep('hair', gridRefs.hair)
  try {
    const hairRaw = `data:${hairRes.mimeType};base64,${hairRes.image}`
    const hairDataUrl = await postProcessGridImage(hairRaw, hairGrid.cols, hairGrid.rows)
    result.hairSheet = hairDataUrl
    result.hair = await sliceHairGrid(hairDataUrl, hairGrid.cols, hairGrid.rows)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Hair slicing failed'
    steps = updateStep(steps, 'hair', { status: 'error', error: message })
    notify()
  }

  // Step 5: Viseme generation (all-at-once or multi-phase)
  const visemeGrid = gridSizes?.['viseme-sheet'] ?? { cols: 3, rows: 4 }
  {
    if (abortSignal?.aborted) throw new Error('Pipeline cancelled')
    steps = updateStep(steps, 'viseme-sheet', { status: 'generating' })
    notify()

    try {
      if (visemeAllAtOnce) {
        // All-at-once: single API call generates all 36 visemes (3 curvatures × 12 visemes)
        const customPrompt = promptOverrides?.['viseme-sheet']
        const response = await withCreditGate('nb2-generate', () =>
          callNB2API(
            'viseme-sheet',
            options.prompt,
            options.styleReference,
            options.layoutReference,
            conceptImage,
            abortSignal,
            options.resolution,
            customPrompt,
            gridRefs.viseme,
            options.aspectRatio,
          ),
        )
        const rawUrl = `data:${response.mimeType};base64,${response.image}`
        const dataUrl = await postProcessGridImage(rawUrl, visemeGrid.cols, visemeGrid.rows)
        result.visemeSheet = dataUrl
        result.visemeNeutralSheet = dataUrl

        // Slice the single sheet into CurvedVisemeSprites
        result.curvedVisemes = await sliceAllAtOnceVisemeSheet(dataUrl, visemeGrid)

        steps = updateStep(steps, 'viseme-sheet', { status: 'complete', result: dataUrl, prompt: response.prompt })
        notify()
      } else {
        // Multi-phase: neutral first, then upward + downward curvatures
        const neutralCustomPrompt = promptOverrides?.['viseme-sheet']
        const neutralRes = await withCreditGate('nb2-generate', () =>
          callNB2API(
            'viseme-sheet',
            options.prompt,
            options.styleReference,
            options.layoutReference,
            conceptImage,
            abortSignal,
            options.resolution,
            neutralCustomPrompt,
            gridRefs.viseme,
            options.aspectRatio,
          ),
        )
        const neutralRaw = `data:${neutralRes.mimeType};base64,${neutralRes.image}`
        const neutralDataUrl = await postProcessGridImage(neutralRaw, visemeGrid.cols, visemeGrid.rows)
        result.visemeNeutralSheet = neutralDataUrl
        result.visemeSheet = neutralDataUrl

        // Phase 2: Upward curvature (send neutral sheet as gridReference)
        const upwardPrompt = buildVisemeCurvaturePrompt('upward', options.prompt, visemeGrid)
        const upwardRes = await withCreditGate('nb2-generate', () =>
          callNB2API(
            'viseme-sheet',
            options.prompt,
            options.styleReference,
            options.layoutReference,
            conceptImage,
            abortSignal,
            options.resolution,
            upwardPrompt,
            neutralDataUrl,
            options.aspectRatio,
          ),
        )
        const upwardRaw = `data:${upwardRes.mimeType};base64,${upwardRes.image}`
        const upwardDataUrl = await postProcessGridImage(upwardRaw, visemeGrid.cols, visemeGrid.rows)
        result.visemeUpwardSheet = upwardDataUrl

        // Phase 3: Downward curvature (send neutral sheet as gridReference)
        const downwardPrompt = buildVisemeCurvaturePrompt('downward', options.prompt, visemeGrid)
        const downwardRes = await withCreditGate('nb2-generate', () =>
          callNB2API(
            'viseme-sheet',
            options.prompt,
            options.styleReference,
            options.layoutReference,
            conceptImage,
            abortSignal,
            options.resolution,
            downwardPrompt,
            neutralDataUrl,
            options.aspectRatio,
          ),
        )
        const downwardRaw = `data:${downwardRes.mimeType};base64,${downwardRes.image}`
        const downwardDataUrl = await postProcessGridImage(downwardRaw, visemeGrid.cols, visemeGrid.rows)
        result.visemeDownwardSheet = downwardDataUrl

        // Slice all three and combine into CurvedVisemeSprites
        const neutralSprites = await sliceSingleVisemeSheet(neutralDataUrl, visemeGrid.cols, visemeGrid.rows)
        const upwardSprites = await sliceSingleVisemeSheet(upwardDataUrl, visemeGrid.cols, visemeGrid.rows)
        const downwardSprites = await sliceSingleVisemeSheet(downwardDataUrl, visemeGrid.cols, visemeGrid.rows)
        result.curvedVisemes = combineVisemeSheetsIntoCurved(neutralSprites, upwardSprites, downwardSprites)

        steps = updateStep(steps, 'viseme-sheet', {
          status: 'complete',
          result: neutralDataUrl,
          prompt: neutralRes.prompt,
        })
        notify()
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Viseme generation failed'
      steps = updateStep(steps, 'viseme-sheet', { status: 'error', error: message })
      notify()
    }
  }

  // Step 6: Eye grid → keyed variants (post-process: remove grid lines + chroma key)
  const eyeRes = await runStep('eye-strip', gridRefs.eye)
  try {
    const eyeRaw = `data:${eyeRes.mimeType};base64,${eyeRes.image}`
    const eyeDataUrl = await postProcessGridImage(eyeRaw, eyeGrid.cols, eyeGrid.rows)
    result.eyeSheet = eyeDataUrl
    const eyeSliced = await sliceGridVariants(eyeDataUrl, EYE_VARIANTS, eyeGrid.cols, eyeGrid.rows)
    result.eyeVariants = eyeSliced as EyeVariantSprites
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eye slicing failed'
    steps = updateStep(steps, 'eye-strip', { status: 'error', error: message })
    notify()
  }

  // Step 7: Eyebrow grid → keyed variants (post-process: remove grid lines + chroma key)
  const eyebrowRes = await runStep('eyebrow-strip', gridRefs.eyebrow)
  try {
    const eyebrowRaw = `data:${eyebrowRes.mimeType};base64,${eyebrowRes.image}`
    const eyebrowDataUrl = await postProcessGridImage(eyebrowRaw, eyebrowGrid.cols, eyebrowGrid.rows)
    result.eyebrowSheet = eyebrowDataUrl
    const eyebrowSliced = await sliceGridVariants(eyebrowDataUrl, EYEBROW_VARIANTS, eyebrowGrid.cols, eyebrowGrid.rows)
    result.eyebrowVariants = eyebrowSliced as EyebrowVariantSprites
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Eyebrow slicing failed'
    steps = updateStep(steps, 'eyebrow-strip', { status: 'error', error: message })
    notify()
  }

  // Step 8: Clothing grid → variants per category (post-process: remove grid lines + chroma key)
  const clothingRes = await runStep('clothing', gridRefs.clothing)
  try {
    const clothingRaw = `data:${clothingRes.mimeType};base64,${clothingRes.image}`
    const clothingDataUrl = await postProcessGridImage(
      clothingRaw,
      clothingGrid.cols,
      clothingGrid.rows,
      clothingRowRatios,
    )
    result.clothingSheet = clothingDataUrl
    result.clothing = await sliceClothingGrid(clothingDataUrl, clothingGrid.cols, clothingGrid.rows, clothingRowRatios)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Clothing slicing failed'
    steps = updateStep(steps, 'clothing', { status: 'error', error: message })
    notify()
  }

  return result
}

// ── Single Step Regeneration ──────────────────────────────────────────

/**
 * Regenerate a single NB2 step independently.
 *
 * @param partType - Which part to regenerate
 * @param options - Pipeline options (prompt, refs, resolution)
 * @param conceptImage - Concept image data URL (used as reference for steps 2-8)
 * @param headImage - Head image data URL (unused now, kept for API compat)
 * @param existingResult - Current pipeline result to merge into
 * @param abortSignal - Optional AbortSignal for cancellation
 * @returns Updated result + step status for the regenerated step
 */
export async function runSingleNB2Step(
  partType: NB2PartType,
  options: NB2PipelineOptions,
  conceptImage: string | null,
  _headImage: string | null,
  existingResult: NB2PipelineResult,
  abortSignal?: AbortSignal,
  customPrompt?: string,
  gridSizes?: Partial<Record<NB2PartType, NB2GridSize>>,
  clothingRowRatios?: readonly number[],
): Promise<{ updatedResult: NB2PipelineResult; stepStatus: NB2StepStatus }> {
  const stepStatus: NB2StepStatus = {
    id: partType,
    label: NB2_PART_LABELS[partType],
    status: 'generating',
  }

  try {
    // Generate empty grid reference if needed (no tiled heads)
    let gridReference: string | null = null
    if (partType !== 'concept' && partType !== 'body' && partType !== 'head') {
      const [gw, gh] = gridRefDimensionsForAR(options.aspectRatio)
      const gs = gridSizes?.[partType]
      const defaultGrids: Record<string, [number, number]> = {
        hair: [4, 3],
        'viseme-sheet': [3, 9],
        'eye-strip': [3, 2],
        'eyebrow-strip': [3, 2],
        clothing: [3, 3],
      }
      const [defCols, defRows] = defaultGrids[partType] ?? [3, 3]
      const c = gs?.cols ?? defCols
      const r = gs?.rows ?? defRows
      const ratios = partType === 'clothing' ? clothingRowRatios : undefined

      // No labels on grid refs sent to Gemini — labels caused AI to reproduce them in output.
      // Labels are shown only in the UI overlay (NB2ImageViewer GridOverlay component).
      gridReference = createEmptyGridReference(c, r, gw, gh, ratios)
    }

    const response = await withCreditGate('nb2-generate', () =>
      callNB2API(
        partType,
        options.prompt,
        options.styleReference,
        options.layoutReference,
        conceptImage,
        abortSignal,
        options.resolution,
        customPrompt,
        gridReference,
        options.aspectRatio,
      ),
    )

    const rawDataUrl = `data:${response.mimeType};base64,${response.image}`
    stepStatus.prompt = response.prompt

    const updatedResult = { ...existingResult }

    // Post-process based on part type (remove grid lines + chroma key)
    switch (partType) {
      case 'concept':
        updatedResult.concept = rawDataUrl
        break
      case 'body':
        updatedResult.body = await postProcessSingleImage(rawDataUrl)
        break
      case 'head':
        updatedResult.head = await postProcessSingleImage(rawDataUrl)
        break
      case 'hair': {
        const hg = gridSizes?.['hair'] ?? { cols: 4, rows: 3 }
        try {
          const dataUrl = await postProcessGridImage(rawDataUrl, hg.cols, hg.rows)
          updatedResult.hairSheet = dataUrl
          updatedResult.hair = await sliceHairGrid(dataUrl, hg.cols, hg.rows)
        } catch (err) {
          stepStatus.status = 'error'
          stepStatus.error = err instanceof Error ? err.message : 'Hair slicing failed'
        }
        break
      }
      case 'viseme-sheet': {
        // Multi-phase: only save the neutral sheet here.
        // Curvatures are generated separately via confirmVisemeNeutral.
        const vg = gridSizes?.['viseme-sheet'] ?? { cols: 3, rows: 9 }
        const dataUrl = await postProcessGridImage(rawDataUrl, vg.cols, vg.rows)
        updatedResult.visemeSheet = dataUrl
        updatedResult.visemeNeutralSheet = dataUrl
        break
      }
      case 'eye-strip': {
        const eg = gridSizes?.['eye-strip'] ?? { cols: 3, rows: 2 }
        try {
          const dataUrl = await postProcessGridImage(rawDataUrl, eg.cols, eg.rows)
          updatedResult.eyeSheet = dataUrl
          const eyeSliced = await sliceGridVariants(dataUrl, EYE_VARIANTS, eg.cols, eg.rows)
          updatedResult.eyeVariants = eyeSliced as EyeVariantSprites
        } catch (err) {
          stepStatus.status = 'error'
          stepStatus.error = err instanceof Error ? err.message : 'Eye slicing failed'
        }
        break
      }
      case 'eyebrow-strip': {
        const ebg = gridSizes?.['eyebrow-strip'] ?? { cols: 3, rows: 2 }
        try {
          const dataUrl = await postProcessGridImage(rawDataUrl, ebg.cols, ebg.rows)
          updatedResult.eyebrowSheet = dataUrl
          const eyebrowSliced = await sliceGridVariants(dataUrl, EYEBROW_VARIANTS, ebg.cols, ebg.rows)
          updatedResult.eyebrowVariants = eyebrowSliced as EyebrowVariantSprites
        } catch (err) {
          stepStatus.status = 'error'
          stepStatus.error = err instanceof Error ? err.message : 'Eyebrow slicing failed'
        }
        break
      }
      case 'clothing': {
        const cg = gridSizes?.['clothing'] ?? { cols: 3, rows: 3 }
        try {
          const dataUrl = await postProcessGridImage(rawDataUrl, cg.cols, cg.rows, clothingRowRatios)
          updatedResult.clothingSheet = dataUrl
          updatedResult.clothing = await sliceClothingGrid(dataUrl, cg.cols, cg.rows, clothingRowRatios)
        } catch (err) {
          stepStatus.status = 'error'
          stepStatus.error = err instanceof Error ? err.message : 'Clothing slicing failed'
        }
        break
      }
    }

    // Set success status if no error was set during post-processing
    if (stepStatus.status !== 'error') {
      stepStatus.status = 'complete'
      // Use post-processed image for the step result display
      stepStatus.result =
        (updatedResult[
          partType === 'viseme-sheet'
            ? 'visemeSheet'
            : partType === 'eye-strip'
              ? 'eyeSheet'
              : partType === 'eyebrow-strip'
                ? 'eyebrowSheet'
                : partType === 'clothing'
                  ? 'clothingSheet'
                  : partType === 'hair'
                    ? 'hairSheet'
                    : partType
        ] as string) ?? rawDataUrl
    }

    return { updatedResult, stepStatus }
  } catch (error) {
    stepStatus.status = 'error'
    stepStatus.error = error instanceof Error ? error.message : 'Unknown error'
    return { updatedResult: existingResult, stepStatus }
  }
}

// ── Generate Viseme Curvatures (upward + downward from neutral) ─────

/**
 * Generate upward and downward viseme curvature sheets using the neutral
 * sheet as a reference. Called by confirmVisemeNeutral in the store.
 */
export async function generateVisemeCurvatures(
  neutralSheet: string,
  options: NB2PipelineOptions,
  conceptImage: string | null,
  gridSize: NB2GridSize,
  abortSignal?: AbortSignal,
): Promise<{
  upwardSheet: string
  downwardSheet: string
  curvedVisemes: CurvedVisemeSprites
}> {
  // Generate upward curvature (neutral sheet sent as gridReference)
  const upwardPrompt = buildVisemeCurvaturePrompt('upward', options.prompt, gridSize)
  const upwardRes = await withCreditGate('nb2-generate', () =>
    callNB2API(
      'viseme-sheet',
      options.prompt,
      options.styleReference,
      options.layoutReference,
      conceptImage,
      abortSignal,
      options.resolution,
      upwardPrompt,
      neutralSheet,
      options.aspectRatio,
    ),
  )
  const upwardRaw = `data:${upwardRes.mimeType};base64,${upwardRes.image}`
  const upwardDataUrl = await postProcessGridImage(upwardRaw, gridSize.cols, gridSize.rows)

  if (abortSignal?.aborted) throw new Error('Pipeline cancelled')

  // Generate downward curvature
  const downwardPrompt = buildVisemeCurvaturePrompt('downward', options.prompt, gridSize)
  const downwardRes = await withCreditGate('nb2-generate', () =>
    callNB2API(
      'viseme-sheet',
      options.prompt,
      options.styleReference,
      options.layoutReference,
      conceptImage,
      abortSignal,
      options.resolution,
      downwardPrompt,
      neutralSheet,
      options.aspectRatio,
    ),
  )
  const downwardRaw = `data:${downwardRes.mimeType};base64,${downwardRes.image}`
  const downwardDataUrl = await postProcessGridImage(downwardRaw, gridSize.cols, gridSize.rows)

  // Slice all three sheets
  const neutralSprites = await sliceSingleVisemeSheet(neutralSheet, gridSize.cols, gridSize.rows)
  const upwardSprites = await sliceSingleVisemeSheet(upwardDataUrl, gridSize.cols, gridSize.rows)
  const downwardSprites = await sliceSingleVisemeSheet(downwardDataUrl, gridSize.cols, gridSize.rows)

  // Combine into CurvedVisemeSprites
  const curvedVisemes = combineVisemeSheetsIntoCurved(neutralSprites, upwardSprites, downwardSprites)

  return { upwardSheet: upwardDataUrl, downwardSheet: downwardDataUrl, curvedVisemes }
}
