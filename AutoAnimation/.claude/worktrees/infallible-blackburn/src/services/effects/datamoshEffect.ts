/**
 * Datamosh effect: Digital data corruption/datamosh glitch.
 */

import type { DatamoshSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'
import { ANIMATED_VARIANT_COUNT } from '@/types/styleEffects'

function cacheKey(src: string, s: DatamoshSettings, seed?: number): string {
  return `datamosh|${src}|${s.blockSize}|${s.corruptionRate}|${s.colorShift}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: DatamoshSettings, seed = 0): Promise<string> {
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
  const rng = mulberry32(seed * 8017 + 71)
  const blockSize = s.blockSize

  // Process in macro blocks
  for (let by = 0; by < h; by += blockSize) {
    for (let bx = 0; bx < w; bx += blockSize) {
      // Decide if this block gets corrupted
      if (rng() > s.corruptionRate) continue

      // Choose corruption type
      const corruptionType = Math.floor(rng() * 4)

      switch (corruptionType) {
        case 0: {
          // Block shift: copy from random other block
          const srcBx = Math.floor(rng() * (w / blockSize)) * blockSize
          const srcBy = Math.floor(rng() * (h / blockSize)) * blockSize
          for (let dy = 0; dy < blockSize && by + dy < h; dy++) {
            for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
              const di = ((by + dy) * w + (bx + dx)) * 4
              const sx = Math.min(w - 1, srcBx + dx)
              const sy = Math.min(h - 1, srcBy + dy)
              const si = (sy * w + sx) * 4
              out[di] = d[si]; out[di + 1] = d[si + 1]
              out[di + 2] = d[si + 2]; out[di + 3] = d[si + 3]
            }
          }
          break
        }
        case 1: {
          // Color channel swap
          for (let dy = 0; dy < blockSize && by + dy < h; dy++) {
            for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
              const di = ((by + dy) * w + (bx + dx)) * 4
              const shift = Math.floor(s.colorShift * 255)
              out[di] = d[di + 2] // R = B
              out[di + 1] = Math.min(255, d[di] + shift) // G = R + shift
              out[di + 2] = d[di + 1] // B = G
            }
          }
          break
        }
        case 2: {
          // Repeat previous row
          const repeatRow = Math.max(0, by - Math.floor(rng() * blockSize * 2))
          for (let dy = 0; dy < blockSize && by + dy < h; dy++) {
            for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
              const di = ((by + dy) * w + (bx + dx)) * 4
              const si = (repeatRow * w + Math.min(w - 1, bx + dx)) * 4
              out[di] = d[si]; out[di + 1] = d[si + 1]
              out[di + 2] = d[si + 2]; out[di + 3] = d[si + 3]
            }
          }
          break
        }
        case 3: {
          // Pixel smear (repeat edge pixels)
          const smearX = Math.min(w - 1, bx)
          for (let dy = 0; dy < blockSize && by + dy < h; dy++) {
            const si = ((by + dy) * w + smearX) * 4
            for (let dx = 0; dx < blockSize && bx + dx < w; dx++) {
              const di = ((by + dy) * w + (bx + dx)) * 4
              out[di] = d[si]; out[di + 1] = d[si + 1]
              out[di + 2] = d[si + 2]; out[di + 3] = d[si + 3]
            }
          }
          break
        }
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const datamoshCache = createEffectCache<DatamoshSettings>({
  name: 'datamosh',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})

export const DATAMOSH_SEEDS = Array.from({ length: ANIMATED_VARIANT_COUNT }, (_, i) => i)
