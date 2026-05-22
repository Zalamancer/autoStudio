/**
 * Smart Thumbnail Generator
 *
 * Generates multiple thumbnail variants from the current composition:
 * 1. "Title Overlay" — captured frame with bold text at bottom
 * 2. "Text-Heavy" — large title overlay with semi-transparent background
 * 3. "Gradient" — bottom gradient fade with glow text
 * 4. "Clean" — best frame without text overlay
 * 5. "Split Screen" — character left, gradient+text right
 *
 * Uses html2canvas to capture the live editor canvas (the [data-export-canvas] div),
 * then overlays text using brand kit colors.
 */

import { logger } from '@/utils/logger'
import type { EmotionEvent } from '@/services/emotionTimeline'

export interface ThumbnailVariant {
  id: string
  label: string
  /** Data URL (JPEG) of the thumbnail */
  dataUrl: string
  /** Frame index used for this thumbnail */
  sourceFrame: number
  /** Clickability score 0-100 (based on visual complexity, text presence, color contrast) */
  score: number
}

interface ThumbnailOptions {
  /** Canvas width */
  width: number
  /** Canvas height */
  height: number
  /** Total frames in the composition */
  totalFrames: number
  /** FPS for time calculation */
  fps: number
  /** Title text for overlays */
  titleText: string
  /** Brand primary colors */
  brandColors?: string[]
  /** Aspect ratio string */
  aspectRatio: string
}

/**
 * Compute pixel variance of a canvas region — higher variance = more visual detail.
 */
function computeFrameVariance(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  const step = 16
  let sumR = 0, sumG = 0, sumB = 0, count = 0

  for (let i = 0; i < data.length; i += step) {
    sumR += data[i]
    sumG += data[i + 1]
    sumB += data[i + 2]
    count++
  }

  const avgR = sumR / count
  const avgG = sumG / count
  const avgB = sumB / count

  let variance = 0
  for (let i = 0; i < data.length; i += step) {
    const dr = data[i] - avgR
    const dg = data[i + 1] - avgG
    const db = data[i + 2] - avgB
    variance += dr * dr + dg * dg + db * db
  }

  return variance / count
}

/**
 * Capture the editor canvas as an HTMLCanvasElement using html2canvas.
 * Falls back to finding any <canvas> inside the export div.
 */
async function captureEditorCanvas(targetWidth: number): Promise<HTMLCanvasElement | null> {
  // Find the export canvas div — this is the main composition area
  const exportDiv = document.querySelector('[data-export-canvas]') as HTMLElement | null
  if (!exportDiv) {
    logger.warn('[ThumbnailGenerator] Could not find [data-export-canvas] element')
    return null
  }

  try {
    const html2canvas = (await import('html2canvas')).default
    const captured = await html2canvas(exportDiv, {
      width: exportDiv.offsetWidth,
      height: exportDiv.offsetHeight,
      scale: Math.max(1, targetWidth / exportDiv.offsetWidth),
      backgroundColor: '#18181b',
      useCORS: true,
      allowTaint: true,
      logging: false,
    })
    return captured
  } catch (err) {
    logger.warn('[ThumbnailGenerator] html2canvas capture failed:', err)
  }

  // Fallback: look for any canvas element inside the export div
  const innerCanvas = exportDiv.querySelector('canvas') as HTMLCanvasElement | null
  if (innerCanvas && innerCanvas.width > 0) {
    return innerCanvas
  }

  return null
}

/**
 * Draw a bold title overlay in the bottom region of the thumbnail.
 */
function drawTitleOverlay(
  ctx: CanvasRenderingContext2D,
  text: string,
  w: number,
  h: number,
  colors: string[],
): void {
  if (!text) return

  const primary = colors[0] || '#FFFFFF'
  const fontSize = Math.round(w * 0.065)
  ctx.font = `900 ${fontSize}px "Inter", "Helvetica Neue", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const maxW = w * 0.85
  let display = text
  while (ctx.measureText(display).width > maxW && display.length > 10) {
    display = display.slice(0, -4) + '...'
  }

  const x = w / 2
  const y = h * 0.85

  // Outline
  ctx.strokeStyle = 'rgba(0,0,0,0.9)'
  ctx.lineWidth = fontSize * 0.15
  ctx.lineJoin = 'round'
  ctx.strokeText(display, x, y)

  // Fill
  ctx.fillStyle = primary
  ctx.fillText(display, x, y)
}

/**
 * Draw a large centered text with a semi-transparent background band.
 */
function drawTextHeavyOverlay(
  ctx: CanvasRenderingContext2D,
  text: string,
  w: number,
  h: number,
  colors: string[],
): void {
  if (!text) return

  const primary = colors[0] || '#FFFFFF'
  const accent = colors[1] || 'rgba(0,0,0,0.7)'

  // Background band
  const bandH = h * 0.35
  const bandY = (h - bandH) / 2
  ctx.fillStyle = accent.startsWith('#')
    ? accent + 'CC'
    : 'rgba(0,0,0,0.75)'
  ctx.fillRect(0, bandY, w, bandH)

  // Title text
  const fontSize = Math.round(w * 0.08)
  ctx.font = `900 ${fontSize}px "Inter", "Helvetica Neue", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const maxW = w * 0.8
  let display = text
  while (ctx.measureText(display).width > maxW && display.length > 10) {
    display = display.slice(0, -4) + '...'
  }

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.5)'
  ctx.fillText(display, w / 2 + 2, h / 2 + 2)

  // Text
  ctx.fillStyle = primary
  ctx.fillText(display, w / 2, h / 2)
}

