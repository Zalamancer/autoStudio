/**
 * Animalization effect: Transform face to animal-like features using displacement.
 */

import type { AnimalizationSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: AnimalizationSettings, seed?: number): string {
  return `animalization|${src}|${s.animal}|${s.intensity}|${s.blendMode}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function getAnimalHue(animal: string): number {
  switch (animal) {
    case 'wolf': return 30
    case 'cat': return 35
    case 'bear': return 20
    case 'eagle': return 45
    default: return 30
  }
}

async function process(src: string, s: AnimalizationSettings, seed = 0): Promise<string> {
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
  const rng = mulberry32(seed * 7919 + 31)
  const intensity = s.intensity
  const animalHue = getAnimalHue(s.animal)

  // Displacement mapping based on animal type
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      // Calculate displacement from center
      const cx = x / w - 0.5
      const cy = y / h - 0.5
      const dist = Math.sqrt(cx * cx + cy * cy)

      // Radial displacement for face stretch
      const displaceX = Math.floor(cx * intensity * 15 * Math.sin(cy * Math.PI * 3))
      const displaceY = Math.floor(cy * intensity * 10 * Math.cos(cx * Math.PI * 2))

      const sx = Math.max(0, Math.min(w - 1, x + displaceX))
      const sy = Math.max(0, Math.min(h - 1, y + displaceY))
      const si = (sy * w + sx) * 4

      out[idx] = d[si]
      out[idx + 1] = d[si + 1]
      out[idx + 2] = d[si + 2]

      // Tint toward animal color with fur-like noise
      const noise = (rng() - 0.5) * 30 * intensity
      const tintStrength = intensity * 0.3 * (1 - dist * 1.5)
      if (tintStrength > 0) {
        const hueShift = animalHue + noise
        out[idx] = Math.max(0, Math.min(255, out[idx] + hueShift * tintStrength))
        out[idx + 1] = Math.max(0, Math.min(255, out[idx + 1] - 10 * tintStrength))
        out[idx + 2] = Math.max(0, Math.min(255, out[idx + 2] - 20 * tintStrength))
      }
    }
  }

  // Apply blend mode
  if (s.blendMode === 'multiply') {
    for (let i = 0; i < out.length; i += 4) {
      if (d[i + 3] === 0) continue
      out[i] = Math.floor(out[i] * d[i] / 255)
      out[i + 1] = Math.floor(out[i + 1] * d[i + 1] / 255)
      out[i + 2] = Math.floor(out[i + 2] * d[i + 2] / 255)
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const animalizationCache = createEffectCache<AnimalizationSettings>({
  name: 'animalization',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
