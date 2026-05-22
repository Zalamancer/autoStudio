/**
 * Tattoo Animation effect: tattoo pattern overlay.
 */

import type { TattooAnimSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: TattooAnimSettings, seed?: number): string {
  return `tattoo|${src}|${s.pattern}|${s.opacity}|${s.scale}|${s.animate}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function drawTribalPattern(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number, rng: () => number) {
  const cx = w * 0.5; const cy = h * 0.5
  const r = Math.min(w, h) * 0.3 * scale
  ctx.lineWidth = 2
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2
    const x1 = cx + Math.cos(a) * r * 0.3
    const y1 = cy + Math.sin(a) * r * 0.3
    const x2 = cx + Math.cos(a) * r
    const y2 = cy + Math.sin(a) * r
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.quadraticCurveTo(cx + rng() * r * 0.5, cy + rng() * r * 0.5, x2, y2)
    ctx.stroke()
  }
}

function drawFloralPattern(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number, _rng: () => number) {
  const cx = w * 0.5; const cy = h * 0.5
  const r = Math.min(w, h) * 0.25 * scale
  ctx.lineWidth = 1.5
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    ctx.beginPath()
    ctx.ellipse(cx + Math.cos(a) * r * 0.4, cy + Math.sin(a) * r * 0.4, r * 0.3, r * 0.12, a, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.1, 0, Math.PI * 2)
  ctx.fill()
}

function drawGeometricPattern(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number, _rng: () => number) {
  const cx = w * 0.5; const cy = h * 0.5
  const r = Math.min(w, h) * 0.25 * scale
  ctx.lineWidth = 1.5
  for (let ring = 1; ring <= 3; ring++) {
    const sides = 3 + ring * 2
    ctx.beginPath()
    for (let i = 0; i <= sides; i++) {
      const a = (i / sides) * Math.PI * 2
      const px = cx + Math.cos(a) * r * ring * 0.3
      const py = cy + Math.sin(a) * r * ring * 0.3
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py)
    }
    ctx.stroke()
  }
}

function drawDragonPattern(ctx: CanvasRenderingContext2D, w: number, h: number, scale: number, _rng: () => number) {
  const cx = w * 0.5; const cy = h * 0.45
  const r = Math.min(w, h) * 0.3 * scale
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(cx - r * 0.3, cy)
  ctx.bezierCurveTo(cx - r, cy - r, cx + r * 0.5, cy - r * 0.8, cx + r * 0.3, cy)
  ctx.bezierCurveTo(cx + r, cy + r * 0.5, cx - r * 0.5, cy + r * 0.8, cx - r * 0.3, cy)
  ctx.stroke()
  // Scales
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    const sx = cx + Math.cos(a) * r * 0.5
    const sy = cy + Math.sin(a) * r * 0.4
    ctx.beginPath()
    ctx.arc(sx, sy, r * 0.06, 0, Math.PI)
    ctx.stroke()
  }
}

async function process(src: string, s: TattooAnimSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 3119 + 7)
  const reveal = s.animate ? Math.min(1, (seed + 1) / 8) : 1

  ctx.save()
  ctx.globalAlpha = s.opacity * reveal
  ctx.strokeStyle = '#1A1A2E'
  ctx.fillStyle = '#1A1A2E'

  switch (s.pattern) {
    case 'tribal': drawTribalPattern(ctx, w, h, s.scale, rng); break
    case 'floral': drawFloralPattern(ctx, w, h, s.scale, rng); break
    case 'geometric': drawGeometricPattern(ctx, w, h, s.scale, rng); break
    case 'dragon': drawDragonPattern(ctx, w, h, s.scale, rng); break
  }

  ctx.restore()
  return canvas.toDataURL('image/png')
}

export const tattooAnimCache = createEffectCache<TattooAnimSettings>({
  name: 'tattoo-anim',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
