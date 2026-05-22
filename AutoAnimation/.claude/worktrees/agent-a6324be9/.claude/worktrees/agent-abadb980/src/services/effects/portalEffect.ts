/**
 * Portal effect: swirling portal/vortex overlay with distortion.
 * Animated: cycles through seed variants per frame.
 */

import type { PortalSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: PortalSettings, seed?: number): string {
  return `portal|${src}|${s.size}|${s.rotation}|${s.glowColor}|${s.distortion}|s${seed ?? 0}`
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
    parseInt(c.substring(2, 4), 16) || 50,
    parseInt(c.substring(4, 6), 16) || 200,
  ]
}

async function process(src: string, s: PortalSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  // Apply swirl distortion around center
  const srcCanvas = document.createElement('canvas')
  srcCanvas.width = w
  srcCanvas.height = h
  const sCtx = srcCanvas.getContext('2d')!
  sCtx.drawImage(img, 0, 0)
  const srcData = sCtx.getImageData(0, 0, w, h)
  const sd = srcData.data

  const outData = ctx.createImageData(w, h)
  const od = outData.data
  od.set(sd)

  const cx = w / 2
  const cy = h / 2
  const portalRadius = Math.min(w, h) * s.size * 0.4
  const rotRad = (s.rotation * Math.PI) / 180
  const rng = mulberry32(seed * 6337 + 83)

  if (s.distortion > 0) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx
        const dy = y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < portalRadius && dist > 0) {
          const t = 1 - dist / portalRadius
          const swirlAngle = t * t * s.distortion * 5 + rotRad
          const cos = Math.cos(swirlAngle)
          const sin = Math.sin(swirlAngle)

          const sx = Math.round(cx + dx * cos - dy * sin)
          const sy = Math.round(cy + dx * sin + dy * cos)
          const sxi = Math.max(0, Math.min(w - 1, sx))
          const syi = Math.max(0, Math.min(h - 1, sy))

          const dstIdx = (y * w + x) * 4
          const srcIdx = (syi * w + sxi) * 4
          od[dstIdx] = sd[srcIdx]
          od[dstIdx + 1] = sd[srcIdx + 1]
          od[dstIdx + 2] = sd[srcIdx + 2]
          od[dstIdx + 3] = sd[srcIdx + 3]
        }
      }
    }
  }

  ctx.putImageData(outData, 0, 0)

  // Draw portal ring
  const [gr, gg, gb] = parseHex(s.glowColor)
  ctx.globalCompositeOperation = 'screen'

  // Multiple concentric rings
  for (let ring = 0; ring < 5; ring++) {
    const r = portalRadius * (0.8 + ring * 0.05)
    const alpha = 0.3 - ring * 0.05
    const lineW = 3 - ring * 0.4

    ctx.strokeStyle = `rgba(${gr}, ${gg}, ${gb}, ${Math.max(0, alpha)})`
    ctx.lineWidth = Math.max(0.5, lineW)
    ctx.shadowColor = `rgba(${gr}, ${gg}, ${gb}, 0.5)`
    ctx.shadowBlur = 10 + ring * 3

    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Inner glow
  const innerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, portalRadius * 0.5)
  innerGrad.addColorStop(0, `rgba(${gr}, ${gg}, ${gb}, 0.2)`)
  innerGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = innerGrad
  ctx.beginPath()
  ctx.arc(cx, cy, portalRadius * 0.5, 0, Math.PI * 2)
  ctx.fill()

  // Energy particles around rim
  const particleCount = 20 + Math.floor(rng() * 20)
  for (let i = 0; i < particleCount; i++) {
    const angle = rng() * Math.PI * 2
    const dist = portalRadius * (0.7 + rng() * 0.4)
    const px = cx + Math.cos(angle) * dist
    const py = cy + Math.sin(angle) * dist
    const pr = 1 + rng() * 3

    ctx.fillStyle = `rgba(${gr}, ${gg}, ${gb}, ${0.3 + rng() * 0.5})`
    ctx.beginPath()
    ctx.arc(px, py, pr, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'
  ctx.globalCompositeOperation = 'source-over'

  return canvas.toDataURL('image/png')
}

export const portalCache = createEffectCache<PortalSettings>({
  name: 'portal',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
