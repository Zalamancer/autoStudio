/**
 * Stone effect: Stone/marble texture overlay.
 */

import type { StoneSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: StoneSettings, seed?: number): string {
  return `stone|${src}|${s.roughness}|${s.stoneType}|${s.cracksVisible}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function getStoneColor(stoneType: string): [number, number, number] {
  switch (stoneType) {
    case 'marble': return [230, 225, 220]
    case 'granite': return [160, 155, 150]
    case 'sandstone': return [210, 190, 160]
    default: return [190, 185, 180]
  }
}

async function process(src: string, s: StoneSettings, seed = 0): Promise<string> {
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
  const rng = mulberry32(seed * 3301 + 29)
  const [sR, sG, sB] = getStoneColor(s.stoneType)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      const lum = (d[idx] * 0.299 + d[idx + 1] * 0.587 + d[idx + 2] * 0.114) / 255

      // Stone texture: noise-based roughness
      const roughNoise = (rng() - 0.5) * s.roughness * 50
      const veinNoise = Math.sin(x * 0.02 + y * 0.01 + Math.sin(y * 0.03) * 3) * 30

      // Marble veining for marble type
      let vein = 0
      if (s.stoneType === 'marble') {
        vein = Math.sin(x * 0.015 + y * 0.008 + Math.sin(y * 0.02 + x * 0.005) * 5) * 0.5 + 0.5
        vein = Math.pow(vein, 3) * 60
      }

      out[idx] = Math.max(0, Math.min(255, Math.floor(lum * sR + roughNoise - vein)))
      out[idx + 1] = Math.max(0, Math.min(255, Math.floor(lum * sG + roughNoise * 0.9 - vein)))
      out[idx + 2] = Math.max(0, Math.min(255, Math.floor(lum * sB + roughNoise * 0.8 + veinNoise * 0.1 - vein)))

      // Cracks
      if (s.cracksVisible) {
        const crackPattern = Math.sin(x * 0.1 + y * 0.15) + Math.sin(x * 0.05 - y * 0.08) +
          Math.sin((x + y) * 0.07)
        if (Math.abs(crackPattern) < 0.08) {
          out[idx] = Math.floor(out[idx] * 0.3)
          out[idx + 1] = Math.floor(out[idx + 1] * 0.3)
          out[idx + 2] = Math.floor(out[idx + 2] * 0.3)
        }
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const stoneCache = createEffectCache<StoneSettings>({
  name: 'stone',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
