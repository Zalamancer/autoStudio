/**
 * Hologram effect: scan lines + color tint + flicker for holographic look.
 * Animated: cycles through seed variants per frame.
 */

import type { HologramSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: HologramSettings, seed?: number): string {
  return `hologram|${src}|${s.scanLineGap}|${s.flickerSpeed}|${s.tintStrength}|${s.glitchChance}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: HologramSettings, seed = 0): Promise<string> {
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
  const rng = mulberry32(seed * 6271 + 89)

  // Flicker: random overall brightness variation
  const flickerAmount = (rng() - 0.5) * 0.3 * (s.flickerSpeed / 5)
  const brightnessMultiplier = 1 + flickerAmount

  for (let y = 0; y < h; y++) {
    // Scan line darkening
    const isScanLine = y % s.scanLineGap === 0
    const scanDarken = isScanLine ? 0.4 : 1.0

    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      let r = d[idx]
      let g = d[idx + 1]
      let b = d[idx + 2]

      // Cyan/blue holographic tint
      const tint = s.tintStrength
      r = Math.round(r * (1 - tint * 0.5))
      g = Math.min(255, Math.round(g * (1 + tint * 0.2)))
      b = Math.min(255, Math.round(b * (1 + tint * 0.5)))

      // Apply scan line
      r = Math.round(r * scanDarken)
      g = Math.round(g * scanDarken)
      b = Math.round(b * scanDarken)

      // Apply flicker
      r = Math.max(0, Math.min(255, Math.round(r * brightnessMultiplier)))
      g = Math.max(0, Math.min(255, Math.round(g * brightnessMultiplier)))
      b = Math.max(0, Math.min(255, Math.round(b * brightnessMultiplier)))

      // Slight transparency for hologram feel
      const a = Math.round(d[idx + 3] * 0.85)

      d[idx] = r
      d[idx + 1] = g
      d[idx + 2] = b
      d[idx + 3] = a
    }
  }

  // Random glitch blocks
  if (s.glitchChance > 0) {
    const blockCount = Math.floor(s.glitchChance * 8)
    for (let i = 0; i < blockCount; i++) {
      if (rng() > s.glitchChance) continue
      const by = Math.floor(rng() * h)
      const bh = 2 + Math.floor(rng() * 6)
      const offset = Math.floor((rng() - 0.5) * 20)
      for (let y = by; y < Math.min(h, by + bh); y++) {
        for (let x = 0; x < w; x++) {
          const srcX = Math.max(0, Math.min(w - 1, x + offset))
          const dstIdx = (y * w + x) * 4
          const srcIdx = (y * w + srcX) * 4
          d[dstIdx] = d[srcIdx]
          d[dstIdx + 1] = d[srcIdx + 1]
          d[dstIdx + 2] = d[srcIdx + 2]
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const hologramCache = createEffectCache<HologramSettings>({
  name: 'hologram',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
