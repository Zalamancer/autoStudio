/**
 * Chromatic aberration effect — RGB channel separation simulating lens CA.
 */

import type { ChromaticAbSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: ChromaticAbSettings): string {
  return `chromatic-ab|${src}|${s.redShift}|${s.blueShift}|${s.radialFalloff}`
}

function processPixels(
  d: Uint8ClampedArray,
  out: Uint8ClampedArray,
  w: number,
  h: number,
  s: ChromaticAbSettings,
) {
  const redShift = Math.round(s.redShift)
  const blueShift = Math.round(s.blueShift)
  const cx = w / 2
  const cy = h / 2
  const maxDist = Math.sqrt(cx * cx + cy * cy)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4

      let rShift = redShift
      let bShift = blueShift

      // Radial: shift increases towards edges
      if (s.radialFalloff) {
        const dx = x - cx
        const dy = y - cy
        const dist = Math.sqrt(dx * dx + dy * dy) / maxDist
        rShift = Math.round(redShift * dist)
        bShift = Math.round(blueShift * dist)
      }

      // Red channel shifted right
      const rx = Math.min(w - 1, Math.max(0, x + rShift))
      const ri = (y * w + rx) * 4
      out[idx] = d[ri]

      // Green stays
      out[idx + 1] = d[idx + 1]

      // Blue channel shifted left
      const bx = Math.min(w - 1, Math.max(0, x - bShift))
      const bi = (y * w + bx) * 4
      out[idx + 2] = d[bi + 2]

      out[idx + 3] = d[idx + 3]
    }
  }
}

async function process(src: string, s: ChromaticAbSettings): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, w, h)
  const out = new Uint8ClampedArray(imageData.data)
  processPixels(imageData.data, out, w, h, s)

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: ChromaticAbSettings): boolean {
  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false
  if (output.width !== w) output.width = w
  if (output.height !== h) output.height = h

  const oCtx = output.getContext('2d')!
  oCtx.clearRect(0, 0, w, h)
  oCtx.drawImage(source, 0, 0)

  const imageData = oCtx.getImageData(0, 0, w, h)
  const out = new Uint8ClampedArray(imageData.data)
  processPixels(imageData.data, out, w, h, s)

  const outData = oCtx.createImageData(w, h)
  outData.data.set(out)
  oCtx.putImageData(outData, 0, 0)
  return true
}

export const chromaticAbCache = createEffectCache<ChromaticAbSettings>({
  name: 'chromatic-ab',
  maxEntries: 30,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})
