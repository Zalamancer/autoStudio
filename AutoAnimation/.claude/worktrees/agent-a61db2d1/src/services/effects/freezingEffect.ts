/**
 * Freezing effect: ice crystal frost spreading across image.
 * Static effect (no speed parameter).
 */

import type { FreezingSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: FreezingSettings, seed?: number): string {
  return `freezing|${src}|${s.coverage}|${s.crystalSize}|${s.frostOpacity}|${s.blueShift}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: FreezingSettings, seed = 0): Promise<string> {
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
  const rng = mulberry32(seed * 9311 + 53)

  // Apply blue shift to entire image
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    const shift = s.blueShift
    d[i] = Math.max(0, d[i] - shift * 40)        // reduce red
    d[i + 1] = Math.max(0, d[i + 1] - shift * 15) // reduce green slightly
    d[i + 2] = Math.min(255, d[i + 2] + shift * 50) // boost blue
    // Desaturate slightly
    const avg = (d[i] + d[i + 1] + d[i + 2]) / 3
    d[i] = Math.round(d[i] * 0.7 + avg * 0.3)
    d[i + 1] = Math.round(d[i + 1] * 0.7 + avg * 0.3)
    d[i + 2] = Math.round(d[i + 2] * 0.7 + avg * 0.3)
  }

  ctx.putImageData(imageData, 0, 0)

  // Draw frost crystals
  const crystalCount = Math.floor(s.coverage * 200)
  ctx.globalCompositeOperation = 'screen'

  for (let i = 0; i < crystalCount; i++) {
    const cx = rng() * w
    const cy = rng() * h

    // Prefer edges and corners for frost
    const edgeBias = Math.min(cx / w, 1 - cx / w, cy / h, 1 - cy / h)
    if (edgeBias > 0.3 && rng() > s.coverage) continue

    const size = s.crystalSize * (1 + rng() * 2)
    const alpha = s.frostOpacity * (0.2 + rng() * 0.5)

    // Draw 6-pointed ice crystal
    ctx.strokeStyle = `rgba(200, 220, 255, ${alpha})`
    ctx.lineWidth = 0.5 + rng()
    ctx.beginPath()
    for (let a = 0; a < 6; a++) {
      const angle = (a * Math.PI) / 3
      ctx.moveTo(cx, cy)
      const tx = cx + Math.cos(angle) * size
      const ty = cy + Math.sin(angle) * size
      ctx.lineTo(tx, ty)
      // Branch tips
      if (rng() > 0.4) {
        const branchAngle = angle + (rng() - 0.5) * 0.8
        const bLen = size * 0.4
        ctx.moveTo(tx * 0.6 + cx * 0.4, ty * 0.6 + cy * 0.4)
        ctx.lineTo(
          tx * 0.6 + cx * 0.4 + Math.cos(branchAngle) * bLen,
          ty * 0.6 + cy * 0.4 + Math.sin(branchAngle) * bLen,
        )
      }
    }
    ctx.stroke()
  }

  // Frost overlay at edges
  ctx.globalCompositeOperation = 'source-over'
  const frostGrad = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.min(w, h) * 0.7)
  frostGrad.addColorStop(0, 'rgba(200, 220, 255, 0)')
  frostGrad.addColorStop(1, `rgba(200, 220, 255, ${s.frostOpacity * 0.3})`)
  ctx.fillStyle = frostGrad
  ctx.fillRect(0, 0, w, h)

  return canvas.toDataURL('image/png')
}

export const freezingCache = createEffectCache<FreezingSettings>({
  name: 'freezing',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
