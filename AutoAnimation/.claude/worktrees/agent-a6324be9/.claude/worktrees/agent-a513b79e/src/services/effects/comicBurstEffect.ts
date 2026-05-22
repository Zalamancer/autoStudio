/**
 * Comic Burst effect: action burst/speed lines radiating from a center point.
 */

import type { ComicBurstSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: ComicBurstSettings, seed?: number): string {
  return `comic-burst|${src}|${s.lineCount}|${s.lineWidth}|${s.centerX}|${s.centerY}|s${seed ?? 0}`
}

async function process(src: string, s: ComicBurstSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const cx = w * s.centerX
  const cy = h * s.centerY
  const maxR = Math.sqrt(w * w + h * h)

  ctx.strokeStyle = '#000000'
  ctx.lineWidth = s.lineWidth

  for (let i = 0; i < s.lineCount; i++) {
    const a = (i / s.lineCount) * Math.PI * 2
    const innerR = maxR * 0.15
    const x1 = cx + Math.cos(a) * innerR
    const y1 = cy + Math.sin(a) * innerR
    const x2 = cx + Math.cos(a) * maxR
    const y2 = cy + Math.sin(a) * maxR

    ctx.globalAlpha = 0.3 + Math.abs(Math.sin(i * 0.7)) * 0.4
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()
  }

  ctx.globalAlpha = 1
  return canvas.toDataURL('image/png')
}

export const comicBurstCache = createEffectCache<ComicBurstSettings>({
  name: 'comic-burst',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
