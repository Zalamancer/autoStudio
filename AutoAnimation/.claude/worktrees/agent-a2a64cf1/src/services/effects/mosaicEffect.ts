/**
 * Mosaic / Stained Glass effect: Nearest-seed Voronoi → avg color fill → borders.
 */

import type { MosaicSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

export const MOSAIC_PRESETS = [
  { label: 'Stained Glass', settings: { cellCount: 80, borderWidth: 2, borderColor: '#1a1a1a', seed: 42, colorVariation: 0.15 } },
  { label: 'Fine Mosaic', settings: { cellCount: 300, borderWidth: 1, borderColor: '#555555', seed: 42, colorVariation: 0.05 } },
  { label: 'Abstract', settings: { cellCount: 50, borderWidth: 3, borderColor: '#000000', seed: 42, colorVariation: 0.25 } },
]

function cacheKey(src: string, s: MosaicSettings): string {
  return `mosaic|${src}|${s.cellCount}|${s.borderWidth}|${s.borderColor}|${s.seed}|${s.colorVariation}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: MosaicSettings): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = w
  srcCanvas.height = h
  const srcCtx = srcCanvas.getContext('2d')!
  srcCtx.drawImage(img, 0, 0)
  const srcData = srcCtx.getImageData(0, 0, w, h).data

  // Generate Voronoi seed points
  const rng = mulberry32(s.seed)
  const seeds: { x: number; y: number }[] = []
  for (let i = 0; i < s.cellCount; i++) {
    seeds.push({ x: Math.floor(rng() * w), y: Math.floor(rng() * h) })
  }

  // Assign each pixel to nearest seed (Voronoi tessellation)
  const cellMap = new Int32Array(w * h)
  // Accumulate color per cell
  const cellR = new Float64Array(s.cellCount)
  const cellG = new Float64Array(s.cellCount)
  const cellB = new Float64Array(s.cellCount)
  const cellA = new Float64Array(s.cellCount)
  const cellCount = new Int32Array(s.cellCount)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pi = y * w + x
      const idx = pi * 4

      // Find nearest seed
      let minDist = Infinity
      let nearest = 0
      for (let i = 0; i < seeds.length; i++) {
        const dx = x - seeds[i].x
        const dy = y - seeds[i].y
        const dist = dx * dx + dy * dy
        if (dist < minDist) {
          minDist = dist
          nearest = i
        }
      }
      cellMap[pi] = nearest

      if (srcData[idx + 3] > 0) {
        cellR[nearest] += srcData[idx]
        cellG[nearest] += srcData[idx + 1]
        cellB[nearest] += srcData[idx + 2]
        cellA[nearest] += srcData[idx + 3]
        cellCount[nearest]++
      }
    }
  }

  // Compute average colors
  const avgColors: { r: number; g: number; b: number; a: number }[] = []
  for (let i = 0; i < s.cellCount; i++) {
    if (cellCount[i] > 0) {
      avgColors.push({
        r: Math.round(cellR[i] / cellCount[i]),
        g: Math.round(cellG[i] / cellCount[i]),
        b: Math.round(cellB[i] / cellCount[i]),
        a: Math.round(cellA[i] / cellCount[i]),
      })
    } else {
      avgColors.push({ r: 0, g: 0, b: 0, a: 0 })
    }
  }

  // Apply color variation
  const rng2 = mulberry32(s.seed + 999)
  if (s.colorVariation > 0) {
    for (const c of avgColors) {
      const v = s.colorVariation * 60
      c.r = Math.max(0, Math.min(255, c.r + (rng2() - 0.5) * v))
      c.g = Math.max(0, Math.min(255, c.g + (rng2() - 0.5) * v))
      c.b = Math.max(0, Math.min(255, c.b + (rng2() - 0.5) * v))
    }
  }

  // Render
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const outData = ctx.createImageData(w, h)
  const od = outData.data

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pi = y * w + x
      const idx = pi * 4
      const cell = cellMap[pi]
      const color = avgColors[cell]

      if (color.a === 0) continue

      // Check if pixel is on a cell border
      let isBorder = false
      if (s.borderWidth > 0) {
        for (let dy = -1; dy <= 1 && !isBorder; dy++) {
          for (let dx = -1; dx <= 1 && !isBorder; dx++) {
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
            if (cellMap[ny * w + nx] !== cell) isBorder = true
          }
        }
      }

      if (isBorder && s.borderWidth > 0) {
        const bc = parseInt(s.borderColor.replace('#', ''), 16)
        od[idx] = (bc >> 16) & 255
        od[idx + 1] = (bc >> 8) & 255
        od[idx + 2] = bc & 255
        od[idx + 3] = color.a
      } else {
        od[idx] = color.r
        od[idx + 1] = color.g
        od[idx + 2] = color.b
        od[idx + 3] = color.a
      }
    }
  }

  // Thicken borders if borderWidth > 1
  if (s.borderWidth > 1) {
    const borderCopy = new Uint8ClampedArray(od)
    const bc = parseInt(s.borderColor.replace('#', ''), 16)
    const bR = (bc >> 16) & 255, bG = (bc >> 8) & 255, bB = bc & 255
    const bw = s.borderWidth

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4
        if (borderCopy[idx + 3] === 0) continue
        // Check if this is a border pixel in the initial pass
        const cell = cellMap[y * w + x]
        let wasBorder = false
        for (let dy = -1; dy <= 1 && !wasBorder; dy++) {
          for (let dx = -1; dx <= 1 && !wasBorder; dx++) {
            const nx = x + dx, ny = y + dy
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
            if (cellMap[ny * w + nx] !== cell) wasBorder = true
          }
        }
        if (wasBorder) {
          // Expand border
          for (let ey = -(bw - 1); ey < bw; ey++) {
            for (let ex = -(bw - 1); ex < bw; ex++) {
              const px = x + ex, py = y + ey
              if (px < 0 || px >= w || py < 0 || py >= h) continue
              const ei = (py * w + px) * 4
              if (od[ei + 3] === 0) continue
              od[ei] = bR; od[ei + 1] = bG; od[ei + 2] = bB
            }
          }
        }
      }
    }
  }

  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: MosaicSettings): boolean {
  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false
  if (output.width !== w) output.width = w
  if (output.height !== h) output.height = h

  const sCtx = source.getContext('2d')!
  const srcData = sCtx.getImageData(0, 0, w, h).data

  const rng = mulberry32(s.seed)
  const seeds: { x: number; y: number }[] = []
  for (let i = 0; i < s.cellCount; i++) {
    seeds.push({ x: Math.floor(rng() * w), y: Math.floor(rng() * h) })
  }

  const cellMap = new Int32Array(w * h)
  const cellR = new Float64Array(s.cellCount)
  const cellG = new Float64Array(s.cellCount)
  const cellB = new Float64Array(s.cellCount)
  const cellCount = new Int32Array(s.cellCount)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pi = y * w + x
      let minDist = Infinity, nearest = 0
      for (let i = 0; i < seeds.length; i++) {
        const dx = x - seeds[i].x, dy = y - seeds[i].y
        const dist = dx * dx + dy * dy
        if (dist < minDist) { minDist = dist; nearest = i }
      }
      cellMap[pi] = nearest
      const idx = pi * 4
      if (srcData[idx + 3] > 0) {
        cellR[nearest] += srcData[idx]; cellG[nearest] += srcData[idx + 1]; cellB[nearest] += srcData[idx + 2]
        cellCount[nearest]++
      }
    }
  }

  const oCtx = output.getContext('2d')!
  oCtx.clearRect(0, 0, w, h)
  const outData = oCtx.createImageData(w, h)
  const od = outData.data

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const pi = y * w + x
      const idx = pi * 4
      const cell = cellMap[pi]
      if (cellCount[cell] === 0 || srcData[idx + 3] === 0) continue
      let isBorder = false
      if (s.borderWidth > 0) {
        for (let dy = -1; dy <= 1 && !isBorder; dy++) {
          for (let dx = -1; dx <= 1 && !isBorder; dx++) {
            const nx = x + dx, ny = y + dy
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue
            if (cellMap[ny * w + nx] !== cell) isBorder = true
          }
        }
      }
      if (isBorder) {
        const bc = parseInt(s.borderColor.replace('#', ''), 16)
        od[idx] = (bc >> 16) & 255; od[idx + 1] = (bc >> 8) & 255; od[idx + 2] = bc & 255
      } else {
        od[idx] = Math.round(cellR[cell] / cellCount[cell])
        od[idx + 1] = Math.round(cellG[cell] / cellCount[cell])
        od[idx + 2] = Math.round(cellB[cell] / cellCount[cell])
      }
      od[idx + 3] = srcData[idx + 3]
    }
  }

  oCtx.putImageData(outData, 0, 0)
  return true
}

export const mosaicCache = createEffectCache<MosaicSettings>({
  name: 'mosaic',
  maxEntries: 20,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})
