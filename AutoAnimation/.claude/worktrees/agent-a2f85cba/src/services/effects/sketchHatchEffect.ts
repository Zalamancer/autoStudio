/**
 * Sketch Hatch effect V2 — Compositing-only overlay (zero getImageData).
 *
 * Performance strategy:
 *
 * 1. Hatch line patterns are pre-generated ONCE as bitmap textures (cached
 *    until settings or canvas size change). This eliminates thousands of
 *    beginPath/lineTo/stroke calls per frame.
 *
 * 2. Per-frame overlay uses ONLY drawImage + CSS filters + canvas composite
 *    modes — all GPU-accelerated. No getImageData, no putImageData, no pixel
 *    loops. Brightness thresholding is done via CSS filter chain:
 *    `grayscale(1) brightness(b) contrast(100)` which binarizes on the GPU.
 *
 * 3. The `lighten` composite mode intersects the binary threshold mask with
 *    the line pattern: black only where BOTH source is dark AND a line exists.
 *    `multiply` composites the result onto paper background.
 *
 * Net result: overlay goes from ~15-50ms/frame → <1ms/frame.
 */

import type { SketchHatchSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

export const SKETCH_HATCH_PRESETS = [
  { label: 'Pencil', settings: { lineSpacing: 3, lineThickness: 1, crossHatch: false, lineDarkness: 0.6, paperColor: '#f5f0e8' } },
  { label: 'Ink', settings: { lineSpacing: 4, lineThickness: 2, crossHatch: true, lineDarkness: 1.0, paperColor: '#ffffff' } },
  { label: 'Light Sketch', settings: { lineSpacing: 6, lineThickness: 1, crossHatch: false, lineDarkness: 0.4, paperColor: '#faf8f4' } },
]

function cacheKey(src: string, s: SketchHatchSettings): string {
  return `hatch|${src}|${s.lineSpacing}|${s.lineThickness}|${s.crossHatch ? 1 : 0}|${s.lineDarkness}|${s.paperColor}`
}

// ---------------------------------------------------------------------------
// Hatch line pattern generator — runs ONCE per settings/size change
// ---------------------------------------------------------------------------

/** Primary hatch lines on white background */
let _primaryOnWhite: HTMLCanvasElement | null = null
/** Cross-hatch lines on white background */
let _crossOnWhite: HTMLCanvasElement | null = null
/** Cache key for pattern invalidation */
let _hatchPatternKey = ''

/**
 * Generate continuous wavy hatch lines across full canvas.
 * Lines have slight organic wobble for a hand-drawn feel.
 */
function generateHatchPattern(
  w: number, h: number,
  spacing: number,
  lineThickness: number,
  angle: number,
  darkness: number,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const diag = Math.sqrt(w * w + h * h)
  const lineCount = Math.ceil(diag / spacing)
  const sampleStep = 1.5

  ctx.strokeStyle = `rgba(30,20,10,${darkness})`
  ctx.lineWidth = lineThickness
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let i = -lineCount; i <= lineCount; i++) {
    const offset = i * spacing
    const cx = w / 2 + offset * (-sin)
    const cy = h / 2 + offset * cos
    const x1 = cx - diag * cos
    const y1 = cy - diag * sin
    const x2 = cx + diag * cos
    const y2 = cy + diag * sin

    const totalLen = diag * 2
    const steps = Math.ceil(totalLen / sampleStep)
    const wobbleAmt = lineThickness * 0.4

    ctx.beginPath()
    for (let step = 0; step <= steps; step++) {
      const t = step / steps
      const px = x1 + (x2 - x1) * t
      const py = y1 + (y2 - y1) * t
      const wobble = Math.sin(step * 0.12 + i * 3.1) * wobbleAmt
      const wpx = px + wobble * sin
      const wpy = py - wobble * cos

      if (step === 0) ctx.moveTo(wpx, wpy)
      else ctx.lineTo(wpx, wpy)
    }
    ctx.stroke()
  }

  return canvas
}

