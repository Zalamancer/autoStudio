/**
 * Stock Media Intelligence Service
 *
 * Transforms raw stock media (Pixabay images/videos) into professional
 * creative assets through automated treatments:
 *
 * 1. Creative treatments: bg removal, duotone, color grading, artistic filters
 * 2. Smart cropping: subject detection, intelligent crop, Ken Burns with subject focus
 * 3. Video intelligence: trim to interesting parts, speed ramp, seamless looping
 * 4. Multi-source layering: foreground + background + overlay texture composition
 * 5. Context-aware search: semantic query expansion from dialogue context
 * 6. Style matching: apply filters to match clip's visual style
 */

import { removeImageBackground } from '@/services/backgroundRemoval'
import { hexToRgb } from '@/utils/color'

// ── Types ────────────────────────────────────────────────────────────────────

export type CreativeTreatment =
  | 'none'
  | 'bg-remove' // Remove background for cutout compositing
  | 'duotone' // Two-color tonal treatment
  | 'color-grade' // Cinematic color grading (LUT-like)
  | 'desaturate' // Desaturate to near-grayscale
  | 'high-contrast-bw' // High contrast black & white
  | 'sepia' // Warm sepia tone
  | 'cool-tone' // Cool blue-shifted grade
  | 'warm-tone' // Warm amber-shifted grade
  | 'posterize' // Reduced color levels
  | 'vignette' // Dark edge vignette
  | 'blur-bg' // Blur with center subject sharp (tilt-shift feel)

export interface DuotoneConfig {
  /** Shadow color (hex) */
  shadow: string
  /** Highlight color (hex) */
  highlight: string
}

export interface ColorGradeConfig {
  /** Brightness adjustment (-100 to 100) */
  brightness: number
  /** Contrast adjustment (-100 to 100) */
  contrast: number
  /** Saturation multiplier (0 = grayscale, 1 = normal, 2 = vivid) */
  saturation: number
  /** Color temperature shift (-50 = cool, 0 = neutral, 50 = warm) */
  temperature: number
  /** Tint shift (-50 = green, 0 = neutral, 50 = magenta) */
  tint: number
}

export interface SmartCropConfig {
  /** Focus point as percentage (0-100). Auto-detected if omitted. */
  focusX?: number
  focusY?: number
  /** Target aspect ratio for crop (e.g. '16:9', '9:16', '1:1') */
  targetAspect?: string
  /** How much to zoom into the subject (1 = no zoom, 1.5 = 50% zoom) */
  zoomFactor?: number
}

export interface KenBurnsConfig {
  /** Start focus point as percentage */
  startX: number
  startY: number
  /** End focus point as percentage */
  endX: number
  endY: number
  /** Start zoom (1 = no zoom) */
  startZoom: number
  /** End zoom */
  endZoom: number
}

export interface VideoTrimConfig {
  /** Trim start time in seconds */
  startTime: number
  /** Trim end time in seconds */
  endTime: number
}

export interface SpeedRampConfig {
  /** Speed multiplier segments: [{start%, end%, speed}] */
  segments: { startPercent: number; endPercent: number; speed: number }[]
}

export interface MediaTreatmentPlan {
  /** The creative treatment to apply */
  treatment: CreativeTreatment
  /** Duotone configuration (when treatment = 'duotone') */
  duotone?: DuotoneConfig
  /** Color grading configuration (when treatment = 'color-grade') */
  colorGrade?: ColorGradeConfig
  /** Smart crop configuration */
  smartCrop?: SmartCropConfig
  /** Ken Burns motion (overrides basic transition) */
  kenBurns?: KenBurnsConfig
  /** Video trim (for video assets) */
  videoTrim?: VideoTrimConfig
  /** Speed ramp (for video assets) */
  speedRamp?: SpeedRampConfig
  /** Overlay blend mode for compositing */
  blendMode?: import('@/types/blendModes').BlendMode | 'normal'
  /** Apply vignette on top of other treatments */
  addVignette?: boolean
}

// ── Preset duotone palettes ──────────────────────────────────────────────────

export const DUOTONE_PRESETS: Record<string, DuotoneConfig> = {
  'midnight-gold': { shadow: '#1a1a2e', highlight: '#e2b857' },
  'ocean-sunset': { shadow: '#0c2461', highlight: '#ff6b6b' },
  'forest-mist': { shadow: '#0a3d2e', highlight: '#b8e994' },
  'retro-warm': { shadow: '#2d1b33', highlight: '#ff9a56' },
  'tech-blue': { shadow: '#0a0e27', highlight: '#4fc3f7' },
  'rose-gold': { shadow: '#3c1053', highlight: '#f5af19' },
  'neon-green': { shadow: '#0d1117', highlight: '#39ff14' },
  'vintage-sepia': { shadow: '#2c1810', highlight: '#d4a574' },
  'electric-purple': { shadow: '#0d0221', highlight: '#cc00ff' },
  'coral-teal': { shadow: '#004d4d', highlight: '#ff6b6b' },
}

// ── Preset color grades ──────────────────────────────────────────────────────

