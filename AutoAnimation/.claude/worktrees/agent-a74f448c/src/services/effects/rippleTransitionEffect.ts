/**
 * Ripple Transition effect: water ripple expanding outward.
 */

import type { RippleTransitionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: RippleTransitionSettings, seed?: number): string {
  return `ripple-transition|${src}|${s.progress}|${s.waveCount}|${s.amplitude}|s${seed ?? 0}`
}

async function process(src: string, s: RippleTransitionSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  if (s.progress >= 1) return canvas.toDataURL('image/png')
  if (s.progress <= 0) { ctx.drawImage(img, 0, 0); return canvas.toDataURL('image/png') }

  // Source image data
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = w; srcCanvas.height = h
  const sCtx = srcCanvas.getContext('2d')!
  sCtx.drawImage(img, 0, 0)
  const srcData = sCtx.getImageData(0, 0, w, h)
  const sd = srcData.data

  const outData = ctx.createImageData(w, h)
  const od = outData.data

  const cx = w * 0.5; const cy = h * 0.5
  const maxR = Math.sqrt(cx * cx + cy * cy)
  const rippleR = maxR * s.progress

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x - cx; const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const idx = (y * w + x) * 4

      if (dist > rippleR) {
        // Outside ripple - show original
        od[idx] = sd[idx]
        od[idx + 1] = sd[idx + 1]
        od[idx + 2] = sd[idx + 2]
        od[idx + 3] = sd[idx + 3]
      } else {
        // Inside ripple - distort
        const wave = Math.sin((dist / maxR) * s.waveCount * Math.PI * 2 - s.progress * 10) * s.amplitude
        const angle = Math.atan2(dy, dx)
        const sx = Math.round(x + Math.cos(angle) * wave)
        const sy = Math.round(y + Math.sin(angle) * wave)
        const si = (Math.max(0, Math.min(h - 1, sy)) * w + Math.max(0, Math.min(w - 1, sx))) * 4

        const fade = Math.min(1, (rippleR - dist) / (maxR * 0.1))
        od[idx] = sd[si]
        od[idx + 1] = sd[si + 1]
        od[idx + 2] = sd[si + 2]
        od[idx + 3] = Math.floor(sd[si + 3] * (1 - s.progress * 0.5 * fade))
      }
    }
  }

  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const rippleTransitionCache = createEffectCache<RippleTransitionSettings>({
  name: 'ripple-transition',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
