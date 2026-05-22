/**
 * Melt effect: Dripping/melting downward distortion.
 */

import type { MeltSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: MeltSettings, seed?: number): string {
  return `melt|${src}|${s.meltSpeed}|${s.dripLength}|${s.viscosity}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: MeltSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const out = new Uint8ClampedArray(d)
  const rng = mulberry32(seed * 4271 + 11)

  // Generate drip offsets per column
  const dripOffsets = new Float64Array(w)
  for (let x = 0; x < w; x++) {
    const baseWave = Math.sin(x * 0.05) * 0.5 + Math.sin(x * 0.13) * 0.3
    dripOffsets[x] = (baseWave + rng() * 0.4) * s.dripLength * s.meltSpeed
  }

  // Smooth drip offsets based on viscosity
  const smoothed = new Float64Array(w)
  const smoothRadius = Math.floor(s.viscosity * 10) + 1
  for (let x = 0; x < w; x++) {
    let sum = 0; let count = 0
    for (let dx = -smoothRadius; dx <= smoothRadius; dx++) {
      const nx = x + dx
      if (nx >= 0 && nx < w) { sum += dripOffsets[nx]; count++ }
    }
    smoothed[x] = sum / count
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4

      // Melt displacement increases toward bottom
      const yFactor = y / h
      const meltOffset = Math.floor(smoothed[x] * yFactor)
      const sy = Math.max(0, Math.min(h - 1, y - meltOffset))
      const si = (sy * w + x) * 4

      out[idx] = d[si]; out[idx + 1] = d[si + 1]
      out[idx + 2] = d[si + 2]; out[idx + 3] = d[si + 3]
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const meltCache = createEffectCache<MeltSettings>({
  name: 'melt',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
