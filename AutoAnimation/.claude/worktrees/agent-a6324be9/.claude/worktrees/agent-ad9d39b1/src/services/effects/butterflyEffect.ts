/**
 * Butterfly effect: butterflies floating around the image.
 * Animated: 8 seed variants cycled per frame.
 */

import type { ButterflySettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: ButterflySettings, seed?: number): string {
  return `butterfly|${src}|${s.count}|${s.colorful}|${s.wingSpeed}|${s.size}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const BUTTERFLY_COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A06CD5', '#FF8A5C', '#2EC4B6', '#E71D36']

async function process(src: string, s: ButterflySettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 5171 + 29)
  const sz = s.size * 8

  for (let i = 0; i < s.count; i++) {
    const bx = rng() * w
    const by = rng() * h
    const wingFlap = Math.sin(seed * s.wingSpeed * 3 + i * 2.1)
    const bodyAngle = rng() * Math.PI * 2
    const bSz = sz * (0.5 + rng() * 0.5)
    const color = s.colorful ? BUTTERFLY_COLORS[Math.floor(rng() * BUTTERFLY_COLORS.length)] : '#FFA500'

    ctx.save()
    ctx.translate(bx, by)
    ctx.rotate(bodyAngle * 0.3)
    ctx.globalAlpha = 0.7 + rng() * 0.3

    // Wings (scale X to simulate flapping)
    const wingScale = 0.3 + Math.abs(wingFlap) * 0.7

    // Left wing
    ctx.save()
    ctx.scale(-wingScale, 1)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(-bSz * 0.5, -bSz * 0.6, -bSz, -bSz * 0.3, -bSz * 0.3, bSz * 0.1)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(-bSz * 0.4, bSz * 0.2, -bSz * 0.6, bSz * 0.5, -bSz * 0.15, bSz * 0.3)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // Right wing
    ctx.save()
    ctx.scale(wingScale, 1)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(bSz * 0.5, -bSz * 0.6, bSz, -bSz * 0.3, bSz * 0.3, bSz * 0.1)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.bezierCurveTo(bSz * 0.4, bSz * 0.2, bSz * 0.6, bSz * 0.5, bSz * 0.15, bSz * 0.3)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // Body
    ctx.fillStyle = '#333333'
    ctx.beginPath()
    ctx.ellipse(0, 0, bSz * 0.04, bSz * 0.2, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  ctx.globalAlpha = 1
  return canvas.toDataURL('image/png')
}

export const butterflyCache = createEffectCache<ButterflySettings>({
  name: 'butterfly',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
