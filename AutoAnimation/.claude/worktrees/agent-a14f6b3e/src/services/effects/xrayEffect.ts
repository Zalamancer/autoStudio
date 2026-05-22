/**
 * X-Ray effect: Inverted colors with bone-like contrast.
 */

import type { XraySettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: XraySettings, seed?: number): string {
  return `xray|${src}|${s.intensity}|${s.blueShift}|${s.contrast}|s${seed ?? 0}`
}

async function process(src: string, s: XraySettings, _seed = 0): Promise<string> {
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

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      // Convert to luminance
      let lum = (d[idx] * 0.299 + d[idx + 1] * 0.587 + d[idx + 2] * 0.114) / 255

      // Invert
      lum = 1 - lum

      // Apply contrast
      lum = ((lum - 0.5) * s.contrast + 0.5)
      lum = Math.max(0, Math.min(1, lum))

      // Apply intensity blend between original and xray
      const xrayR = Math.floor(lum * 255 * (1 - s.blueShift * 0.3))
      const xrayG = Math.floor(lum * 255 * (1 - s.blueShift * 0.1))
      const xrayB = Math.min(255, Math.floor(lum * 255 * (1 + s.blueShift * 0.5)))

      out[idx] = Math.floor(d[idx] * (1 - s.intensity) + xrayR * s.intensity)
      out[idx + 1] = Math.floor(d[idx + 1] * (1 - s.intensity) + xrayG * s.intensity)
      out[idx + 2] = Math.floor(d[idx + 2] * (1 - s.intensity) + xrayB * s.intensity)
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const xrayCache = createEffectCache<XraySettings>({
  name: 'xray',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
