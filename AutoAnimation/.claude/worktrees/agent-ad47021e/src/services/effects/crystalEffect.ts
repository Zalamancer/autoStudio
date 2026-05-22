/**
 * Crystal effect: faceted/geometric crystallization with refraction sparkle.
 * Static effect.
 */

import type { CrystalSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: CrystalSettings, seed?: number): string {
  return `crystal|${src}|${s.facetSize}|${s.refraction}|${s.sparkle}|${s.edgeSharpness}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: CrystalSettings, seed = 0): Promise<string> {
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
  const out = new Uint8ClampedArray(d.length)
  out.set(d)
  const rng = mulberry32(seed * 7213 + 29)

  const fSize = s.facetSize

  // Generate Voronoi-like seed points for facets
  const cols = Math.ceil(w / fSize)
  const rows = Math.ceil(h / fSize)
  const points: { x: number; y: number }[] = []

  for (let r = 0; r < rows + 1; r++) {
    for (let c = 0; c < cols + 1; c++) {
      points.push({
        x: c * fSize + (rng() - 0.5) * fSize * 0.6,
        y: r * fSize + (rng() - 0.5) * fSize * 0.6,
      })
    }
  }

  // For each pixel, find nearest Voronoi point and sample color from there
  // Also compute facet lighting based on position within facet
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dstIdx = (y * w + x) * 4
      if (d[dstIdx + 3] === 0) continue

      // Find nearest point
      let minDist = Infinity
      let nearestPt = points[0]
      let secondDist = Infinity

      for (const pt of points) {
        const dx = x - pt.x
        const dy = y - pt.y
        const dist = dx * dx + dy * dy
        if (dist < minDist) {
          secondDist = minDist
          minDist = dist
          nearestPt = pt
        } else if (dist < secondDist) {
          secondDist = dist
        }
      }

      // Sample color at nearest point (with refraction offset)
      const refrDx = Math.round((nearestPt.x - x) * s.refraction * 0.5)
      const refrDy = Math.round((nearestPt.y - y) * s.refraction * 0.5)
      const sx = Math.max(0, Math.min(w - 1, Math.round(nearestPt.x + refrDx)))
      const sy = Math.max(0, Math.min(h - 1, Math.round(nearestPt.y + refrDy)))
      const srcIdx = (sy * w + sx) * 4

      // Facet lighting: brighter at center, darker at edges
      const sqrtMin = Math.sqrt(minDist)
      const sqrtSecond = Math.sqrt(secondDist)
      const edgeFactor = sqrtMin / (sqrtMin + sqrtSecond + 0.01)
      const lightMultiplier = 1 + (0.5 - edgeFactor) * 0.5

      out[dstIdx] = Math.max(0, Math.min(255, Math.round(d[srcIdx] * lightMultiplier)))
      out[dstIdx + 1] = Math.max(0, Math.min(255, Math.round(d[srcIdx + 1] * lightMultiplier)))
      out[dstIdx + 2] = Math.max(0, Math.min(255, Math.round(d[srcIdx + 2] * lightMultiplier)))
      out[dstIdx + 3] = d[dstIdx + 3]

      // Edge darkening for facet boundaries
      if (edgeFactor > (1 - s.edgeSharpness * 0.15)) {
        const darken = (edgeFactor - (1 - s.edgeSharpness * 0.15)) * s.edgeSharpness * 400
        out[dstIdx] = Math.max(0, out[dstIdx] - darken)
        out[dstIdx + 1] = Math.max(0, out[dstIdx + 1] - darken)
        out[dstIdx + 2] = Math.max(0, out[dstIdx + 2] - darken)
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)

  // Add sparkle highlights
  if (s.sparkle > 0) {
    ctx.globalCompositeOperation = 'screen'
    const sparkCount = Math.floor(s.sparkle * points.length * 0.3)

    for (let i = 0; i < sparkCount; i++) {
      const pt = points[Math.floor(rng() * points.length)]
      if (pt.x < 0 || pt.x >= w || pt.y < 0 || pt.y >= h) continue

      const sparkAlpha = s.sparkle * (0.3 + rng() * 0.5)
      const sparkSize = 2 + rng() * 4

      ctx.fillStyle = `rgba(255, 255, 255, ${sparkAlpha})`
      ctx.beginPath()
      ctx.arc(pt.x, pt.y, sparkSize * 0.5, 0, Math.PI * 2)
      ctx.fill()

      // Cross sparkle
      ctx.strokeStyle = `rgba(255, 255, 255, ${sparkAlpha * 0.5})`
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.moveTo(pt.x - sparkSize, pt.y)
      ctx.lineTo(pt.x + sparkSize, pt.y)
      ctx.moveTo(pt.x, pt.y - sparkSize)
      ctx.lineTo(pt.x, pt.y + sparkSize)
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  return canvas.toDataURL('image/png')
}

export const crystalCache = createEffectCache<CrystalSettings>({
  name: 'crystal',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
