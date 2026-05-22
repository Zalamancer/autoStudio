/**
 * Cel Shade effect: Anime/toon shading with flat color bands and bold outlines.
 * Edge detection runs on the ORIGINAL image (natural color gradients), then
 * colors are posterized to N levels, then edge strokes are overlaid on top.
 */

import type { CelShadeSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

export const CEL_SHADE_PRESETS = [
  { label: 'Anime', settings: { levels: 3, edgeThickness: 2, edgeColor: '#000000', edgeSensitivity: 30 } },
  { label: 'Comic', settings: { levels: 5, edgeThickness: 3, edgeColor: '#1a1a1a', edgeSensitivity: 25 } },
  { label: 'Flat', settings: { levels: 3, edgeThickness: 0, edgeColor: '#000000', edgeSensitivity: 40 } },
]

function cacheKey(src: string, s: CelShadeSettings): string {
  return `cel|${src}|${s.levels}|${s.edgeThickness}|${s.edgeColor}|${s.edgeSensitivity}`
}

function parseHex(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/** Compute edge magnitude map from original pixel data using Sobel operator */
function computeEdgeMap(srcData: Uint8ClampedArray, w: number, h: number): Float32Array {
  const edges = new Float32Array(w * h)

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x
      if (srcData[idx * 4 + 3] === 0) continue

      // Convert 3x3 neighborhood to luminance for gradient calculation
      let gx = 0
      let gy = 0

      // Sobel kernels applied to luminance
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const ni = ((y + ky) * w + (x + kx)) * 4
          if (srcData[ni + 3] === 0) continue
          const lum = 0.299 * srcData[ni] + 0.587 * srcData[ni + 1] + 0.114 * srcData[ni + 2]

          // Sobel X kernel: -1 0 1 / -2 0 2 / -1 0 1
          const sx = kx === -1 ? -(ky === 0 ? 2 : 1) : kx === 1 ? (ky === 0 ? 2 : 1) : 0
          // Sobel Y kernel: -1 -2 -1 / 0 0 0 / 1 2 1
          const sy = ky === -1 ? -(kx === 0 ? 2 : 1) : ky === 1 ? (kx === 0 ? 2 : 1) : 0

          gx += lum * sx
          gy += lum * sy
        }
      }

      edges[idx] = Math.sqrt(gx * gx + gy * gy)
    }
  }

  return edges
}

/** Posterize pixel data in-place */
function posterize(d: Uint8ClampedArray, levels: number) {
  const step = 255 / (levels - 1)
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    d[i] = Math.round(d[i] / step) * step
    d[i + 1] = Math.round(d[i + 1] / step) * step
    d[i + 2] = Math.round(d[i + 2] / step) * step
  }
}

/** Stamp edge pixels onto imageData */
function stampEdges(
  d: Uint8ClampedArray,
  edges: Float32Array,
  w: number, h: number,
  thickness: number,
  sensitivity: number,
  eR: number, eG: number, eB: number,
) {
  // Normalize: sensitivity 10-100 maps to threshold on the Sobel magnitude
  // Lower sensitivity → higher threshold → fewer edges
  const threshold = sensitivity * 2.5

  // Build edge mask first (to avoid stamping over already-stamped pixels)
  const edgeMask = new Uint8Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * w + x
      if (edges[idx] > threshold) edgeMask[idx] = 1
    }
  }

  // Dilate edge mask by thickness and paint
  const half = Math.floor(thickness / 2)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x
      if (edgeMask[idx] !== 1) continue

      for (let ey = -half; ey <= half; ey++) {
        for (let ex = -half; ex <= half; ex++) {
          const py = y + ey
          const px = x + ex
          if (py < 0 || py >= h || px < 0 || px >= w) continue
          const pi = (py * w + px) * 4
          if (d[pi + 3] === 0) continue
          d[pi] = eR
          d[pi + 1] = eG
          d[pi + 2] = eB
        }
      }
    }
  }
}

async function process(src: string, s: CelShadeSettings): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data

  // Step 1: Detect edges on ORIGINAL image (before posterization)
  let edges: Float32Array | null = null
  if (s.edgeThickness > 0) {
    edges = computeEdgeMap(d, w, h)
  }

  // Step 2: Posterize colors
  posterize(d, s.levels)

  // Step 3: Overlay edge strokes
  if (edges && s.edgeThickness > 0) {
    const [eR, eG, eB] = parseHex(s.edgeColor)
    stampEdges(d, edges, w, h, s.edgeThickness, s.edgeSensitivity, eR, eG, eB)
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: CelShadeSettings): boolean {
  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false
  if (output.width !== w) output.width = w
  if (output.height !== h) output.height = h

  const oCtx = output.getContext('2d')!
  oCtx.clearRect(0, 0, w, h)
  oCtx.drawImage(source, 0, 0)

  const imageData = oCtx.getImageData(0, 0, w, h)
  const d = imageData.data

  // Edge detect on original FIRST
  let edges: Float32Array | null = null
  if (s.edgeThickness > 0) {
    edges = computeEdgeMap(d, w, h)
  }

  // Then posterize
  posterize(d, s.levels)

  // Then stamp edges
  if (edges && s.edgeThickness > 0) {
    const [eR, eG, eB] = parseHex(s.edgeColor)
    stampEdges(d, edges, w, h, s.edgeThickness, s.edgeSensitivity, eR, eG, eB)
  }

  oCtx.putImageData(imageData, 0, 0)
  return true
}

export const celShadeCache = createEffectCache<CelShadeSettings>({
  name: 'cel-shade',
  maxEntries: 30,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})
