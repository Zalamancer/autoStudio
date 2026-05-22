/**
 * Watercolor Bleed effect: Multi-pass Gaussian blur → noise perturbation
 * on alpha edges → saturation boost → optional paper texture.
 */

import type { WatercolorBleedSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

export const WATERCOLOR_BLEED_PRESETS = [
  { label: 'Soft Wash', settings: { bleedAmount: 10, edgeRoughness: 0.3, saturation: 1.2, paperTexture: 0.2, wetEdge: 0.3 } },
  { label: 'Wet-on-Wet', settings: { bleedAmount: 16, edgeRoughness: 0.7, saturation: 1.5, paperTexture: 0.1, wetEdge: 0.6 } },
  { label: 'Dry Brush', settings: { bleedAmount: 4, edgeRoughness: 0.8, saturation: 1.1, paperTexture: 0.3, wetEdge: 0.2 } },
]

function cacheKey(src: string, s: WatercolorBleedSettings): string {
  return `wcolor|${src}|${s.bleedAmount}|${s.edgeRoughness}|${s.saturation}|${s.paperTexture}|${s.wetEdge}`
}

/** Simple box blur (faster than gaussian, applied multiple times for approximation) */
function boxBlur(data: Uint8ClampedArray, w: number, h: number, radius: number) {
  const temp = new Uint8ClampedArray(data)
  const r = Math.max(1, Math.round(radius))
  const div = (2 * r + 1)

  // Horizontal pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let rr = 0, gg = 0, bb = 0, aa = 0
      for (let dx = -r; dx <= r; dx++) {
        const sx = Math.max(0, Math.min(w - 1, x + dx))
        const si = (y * w + sx) * 4
        rr += temp[si]; gg += temp[si + 1]; bb += temp[si + 2]; aa += temp[si + 3]
      }
      const di = (y * w + x) * 4
      data[di] = rr / div
      data[di + 1] = gg / div
      data[di + 2] = bb / div
      data[di + 3] = aa / div
    }
  }

  temp.set(data)

  // Vertical pass
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let rr = 0, gg = 0, bb = 0, aa = 0
      for (let dy = -r; dy <= r; dy++) {
        const sy = Math.max(0, Math.min(h - 1, y + dy))
        const si = (sy * w + x) * 4
        rr += temp[si]; gg += temp[si + 1]; bb += temp[si + 2]; aa += temp[si + 3]
      }
      const di = (y * w + x) * 4
      data[di] = rr / div
      data[di + 1] = gg / div
      data[di + 2] = bb / div
      data[di + 3] = aa / div
    }
  }
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: WatercolorBleedSettings): Promise<string> {
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

  // Multi-pass blur (3 passes of box blur ≈ gaussian)
  const blurRadius = Math.max(1, Math.round(s.bleedAmount / 3))
  for (let pass = 0; pass < 3; pass++) {
    boxBlur(d, w, h, blurRadius)
  }

  // Edge roughness: perturb alpha at edges with noise
  if (s.edgeRoughness > 0) {
    const rng = mulberry32(42)
    const originalAlpha = new Uint8Array(w * h)
    const srcCanvas2 = document.createElement('canvas')
    srcCanvas2.width = w
    srcCanvas2.height = h
    srcCanvas2.getContext('2d')!.drawImage(img, 0, 0)
    const origData = srcCanvas2.getContext('2d')!.getImageData(0, 0, w, h).data
    for (let i = 0; i < originalAlpha.length; i++) originalAlpha[i] = origData[i * 4 + 3]

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4
        const origA = originalAlpha[y * w + x]
        // Only perturb near edges (where alpha transitions)
        if (origA > 10 && origA < 245) {
          const noise = (rng() - 0.5) * s.edgeRoughness * 200
          d[idx + 3] = Math.max(0, Math.min(255, d[idx + 3] + noise))
        }
      }
    }
  }

  // Saturation boost
  if (s.saturation !== 1.0) {
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue
      const r = d[i], g = d[i + 1], b = d[i + 2]
      const gray = 0.299 * r + 0.587 * g + 0.114 * b
      d[i] = Math.max(0, Math.min(255, gray + (r - gray) * s.saturation))
      d[i + 1] = Math.max(0, Math.min(255, gray + (g - gray) * s.saturation))
      d[i + 2] = Math.max(0, Math.min(255, gray + (b - gray) * s.saturation))
    }
  }

  // Wet edge darkening
  if (s.wetEdge > 0) {
    const copy = new Uint8ClampedArray(d)
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4
        if (copy[idx + 3] < 20) continue
        // Check if near alpha edge
        let nearEdge = false
        for (let dy = -1; dy <= 1 && !nearEdge; dy++) {
          for (let dx = -1; dx <= 1 && !nearEdge; dx++) {
            const ni = ((y + dy) * w + (x + dx)) * 4
            if (copy[ni + 3] < 20) nearEdge = true
          }
        }
        if (nearEdge) {
          const darken = s.wetEdge * 60
          d[idx] = Math.max(0, d[idx] - darken)
          d[idx + 1] = Math.max(0, d[idx + 1] - darken)
          d[idx + 2] = Math.max(0, d[idx + 2] - darken)
        }
      }
    }
  }

  // Paper texture
  if (s.paperTexture > 0) {
    const rng2 = mulberry32(123)
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue
      const noise = (rng2() - 0.5) * s.paperTexture * 80
      d[i] = Math.max(0, Math.min(255, d[i] + noise))
      d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + noise))
      d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + noise))
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: WatercolorBleedSettings): boolean {
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

  const blurRadius = Math.max(1, Math.round(s.bleedAmount / 3))
  for (let pass = 0; pass < 3; pass++) boxBlur(d, w, h, blurRadius)

  if (s.saturation !== 1.0) {
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]
      d[i] = Math.max(0, Math.min(255, gray + (d[i] - gray) * s.saturation))
      d[i + 1] = Math.max(0, Math.min(255, gray + (d[i + 1] - gray) * s.saturation))
      d[i + 2] = Math.max(0, Math.min(255, gray + (d[i + 2] - gray) * s.saturation))
    }
  }

  oCtx.putImageData(imageData, 0, 0)
  return true
}

export const watercolorBleedCache = createEffectCache<WatercolorBleedSettings>({
  name: 'watercolor-bleed',
  maxEntries: 20,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})
