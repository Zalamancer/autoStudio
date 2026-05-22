/**
 * Diamond effect: diamond-like faceted sparkle overlay.
 * Animated: 8 seed variants cycled per frame.
 */

import type { DiamondSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: DiamondSettings, seed?: number): string {
  return `diamond|${src}|${s.facetCount}|${s.sparkleIntensity}|${s.refraction}|${s.rainbowSheen}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: DiamondSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  // Refraction: slight pixel displacement
  if (s.refraction > 0) {
    const imageData = ctx.getImageData(0, 0, w, h)
    const d = imageData.data
    const out = new Uint8ClampedArray(d)
    const rng = mulberry32(seed * 1117 + 3)
    const shift = Math.floor(s.refraction * 4) + 1

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4
        if (d[idx + 3] === 0) continue
        const dx = Math.floor((rng() - 0.5) * shift * 2)
        const sx = Math.max(0, Math.min(w - 1, x + dx))
        const si = (y * w + sx) * 4
        out[idx] = d[si]
        out[idx + 2] = d[(y * w + Math.max(0, Math.min(w - 1, x - dx))) * 4 + 2]
      }
    }

    const outData = ctx.createImageData(w, h)
    outData.data.set(out)
    ctx.putImageData(outData, 0, 0)
  }

  // Rainbow sheen
  if (s.rainbowSheen > 0) {
    const grd = ctx.createLinearGradient(0, 0, w, h)
    grd.addColorStop(0, 'rgba(255,0,0,0.1)')
    grd.addColorStop(0.17, 'rgba(255,127,0,0.1)')
    grd.addColorStop(0.33, 'rgba(255,255,0,0.1)')
    grd.addColorStop(0.5, 'rgba(0,255,0,0.1)')
    grd.addColorStop(0.67, 'rgba(0,0,255,0.1)')
    grd.addColorStop(0.83, 'rgba(75,0,130,0.1)')
    grd.addColorStop(1, 'rgba(148,0,211,0.1)')
    ctx.globalAlpha = s.rainbowSheen * 0.5
    ctx.globalCompositeOperation = 'overlay'
    ctx.fillStyle = grd
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
    ctx.globalAlpha = 1
  }

  // Sparkle facets
  const rng2 = mulberry32(seed * 6661 + 17)
  ctx.globalCompositeOperation = 'screen'
  for (let i = 0; i < s.facetCount; i++) {
    const fx = rng2() * w
    const fy = rng2() * h
    const flicker = Math.sin(seed * 3 + i * 2.7) * 0.5 + 0.5
    const sz = 3 + rng2() * 8

    ctx.globalAlpha = s.sparkleIntensity * flicker * 0.6
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath()
    // 4-point star
    ctx.moveTo(fx, fy - sz)
    ctx.lineTo(fx + sz * 0.3, fy)
    ctx.lineTo(fx, fy + sz)
    ctx.lineTo(fx - sz * 0.3, fy)
    ctx.closePath()
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(fx - sz, fy)
    ctx.lineTo(fx, fy + sz * 0.3)
    ctx.lineTo(fx + sz, fy)
    ctx.lineTo(fx, fy - sz * 0.3)
    ctx.closePath()
    ctx.fill()
  }

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  return canvas.toDataURL('image/png')
}

export const diamondCache = createEffectCache<DiamondSettings>({
  name: 'diamond',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
