/**
 * Explosion effect: Radial fragment burst.
 */

import type { ExplosionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: ExplosionSettings, seed?: number): string {
  return `explosion|${src}|${s.force}|${s.fragmentSize}|${s.scatter}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: ExplosionSettings, seed = 0): Promise<string> {
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
  const rng = mulberry32(seed * 7727 + 37)
  const fSize = s.fragmentSize
  const cx = w / 2; const cy = h / 2

  // Process in fragment blocks
  for (let by = 0; by < h; by += fSize) {
    for (let bx = 0; bx < w; bx += fSize) {
      // Direction from center
      const fragCx = bx + fSize / 2
      const fragCy = by + fSize / 2
      const dx = fragCx - cx
      const dy = fragCy - cy
      const dist = Math.sqrt(dx * dx + dy * dy) || 1

      // Scatter offset
      const scatterX = (dx / dist) * s.force * 40 + (rng() - 0.5) * s.scatter * 30
      const scatterY = (dy / dist) * s.force * 40 + (rng() - 0.5) * s.scatter * 30
      const rotation = (rng() - 0.5) * s.force * 0.5

      for (let fy = 0; fy < fSize && by + fy < h; fy++) {
        for (let fx = 0; fx < fSize && bx + fx < w; fx++) {
          // Apply rotation around fragment center
          const rx = fx - fSize / 2; const ry = fy - fSize / 2
          const cos = Math.cos(rotation); const sin = Math.sin(rotation)
          const rotX = rx * cos - ry * sin + fSize / 2
          const rotY = rx * sin + ry * cos + fSize / 2

          const sx = Math.floor(bx + rotX + scatterX)
          const sy = Math.floor(by + rotY + scatterY)

          if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
            const si = (Math.floor(by + rotY) * w + Math.floor(bx + rotX)) * 4
            if (si >= 0 && si < d.length - 3) {
              // Place at scattered position
              const ti = (sy * w + sx) * 4
              if (ti >= 0 && ti < out.length - 3) {
                out[ti] = d[si]; out[ti + 1] = d[si + 1]
                out[ti + 2] = d[si + 2]; out[ti + 3] = d[si + 3]
              }
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

export const explosionCache = createEffectCache<ExplosionSettings>({
  name: 'explosion',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
