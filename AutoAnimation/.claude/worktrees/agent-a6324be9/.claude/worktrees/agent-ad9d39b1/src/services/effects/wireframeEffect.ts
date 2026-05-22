/**
 * Wireframe effect: Edge-only wireframe rendering.
 */

import type { WireframeSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: WireframeSettings, seed?: number): string {
  return `wireframe|${src}|${s.lineWidth}|${s.lineColor}|${s.fillOpacity}|${s.gridSize}|s${seed ?? 0}`
}

function parseHex(color: string): [number, number, number] {
  const c = parseInt(color.replace('#', ''), 16)
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255]
}

async function process(src: string, s: WireframeSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const out = new Uint8ClampedArray(d.length)
  const [lR, lG, lB] = parseHex(s.lineColor)
  const gridSize = s.gridSize

  // Edge detection (Sobel-like)
  const edges = new Float64Array(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const idx = i * 4
      if (d[idx + 3] === 0) continue

      const lum = (d[idx] * 0.299 + d[idx + 1] * 0.587 + d[idx + 2] * 0.114)
      const lumR = (d[idx + 4] * 0.299 + d[idx + 5] * 0.587 + d[idx + 6] * 0.114)
      const lumD = (d[(i + w) * 4] * 0.299 + d[(i + w) * 4 + 1] * 0.587 + d[(i + w) * 4 + 2] * 0.114)

      const gx = lumR - lum
      const gy = lumD - lum
      edges[i] = Math.sqrt(gx * gx + gy * gy)
    }
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      // Grid lines
      const isGridLine = (x % gridSize < s.lineWidth) || (y % gridSize < s.lineWidth)
      // Detected edges
      const isEdge = edges[y * w + x] > 30

      if (isGridLine || isEdge) {
        out[idx] = lR; out[idx + 1] = lG; out[idx + 2] = lB
        out[idx + 3] = d[idx + 3]
      } else {
        // Fill with faded original
        out[idx] = Math.floor(d[idx] * s.fillOpacity)
        out[idx + 1] = Math.floor(d[idx + 1] * s.fillOpacity)
        out[idx + 2] = Math.floor(d[idx + 2] * s.fillOpacity)
        out[idx + 3] = d[idx + 3]
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const wireframeCache = createEffectCache<WireframeSettings>({
  name: 'wireframe',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
