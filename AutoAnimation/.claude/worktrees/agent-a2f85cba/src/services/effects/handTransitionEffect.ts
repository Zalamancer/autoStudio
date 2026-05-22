/**
 * Hand Transition effect: hand wipe across the image.
 */

import type { HandTransitionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: HandTransitionSettings, seed?: number): string {
  return `hand-transition|${src}|${s.progress}|${s.direction}|${s.handStyle}|s${seed ?? 0}`
}

async function process(src: string, s: HandTransitionSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  if (s.progress >= 1) return canvas.toDataURL('image/png')
  if (s.progress <= 0) { ctx.drawImage(img, 0, 0); return canvas.toDataURL('image/png') }

  // Draw visible portion
  const wipeX = s.direction === 'left' ? w * s.progress : w * (1 - s.progress)
  ctx.save()
  ctx.beginPath()
  if (s.direction === 'left') {
    ctx.rect(wipeX, 0, w - wipeX, h)
  } else {
    ctx.rect(0, 0, wipeX, h)
  }
  ctx.clip()
  ctx.drawImage(img, 0, 0)
  ctx.restore()

  // Hand shape at wipe edge
  const handX = wipeX
  const handW = 60
  const handH = h * 0.3

  ctx.save()
  ctx.fillStyle = '#FFD4A8'

  if (s.handStyle === 'fist') {
    ctx.beginPath()
    ctx.ellipse(handX, h * 0.5, handW, handH * 0.4, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    // Open hand with fingers
    ctx.beginPath()
    ctx.ellipse(handX, h * 0.5, handW * 0.8, handH * 0.3, 0, 0, Math.PI * 2)
    ctx.fill()
    for (let f = 0; f < 4; f++) {
      const fy = h * 0.35 + f * handH * 0.15
      ctx.beginPath()
      ctx.ellipse(handX + (s.direction === 'left' ? -handW : handW), fy, handW * 0.15, handH * 0.08, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()

  return canvas.toDataURL('image/png')
}

export const handTransitionCache = createEffectCache<HandTransitionSettings>({
  name: 'hand-transition',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
