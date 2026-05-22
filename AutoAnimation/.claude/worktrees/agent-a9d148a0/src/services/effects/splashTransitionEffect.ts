/**
 * Splash Transition effect: water splash wipe.
 */

import type { SplashTransitionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: SplashTransitionSettings, seed?: number): string {
  return `splash-transition|${src}|${s.progress}|${s.splashSize}|${s.color}|s${seed ?? 0}`
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

async function process(src: string, s: SplashTransitionSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  if (s.progress >= 1) return canvas.toDataURL('image/png')
  ctx.drawImage(img, 0, 0)
  if (s.progress <= 0) return canvas.toDataURL('image/png')

  const [cr, cg, cb] = hexToRgb(s.color || '#4488CC')
  const rng = mulberry32(seed * 6173 + 13)
  const maxR = Math.max(w, h) * s.splashSize

  // Central splash
  const cx = w * 0.5; const cy = h * 0.5
  const splashR = maxR * s.progress

  ctx.save()
  ctx.globalAlpha = Math.min(1, s.progress * 2)
  const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, splashR)
  grd.addColorStop(0, `rgba(${cr},${cg},${cb},0.9)`)
  grd.addColorStop(0.7, `rgba(${cr},${cg},${cb},0.6)`)
  grd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, w, h)
  ctx.restore()

  // Splash droplets
  const dropCount = Math.floor(s.progress * 20)
  for (let i = 0; i < dropCount; i++) {
    const a = rng() * Math.PI * 2
    const dist = splashR * (0.8 + rng() * 0.5)
    const dx = cx + Math.cos(a) * dist
    const dy = cy + Math.sin(a) * dist
    const dr = 3 + rng() * 10

    ctx.save()
    ctx.globalAlpha = 0.5 + rng() * 0.3
    ctx.fillStyle = `rgb(${cr},${cg},${cb})`
    ctx.beginPath()
    ctx.arc(dx, dy, dr, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}

export const splashTransitionCache = createEffectCache<SplashTransitionSettings>({
  name: 'splash-transition',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
