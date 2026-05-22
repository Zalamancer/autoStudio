/**
 * Retro 8-bit effect: reduced color depth, optional scanlines and CRT curve.
 */

import type { Retro8bitSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: Retro8bitSettings, seed?: number): string {
  return `retro8bit|${src}|${s.colorDepth}|${s.scanlines}|${s.crtCurve}|s${seed ?? 0}`
}

async function process(src: string, s: Retro8bitSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  // Reduce color depth
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const levels = s.colorDepth
  const step = 256 / levels

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    d[i] = Math.floor(d[i] / step) * step
    d[i + 1] = Math.floor(d[i + 1] / step) * step
    d[i + 2] = Math.floor(d[i + 2] / step) * step
  }
  ctx.putImageData(imageData, 0, 0)

  // Scanlines
  if (s.scanlines) {
    ctx.globalAlpha = 0.15
    ctx.fillStyle = '#000000'
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1)
    }
    ctx.globalAlpha = 1
  }

  // CRT curve vignette
  if (s.crtCurve > 0) {
    const grd = ctx.createRadialGradient(w * 0.5, h * 0.5, Math.min(w, h) * 0.3, w * 0.5, h * 0.5, Math.max(w, h) * 0.7)
    grd.addColorStop(0, 'rgba(0,0,0,0)')
    grd.addColorStop(1, `rgba(0,0,0,${s.crtCurve * 0.7})`)
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, w, h)
  }

  return canvas.toDataURL('image/png')
}

export const retro8bitCache = createEffectCache<Retro8bitSettings>({
  name: 'retro-8bit',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