export const COLOR_GRADE_PRESETS: Record<string, ColorGradeConfig> = {
  cinematic: { brightness: -5, contrast: 20, saturation: 0.85, temperature: 10, tint: 0 },
  vibrant: { brightness: 5, contrast: 15, saturation: 1.4, temperature: 0, tint: 0 },
  'muted-film': { brightness: -10, contrast: -10, saturation: 0.6, temperature: 15, tint: 5 },
  'cold-steel': { brightness: 0, contrast: 25, saturation: 0.5, temperature: -30, tint: -5 },
  'golden-hour': { brightness: 10, contrast: 10, saturation: 1.2, temperature: 35, tint: 10 },
  noir: { brightness: -15, contrast: 40, saturation: 0, temperature: 0, tint: 0 },
  pastel: { brightness: 15, contrast: -15, saturation: 0.7, temperature: 5, tint: 5 },
  documentary: { brightness: 0, contrast: 10, saturation: 0.9, temperature: 5, tint: 0 },
}

// ── Context-aware search expansion ───────────────────────────────────────────

/**
 * Narrative concept categories and their associated Pixabay search queries.
 * Used when the orchestrator says "growth" and we need concrete visual assets.
 */
export const CONCEPT_SEARCH_MAP: Record<string, string[]> = {
  // Business & economy
  growth: ['chart going up green', 'plant seedling growth', 'city skyline sunrise', 'staircase ascending'],
  success: ['trophy gold celebration', 'mountain summit sunrise', 'podium winner', 'fireworks celebration'],
  teamwork: ['team hands together', 'rowing team sync', 'puzzle pieces connecting', 'diverse office meeting'],
  innovation: ['lightbulb glowing idea', 'circuit board technology', 'rocket launch', 'blueprint design'],
  finance: ['stock chart trading', 'coins stacking gold', 'wallet money cash', 'bank building exterior'],
  startup: ['laptop coffee workspace', 'whiteboard brainstorm', 'garage workspace', 'pitch presentation'],

  // Technology
  technology: ['laptop screen code', 'circuit board closeup', 'server room data', 'holographic display'],
  ai: ['neural network visualization', 'robot hand reaching', 'digital brain circuit', 'data stream binary'],
  software: ['code screen developer', 'app interface design', 'keyboard typing closeup', 'monitor workflow'],
  internet: ['network connections globe', 'wifi signal waves', 'ethernet cables server', 'cloud computing'],

  // Emotions & states
  happy: ['smiling person sunshine', 'celebration confetti', 'jumping joy sunset', 'laughing friends'],
  sad: ['rain window melancholy', 'empty bench park', 'wilted flower', 'grey cloudy sky'],
  angry: ['storm lightning dramatic', 'red abstract flames', 'cracked wall texture', 'fist clenched'],
  calm: ['zen stones water', 'sunset ocean calm', 'meditation peaceful', 'gentle waves beach'],
  excited: ['crowd cheering concert', 'rollercoaster motion', 'sparklers celebration', 'confetti falling'],

  // Nature & environment
  nature: ['forest sunlight trees', 'mountain landscape panorama', 'ocean waves aerial', 'wildflowers meadow'],
  weather: ['storm clouds dramatic', 'sunny blue sky', 'rain drops water', 'snow falling winter'],
  ocean: ['underwater coral reef', 'waves crashing rocks', 'deep blue ocean', 'sailing boat horizon'],
  space: ['stars galaxy milky way', 'planet earth orbit', 'nebula colorful', 'astronaut floating'],

  // Food & lifestyle
  food: ['cooking ingredients fresh', 'restaurant dish plating', 'farmers market colorful', 'coffee latte art'],
  health: ['running exercise outdoor', 'healthy salad bowl', 'yoga stretch sunrise', 'medical stethoscope'],
  travel: ['passport suitcase adventure', 'airplane window clouds', 'map compass direction', 'iconic landmark'],

  // Abstract & texture
  abstract: ['abstract flowing colors', 'geometric pattern modern', 'smoke swirl colorful', 'liquid marble texture'],
  texture: ['concrete wall rough', 'wood grain natural', 'marble surface elegant', 'fabric textile weave'],
  pattern: ['geometric tiles mosaic', 'fractal digital art', 'repeating ornament', 'hexagonal grid'],
}

/**
 * Expand a narrative concept into multiple concrete search queries.
 * Returns the original query if no concept match is found.
 */
export function expandSearchConcept(query: string): string[] {
  const lower = query.toLowerCase().trim()

  // Direct concept match
  for (const [concept, queries] of Object.entries(CONCEPT_SEARCH_MAP)) {
    if (lower.includes(concept)) {
      return queries
    }
  }

  // Return original as-is
  return [query]
}

/**
 * Score a Pixabay image hit for relevance, quality, and visual interest.
 * Higher score = better candidate. Uses likes, downloads, resolution.
 */
export function scoreImageHit(
  hit: {
    likes: number
    downloads: number
    views: number
    imageWidth: number
    imageHeight: number
  },
  targetAspect: 'horizontal' | 'vertical' | 'square',
): number {
  let score = 0

  // Popularity signal (0-30 points)
  score += Math.min(30, Math.log10(Math.max(1, hit.likes)) * 10)

  // Quality/resolution signal (0-20 points)
  const megapixels = (hit.imageWidth * hit.imageHeight) / 1_000_000
  score += Math.min(20, megapixels * 5)

  // Engagement ratio (0-15 points)
  const engagementRatio = hit.views > 0 ? hit.likes / hit.views : 0
  score += Math.min(15, engagementRatio * 500)

  // Aspect ratio match (0-15 points)
  const aspectRatio = hit.imageWidth / hit.imageHeight
  if (targetAspect === 'horizontal' && aspectRatio > 1.2) score += 15
  else if (targetAspect === 'vertical' && aspectRatio < 0.8) score += 15
  else if (targetAspect === 'square' && aspectRatio > 0.8 && aspectRatio < 1.2) score += 15
  else score += 5

  return score
}