/** Build lines-on-white: white background + lines drawn on top (fully opaque canvas) */
function buildOnWhite(pattern: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = pattern.width
  c.height = pattern.height
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(pattern, 0, 0)
  return c
}

/** Ensure hatch patterns are generated and cached for the current settings/size */
function ensureHatchPatterns(w: number, h: number, s: SketchHatchSettings) {
  const key = `${w}|${h}|${s.lineSpacing}|${s.lineThickness}|${s.crossHatch ? 1 : 0}|${s.lineDarkness}`
  if (_hatchPatternKey === key && _primaryOnWhite) return

  // Primary hatch lines at 45°
  const primaryPattern = generateHatchPattern(
    w, h, s.lineSpacing, s.lineThickness, Math.PI / 4, s.lineDarkness,
  )
  _primaryOnWhite = buildOnWhite(primaryPattern)

  // Cross-hatch at -45° (wider spacing, reduced darkness)
  if (s.crossHatch) {
    const crossPattern = generateHatchPattern(
      w, h, s.lineSpacing * 1.5, s.lineThickness, -Math.PI / 4, s.lineDarkness * 0.6,
    )
    _crossOnWhite = buildOnWhite(crossPattern)
  } else {
    _crossOnWhite = null
  }

  _hatchPatternKey = key
}

// ---------------------------------------------------------------------------
// Reusable temp canvas for compositing (no per-frame allocation)
// ---------------------------------------------------------------------------

let _tempCanvas: HTMLCanvasElement | null = null
let _tempKey = ''

function ensureTemp(w: number, h: number): HTMLCanvasElement {
  if (!_tempCanvas) _tempCanvas = document.createElement('canvas')
  const key = `${w}|${h}`
  if (_tempKey !== key) {
    _tempCanvas.width = w
    _tempCanvas.height = h
    _tempKey = key
  }
  return _tempCanvas
}

// ---------------------------------------------------------------------------
// CSS filter threshold — GPU-based brightness binarization
// ---------------------------------------------------------------------------

/**
 * CSS filter chain for GPU-based brightness thresholding.
 * Produces: BLACK where source luminance < threshold, WHITE where bright.
 * No pixel loops required.
 */
function thresholdFilter(threshold: number): string {
  const lPrime = Math.max(0.01, threshold)
  const bFactor = 0.5 / lPrime
  return `grayscale(1) brightness(${bFactor}) contrast(100)`
}

// ---------------------------------------------------------------------------
// Per-pixel process (for sprite cache — uses getImageData, fine since cached)
// ---------------------------------------------------------------------------

/** Build a brightness map (0=black, 1=white) from source pixels. -1 = transparent. */
function buildBrightnessMap(srcData: Uint8ClampedArray, w: number, h: number): Float32Array {
  const map = new Float32Array(w * h)
  for (let i = 0; i < map.length; i++) {
    const idx = i * 4
    if (srcData[idx + 3] === 0) { map[i] = -1; continue }
    map[i] = (0.299 * srcData[idx] + 0.587 * srcData[idx + 1] + 0.114 * srcData[idx + 2]) / 255
  }
  return map
}

/**
 * Draw one direction of hatch lines (per-pixel version for cached process).
 * Each line walks pixel-by-pixel, drawing segments where the image is dark enough.
 */
