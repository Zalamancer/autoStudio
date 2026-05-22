/**
 * Fire Explosion effect: Fiery burst with ember particles.
 */

import type { FireExplosionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: FireExplosionSettings, seed?: number): string {
  return `fire-explosion|${src}|${s.size}|${s.intensity}|${s.emberCount}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: FireExplosionSettings, seed = 0): Promise<string> {
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
  const rng = mulberry32(seed * 9173 + 43)

  const cx = w / 2; const cy = h / 2
  const fireRadius = s.size * Math.min(w, h) * 0.5

  // Fire overlay
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      const dx = x - cx; const dy = y - cy
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist < fireRadius) {
        const falloff = 1 - dist / fireRadius
        const fireFactor = falloff * s.intensity

        // Fire gradient: white core -> yellow -> orange -> red
        if (falloff > 0.7) {
          // White-yellow core
          out[idx] = Math.min(255, d[idx] + Math.floor(255 * fireFactor))
          out[idx + 1] = Math.min(255, d[idx + 1] + Math.floor(220 * fireFactor))
          out[idx + 2] = Math.min(255, d[idx + 2] + Math.floor(100 * fireFactor))
        } else if (falloff > 0.4) {
          // Orange
          out[idx] = Math.min(255, d[idx] + Math.floor(255 * fireFactor))
          out[idx + 1] = Math.min(255, d[idx + 1] + Math.floor(140 * fireFactor))
          out[idx + 2] = Math.max(0, d[idx + 2] - Math.floor(50 * fireFactor))
        } else {
          // Red outer
          out[idx] = Math.min(255, d[idx] + Math.floor(200 * fireFactor))
          out[idx + 1] = Math.max(0, d[idx + 1] - Math.floor(30 * fireFactor))
          out[idx + 2] = Math.max(0, d[idx + 2] - Math.floor(50 * fireFactor))
        }

        // Heat distortion
        const heatX = Math.floor(Math.sin(y * 0.1 + seed) * fireFactor * 5)
        const sx = Math.max(0, Math.min(w - 1, x + heatX))
        const si = (y * w + sx) * 4
        out[idx] = Math.min(255, Math.floor((out[idx] + d[si]) / 2 + 50 * fireFactor))
      }
    }
  }

  // Add ember particles
  for (let e = 0; e < s.emberCount; e++) {
    const angle = rng() * Math.PI * 2
    const dist = rng() * fireRadius * 1.5
    const ex = Math.floor(cx + Math.cos(angle) * dist)
    const ey = Math.floor(cy + Math.sin(angle) * dist)
    const eSize = Math.floor(rng() * 3) + 1

    for (let py = -eSize; py <= eSize; py++) {
      for (let px = -eSize; px <= eSize; px++) {
        if (px * px + py * py > eSize * eSize) continue
        const fx = ex + px; const fy = ey + py
        if (fx < 0 || fx >= w || fy < 0 || fy >= h) continue
        const ei = (fy * w + fx) * 4
        out[ei] = 255
        out[ei + 1] = Math.floor(150 + rng() * 100)
        out[ei + 2] = Math.floor(rng() * 50)
        out[ei + 3] = 255
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const fireExplosionCache = createEffectCache<FireExplosionSettings>({
  name: 'fire-explosion',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