/**
 * Score a Pixabay video hit for relevance and quality.
 */
export function scoreVideoHit(
  hit: {
    likes: number
    downloads: number
    views: number
    duration: number
  },
  targetDurationSecs: number,
): number {
  let score = 0

  // Popularity signal
  score += Math.min(30, Math.log10(Math.max(1, hit.likes)) * 10)

  // Duration match (prefer videos close to target duration)
  const durationDiff = Math.abs(hit.duration - targetDurationSecs)
  score += Math.max(0, 20 - durationDiff * 2)

  // Engagement ratio
  const engagementRatio = hit.views > 0 ? hit.likes / hit.views : 0
  score += Math.min(15, engagementRatio * 500)

  return score
}

// ── Image Processing Pipeline ────────────────────────────────────────────────

/**
 * Apply duotone effect to an image blob.
 * Maps image luminance to a gradient between shadow and highlight colors.
 */
export async function applyDuotone(blob: Blob, config: DuotoneConfig): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const { width, height } = bitmap
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData

  const [sR, sG, sB] = hexToRgb(config.shadow)
  const [hR, hG, hB] = hexToRgb(config.highlight)

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue
    // Luminance
    const L = (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255
    // Lerp between shadow and highlight
    data[i] = Math.round(sR + (hR - sR) * L)
    data[i + 1] = Math.round(sG + (hG - sG) * L)
    data[i + 2] = Math.round(sB + (hB - sB) * L)
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.convertToBlob({ type: 'image/png' })
}

/**
 * Apply color grading to an image blob.
 * Adjusts brightness, contrast, saturation, temperature, and tint.
 */
export async function applyColorGrade(blob: Blob, config: ColorGradeConfig): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const { width, height } = bitmap
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!

  // Use CSS filters for GPU-accelerated processing
  const filters: string[] = []
  if (config.brightness !== 0) {
    filters.push(`brightness(${1 + config.brightness / 100})`)
  }
  if (config.contrast !== 0) {
    filters.push(`contrast(${1 + config.contrast / 100})`)
  }
  if (config.saturation !== 1) {
    filters.push(`saturate(${config.saturation})`)
  }
  // Temperature and tint via hue-rotate approximation
  if (config.temperature !== 0) {
    // Warm = slight sepia, Cool = slight blue shift
    if (config.temperature > 0) {
      filters.push(`sepia(${Math.min(1, config.temperature / 100)})`)
      filters.push(`saturate(${1 + config.temperature / 200})`)
    } else {
      filters.push(`hue-rotate(${config.temperature * 2}deg)`)
    }
  }

  ctx.filter = filters.join(' ') || 'none'
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  ctx.filter = 'none'

  return canvas.convertToBlob({ type: 'image/png' })
}

/**
 * Apply a simple image treatment (desaturate, sepia, high-contrast B&W, etc).
 */
export async function applySimpleTreatment(blob: Blob, treatment: CreativeTreatment): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const { width, height } = bitmap
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!

  let filter = ''
  switch (treatment) {
    case 'desaturate':
      filter = 'saturate(0.2) contrast(1.1)'
      break
    case 'high-contrast-bw':
      filter = 'grayscale(1) contrast(1.6) brightness(1.1)'
      break
    case 'sepia':
      filter = 'sepia(0.8) contrast(1.1) brightness(1.05)'
      break
    case 'cool-tone':
      filter = 'hue-rotate(-15deg) saturate(0.8) brightness(1.05)'
      break
    case 'warm-tone':
      filter = 'sepia(0.3) saturate(1.3) brightness(1.05)'
      break
    case 'posterize':
      filter = 'contrast(1.5) saturate(1.4)'
      break
    default:
      break
  }

  ctx.filter = filter || 'none'
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()
  ctx.filter = 'none'

  // For posterize, we need a manual step to reduce color levels
  if (treatment === 'posterize') {
    const imageData = ctx.getImageData(0, 0, width, height)
    const { data } = imageData
    const levels = 6
    const factor = 255 / (levels - 1)
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] === 0) continue
      data[i] = Math.round(Math.round(data[i] / factor) * factor)
      data[i + 1] = Math.round(Math.round(data[i + 1] / factor) * factor)
      data[i + 2] = Math.round(Math.round(data[i + 2] / factor) * factor)
    }
    ctx.putImageData(imageData, 0, 0)
  }

  return canvas.convertToBlob({ type: 'image/png' })
}

/**
 * Apply a vignette overlay to an image blob.
 */
