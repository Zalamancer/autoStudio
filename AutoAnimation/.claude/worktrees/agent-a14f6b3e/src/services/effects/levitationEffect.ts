/**
 * Levitation effect: objects appear to float with shadow offset and wobble.
 * Animated: cycles through seed variants per frame.
 */

import type { LevitationSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: LevitationSettings, seed?: number): string {
  return `levitation|${src}|${s.height}|${s.wobble}|${s.shadowOpacity}|${s.speed}|s${seed ?? 0}`
}

async function process(src: string, s: LevitationSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const liftY = s.height
  const wobbleX = Math.sin(seed * 0.8) * s.wobble * 5
  const wobbleY = Math.cos(seed * 1.2) * s.wobble * 3

  // Expand canvas to fit lift + shadow
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Draw drop shadow (ellipse at base)
  if (s.shadowOpacity > 0) {
    const shadowY = h - 5
    const shadowW = w * 0.6 * (1 - liftY / 60) // Shadow shrinks as object lifts
    const shadowH = 8 * (1 - liftY / 60)

    ctx.fillStyle = `rgba(0, 0, 0, ${s.shadowOpacity * 0.5})`
    ctx.beginPath()
    ctx.ellipse(w / 2, shadowY, Math.max(5, shadowW / 2), Math.max(2, shadowH), 0, 0, Math.PI * 2)
    ctx.fill()

    // Blur shadow by drawing multiple times
    ctx.fillStyle = `rgba(0, 0, 0, ${s.shadowOpacity * 0.2})`
    ctx.beginPath()
    ctx.ellipse(w / 2, shadowY, Math.max(8, shadowW / 2 + 5), Math.max(3, shadowH + 2), 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // Draw image lifted up
  ctx.drawImage(img, wobbleX, -liftY + wobbleY)

  return canvas.toDataURL('image/png')
}

export const levitationCache = createEffectCache<LevitationSettings>({
  name: 'levitation',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
