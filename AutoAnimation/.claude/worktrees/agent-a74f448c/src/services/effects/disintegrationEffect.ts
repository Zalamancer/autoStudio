/**
 * Disintegration effect: Thanos-snap style particle dissolution.
 */

import type { DisintegrationSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: DisintegrationSettings, seed?: number): string {
  return `disintegration|${src}|${s.progress}|${s.particleSize}|${s.direction}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: DisintegrationSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  if (s.progress <= 0) return canvas.toDataURL('image/png')

  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const out = new Uint8ClampedArray(d.length)
  const rng = mulberry32(seed * 2137 + 41)

  const pSize = s.particleSize
  const progress = s.progress

  // Process in blocks (particles)
  for (let by = 0; by < h; by += pSize) {
    for (let bx = 0; bx < w; bx += pSize) {
      // Determine dissolution threshold based on position and direction
      let threshold: number
      switch (s.direction) {
        case 'right':
          threshold = bx / w
          break
        case 'up':
          threshold = 1 - by / h
          break
        case 'random':
        default:
          threshold = rng()
          break
      }

      // If this particle should be dissolved at current progress
      if (threshold < progress) {
        // Scatter the particle
        const scatter = (progress - threshold) * 50 * s.speed
        const offsetX = s.direction === 'right' ? scatter : (rng() - 0.5) * scatter * 2
        const offsetY = s.direction === 'up' ? -scatter : (rng() - 0.5) * scatter * 2
        const fade = Math.max(0, 1 - (progress - threshold) * 2)

        for (let py = by; py < Math.min(h, by + pSize); py++) {
          for (let px = bx; px < Math.min(w, bx + pSize); px++) {
            const si = (py * w + px) * 4
            if (d[si + 3] === 0) continue

            const dx = Math.floor(px + offsetX)
            const dy = Math.floor(py + offsetY)
            if (dx < 0 || dx >= w || dy < 0 || dy >= h) continue

            const di = (dy * w + dx) * 4
            out[di] = d[si]
            out[di + 1] = d[si + 1]
            out[di + 2] = d[si + 2]
            out[di + 3] = Math.floor(d[si + 3] * fade)
          }
        }
      } else {
        // Keep particle in place
        for (let py = by; py < Math.min(h, by + pSize); py++) {
          for (let px = bx; px < Math.min(w, bx + pSize); px++) {
            const i = (py * w + px) * 4
            out[i] = d[i]; out[i + 1] = d[i + 1]; out[i + 2] = d[i + 2]; out[i + 3] = d[i + 3]
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

export const disintegrationCache = createEffectCache<DisintegrationSettings>({
  name: 'disintegration',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
