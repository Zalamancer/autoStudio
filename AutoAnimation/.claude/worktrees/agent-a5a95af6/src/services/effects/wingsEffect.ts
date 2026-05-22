/**
 * Wings effect: overlay angel/demon/butterfly/dragon wings.
 * Animated: 8 seed variants cycled per frame.
 */

import type { WingsSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: WingsSettings, seed?: number): string {
  return `wings|${src}|${s.style}|${s.size}|${s.opacity}|${s.animate}|s${seed ?? 0}`
}


const WING_COLORS: Record<string, [string, string]> = {
  angel: ['#FFFFFF', '#E8E0D0'],
  demon: ['#2A0A0A', '#5A1010'],
  butterfly: ['#FF6B35', '#4ECDC4'],
  dragon: ['#2D5016', '#1A3A0A'],
}

async function process(src: string, s: WingsSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const cx = w * 0.5
  const cy = h * 0.4
  const wingSpan = w * s.size * 0.8
  const wingH = h * s.size * 0.5
  const flapAngle = s.animate ? Math.sin(seed * 0.8) * 0.15 : 0
  const [c1, c2] = WING_COLORS[s.style] || WING_COLORS.angel

  ctx.save()
  ctx.globalAlpha = s.opacity

  // Left wing
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(-1, 1)
  ctx.rotate(flapAngle)
  const grdL = ctx.createLinearGradient(0, 0, wingSpan, 0)
  grdL.addColorStop(0, c1)
  grdL.addColorStop(1, c2)
  ctx.fillStyle = grdL
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(wingSpan * 0.3, -wingH * 0.8, wingSpan * 0.8, -wingH * 0.6, wingSpan, -wingH * 0.2)
  ctx.bezierCurveTo(wingSpan * 0.9, wingH * 0.2, wingSpan * 0.5, wingH * 0.4, 0, wingH * 0.1)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  // Right wing
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(-flapAngle)
  const grdR = ctx.createLinearGradient(0, 0, wingSpan, 0)
  grdR.addColorStop(0, c1)
  grdR.addColorStop(1, c2)
  ctx.fillStyle = grdR
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.bezierCurveTo(wingSpan * 0.3, -wingH * 0.8, wingSpan * 0.8, -wingH * 0.6, wingSpan, -wingH * 0.2)
  ctx.bezierCurveTo(wingSpan * 0.9, wingH * 0.2, wingSpan * 0.5, wingH * 0.4, 0, wingH * 0.1)
  ctx.closePath()
  ctx.fill()
  ctx.restore()

  ctx.restore()
  return canvas.toDataURL('image/png')
}

export const wingsCache = createEffectCache<WingsSettings>({
  name: 'wings',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
