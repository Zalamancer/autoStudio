/**
 * Air Bend effect: swirling air current displacement distortion.
 * Animated: cycles through seed variants per frame.
 */

import type { AirBendSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: AirBendSettings, seed?: number): string {
  return `air-bend|${src}|${s.intensity}|${s.direction}|${s.turbulence}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: AirBendSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const out = new Uint8ClampedArray(d.length)
  out.set(d)
  const rng = mulberry32(seed * 7919 + 31)

  const dirRad = (s.direction * Math.PI) / 180
  const cosDir = Math.cos(dirRad)
  const sinDir = Math.sin(dirRad)
  const maxDisplace = s.intensity * 15

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Turbulent displacement using sine waves + noise
      const nx = x / w
      const ny = y / h
      const turb = Math.sin(nx * 12 + seed * 0.7) * Math.cos(ny * 8 + seed * 1.3) * s.turbulence
      const wave = Math.sin(nx * 6 + ny * 4 + seed * 2.1) * s.intensity
      const dx = (cosDir * wave + turb * rng() * 4) * maxDisplace
      const dy = (sinDir * wave + turb * rng() * 4) * maxDisplace

      const srcX = Math.max(0, Math.min(w - 1, Math.round(x + dx)))
      const srcY = Math.max(0, Math.min(h - 1, Math.round(y + dy)))
      const dstIdx = (y * w + x) * 4
      const srcIdx = (srcY * w + srcX) * 4
      out[dstIdx] = d[srcIdx]
      out[dstIdx + 1] = d[srcIdx + 1]
      out[dstIdx + 2] = d[srcIdx + 2]
      out[dstIdx + 3] = d[srcIdx + 3]
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const airBendCache = createEffectCache<AirBendSettings>({
  name: 'air-bend',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
