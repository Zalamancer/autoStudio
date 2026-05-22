/**
 * Werewolf effect: Fur texture + dark transformation distortion.
 */

import type { WerewolfSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: WerewolfSettings, seed?: number): string {
  return `werewolf|${src}|${s.furDensity}|${s.jawExtend}|${s.eyeGlow}|${s.moonPhase}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: WerewolfSettings, seed = 0): Promise<string> {
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
  const rng = mulberry32(seed * 6661 + 7)

  // Darken overall based on moon phase (darker = more transformed)
  const darkness = s.moonPhase * 0.4

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      // Jaw extension: stretch lower half downward
      let sy = y
      const midY = h * 0.5
      if (y > midY) {
        const stretch = (y - midY) / (h - midY)
        sy = Math.floor(y - stretch * s.jawExtend * 20)
        sy = Math.max(0, Math.min(h - 1, sy))
      }
      const si = (sy * w + x) * 4

      // Fur texture noise
      const furNoise = (rng() - 0.5) * s.furDensity * 60
      const furLine = Math.sin(x * 0.5 + y * 2 + rng() * 3) * s.furDensity * 20

      // Dark brownish tint
      out[idx] = Math.max(0, Math.min(255, Math.floor(d[si] * (1 - darkness) + furNoise + furLine - 20 * s.moonPhase)))
      out[idx + 1] = Math.max(0, Math.min(255, Math.floor(d[si + 1] * (1 - darkness * 1.2) + furNoise * 0.5 + furLine * 0.5 - 30 * s.moonPhase)))
      out[idx + 2] = Math.max(0, Math.min(255, Math.floor(d[si + 2] * (1 - darkness * 1.5) + furNoise * 0.3 - 20 * s.moonPhase)))

      // Eye glow: bright yellow-green in upper face region
      const cx = x / w - 0.5
      const cy = y / h - 0.35
      const eyeDist = Math.sqrt(cx * cx + cy * cy)
      if (eyeDist < 0.08 && s.eyeGlow > 0) {
        const glowFactor = (1 - eyeDist / 0.08) * s.eyeGlow
        out[idx] = Math.min(255, out[idx] + Math.floor(200 * glowFactor))
        out[idx + 1] = Math.min(255, out[idx + 1] + Math.floor(180 * glowFactor))
        out[idx + 2] = Math.max(0, Math.floor(out[idx + 2] * (1 - glowFactor)))
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const werewolfCache = createEffectCache<WerewolfSettings>({
  name: 'werewolf',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
