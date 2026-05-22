/**
 * Swirl effect: Twirl/swirl distortion from center.
 */

import type { SwirlSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: SwirlSettings, seed?: number): string {
  return `swirl|${src}|${s.angle}|${s.radius}|${s.centerX}|${s.centerY}|s${seed ?? 0}`
}

async function process(src: string, s: SwirlSettings, _seed = 0): Promise<string> {
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
  const maxAngle = (s.angle * Math.PI) / 180

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      const dx = x - cx; const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      let sx: number, sy: number
      if (dist < maxR && maxR > 0) {
        // Swirl angle decreases with distance from center
        const swirlFactor = 1 - dist / maxR
        const swirlAngle = swirlFactor * swirlFactor * maxAngle
        const angle = Math.atan2(dy, dx) + swirlAngle

        sx = Math.floor(cx + Math.cos(angle) * dist)
        sy = Math.floor(cy + Math.sin(angle) * dist)
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

export const swirlCache = createEffectCache<SwirlSettings>({
  name: 'swirl',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
