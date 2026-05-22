/**
 * Pixelate Transition effect: pixelate in/out.
 */

import type { PixelateTransitionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: PixelateTransitionSettings, seed?: number): string {
  return `pixelate-transition|${src}|${s.progress}|${s.maxPixelSize}|${s.direction}|s${seed ?? 0}`
}

async function process(src: string, s: PixelateTransitionSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  if (s.progress <= 0 && s.direction === 'in') { ctx.drawImage(img, 0, 0); return canvas.toDataURL('image/png') }
  if (s.progress >= 1 && s.direction === 'out') { ctx.drawImage(img, 0, 0); return canvas.toDataURL('image/png') }
  if (s.progress >= 1 && s.direction === 'in') return canvas.toDataURL('image/png')
  if (s.progress <= 0 && s.direction === 'out') return canvas.toDataURL('image/png')

  const effectiveProgress = s.direction === 'out' ? 1 - s.progress : s.progress
  const pixelSize = Math.max(1, Math.floor(effectiveProgress * s.maxPixelSize))

  if (pixelSize <= 1) {
    ctx.drawImage(img, 0, 0)
    return canvas.toDataURL('image/png')
  }

  // Downscale then upscale for pixelation
  const smallW = Math.max(1, Math.floor(w / pixelSize))
  const smallH = Math.max(1, Math.floor(h / pixelSize))

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = smallW; tempCanvas.height = smallH
  const tCtx = tempCanvas.getContext('2d')!
  tCtx.imageSmoothingEnabled = false
  tCtx.drawImage(img, 0, 0, smallW, smallH)

  ctx.imageSmoothingEnabled = false
  ctx.drawImage(tempCanvas, 0, 0, w, h)
  ctx.imageSmoothingEnabled = true

  // Fade out at end
  if (effectiveProgress > 0.8) {
    ctx.globalAlpha = (1 - effectiveProgress) * 5
    ctx.drawImage(canvas, 0, 0)
  }

  return canvas.toDataURL('image/png')
}

export const pixelateTransitionCache = createEffectCache<PixelateTransitionSettings>({
  name: 'pixelate-transition',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
