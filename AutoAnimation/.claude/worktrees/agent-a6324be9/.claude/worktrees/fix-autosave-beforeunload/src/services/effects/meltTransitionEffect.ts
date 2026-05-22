/**
 * Melt Transition effect: melting drip reveal.
 */

import type { MeltTransitionSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: MeltTransitionSettings, seed?: number): string {
  return `melt-transition|${src}|${s.progress}|${s.dripCount}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: MeltTransitionSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  if (s.progress >= 1) return canvas.toDataURL('image/png')
  if (s.progress <= 0) { ctx.drawImage(img, 0, 0); return canvas.toDataURL('image/png') }

  // Create drip columns
  const rng = mulberry32(42) // Fixed seed for consistent drip positions
  const colW = w / s.dripCount
  const srcCtx = document.createElement('canvas')
  srcCtx.width = w; srcCtx.height = h
  srcCtx.getContext('2d')!.drawImage(img, 0, 0)

  for (let i = 0; i < s.dripCount; i++) {
    const dripSpeed = 0.5 + rng() * 1.0
    const dripProgress = Math.min(1, s.progress * dripSpeed * (1 + s.speed * 0.2))
    const dropY = dripProgress * h

    const x = i * colW
    const sliceW = colW + 1

    ctx.save()
    ctx.beginPath()
    ctx.rect(x, 0, sliceW, h)
    ctx.clip()

    // Draw the column shifted down
    ctx.drawImage(srcCtx, x, 0, sliceW, h, x, dropY, sliceW, h)

    // Drip bulge at bottom
    if (dripProgress > 0 && dripProgress < 1) {
      const bulgeR = colW * 0.4
      ctx.fillStyle = '#00000020'
      ctx.beginPath()
      ctx.arc(x + colW * 0.5, dropY + 5, bulgeR, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}

export const meltTransitionCache = createEffectCache<MeltTransitionSettings>({
  name: 'melt-transition',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
