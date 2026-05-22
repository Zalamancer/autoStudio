/**
 * Lightning effect: electric bolt overlays with branching.
 * Animated: cycles through seed variants per frame.
 */

import type { LightningSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: LightningSettings, seed?: number): string {
  return `lightning|${src}|${s.boltCount}|${s.brightness}|${s.branchiness}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function drawBolt(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  width: number, branchiness: number, depth: number, rng: () => number,
) {
  if (depth > 5) return
  const segments = 8 + Math.floor(rng() * 8)
  const dx = (x2 - x1) / segments
  const dy = (y2 - y1) / segments
  const jitter = Math.sqrt(dx * dx + dy * dy) * 0.4

  ctx.beginPath()
  let px = x1, py = y1
  ctx.moveTo(px, py)

  for (let i = 1; i <= segments; i++) {
    const nx = x1 + dx * i + (rng() - 0.5) * jitter
    const ny = y1 + dy * i + (rng() - 0.5) * jitter
    ctx.lineTo(nx, ny)

    // Branch at random points
    if (rng() < branchiness * 0.3 && depth < 3) {
      const bLen = jitter * (1 + rng() * 3)
      const bAngle = Math.atan2(ny - py, nx - px) + (rng() - 0.5) * 1.5
      drawBolt(
        ctx, nx, ny,
        nx + Math.cos(bAngle) * bLen,
        ny + Math.sin(bAngle) * bLen,
        width * 0.5, branchiness * 0.5, depth + 1, rng,
      )
    }
    px = nx
    py = ny
  }
  ctx.stroke()
}

async function process(src: string, s: LightningSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 2741 + 67)

  // Flash brightness
  if (s.brightness > 0.3) {
    ctx.fillStyle = `rgba(200, 200, 255, ${s.brightness * 0.1})`
    ctx.fillRect(0, 0, w, h)
  }

  // Draw lightning bolts
  ctx.globalCompositeOperation = 'screen'

  for (let b = 0; b < s.boltCount; b++) {
    const startX = rng() * w
    const startY = 0
    const endX = startX + (rng() - 0.5) * w * 0.4
    const endY = h * (0.5 + rng() * 0.5)

    // Glow layer
    ctx.shadowColor = `rgba(150, 170, 255, ${s.brightness})`
    ctx.shadowBlur = 15 + s.brightness * 10
    ctx.strokeStyle = `rgba(200, 210, 255, ${s.brightness * 0.5})`
    ctx.lineWidth = 3
    drawBolt(ctx, startX, startY, endX, endY, 3, s.branchiness, 0, rng)

    // Core bolt
    ctx.shadowBlur = 5
    ctx.strokeStyle = `rgba(220, 230, 255, ${s.brightness})`
    ctx.lineWidth = 1.5
    drawBolt(ctx, startX, startY, endX, endY, 1.5, s.branchiness, 0, rng)
  }

  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'
  ctx.globalCompositeOperation = 'source-over'

  return canvas.toDataURL('image/png')
}

export const lightningCache = createEffectCache<LightningSettings>({
  name: 'lightning',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
