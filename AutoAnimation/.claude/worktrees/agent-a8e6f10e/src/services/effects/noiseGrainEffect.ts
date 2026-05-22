/**
 * Noise Grain effect: Pre-generate grain texture → overlay composite.
 * Animated: 8 seed variants cycled per frame.
 *
 * Optimized: no getImageData per frame. Instead, pre-generates 8 grain
 * texture canvases (one per seed variant) using fillRect per grain block,
 * then composites via canvas blend modes ('overlay' + globalAlpha).
 */

import type { NoiseGrainSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'
import { ANIMATED_VARIANT_COUNT } from '@/types/styleEffects'

export const NOISE_GRAIN_PRESETS = [
  { label: 'Subtle Film', settings: { intensity: 0.15, grainSize: 1, monochrome: true, speed: 2 } },
  { label: 'Heavy Grain', settings: { intensity: 0.5, grainSize: 2, monochrome: true, speed: 1 } },
  { label: 'Color Noise', settings: { intensity: 0.3, grainSize: 1, monochrome: false, speed: 2 } },
]

function cacheKey(src: string, s: NoiseGrainSettings, seed?: number): string {
  return `noise|${src}|${s.intensity}|${s.grainSize}|${s.monochrome ? 1 : 0}|s${seed ?? 0}`
}

// ---------------------------------------------------------------------------
// Seeded PRNG — simple LCG for deterministic grain patterns
// ---------------------------------------------------------------------------

function lcg(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ---------------------------------------------------------------------------
// Pre-generated grain texture cache (module-level, 8 canvases per config)
// ---------------------------------------------------------------------------

let grainTextures: HTMLCanvasElement[] = []
let grainCacheKey = ''

/**
 * Build the cache key for grain textures based on dimensions + settings.
 * Intensity is NOT part of the key — it's applied via globalAlpha at composite time.
 */
function grainTextureCacheKey(w: number, h: number, s: NoiseGrainSettings): string {
  return `${w}|${h}|${s.grainSize}|${s.monochrome ? 1 : 0}`
}

/**
 * Pre-generate 8 grain texture canvases (one per seed variant).
 * Each texture is filled with mid-gray (#808080) noise blocks so that
 * canvas 'overlay' blend mode both lightens and darkens the source.
 *
 * Uses fillRect per grain block — zero getImageData calls.
 */
function ensureGrainTextures(w: number, h: number, s: NoiseGrainSettings): void {
  const key = grainTextureCacheKey(w, h, s)
  if (key === grainCacheKey && grainTextures.length === ANIMATED_VARIANT_COUNT) return

  grainTextures = []
  const grainSize = Math.max(1, s.grainSize)

  for (let variant = 0; variant < ANIMATED_VARIANT_COUNT; variant++) {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    const ctx = c.getContext('2d')!

    // Start with mid-gray base (neutral for overlay blend)
    ctx.fillStyle = '#808080'
    ctx.fillRect(0, 0, w, h)

    // Seed each variant deterministically
    const rng = lcg(variant * 7919 + 1)

    for (let y = 0; y < h; y += grainSize) {
      for (let x = 0; x < w; x += grainSize) {
        if (s.monochrome) {
          const v = Math.floor(rng() * 256)
          ctx.fillStyle = `rgb(${v},${v},${v})`
        } else {
          const r = Math.floor(rng() * 256)
          const g = Math.floor(rng() * 256)
          const b = Math.floor(rng() * 256)
          ctx.fillStyle = `rgb(${r},${g},${b})`
        }
        ctx.fillRect(x, y, grainSize, grainSize)
      }
    }

    grainTextures.push(c)
  }

  grainCacheKey = key
}

// ---------------------------------------------------------------------------
// Async process function (for data-URL cache pipeline)
// ---------------------------------------------------------------------------

async function process(src: string, s: NoiseGrainSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  ensureGrainTextures(w, h, s)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // a. Draw source image
  ctx.drawImage(img, 0, 0)

  // b–d. Overlay grain texture with blend mode + intensity
  const variant = ((seed % ANIMATED_VARIANT_COUNT) + ANIMATED_VARIANT_COUNT) % ANIMATED_VARIANT_COUNT
  ctx.globalAlpha = s.intensity
  ctx.globalCompositeOperation = 'overlay'
  ctx.drawImage(grainTextures[variant], 0, 0)

  // e. Reset composite state
  ctx.globalAlpha = 1.0
  ctx.globalCompositeOperation = 'source-over'

  // f–g. Clip to source alpha (preserve transparency)
  ctx.globalCompositeOperation = 'destination-in'
  ctx.drawImage(img, 0, 0)
  ctx.globalCompositeOperation = 'source-over'

  return canvas.toDataURL('image/png')
}

// ---------------------------------------------------------------------------
// Synchronous overlay function (for real-time rigged/canvas pipeline)
// Zero getImageData — uses pre-generated grain textures + canvas blend modes.
// ---------------------------------------------------------------------------

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: NoiseGrainSettings, seed = 0): boolean {
  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false
  if (output.width !== w) output.width = w
  if (output.height !== h) output.height = h

  ensureGrainTextures(w, h, s)

  const oCtx = output.getContext('2d')!
  oCtx.clearRect(0, 0, w, h)

  // a. Draw source as-is
  oCtx.drawImage(source, 0, 0)

  // b–d. Overlay grain texture with blend mode + intensity
  const variant = ((seed % ANIMATED_VARIANT_COUNT) + ANIMATED_VARIANT_COUNT) % ANIMATED_VARIANT_COUNT
  oCtx.globalAlpha = s.intensity
  oCtx.globalCompositeOperation = 'overlay'
  oCtx.drawImage(grainTextures[variant], 0, 0)

  // e. Reset composite state
  oCtx.globalAlpha = 1.0
  oCtx.globalCompositeOperation = 'source-over'

  // f–g. Clip to source alpha (preserve original transparency)
  oCtx.globalCompositeOperation = 'destination-in'
  oCtx.drawImage(source, 0, 0)
  oCtx.globalCompositeOperation = 'source-over'

  return true
}

export const noiseGrainCache = createEffectCache<NoiseGrainSettings>({
  name: 'noise-grain',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})

/** Seeds array for animated pre-caching */
export const NOISE_GRAIN_SEEDS = Array.from({ length: ANIMATED_VARIANT_COUNT }, (_, i) => i)
