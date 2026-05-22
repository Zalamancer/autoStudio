/**
 * Roll Transition effect: page roll/curl reveal.
 */

import type { RollTransitionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: RollTransitionSettings, seed?: number): string {
  return `roll-transition|${src}|${s.direction}|${s.progress}|${s.curlRadius}|s${seed ?? 0}`
}

async function process(src: string, s: RollTransitionSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  const p = s.progress
  if (p <= 0) { ctx.drawImage(img, 0, 0); return canvas.toDataURL('image/png') }
  if (p >= 1) return canvas.toDataURL('image/png')

  // Draw visible portion
  ctx.save()
  ctx.beginPath()
  switch (s.direction) {
    case 'left': ctx.rect(w * p, 0, w * (1 - p), h); break
    case 'right': ctx.rect(0, 0, w * (1 - p), h); break
    case 'up': ctx.rect(0, h * p, w, h * (1 - p)); break
    case 'down': ctx.rect(0, 0, w, h * (1 - p)); break
  }
  ctx.clip()
  ctx.drawImage(img, 0, 0)
  ctx.restore()

  // Curl shadow
  ctx.save()
  const shadowW = s.curlRadius * 2
  ctx.globalAlpha = 0.3 * (1 - p)
  ctx.fillStyle = '#000000'
  switch (s.direction) {
    case 'left': ctx.fillRect(w * p - shadowW, 0, shadowW, h); break
    case 'right': ctx.fillRect(w * (1 - p), 0, shadowW, h); break
    case 'up': ctx.fillRect(0, h * p - shadowW, w, shadowW); break
    case 'down': ctx.fillRect(0, h * (1 - p), w, shadowW); break
  }
  ctx.restore()

  // Curled edge highlight
  ctx.save()
  ctx.globalAlpha = 0.15
  ctx.fillStyle = '#FFFFFF'
  const edgeW = s.curlRadius
  switch (s.direction) {
    case 'left': ctx.fillRect(w * p, 0, edgeW, h); break
    case 'right': ctx.fillRect(w * (1 - p) - edgeW, 0, edgeW, h); break
    case 'up': ctx.fillRect(0, h * p, w, edgeW); break
    case 'down': ctx.fillRect(0, h * (1 - p) - edgeW, w, edgeW); break
  }
  ctx.restore()

  return canvas.toDataURL('image/png')
}

export const rollTransitionCache = createEffectCache<RollTransitionSettings>({
  name: 'roll-transition',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
