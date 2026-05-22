/**
 * Wind effect: wind streak lines across image.
 * Animated: cycles through seed variants per frame.
 */

import type { WindSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: WindSettings, seed?: number): string {
  return `wind|${src}|${s.speed}|${s.angle}|${s.streakLength}|${s.opacity}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: WindSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 7331 + 19)
  const angleRad = (s.angle * Math.PI) / 180
  const cosA = Math.cos(angleRad)
  const sinA = Math.sin(angleRad)

  // Draw wind streaks
  const streakCount = Math.floor(30 + s.speed * 100)
  ctx.lineCap = 'round'

  for (let i = 0; i < streakCount; i++) {
    const px = rng() * w
    const py = rng() * h
    const len = s.streakLength * (0.5 + rng())
    const alpha = s.opacity * (0.05 + rng() * 0.2)
    const lineW = 0.5 + rng() * 1.5

    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.lineWidth = lineW
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px + cosA * len, py + sinA * len)
    ctx.stroke()
  }

  // Slight directional blur effect via pixel shift
  if (s.speed > 0.3) {
    const imageData = ctx.getImageData(0, 0, w, h)
    const d = imageData.data
    const out = new Uint8ClampedArray(d.length)
    out.set(d)
    const blurDist = Math.floor(s.speed * 3)

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4
        if (d[idx + 3] === 0) continue
        const sx = Math.max(0, Math.min(w - 1, x + Math.round(cosA * blurDist)))
        const sy = Math.max(0, Math.min(h - 1, y + Math.round(sinA * blurDist)))
        const si = (sy * w + sx) * 4
        // Blend original with shifted
        out[idx] = Math.round(d[idx] * 0.7 + d[si] * 0.3)
        out[idx + 1] = Math.round(d[idx + 1] * 0.7 + d[si + 1] * 0.3)
        out[idx + 2] = Math.round(d[idx + 2] * 0.7 + d[si + 2] * 0.3)
      }
    }

    const outData = ctx.createImageData(w, h)
    outData.data.set(out)
    ctx.putImageData(outData, 0, 0)
  }

  return canvas.toDataURL('image/png')
}

export const windCache = createEffectCache<WindSettings>({
  name: 'wind',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
