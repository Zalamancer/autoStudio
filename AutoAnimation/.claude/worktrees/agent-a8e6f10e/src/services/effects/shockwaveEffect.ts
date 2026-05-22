/**
 * Shockwave effect: Concentric ripple distortion from point.
 */

import type { ShockwaveSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: ShockwaveSettings, seed?: number): string {
  return `shockwave|${src}|${s.originX}|${s.originY}|${s.amplitude}|${s.wavelength}|s${seed ?? 0}`
}

async function process(src: string, s: ShockwaveSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const out = new Uint8ClampedArray(d)

  const ox = s.originX * w
  const oy = s.originY * h
  const amp = s.amplitude
  const waveLen = s.wavelength

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      const dx = x - ox; const dy = y - oy
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist > 0) {
        // Concentric ripple displacement
        const displacement = Math.sin(dist / waveLen * Math.PI * 2) * amp
        const angle = Math.atan2(dy, dx)
        const sx = Math.max(0, Math.min(w - 1, Math.floor(x + Math.cos(angle) * displacement)))
        const sy = Math.max(0, Math.min(h - 1, Math.floor(y + Math.sin(angle) * displacement)))
        const si = (sy * w + sx) * 4

        out[idx] = d[si]; out[idx + 1] = d[si + 1]
        out[idx + 2] = d[si + 2]; out[idx + 3] = d[si + 3]
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const shockwaveCache = createEffectCache<ShockwaveSettings>({
  name: 'shockwave',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
