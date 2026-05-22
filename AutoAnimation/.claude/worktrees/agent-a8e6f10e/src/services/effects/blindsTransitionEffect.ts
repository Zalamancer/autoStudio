/**
 * Blinds Transition effect: venetian blinds opening.
 */

import type { BlindsTransitionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: BlindsTransitionSettings, seed?: number): string {
  return `blinds-transition|${src}|${s.progress}|${s.slatCount}|${s.direction}|s${seed ?? 0}`
}

async function process(src: string, s: BlindsTransitionSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  if (s.progress >= 1) return canvas.toDataURL('image/png')
  if (s.progress <= 0) { ctx.drawImage(img, 0, 0); return canvas.toDataURL('image/png') }

  ctx.drawImage(img, 0, 0)

  // Draw blind slats covering image
  ctx.fillStyle = '#000000'
  const slatSize = s.direction === 'horizontal' ? h / s.slatCount : w / s.slatCount
  const coverAmount = slatSize * s.progress

  for (let i = 0; i < s.slatCount; i++) {
    if (s.direction === 'horizontal') {
      const y = i * slatSize
      ctx.fillRect(0, y, w, coverAmount)
    } else {
      const x = i * slatSize
      ctx.fillRect(x, 0, coverAmount, h)
    }
  }

  return canvas.toDataURL('image/png')
}

export const blindsTransitionCache = createEffectCache<BlindsTransitionSettings>({
  name: 'blinds-transition',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
