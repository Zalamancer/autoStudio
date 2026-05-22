/**
 * Time Warp effect: radial motion blur emanating from a center point.
 * Animated: cycles through seed variants per frame.
 */

import type { TimeWarpSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: TimeWarpSettings, seed?: number): string {
  return `time-warp|${src}|${s.intensity}|${s.centerX}|${s.centerY}|${s.streakLength}|s${seed ?? 0}`
}

async function process(src: string, s: TimeWarpSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const out = new Uint8ClampedArray(d.length)
  out.set(d)

  const cx = s.centerX * w
  const cy = s.centerY * h
  const samples = Math.max(2, Math.ceil(s.streakLength * s.intensity))

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dstIdx = (y * w + x) * 4
      if (d[dstIdx + 3] === 0) continue

      // Direction from center to this pixel
      const dx = x - cx
      const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < 1) continue

      // Blur amount increases with distance from center
      const maxDist = Math.sqrt(w * w + h * h) * 0.5
      const blurFactor = (dist / maxDist) * s.intensity
      const stepSize = blurFactor * s.streakLength / samples

      // Normalize direction
      const ndx = dx / dist
      const ndy = dy / dist

      let r = 0, g = 0, b = 0, a = 0, count = 0
      for (let i = 0; i < samples; i++) {
        const sx = Math.round(x - ndx * stepSize * i)
        const sy = Math.round(y - ndy * stepSize * i)
        if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
          const si = (sy * w + sx) * 4
          r += d[si]
          g += d[si + 1]
          b += d[si + 2]
          a += d[si + 3]
          count++
        }
      }

      if (count > 0) {
        out[dstIdx] = Math.round(r / count)
        out[dstIdx + 1] = Math.round(g / count)
        out[dstIdx + 2] = Math.round(b / count)
        out[dstIdx + 3] = Math.round(a / count)
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const timeWarpCache = createEffectCache<TimeWarpSettings>({
  name: 'time-warp',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
