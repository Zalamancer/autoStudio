/**
 * VHS / Retro TV effect: Chromatic aberration → scanlines → tracking distortion.
 * Animated: 8 seed variants cycled per frame.
 */

import type { VHSRetroSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'
import { ANIMATED_VARIANT_COUNT } from '@/types/styleEffects'

export const VHS_RETRO_PRESETS = [
  { label: 'VHS Tape', settings: { chromaticAberration: 4, scanlineOpacity: 0.4, scanlineSpacing: 3, tracking: 8, colorBleed: 0.4, speed: 2 } },
  { label: 'CRT Monitor', settings: { chromaticAberration: 2, scanlineOpacity: 0.5, scanlineSpacing: 2, tracking: 0, colorBleed: 0.2, speed: 3 } },
  { label: 'Mild Retro', settings: { chromaticAberration: 2, scanlineOpacity: 0.15, scanlineSpacing: 4, tracking: 3, colorBleed: 0.15, speed: 3 } },
]

function cacheKey(src: string, s: VHSRetroSettings, seed?: number): string {
  return `vhs|${src}|${s.chromaticAberration}|${s.scanlineOpacity}|${s.scanlineSpacing}|${s.tracking}|${s.colorBleed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: VHSRetroSettings, seed = 0): Promise<string> {
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
  const d = imageData.data
  const out = new Uint8ClampedArray(d)
  const rng = mulberry32(seed * 4919 + 7)

  // Chromatic aberration (horizontal color channel offset)
  const ca = s.chromaticAberration
  if (ca > 0) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4
        const rx = Math.min(w - 1, x + ca)
        const bx = Math.max(0, x - ca)
        out[idx] = d[(y * w + rx) * 4]
        out[idx + 1] = d[idx + 1]
        out[idx + 2] = d[(y * w + bx) * 4 + 2]
        out[idx + 3] = d[idx + 3]
      }
    }
  }

  // Color bleed (horizontal blur)
  if (s.colorBleed > 0) {
    const bleed = Math.ceil(s.colorBleed * 5)
    const temp = new Uint8ClampedArray(out)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4
        if (temp[idx + 3] === 0) continue
        let r = 0, g = 0, b = 0, count = 0
        for (let dx = -bleed; dx <= bleed; dx++) {
          const nx = x + dx
          if (nx < 0 || nx >= w) continue
          const ni = (y * w + nx) * 4
          r += temp[ni]; g += temp[ni + 1]; b += temp[ni + 2]; count++
        }
        out[idx] = r / count
        out[idx + 1] = g / count
        out[idx + 2] = b / count
      }
    }
  }

  // Tracking distortion (horizontal line offsets)
  if (s.tracking > 0) {
    const trackingBands = 3 + Math.floor(rng() * 4)
    for (let band = 0; band < trackingBands; band++) {
      const by = Math.floor(rng() * h)
      const bh = Math.floor(rng() * 8) + 2
      const offset = Math.floor((rng() - 0.5) * s.tracking * 2)
      const temp = new Uint8ClampedArray(out)
      for (let y = by; y < Math.min(h, by + bh); y++) {
        for (let x = 0; x < w; x++) {
          const srcX = Math.max(0, Math.min(w - 1, x + offset))
          const dstIdx = (y * w + x) * 4
          const srcIdx = (y * w + srcX) * 4
          out[dstIdx] = temp[srcIdx]
          out[dstIdx + 1] = temp[srcIdx + 1]
          out[dstIdx + 2] = temp[srcIdx + 2]
        }
      }
    }
  }

  // Scanlines
  if (s.scanlineOpacity > 0) {
    const darken = Math.floor(s.scanlineOpacity * 60)
    for (let y = 0; y < h; y++) {
      if (y % s.scanlineSpacing === 0) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4
          if (out[idx + 3] === 0) continue
          out[idx] = Math.max(0, out[idx] - darken)
          out[idx + 1] = Math.max(0, out[idx + 1] - darken)
          out[idx + 2] = Math.max(0, out[idx + 2] - darken)
        }
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: VHSRetroSettings, seed = 0): boolean {
  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false
  if (output.width !== w) output.width = w
  if (output.height !== h) output.height = h

  const oCtx = output.getContext('2d')!
  oCtx.clearRect(0, 0, w, h)
  oCtx.drawImage(source, 0, 0)

  const imageData = oCtx.getImageData(0, 0, w, h)
  const d = imageData.data
  const out = new Uint8ClampedArray(d)
  const rng = mulberry32(seed * 4919 + 7)

  const ca = s.chromaticAberration
  if (ca > 0) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4
        out[idx] = d[(y * w + Math.min(w-1, x+ca)) * 4]
        out[idx+1] = d[idx+1]
        out[idx+2] = d[(y * w + Math.max(0, x-ca)) * 4 + 2]
        out[idx+3] = d[idx+3]
      }
    }
  }

  if (s.tracking > 0) {
    const trackingBands = 3 + Math.floor(rng() * 4)
    for (let band = 0; band < trackingBands; band++) {
      const by = Math.floor(rng() * h)
      const bh = Math.floor(rng() * 8) + 2
      const offset = Math.floor((rng() - 0.5) * s.tracking * 2)
      const temp = new Uint8ClampedArray(out)
      for (let y = by; y < Math.min(h, by + bh); y++) {
        for (let x = 0; x < w; x++) {
          const srcX = Math.max(0, Math.min(w-1, x + offset))
          const dstIdx = (y * w + x) * 4
          const srcIdx = (y * w + srcX) * 4
          out[dstIdx] = temp[srcIdx]; out[dstIdx+1] = temp[srcIdx+1]; out[dstIdx+2] = temp[srcIdx+2]
        }
      }
    }
  }

  if (s.scanlineOpacity > 0) {
    const darken = Math.floor(s.scanlineOpacity * 60)
    for (let y = 0; y < h; y++) {
      if (y % s.scanlineSpacing === 0) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4
          if (out[idx+3] === 0) continue
          out[idx] = Math.max(0, out[idx]-darken)
          out[idx+1] = Math.max(0, out[idx+1]-darken)
          out[idx+2] = Math.max(0, out[idx+2]-darken)
        }
      }
    }
  }

  const outData = oCtx.createImageData(w, h)
  outData.data.set(out)
  oCtx.putImageData(outData, 0, 0)
  return true
}

export const vhsRetroCache = createEffectCache<VHSRetroSettings>({
  name: 'vhs-retro',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})

export const VHS_SEEDS = Array.from({ length: ANIMATED_VARIANT_COUNT }, (_, i) => i)
