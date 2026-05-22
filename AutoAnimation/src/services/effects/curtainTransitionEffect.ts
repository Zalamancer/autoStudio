/**
 * Curtain Transition effect: theater curtain open/close.
 */

import type { CurtainTransitionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'
import { hexToRgb } from '@/utils/color'

function cacheKey(src: string, s: CurtainTransitionSettings, seed?: number): string {
  return `curtain-transition|${src}|${s.progress}|${s.curtainColor}|${s.folds}|s${seed ?? 0}`
}

async function process(src: string, s: CurtainTransitionSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  ctx.drawImage(img, 0, 0)

  if (s.progress <= 0) return canvas.toDataURL('image/png')

  const [cr, cg, cb] = hexToRgb(s.curtainColor || '#8B0000')
  const curtainW = w * 0.5 * s.progress
  const foldW = curtainW / s.folds

  // Left curtain
  for (let i = 0; i < s.folds; i++) {
    const x = i * foldW
    const shade = i % 2 === 0 ? 1 : 0.7
    ctx.fillStyle = `rgb(${Math.floor(cr * shade)},${Math.floor(cg * shade)},${Math.floor(cb * shade)})`
    ctx.fillRect(x, 0, foldW + 1, h)
  }

  // Right curtain
  for (let i = 0; i < s.folds; i++) {
    const x = w - curtainW + i * foldW
    const shade = i % 2 === 0 ? 1 : 0.7
    ctx.fillStyle = `rgb(${Math.floor(cr * shade)},${Math.floor(cg * shade)},${Math.floor(cb * shade)})`
    ctx.fillRect(x, 0, foldW + 1, h)
  }

  // Valance at top
  ctx.fillStyle = `rgb(${Math.floor(cr * 0.8)},${Math.floor(cg * 0.8)},${Math.floor(cb * 0.8)})`
  ctx.fillRect(0, 0, w, h * 0.05 * s.progress)

  // Gold trim
  ctx.fillStyle = '#DAA520'
  ctx.fillRect(curtainW - 3, 0, 3, h)
  ctx.fillRect(w - curtainW, 0, 3, h)

  return canvas.toDataURL('image/png')
}

export const curtainTransitionCache = createEffectCache<CurtainTransitionSettings>({
  name: 'curtain-transition',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
