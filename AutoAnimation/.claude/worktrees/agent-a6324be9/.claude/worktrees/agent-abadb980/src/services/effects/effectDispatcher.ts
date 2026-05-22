/**
 * Effect dispatcher — routes cache/process/overlay calls to the correct
 * effect based on type string. Canvas components import only this module
 * instead of all 13 effect services.
 */

import type { StyleEffectType, ActiveStyleEffect } from '@/types/styleEffects'
import { isAnimatedEffect, ANIMATED_VARIANT_COUNT } from '@/types/styleEffects'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySettings = any
import type { PixelArtEffectSettings } from '@/types/pixelArtEffect'

// Pixel art (existing)
import {
  getPixelatedFromCache,
  pixelateImageSrc,
  preCachePixelArt,
  clearPixelArtCache,
  pixelateCanvasToOverlay,
} from '@/services/pixelArtEffect'

// New effects
import { woodcutCache } from './woodcutEffect'
import { noiseGrainCache } from './noiseGrainEffect'
import { celShadeCache } from './celShadeEffect'
import { neonOutlineCache } from './neonOutlineEffect'
import { glitchCache } from './glitchEffect'
import { vhsRetroCache } from './vhsRetroEffect'
import { sketchHatchCache } from './sketchHatchEffect'
import { halftoneCache } from './halftoneEffect'
import { voxelCache } from './voxelEffect'
import { watercolorBleedCache } from './watercolorBleedEffect'
import { mosaicCache } from './mosaicEffect'
import { woodcutMaskCache } from './woodcutMaskEffect'

// ---------------------------------------------------------------------------
// Cache routing — maps type → cache instance
// ---------------------------------------------------------------------------

function getCache(type: StyleEffectType): import('@/services/styleEffectCache').EffectCache<AnySettings> | null {
  switch (type) {
    case 'woodcut': return woodcutCache
    case 'woodcut-mask': return woodcutMaskCache
    case 'noise-grain': return noiseGrainCache
    case 'cel-shade': return celShadeCache
    case 'neon-outline': return neonOutlineCache
    case 'glitch': return glitchCache
    case 'vhs-retro': return vhsRetroCache
    case 'sketch-hatch': return sketchHatchCache
    case 'halftone': return halftoneCache
    case 'voxel': return voxelCache
    case 'watercolor-bleed': return watercolorBleedCache
    case 'mosaic': return mosaicCache
    default: return null
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Synchronous cache lookup for a style effect (RAF-safe).
 * For pixel-art, delegates to existing pixelArtEffect.ts.
 * Returns null on cache miss.
 */
export function getEffectFromCache(
  src: string,
  effect: ActiveStyleEffect,
  seed?: number,
): string | null {
  if (effect.type === 'pixel-art') {
    return getPixelatedFromCache(src, effect.settings as PixelArtEffectSettings)
  }
  const cache = getCache(effect.type)
  return cache?.getFromCache(src, effect.settings, seed) ?? null
}

/**
 * Async process + cache a single image source.
 */
export async function processEffectAsync(
  src: string,
  effect: ActiveStyleEffect,
  seed?: number,
): Promise<string> {
  if (effect.type === 'pixel-art') {
    return pixelateImageSrc(src, effect.settings as PixelArtEffectSettings)
  }
  const cache = getCache(effect.type)
  if (!cache) return src
  return cache.processAsync(src, effect.settings, seed)
}

/**
 * Batch pre-cache multiple sources for a style effect.
 * For animated effects, pre-caches all seed variants.
 */
export async function preCacheEffect(
  sources: string[],
  effect: ActiveStyleEffect,
): Promise<void> {
  if (effect.type === 'pixel-art') {
    return preCachePixelArt(sources, effect.settings as PixelArtEffectSettings)
  }
  const cache = getCache(effect.type)
  if (!cache) return

  if (isAnimatedEffect(effect.type)) {
    const seeds = Array.from({ length: ANIMATED_VARIANT_COUNT }, (_, i) => i)
    return cache.preCacheBatch(sources, effect.settings, seeds)
  }
  return cache.preCacheBatch(sources, effect.settings)
}

/**
 * Clear cache for a specific effect type, or all effects.
 */
export function clearEffectCache(type?: StyleEffectType): void {
  if (!type) {
    // Clear all
    clearPixelArtCache()
    woodcutCache.clear()
    woodcutMaskCache.clear()
    noiseGrainCache.clear()
    celShadeCache.clear()
    neonOutlineCache.clear()
    glitchCache.clear()
    vhsRetroCache.clear()
    sketchHatchCache.clear()
    halftoneCache.clear()
    voxelCache.clear()
    watercolorBleedCache.clear()
    mosaicCache.clear()
    return
  }
  if (type === 'pixel-art') {
    clearPixelArtCache()
    return
  }
  getCache(type)?.clear()
}

// ---------------------------------------------------------------------------
// Overlay — real-time canvas processing for rigged characters
// ---------------------------------------------------------------------------

/** Reusable temp canvas for WebGL → 2D conversion */
let _overlaySource: HTMLCanvasElement | null = null

/**
 * Canvas overlay for rigged mode. Processes source canvas onto output.
 * Returns true if applied, false if skipped.
 *
 * The source canvas may be WebGL (RigPlaybackViewer), so we drawImage() to a
 * temp 2D canvas first (drawImage works cross-context, getContext('2d') doesn't).
 */
export function processEffectOverlay(
  source: HTMLCanvasElement,
  output: HTMLCanvasElement,
  effect: ActiveStyleEffect,
  seed?: number,
): boolean {
  if (effect.type === 'pixel-art') {
    return pixelateCanvasToOverlay(source, output, effect.settings as PixelArtEffectSettings)
  }
  const cache = getCache(effect.type)
  if (!cache?.processOverlay) return false

  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false

  // Copy source to 2D canvas (WebGL → 2D conversion via drawImage)
  if (!_overlaySource) _overlaySource = document.createElement('canvas')
  if (_overlaySource.width !== w) _overlaySource.width = w
  if (_overlaySource.height !== h) _overlaySource.height = h
  const srcCtx = _overlaySource.getContext('2d')!
  srcCtx.clearRect(0, 0, w, h)
  srcCtx.drawImage(source, 0, 0)

  // Process effect at full resolution
  return cache.processOverlay(_overlaySource, output, effect.settings, seed)
}

/**
 * Compute the seed variant for the current frame (animated effects only).
 * Non-animated effects return 0.
 */
export function getAnimatedSeed(frame: number, effect: ActiveStyleEffect): number {
  if (!isAnimatedEffect(effect.type)) return 0
  const speed = effect.settings.speed ?? 2
  return Math.floor(frame / speed) % ANIMATED_VARIANT_COUNT
}

/**
 * Check if an effect setting has the effect enabled.
 */
export function isEffectEnabled(effect: ActiveStyleEffect | undefined): effect is ActiveStyleEffect {
  if (!effect) return false
  if (effect.type === 'pixel-art') {
    return (effect.settings as PixelArtEffectSettings)?.enabled ?? false
  }
  return effect.settings?.enabled ?? false
}
