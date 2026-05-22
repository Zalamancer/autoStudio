/**
 * Fire Bend effect: fire trail/burst emanating from edges with heat distortion.
 * Animated: cycles through seed variants per frame.
 */

import type { FireBendSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: FireBendSettings, seed?: number): string {
  return `fire-bend|${src}|${s.intensity}|${s.spread}|${s.colorTemp}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function tempToColor(temp: number): [number, number, number] {
  // Map color temperature (1000-10000K) to RGB
  const t = temp / 1000
  let r = 255, g = 200, b = 50
  if (t < 3) { r = 255; g = Math.floor(100 + t * 30); b = 0 }
  else if (t < 6) { r = 255; g = Math.floor(180 + t * 10); b = Math.floor(t * 15) }
  else { r = Math.floor(200 + t * 5); g = Math.floor(200 + t * 5); b = Math.floor(180 + t * 8) }
  return [Math.min(255, r), Math.min(255, g), Math.min(255, b)]
}

async function process(src: string, s: FireBendSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 5471 + 23)
  const [fr, fg, fb] = tempToColor(s.colorTemp)

  // Detect edges via alpha for fire emanation
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const edges: [number, number][] = []

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] > 128) {
        // Check if near edge (neighbor is transparent)
        const up = d[((y - 1) * w + x) * 4 + 3]
        const down = d[((y + 1) * w + x) * 4 + 3]
        const left = d[(y * w + (x - 1)) * 4 + 3]
        const right = d[(y * w + (x + 1)) * 4 + 3]
        if (up < 64 || down < 64 || left < 64 || right < 64) {
          edges.push([x, y])
        }
      }
    }
  }

  // Draw fire particles from edge points
  const spread = s.spread
  const particleCount = Math.floor(edges.length * s.intensity * 0.5)
  for (let i = 0; i < particleCount && i < 2000; i++) {
    const [ex, ey] = edges[Math.floor(rng() * edges.length)]
    const px = ex + (rng() - 0.5) * spread * 2
    const py = ey - rng() * spread // Fire goes up
    const size = 2 + rng() * 4
    const alpha = 0.3 + rng() * 0.5 * s.intensity

    const grad = ctx.createRadialGradient(px, py, 0, px, py, size)
    grad.addColorStop(0, `rgba(${fr}, ${fg}, ${fb}, ${alpha})`)
    grad.addColorStop(0.6, `rgba(${fr}, ${Math.floor(fg * 0.6)}, 0, ${alpha * 0.5})`)
    grad.addColorStop(1, `rgba(${Math.floor(fr * 0.5)}, 0, 0, 0)`)
    ctx.fillStyle = grad
    ctx.fillRect(px - size, py - size, size * 2, size * 2)
  }

  // Heat distortion on image pixels near edges
  const outData = ctx.getImageData(0, 0, w, h)
  const od = outData.data
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (od[idx + 3] === 0) continue
      // Warm tint
      const warmth = s.intensity * 0.15
      od[idx] = Math.min(255, od[idx] + warmth * 30)
      od[idx + 1] = Math.max(0, od[idx + 1] - warmth * 5)
      od[idx + 2] = Math.max(0, od[idx + 2] - warmth * 15)
    }
  }
  ctx.putImageData(outData, 0, 0)

  return canvas.toDataURL('image/png')
}

export const fireBendCache = createEffectCache<FireBendSettings>({
  name: 'fire-bend',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
