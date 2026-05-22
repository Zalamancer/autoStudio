/**
 * Raven Transition effect: dark birds sweeping across.
 */

import type { RavenTransitionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: RavenTransitionSettings, seed?: number): string {
  return `raven-transition|${src}|${s.progress}|${s.birdCount}|${s.darkness}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: RavenTransitionSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  if (s.progress >= 1) return canvas.toDataURL('image/png')
  ctx.drawImage(img, 0, 0)
  if (s.progress <= 0) return canvas.toDataURL('image/png')

  // Dark overlay growing
  ctx.globalAlpha = s.progress * s.darkness
  ctx.fillStyle = '#0A0A1A'
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 1

  // Draw birds
  const rng = mulberry32(42)
  ctx.fillStyle = '#000000'

  for (let i = 0; i < s.birdCount; i++) {
    const startX = -50 + rng() * w * 0.3
    const endX = w + 50 - rng() * w * 0.3
    const bx = startX + (endX - startX) * s.progress + rng() * 30
    const by = rng() * h
    const birdSize = 15 + rng() * 20
    const flapPhase = s.progress * 10 + i * 2

    ctx.save()
    ctx.translate(bx, by)
    ctx.globalAlpha = 0.7 + rng() * 0.3

    // Wings
    const wingAngle = Math.sin(flapPhase) * 0.5
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(-birdSize * 0.5, -birdSize * wingAngle, -birdSize, -birdSize * 0.3 * wingAngle)
    ctx.quadraticCurveTo(-birdSize * 0.5, birdSize * 0.1, 0, 0)
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(birdSize * 0.5, -birdSize * wingAngle, birdSize, -birdSize * 0.3 * wingAngle)
    ctx.quadraticCurveTo(birdSize * 0.5, birdSize * 0.1, 0, 0)
    ctx.fill()

    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}

export const ravenTransitionCache = createEffectCache<RavenTransitionSettings>({
  name: 'raven-transition',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
