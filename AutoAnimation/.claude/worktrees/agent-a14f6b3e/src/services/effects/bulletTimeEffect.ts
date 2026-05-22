/**
 * Bullet Time effect: Radial zoom with time-freeze radial blur.
 */

import type { BulletTimeSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: BulletTimeSettings, seed?: number): string {
  return `bullet-time|${src}|${s.intensity}|${s.focusX}|${s.focusY}|${s.streaks}|s${seed ?? 0}`
}

async function process(src: string, s: BulletTimeSettings, _seed = 0): Promise<string> {
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

  const fx = s.focusX * w
  const fy = s.focusY * h
  const intensity = s.intensity
  const streakCount = s.streaks

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      const dx = x - fx; const dy = y - fy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxDist = Math.sqrt(w * w + h * h) * 0.5
      const normalizedDist = dist / maxDist

      // Focus area stays sharp, outer gets radial blur
      if (normalizedDist < 0.15) {
        // Sharp focus center
        continue
      }

      // Radial zoom blur
      const blurStrength = normalizedDist * intensity
      const samples = Math.min(Math.floor(streakCount * blurStrength), 15)

      if (samples > 0) {
        let rSum = d[idx], gSum = d[idx + 1], bSum = d[idx + 2]
        let count = 1

        for (let s2 = 1; s2 <= samples; s2++) {
          const t = (s2 / samples) * blurStrength * 0.1
          const bx = Math.max(0, Math.min(w - 1, Math.floor(fx + (x - fx) * (1 + t))))
          const by = Math.max(0, Math.min(h - 1, Math.floor(fy + (y - fy) * (1 + t))))
          const bi = (by * w + bx) * 4
          rSum += d[bi]; gSum += d[bi + 1]; bSum += d[bi + 2]
          count++
        }

        out[idx] = Math.floor(rSum / count)
        out[idx + 1] = Math.floor(gSum / count)
        out[idx + 2] = Math.floor(bSum / count)
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const bulletTimeCache = createEffectCache<BulletTimeSettings>({
  name: 'bullet-time',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