export async function applyVignette(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const { width, height } = bitmap
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  // Radial gradient vignette
  const cx = width / 2
  const cy = height / 2
  const radius = Math.sqrt(cx * cx + cy * cy)
  const gradient = ctx.createRadialGradient(cx, cy, radius * 0.4, cx, cy, radius)
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(0.7, 'rgba(0,0,0,0.15)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.5)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  return canvas.convertToBlob({ type: 'image/png' })
}

/**
 * Apply tilt-shift blur effect (center sharp, edges blurred).
 */
export async function applyBlurBackground(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob)
  const { width, height } = bitmap
  const canvas = new OffscreenCanvas(width, height)
  const ctx = canvas.getContext('2d')!

  // Draw blurred version
  ctx.filter = 'blur(6px)'
  ctx.drawImage(bitmap, 0, 0)
  ctx.filter = 'none'

  // Draw sharp center with gradient mask
  const maskCanvas = new OffscreenCanvas(width, height)
  const maskCtx = maskCanvas.getContext('2d')!
  maskCtx.drawImage(bitmap, 0, 0)

  // Create center-weighted alpha mask
  const cx = width / 2
  const cy = height / 2
  const radius = Math.min(width, height) * 0.35
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.8)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')

  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'source-over'

  // Draw sharp center on top
  maskCtx.globalCompositeOperation = 'destination-in'
  maskCtx.fillStyle = gradient
  maskCtx.fillRect(0, 0, width, height)
  maskCtx.globalCompositeOperation = 'source-over'

  ctx.drawImage(maskCanvas, 0, 0)

  bitmap.close()
  return canvas.convertToBlob({ type: 'image/png' })
}

// ── Subject Detection (lightweight, no ML) ───────────────────────────────────

/**
 * Detect the approximate subject center of an image using edge density analysis.
 * Returns focus point as percentage (0-100).
 *
 * Uses Sobel edge detection + center-weighted density map to find
 * the area with the most visual interest.
 */
export async function detectSubjectCenter(blob: Blob): Promise<{ x: number; y: number }> {
  const bitmap = await createImageBitmap(blob)
  const { width: w, height: h } = bitmap

  // Downsample for performance (max 256px on longest side)
  const maxDim = 256
  const scale = Math.min(1, maxDim / Math.max(w, h))
  const sw = Math.round(w * scale)
  const sh = Math.round(h * scale)

  const canvas = new OffscreenCanvas(sw, sh)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, sw, sh)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, sw, sh)
  const { data } = imageData

  // Convert to grayscale luminance array
  const gray = new Float32Array(sw * sh)
  for (let i = 0; i < gray.length; i++) {
    const idx = i * 4
    gray[i] = (0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]) / 255
  }

  // Sobel edge magnitude
  const edges = new Float32Array(sw * sh)
  for (let y = 1; y < sh - 1; y++) {
    for (let x = 1; x < sw - 1; x++) {
      const gx =
        -gray[(y - 1) * sw + (x - 1)] +
        gray[(y - 1) * sw + (x + 1)] +
        -2 * gray[y * sw + (x - 1)] +
        2 * gray[y * sw + (x + 1)] +
        -gray[(y + 1) * sw + (x - 1)] +
        gray[(y + 1) * sw + (x + 1)]
      const gy =
        -gray[(y - 1) * sw + (x - 1)] -
        2 * gray[(y - 1) * sw + x] -
        gray[(y - 1) * sw + (x + 1)] +
        gray[(y + 1) * sw + (x - 1)] +
        2 * gray[(y + 1) * sw + x] +
        gray[(y + 1) * sw + (x + 1)]
      edges[y * sw + x] = Math.sqrt(gx * gx + gy * gy)
    }
  }

  // Center-weighted density: divide image into grid blocks and find densest
  const blockSize = Math.max(8, Math.floor(Math.min(sw, sh) / 8))
  let maxDensity = 0
  let bestX = sw / 2
  let bestY = sh / 2

  for (let by = 0; by < sh - blockSize; by += Math.floor(blockSize / 2)) {
    for (let bx = 0; bx < sw - blockSize; bx += Math.floor(blockSize / 2)) {
      let density = 0
      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          density += edges[(by + dy) * sw + (bx + dx)]
        }
      }

      // Center bias: prefer blocks near center (rule of thirds)
      const cx = (bx + blockSize / 2) / sw
      const cy = (by + blockSize / 2) / sh
      const centerDist = Math.sqrt((cx - 0.5) ** 2 + (cy - 0.5) ** 2)
      const centerBias = 1 - centerDist * 0.5

      density *= centerBias

      if (density > maxDensity) {
        maxDensity = density
        bestX = bx + blockSize / 2
        bestY = by + blockSize / 2
      }
    }
  }

  return {
    x: Math.round((bestX / sw) * 100),
    y: Math.round((bestY / sh) * 100),
  }
}

// ── Smart Ken Burns ──────────────────────────────────────────────────────────

/**
 * Generate intelligent Ken Burns configuration based on subject detection.
 * Pans from one region of interest to another with smooth zoom.
 */
export async function generateSmartKenBurns(blob: Blob): Promise<KenBurnsConfig> {
  const subject = await detectSubjectCenter(blob)

  // Pan from slightly offset to center on subject
  const offsetX = (subject.x - 50) * 0.3
  const offsetY = (subject.y - 50) * 0.3

  return {
    startX: 50 - offsetX,
    startY: 50 - offsetY,
    endX: subject.x,
    endY: subject.y,
    startZoom: 1.0,
    endZoom: 1.15,
  }
}

// ── Treatment Pipeline ───────────────────────────────────────────────────────

/**
 * Apply a full treatment plan to an image blob.
 * Returns the processed blob and any metadata.
 */
