/**
 * Prism effect: Prismatic RGB separation with rainbow fringe.
 */

import type { PrismSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: PrismSettings, seed?: number): string {
  return `prism|${src}|${s.separation}|${s.angle}|${s.rainbowStrength}|s${seed ?? 0}`
}

async function process(src: string, s: PrismSettings, _seed = 0): Promise<string> {
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

  const angleRad = (s.angle * Math.PI) / 180
  const sepX = Math.cos(angleRad) * s.separation
  const sepY = Math.sin(angleRad) * s.separation

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      // Red channel offset
      const rx = Math.max(0, Math.min(w - 1, Math.floor(x + sepX)))
      const ry = Math.max(0, Math.min(h - 1, Math.floor(y + sepY)))
      const ri = (ry * w + rx) * 4
      out[idx] = d[ri]

      // Green stays centered
      out[idx + 1] = d[idx + 1]

      // Blue channel opposite offset
      const bx = Math.max(0, Math.min(w - 1, Math.floor(x - sepX)))
      const by = Math.max(0, Math.min(h - 1, Math.floor(y - sepY)))
      const bi = (by * w + bx) * 4
      out[idx + 2] = d[bi + 2]

      // Rainbow fringe based on position
      if (s.rainbowStrength > 0) {
        const hueAngle = Math.atan2(y - h / 2, x - w / 2) + angleRad
        const hue = ((hueAngle / (Math.PI * 2)) + 1) % 1

        // HSL rainbow overlay
        const rainbowR = Math.sin(hue * Math.PI * 2) * 0.5 + 0.5
        const rainbowG = Math.sin(hue * Math.PI * 2 + Math.PI * 2 / 3) * 0.5 + 0.5
        const rainbowB = Math.sin(hue * Math.PI * 2 + Math.PI * 4 / 3) * 0.5 + 0.5

        const strength = s.rainbowStrength * 0.3
        out[idx] = Math.min(255, Math.floor(out[idx] * (1 - strength) + rainbowR * 255 * strength))
        out[idx + 1] = Math.min(255, Math.floor(out[idx + 1] * (1 - strength) + rainbowG * 255 * strength))
        out[idx + 2] = Math.min(255, Math.floor(out[idx + 2] * (1 - strength) + rainbowB * 255 * strength))
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const prismCache = createEffectCache<PrismSettings>({
  name: 'prism',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
