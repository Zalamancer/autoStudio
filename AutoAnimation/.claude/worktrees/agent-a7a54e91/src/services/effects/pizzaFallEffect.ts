/**
 * Pizza Fall effect: falling pizza slices.
 * Animated: 8 seed variants cycled per frame.
 */

import type { PizzaFallSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: PizzaFallSettings, seed?: number): string {
  return `pizza-fall|${src}|${s.count}|${s.size}|${s.rotateSpeed}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: PizzaFallSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 5501 + 13)
  const sz = s.size * 10

  for (let i = 0; i < s.count; i++) {
    const px = rng() * w
    const py = (rng() * (h + sz) + seed * s.speed * 35) % (h + sz) - sz
    const rot = seed * s.rotateSpeed * 2 + rng() * Math.PI * 2

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(rot)
    ctx.globalAlpha = 0.8 + rng() * 0.2
    const sliceSize = sz * (0.6 + rng() * 0.4)

    // Pizza slice triangle
    ctx.fillStyle = '#F4C430'
    ctx.beginPath()
    ctx.moveTo(0, -sliceSize * 0.7)
    ctx.lineTo(-sliceSize * 0.4, sliceSize * 0.3)
    ctx.lineTo(sliceSize * 0.4, sliceSize * 0.3)
    ctx.closePath()
    ctx.fill()

    // Crust
    ctx.strokeStyle = '#D4A017'
    ctx.lineWidth = sliceSize * 0.08
    ctx.beginPath()
    ctx.moveTo(-sliceSize * 0.4, sliceSize * 0.3)
    ctx.lineTo(sliceSize * 0.4, sliceSize * 0.3)
    ctx.stroke()

    // Pepperoni dots
    ctx.fillStyle = '#CC3333'
    for (let p = 0; p < 3; p++) {
      const dx = (rng() - 0.5) * sliceSize * 0.4
      const dy = -sliceSize * 0.1 + rng() * sliceSize * 0.3
      ctx.beginPath()
      ctx.arc(dx, dy, sliceSize * 0.06, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  ctx.globalAlpha = 1
  return canvas.toDataURL('image/png')
}

export const pizzaFallCache = createEffectCache<PizzaFallSettings>({
  name: 'pizza-fall',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
