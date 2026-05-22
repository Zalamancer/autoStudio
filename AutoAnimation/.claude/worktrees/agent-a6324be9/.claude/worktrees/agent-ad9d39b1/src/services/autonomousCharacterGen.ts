/**
 * Autonomous Character Generation Service
 *
 * Headless NB2 pipeline runner designed for orchestrator integration.
 * Generates complete characters from text descriptions without UI interaction.
 *
 * Key improvements over manual pipeline:
 * - Parallelized independent steps (hair + eye + eyebrow run simultaneously)
 * - Style matching via visual style description injection
 * - Auto-saves generated characters to the saved characters store
 * - Optional auto-rigging after sprite generation
 * - Minimal NB2 pipeline: concept → body + head → parallel(hair, visemes, eyes, eyebrows) → clothing
 */

import type {
  NB2PartType,
  NB2GridSize,
  NB2AspectRatio,
} from '@/types/nanoBanana2'
import type { CurvedVisemeSprites } from '@/types/nanoBanana'
import { createEmptySpriteSet } from '@/types/nanoBanana'
import type { EyeVariantSprites, EyebrowVariantSprites } from '@/types/emotionHeads'
import { EYE_VARIANTS, EYEBROW_VARIANTS } from '@/types/emotionHeads'
import {
  sliceSingleVisemeSheet,
  combineVisemeSheetsIntoCurved,
  cropStepResult,
} from './nanoBanana2'
import { createEmptyGridReference, gridRefDimensionsForAR, removeGridLines, removeChromaKey } from './gridReferenceGenerator'
import { buildVisemeSpriteMapFromCurved } from './visemeMapper'
import { withCreditGate } from './creditGate'
import { validateSingleImage, validateGridImage } from './nb2QualityValidation'

// ── Types ────────────────────────────────────────────────────────────

export interface AutonomousCharGenOptions {
  /** Character description (e.g. "a young wizard with blue robes and a pointed hat") */
  description: string
  /** Character name for saving */
  name: string
  /** Visual style to match (e.g. "cartoon", "anime", "pixel art", "realistic") */
  visualStyle?: string
  /** Whether to auto-rig the body after generation */
  autoRig?: boolean
  /** Whether to generate clothing (can skip for speed) */
  generateClothing?: boolean
  /** AbortSignal for cancellation */
  signal?: AbortSignal
  /** Progress callback */
  onProgress?: (phase: string, detail: string) => void
}

export interface AutonomousCharGenResult {
  /** ID of the saved character in the store */
  savedCharacterId: string
  /** Whether auto-rigging succeeded */
  rigged: boolean
  /** Phases that failed (non-fatal) */
  warnings: string[]
}

// ── API Call ─────────────────────────────────────────────────────────

const apiBase = import.meta.env.VITE_API_URL || ''

