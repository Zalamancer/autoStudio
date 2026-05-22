/**
 * Neon Outline effect: Sobel edge detection → fill edges with glow color →
 * draw with shadowBlur + 'screen' composite.
 */

import type { NeonOutlineSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

export const NEON_OUTLINE_PRESETS = [
  { label: 'Cyan', settings: { glowColor: '#00ffff', glowRadius: 10, glowIntensity: 1.5, edgeThreshold: 30, backgroundDarken: 0.7 } },
  { label: 'Hot Pink', settings: { glowColor: '#ff00ff', glowRadius: 12, glowIntensity: 2.0, edgeThreshold: 25, backgroundDarken: 0.8 } },
  { label: 'Subtle', settings: { glowColor: '#00ff88', glowRadius: 6, glowIntensity: 1.0, edgeThreshold: 40, backgroundDarken: 0.3 } },
]

function cacheKey(src: string, s: NeonOutlineSettings): string {
  return `neon|${src}|${s.glowColor}|${s.glowRadius}|${s.glowIntensity}|${s.edgeThreshold}|${s.backgroundDarken}`
}

async function process(src: string, s: NeonOutlineSettings): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  // Draw original
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const sourceData = ctx.getImageData(0, 0, w, h)
  const sd = sourceData.data

  // Build grayscale + edge mask
  const gray = new Float32Array(w * h)
  for (let i = 0; i < gray.length; i++) {
    const idx = i * 4
    gray[i] = sd[idx + 3] === 0 ? 0 : 0.299 * sd[idx] + 0.587 * sd[idx + 1] + 0.114 * sd[idx + 2]
  }

  // Sobel
  const edges = new Uint8ClampedArray(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const gx =
        -gray[(y - 1) * w + x - 1] + gray[(y - 1) * w + x + 1] +
        -2 * gray[y * w + x - 1] + 2 * gray[y * w + x + 1] +
        -gray[(y + 1) * w + x - 1] + gray[(y + 1) * w + x + 1]
      const gy =
        -gray[(y - 1) * w + x - 1] - 2 * gray[(y - 1) * w + x] - gray[(y - 1) * w + x + 1] +
        gray[(y + 1) * w + x - 1] + 2 * gray[(y + 1) * w + x] + gray[(y + 1) * w + x + 1]
      const mag = Math.sqrt(gx * gx + gy * gy)
      edges[i] = mag > s.edgeThreshold ? 255 : 0
    }
  }

  // Create edge-only canvas
  const edgeCanvas = document.createElement('canvas')
  edgeCanvas.width = w
  edgeCanvas.height = h
  const eCtx = edgeCanvas.getContext('2d')!
  const edgeData = eCtx.createImageData(w, h)
  const ed = edgeData.data
  const gc = parseInt(s.glowColor.replace('#', ''), 16)
  const gR = (gc >> 16) & 255
  const gG = (gc >> 8) & 255
  const gB = gc & 255

  for (let i = 0; i < edges.length; i++) {
    if (edges[i] > 0 && sd[i * 4 + 3] > 0) {
      ed[i * 4] = gR
      ed[i * 4 + 1] = gG
      ed[i * 4 + 2] = gB
      ed[i * 4 + 3] = 255
    }
  }
  eCtx.putImageData(edgeData, 0, 0)

  // Darken original
  if (s.backgroundDarken > 0) {
    ctx.fillStyle = `rgba(0,0,0,${s.backgroundDarken})`
    ctx.globalCompositeOperation = 'source-atop'
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }

  // Draw edges with glow
  ctx.globalCompositeOperation = 'screen'
  ctx.shadowColor = s.glowColor
  ctx.shadowBlur = s.glowRadius * s.glowIntensity
  // Draw multiple times for stronger glow
  for (let pass = 0; pass < Math.ceil(s.glowIntensity); pass++) {
    ctx.drawImage(edgeCanvas, 0, 0)
  }
  ctx.globalCompositeOperation = 'source-over'
  ctx.shadowBlur = 0

  return canvas.toDataURL('image/png')
}

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: NeonOutlineSettings): boolean {
  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false
  if (output.width !== w) output.width = w
  if (output.height !== h) output.height = h

  const oCtx = output.getContext('2d')!
  oCtx.clearRect(0, 0, w, h)
  oCtx.drawImage(source, 0, 0)

  const sourceData = oCtx.getImageData(0, 0, w, h)
  const sd = sourceData.data

  const gray = new Float32Array(w * h)
  for (let i = 0; i < gray.length; i++) {
    const idx = i * 4
    gray[i] = sd[idx + 3] === 0 ? 0 : 0.299 * sd[idx] + 0.587 * sd[idx + 1] + 0.114 * sd[idx + 2]
  }

  const edges = new Uint8ClampedArray(w * h)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const gx = -gray[(y-1)*w+x-1] + gray[(y-1)*w+x+1] - 2*gray[y*w+x-1] + 2*gray[y*w+x+1] - gray[(y+1)*w+x-1] + gray[(y+1)*w+x+1]
      const gy = -gray[(y-1)*w+x-1] - 2*gray[(y-1)*w+x] - gray[(y-1)*w+x+1] + gray[(y+1)*w+x-1] + 2*gray[(y+1)*w+x] + gray[(y+1)*w+x+1]
      edges[i] = Math.sqrt(gx*gx + gy*gy) > s.edgeThreshold ? 255 : 0
    }
  }

  const edgeCanvas = document.createElement('canvas')
  edgeCanvas.width = w
  edgeCanvas.height = h
  const eCtx = edgeCanvas.getContext('2d')!
  const edgeData = eCtx.createImageData(w, h)
  const ed = edgeData.data
  const gc = parseInt(s.glowColor.replace('#', ''), 16)
  const gR = (gc >> 16) & 255, gG = (gc >> 8) & 255, gB = gc & 255
  for (let i = 0; i < edges.length; i++) {
    if (edges[i] > 0 && sd[i*4+3] > 0) {
      ed[i*4] = gR; ed[i*4+1] = gG; ed[i*4+2] = gB; ed[i*4+3] = 255
    }
  }
  eCtx.putImageData(edgeData, 0, 0)

  if (s.backgroundDarken > 0) {
    oCtx.fillStyle = `rgba(0,0,0,${s.backgroundDarken})`
    oCtx.globalCompositeOperation = 'source-atop'
    oCtx.fillRect(0, 0, w, h)
    oCtx.globalCompositeOperation = 'source-over'
  }

  oCtx.globalCompositeOperation = 'screen'
  oCtx.shadowColor = s.glowColor
  oCtx.shadowBlur = s.glowRadius * s.glowIntensity
  for (let pass = 0; pass < Math.ceil(s.glowIntensity); pass++) {
    oCtx.drawImage(edgeCanvas, 0, 0)
  }
  oCtx.globalCompositeOperation = 'source-over'
  oCtx.shadowBlur = 0
  return true
}

export const neonOutlineCache = createEffectCache<NeonOutlineSettings>({
  name: 'neon-outline',
  maxEntries: 30,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})
