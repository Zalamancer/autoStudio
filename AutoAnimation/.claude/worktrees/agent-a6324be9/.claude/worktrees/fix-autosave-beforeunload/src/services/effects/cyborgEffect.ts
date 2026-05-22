/**
 * Cyborg effect: Mechanical/circuit overlay on parts of image.
 */

import type { CyborgSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: CyborgSettings, seed?: number): string {
  return `cyborg|${src}|${s.coverage}|${s.circuitColor}|${s.metalness}|${s.glowIntensity}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function parseHex(color: string): [number, number, number] {
  const c = parseInt(color.replace('#', ''), 16)
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255]
}

async function process(src: string, s: CyborgSettings, seed = 0): Promise<string> {
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
  const rng = mulberry32(seed * 4523 + 17)
  const [cR, cG, cB] = parseHex(s.circuitColor)

  // Generate circuit pattern
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      // Determine if this pixel is in the cyborg region
      const regionCheck = rng() < s.coverage || (x % 8 === 0 && y % 8 === 0)

      if (regionCheck) {
        // Circuit line pattern
        const isCircuitLine = (x % 12 === 0) || (y % 12 === 0) ||
          (x % 12 === y % 12) || ((x + y) % 24 === 0)

        if (isCircuitLine) {
          // Draw circuit traces
          const glow = s.glowIntensity
          out[idx] = Math.min(255, Math.floor(cR * glow + out[idx] * (1 - glow * 0.5)))
          out[idx + 1] = Math.min(255, Math.floor(cG * glow + out[idx + 1] * (1 - glow * 0.5)))
          out[idx + 2] = Math.min(255, Math.floor(cB * glow + out[idx + 2] * (1 - glow * 0.5)))
        } else {
          // Metallic sheen on covered area
          const lum = (d[idx] * 0.299 + d[idx + 1] * 0.587 + d[idx + 2] * 0.114) / 255
          const metalFactor = s.metalness
          const shine = lum * lum * metalFactor * 80
          out[idx] = Math.min(255, Math.floor(d[idx] * (1 - metalFactor * 0.5) + shine + 60 * metalFactor))
          out[idx + 1] = Math.min(255, Math.floor(d[idx + 1] * (1 - metalFactor * 0.5) + shine + 60 * metalFactor))
          out[idx + 2] = Math.min(255, Math.floor(d[idx + 2] * (1 - metalFactor * 0.5) + shine + 70 * metalFactor))
        }

        // Circuit nodes at intersections
        if (x % 12 === 0 && y % 12 === 0) {
          const nodeRadius = 2
          for (let ny = -nodeRadius; ny <= nodeRadius; ny++) {
            for (let nx = -nodeRadius; nx <= nodeRadius; nx++) {
              if (nx * nx + ny * ny > nodeRadius * nodeRadius) continue
              const px = x + nx; const py = y + ny
              if (px < 0 || px >= w || py < 0 || py >= h) continue
              const ni = (py * w + px) * 4
              out[ni] = Math.min(255, cR + Math.floor(100 * s.glowIntensity))
              out[ni + 1] = Math.min(255, cG + Math.floor(100 * s.glowIntensity))
              out[ni + 2] = Math.min(255, cB + Math.floor(100 * s.glowIntensity))
            }
          }
        }
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const cyborgCache = createEffectCache<CyborgSettings>({
  name: 'cyborg',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
