/**
 * Rubber effect: Elastic stretchy deformation.
 */

import type { RubberSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: RubberSettings, seed?: number): string {
  return `rubber|${src}|${s.elasticity}|${s.bounceSpeed}|${s.amplitude}|s${seed ?? 0}`
}

async function process(src: string, s: RubberSettings, seed = 0): Promise<string> {
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

  const phase = seed * 0.5 * s.bounceSpeed
  const amp = s.amplitude

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4

      // Elastic wave displacement
      const nx = x / w - 0.5
      const ny = y / h - 0.5
      const dist = Math.sqrt(nx * nx + ny * ny)

      const wave = Math.sin(dist * 10 - phase) * s.elasticity
      const dx = Math.floor(nx * wave * amp)
      const dy = Math.floor(ny * wave * amp)

      const sx = Math.max(0, Math.min(w - 1, x + dx))
      const sy = Math.max(0, Math.min(h - 1, y + dy))
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

export const rubberCache = createEffectCache<RubberSettings>({
  name: 'rubber',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
