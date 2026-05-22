/**
 * Gas effect: Gaseous/vaporous distortion with color tint.
 */

import type { GasSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: GasSettings, seed?: number): string {
  return `gas|${src}|${s.density}|${s.colorTint}|${s.turbulence}|${s.speed}|s${seed ?? 0}`
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

async function process(src: string, s: GasSettings, seed = 0): Promise<string> {
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
  const rng = mulberry32(seed * 8831 + 23)
  const [tR, tG, tB] = parseHex(s.colorTint)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      // Turbulent displacement
      const turbX = Math.sin(y * 0.05 * s.turbulence + seed * 0.7) * s.turbulence * 15
      const turbY = Math.cos(x * 0.05 * s.turbulence + seed * 0.5) * s.turbulence * 15

      const sx = Math.max(0, Math.min(w - 1, Math.floor(x + turbX)))
      const sy = Math.max(0, Math.min(h - 1, Math.floor(y + turbY)))
      const si = (sy * w + sx) * 4

      // Blend with gas color
      const gasFactor = s.density * (0.5 + rng() * 0.5)
      out[idx] = Math.min(255, Math.floor(d[si] * (1 - gasFactor) + tR * gasFactor))
      out[idx + 1] = Math.min(255, Math.floor(d[si + 1] * (1 - gasFactor) + tG * gasFactor))
      out[idx + 2] = Math.min(255, Math.floor(d[si + 2] * (1 - gasFactor) + tB * gasFactor))

      // Reduce opacity at edges for vapor effect
      const edgeDist = Math.min(x, w - x, y, h - y) / (Math.min(w, h) * 0.3)
      if (edgeDist < 1) {
        out[idx + 3] = Math.floor(d[idx + 3] * Math.max(0.3, edgeDist))
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const gasCache = createEffectCache<GasSettings>({
  name: 'gas',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
