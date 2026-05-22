/**
 * Kaleidoscope effect: Mirror-tiled kaleidoscope pattern.
 */

import type { KaleidoscopeSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: KaleidoscopeSettings, seed?: number): string {
  return `kaleidoscope|${src}|${s.segments}|${s.rotation}|${s.zoom}|s${seed ?? 0}`
}

async function process(src: string, s: KaleidoscopeSettings, _seed = 0): Promise<string> {
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

  const cx = w / 2; const cy = h / 2
  const segAngle = (Math.PI * 2) / s.segments
  const rotRad = (s.rotation * Math.PI) / 180

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4

      // Convert to polar coordinates relative to center
      const dx = (x - cx) / s.zoom
      const dy = (y - cy) / s.zoom
      let angle = Math.atan2(dy, dx) - rotRad
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Wrap angle into first segment
      angle = ((angle % segAngle) + segAngle) % segAngle

      // Mirror alternate segments
      if (Math.floor((Math.atan2(dy, dx) - rotRad) / segAngle) % 2 !== 0) {
        angle = segAngle - angle
      }

      // Convert back to Cartesian
      const sx = Math.floor(cx + Math.cos(angle + rotRad) * dist)
      const sy = Math.floor(cy + Math.sin(angle + rotRad) * dist)

      if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
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

export const kaleidoscopeCache = createEffectCache<KaleidoscopeSettings>({
  name: 'kaleidoscope',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
