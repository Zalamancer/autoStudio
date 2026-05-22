/**
 * Crystallize effect: Voronoi crystal pattern transformation.
 */

import type { CrystallizeSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: CrystallizeSettings, seed?: number): string {
  return `crystallize|${src}|${s.cellSize}|${s.edgeBrightness}|${s.refractionIndex}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: CrystallizeSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const srcData = ctx.getImageData(0, 0, w, h).data
  const rng = mulberry32(seed * 5471 + 19)

  // Generate Voronoi seeds on grid with jitter
  const cellSize = s.cellSize
  const seeds: { x: number; y: number }[] = []
  for (let gy = 0; gy < h + cellSize; gy += cellSize) {
    for (let gx = 0; gx < w + cellSize; gx += cellSize) {
      seeds.push({
        x: Math.floor(gx + (rng() - 0.5) * cellSize * 0.8),
        y: Math.floor(gy + (rng() - 0.5) * cellSize * 0.8),
      })
    }
  }

  // Assign pixels to cells and accumulate colors
  const cellMap = new Int32Array(w * h)
  const cellR = new Float64Array(seeds.length)
  const cellG = new Float64Array(seeds.length)
  const cellB = new Float64Array(seeds.length)
  const cellA = new Float64Array(seeds.length)
  const cellCount = new Int32Array(seeds.length)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pi = y * w + x
      const idx = pi * 4
      let minDist = Infinity; let nearest = 0
      for (let i = 0; i < seeds.length; i++) {
        const dx = x - seeds[i].x; const dy = y - seeds[i].y
        const dist = dx * dx + dy * dy
        if (dist < minDist) { minDist = dist; nearest = i }
      }
      cellMap[pi] = nearest
      if (srcData[idx + 3] > 0) {
        // Refraction offset
        const refractX = Math.max(0, Math.min(w - 1, x + Math.floor((x - seeds[nearest].x) * s.refractionIndex * 0.3)))
        const refractY = Math.max(0, Math.min(h - 1, y + Math.floor((y - seeds[nearest].y) * s.refractionIndex * 0.3)))
        const ri = (refractY * w + refractX) * 4
        cellR[nearest] += srcData[ri]; cellG[nearest] += srcData[ri + 1]
        cellB[nearest] += srcData[ri + 2]; cellA[nearest] += srcData[idx + 3]
        cellCount[nearest]++
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  const od = outData.data

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pi = y * w + x
      const idx = pi * 4
      const cell = cellMap[pi]
      if (cellCount[cell] === 0 || srcData[idx + 3] === 0) continue

      // Check if on edge
      let isEdge = false
      for (let dy = -1; dy <= 1 && !isEdge; dy++) {
        for (let dx = -1; dx <= 1 && !isEdge; dx++) {
          const nx = x + dx; const ny = y + dy
          if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
          if (cellMap[ny * w + nx] !== cell) isEdge = true
        }
      }

      if (isEdge) {
        const bright = Math.floor(200 + s.edgeBrightness * 55)
        od[idx] = bright; od[idx + 1] = bright; od[idx + 2] = Math.min(255, bright + 20)
      } else {
        od[idx] = Math.round(cellR[cell] / cellCount[cell])
        od[idx + 1] = Math.round(cellG[cell] / cellCount[cell])
        od[idx + 2] = Math.round(cellB[cell] / cellCount[cell])
      }
      od[idx + 3] = Math.round(cellA[cell] / cellCount[cell])
    }
  }

  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const crystallizeCache = createEffectCache<CrystallizeSettings>({
  name: 'crystallize',
  maxEntries: 30,
  cacheKeyFn: cacheKey,
  processFn: process,
})
