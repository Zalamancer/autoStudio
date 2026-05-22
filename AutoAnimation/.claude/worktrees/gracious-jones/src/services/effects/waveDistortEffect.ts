/**
 * Wave Distort effect: Sinusoidal wave displacement.
 */

import type { WaveDistortSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: WaveDistortSettings, seed?: number): string {
  return `wave-distort|${src}|${s.amplitudeX}|${s.amplitudeY}|${s.frequencyX}|${s.frequencyY}|s${seed ?? 0}`
}

async function process(src: string, s: WaveDistortSettings, _seed = 0): Promise<string> {
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

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4

      // Sinusoidal displacement in X and Y
      const displaceX = Math.sin(y * s.frequencyX * 0.02 * Math.PI) * s.amplitudeX
      const displaceY = Math.sin(x * s.frequencyY * 0.02 * Math.PI) * s.amplitudeY

      const sx = Math.max(0, Math.min(w - 1, Math.floor(x + displaceX)))
      const sy = Math.max(0, Math.min(h - 1, Math.floor(y + displaceY)))
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

export const waveDistortCache = createEffectCache<WaveDistortSettings>({
  name: 'wave-distort',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
