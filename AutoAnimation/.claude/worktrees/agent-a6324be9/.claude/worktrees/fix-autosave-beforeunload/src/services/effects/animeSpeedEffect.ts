/**
 * Anime Speed effect: speed lines radiating or horizontal.
 */

import type { AnimeSpeedSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: AnimeSpeedSettings, seed?: number): string {
  return `anime-speed|${src}|${s.lineCount}|${s.intensity}|${s.direction}|${s.gap}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: AnimeSpeedSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 3917 + 7)
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 1.5

  if (s.direction === 'radial') {
    const cx = w * 0.5; const cy = h * 0.5
    const maxR = Math.sqrt(w * w + h * h) * 0.5
    const innerR = maxR * s.gap

    for (let i = 0; i < s.lineCount; i++) {
      const a = rng() * Math.PI * 2
      const x1 = cx + Math.cos(a) * innerR
      const y1 = cy + Math.sin(a) * innerR
      const x2 = cx + Math.cos(a) * maxR
      const y2 = cy + Math.sin(a) * maxR

      ctx.globalAlpha = s.intensity * (0.2 + rng() * 0.6)
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.stroke()
    }
  } else {
    // Horizontal
    const gapH = h * s.gap * 0.3
    const topZone = h * 0.5 - gapH
    const botZone = h * 0.5 + gapH

    for (let i = 0; i < s.lineCount; i++) {
      let y: number
      if (rng() > 0.5) {
        y = rng() * topZone
      } else {
        y = botZone + rng() * (h - botZone)
      }
      const x1 = 0
      const x2 = w

      ctx.globalAlpha = s.intensity * (0.15 + rng() * 0.5)
      ctx.beginPath()
      ctx.moveTo(x1, y)
      ctx.lineTo(x2, y)
      ctx.stroke()
    }
  }

  ctx.globalAlpha = 1
  return canvas.toDataURL('image/png')
}

export const animeSpeedCache = createEffectCache<AnimeSpeedSettings>({
  name: 'anime-speed',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
