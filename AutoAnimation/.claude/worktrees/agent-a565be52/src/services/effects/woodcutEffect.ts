/**
 * Woodcut / linocut effect: Simulates carved parallel grooves.
 * Dark areas → dense parallel lines, light areas → sparse/no lines.
 * Lines run at a configurable angle with slight organic waviness.
 */

import type { WoodcutSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

// ---------------------------------------------------------------------------
// Line pattern generator — runs ONCE per settings/size change
// ---------------------------------------------------------------------------

let _patternCanvas: HTMLCanvasElement | null = null
let _crossPatternCanvas: HTMLCanvasElement | null = null
/** Line pattern on solid background — full coverage, not masked to any source */
let _patternOnBg: HTMLCanvasElement | null = null
let _crossPatternOnBg: HTMLCanvasElement | null = null
let _patternKey = ''

function generateLinePattern(
  w: number, h: number,
  lineWeight: number,
  angle: number,
  spacing: number,
  color: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const diag = Math.sqrt(w * w + h * h)
  const lineCount = Math.ceil(diag / spacing)

  ctx.strokeStyle = color
  ctx.lineWidth = lineWeight
  ctx.lineCap = 'butt'

  for (let i = -lineCount; i <= lineCount; i++) {
    const offset = i * spacing
    const cx = w / 2 + offset * (-sin)
    const cy = h / 2 + offset * cos
    const x1 = cx - diag * cos
    const y1 = cy - diag * sin
    const x2 = cx + diag * cos
    const y2 = cy + diag * sin

    ctx.beginPath()
    const sampleStep = 3
    const steps = Math.ceil(diag * 2 / sampleStep)
    const waveAmt = lineWeight * 0.3

    for (let step = 0; step <= steps; step++) {
      const t = step / steps
      const px = x1 + (x2 - x1) * t
      const py = y1 + (y2 - y1) * t
      const wave = Math.sin(step * 0.08 + i * 2.7) * waveAmt
      const wpx = px + wave * sin
      const wpy = py - wave * cos

      if (step === 0) ctx.moveTo(wpx, wpy)
      else ctx.lineTo(wpx, wpy)
    }
    ctx.stroke()
  }

  return canvas
}

/** Build full-coverage pattern on a solid background (fully opaque) */
function buildOnBg(pattern: HTMLCanvasElement, bgColor: string): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = pattern.width
  c.height = pattern.height
  const ctx = c.getContext('2d')!
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(pattern, 0, 0)
  return c
}

function ensurePatterns(w: number, h: number, s: WoodcutSettings) {
  const key = `${w}|${h}|${s.lineWeight}|${s.invert ? 1 : 0}`
  if (_patternKey === key && _patternCanvas) return

  const lineColor = s.invert ? '#e8e0d0' : '#1a1008'
  const lineSpacing = s.lineWeight + 1
  const grooveAngle = 15 * (Math.PI / 180)

  _patternCanvas = generateLinePattern(w, h, s.lineWeight, grooveAngle, lineSpacing, lineColor)
  _crossPatternCanvas = generateLinePattern(
    w, h,
    Math.max(1, s.lineWeight - 1),
    grooveAngle + Math.PI / 2,
    lineSpacing * 2.5,
    lineColor,
  )

  // Full-coverage on-bg versions for compositing.
  // Normal mode: dark lines on white bg (for lighten + multiply)
  // Invert mode: light lines on black bg (for darken + screen)
  const bg = s.invert ? '#000000' : '#ffffff'
  _patternOnBg = buildOnBg(_patternCanvas, bg)
  _crossPatternOnBg = buildOnBg(_crossPatternCanvas, bg)

  _patternKey = key
}

// ---------------------------------------------------------------------------
// Reusable temp canvas for compositing (no per-frame allocation)
// ---------------------------------------------------------------------------

let _tempA: HTMLCanvasElement | null = null
let _tempAKey = ''

function ensureTemp(w: number, h: number): HTMLCanvasElement {
  if (!_tempA) _tempA = document.createElement('canvas')
  const key = `${w}|${h}`
  if (_tempAKey !== key) {
    _tempA.width = w
    _tempA.height = h
    _tempAKey = key
  }
  return _tempA
}

// ---------------------------------------------------------------------------
// CSS filter threshold — computes brightness factor for binarization
// ---------------------------------------------------------------------------

/**
 * CSS filter chain for GPU-based brightness thresholding.
 * Always produces: BLACK where dark (L < thresh), WHITE where bright.
 * Invert mode is handled by the compositing logic, not the filter.
 */
function thresholdFilter(contrast: number, threshold: number): string {
  const t = threshold / 255
  const lPrime = Math.max(0.01, (t - 0.5) * contrast + 0.5)
  const bFactor = 0.5 / lPrime
  return `grayscale(1) contrast(${contrast}) brightness(${bFactor}) contrast(100)`
}

