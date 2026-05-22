/**
 * Lens vignetting effect — darkened corners simulating real lens falloff.
 */

import type { VignettingSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: VignettingSettings): string {
  return `vignetting|${src}|${s.amount}|${s.roundness}|${s.feather}|${s.midpoint}`
}

async function process(src: string, s: VignettingSettings): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  applyVignette(ctx, w, h, s)

  return canvas.toDataURL('image/png')
}

function applyVignette(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: VignettingSettings,
) {
  const cx = w / 2
  const cy = h / 2

  // Adjust radius based on roundness (1 = circular, 0 = more oval)
  const rx = cx * (1 + (1 - s.roundness) * 0.5)
  const ry = cy * (1 + s.roundness * 0.5)
  const r = Math.sqrt(rx * rx + ry * ry)

  const innerRadius = r * s.midpoint
  const grad = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, r)

  grad.addColorStop(0, 'rgba(0,0,0,0)')
  grad.addColorStop(Math.max(0, 1 - s.feather), `rgba(0,0,0,${s.amount * 0.3})`)
  grad.addColorStop(1, `rgba(0,0,0,${s.amount})`)

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: VignettingSettings): boolean {
  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false
  if (output.width !== w) output.width = w
  if (output.height !== h) output.height = h

  const oCtx = output.getContext('2d')!
  oCtx.clearRect(0, 0, w, h)
  oCtx.drawImage(source, 0, 0)

  applyVignette(oCtx, w, h, s)

  return true
}

export const vignettingCache = createEffectCache<VignettingSettings>({
  name: 'vignetting',
  maxEntries: 30,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})
