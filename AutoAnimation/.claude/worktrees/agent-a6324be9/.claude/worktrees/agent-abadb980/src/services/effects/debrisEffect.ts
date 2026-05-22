/**
 * Debris effect: Flying debris particles.
 */

import type { DebrisSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: DebrisSettings, seed?: number): string {
  return `debris|${src}|${s.count}|${s.size}|${s.velocity}|${s.gravity}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: DebrisSettings, seed = 0): Promise<string> {
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
  const rng = mulberry32(seed * 6143 + 53)

  // Generate debris particles from random source positions
  for (let i = 0; i < s.count; i++) {
    const srcX = Math.floor(rng() * w)
    const srcY = Math.floor(rng() * h)
    const si = (srcY * w + srcX) * 4
    if (d[si + 3] === 0) continue

    // Sample color from source
    const pR = d[si]; const pG = d[si + 1]; const pB = d[si + 2]

    // Trajectory: initial velocity + gravity
    const vx = (rng() - 0.5) * s.velocity * 60
    const vy = (rng() - 0.8) * s.velocity * 40
    const grav = s.gravity * 20

    // Draw debris at scattered position
    const destX = Math.floor(srcX + vx + (rng() - 0.5) * 10)
    const destY = Math.floor(srcY + vy + grav)
    const debrisSize = Math.floor(rng() * s.size) + 1
    const rotation = rng() * Math.PI

    for (let dy = -debrisSize; dy <= debrisSize; dy++) {
      for (let dx = -debrisSize; dx <= debrisSize; dx++) {
        // Rotated rectangular debris shape
        const rx = Math.floor(dx * Math.cos(rotation) - dy * Math.sin(rotation))
        const ry = Math.floor(dx * Math.sin(rotation) + dy * Math.cos(rotation))
        const px = destX + rx; const py = destY + ry
        if (px < 0 || px >= w || py < 0 || py >= h) continue
        if (Math.abs(dx) + Math.abs(dy) > debrisSize * 1.2) continue

        const di = (py * w + px) * 4
        // Darken debris slightly for depth
        out[di] = Math.max(0, pR - 20)
        out[di + 1] = Math.max(0, pG - 20)
        out[di + 2] = Math.max(0, pB - 15)
        out[di + 3] = 255
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const debrisCache = createEffectCache<DebrisSettings>({
  name: 'debris',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
