/**
 * Explosion Ring effect: Expanding ring shockwave.
 */

import type { ExplosionRingSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: ExplosionRingSettings, seed?: number): string {
  return `explosion-ring|${src}|${s.radius}|${s.thickness}|${s.color}|${s.speed}|s${seed ?? 0}`
}

function parseHex(color: string): [number, number, number] {
  const c = parseInt(color.replace('#', ''), 16)
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255]
}

async function process(src: string, s: ExplosionRingSettings, _seed = 0): Promise<string> {
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
  const [rR, rG, rB] = parseHex(s.color)

  const cx = w / 2; const cy = h / 2
  const maxDist = Math.sqrt(cx * cx + cy * cy)
  const ringRadius = s.radius * maxDist
  const ringThickness = s.thickness

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      const dx = x - cx; const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      // Distance from ring center
      const ringDist = Math.abs(dist - ringRadius)

      if (ringDist < ringThickness) {
        // Inside the ring - apply color and distortion
        const ringFade = 1 - ringDist / ringThickness
        const glow = ringFade * ringFade

        // Push pixels outward from ring
        const pushDist = glow * 10
        const angle = Math.atan2(dy, dx)
        const sx = Math.max(0, Math.min(w - 1, Math.floor(x - Math.cos(angle) * pushDist)))
        const sy = Math.max(0, Math.min(h - 1, Math.floor(y - Math.sin(angle) * pushDist)))
        const si = (sy * w + sx) * 4

        out[idx] = Math.min(255, Math.floor(d[si] * (1 - glow * 0.7) + rR * glow * 0.7))
        out[idx + 1] = Math.min(255, Math.floor(d[si + 1] * (1 - glow * 0.7) + rG * glow * 0.7))
        out[idx + 2] = Math.min(255, Math.floor(d[si + 2] * (1 - glow * 0.7) + rB * glow * 0.7))

        // White-hot core
        if (ringDist < ringThickness * 0.2) {
          const coreFade = 1 - ringDist / (ringThickness * 0.2)
          out[idx] = Math.min(255, out[idx] + Math.floor(200 * coreFade))
          out[idx + 1] = Math.min(255, out[idx + 1] + Math.floor(200 * coreFade))
          out[idx + 2] = Math.min(255, out[idx + 2] + Math.floor(200 * coreFade))
        }
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const explosionRingCache = createEffectCache<ExplosionRingSettings>({
  name: 'explosion-ring',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