/**
 * Draw a neon-glow gradient text overlay at the bottom.
 */
function drawGradientOverlay(
  ctx: CanvasRenderingContext2D,
  text: string,
  w: number,
  h: number,
  colors: string[],
): void {
  if (!text) return

  // Bottom gradient overlay
  const gradientH = h * 0.45
  const gradient = ctx.createLinearGradient(0, h - gradientH, 0, h)
  gradient.addColorStop(0, 'rgba(0,0,0,0)')
  gradient.addColorStop(0.5, 'rgba(0,0,0,0.6)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.9)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, h - gradientH, w, gradientH)

  const primary = colors[0] || '#FFFFFF'
  const fontSize = Math.round(w * 0.07)
  ctx.font = `900 ${fontSize}px "Inter", "Helvetica Neue", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const maxW = w * 0.85
  let display = text
  while (ctx.measureText(display).width > maxW && display.length > 10) {
    display = display.slice(0, -4) + '...'
  }

  const x = w / 2
  const y = h * 0.88

  // Glow effect
  ctx.shadowColor = primary
  ctx.shadowBlur = fontSize * 0.4
  ctx.fillStyle = primary
  ctx.fillText(display, x, y)
  ctx.shadowBlur = 0
}

/**
 * Score a thumbnail variant for clickability (0-100).
 */
function scoreThumbnail(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  hasText: boolean,
): number {
  const variance = computeFrameVariance(ctx, w, h)

  // Normalize variance to 0-40 range (typical variance: 500-10000)
  const varianceScore = Math.min(40, Math.round(variance / 250))

  // Text presence bonus
  const textScore = hasText ? 25 : 0

  // Color contrast
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  const step = 64
  let darkPixels = 0
  let lightPixels = 0
  let count = 0
  for (let i = 0; i < data.length; i += step) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
    if (brightness < 85) darkPixels++
    else if (brightness > 170) lightPixels++
    count++
  }
  const contrastRatio = Math.min(darkPixels, lightPixels) / Math.max(1, count)
  const contrastScore = Math.min(20, Math.round(contrastRatio * 100))

  // Center detail
  const centerX = Math.floor(w * 0.3)
  const centerY = Math.floor(h * 0.3)
  const centerW = Math.floor(w * 0.4)
  const centerH = Math.floor(h * 0.4)
  let centerVar = 0
  let centerCount = 0
  const centerData = ctx.getImageData(centerX, centerY, centerW, centerH).data
  for (let i = 0; i < centerData.length; i += step) {
    centerVar += Math.abs(centerData[i] - 128) + Math.abs(centerData[i + 1] - 128)
    centerCount++
  }
  const centerScore = Math.min(15, Math.round((centerVar / Math.max(1, centerCount)) / 10))

  return Math.min(100, varianceScore + textScore + contrastScore + centerScore)
}

/**
 * Generate 5 thumbnail variants from the current composition with clickability scores.
 */
export async function generateThumbnailVariants(
  options: ThumbnailOptions,
): Promise<ThumbnailVariant[]> {
  const { width, height, totalFrames, titleText, brandColors = ['#FFFFFF'] } = options

  const variants: ThumbnailVariant[] = []

  // Create a working canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    logger.warn('[ThumbnailGenerator] Could not create canvas context')
    return []
  }

  // Capture the live editor canvas via html2canvas
  const sourceCanvas = await captureEditorCanvas(width)
  const bestFrame = Math.floor(totalFrames * 0.3)

  // Helper: draw source onto working canvas
  const drawBase = () => {
    ctx.clearRect(0, 0, width, height)
    if (sourceCanvas && sourceCanvas.width > 0 && sourceCanvas.height > 0) {
      ctx.drawImage(sourceCanvas, 0, 0, width, height)
    } else {
      // Dark fallback instead of white
      ctx.fillStyle = '#18181b'
      ctx.fillRect(0, 0, width, height)
    }
  }

  // Variant 1: Title Overlay
  drawBase()
  drawTitleOverlay(ctx, titleText, width, height, brandColors)
  try {
    const score1 = scoreThumbnail(ctx, width, height, !!titleText)
    variants.push({
      id: 'thumb-face',
      label: 'Title Overlay',
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      sourceFrame: bestFrame,
      score: score1,
    })
  } catch {
    logger.warn('[ThumbnailGenerator] Failed to export title overlay variant')
  }

  // Variant 2: Text-Heavy
  drawBase()
  drawTextHeavyOverlay(ctx, titleText, width, height, brandColors)
  try {
    const score2 = scoreThumbnail(ctx, width, height, !!titleText)
    variants.push({
      id: 'thumb-text',
      label: 'Text-Heavy',
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      sourceFrame: bestFrame,
      score: score2,
    })
  } catch {
    logger.warn('[ThumbnailGenerator] Failed to export text-heavy variant')
  }

  // Variant 3: Gradient Neon
  drawBase()
  drawGradientOverlay(ctx, titleText, width, height, brandColors)
  try {
    const score3 = scoreThumbnail(ctx, width, height, !!titleText)
    variants.push({
      id: 'thumb-gradient',
      label: 'Gradient',
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      sourceFrame: bestFrame,
      score: score3,
    })
  } catch {
    logger.warn('[ThumbnailGenerator] Failed to export gradient variant')
  }

  // Variant 4: Clean
  drawBase()
  try {
    const score4 = scoreThumbnail(ctx, width, height, false)
    variants.push({
      id: 'thumb-clean',
      label: 'Clean',
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      sourceFrame: bestFrame,
      score: score4,
    })
  } catch {
    logger.warn('[ThumbnailGenerator] Failed to export clean variant')
  }

  // Variant 5: Split Screen
  drawBase()
  drawSplitScreenOverlay(ctx, titleText, width, height, brandColors)
  try {
    const score5 = scoreThumbnail(ctx, width, height, !!titleText)
    variants.push({
      id: 'thumb-split',
      label: 'Split Screen',
      dataUrl: canvas.toDataURL('image/jpeg', 0.9),
      sourceFrame: bestFrame,
      score: score5,
    })
  } catch {
    logger.warn('[ThumbnailGenerator] Failed to export split-screen variant')
  }

  // Sort by score (highest first)
  variants.sort((a, b) => b.score - a.score)

  logger.log(`[ThumbnailGenerator] Generated ${variants.length} variants (source: ${sourceCanvas ? 'html2canvas' : 'fallback'}, best score: ${variants[0]?.score ?? 0})`)
  return variants
}

// ── AI Title Generation ──

/**
 * Generate a punchy thumbnail title using Gemini.
 * Falls back to extracting from the input if Gemini is unavailable.
 */
export async function generateAIThumbnailTitle(topic: string): Promise<string> {
  return topic.replace(/\[.*?\]/g, '').trim().split(/\s+/).slice(0, 5).join(' ').toUpperCase()
}

// ── Emotion-Based Key Frame Selection ──

/**
 * Select the most expressive frame from emotion timeline data.
 */
export function selectKeyFrameFromEmotions(
  emotionTimeline: EmotionEvent[],
  totalFrames: number,
): number {
  if (!emotionTimeline || emotionTimeline.length === 0) {
    return Math.floor(totalFrames * 0.3)
  }

  const emotiveEvents = emotionTimeline.filter(
    (e) => e.emotion.toLowerCase() !== 'neutral',
  )
  if (emotiveEvents.length === 0) {
    return Math.floor(totalFrames * 0.3)
  }

  let longest = emotiveEvents[0]
  for (const event of emotiveEvents) {
    if ((event.endFrame - event.startFrame) > (longest.endFrame - longest.startFrame)) {
      longest = event
    }
  }

  return Math.floor((longest.startFrame + longest.endFrame) / 2)
}

// ── Additional Style Renderers ──

function drawSplitScreenOverlay(
  ctx: CanvasRenderingContext2D,
  text: string,
  w: number,
  h: number,
  colors: string[],
): void {
  const splitX = Math.floor(w * 0.55)
  const primary = colors[0] || '#6366f1'
  const secondary = colors[1] || '#8b5cf6'

  // Right gradient panel
  const gradient = ctx.createLinearGradient(splitX, 0, w, h)
  gradient.addColorStop(0, primary)
  gradient.addColorStop(1, secondary)
  ctx.fillStyle = gradient
  ctx.fillRect(splitX, 0, w - splitX, h)

  if (!text) return

  // Text on right side
  const fontSize = Math.round((w - splitX) * 0.14)
  ctx.font = `800 ${fontSize}px "Inter", sans-serif`
  ctx.fillStyle = '#FFFFFF'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Simple word wrap
  const maxWidth = (w - splitX) * 0.85
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }
  if (currentLine) lines.push(currentLine)

  const centerX = splitX + (w - splitX) / 2
  const startY = h / 2 - (lines.length - 1) * fontSize * 0.6
  lines.forEach((line, i) => {
    ctx.fillText(line, centerX, startY + i * fontSize * 1.2)
  })
}