export async function applyTreatmentPipeline(
  blob: Blob,
  plan: MediaTreatmentPlan,
): Promise<{ blob: Blob; kenBurns?: KenBurnsConfig }> {
  let result = blob
  let kenBurns = plan.kenBurns

  // 1. Background removal (must be first — other effects need alpha)
  if (plan.treatment === 'bg-remove') {
    result = await removeImageBackground(result)
  }

  // 2. Apply main treatment
  switch (plan.treatment) {
    case 'duotone':
      if (plan.duotone) {
        result = await applyDuotone(result, plan.duotone)
      }
      break
    case 'color-grade':
      if (plan.colorGrade) {
        result = await applyColorGrade(result, plan.colorGrade)
      }
      break
    case 'desaturate':
    case 'high-contrast-bw':
    case 'sepia':
    case 'cool-tone':
    case 'warm-tone':
    case 'posterize':
      result = await applySimpleTreatment(result, plan.treatment)
      break
    case 'blur-bg':
      result = await applyBlurBackground(result)
      break
    case 'none':
    case 'bg-remove':
      // Already handled or no treatment
      break
  }

  // 3. Optional vignette overlay
  if (plan.addVignette) {
    result = await applyVignette(result)
  }

  // 4. Smart Ken Burns if no explicit config provided
  if (!kenBurns && plan.smartCrop) {
    kenBurns = await generateSmartKenBurns(result)
  }

  return { blob: result, kenBurns }
}

// ── Creative Approach Selection ──────────────────────────────────────────────

export type CreativeApproach =
  | 'cutout-on-color' // BG remove person, place on solid/gradient color
  | 'duotone-overlay' // Duotone-treated image as background
  | 'split-comparison' // Side-by-side before/after or A vs B
  | 'parallax-layers' // Multiple depth layers for parallax
  | 'cinematic-bars' // Letterbox with cinematic treatment
  | 'texture-overlay' // Transparent texture on top of content
  | 'reveal-wipe' // Image revealed via wipe animation
  | 'zoom-to-detail' // Ken Burns from wide to detail
  | 'blur-to-sharp' // Start blurred, reveal sharp
  | 'standard' // Basic placement with color grade

/**
 * Suggest creative approaches based on the media role and narrative context.
 */
export function suggestCreativeApproach(
  role: string,
  query: string,
  type: 'image' | 'video',
): { approach: CreativeApproach; treatment: MediaTreatmentPlan } {
  const lower = query.toLowerCase()

  // Person/people queries → cutout on colored background
  const isPerson = /person|people|man|woman|team|speaker|presenter|ceo|founder/.test(lower)
  if (isPerson && type === 'image' && role === 'overlay') {
    return {
      approach: 'cutout-on-color',
      treatment: {
        treatment: 'bg-remove',
        addVignette: false,
      },
    }
  }

  // Background role → cinematic color grade + Ken Burns
  if (role === 'background') {
    return {
      approach: 'zoom-to-detail',
      treatment: {
        treatment: 'color-grade',
        colorGrade: COLOR_GRADE_PRESETS['cinematic'],
        addVignette: true,
      },
    }
  }

  // Abstract/texture queries → texture overlay
  if (/abstract|texture|pattern|gradient|smoke|particles/.test(lower)) {
    return {
      approach: 'texture-overlay',
      treatment: {
        treatment: 'none',
        blendMode: 'soft-light',
      },
    }
  }

  // Comparison/vs queries → split screen
  if (/vs|versus|compare|before.*after|old.*new/.test(lower)) {
    return {
      approach: 'split-comparison',
      treatment: {
        treatment: 'color-grade',
        colorGrade: COLOR_GRADE_PRESETS['vibrant'],
      },
    }
  }

  // Cutaway → muted film look with vignette
  if (role === 'cutaway') {
    return {
      approach: 'cinematic-bars',
      treatment: {
        treatment: 'color-grade',
        colorGrade: COLOR_GRADE_PRESETS['muted-film'],
        addVignette: true,
      },
    }
  }

  // Accent → warm/vibrant small overlay
  if (role === 'accent') {
    return {
      approach: 'standard',
      treatment: {
        treatment: 'color-grade',
        colorGrade: COLOR_GRADE_PRESETS['vibrant'],
      },
    }
  }

  // Default → standard with documentary grade
  return {
    approach: 'standard',
    treatment: {
      treatment: 'color-grade',
      colorGrade: COLOR_GRADE_PRESETS['documentary'],
    },
  }
}

// ── Multi-query search strategy ──────────────────────────────────────────────

export interface SearchStrategy {
  /** Primary search query */
  primaryQuery: string
  /** Fallback queries if primary returns no results */
  fallbackQueries: string[]
  /** Recommended Pixabay category filter */
  category?: string
  /** Recommended minimum resolution */
  minWidth?: number
  minHeight?: number
  /** Preferred image type */
  imageType?: 'photo' | 'illustration' | 'vector'
}

// ── Video Intelligence ───────────────────────────────────────────────────────

/**
 * Frame analysis result from video sampling.
 */
interface FrameAnalysis {
  /** Time in seconds */
  time: number
  /** Average brightness (0-255) */
  brightness: number
  /** Motion score relative to previous frame (0-1) */
  motion: number
  /** Edge density — proxy for "subject visible" (0-1) */
  edgeDensity: number
  /** Combined interest score */
  interest: number
}

/**
 * Load a video element from a URL and wait for metadata + seekable readiness.
 */
