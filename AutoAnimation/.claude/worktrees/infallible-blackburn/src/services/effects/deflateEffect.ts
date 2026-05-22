/**
 * Deflate effect: Inward pinch/shrink from center.
 */

import type { DeflateSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: DeflateSettings, seed?: number): string {
  return `deflate|${src}|${s.amount}|${s.centerX}|${s.centerY}|${s.radius}|s${seed ?? 0}`
}

async function process(src: string, s: DeflateSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const out = new Uint8ClampedArray(d.length)

  const cx = s.centerX * w
  const cy = s.centerY * h
  const maxR = s.radius * Math.min(w, h)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      let sx: number, sy: number
      if (dist < maxR && maxR > 0) {
        // Pinch: pull pixels toward center
        const normalizedDist = dist / maxR
        const pinch = Math.pow(normalizedDist, 1 / (1 + s.amount * 2))
        const scale = dist > 0 ? (pinch * maxR) / dist : 1
        sx = Math.floor(cx + dx * scale)
        sy = Math.floor(cy + dy * scale)
      } else {
        sx = x; sy = y
      }

      sx = Math.max(0, Math.min(w - 1, sx))
      sy = Math.max(0, Math.min(h - 1, sy))
      const si = (sy * w + sx) * 4
      out[idx] = d[si]; out[idx + 1] = d[si + 1]
      out[idx + 2] = d[si + 2]; out[idx + 3] = d[si + 3]
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const deflateCache = createEffectCache<DeflateSettings>({
  name: 'deflate',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
