/**
 * Pop Art effect: posterized colors with halftone dots and optional outlines.
 */

import type { PopArtSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: PopArtSettings, seed?: number): string {
  return `pop-art|${src}|${s.dotSize}|${s.colorCount}|${s.posterize}|${s.outline}|s${seed ?? 0}`
}

async function process(src: string, s: PopArtSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data

  // Posterize
  if (s.posterize) {
    const levels = s.colorCount
    const step = 256 / levels
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue
      d[i] = Math.floor(d[i] / step) * step + step * 0.5
      d[i + 1] = Math.floor(d[i + 1] / step) * step + step * 0.5
      d[i + 2] = Math.floor(d[i + 2] / step) * step + step * 0.5
    }
  }

  // Increase saturation
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    const avg = (d[i] + d[i + 1] + d[i + 2]) / 3
    d[i] = Math.min(255, d[i] + (d[i] - avg) * 0.5)
    d[i + 1] = Math.min(255, d[i + 1] + (d[i + 1] - avg) * 0.5)
    d[i + 2] = Math.min(255, d[i + 2] + (d[i + 2] - avg) * 0.5)
  }

  ctx.putImageData(imageData, 0, 0)

  // Halftone dots
  if (s.dotSize > 0) {
    const dotCanvas = document.createElement('canvas')
    dotCanvas.width = w; dotCanvas.height = h
    const dCtx = dotCanvas.getContext('2d')!
    dCtx.fillStyle = '#FFFFFF'
    dCtx.fillRect(0, 0, w, h)

    const srcData = ctx.getImageData(0, 0, w, h).data
    for (let y = 0; y < h; y += s.dotSize) {
      for (let x = 0; x < w; x += s.dotSize) {
        const idx = (y * w + x) * 4
        const brightness = (srcData[idx] + srcData[idx + 1] + srcData[idx + 2]) / 3
        const r = (1 - brightness / 255) * s.dotSize * 0.5

        dCtx.fillStyle = `rgb(${srcData[idx]},${srcData[idx + 1]},${srcData[idx + 2]})`
        dCtx.beginPath()
        dCtx.arc(x + s.dotSize * 0.5, y + s.dotSize * 0.5, Math.max(0.5, r), 0, Math.PI * 2)
        dCtx.fill()
      }
    }

    ctx.globalAlpha = 0.6
    ctx.drawImage(dotCanvas, 0, 0)
    ctx.globalAlpha = 1
  }

  // Bold outline
  if (s.outline) {
    const edgeData = ctx.getImageData(0, 0, w, h)
    const ed = edgeData.data
    const out = new Uint8ClampedArray(ed)

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4
        const l = (y * w + x - 1) * 4
        const r = (y * w + x + 1) * 4
        const u = ((y - 1) * w + x) * 4
        const dn = ((y + 1) * w + x) * 4

        const gx = Math.abs(ed[r] - ed[l]) + Math.abs(ed[r + 1] - ed[l + 1]) + Math.abs(ed[r + 2] - ed[l + 2])
        const gy = Math.abs(ed[dn] - ed[u]) + Math.abs(ed[dn + 1] - ed[u + 1]) + Math.abs(ed[dn + 2] - ed[u + 2])
        const mag = gx + gy

        if (mag > 100) {
          out[idx] = 0; out[idx + 1] = 0; out[idx + 2] = 0
        }
      }
    }

    const outData = ctx.createImageData(w, h)
    outData.data.set(out)
    ctx.putImageData(outData, 0, 0)
  }

  return canvas.toDataURL('image/png')
}

export const popArtCache = createEffectCache<PopArtSettings>({
  name: 'pop-art',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
