/**
 * Dissolve Transition effect: pixel block dissolve.
 */

import type { DissolveTransitionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: DissolveTransitionSettings, seed?: number): string {
  return `dissolve-transition|${src}|${s.progress}|${s.blockSize}|${s.randomSeed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: DissolveTransitionSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  if (s.progress >= 1) return canvas.toDataURL('image/png')
  if (s.progress <= 0) { ctx.drawImage(img, 0, 0); return canvas.toDataURL('image/png') }

  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(s.randomSeed || 42)
  const cols = Math.ceil(w / s.blockSize)
  const rows = Math.ceil(h / s.blockSize)
  const totalBlocks = cols * rows

  // Generate random order for blocks
  const order: number[] = Array.from({ length: totalBlocks }, () => rng())
  const threshold = s.progress

  ctx.fillStyle = 'rgba(0,0,0,0)'
  ctx.globalCompositeOperation = 'destination-out'

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = row * cols + col
      if (order[idx] < threshold) {
        ctx.fillStyle = 'rgba(0,0,0,1)'
        ctx.fillRect(col * s.blockSize, row * s.blockSize, s.blockSize, s.blockSize)
      }
    }
  }

  ctx.globalCompositeOperation = 'source-over'
  return canvas.toDataURL('image/png')
}

export const dissolveTransitionCache = createEffectCache<DissolveTransitionSettings>({
  name: 'dissolve-transition',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
