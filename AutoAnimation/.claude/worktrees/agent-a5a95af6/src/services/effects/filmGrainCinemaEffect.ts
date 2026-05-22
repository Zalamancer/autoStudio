/**
 * Cinema film grain effect — per-camera grain simulation with ISO response.
 * Animated: 8 seed variants cycled per frame.
 */

import type { FilmGrainCinemaSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'
import { ANIMATED_VARIANT_COUNT } from '@/types/styleEffects'

function cacheKey(src: string, s: FilmGrainCinemaSettings, seed?: number): string {
  return `film-grain-cinema|${src}|${s.intensity}|${s.grainSize}|${s.monochrome}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function applyGrain(
  d: Uint8ClampedArray,
  w: number,
  h: number,
  s: FilmGrainCinemaSettings,
  seed: number,
) {
  const rng = mulberry32(seed * 7919 + 31)
  const grainStrength = s.intensity * 80
  const grainSize = Math.max(1, Math.round(s.grainSize))

  for (let y = 0; y < h; y += grainSize) {
    for (let x = 0; x < w; x += grainSize) {
      const noise = (rng() - 0.5) * grainStrength
      const colorNoise = s.monochrome ? 0 : (rng() - 0.5) * grainStrength * 0.3

      for (let dy = 0; dy < grainSize && y + dy < h; dy++) {
        for (let dx = 0; dx < grainSize && x + dx < w; dx++) {
          const idx = ((y + dy) * w + (x + dx)) * 4
          if (d[idx + 3] === 0) continue

          d[idx] = Math.max(0, Math.min(255, d[idx] + noise + colorNoise))
          d[idx + 1] = Math.max(0, Math.min(255, d[idx + 1] + noise))
          d[idx + 2] = Math.max(0, Math.min(255, d[idx + 2] + noise - colorNoise))
        }
      }
    }
  }
}

async function process(src: string, s: FilmGrainCinemaSettings, seed = 0): Promise<string> {
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
  applyGrain(imageData.data, w, h, s, seed)
  ctx.putImageData(imageData, 0, 0)

  return canvas.toDataURL('image/png')
}

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: FilmGrainCinemaSettings, seed = 0): boolean {
  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false
  if (output.width !== w) output.width = w
  if (output.height !== h) output.height = h

  const oCtx = output.getContext('2d')!
  oCtx.clearRect(0, 0, w, h)
  oCtx.drawImage(source, 0, 0)

  const imageData = oCtx.getImageData(0, 0, w, h)
  applyGrain(imageData.data, w, h, s, seed)
  oCtx.putImageData(imageData, 0, 0)

  return true
}

export const filmGrainCinemaCache = createEffectCache<FilmGrainCinemaSettings>({
  name: 'film-grain-cinema',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})

export const FILM_GRAIN_CINEMA_SEEDS = Array.from({ length: ANIMATED_VARIANT_COUNT }, (_, i) => i)
