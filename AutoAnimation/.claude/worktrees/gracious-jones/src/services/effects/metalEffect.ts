/**
 * Metal effect: Metallic sheen/chrome look.
 */

import type { MetalSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: MetalSettings, seed?: number): string {
  return `metal|${src}|${s.reflectivity}|${s.metalType}|${s.contrast}|s${seed ?? 0}`
}

function getMetalTint(metalType: string): [number, number, number] {
  switch (metalType) {
    case 'chrome': return [220, 220, 230]
    case 'gold': return [255, 215, 0]
    case 'copper': return [184, 115, 51]
    case 'steel': return [180, 185, 195]
    default: return [200, 200, 210]
  }
}

async function process(src: string, s: MetalSettings, _seed = 0): Promise<string> {
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
  const [mR, mG, mB] = getMetalTint(s.metalType)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      // Convert to luminance
      let lum = (d[idx] * 0.299 + d[idx + 1] * 0.587 + d[idx + 2] * 0.114) / 255

      // Apply contrast
      lum = ((lum - 0.5) * (1 + s.contrast) + 0.5)
      lum = Math.max(0, Math.min(1, lum))

      // Specular highlight simulation
      const specular = Math.pow(lum, 3) * s.reflectivity
      const highlight = specular * 200

      // Metallic coloring
      const metalMix = s.reflectivity * 0.7
      out[idx] = Math.min(255, Math.floor(lum * mR * metalMix + lum * d[idx] * (1 - metalMix) + highlight))
      out[idx + 1] = Math.min(255, Math.floor(lum * mG * metalMix + lum * d[idx + 1] * (1 - metalMix) + highlight))
      out[idx + 2] = Math.min(255, Math.floor(lum * mB * metalMix + lum * d[idx + 2] * (1 - metalMix) + highlight))

      // Gradient reflection band
      const reflectBand = Math.sin((y / h + x / w) * Math.PI * 4) * 0.5 + 0.5
      const bandIntensity = reflectBand * s.reflectivity * 40
      out[idx] = Math.min(255, out[idx] + Math.floor(bandIntensity))
      out[idx + 1] = Math.min(255, out[idx + 1] + Math.floor(bandIntensity))
      out[idx + 2] = Math.min(255, out[idx + 2] + Math.floor(bandIntensity))
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const metalCache = createEffectCache<MetalSettings>({
  name: 'metal',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
