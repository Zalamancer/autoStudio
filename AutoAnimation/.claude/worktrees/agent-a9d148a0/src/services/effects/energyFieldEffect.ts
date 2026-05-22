/**
 * Energy Field effect: crackling energy arcs around the subject.
 * Animated: cycles through seed variants per frame.
 */

import type { EnergyFieldSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: EnergyFieldSettings, seed?: number): string {
  return `energy-field|${src}|${s.intensity}|${s.color}|${s.density}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function parseHex(hex: string): [number, number, number] {
  const c = hex.replace('#', '')
  return [
    parseInt(c.substring(0, 2), 16) || 100,
    parseInt(c.substring(2, 4), 16) || 150,
    parseInt(c.substring(4, 6), 16) || 255,
  ]
}

async function process(src: string, s: EnergyFieldSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 7331 + 37)
  const [cr, cg, cb] = parseHex(s.color)

  // Find edge pixels for energy emanation
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const edges: [number, number][] = []

  for (let y = 2; y < h - 2; y += 2) {
    for (let x = 2; x < w - 2; x += 2) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] > 128) {
        const up = d[((y - 2) * w + x) * 4 + 3]
        const down = d[((y + 2) * w + x) * 4 + 3]
        const left = d[(y * w + (x - 2)) * 4 + 3]
        const right = d[(y * w + (x + 2)) * 4 + 3]
        if (up < 64 || down < 64 || left < 64 || right < 64) {
          edges.push([x, y])
        }
      }
    }
  }

  // Draw energy arcs from edge points
  ctx.globalCompositeOperation = 'screen'
  const arcCount = Math.floor(edges.length * s.density * 0.3)

  for (let i = 0; i < arcCount && i < 500; i++) {
    const [ex, ey] = edges[Math.floor(rng() * edges.length)]
    const arcLen = 10 + rng() * 30 * s.intensity
    const arcAngle = rng() * Math.PI * 2
    const segments = 4 + Math.floor(rng() * 6)
    const alpha = s.intensity * (0.3 + rng() * 0.4)

    // Glow
    ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`
    ctx.shadowBlur = 8 + s.intensity * 5
    ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`
    ctx.lineWidth = 0.5 + rng() * 1.5

    ctx.beginPath()
    let px = ex, py = ey
    ctx.moveTo(px, py)

    for (let j = 0; j < segments; j++) {
      const step = arcLen / segments
      const jitter = step * 0.5
      px += Math.cos(arcAngle + (rng() - 0.5) * 2) * step + (rng() - 0.5) * jitter
      py += Math.sin(arcAngle + (rng() - 0.5) * 2) * step + (rng() - 0.5) * jitter
      ctx.lineTo(px, py)
    }
    ctx.stroke()
  }

  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'
  ctx.globalCompositeOperation = 'source-over'

  return canvas.toDataURL('image/png')
}

export const energyFieldCache = createEffectCache<EnergyFieldSettings>({
  name: 'energy-field',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
