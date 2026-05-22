/**
 * Voxel effect: Grid sample → isometric cube faces + depth shading.
 * Painter's algorithm: back-to-front rendering.
 */

import type { VoxelSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

export const VOXEL_PRESETS = [
  { label: 'Standard', settings: { cubeSize: 10, heightScale: 1.5, topBrightness: 1.0, ambient: 0.2, gridLines: false } },
  { label: 'Tiny Cubes', settings: { cubeSize: 6, heightScale: 1.0, topBrightness: 1.0, ambient: 0.15, gridLines: true } },
  { label: 'Dramatic', settings: { cubeSize: 14, heightScale: 2.5, topBrightness: 1.1, ambient: 0.1, gridLines: false } },
]

function cacheKey(src: string, s: VoxelSettings): string {
  return `voxel|${src}|${s.cubeSize}|${s.heightScale}|${s.topBrightness}|${s.ambient}|${s.gridLines ? 1 : 0}`
}

function colorStr(r: number, g: number, b: number, factor: number, ambient: number): string {
  const nr = Math.max(0, Math.min(255, Math.round(r * factor * (1 - ambient) + r * ambient)))
  const ng = Math.max(0, Math.min(255, Math.round(g * factor * (1 - ambient) + g * ambient)))
  const nb = Math.max(0, Math.min(255, Math.round(b * factor * (1 - ambient) + b * ambient)))
  return `rgb(${nr},${ng},${nb})`
}

async function process(src: string, s: VoxelSettings): Promise<string> {
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

  const cs = s.cubeSize
  const cols = Math.ceil(w / cs)
  const rows = Math.ceil(h / cs)

  // Isometric dimensions
  const isoW = cs  // half-width of diamond
  const isoH = cs / 2  // half-height of diamond

  // Output canvas (larger to accommodate height)
  const maxHeight = s.heightScale * cs
  const outW = w + cs
  const outH = h + Math.ceil(maxHeight) + cs
  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')!

  // Sample grid cells — back-to-front (top-left to bottom-right)
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const sx = col * cs
      const sy = row * cs

      // Average color + brightness in cell
      let r = 0, g = 0, b = 0, count = 0, totalL = 0
      for (let dy = 0; dy < cs && sy + dy < h; dy++) {
        for (let dx = 0; dx < cs && sx + dx < w; dx++) {
          const idx = ((sy + dy) * w + (sx + dx)) * 4
          if (srcData[idx + 3] === 0) continue
          r += srcData[idx]
          g += srcData[idx + 1]
          b += srcData[idx + 2]
          totalL += 0.299 * srcData[idx] + 0.587 * srcData[idx + 1] + 0.114 * srcData[idx + 2]
          count++
        }
      }

      if (count === 0) continue
      r = Math.round(r / count)
      g = Math.round(g / count)
      b = Math.round(b / count)
      const brightness = totalL / count / 255
      const cubeHeight = brightness * s.heightScale * cs

      // Isometric position
      const isoX = sx + cs / 2
      const isoY = sy + cs / 2 - cubeHeight

      // Draw cube: top face, left face, right face
      // Top face
      ctx.fillStyle = colorStr(r, g, b, s.topBrightness, s.ambient)
      ctx.beginPath()
      ctx.moveTo(isoX, isoY - isoH)
      ctx.lineTo(isoX + isoW, isoY)
      ctx.lineTo(isoX, isoY + isoH)
      ctx.lineTo(isoX - isoW, isoY)
      ctx.closePath()
      ctx.fill()
      if (s.gridLines) { ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.5; ctx.stroke() }

      // Left face (darken 20%)
      ctx.fillStyle = colorStr(r, g, b, 0.8, s.ambient)
      ctx.beginPath()
      ctx.moveTo(isoX - isoW, isoY)
      ctx.lineTo(isoX, isoY + isoH)
      ctx.lineTo(isoX, isoY + isoH + cubeHeight)
      ctx.lineTo(isoX - isoW, isoY + cubeHeight)
      ctx.closePath()
      ctx.fill()
      if (s.gridLines) ctx.stroke()

      // Right face (darken 40%)
      ctx.fillStyle = colorStr(r, g, b, 0.6, s.ambient)
      ctx.beginPath()
      ctx.moveTo(isoX + isoW, isoY)
      ctx.lineTo(isoX, isoY + isoH)
      ctx.lineTo(isoX, isoY + isoH + cubeHeight)
      ctx.lineTo(isoX + isoW, isoY + cubeHeight)
      ctx.closePath()
      ctx.fill()
      if (s.gridLines) ctx.stroke()
    }
  }

  // Crop back to original size
  const cropCanvas = document.createElement('canvas')
  cropCanvas.width = w
  cropCanvas.height = h
  const cropCtx = cropCanvas.getContext('2d')!
  cropCtx.drawImage(canvas, 0, 0, w, h, 0, 0, w, h)

  return cropCanvas.toDataURL('image/png')
}

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: VoxelSettings): boolean {
  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false
  if (output.width !== w) output.width = w
  if (output.height !== h) output.height = h

  const sCtx = source.getContext('2d')!
  const srcData = sCtx.getImageData(0, 0, w, h).data

  const oCtx = output.getContext('2d')!
  oCtx.clearRect(0, 0, w, h)

  const cs = s.cubeSize
  const cols = Math.ceil(w / cs)
  const rows = Math.ceil(h / cs)
  const isoW = cs
  const isoH = cs / 2

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const sx = col * cs
      const sy = row * cs
      let r = 0, g = 0, b = 0, count = 0, totalL = 0
      for (let dy = 0; dy < cs && sy + dy < h; dy++) {
        for (let dx = 0; dx < cs && sx + dx < w; dx++) {
          const idx = ((sy + dy) * w + (sx + dx)) * 4
          if (srcData[idx + 3] === 0) continue
          r += srcData[idx]; g += srcData[idx + 1]; b += srcData[idx + 2]
          totalL += 0.299 * srcData[idx] + 0.587 * srcData[idx + 1] + 0.114 * srcData[idx + 2]
          count++
        }
      }
      if (count === 0) continue
      r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count)
      const brightness = totalL / count / 255
      const cubeHeight = brightness * s.heightScale * cs
      const isoX = sx + cs / 2
      const isoY = sy + cs / 2 - cubeHeight

      oCtx.fillStyle = colorStr(r, g, b, s.topBrightness, s.ambient)
      oCtx.beginPath()
      oCtx.moveTo(isoX, isoY - isoH); oCtx.lineTo(isoX + isoW, isoY)
      oCtx.lineTo(isoX, isoY + isoH); oCtx.lineTo(isoX - isoW, isoY)
      oCtx.closePath(); oCtx.fill()

      oCtx.fillStyle = colorStr(r, g, b, 0.8, s.ambient)
      oCtx.beginPath()
      oCtx.moveTo(isoX - isoW, isoY); oCtx.lineTo(isoX, isoY + isoH)
      oCtx.lineTo(isoX, isoY + isoH + cubeHeight); oCtx.lineTo(isoX - isoW, isoY + cubeHeight)
      oCtx.closePath(); oCtx.fill()

      oCtx.fillStyle = colorStr(r, g, b, 0.6, s.ambient)
      oCtx.beginPath()
      oCtx.moveTo(isoX + isoW, isoY); oCtx.lineTo(isoX, isoY + isoH)
      oCtx.lineTo(isoX, isoY + isoH + cubeHeight); oCtx.lineTo(isoX + isoW, isoY + cubeHeight)
      oCtx.closePath(); oCtx.fill()
    }
  }

  return true
}

export const voxelCache = createEffectCache<VoxelSettings>({
  name: 'voxel',
  maxEntries: 30,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})
