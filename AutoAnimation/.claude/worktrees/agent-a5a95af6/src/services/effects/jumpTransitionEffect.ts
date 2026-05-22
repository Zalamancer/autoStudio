/**
 * Jump Transition effect: bounce cut with squash.
 */

import type { JumpTransitionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: JumpTransitionSettings, seed?: number): string {
  return `jump-transition|${src}|${s.progress}|${s.bounceHeight}|${s.squash}|s${seed ?? 0}`
}

async function process(src: string, s: JumpTransitionSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  if (s.progress >= 1) return canvas.toDataURL('image/png')
  if (s.progress <= 0) { ctx.drawImage(img, 0, 0); return canvas.toDataURL('image/png') }

  // Bounce curve (parabolic)
  const t = s.progress
  const bounce = Math.sin(t * Math.PI) * s.bounceHeight * h * 0.3
  const squashAmount = 1 + Math.sin(t * Math.PI) * s.squash * 0.3
  const scaleY = 1 / squashAmount
  const scaleX = squashAmount

  ctx.save()
  ctx.translate(w * 0.5, h * 0.5 - bounce)
  ctx.scale(scaleX, scaleY)
  ctx.translate(-w * 0.5, -h * 0.5)
  ctx.globalAlpha = 1 - t * 0.5
  ctx.drawImage(img, 0, 0)
  ctx.restore()

  return canvas.toDataURL('image/png')
}

export const jumpTransitionCache = createEffectCache<JumpTransitionSettings>({
  name: 'jump-transition',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