function loadVideoElement(url: string): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.muted = true
    video.preload = 'auto'
    video.playsInline = true

    const cleanup = () => {
      video.removeEventListener('loadeddata', onLoaded)
      video.removeEventListener('error', onError)
    }

    const onLoaded = () => {
      cleanup()
      resolve(video)
    }
    const onError = () => {
      cleanup()
      reject(new Error(`Failed to load video: ${url}`))
    }

    video.addEventListener('loadeddata', onLoaded)
    video.addEventListener('error', onError)
    video.src = url

    // Timeout after 15s
    setTimeout(() => {
      cleanup()
      reject(new Error('Video load timeout'))
    }, 15000)
  })
}

/**
 * Seek a video to a specific time and wait for the frame to be ready.
 */
function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - time) < 0.05) {
      resolve()
      return
    }
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      resolve()
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = time
  })
}

/**
 * Sample a single video frame and compute analysis metrics.
 * Uses a small canvas (160px wide) for performance.
 */
function analyzeFrame(
  video: HTMLVideoElement,
  ctx: OffscreenCanvasRenderingContext2D,
  prevGray: Float32Array | null,
  sw: number,
  sh: number,
): { brightness: number; motion: number; edgeDensity: number; gray: Float32Array } {
  ctx.drawImage(video, 0, 0, sw, sh)
  const imageData = ctx.getImageData(0, 0, sw, sh)
  const { data } = imageData
  const totalPixels = sw * sh

  // Grayscale luminance
  const gray = new Float32Array(totalPixels)
  let brightnessSum = 0

  for (let i = 0; i < totalPixels; i++) {
    const idx = i * 4
    const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
    gray[i] = lum
    brightnessSum += lum
  }

  const brightness = brightnessSum / totalPixels

  // Inter-frame motion (mean absolute difference)
  let motion = 0
  if (prevGray) {
    let diffSum = 0
    for (let i = 0; i < totalPixels; i++) {
      diffSum += Math.abs(gray[i] - prevGray[i])
    }
    motion = diffSum / totalPixels / 255
  }

  // Edge density using simplified Sobel on the downsampled frame
  let edgeSum = 0
  for (let y = 1; y < sh - 1; y++) {
    for (let x = 1; x < sw - 1; x++) {
      const gx =
        -gray[(y - 1) * sw + (x - 1)] +
        gray[(y - 1) * sw + (x + 1)] +
        -2 * gray[y * sw + (x - 1)] +
        2 * gray[y * sw + (x + 1)] +
        -gray[(y + 1) * sw + (x - 1)] +
        gray[(y + 1) * sw + (x + 1)]
      const gy =
        -gray[(y - 1) * sw + (x - 1)] -
        2 * gray[(y - 1) * sw + x] -
        gray[(y - 1) * sw + (x + 1)] +
        gray[(y + 1) * sw + (x - 1)] +
        2 * gray[(y + 1) * sw + x] +
        gray[(y + 1) * sw + (x + 1)]
      edgeSum += Math.sqrt(gx * gx + gy * gy)
    }
  }
  const edgeDensity = Math.min(1, edgeSum / ((sw - 2) * (sh - 2)) / 200)

  return { brightness, motion, edgeDensity, gray }
}

/**
 * Sample a video at regular intervals and compute per-frame analysis.
 * Uses ~0.5s intervals for a good balance of accuracy and speed.
 */
async function sampleVideoFrames(
  videoUrl: string,
  sampleIntervalSecs = 0.5,
): Promise<{ frames: FrameAnalysis[]; duration: number }> {
  const video = await loadVideoElement(videoUrl)
  const duration = video.duration

  if (!duration || !isFinite(duration) || duration < 0.5) {
    return { frames: [], duration: duration || 0 }
  }

  // Downsample for speed
  const sw = 160
  const sh = Math.round(sw * (video.videoHeight / video.videoWidth))
  const canvas = new OffscreenCanvas(sw, sh)
  const ctx = canvas.getContext('2d')!

  const frames: FrameAnalysis[] = []
  let prevGray: Float32Array | null = null
  const numSamples = Math.min(60, Math.ceil(duration / sampleIntervalSecs))

  for (let i = 0; i < numSamples; i++) {
    const time = (i / numSamples) * duration
    await seekTo(video, time)

    const result = analyzeFrame(video, ctx, prevGray, sw, sh)
    prevGray = result.gray

    // Combined interest: motion + edge density, penalized by extreme brightness (fades)
    const brightnessPenalty = result.brightness < 30 || result.brightness > 240 ? 0.3 : 1
    const interest = (result.motion * 0.6 + result.edgeDensity * 0.4) * brightnessPenalty

    frames.push({
      time,
      brightness: result.brightness,
      motion: result.motion,
      edgeDensity: result.edgeDensity,
      interest,
    })
  }

  // Clean up
  video.pause()
  video.removeAttribute('src')
  video.load()

  return { frames, duration }
}

/**
 * Find the best segment in a stock video for a given target duration.
 *
 * Analyzes motion, edge density (subject presence), and brightness to avoid
 * fade-in/out sections. Returns the trim config for the most "interesting" window.
 *
 * @param videoUrl - URL of the video to analyze (blob: or http:)
 * @param targetDuration - Desired segment length in seconds
 * @returns VideoTrimConfig with the best start/end times
 */