/**
 * Stamp one pass of lines onto the output canvas.
 * Normal: lighten + multiply (dark lines on light paper)
 * Invert: darken + screen (light lines on dark paper)
 */
function stampLines(
  oCtx: CanvasRenderingContext2D,
  tCtx: CanvasRenderingContext2D,
  source: HTMLCanvasElement | HTMLImageElement,
  patternOnBgCanvas: HTMLCanvasElement,
  contrast: number,
  threshold: number,
  invert: boolean,
  w: number, h: number,
) {
  tCtx.clearRect(0, 0, w, h)
  tCtx.filter = thresholdFilter(contrast, threshold)
  tCtx.drawImage(source, 0, 0)
  tCtx.filter = 'none'
  // temp = BLACK where dark, WHITE where bright

  if (invert) {
    // Invert: lines where source is bright (threshold = WHITE)
    // darken(threshold, linesOnBlack): cream where both white AND line
    tCtx.globalCompositeOperation = 'darken'
    tCtx.drawImage(patternOnBgCanvas, 0, 0)
    tCtx.globalCompositeOperation = 'source-over'
    // screen onto dark paper: adds light lines
    oCtx.globalCompositeOperation = 'screen'
  } else {
    // Normal: lines where source is dark (threshold = BLACK)
    // lighten(threshold, linesOnWhite): black where both dark AND line
    tCtx.globalCompositeOperation = 'lighten'
    tCtx.drawImage(patternOnBgCanvas, 0, 0)
    tCtx.globalCompositeOperation = 'source-over'
    // multiply onto light paper: darkens with ink
    oCtx.globalCompositeOperation = 'multiply'
  }

  oCtx.drawImage(tCtx.canvas, 0, 0)

  // Re-mask to source alpha
  oCtx.globalCompositeOperation = 'destination-in'
  oCtx.drawImage(source, 0, 0)
  oCtx.globalCompositeOperation = 'source-over'
}

export const WOODCUT_PRESETS = [
  { label: 'Classic', settings: { threshold: 128, lineWeight: 2, contrast: 1.8, invert: false } },
  { label: 'Bold', settings: { threshold: 100, lineWeight: 4, contrast: 2.5, invert: false } },
  { label: 'Inverted', settings: { threshold: 140, lineWeight: 2, contrast: 2.0, invert: true } },
]

function cacheKey(src: string, s: WoodcutSettings): string {
  return `woodcut|${src}|${s.threshold}|${s.lineWeight}|${s.contrast}|${s.invert ? 1 : 0}`
}

