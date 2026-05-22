/**
 * Hole Transition effect: iris/shape reveal from center.
 */

import type { HoleTransitionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: HoleTransitionSettings, seed?: number): string {
  return `hole-transition|${src}|${s.progress}|${s.centerX}|${s.centerY}|${s.shape}|s${seed ?? 0}`
}

async function process(src: string, s: HoleTransitionSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  if (s.progress >= 1) return canvas.toDataURL('image/png')
  if (s.progress <= 0) { ctx.drawImage(img, 0, 0); return canvas.toDataURL('image/png') }

  const cx = w * s.centerX; const cy = h * s.centerY
  const maxR = Math.sqrt(w * w + h * h)
  const r = maxR * (1 - s.progress)

  ctx.drawImage(img, 0, 0)

  // Black out outside the shape
  ctx.save()
  ctx.globalCompositeOperation = 'destination-in'

  ctx.beginPath()
  if (s.shape === 'circle') {
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
  } else if (s.shape === 'star') {
    const points = 5
    const outerR = r; const innerR = r * 0.4
    for (let i = 0; i < points * 2; i++) {
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI * 0.5
      const pr = i % 2 === 0 ? outerR : innerR
      if (i === 0) ctx.moveTo(cx + Math.cos(a) * pr, cy + Math.sin(a) * pr)
      else ctx.lineTo(cx + Math.cos(a) * pr, cy + Math.sin(a) * pr)
    }
    ctx.closePath()
  } else if (s.shape === 'heart') {
    const scale = r / 100
    ctx.moveTo(cx, cy + 30 * scale)
    ctx.bezierCurveTo(cx + 60 * scale, cy - 40 * scale, cx + 100 * scale, cy + 30 * scale, cx, cy + 90 * scale)
    ctx.bezierCurveTo(cx - 100 * scale, cy + 30 * scale, cx - 60 * scale, cy - 40 * scale, cx, cy + 30 * scale)
  }
  ctx.fill()
  ctx.restore()

  return canvas.toDataURL('image/png')
}

export const holeTransitionCache = createEffectCache<HoleTransitionSettings>({
  name: 'hole-transition',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