export async function findBestSegment(videoUrl: string, targetDuration: number): Promise<VideoTrimConfig> {
  const { frames, duration } = await sampleVideoFrames(videoUrl)

  // If video is shorter than target, return the full video
  if (duration <= targetDuration || frames.length < 3) {
    return { startTime: 0, endTime: duration }
  }

  // Sliding window: find the window of targetDuration with highest total interest
  let bestStart = 0
  let bestScore = -1

  for (let i = 0; i < frames.length; i++) {
    const windowStart = frames[i].time
    const windowEnd = windowStart + targetDuration

    if (windowEnd > duration) break

    // Sum interest of frames within this window
    let windowScore = 0
    let count = 0
    for (let j = i; j < frames.length && frames[j].time < windowEnd; j++) {
      windowScore += frames[j].interest
      count++
    }

    // Normalize by frame count
    if (count > 0) windowScore /= count

    // Penalize segments near the very start or end (often fade-in/out)
    const startPenalty = windowStart < 0.5 ? 0.7 : 1
    const endPenalty = windowEnd > duration - 0.5 ? 0.7 : 1
    windowScore *= startPenalty * endPenalty

    if (windowScore > bestScore) {
      bestScore = windowScore
      bestStart = windowStart
    }
  }

  return {
    startTime: Math.round(bestStart * 100) / 100,
    endTime: Math.round((bestStart + targetDuration) * 100) / 100,
  }
}

/**
 * Loop point detection result.
 */
export interface LoopPointConfig {
  /** Recommended loop start time in seconds */
  loopStart: number
  /** Recommended loop end time in seconds */
  loopEnd: number
  /** Similarity score between start and end frames (0-1, higher = smoother loop) */
  similarity: number
}

/**
 * Detect the best loop boundaries for a background video.
 *
 * Compares frames from the first and last portions of the video to find
 * the pair with the highest color histogram similarity, producing a
 * seamless loop point.
 *
 * @param videoUrl - URL of the video to analyze
 * @param marginPercent - Percentage of video to search in start/end regions (default 30%)
 * @returns LoopPointConfig with best loop boundaries
 */
export async function findLoopPoint(videoUrl: string, marginPercent = 0.3): Promise<LoopPointConfig> {
  const video = await loadVideoElement(videoUrl)
  const duration = video.duration

  if (!duration || !isFinite(duration) || duration < 1) {
    return { loopStart: 0, loopEnd: duration || 0, similarity: 0 }
  }

  const sw = 80 // Even smaller for histogram comparison
  const sh = Math.round(sw * (video.videoHeight / video.videoWidth))
  const canvas = new OffscreenCanvas(sw, sh)
  const ctx = canvas.getContext('2d')!

  const marginDuration = duration * marginPercent
  const numSamplesPerRegion = Math.min(12, Math.ceil(marginDuration / 0.3))

  // Compute color histograms for start and end regions
  interface HistFrame {
    time: number
    histogram: Float32Array // 3 * 32 bins = 96 values
  }

  const computeHistogram = (): Float32Array => {
    const imageData = ctx.getImageData(0, 0, sw, sh)
    const { data } = imageData
    const hist = new Float32Array(96) // R(32) + G(32) + B(32)
    const totalPixels = sw * sh

    for (let i = 0; i < totalPixels; i++) {
      const idx = i * 4
      if (data[idx + 3] === 0) continue
      const rBin = Math.min(31, data[idx] >> 3)
      const gBin = Math.min(31, data[idx + 1] >> 3)
      const bBin = Math.min(31, data[idx + 2] >> 3)
      hist[rBin]++
      hist[32 + gBin]++
      hist[64 + bBin]++
    }

    // Normalize
    for (let i = 0; i < 96; i++) hist[i] /= totalPixels
    return hist
  }

  const histogramSimilarity = (a: Float32Array, b: Float32Array): number => {
    // Intersection similarity (0-1)
    let intersection = 0
    let sumA = 0
    let sumB = 0
    for (let i = 0; i < a.length; i++) {
      intersection += Math.min(a[i], b[i])
      sumA += a[i]
      sumB += b[i]
    }
    const denom = Math.max(sumA, sumB)
    return denom > 0 ? intersection / denom : 0
  }

  // Sample start region
  const startFrames: HistFrame[] = []
  for (let i = 0; i < numSamplesPerRegion; i++) {
    const time = (i / numSamplesPerRegion) * marginDuration
    await seekTo(video, time)
    ctx.drawImage(video, 0, 0, sw, sh)
    startFrames.push({ time, histogram: computeHistogram() })
  }

  // Sample end region
  const endFrames: HistFrame[] = []
  for (let i = 0; i < numSamplesPerRegion; i++) {
    const time = duration - marginDuration + (i / numSamplesPerRegion) * marginDuration
    await seekTo(video, time)
    ctx.drawImage(video, 0, 0, sw, sh)
    endFrames.push({ time, histogram: computeHistogram() })
  }

  // Find the best start/end pair with highest similarity
  let bestSimilarity = 0
  let bestStart = 0
  let bestEnd = duration

  for (const sf of startFrames) {
    for (const ef of endFrames) {
      if (ef.time <= sf.time) continue
      const sim = histogramSimilarity(sf.histogram, ef.histogram)
      if (sim > bestSimilarity) {
        bestSimilarity = sim
        bestStart = sf.time
        bestEnd = ef.time
      }
    }
  }

  // Clean up
  video.pause()
  video.removeAttribute('src')
  video.load()

  return {
    loopStart: Math.round(bestStart * 100) / 100,
    loopEnd: Math.round(bestEnd * 100) / 100,
    similarity: Math.round(bestSimilarity * 1000) / 1000,
  }
}

