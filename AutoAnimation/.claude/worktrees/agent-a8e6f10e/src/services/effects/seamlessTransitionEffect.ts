/**
 * Seamless Transition effect: morph blend / dissolve / slide.
 */

import type { SeamlessTransitionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: SeamlessTransitionSettings, seed?: number): string {
  return `seamless-transition|${src}|${s.progress}|${s.blendMode}|s${seed ?? 0}`
}

async function process(src: string, s: SeamlessTransitionSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  if (s.progress >= 1) return canvas.toDataURL('image/png')
  if (s.progress <= 0) { ctx.drawImage(img, 0, 0); return canvas.toDataURL('image/png') }

  switch (s.blendMode) {
    case 'dissolve':
      ctx.globalAlpha = 1 - s.progress
      ctx.drawImage(img, 0, 0)
      break

    case 'morph': {
      // Scale + fade
      const scale = 1 + s.progress * 0.2
      ctx.save()
      ctx.translate(w * 0.5, h * 0.5)
      ctx.scale(scale, scale)
      ctx.translate(-w * 0.5, -h * 0.5)
      ctx.globalAlpha = 1 - s.progress
      ctx.drawImage(img, 0, 0)
      ctx.restore()
      break
    }

    case 'slide':
      ctx.globalAlpha = 1 - s.progress * 0.3
      ctx.drawImage(img, -w * s.progress, 0)
      break
  }

  ctx.globalAlpha = 1
  return canvas.toDataURL('image/png')
}

export const seamlessTransitionCache = createEffectCache<SeamlessTransitionSettings>({
  name: 'seamless-transition',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
