/**
 * Polygon effect: Low-poly triangulation.
 */

import type { PolygonSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: PolygonSettings, seed?: number): string {
  return `polygon|${src}|${s.complexity}|${s.edgeVisible}|${s.edgeColor}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function parseHex(color: string): [number, number, number] {
  const c = parseInt(color.replace('#', ''), 16)
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255]
}

async function process(src: string, s: PolygonSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const srcData = ctx.getImageData(0, 0, w, h).data
  const rng = mulberry32(seed * 3517 + 67)

  // Generate grid points with jitter for triangulation
  const gridSize = Math.max(4, Math.floor(Math.sqrt(w * h / s.complexity)))
  const points: { x: number; y: number }[] = []

  // Add corners and edge points
  points.push({ x: 0, y: 0 }, { x: w, y: 0 }, { x: 0, y: h }, { x: w, y: h })

  for (let gy = 0; gy <= h; gy += gridSize) {
    for (let gx = 0; gx <= w; gx += gridSize) {
      const jx = gx + (rng() - 0.5) * gridSize * 0.8
      const jy = gy + (rng() - 0.5) * gridSize * 0.8
      points.push({
        x: Math.max(0, Math.min(w, jx)),
        y: Math.max(0, Math.min(h, jy)),
      })
    }
  }

  // Simple approach: use grid cells as quads split into triangles
  ctx.clearRect(0, 0, w, h)
  const [eR, eG, eB] = parseHex(s.edgeColor)

  // For each grid cell, draw triangulated quad with averaged color
  for (let gy = 0; gy < h; gy += gridSize) {
    for (let gx = 0; gx < w; gx += gridSize) {
      const x1 = gx; const y1 = gy
      const x2 = Math.min(w, gx + gridSize); const y2 = Math.min(h, gy + gridSize)

      // Sample average color from center of cell
      const cx = Math.min(w - 1, Math.floor((x1 + x2) / 2))
      const cy = Math.min(h - 1, Math.floor((y1 + y2) / 2))
      const ci = (cy * w + cx) * 4

      if (srcData[ci + 3] === 0) continue

      const r = srcData[ci]; const g = srcData[ci + 1]; const b = srcData[ci + 2]

      // Draw two triangles for this cell
      ctx.fillStyle = `rgb(${r},${g},${b})`
      ctx.beginPath()
      ctx.moveTo(x1, y1); ctx.lineTo(x2, y1); ctx.lineTo(x1, y2)
      ctx.closePath(); ctx.fill()

      // Second triangle with slightly different shade
      const shade = 0.95 + rng() * 0.1
      ctx.fillStyle = `rgb(${Math.floor(r * shade)},${Math.floor(g * shade)},${Math.floor(b * shade)})`
      ctx.beginPath()
      ctx.moveTo(x2, y1); ctx.lineTo(x2, y2); ctx.lineTo(x1, y2)
      ctx.closePath(); ctx.fill()

      // Draw edges if visible
      if (s.edgeVisible) {
        ctx.strokeStyle = `rgb(${eR},${eG},${eB})`
        ctx.lineWidth = 0.5
        ctx.beginPath()
        ctx.moveTo(x1, y1); ctx.lineTo(x2, y1); ctx.lineTo(x1, y2)
        ctx.closePath(); ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(x2, y1); ctx.lineTo(x2, y2); ctx.lineTo(x1, y2)
        ctx.closePath(); ctx.stroke()
      }
    }
  }

  return canvas.toDataURL('image/png')
}

export const polygonCache = createEffectCache<PolygonSettings>({
  name: 'polygon',
  maxEntries: 30,
  cacheKeyFn: cacheKey,
  processFn: process,
})