function drawHatchLines(
  ctx: CanvasRenderingContext2D,
  brightness: Float32Array,
  w: number, h: number,
  spacing: number,
  lineThickness: number,
  angle: number,
  darkness: number,
  brightnessThreshold: number,
) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const diag = Math.sqrt(w * w + h * h)
  const lineCount = Math.ceil(diag / spacing)
  const sampleStep = 1.5

  ctx.strokeStyle = `rgba(30,20,10,${darkness})`
  ctx.lineWidth = lineThickness
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let i = -lineCount; i <= lineCount; i++) {
    const offset = i * spacing
    const cx = w / 2 + offset * (-sin)
    const cy = h / 2 + offset * cos
    const x1 = cx - diag * cos
    const y1 = cy - diag * sin
    const x2 = cx + diag * cos
    const y2 = cy + diag * sin

    const totalLen = diag * 2
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

      if (b < brightnessThreshold) {
        const wobbleAmt = lineThickness * 0.4
        const wobble = Math.sin(step * 0.12 + i * 3.1) * wobbleAmt
        const wpx = px + wobble * sin
        const wpy = py - wobble * cos

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
}

async function process(src: string, s: SketchHatchSettings): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  // Get source pixel data for brightness sampling
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = w
  srcCanvas.height = h
  const srcCtx = srcCanvas.getContext('2d')!
  srcCtx.drawImage(img, 0, 0)
  const srcData = srcCtx.getImageData(0, 0, w, h).data

  const brightness = buildBrightnessMap(srcData, w, h)

  // Output canvas with paper background (masked to alpha)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = s.paperColor
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'source-over'

  // Primary hatch lines at 45° — cover all dark-to-midtone areas
  drawHatchLines(ctx, brightness, w, h, s.lineSpacing, s.lineThickness,
    Math.PI / 4, s.lineDarkness, 0.75)

  // Cross-hatch at -45° — only in darker areas for depth
  if (s.crossHatch) {
    drawHatchLines(ctx, brightness, w, h, s.lineSpacing * 1.5, s.lineThickness,
      -Math.PI / 4, s.lineDarkness * 0.6, 0.45)
  }

  return canvas.toDataURL('image/png')
}

// ---------------------------------------------------------------------------
// Overlay — ZERO getImageData per-frame path (compositing + CSS filters only)
// ---------------------------------------------------------------------------

/**
 * Stamp one pass of hatch lines onto the output canvas using compositing.
 * lighten + multiply path (dark lines on light paper, no invert needed).
 */
function stampHatchLines(
  oCtx: CanvasRenderingContext2D,
  tCtx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  patternOnWhite: HTMLCanvasElement,
  threshold: number,
  w: number, h: number,
) {
  // b. CSS filter threshold source → binary B&W on temp canvas
  tCtx.clearRect(0, 0, w, h)
  tCtx.filter = thresholdFilter(threshold)
  tCtx.drawImage(source, 0, 0)
  tCtx.filter = 'none'
  // temp = BLACK where dark, WHITE where bright

  // c. lighten(threshold, linesOnWhite): black only where BOTH source is dark AND line exists
  tCtx.globalCompositeOperation = 'lighten'
  tCtx.drawImage(patternOnWhite, 0, 0)
  tCtx.globalCompositeOperation = 'source-over'

  // d. multiply onto paper: paper × black = ink, paper × white = paper
  oCtx.globalCompositeOperation = 'multiply'
  oCtx.drawImage(tCtx.canvas, 0, 0)

  // e. clip to source alpha
  oCtx.globalCompositeOperation = 'destination-in'
  oCtx.drawImage(source, 0, 0)
  oCtx.globalCompositeOperation = 'source-over'
}

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: SketchHatchSettings): boolean {
  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false
  if (output.width !== w) output.width = w
  if (output.height !== h) output.height = h

  ensureHatchPatterns(w, h, s)

  const oCtx = output.getContext('2d')!

  // a. Paper background masked to source alpha
  oCtx.clearRect(0, 0, w, h)
  oCtx.drawImage(source, 0, 0)
  oCtx.globalCompositeOperation = 'source-in'
  oCtx.fillStyle = s.paperColor
  oCtx.fillRect(0, 0, w, h)
  oCtx.globalCompositeOperation = 'source-over'

  const temp = ensureTemp(w, h)
  const tCtx = temp.getContext('2d')!

  // Primary hatch lines — threshold 0.75 (cover dark-to-midtone areas)
  stampHatchLines(oCtx, tCtx, source, _primaryOnWhite!, 0.75, w, h)

  // Cross-hatch — stricter threshold 0.45 (only darkest areas)
  if (s.crossHatch && _crossOnWhite) {
    stampHatchLines(oCtx, tCtx, source, _crossOnWhite, 0.45, w, h)
  }

  return true
}

export const sketchHatchCache = createEffectCache<SketchHatchSettings>({
  name: 'sketch-hatch',
  maxEntries: 30,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})
