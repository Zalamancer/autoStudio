/**
 * Anamorphic lens effect — horizontal squeeze, oval bokeh, horizontal flare, and lens breathe.
 */

import type { AnamorphicSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: AnamorphicSettings): string {
  return `anamorphic|${src}|${s.squeeze}|${s.horizontalFlare}|${s.ovalBokeh}|${s.breathe}`
}

async function process(src: string, s: AnamorphicSettings): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Apply squeeze effect (horizontally compress center, stretch edges)
  const squeezeAmount = s.squeeze
  if (squeezeAmount > 1) {
    // Draw with horizontal scaling to simulate anamorphic desqueeze
    ctx.save()
    ctx.translate(w / 2, 0)
    ctx.scale(1 / squeezeAmount, 1)
    ctx.translate(-w / 2, 0)
    ctx.drawImage(img, 0, 0)
    ctx.restore()

    // Fill black bars on sides (letterbox)
    const barWidth = (w - w / squeezeAmount) / 2
    ctx.fillStyle = '#000'
    ctx.fillRect(0, 0, barWidth, h)
    ctx.fillRect(w - barWidth, 0, barWidth, h)
  } else {
    ctx.drawImage(img, 0, 0)
  }

  // Horizontal flare streaks
  if (s.horizontalFlare > 0) {
    ctx.save()
    ctx.globalCompositeOperation = 'screen'

    // Scan for bright horizontal bands and add flare
    const flareCount = Math.ceil(s.horizontalFlare * 3)
    for (let i = 0; i < flareCount; i++) {
      const fy = h * (0.2 + (i / flareCount) * 0.6)
      const flareGrad = ctx.createLinearGradient(0, fy - 2, 0, fy + 2)
      flareGrad.addColorStop(0, 'rgba(100, 150, 255, 0)')
      flareGrad.addColorStop(0.5, `rgba(130, 170, 255, ${s.horizontalFlare * 0.12})`)
      flareGrad.addColorStop(1, 'rgba(100, 150, 255, 0)')

      ctx.fillStyle = flareGrad
      ctx.fillRect(0, fy - 8, w, 16)
    }

    ctx.restore()
  }

  // Oval bokeh vignette (anamorphic lenses have oval vignetting)
  if (s.ovalBokeh > 0) {
    const cx = w / 2
    const cy = h / 2
    const rx = cx * 1.2
    const ry = cy * 0.8

    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.closePath()

    // Invert — darken outside the ellipse
    ctx.rect(0, 0, w, h)
    ctx.fillStyle = `rgba(0, 0, 0, ${s.ovalBokeh * 0.3})`
    ctx.fill('evenodd')
    ctx.restore()
  }

  // Lens breathe (subtle scale oscillation)
  if (s.breathe > 0) {
    // Slight zoom for static frame representation
    const breatheScale = 1 + s.breathe * 0.02
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = w
    tempCanvas.height = h
    const tempCtx = tempCanvas.getContext('2d')!
    tempCtx.drawImage(canvas, 0, 0)

    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.translate(w / 2, h / 2)
    ctx.scale(breatheScale, breatheScale)
    ctx.translate(-w / 2, -h / 2)
    ctx.drawImage(tempCanvas, 0, 0)
    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: AnamorphicSettings): boolean {
  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false
  if (output.width !== w) output.width = w
  if (output.height !== h) output.height = h

  const oCtx = output.getContext('2d')!
  oCtx.clearRect(0, 0, w, h)
  oCtx.drawImage(source, 0, 0)

  // Horizontal flare
  if (s.horizontalFlare > 0) {
    oCtx.save()
    oCtx.globalCompositeOperation = 'screen'
    const flareCount = Math.ceil(s.horizontalFlare * 3)
    for (let i = 0; i < flareCount; i++) {
      const fy = h * (0.2 + (i / flareCount) * 0.6)
      const flareGrad = oCtx.createLinearGradient(0, fy - 2, 0, fy + 2)
      flareGrad.addColorStop(0, 'rgba(100, 150, 255, 0)')
      flareGrad.addColorStop(0.5, `rgba(130, 170, 255, ${s.horizontalFlare * 0.12})`)
      flareGrad.addColorStop(1, 'rgba(100, 150, 255, 0)')
      oCtx.fillStyle = flareGrad
      oCtx.fillRect(0, fy - 8, w, 16)
    }
    oCtx.restore()
  }

  // Oval vignette
  if (s.ovalBokeh > 0) {
    const cx = w / 2
    const cy = h / 2
    const grad = oCtx.createRadialGradient(cx, cy, Math.min(cx, cy) * 0.6, cx, cy, Math.max(cx, cy))
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, `rgba(0,0,0,${s.ovalBokeh * 0.4})`)
    oCtx.fillStyle = grad
    oCtx.fillRect(0, 0, w, h)
  }

  return true
}

export const anamorphicCache = createEffectCache<AnamorphicSettings>({
  name: 'anamorphic',
  maxEntries: 30,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})
