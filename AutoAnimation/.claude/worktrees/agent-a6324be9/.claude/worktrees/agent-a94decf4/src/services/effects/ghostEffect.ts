/**
 * Ghost effect: semi-transparent echoes/trails of the image.
 * Animated: trails shift with seed variants.
 */

import type { GhostSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: GhostSettings, seed?: number): string {
  return `ghost|${src}|${s.opacity}|${s.offset}|${s.blurAmount}|${s.trailCount}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: GhostSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const rng = mulberry32(seed * 5113 + 73)

  // Draw ghost trails behind the main image
  for (let t = s.trailCount; t >= 1; t--) {
    const trailAlpha = s.opacity * (t / s.trailCount) * 0.5
    const trailOffset = s.offset * t * (0.5 + rng() * 0.5)
    const angle = rng() * Math.PI * 2

    ctx.save()
    ctx.globalAlpha = trailAlpha

    // Apply blur via shadow trick
    if (s.blurAmount > 0) {
      ctx.filter = `blur(${s.blurAmount * (t / s.trailCount)}px)`
    }

    const dx = Math.cos(angle) * trailOffset
    const dy = Math.sin(angle) * trailOffset
    ctx.drawImage(img, dx, dy)
    ctx.restore()
  }

  // Draw the main image with slight transparency and blue/green tint
  ctx.save()
  ctx.globalAlpha = 0.6 + s.opacity * 0.4
  ctx.drawImage(img, 0, 0)
  ctx.restore()

  // Apply ghostly color tint
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    // Desaturate and add cool tint
    const avg = (d[i] + d[i + 1] + d[i + 2]) / 3
    d[i] = Math.round(d[i] * 0.5 + avg * 0.5) // desaturate red
    d[i + 1] = Math.min(255, Math.round(d[i + 1] * 0.6 + avg * 0.4 + 10)) // slight green
    d[i + 2] = Math.min(255, Math.round(d[i + 2] * 0.6 + avg * 0.4 + 20)) // boost blue
  }
  ctx.putImageData(imageData, 0, 0)

  return canvas.toDataURL('image/png')
}

export const ghostCache = createEffectCache<GhostSettings>({
  name: 'ghost',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
