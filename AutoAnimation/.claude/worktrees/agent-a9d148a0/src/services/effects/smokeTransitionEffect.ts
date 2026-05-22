/**
 * Smoke Transition effect: smoke wipe reveal.
 */

import type { SmokeTransitionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: SmokeTransitionSettings, seed?: number): string {
  return `smoke-transition|${src}|${s.progress}|${s.density}|${s.color}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.replace('#', ''), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

async function process(src: string, s: SmokeTransitionSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  if (s.progress >= 1) return canvas.toDataURL('image/png')
  ctx.drawImage(img, 0, 0)

  if (s.progress <= 0) return canvas.toDataURL('image/png')

  const [cr, cg, cb] = hexToRgb(s.color || '#888888')
  const rng = mulberry32(seed * 2017 + 7)
  const puffCount = Math.floor(s.density * 30) + 10

  for (let i = 0; i < puffCount; i++) {
    const px = rng() * w
    const py = rng() * h
    const r = 30 + rng() * 100
    const puffProgress = (s.progress * 1.5 - rng() * 0.5)
    if (puffProgress <= 0) continue

    const alpha = Math.min(1, puffProgress) * 0.8 * s.density

    ctx.save()
    ctx.globalAlpha = alpha
    const grd = ctx.createRadialGradient(px, py, 0, px, py, r)
    grd.addColorStop(0, `rgba(${cr},${cg},${cb},1)`)
    grd.addColorStop(0.6, `rgba(${cr},${cg},${cb},0.5)`)
    grd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
    ctx.fillStyle = grd
    ctx.fillRect(px - r, py - r, r * 2, r * 2)
    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}

export const smokeTransitionCache = createEffectCache<SmokeTransitionSettings>({
  name: 'smoke-transition',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
