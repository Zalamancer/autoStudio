/**
 * Flame Variants effect: multiple flame styles (candle, inferno, ember, blue).
 * Animated: cycles through seed variants per frame.
 */

import type { FlameVariantsSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: FlameVariantsSettings, seed?: number): string {
  return `flame-variants|${src}|${s.variant}|${s.size}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

type FlameColor = { inner: string; mid: string; outer: string; glow: string }

function getFlameColors(variant: string): FlameColor {
  switch (variant) {
    case 'candle': return { inner: '#fffbe6', mid: '#ffcc33', outer: '#ff6600', glow: '#ff9900' }
    case 'inferno': return { inner: '#ffffff', mid: '#ff4400', outer: '#880000', glow: '#ff2200' }
    case 'ember': return { inner: '#ffaa44', mid: '#cc4400', outer: '#441100', glow: '#cc3300' }
    case 'blue': return { inner: '#eeffff', mid: '#4488ff', outer: '#0022aa', glow: '#3366ff' }
    default: return { inner: '#fffbe6', mid: '#ffcc33', outer: '#ff6600', glow: '#ff9900' }
  }
}

async function process(src: string, s: FlameVariantsSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 3911 + 59)
  const colors = getFlameColors(s.variant)
  const sz = s.size
  const isCandle = s.variant === 'candle'
  const isInferno = s.variant === 'inferno'

  ctx.globalCompositeOperation = 'screen'

  const flameCount = isCandle ? Math.floor(5 + sz * 10) : Math.floor(20 + sz * 60)
  const maxH = isCandle ? h * 0.2 * sz : h * 0.4 * sz

  for (let i = 0; i < flameCount; i++) {
    const baseX = rng() * w
    const baseY = h - rng() * (isInferno ? h * 0.3 : 5)
    const fh = maxH * (0.3 + rng() * 0.7)
    const fw = isCandle ? 2 + rng() * 4 : 4 + rng() * 10

    const grad = ctx.createLinearGradient(baseX, baseY, baseX, baseY - fh)
    grad.addColorStop(0, colors.inner)
    grad.addColorStop(0.4, colors.mid)
    grad.addColorStop(0.8, colors.outer)
    grad.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.fillStyle = grad
    ctx.globalAlpha = 0.3 + rng() * 0.5

    ctx.beginPath()
    ctx.moveTo(baseX - fw / 2, baseY)
    const tipX = baseX + (rng() - 0.5) * fw * 1.5
    ctx.quadraticCurveTo(
      baseX - fw + (rng() - 0.5) * fw, baseY - fh * 0.6,
      tipX, baseY - fh,
    )
    ctx.quadraticCurveTo(
      baseX + fw + (rng() - 0.5) * fw, baseY - fh * 0.6,
      baseX + fw / 2, baseY,
    )
    ctx.closePath()
    ctx.fill()
  }

  // Add ember particles for 'ember' and 'inferno'
  if (s.variant === 'ember' || s.variant === 'inferno') {
    const sparks = Math.floor(sz * 40)
    for (let i = 0; i < sparks; i++) {
      const sx = rng() * w
      const sy = h - rng() * h * 0.6
      const sr = 1 + rng() * 2
      ctx.globalAlpha = 0.4 + rng() * 0.6
      ctx.fillStyle = colors.glow
      ctx.beginPath()
      ctx.arc(sx, sy, sr, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'

  return canvas.toDataURL('image/png')
}

export const flameVariantsCache = createEffectCache<FlameVariantsSettings>({
  name: 'flame-variants',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
