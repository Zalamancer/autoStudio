/**
 * Earth Bend effect: cracking/rocky fracture effect with dust overlay.
 * Animated: shake intensity cycles through seed variants.
 */

import type { EarthBendSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: EarthBendSettings, seed?: number): string {
  return `earth-bend|${src}|${s.crackDensity}|${s.crackWidth}|${s.shakeIntensity}|${s.dustOpacity}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: EarthBendSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Apply shake offset
  const rng = mulberry32(seed * 6131 + 17)
  const shakeX = (rng() - 0.5) * s.shakeIntensity * 2
  const shakeY = (rng() - 0.5) * s.shakeIntensity * 2
  ctx.drawImage(img, shakeX, shakeY)

  // Draw cracks
  ctx.strokeStyle = 'rgba(30, 20, 10, 0.8)'
  ctx.lineWidth = s.crackWidth
  for (let i = 0; i < s.crackDensity; i++) {
    let cx = rng() * w
    let cy = rng() * h
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    const segments = 5 + Math.floor(rng() * 10)
    for (let j = 0; j < segments; j++) {
      cx += (rng() - 0.5) * 40
      cy += rng() * 30
      ctx.lineTo(cx, cy)
      // Branch cracks
      if (rng() > 0.6) {
        const bx = cx + (rng() - 0.5) * 30
        const by = cy + rng() * 20
        ctx.moveTo(cx, cy)
        ctx.lineTo(bx, by)
        ctx.moveTo(cx, cy)
      }
    }
    ctx.stroke()
  }

  // Dust overlay
  if (s.dustOpacity > 0) {
    const imageData = ctx.getImageData(0, 0, w, h)
    const d = imageData.data
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue
      const dustNoise = rng() * s.dustOpacity * 60
      // Brown-ish dust tint
      d[i] = Math.min(255, d[i] + dustNoise * 0.8)
      d[i + 1] = Math.min(255, d[i + 1] + dustNoise * 0.6)
      d[i + 2] = Math.min(255, d[i + 2] + dustNoise * 0.3)
    }
    ctx.putImageData(imageData, 0, 0)
  }

  return canvas.toDataURL('image/png')
}

export const earthBendCache = createEffectCache<EarthBendSettings>({
  name: 'earth-bend',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
