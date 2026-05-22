/**
 * Sparkle effect: glitter particles scattered across the image.
 * Animated: 8 seed variants cycled per frame.
 */

import type { SparkleSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: SparkleSettings, seed?: number): string {
  return `sparkle|${src}|${s.density}|${s.size}|${s.brightness}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    ctx.moveTo(x, y)
    ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
  }
  ctx.stroke()
}

async function process(src: string, s: SparkleSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 8831 + 41)
  const count = Math.floor(s.density * 60) + 10

  for (let i = 0; i < count; i++) {
    const sx = rng() * w
    const sy = rng() * h
    const sz = s.size * (2 + rng() * 4)
    const flicker = Math.sin(seed * s.speed * 2 + i * 3.7) * 0.5 + 0.5
    const alpha = s.brightness * flicker

    if (alpha < 0.05) continue

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.globalCompositeOperation = 'screen'
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 1.5

    // 4-point star sparkle
    drawStar(ctx, sx, sy, sz)

    // Center glow
    const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, sz * 0.5)
    grd.addColorStop(0, 'rgba(255,255,255,0.8)')
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grd
    ctx.fillRect(sx - sz * 0.5, sy - sz * 0.5, sz, sz)

    ctx.restore()
  }

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  return canvas.toDataURL('image/png')
}

export const sparkleCache = createEffectCache<SparkleSettings>({
  name: 'sparkle',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
