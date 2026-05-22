/**
 * Double Exposure effect: Blend two frames with multiply/screen.
 */

import type { DoubleExposureSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: DoubleExposureSettings, seed?: number): string {
  return `double-exposure|${src}|${s.blendMode}|${s.offset}|${s.opacity}|s${seed ?? 0}`
}

async function process(src: string, s: DoubleExposureSettings, _seed = 0): Promise<string> {
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

  const offsetX = Math.floor(s.offset)
  const offsetY = Math.floor(s.offset * 0.7)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      // Second exposure from offset position
      const sx = Math.max(0, Math.min(w - 1, x + offsetX))
      const sy = Math.max(0, Math.min(h - 1, y + offsetY))
      const si = (sy * w + sx) * 4

      const r1 = d[idx]; const g1 = d[idx + 1]; const b1 = d[idx + 2]
      const r2 = d[si]; const g2 = d[si + 1]; const b2 = d[si + 2]

      let blendR: number, blendG: number, blendB: number

      switch (s.blendMode) {
        case 'multiply':
          blendR = Math.floor(r1 * r2 / 255)
          blendG = Math.floor(g1 * g2 / 255)
          blendB = Math.floor(b1 * b2 / 255)
          break
        case 'screen':
          blendR = 255 - Math.floor((255 - r1) * (255 - r2) / 255)
          blendG = 255 - Math.floor((255 - g1) * (255 - g2) / 255)
          blendB = 255 - Math.floor((255 - b1) * (255 - b2) / 255)
          break
        case 'overlay':
        default:
          blendR = r1 < 128 ? Math.floor(2 * r1 * r2 / 255) : 255 - Math.floor(2 * (255 - r1) * (255 - r2) / 255)
          blendG = g1 < 128 ? Math.floor(2 * g1 * g2 / 255) : 255 - Math.floor(2 * (255 - g1) * (255 - g2) / 255)
          blendB = b1 < 128 ? Math.floor(2 * b1 * b2 / 255) : 255 - Math.floor(2 * (255 - b1) * (255 - b2) / 255)
          break
      }

      out[idx] = Math.floor(r1 * (1 - s.opacity) + blendR * s.opacity)
      out[idx + 1] = Math.floor(g1 * (1 - s.opacity) + blendG * s.opacity)
      out[idx + 2] = Math.floor(b1 * (1 - s.opacity) + blendB * s.opacity)
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const doubleExposureCache = createEffectCache<DoubleExposureSettings>({
  name: 'double-exposure',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
