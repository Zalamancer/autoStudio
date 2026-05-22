/**
 * Depth of Field with shaped bokeh effect.
 * Simulates camera DOF blur with configurable bokeh shapes.
 */

import type { DofBokehSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: DofBokehSettings, seed?: number): string {
  return `dof-bokeh|${src}|${s.aperture}|${s.focusDistance}|${s.bokehShape}|${s.maxBlur}|${s.focalBandWidth}|s${seed ?? 0}`
}

async function process(src: string, s: DofBokehSettings): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  // Calculate blur radius based on aperture (wider = more blur)
  const blurRadius = Math.max(1, s.maxBlur)
  if (blurRadius < 0.5) return canvas.toDataURL('image/png')

  // Create distance-based blur map
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data

  // Simple radial DOF: focus band at focusDistance, blur increases away from it
  const focusY = s.focusDistance * h
  const focusBand = h * s.focalBandWidth

  // Create blurred version
  const blurCanvas = document.createElement('canvas')
  blurCanvas.width = w
  blurCanvas.height = h
  const blurCtx = blurCanvas.getContext('2d')!
  blurCtx.filter = `blur(${Math.ceil(blurRadius)}px)`
  blurCtx.drawImage(img, 0, 0)
  const blurData = blurCtx.getImageData(0, 0, w, h).data

  // Blend based on distance from focal plane
  for (let y = 0; y < h; y++) {
    const distFromFocus = Math.abs(y - focusY)
    const blurAmount = Math.min(1, Math.max(0, (distFromFocus - focusBand) / (h * 0.3)))

    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      d[idx] = Math.round(d[idx] * (1 - blurAmount) + blurData[idx] * blurAmount)
      d[idx + 1] = Math.round(d[idx + 1] * (1 - blurAmount) + blurData[idx + 1] * blurAmount)
      d[idx + 2] = Math.round(d[idx + 2] * (1 - blurAmount) + blurData[idx + 2] * blurAmount)
    }
  }

  // Add bokeh highlights on bright out-of-focus areas
  if (s.bokehShape !== 'circle') {
    // For polygon bokeh, add highlight shapes on bright spots
    const outData = ctx.createImageData(w, h)
    outData.data.set(d)
    ctx.putImageData(outData, 0, 0)

    // Draw subtle bokeh spots — scale count and alpha from maxBlur (normalized to 0-1 range)
    const blurNorm = Math.min(1, blurRadius / 30)
    const spotCount = Math.floor(blurNorm * 12)
    for (let i = 0; i < spotCount; i++) {
      const sx = Math.random() * w
      const sy = Math.random() * h
      const distFromFocus = Math.abs(sy - focusY)
      if (distFromFocus < focusBand) continue

      const spotSize = blurRadius * (0.5 + Math.random() * 0.8)
      const alpha = Math.min(0.15, (distFromFocus / h) * 0.2) * blurNorm

      ctx.globalAlpha = alpha
      ctx.fillStyle = '#ffffff'

      if (s.bokehShape === 'hexagon') {
        drawPolygon(ctx, sx, sy, spotSize, 6)
      } else {
        drawPolygon(ctx, sx, sy, spotSize, 8)
      }
    }
    ctx.globalAlpha = 1
    return canvas.toDataURL('image/png')
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(d)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

function drawPolygon(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, sides: number) {
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()
  ctx.fill()
}

function overlay(source: HTMLCanvasElement, output: HTMLCanvasElement, s: DofBokehSettings): boolean {
  const w = source.width
  const h = source.height
  if (w === 0 || h === 0) return false
  if (output.width !== w) output.width = w
  if (output.height !== h) output.height = h

  const oCtx = output.getContext('2d')!
  oCtx.clearRect(0, 0, w, h)

  const blurRadius = Math.max(1, s.maxBlur)
  const focusY = s.focusDistance * h

  // Draw focused portion normally
  oCtx.drawImage(source, 0, 0)

  // Apply blur to out-of-focus regions
  if (blurRadius >= 0.5) {
    const blurCanvas = document.createElement('canvas')
    blurCanvas.width = w
    blurCanvas.height = h
    const blurCtx = blurCanvas.getContext('2d')!
    blurCtx.filter = `blur(${Math.ceil(blurRadius)}px)`
    blurCtx.drawImage(source, 0, 0)

    // Gradient mask for DOF transition
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = w
    maskCanvas.height = h
    const maskCtx = maskCanvas.getContext('2d')!
    const grad = maskCtx.createLinearGradient(0, 0, 0, h)
    const focusNorm = focusY / h
    const band = s.focalBandWidth
    grad.addColorStop(0, 'white')
    grad.addColorStop(Math.max(0, focusNorm - band), 'white')
    grad.addColorStop(focusNorm, 'black')
    grad.addColorStop(Math.min(1, focusNorm + band), 'white')
    grad.addColorStop(1, 'white')
    maskCtx.fillStyle = grad
    maskCtx.fillRect(0, 0, w, h)

    oCtx.globalCompositeOperation = 'source-over'
    oCtx.drawImage(source, 0, 0)

    // Blend blurred version using mask
    const srcData = oCtx.getImageData(0, 0, w, h)
    const blurData = blurCtx.getImageData(0, 0, w, h)
    const maskData = maskCtx.getImageData(0, 0, w, h)
    const sd = srcData.data
    const bd = blurData.data
    const md = maskData.data

    for (let i = 0; i < sd.length; i += 4) {
      const blend = md[i] / 255
      sd[i] = Math.round(sd[i] * (1 - blend) + bd[i] * blend)
      sd[i + 1] = Math.round(sd[i + 1] * (1 - blend) + bd[i + 1] * blend)
      sd[i + 2] = Math.round(sd[i + 2] * (1 - blend) + bd[i + 2] * blend)
    }
    oCtx.putImageData(srcData, 0, 0)
  }

  return true
}

export const dofBokehCache = createEffectCache<DofBokehSettings>({
  name: 'dof-bokeh',
  maxEntries: 30,
  cacheKeyFn: cacheKey,
  processFn: process,
  overlayFn: overlay,
})