/**
 * Generate a speed ramp configuration based on video motion analysis.
 *
 * High-motion segments get slowed down (dramatic emphasis), and
 * low-motion segments get sped up (skip boring parts).
 * The total effective duration matches the target.
 *
 * @param videoUrl - URL of the video to analyze
 * @param targetDuration - Desired effective playback duration in seconds
 * @returns SpeedRampConfig with segments and their speed multipliers
 */
export async function generateSpeedRamp(videoUrl: string, targetDuration: number): Promise<SpeedRampConfig> {
  const { frames, duration } = await sampleVideoFrames(videoUrl, 0.3)

  if (frames.length < 4 || duration < 1) {
    return { segments: [{ startPercent: 0, endPercent: 100, speed: 1 }] }
  }

  // Divide into ~8 segments for speed ramping
  const numSegments = Math.min(8, Math.max(3, Math.floor(frames.length / 3)))
  const framesPerSegment = Math.ceil(frames.length / numSegments)

  // Compute average motion per segment
  const segmentMotion: number[] = []
  for (let s = 0; s < numSegments; s++) {
    const start = s * framesPerSegment
    const end = Math.min((s + 1) * framesPerSegment, frames.length)
    let motionSum = 0
    let count = 0
    for (let i = start; i < end; i++) {
      motionSum += frames[i].motion
      count++
    }
    segmentMotion.push(count > 0 ? motionSum / count : 0)
  }

  // Classify segments: high motion → slow (0.5x-0.7x), low motion → fast (1.5x-2x)
  const maxMotion = Math.max(...segmentMotion, 0.001)
  const minMotion = Math.min(...segmentMotion)
  const motionRange = maxMotion - minMotion || 0.001

  const rawSpeeds = segmentMotion.map((m) => {
    const normalized = (m - minMotion) / motionRange // 0 = low motion, 1 = high motion
    // High motion → slow (0.5), Low motion → fast (2.0)
    return 2.0 - normalized * 1.5 // Range: 0.5 to 2.0
  })

  // Adjust speeds so total effective duration matches target
  // Effective duration = sum(segmentDuration / speed)
  const segmentDuration = duration / numSegments
  const rawTotalEffective = rawSpeeds.reduce((sum, speed) => sum + segmentDuration / speed, 0)
  const scaleFactor = rawTotalEffective / targetDuration

  const segments = rawSpeeds.map((rawSpeed, i) => {
    const adjustedSpeed = Math.max(0.25, Math.min(4, rawSpeed * scaleFactor))
    // Round speed to nearest 0.25 for cleaner values
    const roundedSpeed = Math.round(adjustedSpeed * 4) / 4

    return {
      startPercent: Math.round((i / numSegments) * 100),
      endPercent: Math.round(((i + 1) / numSegments) * 100),
      speed: roundedSpeed,
    }
  })

  // Merge adjacent segments with same speed
  const merged: SpeedRampConfig['segments'] = [segments[0]]
  for (let i = 1; i < segments.length; i++) {
    const last = merged[merged.length - 1]
    if (segments[i].speed === last.speed) {
      last.endPercent = segments[i].endPercent
    } else {
      merged.push(segments[i])
    }
  }

  return { segments: merged }
}

// ── Multi-query search strategy ──────────────────────────────────────────────

/**
 * Build a multi-query search strategy for a stock media item.
 * Generates the primary query plus fallbacks, and infers category filters.
 */
export function buildSearchStrategy(query: string, role: string, type: 'image' | 'video'): SearchStrategy {
  const lower = query.toLowerCase()

  // Expand concepts into multiple queries
  const expanded = expandSearchConcept(query)
  const primaryQuery = expanded[0]
  const fallbackQueries = expanded.slice(1)

  // Add generic fallbacks
  if (fallbackQueries.length < 2) {
    // Extract key nouns for simpler fallback
    const words = query.split(/\s+/).filter((w) => w.length > 3)
    if (words.length >= 2) {
      fallbackQueries.push(words.slice(0, 2).join(' '))
    }
    fallbackQueries.push(words[0] || query)
  }

  // Infer category
  let category: string | undefined
  if (/nature|forest|mountain|ocean|sunset|landscape/.test(lower)) category = 'nature'
  else if (/office|business|meeting|corporate|startup/.test(lower)) category = 'business'
  else if (/food|cooking|restaurant|coffee|meal/.test(lower)) category = 'food'
  else if (/city|building|architecture|urban|skyline/.test(lower)) category = 'buildings'
  else if (/laptop|computer|phone|technology|code/.test(lower)) category = 'computer'
  else if (/person|people|team|crowd|face/.test(lower)) category = 'people'
  else if (/car|plane|train|travel|road/.test(lower)) category = 'transportation'

  // Resolution requirements by role
  const minWidth = role === 'background' || role === 'cutaway' ? 1280 : 640
  const minHeight = role === 'background' || role === 'cutaway' ? 720 : 480

  return {
    primaryQuery,
    fallbackQueries,
    category,
    minWidth,
    minHeight,
    imageType: type === 'image' ? 'photo' : undefined,
  }
}
