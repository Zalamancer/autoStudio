/**
 * Fire Ring effect: ring of fire around center.
 * Animated: 8 seed variants cycled per frame.
 */

import type { FireRingSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: FireRingSettings, seed?: number): string {
  return `fire-ring|${src}|${s.radius}|${s.thickness}|${s.intensity}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: FireRingSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const cx = w * 0.5; const cy = h * 0.5
  const maxR = Math.min(w, h) * 0.5
  const ringR = maxR * s.radius
  const rng = mulberry32(seed * 4517 + 19)

  // Draw fire ring segments
  const segments = 60
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2
    const flicker = 0.6 + 0.4 * Math.sin(seed * s.speed * 3 + i * 0.5 + rng() * 2)
    const flameH = s.thickness * (1 + rng() * 0.5) * flicker
    const x = cx + Math.cos(a) * ringR
    const y = cy + Math.sin(a) * ringR

    ctx.save()
    ctx.globalAlpha = s.intensity * flicker
    ctx.globalCompositeOperation = 'screen'

    // Outer flame
    const grd = ctx.createRadialGradient(x, y, 0, x, y, flameH)
    grd.addColorStop(0, 'rgba(255,200,50,1)')
    grd.addColorStop(0.3, 'rgba(255,100,0,0.8)')
    grd.addColorStop(0.7, 'rgba(200,30,0,0.4)')
    grd.addColorStop(1, 'rgba(100,0,0,0)')
    ctx.fillStyle = grd
    ctx.fillRect(x - flameH, y - flameH, flameH * 2, flameH * 2)

    ctx.restore()
  }

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  return canvas.toDataURL('image/png')
}

export const fireRingCache = createEffectCache<FireRingSettings>({
  name: 'fire-ring',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
