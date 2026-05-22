/**
 * Page Flip Transition effect: page turning animation.
 */

import type { PageFlipTransitionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: PageFlipTransitionSettings, seed?: number): string {
  return `page-flip-transition|${src}|${s.progress}|${s.direction}|${s.perspective}|s${seed ?? 0}`
}

async function process(src: string, s: PageFlipTransitionSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  if (s.progress >= 1) return canvas.toDataURL('image/png')
  if (s.progress <= 0) { ctx.drawImage(img, 0, 0); return canvas.toDataURL('image/png') }

  // Simulate page flip with scaling
  const flipProgress = s.progress
  const scaleX = Math.cos(flipProgress * Math.PI * 0.5)

  if (scaleX <= 0) return canvas.toDataURL('image/png')

  ctx.save()
  if (s.direction === 'left') {
    ctx.translate(0, 0)
    ctx.scale(scaleX, 1)
  } else {
    ctx.translate(w, 0)
    ctx.scale(-scaleX, 1)
    ctx.translate(-w, 0)
  }
  ctx.drawImage(img, 0, 0)

  // Page edge shadow
  ctx.globalAlpha = 0.3 * (1 - flipProgress)
  ctx.fillStyle = '#000000'
  if (s.direction === 'left') {
    ctx.fillRect(w * scaleX - 10, 0, 10, h)
  } else {
    ctx.fillRect(0, 0, 10, h)
  }

  ctx.restore()

  // Back-of-page hint
  ctx.save()
  ctx.globalAlpha = 0.1 * flipProgress
  ctx.fillStyle = '#F0EDE8'
  if (s.direction === 'left') {
    ctx.fillRect(0, 0, w * (1 - scaleX), h)
  } else {
    ctx.fillRect(w * scaleX, 0, w * (1 - scaleX), h)
  }
  ctx.restore()

  return canvas.toDataURL('image/png')
}

export const pageFlipTransitionCache = createEffectCache<PageFlipTransitionSettings>({
  name: 'page-flip-transition',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
