/**
 * Glitch effect: RGB channel split → scanlines → random block displacement.
 * Animated: 8 seed variants cycled per frame.
 */

import type { GlitchSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'
import { ANIMATED_VARIANT_COUNT } from '@/types/styleEffects'

export const GLITCH_PRESETS = [
  { label: 'Mild', settings: { intensity: 3, rgbSplit: 4, scanlineOpacity: 0.1, blockDisplace: 5, speed: 3 } },
  { label: 'Heavy', settings: { intensity: 8, rgbSplit: 15, scanlineOpacity: 0.5, blockDisplace: 25, speed: 1 } },
  { label: 'RGB Split Only', settings: { intensity: 5, rgbSplit: 10, scanlineOpacity: 0, blockDisplace: 0, speed: 2 } },
]

function cacheKey(src: string, s: GlitchSettings, seed?: number): string {
  return `glitch|${src}|${s.intensity}|${s.rgbSplit}|${s.scanlineOpacity}|${s.blockDisplace}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: GlitchSettings, seed = 0): Promise<string> {
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
  const rng = mulberry32(seed * 3571 + 13)

  // RGB channel split
  const split = s.rgbSplit
  if (split > 0) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4
        // Red channel shifted right
        const rx = Math.min(w - 1, x + split)
        const ri = (y * w + rx) * 4
        out[idx] = d[ri]
        // Green stays
        out[idx + 1] = d[idx + 1]
        // Blue channel shifted left
        const bx = Math.max(0, x - split)
        const bi = (y * w + bx) * 4
        out[idx + 2] = d[bi]
        out[idx + 3] = d[idx + 3]
      }
    }
  }

  // Block displacement
  if (s.blockDisplace > 0) {
    const blockCount = Math.floor(s.intensity * 1.5)
    for (let b = 0; b < blockCount; b++) {
      const by = Math.floor(rng() * h)
      const bh = Math.floor(rng() * 20) + 2
      const offset = Math.floor((rng() - 0.5) * s.blockDisplace * 2)
      for (let y = by; y < Math.min(h, by + bh); y++) {
        for (let x = 0; x < w; x++) {
          const srcX = Math.max(0, Math.min(w - 1, x + offset))
          const dstIdx = (y * w + x) * 4
          const srcIdx = (y * w + srcX) * 4
          out[dstIdx] = d[srcIdx]
          out[dstIdx + 1] = d[srcIdx + 1]
          out[dstIdx + 2] = d[srcIdx + 2]
        }
      }
    }
  }

  // Scanlines
  if (s.scanlineOpacity > 0) {
    const darken = Math.floor(s.scanlineOpacity * 80)
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4
        if (out[idx + 3] === 0) continue
        out[idx] = Math.max(0, out[idx] - darken)
        out[idx + 1] = Math.max(0, out[idx + 1] - darken)
        out[idx + 2] = Math.max(0, out[idx + 2] - darken)
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: GlitchSettings, seed = 0): boolean {
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
  const rng = mulberry32(seed * 3571 + 13)

  const split = s.rgbSplit
  if (split > 0) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4
        const rx = Math.min(w - 1, x + split)
        out[idx] = d[(y * w + rx) * 4]
        out[idx + 1] = d[idx + 1]
        const bx = Math.max(0, x - split)
        out[idx + 2] = d[(y * w + bx) * 4 + 2]
        out[idx + 3] = d[idx + 3]
      }
    }
  }

  if (s.blockDisplace > 0) {
    const blockCount = Math.floor(s.intensity * 1.5)
    for (let b = 0; b < blockCount; b++) {
      const by = Math.floor(rng() * h)
      const bh = Math.floor(rng() * 20) + 2
      const offset = Math.floor((rng() - 0.5) * s.blockDisplace * 2)
      for (let y = by; y < Math.min(h, by + bh); y++) {
        for (let x = 0; x < w; x++) {
          const srcX = Math.max(0, Math.min(w - 1, x + offset))
          const dstIdx = (y * w + x) * 4
          const srcIdx = (y * w + srcX) * 4
          out[dstIdx] = d[srcIdx]; out[dstIdx + 1] = d[srcIdx + 1]; out[dstIdx + 2] = d[srcIdx + 2]
        }
      }
    }
  }

  if (s.scanlineOpacity > 0) {
    const darken = Math.floor(s.scanlineOpacity * 80)
    for (let y = 0; y < h; y += 2) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4
        if (out[idx + 3] === 0) continue
        out[idx] = Math.max(0, out[idx] - darken)
        out[idx + 1] = Math.max(0, out[idx + 1] - darken)
        out[idx + 2] = Math.max(0, out[idx + 2] - darken)
      }
    }
  }

  const outData = oCtx.createImageData(w, h)
  outData.data.set(out)
  oCtx.putImageData(outData, 0, 0)
  return true
}

export const glitchCache = createEffectCache<GlitchSettings>({
  name: 'glitch',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})

export const GLITCH_SEEDS = Array.from({ length: ANIMATED_VARIANT_COUNT }, (_, i) => i)
