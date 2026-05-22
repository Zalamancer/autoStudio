/**
 * Impact effect: Radial crack pattern from impact point.
 */

import type { ImpactSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: ImpactSettings, seed?: number): string {
  return `impact|${src}|${s.crackCount}|${s.crackLength}|${s.impactX}|${s.impactY}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: ImpactSettings, seed = 0): Promise<string> {
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
  const rng = mulberry32(seed * 5381 + 59)

  const ix = Math.floor(s.impactX * w)
  const iy = Math.floor(s.impactY * h)

  // Generate crack lines radiating from impact point
  const cracks: { x: number; y: number }[][] = []
  for (let c = 0; c < s.crackCount; c++) {
    const angle = (c / s.crackCount) * Math.PI * 2 + (rng() - 0.5) * 0.5
    const points: { x: number; y: number }[] = [{ x: ix, y: iy }]
    let cx = ix; let cy = iy
    const len = s.crackLength * (0.7 + rng() * 0.6)

    for (let step = 0; step < len; step++) {
      const jitter = (rng() - 0.5) * 0.4
      cx += Math.cos(angle + jitter) * 2
      cy += Math.sin(angle + jitter) * 2
      points.push({ x: Math.floor(cx), y: Math.floor(cy) })

      // Branch cracks
      if (rng() < 0.15 && step > 5) {
        const branchAngle = angle + (rng() - 0.5) * 1.5
        let bx = cx; let by = cy
        const branchLen = Math.floor(len * 0.3 * rng())
        for (let b = 0; b < branchLen; b++) {
          bx += Math.cos(branchAngle + (rng() - 0.5) * 0.3) * 2
          by += Math.sin(branchAngle + (rng() - 0.5) * 0.3) * 2
          points.push({ x: Math.floor(bx), y: Math.floor(by) })
        }
      }
    }
    cracks.push(points)
  }

  // Draw cracks on image
  for (const crack of cracks) {
    for (const p of crack) {
      const crackWidth = 2
      for (let dy = -crackWidth; dy <= crackWidth; dy++) {
        for (let dx = -crackWidth; dx <= crackWidth; dx++) {
          const px = p.x + dx; const py = p.y + dy
          if (px < 0 || px >= w || py < 0 || py >= h) continue
          const ci = (py * w + px) * 4
          if (d[ci + 3] === 0) continue
          const edgeDist = Math.abs(dx) + Math.abs(dy)
          if (edgeDist <= 1) {
            // Dark crack center
            out[ci] = Math.floor(out[ci] * 0.15)
            out[ci + 1] = Math.floor(out[ci + 1] * 0.15)
            out[ci + 2] = Math.floor(out[ci + 2] * 0.15)
          } else {
            // Light crack edge (highlight)
            out[ci] = Math.min(255, out[ci] + 40)
            out[ci + 1] = Math.min(255, out[ci + 1] + 40)
            out[ci + 2] = Math.min(255, out[ci + 2] + 40)
          }
        }
      }
    }
  }

  // Impact point bright flash
  const flashRadius = 8
  for (let dy = -flashRadius; dy <= flashRadius; dy++) {
    for (let dx = -flashRadius; dx <= flashRadius; dx++) {
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > flashRadius) continue
      const px = ix + dx; const py = iy + dy
      if (px < 0 || px >= w || py < 0 || py >= h) continue
      const fi = (py * w + px) * 4
      const fade = 1 - dist / flashRadius
      out[fi] = Math.min(255, out[fi] + Math.floor(200 * fade))
      out[fi + 1] = Math.min(255, out[fi + 1] + Math.floor(200 * fade))
      out[fi + 2] = Math.min(255, out[fi + 2] + Math.floor(200 * fade))
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const impactCache = createEffectCache<ImpactSettings>({
  name: 'impact',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