async function process(src: string, s: WoodcutSettings): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  // Read source for brightness
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = w
  srcCanvas.height = h
  const srcCtx = srcCanvas.getContext('2d')!
  srcCtx.drawImage(img, 0, 0)
  const srcData = srcCtx.getImageData(0, 0, w, h).data

  // Build grayscale brightness map (0..1) with contrast applied
  const brightness = new Float32Array(w * h)
  for (let i = 0; i < brightness.length; i++) {
    const idx = i * 4
    if (srcData[idx + 3] === 0) { brightness[i] = -1; continue } // transparent marker
    let L = (0.299 * srcData[idx] + 0.587 * srcData[idx + 1] + 0.114 * srcData[idx + 2]) / 255
    // Contrast boost
    L = (L - 0.5) * s.contrast + 0.5
    L = Math.max(0, Math.min(1, L))
    brightness[i] = L
  }

  // Output canvas — start with ink/paper base
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Fill base color (paper = white for normal, black for inverted) masked to original alpha
  ctx.drawImage(img, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = s.invert ? '#000000' : '#f5f0e0'
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'source-over'

  // Draw carved grooves as parallel lines
  // Line spacing varies with brightness: dark areas get lines, light areas don't
  const lineColor = s.invert ? '#e8e0d0' : '#1a1008'
  const lineSpacing = s.lineWeight + 1 // space between lines
  const grooveAngle = 15 * (Math.PI / 180) // slight angle for organic look

  ctx.strokeStyle = lineColor
  ctx.lineWidth = s.lineWeight
  ctx.lineCap = 'butt'

  const cos = Math.cos(grooveAngle)
  const sin = Math.sin(grooveAngle)
  const diag = Math.sqrt(w * w + h * h)
  const lineCount = Math.ceil(diag / lineSpacing)

  for (let i = -lineCount; i <= lineCount; i++) {
    const offset = i * lineSpacing
    // Line start/end in rotated frame
    const cx = w / 2 + offset * (-sin)
    const cy = h / 2 + offset * cos

    const x1 = cx - diag * cos
    const y1 = cy - diag * sin
    const x2 = cx + diag * cos
    const y2 = cy + diag * sin

    // Walk along the line, sample brightness, draw where dark enough
    const totalLen = diag * 2
    const sampleStep = 1.5 // sample every 1.5 px for smooth lines
    const steps = Math.ceil(totalLen / sampleStep)
    let drawing = false

    ctx.beginPath()
    for (let step = 0; step <= steps; step++) {
      const t = step / steps
      const px = x1 + (x2 - x1) * t
      const py = y1 + (y2 - y1) * t
      const ix = Math.round(px)
      const iy = Math.round(py)

      if (ix < 0 || ix >= w || iy < 0 || iy >= h) {
        if (drawing) { ctx.stroke(); ctx.beginPath(); drawing = false }
        continue
      }

      const b = brightness[iy * w + ix]
      if (b < 0) { // transparent
        if (drawing) { ctx.stroke(); ctx.beginPath(); drawing = false }
        continue
      }

      // Threshold: draw line if pixel is dark enough
      // normalized threshold: s.threshold maps 0-255 → 0-1
      const thresh = s.threshold / 255
      if (b < thresh) {
        // Add slight waviness for organic woodcut feel
        const waveAmt = s.lineWeight * 0.3
        const wave = Math.sin(step * 0.08 + i * 2.7) * waveAmt
        const wpx = px + wave * sin
        const wpy = py - wave * cos

        if (!drawing) {
          ctx.moveTo(wpx, wpy)
          drawing = true
        } else {
          ctx.lineTo(wpx, wpy)
        }
      } else {
        if (drawing) {
          ctx.stroke()
          ctx.beginPath()
          drawing = false
        }
      }
    }
    if (drawing) ctx.stroke()
  }

  // Second pass: perpendicular lines for darkest areas (cross-hatch for depth)
  const crossAngle = grooveAngle + Math.PI / 2
  const cosC = Math.cos(crossAngle)
  const sinC = Math.sin(crossAngle)
  const crossSpacing = lineSpacing * 2.5 // wider spacing for cross lines

  ctx.lineWidth = Math.max(1, s.lineWeight - 1)
  const crossCount = Math.ceil(diag / crossSpacing)

  for (let i = -crossCount; i <= crossCount; i++) {
    const offset = i * crossSpacing
    const cx = w / 2 + offset * (-sinC)
    const cy = h / 2 + offset * cosC

    const x1 = cx - diag * cosC
    const y1 = cy - diag * sinC
    const x2 = cx + diag * cosC
    const y2 = cy + diag * sinC

    const totalLen = diag * 2
    const sampleStep = 1.5
    const steps = Math.ceil(totalLen / sampleStep)
    let drawing = false

    ctx.beginPath()
    for (let step = 0; step <= steps; step++) {
      const t = step / steps
      const px = x1 + (x2 - x1) * t
      const py = y1 + (y2 - y1) * t
      const ix = Math.round(px)
      const iy = Math.round(py)

      if (ix < 0 || ix >= w || iy < 0 || iy >= h) {
        if (drawing) { ctx.stroke(); ctx.beginPath(); drawing = false }
        continue
      }

      const b = brightness[iy * w + ix]
      if (b < 0) {
        if (drawing) { ctx.stroke(); ctx.beginPath(); drawing = false }
        continue
      }

      // Cross lines only in very dark areas (< 40% of threshold)
      if (b < (s.threshold / 255) * 0.4) {
        if (!drawing) { ctx.moveTo(px, py); drawing = true }
        else ctx.lineTo(px, py)
      } else {
        if (drawing) { ctx.stroke(); ctx.beginPath(); drawing = false }
      }
    }
    if (drawing) ctx.stroke()
  }

  return canvas.toDataURL('image/png')
}

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: WoodcutSettings): boolean {
  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false
  if (output.width !== w) output.width = w
  if (output.height !== h) output.height = h

  ensurePatterns(w, h, s)

  const oCtx = output.getContext('2d')!

  // Paper background masked to source alpha
  oCtx.clearRect(0, 0, w, h)
  oCtx.drawImage(source, 0, 0)
  oCtx.globalCompositeOperation = 'source-in'
  oCtx.fillStyle = s.invert ? '#000000' : '#f5f0e0'
  oCtx.fillRect(0, 0, w, h)
  oCtx.globalCompositeOperation = 'source-over'

  const temp = ensureTemp(w, h)
  const tCtx = temp.getContext('2d')!

  // Primary grooves
  stampLines(oCtx, tCtx, source, _patternOnBg!, s.contrast, s.threshold, s.invert, w, h)

  // Cross-hatch for darkest/brightest areas
  stampLines(oCtx, tCtx, source, _crossPatternOnBg!, s.contrast, s.threshold * 0.4, s.invert, w, h)

  return true
}

export const woodcutCache = createEffectCache<WoodcutSettings>({
  name: 'woodcut',
  maxEntries: 30,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})
