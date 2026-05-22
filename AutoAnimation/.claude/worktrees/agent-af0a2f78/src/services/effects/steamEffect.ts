/**
 * Steam effect: rising steam wisps with spread.
 * Animated: cycles through seed variants per frame.
 */

import type { SteamSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: SteamSettings, seed?: number): string {
  return `steam|${src}|${s.density}|${s.riseSpeed}|${s.spread}|${s.opacity}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: SteamSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 5309 + 61)
  const riseOffset = seed * s.riseSpeed * 20
  const wispCount = Math.floor(s.density * 30)

  for (let i = 0; i < wispCount; i++) {
    const baseX = w * 0.2 + rng() * w * 0.6
    const baseY = h * 0.5 + rng() * h * 0.5 - riseOffset % (h * 0.4)
    const wispW = s.spread * (1 + rng() * 2)
    const wispH = 20 + rng() * 40

    // Wisp is a series of semi-transparent circles rising and spreading
    const steps = 6 + Math.floor(rng() * 6)
    for (let step = 0; step < steps; step++) {
      const t = step / steps
      const sx = baseX + Math.sin(t * Math.PI * 2 + seed) * wispW * t
      const sy = baseY - t * wispH
      const radius = 5 + t * 15
      const alpha = s.opacity * (1 - t) * 0.3

      const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, radius)
      grad.addColorStop(0, `rgba(230, 235, 240, ${alpha})`)
      grad.addColorStop(0.6, `rgba(220, 225, 230, ${alpha * 0.5})`)
      grad.addColorStop(1, 'rgba(220, 225, 230, 0)')

      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(sx, sy, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  return canvas.toDataURL('image/png')
}

export const steamCache = createEffectCache<SteamSettings>({
  name: 'steam',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
