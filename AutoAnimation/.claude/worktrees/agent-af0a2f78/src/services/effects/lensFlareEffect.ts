/**
 * Procedural lens flare effect — light streaks and ghosts.
 */

import type { LensFlareSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: LensFlareSettings): string {
  return `lens-flare|${src}|${s.glowIntensity}|${s.streakCount}|${s.streakLength}|${s.ghostCount}|${s.anamorphicStreaks}|${s.tintColor}`
}

function drawFlare(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  s: LensFlareSettings,
) {
  // Flare is centered; position is derived from canvas dimensions
  const fx = w * 0.5
  const fy = h * 0.5
  const brightness = s.glowIntensity

  ctx.save()
  ctx.globalCompositeOperation = 'screen'

  // Main glow
  const glowRadius = Math.min(w, h) * 0.15 * brightness
  const glowGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, glowRadius)
  glowGrad.addColorStop(0, `rgba(255, 250, 230, ${brightness * 0.8})`)
  glowGrad.addColorStop(0.3, `rgba(255, 200, 100, ${brightness * 0.4})`)
  glowGrad.addColorStop(1, 'rgba(255, 200, 100, 0)')
  ctx.fillStyle = glowGrad
  ctx.fillRect(0, 0, w, h)

  // Streaks
  const streakLen = s.anamorphicStreaks ? w * 0.6 * s.streakLength : w * 0.2 * s.streakLength
  const streakWidth = s.anamorphicStreaks ? 2 : 1.5

  for (let i = 0; i < s.streakCount; i++) {
    const angle = s.anamorphicStreaks
      ? 0 // Horizontal only for anamorphic
      : (i / s.streakCount) * Math.PI

    ctx.save()
    ctx.translate(fx, fy)
    ctx.rotate(angle)

    const streakGrad = ctx.createLinearGradient(-streakLen, 0, streakLen, 0)
    streakGrad.addColorStop(0, 'rgba(255, 220, 150, 0)')
    streakGrad.addColorStop(0.3, `rgba(255, 240, 200, ${brightness * 0.3})`)
    streakGrad.addColorStop(0.5, `rgba(255, 255, 255, ${brightness * 0.5})`)
    streakGrad.addColorStop(0.7, `rgba(255, 240, 200, ${brightness * 0.3})`)
    streakGrad.addColorStop(1, 'rgba(255, 220, 150, 0)')

    ctx.fillStyle = streakGrad
    ctx.fillRect(-streakLen, -streakWidth, streakLen * 2, streakWidth * 2)

    ctx.restore()
  }

  // Ghost circles (lens reflections)
  const cx = w / 2
  const cy = h / 2
  for (let i = 0; i < s.ghostCount; i++) {
    const t = (i + 1) / (s.ghostCount + 1)
    const gx = fx + (cx - fx) * t * 2
    const gy = fy + (cy - fy) * t * 2
    const gr = glowRadius * (0.1 + Math.random() * 0.15)
    const alpha = brightness * 0.1 * (1 - t)

    const ghostGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr)
    ghostGrad.addColorStop(0, `rgba(200, 220, 255, ${alpha})`)
    ghostGrad.addColorStop(0.5, `rgba(150, 180, 255, ${alpha * 0.5})`)
    ghostGrad.addColorStop(1, 'rgba(150, 180, 255, 0)')
    ctx.fillStyle = ghostGrad
    ctx.fillRect(gx - gr, gy - gr, gr * 2, gr * 2)
  }

  ctx.restore()
}

async function process(src: string, s: LensFlareSettings): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  drawFlare(ctx, w, h, s)

  return canvas.toDataURL('image/png')
}

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: LensFlareSettings): boolean {
  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false
  if (output.width !== w) output.width = w
  if (output.height !== h) output.height = h

  const oCtx = output.getContext('2d')!
  oCtx.clearRect(0, 0, w, h)
  oCtx.drawImage(source, 0, 0)

  drawFlare(oCtx, w, h, s)

  return true
}

export const lensFlareCache = createEffectCache<LensFlareSettings>({
  name: 'lens-flare',
  maxEntries: 30,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})