async function callNB2(
  partType: NB2PartType,
  prompt: string,
  styleReference: string | null,
  layoutReference: string | null,
  conceptImage: string | null,
  signal?: AbortSignal,
  gridReference?: string | null,
  aspectRatio?: NB2AspectRatio,
  customPrompt?: string,
): Promise<{ image: string; mimeType: string }> {
  const body: Record<string, string> = { partType, prompt }
  if (styleReference) body.styleReference = styleReference
  if (layoutReference) body.layoutReference = layoutReference
  if (conceptImage) body.conceptImage = conceptImage
  if (gridReference) body.gridReference = gridReference
  if (aspectRatio) body.aspectRatio = aspectRatio
  if (customPrompt) body.customPrompt = customPrompt

  const timeout = AbortSignal.timeout(180_000)
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeout])
    : timeout

  const response = await fetch(`${apiBase}/api/nb2/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: combinedSignal,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || err.error || `NB2 generation failed: ${response.statusText}`)
  }

  const data = await response.json()
  return { image: data.image, mimeType: data.mimeType }
}

// ── Post-processing helpers ──────────────────────────────────────────

async function postProcessSingle(dataUrl: string): Promise<string> {
  try { return await removeChromaKey(dataUrl) } catch { return dataUrl }
}

async function postProcessGrid(
  dataUrl: string,
  cols: number,
  rows: number,
  rowRatios?: readonly number[],
): Promise<string> {
  let result = dataUrl
  try { result = await removeGridLines(result, cols, rows, rowRatios) } catch { /* skip */ }
  try { result = await removeChromaKey(result) } catch { /* skip */ }
  return result
}

// ── Style-enhanced prompt builder ────────────────────────────────────

function buildStyledPrompt(description: string, visualStyle?: string): string {
  if (!visualStyle) return description
  return `${description}\n\nArt Style: ${visualStyle}. CRITICAL STYLE REQUIREMENT: Every single generated part must match this visual style EXACTLY — same level of detail, same color palette, same line weight/thickness, same shading technique (flat/cel-shaded/gradient/painterly), same edge quality (sharp/soft/anti-aliased). All parts will be composited together, so ANY style mismatch will be immediately visible.`
}

// ── Grid sizes ───────────────────────────────────────────────────────

const GRID_SIZES: Record<string, NB2GridSize> = {
  hair: { cols: 4, rows: 3 },
  viseme: { cols: 3, rows: 9 },
  eye: { cols: 3, rows: 2 },
  eyebrow: { cols: 3, rows: 2 },
  clothing: { cols: 3, rows: 3 },
}

// ── Slice helpers ────────────────────────────────────────────────────

async function sliceGrid(dataUrl: string, cols: number, rows: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const cellW = img.width / cols
      const cellH = img.height / rows
      const results: string[] = []
      const canvas = document.createElement('canvas')
      canvas.width = cellW
      canvas.height = cellH
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas unavailable')); return }

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          ctx.clearRect(0, 0, cellW, cellH)
          ctx.drawImage(img, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH)
          results.push(canvas.toDataURL('image/png'))
        }
      }
      resolve(results)
    }
    img.onerror = () => reject(new Error('Failed to load image for slicing'))
    img.src = dataUrl.startsWith('data:') ? dataUrl : `data:image/png;base64,${dataUrl}`
  })
}

async function sliceVariants(
  dataUrl: string,
  variants: readonly string[],
  cols: number,
  rows: number,
): Promise<Record<string, string | null>> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const cellW = img.width / cols
      const cellH = img.height / rows
      const results: Record<string, string | null> = {}
      for (const v of variants) results[v] = null

      const canvas = document.createElement('canvas')
      canvas.width = cellW
      canvas.height = cellH
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas unavailable')); return }

      let idx = 0
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (idx >= variants.length) break
          ctx.clearRect(0, 0, cellW, cellH)
          ctx.drawImage(img, col * cellW, row * cellH, cellW, cellH, 0, 0, cellW, cellH)
          results[variants[idx]] = canvas.toDataURL('image/png')
          idx++
        }
      }
      resolve(results)
    }
    img.onerror = () => reject(new Error('Failed to load variant grid'))
    img.src = dataUrl.startsWith('data:') ? dataUrl : `data:image/png;base64,${dataUrl}`
  })
}

// ── Main Pipeline ────────────────────────────────────────────────────

/**
 * Generate a complete character autonomously from a text description.
 * Designed to be called from the orchestrator during clip generation.
 *
 * Pipeline:
 * 1. Generate concept image (sequential - needed by all subsequent steps)
 * 2. Generate body + head (sequential - body needed for clothing reference)
 * 3. Generate hair + visemes + eyes + eyebrows (PARALLEL - independent of each other)
 * 4. Generate clothing (sequential - optional)
 * 5. Save character to store
 * 6. Auto-rig body (optional)
 */
export async function generateCharacterAutonomous(
  options: AutonomousCharGenOptions,
): Promise<AutonomousCharGenResult> {
  const {
    description,
    name,
    visualStyle,
    autoRig = false,
    generateClothing = false,
    signal,
    onProgress,
  } = options

  const warnings: string[] = []
  const styledPrompt = buildStyledPrompt(description, visualStyle)
  const progress = (phase: string, detail: string) => onProgress?.(phase, detail)

  // Generate grid references
  const [gw, gh] = gridRefDimensionsForAR('1:1')
  const gridRefs = {
    hair: createEmptyGridReference(GRID_SIZES.hair.cols, GRID_SIZES.hair.rows, gw, gh),
    viseme: createEmptyGridReference(GRID_SIZES.viseme.cols, GRID_SIZES.viseme.rows, gw, gh),
    eye: createEmptyGridReference(GRID_SIZES.eye.cols, GRID_SIZES.eye.rows, gw, gh),
    eyebrow: createEmptyGridReference(GRID_SIZES.eyebrow.cols, GRID_SIZES.eyebrow.rows, gw, gh),
    clothing: createEmptyGridReference(GRID_SIZES.clothing.cols, GRID_SIZES.clothing.rows, gw, gh),
  }

  // Results accumulator
  let conceptImage: string | null = null
  let bodyImage: string | null = null
  let headImage: string | null = null
  let hairSprites: string[] = []
  let curvedVisemes: CurvedVisemeSprites = createEmptySpriteSet()
  let eyeVariants: EyeVariantSprites | null = null
  let eyebrowVariants: EyebrowVariantSprites | null = null
  let clothingResult: { shirt: string[]; pants: string[]; shoes: string[] } | null = null

  // ── Step 1: Concept ──
  progress('concept', 'Generating character concept...')
  const conceptRes = await withCreditGate('nb2-generate', () =>
    callNB2('concept', styledPrompt, null, null, null, signal),
  )
  conceptImage = `data:${conceptRes.mimeType};base64,${conceptRes.image}`

  // Validate concept image
  const conceptCheck = await validateSingleImage(conceptImage, 'concept')
  if (!conceptCheck.passed) {
    // Concept is critical — retry once
    progress('concept', 'Concept validation failed, retrying...')
    const retryRes = await withCreditGate('nb2-generate', () =>
      callNB2('concept', styledPrompt, null, null, null, signal),
    )
    conceptImage = `data:${retryRes.mimeType};base64,${retryRes.image}`
    const retryCheck = await validateSingleImage(conceptImage, 'concept')
    if (!retryCheck.passed) {
      warnings.push(`Concept quality issue: ${retryCheck.issue}`)
    }
  } else if (conceptCheck.issue) {
    warnings.push(`Concept: ${conceptCheck.issue}`)
  }

  if (signal?.aborted) throw new Error('Character generation cancelled')

  // ── Step 2: Body ──
  progress('body', 'Generating body sprite...')
  try {
    const bodyRes = await withCreditGate('nb2-generate', () =>
      callNB2('body', styledPrompt, null, null, conceptImage, signal),
    )
    bodyImage = await postProcessSingle(`data:${bodyRes.mimeType};base64,${bodyRes.image}`)

    // Validate body
    const bodyCheck = await validateSingleImage(bodyImage, 'body')
    if (!bodyCheck.passed) {
      progress('body', 'Body validation failed, retrying...')
      const retryRes = await withCreditGate('nb2-generate', () =>
        callNB2('body', styledPrompt, null, null, conceptImage, signal),
      )
      bodyImage = await postProcessSingle(`data:${retryRes.mimeType};base64,${retryRes.image}`)
      const retryCheck = await validateSingleImage(bodyImage, 'body')
      if (!retryCheck.passed) warnings.push(`Body quality: ${retryCheck.issue}`)
    } else if (bodyCheck.issue) {
      warnings.push(`Body: ${bodyCheck.issue}`)
    }
  } catch (err) {
    warnings.push(`Body generation failed: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  if (signal?.aborted) throw new Error('Character generation cancelled')

  // ── Step 3: Head ──
  progress('head', 'Generating head sprite...')
  try {
    const headRes = await withCreditGate('nb2-generate', () =>
      callNB2('head', styledPrompt, null, null, conceptImage, signal),
    )
    headImage = await postProcessSingle(`data:${headRes.mimeType};base64,${headRes.image}`)

    // Validate head
    const headCheck = await validateSingleImage(headImage, 'head')
    if (!headCheck.passed) {
      progress('head', 'Head validation failed, retrying...')
      const retryRes = await withCreditGate('nb2-generate', () =>
        callNB2('head', styledPrompt, null, null, conceptImage, signal),
      )
      headImage = await postProcessSingle(`data:${retryRes.mimeType};base64,${retryRes.image}`)
      const retryCheck = await validateSingleImage(headImage, 'head')
      if (!retryCheck.passed) warnings.push(`Head quality: ${retryCheck.issue}`)
    } else if (headCheck.issue) {
      warnings.push(`Head: ${headCheck.issue}`)
    }
  } catch (err) {
    warnings.push(`Head generation failed: ${err instanceof Error ? err.message : 'unknown'}`)
  }

  if (signal?.aborted) throw new Error('Character generation cancelled')

  // ── Step 4: Parallel generation (hair + visemes + eyes + eyebrows) ──
  progress('parallel', 'Generating hair, visemes, eyes, and eyebrows in parallel...')

  const parallelResults = await Promise.allSettled([
    // Hair
    (async () => {
      const hairRes = await withCreditGate('nb2-generate', () =>
        callNB2('hair', styledPrompt, null, null, conceptImage, signal, gridRefs.hair),
      )
      const hairRaw = `data:${hairRes.mimeType};base64,${hairRes.image}`
      const hairProcessed = await postProcessGrid(hairRaw, GRID_SIZES.hair.cols, GRID_SIZES.hair.rows)

      // Validate hair grid
      const hairCheck = await validateGridImage(hairProcessed, 'hair', GRID_SIZES.hair.cols, GRID_SIZES.hair.rows)
      if (!hairCheck.passed) {
        // Retry once on failure
        const retryRes = await withCreditGate('nb2-generate', () =>
          callNB2('hair', styledPrompt, null, null, conceptImage, signal, gridRefs.hair),
        )
        const retryRaw = `data:${retryRes.mimeType};base64,${retryRes.image}`
        const retryProcessed = await postProcessGrid(retryRaw, GRID_SIZES.hair.cols, GRID_SIZES.hair.rows)
        return await sliceGrid(retryProcessed, GRID_SIZES.hair.cols, GRID_SIZES.hair.rows)
      }
      if (hairCheck.issue) warnings.push(`Hair: ${hairCheck.issue}`)
      return await sliceGrid(hairProcessed, GRID_SIZES.hair.cols, GRID_SIZES.hair.rows)
    })(),

    // Visemes (all-at-once mode for speed)
    (async () => {
      const visRes = await withCreditGate('nb2-generate', () =>
        callNB2('viseme-sheet', styledPrompt, null, null, conceptImage, signal, gridRefs.viseme),
      )
      const visRaw = `data:${visRes.mimeType};base64,${visRes.image}`
      const visProcessed = await postProcessGrid(visRaw, GRID_SIZES.viseme.cols, GRID_SIZES.viseme.rows)

      // Validate viseme grid
      const visCheck = await validateGridImage(visProcessed, 'viseme-sheet', GRID_SIZES.viseme.cols, GRID_SIZES.viseme.rows)
      if (!visCheck.passed) {
        const retryRes = await withCreditGate('nb2-generate', () =>
          callNB2('viseme-sheet', styledPrompt, null, null, conceptImage, signal, gridRefs.viseme),
        )
        const retryRaw = `data:${retryRes.mimeType};base64,${retryRes.image}`
        const retryProcessed = await postProcessGrid(retryRaw, GRID_SIZES.viseme.cols, GRID_SIZES.viseme.rows)
        const neutralSprites = await sliceSingleVisemeSheet(retryProcessed, GRID_SIZES.viseme.cols, GRID_SIZES.viseme.rows)
        return combineVisemeSheetsIntoCurved(neutralSprites, neutralSprites, neutralSprites)
      }
      if (visCheck.issue) warnings.push(`Visemes: ${visCheck.issue}`)

      // Slice into neutral visemes (9 sprites)
      const neutralSprites = await sliceSingleVisemeSheet(visProcessed, GRID_SIZES.viseme.cols, GRID_SIZES.viseme.rows)
      // For autonomous mode, use neutral for all curvatures (faster)
      return combineVisemeSheetsIntoCurved(neutralSprites, neutralSprites, neutralSprites)
    })(),

    // Eyes
    (async () => {
      const eyeRes = await withCreditGate('nb2-generate', () =>
        callNB2('eye-strip', styledPrompt, null, null, conceptImage, signal, gridRefs.eye),
      )
      const eyeRaw = `data:${eyeRes.mimeType};base64,${eyeRes.image}`
      const eyeProcessed = await postProcessGrid(eyeRaw, GRID_SIZES.eye.cols, GRID_SIZES.eye.rows)

      // Validate eye grid
      const eyeCheck = await validateGridImage(eyeProcessed, 'eye-strip', GRID_SIZES.eye.cols, GRID_SIZES.eye.rows)
      if (!eyeCheck.passed) {
        const retryRes = await withCreditGate('nb2-generate', () =>
          callNB2('eye-strip', styledPrompt, null, null, conceptImage, signal, gridRefs.eye),
        )
        const retryRaw = `data:${retryRes.mimeType};base64,${retryRes.image}`
        const retryProcessed = await postProcessGrid(retryRaw, GRID_SIZES.eye.cols, GRID_SIZES.eye.rows)
        return await sliceVariants(retryProcessed, EYE_VARIANTS, GRID_SIZES.eye.cols, GRID_SIZES.eye.rows) as EyeVariantSprites
      }
      if (eyeCheck.issue) warnings.push(`Eyes: ${eyeCheck.issue}`)
      return await sliceVariants(eyeProcessed, EYE_VARIANTS, GRID_SIZES.eye.cols, GRID_SIZES.eye.rows) as EyeVariantSprites
    })(),

    // Eyebrows
    (async () => {
      const ebRes = await withCreditGate('nb2-generate', () =>
        callNB2('eyebrow-strip', styledPrompt, null, null, conceptImage, signal, gridRefs.eyebrow),
      )
      const ebRaw = `data:${ebRes.mimeType};base64,${ebRes.image}`
      const ebProcessed = await postProcessGrid(ebRaw, GRID_SIZES.eyebrow.cols, GRID_SIZES.eyebrow.rows)

      // Validate eyebrow grid
      const ebCheck = await validateGridImage(ebProcessed, 'eyebrow-strip', GRID_SIZES.eyebrow.cols, GRID_SIZES.eyebrow.rows)
      if (!ebCheck.passed) {
        const retryRes = await withCreditGate('nb2-generate', () =>
          callNB2('eyebrow-strip', styledPrompt, null, null, conceptImage, signal, gridRefs.eyebrow),
        )
        const retryRaw = `data:${retryRes.mimeType};base64,${retryRes.image}`
        const retryProcessed = await postProcessGrid(retryRaw, GRID_SIZES.eyebrow.cols, GRID_SIZES.eyebrow.rows)
        return await sliceVariants(retryProcessed, EYEBROW_VARIANTS, GRID_SIZES.eyebrow.cols, GRID_SIZES.eyebrow.rows) as EyebrowVariantSprites
      }
      if (ebCheck.issue) warnings.push(`Eyebrows: ${ebCheck.issue}`)
      return await sliceVariants(ebProcessed, EYEBROW_VARIANTS, GRID_SIZES.eyebrow.cols, GRID_SIZES.eyebrow.rows) as EyebrowVariantSprites
    })(),
  ])

  // Process parallel results
  if (parallelResults[0].status === 'fulfilled') {
    hairSprites = parallelResults[0].value
  } else {
    warnings.push(`Hair generation failed: ${parallelResults[0].reason?.message || 'unknown'}`)
  }

  if (parallelResults[1].status === 'fulfilled') {
    curvedVisemes = parallelResults[1].value
  } else {
    warnings.push(`Viseme generation failed: ${parallelResults[1].reason?.message || 'unknown'}`)
  }

  if (parallelResults[2].status === 'fulfilled') {
    eyeVariants = parallelResults[2].value
  } else {
    warnings.push(`Eye generation failed: ${parallelResults[2].reason?.message || 'unknown'}`)
  }

  if (parallelResults[3].status === 'fulfilled') {
    eyebrowVariants = parallelResults[3].value
  } else {
    warnings.push(`Eyebrow generation failed: ${parallelResults[3].reason?.message || 'unknown'}`)
  }

  if (signal?.aborted) throw new Error('Character generation cancelled')

  // ── Step 5: Clothing (optional) ──
  if (generateClothing) {
    progress('clothing', 'Generating clothing options...')
    try {
      const clothRes = await withCreditGate('nb2-generate', () =>
        callNB2('clothing', styledPrompt, null, null, conceptImage, signal, gridRefs.clothing),
      )
      const clothRaw = `data:${clothRes.mimeType};base64,${clothRes.image}`
      const clothProcessed = await postProcessGrid(clothRaw, GRID_SIZES.clothing.cols, GRID_SIZES.clothing.rows)
      const cropped = await cropStepResult('clothing', clothProcessed, GRID_SIZES.clothing)
      clothingResult = {
        shirt: cropped.savedImages.shirt || [],
        pants: cropped.savedImages.pants || [],
        shoes: cropped.savedImages.shoes || [],
      }
    } catch (err) {
      warnings.push(`Clothing generation failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  // ── Step 5b: Auto-align parts ──
  // Compute transforms to position head/eyes/mouth/hair on the body.
  // Non-fatal: if alignment fails, parts stay at defaults.
  let computedPartTransforms: Record<string, { x: number; y: number; scaleX: number; scaleY: number }> | null = null
  if (conceptImage && bodyImage) {
    progress('align', 'Auto-aligning character parts...')
    try {
      const { autoAlignCharacterParts } = await import('./spriteAutoAlign')
      const alignParts: Record<string, string | null> = {
        head: headImage,
        viseme: curvedVisemes.neutral_Rest ?? null,
        eye: eyeVariants?.neutral ?? null,
        eyebrow: eyebrowVariants?.neutral ?? null,
        hair: hairSprites[0] ?? null,
      }
      const computed = await autoAlignCharacterParts(conceptImage, alignParts)
      if (Object.keys(computed).length > 0) {
        computedPartTransforms = {}
        for (const [part, t] of Object.entries(computed)) {
          computedPartTransforms[part] = { x: t.x, y: t.y, scaleX: t.scaleX, scaleY: t.scaleY }
        }
      }
    } catch (err) {
      warnings.push(`Auto-alignment failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  // ── Step 6: Save to store ──
  progress('save', 'Saving character...')
  const { useSavedCharactersStore } = await import('@/stores/useSavedCharactersStore')

  const savedCharId = crypto.randomUUID()

  // Build body parts record
  const bodyParts: Record<string, string[]> = {
    body: bodyImage ? [bodyImage] : [],
    head: headImage ? [headImage] : [],
    hair: hairSprites,
    viseme: [],  // populated via curvedVisemes
    eye: eyeVariants
      ? EYE_VARIANTS.map(v => eyeVariants![v]).filter((v): v is string => v !== null)
      : [],
    eyebrow: eyebrowVariants
      ? EYEBROW_VARIANTS.map(v => eyebrowVariants![v]).filter((v): v is string => v !== null)
      : [],
    shirt: clothingResult?.shirt || [],
    pants: clothingResult?.pants || [],
    shoes: clothingResult?.shoes || [],
  }

  // Build sprite labels
  const spriteLabels: Record<string, Record<number, string>> = {
    body: { 0: 'Body' },
    head: { 0: 'Head' },
    hair: Object.fromEntries(hairSprites.map((_, i) => [i, `Hairstyle ${i + 1}`])),
    viseme: {},
    eye: Object.fromEntries(EYE_VARIANTS.map((v, i) => [i, v])),
    eyebrow: Object.fromEntries(EYEBROW_VARIANTS.map((v, i) => [i, v])),
    shirt: Object.fromEntries((clothingResult?.shirt || []).map((_, i) => [i, `Shirt ${i + 1}`])),
    pants: Object.fromEntries((clothingResult?.pants || []).map((_, i) => [i, `Pants ${i + 1}`])),
    shoes: Object.fromEntries((clothingResult?.shoes || []).map((_, i) => [i, `Shoes ${i + 1}`])),
  }

  // Build viseme sprite map for flexible matching
  const visemeSpriteMap = buildVisemeSpriteMapFromCurved(curvedVisemes)

  // Build full part transforms from computed alignment (defaults for parts without alignment)
  const defaultT = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true }
  const partTransforms: Record<string, typeof defaultT> = {
    body: { ...defaultT },
    head: { ...defaultT, ...(computedPartTransforms?.head || {}) },
    shirt: { ...defaultT },
    pants: { ...defaultT },
    shoes: { ...defaultT },
    eye: { ...defaultT, ...(computedPartTransforms?.eye || {}) },
    eyebrow: { ...defaultT, ...(computedPartTransforms?.eyebrow || {}) },
    viseme: { ...defaultT, ...(computedPartTransforms?.viseme || {}) },
    hair: { ...defaultT, ...(computedPartTransforms?.hair || {}) },
  }

  const savedCharacter = {
    id: savedCharId,
    name,
    referenceImage: conceptImage || '',
    stylePrompt: description,
    curvedVisemes,
    eyeVariants: eyeVariants || undefined,
    eyebrowVariants: eyebrowVariants || undefined,
    createdAt: Date.now(),
    bodyParts: bodyParts as any,
    spriteLabels: spriteLabels as any,
    visemeSpriteMap: visemeSpriteMap || undefined,
    partTransforms: partTransforms as any,
  }

  useSavedCharactersStore.getState().addCharacter(savedCharacter)

  // Persist images to IndexedDB
  try {
    await useSavedCharactersStore.getState().persistImages(savedCharId)
  } catch {
    warnings.push('Failed to persist character images to IndexedDB')
  }

  // ── Step 7: Auto-rig (optional) ──
  let rigged = false
  if (autoRig && bodyImage) {
    progress('auto-rig', 'Auto-rigging character body...')
    try {
      const { autoRigImage } = await import('./autoRigService')
      // Get body image dimensions
      const dims = await getImageDimensions(bodyImage)
      await autoRigImage(bodyImage, dims.width, dims.height)
      rigged = true
    } catch (err) {
      warnings.push(`Auto-rigging failed: ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  return {
    savedCharacterId: savedCharId,
    rigged,
    warnings,
  }
}

// ── Utility ──────────────────────────────────────────────────────────

function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.width, height: img.height })
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = dataUrl
  })
}
