/**
 * Spark effect: sparkle particles scattered across the image.
 * Animated: cycles through seed variants per frame.
 */

import type { SparkSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: SparkSettings, seed?: number): string {
  return `spark|${src}|${s.count}|${s.size}|${s.brightness}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: SparkSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 8677 + 29)
  ctx.globalCompositeOperation = 'screen'

  for (let i = 0; i < s.count; i++) {
    const px = rng() * w
    const py = rng() * h
    const sparkSize = s.size * (0.5 + rng())
    const alpha = s.brightness * (0.3 + rng() * 0.7)
    const twinkle = 0.5 + Math.sin(seed * 3 + i * 1.7) * 0.5

    if (twinkle < 0.2) continue // Some sparkles are "off" this frame

    // Draw 4-point star sparkle
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * twinkle})`
    ctx.beginPath()
    const arms = 4
    for (let a = 0; a < arms * 2; a++) {
      const angle = (a * Math.PI) / arms
      const r = a % 2 === 0 ? sparkSize : sparkSize * 0.2
      const sx = px + Math.cos(angle) * r
      const sy = py + Math.sin(angle) * r
      if (a === 0) ctx.moveTo(sx, sy)
      else ctx.lineTo(sx, sy)
    }
    ctx.closePath()
    ctx.fill()

    // Glow around sparkle
    const grad = ctx.createRadialGradient(px, py, 0, px, py, sparkSize * 1.5)
    grad.addColorStop(0, `rgba(255, 255, 240, ${alpha * twinkle * 0.5})`)
    grad.addColorStop(1, 'rgba(255, 255, 240, 0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(px, py, sparkSize * 1.5, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.globalCompositeOperation = 'source-over'
  return canvas.toDataURL('image/png')
}

export const sparkCache = createEffectCache<SparkSettings>({
  name: 'spark',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
