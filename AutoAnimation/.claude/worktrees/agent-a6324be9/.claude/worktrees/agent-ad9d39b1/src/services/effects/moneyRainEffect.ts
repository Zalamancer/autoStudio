/**
 * Money Rain effect: falling money bills.
 * Animated: 8 seed variants cycled per frame.
 */

import type { MoneyRainSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: MoneyRainSettings, seed?: number): string {
  return `money-rain|${src}|${s.density}|${s.billColor}|${s.size}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: MoneyRainSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 7717 + 31)
  const count = Math.floor(s.density * 40) + 5
  const billW = s.size * 12
  const billH = s.size * 6
  const color = s.billColor === 'gold' ? '#DAA520' : '#2E8B57'
  const colorLight = s.billColor === 'gold' ? '#FFD700' : '#3CB371'

  for (let i = 0; i < count; i++) {
    const bx = rng() * w
    const by = (rng() * (h + billH) + seed * s.speed * 40) % (h + billH) - billH
    const rot = (rng() - 0.5) * 0.8 + Math.sin(seed * 0.3 + i) * 0.2
    const scaleX = 0.6 + rng() * 0.4

    ctx.save()
    ctx.translate(bx, by)
    ctx.rotate(rot)
    ctx.scale(scaleX, 1)
    ctx.globalAlpha = 0.7 + rng() * 0.3

    // Bill background
    ctx.fillStyle = color
    ctx.fillRect(-billW * 0.5, -billH * 0.5, billW, billH)

    // Border
    ctx.strokeStyle = colorLight
    ctx.lineWidth = 1.5
    ctx.strokeRect(-billW * 0.5 + 2, -billH * 0.5 + 2, billW - 4, billH - 4)

    // $ symbol
    ctx.fillStyle = colorLight
    ctx.font = `bold ${billH * 0.6}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('$', 0, 0)

    ctx.restore()
  }

  ctx.globalAlpha = 1
  return canvas.toDataURL('image/png')
}

export const moneyRainCache = createEffectCache<MoneyRainSettings>({
  name: 'money-rain',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
