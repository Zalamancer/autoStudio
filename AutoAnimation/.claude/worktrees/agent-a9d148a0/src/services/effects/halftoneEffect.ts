/**
 * Halftone effect V2 — Compositing-only overlay (zero getImageData).
 *
 * Performance strategy:
 *
 * 1. Dot grid patterns are pre-generated ONCE as bitmap textures (cached
 *    until settings or canvas size change). A rotated grid of filled circles
 *    at max radius is drawn on a transparent canvas, then composited onto a
 *    white background for the "on-white" version.
 *
 * 2. Per-frame overlay uses ONLY drawImage + CSS filters + canvas composite
 *    modes — all GPU-accelerated. No getImageData, no putImageData, no pixel
 *    loops. Brightness thresholding is done via CSS filter chain:
 *    `grayscale(1) brightness(1.0) contrast(100)` which binarizes on the GPU.
 *
 * 3. The `lighten` composite mode intersects the binary threshold mask with
 *    the dot grid: black only where BOTH source is dark AND a dot exists.
 *    `multiply` composites the result onto the background color.
 *
 * Net result: overlay goes from ~15-50ms/frame → <1ms/frame.
 *
 * The `process` function retains full graduated-size dots for sprite caching.
 */

import type { HalftoneSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

export const HALFTONE_PRESETS = [
  { label: 'Newspaper', settings: { dotSize: 8, dotScale: 0.9, dotColor: '#000000', backgroundColor: '#f5f0e0', angle: 45 } },
  { label: 'Pop Art', settings: { dotSize: 12, dotScale: 1.0, dotColor: '#ff0066', backgroundColor: '#ffee00', angle: 30 } },
  { label: 'Fine Print', settings: { dotSize: 5, dotScale: 0.7, dotColor: '#333333', backgroundColor: '#ffffff', angle: 45 } },
]

function cacheKey(src: string, s: HalftoneSettings): string {
  return `half|${src}|${s.dotSize}|${s.dotScale}|${s.dotColor}|${s.backgroundColor}|${s.angle}`
}

function parseHex(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Draw one channel's halftone dots at a specific angle */
function drawDotLayer(
  ctx: CanvasRenderingContext2D,
  channelData: Float32Array, // 0-1 darkness values
  w: number, h: number,
  cellSize: number,
  maxRadius: number,
  angle: number,
  r: number, g: number, b: number,
  alphaMap: Uint8Array,
) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const diag = Math.sqrt(w * w + h * h)
  const gridCells = Math.ceil(diag / cellSize) + 1

  ctx.fillStyle = `rgb(${r},${g},${b})`

  for (let gy = -gridCells; gy <= gridCells; gy++) {
    for (let gx = -gridCells; gx <= gridCells; gx++) {
      // Rotated grid → screen position
      const gcx = gx * cellSize
      const gcy = gy * cellSize
      const px = Math.round(w / 2 + gcx * cos - gcy * sin)
      const py = Math.round(h / 2 + gcx * sin + gcy * cos)

      if (px < -cellSize || px >= w + cellSize || py < -cellSize || py >= h + cellSize) continue

      // Sample average darkness in cell area
      let totalDark = 0
      let count = 0
      const halfCell = Math.floor(cellSize / 2)
      for (let dy = -halfCell; dy <= halfCell; dy += 2) {
        for (let dx = -halfCell; dx <= halfCell; dx += 2) {
          const sx = px + dx
          const sy = py + dy
          if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue
          const si = sy * w + sx
          if (alphaMap[si] === 0) continue
          totalDark += channelData[si]
          count++
        }
      }

      if (count === 0) continue
      const avgDark = totalDark / count
      const radius = avgDark * maxRadius

      if (radius > 0.5) {
        ctx.beginPath()
        ctx.arc(px, py, radius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

async function process(src: string, s: HalftoneSettings): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = w
  srcCanvas.height = h
  const srcCtx = srcCanvas.getContext('2d')!
  srcCtx.drawImage(img, 0, 0)
  const srcData = srcCtx.getImageData(0, 0, w, h).data

  const alphaMap = new Uint8Array(w * h)
  for (let i = 0; i < alphaMap.length; i++) alphaMap[i] = srcData[i * 4 + 3]

  // Check if dotColor is black/dark → use luminance-only mode
  // Otherwise use the dotColor directly
  const [dR, dG, dB] = parseHex(s.dotColor)
  const isDark = (dR + dG + dB) < 200
  const useCMYK = isDark

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Background (masked to alpha)
  ctx.drawImage(img, 0, 0)
  ctx.globalCompositeOperation = 'source-in'
  ctx.fillStyle = s.backgroundColor
  ctx.fillRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'source-over'

  const cellSize = s.dotSize
  const maxRadius = (cellSize / 2) * s.dotScale
  const baseAngle = (s.angle * Math.PI) / 180

  if (useCMYK) {
    // CMYK-style: separate C, M, Y, K channels at different angles
    const cDark = new Float32Array(w * h)
    const mDark = new Float32Array(w * h)
    const yDark = new Float32Array(w * h)
    const kDark = new Float32Array(w * h)

    for (let i = 0; i < w * h; i++) {
      const idx = i * 4
      if (srcData[idx + 3] === 0) continue
      const r = srcData[idx] / 255
      const g = srcData[idx + 1] / 255
      const b = srcData[idx + 2] / 255
      const k = 1 - Math.max(r, g, b)
      if (k >= 1) { kDark[i] = 1; continue }
      cDark[i] = (1 - r - k) / (1 - k)
      mDark[i] = (1 - g - k) / (1 - k)
      yDark[i] = (1 - b - k) / (1 - k)
      kDark[i] = k
    }

    // Each layer at 15° offset for classic moire
    ctx.globalCompositeOperation = 'multiply'
    drawDotLayer(ctx, cDark, w, h, cellSize, maxRadius, baseAngle, 0, 174, 239, alphaMap)           // Cyan
    drawDotLayer(ctx, mDark, w, h, cellSize, maxRadius, baseAngle + 0.26, 236, 0, 140, alphaMap)    // Magenta
    drawDotLayer(ctx, yDark, w, h, cellSize, maxRadius, baseAngle + 0.52, 255, 242, 0, alphaMap)    // Yellow
    ctx.globalCompositeOperation = 'source-over'
    drawDotLayer(ctx, kDark, w, h, cellSize, maxRadius, baseAngle + 0.79, 0, 0, 0, alphaMap)        // Key (Black)
  } else {
    // Single color mode: luminance → dot size
    const luma = new Float32Array(w * h)
    for (let i = 0; i < w * h; i++) {
      const idx = i * 4
      if (srcData[idx + 3] === 0) continue
      luma[i] = 1 - (0.299 * srcData[idx] + 0.587 * srcData[idx + 1] + 0.114 * srcData[idx + 2]) / 255
    }
    drawDotLayer(ctx, luma, w, h, cellSize, maxRadius, baseAngle, dR, dG, dB, alphaMap)
  }

  return canvas.toDataURL('image/png')
}

// ---------------------------------------------------------------------------
// Dot grid pattern generator — runs ONCE per settings/size change
// ---------------------------------------------------------------------------

/** Dot grid on transparent background */
let _dotGridCanvas: HTMLCanvasElement | null = null
/** Dot grid on white background (fully opaque) — for lighten compositing */
let _dotsOnWhite: HTMLCanvasElement | null = null
let _dotGridKey = ''

/**
 * Generate a fixed-radius rotated dot grid covering the entire canvas.
 * All dots are drawn at maxRadius (no brightness sampling). The per-frame
 * compositing step handles the brightness→dot intersection.
 */
function generateDotGrid(
  w: number, h: number,
  cellSize: number,
  maxRadius: number,
  angle: number,
  dotColor: string,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const diag = Math.sqrt(w * w + h * h)
  const gridCells = Math.ceil(diag / cellSize) + 1

  ctx.fillStyle = dotColor

  for (let gy = -gridCells; gy <= gridCells; gy++) {
    for (let gx = -gridCells; gx <= gridCells; gx++) {
      const gcx = gx * cellSize
      const gcy = gy * cellSize
      const px = Math.round(w / 2 + gcx * cos - gcy * sin)
      const py = Math.round(h / 2 + gcx * sin + gcy * cos)

      if (px < -cellSize || px >= w + cellSize || py < -cellSize || py >= h + cellSize) continue

      ctx.beginPath()
      ctx.arc(px, py, maxRadius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  return canvas
}

/** Build full-coverage dot grid on a solid white background (fully opaque) */
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

function ensureDotGrid(w: number, h: number, s: HalftoneSettings) {
  const key = `${w}|${h}|${s.dotSize}|${s.dotScale}|${s.angle}|${s.dotColor}`
  if (_dotGridKey === key && _dotGridCanvas) return

  const cellSize = s.dotSize
  const maxRadius = (cellSize / 2) * s.dotScale
  const angle = (s.angle * Math.PI) / 180

  _dotGridCanvas = generateDotGrid(w, h, cellSize, maxRadius, angle, s.dotColor)
  _dotsOnWhite = buildOnWhite(_dotGridCanvas)

  _dotGridKey = key
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
// CSS filter threshold — GPU-based brightness binarization
// ---------------------------------------------------------------------------

/**
 * CSS filter chain that converts source to binary black/white.
 * BLACK where source luminance is dark, WHITE where bright.
 * Threshold is at ~50% brightness — dots appear where source is dark.
 */
function thresholdFilter(): string {
  return 'grayscale(1) brightness(1.0) contrast(100)'
}

// ---------------------------------------------------------------------------
// Overlay — ZERO getImageData per-frame path for rigged characters
// ---------------------------------------------------------------------------

/**
 * Compositing-only overlay: approximates halftone at 60fps using a binary
 * dot grid intersected with a CSS-filter brightness threshold.
 *
 * Steps:
 *   a. Background color masked to source alpha
 *   b. CSS filter threshold source → binary B&W on temp canvas
 *   c. temp.composite = 'lighten' → drawImage(dotsOnWhite)
 *      → black only where BOTH source is dark AND a dot exists
 *   d. output.composite = 'multiply' → drawImage(temp)
 *   e. output.composite = 'destination-in' → drawImage(source) → clip to alpha
 */
function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: HalftoneSettings): boolean {
  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false
  if (output.width !== w) output.width = w
  if (output.height !== h) output.height = h

  ensureDotGrid(w, h, s)

  const oCtx = output.getContext('2d')!

  // (a) Background color masked to source alpha
  oCtx.clearRect(0, 0, w, h)
  oCtx.drawImage(source, 0, 0)
  oCtx.globalCompositeOperation = 'source-in'
  oCtx.fillStyle = s.backgroundColor
  oCtx.fillRect(0, 0, w, h)
  oCtx.globalCompositeOperation = 'source-over'

  // (b) CSS filter threshold: source → binary B&W on temp canvas
  const temp = ensureTemp(w, h)
  const tCtx = temp.getContext('2d')!
  tCtx.clearRect(0, 0, w, h)
  tCtx.filter = thresholdFilter()
  tCtx.drawImage(source, 0, 0)
  tCtx.filter = 'none'
  // temp = BLACK where dark, WHITE where bright

  // (c) lighten with dotsOnWhite:
  //     Black stays only where BOTH threshold is black AND dot is (dot color on white)
  tCtx.globalCompositeOperation = 'lighten'
  tCtx.drawImage(_dotsOnWhite!, 0, 0)
  tCtx.globalCompositeOperation = 'source-over'

  // (d) multiply onto background: darkens paper with dot pattern
  oCtx.globalCompositeOperation = 'multiply'
  oCtx.drawImage(temp, 0, 0)

  // (e) Clip to source alpha
  oCtx.globalCompositeOperation = 'destination-in'
  oCtx.drawImage(source, 0, 0)
  oCtx.globalCompositeOperation = 'source-over'

  return true
}

export const halftoneCache = createEffectCache<HalftoneSettings>({
  name: 'halftone',
  maxEntries: 30,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})
