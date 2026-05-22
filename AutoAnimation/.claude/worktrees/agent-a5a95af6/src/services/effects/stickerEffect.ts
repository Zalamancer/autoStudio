/**
 * Sticker effect: cutout border with shadow to look like a sticker.
 */

import type { StickerSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: StickerSettings, seed?: number): string {
  return `sticker|${src}|${s.outlineWidth}|${s.outlineColor}|${s.shadow}|${s.rounded}|s${seed ?? 0}`
}

async function process(src: string, s: StickerSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const pad = s.outlineWidth + (s.shadow ? 6 : 0)
  const cw = w + pad * 2
  const ch = h + pad * 2
  const canvas = document.createElement('canvas'); canvas.width = cw; canvas.height = ch
  const ctx = canvas.getContext('2d')!

  // Drop shadow
  if (s.shadow) {
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 3
    ctx.shadowOffsetY = 3
    ctx.fillStyle = s.outlineColor
    if (s.rounded > 0) {
      const r = Math.min(w, h) * s.rounded * 0.2
      ctx.beginPath()
      ctx.roundRect(pad - s.outlineWidth, pad - s.outlineWidth, w + s.outlineWidth * 2, h + s.outlineWidth * 2, r)
      ctx.fill()
    } else {
      ctx.fillRect(pad - s.outlineWidth, pad - s.outlineWidth, w + s.outlineWidth * 2, h + s.outlineWidth * 2)
    }
    ctx.restore()
  } else {
    // Just outline
    ctx.fillStyle = s.outlineColor
    if (s.rounded > 0) {
      const r = Math.min(w, h) * s.rounded * 0.2
      ctx.beginPath()
      ctx.roundRect(pad - s.outlineWidth, pad - s.outlineWidth, w + s.outlineWidth * 2, h + s.outlineWidth * 2, r)
      ctx.fill()
    } else {
      ctx.fillRect(pad - s.outlineWidth, pad - s.outlineWidth, w + s.outlineWidth * 2, h + s.outlineWidth * 2)
    }
  }

  // Clip and draw image
  if (s.rounded > 0) {
    const r = Math.min(w, h) * s.rounded * 0.15
    ctx.beginPath()
    ctx.roundRect(pad, pad, w, h, r)
    ctx.clip()
  }
  ctx.drawImage(img, pad, pad)

  return canvas.toDataURL('image/png')
}

export const stickerCache = createEffectCache<StickerSettings>({
  name: 'sticker',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
