/**
 * Aura effect: soft glowing edge outline around the subject.
 * Animated when pulse is enabled: cycles through seed variants.
 */

import type { AuraSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: AuraSettings, seed?: number): string {
  return `aura|${src}|${s.size}|${s.color}|${s.intensity}|${s.pulse}|s${seed ?? 0}`
}

function parseHex(hex: string): [number, number, number] {
  const c = hex.replace('#', '')
  return [
    parseInt(c.substring(0, 2), 16) || 0,
    parseInt(c.substring(2, 4), 16) || 150,
    parseInt(c.substring(4, 6), 16) || 255,
  ]
}

async function process(src: string, s: AuraSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const [cr, cg, cb] = parseHex(s.color)
  const pulseMod = s.pulse ? (1 + Math.sin(seed * 0.8) * 0.3) : 1
  const glowSize = s.size * pulseMod
  const alpha = s.intensity * pulseMod

  // Draw expanded glow layers behind the image
  for (let layer = 3; layer >= 1; layer--) {
    const layerSize = glowSize * (layer / 3)
    const layerAlpha = alpha * (1 - layer / 4) * 0.4

    ctx.save()
    ctx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, ${layerAlpha})`
    ctx.shadowBlur = layerSize
    ctx.globalCompositeOperation = 'screen'
    ctx.drawImage(img, 0, 0)
    ctx.restore()
  }

  // Clear and redraw: aura glow behind, then crisp image on top
  // Use a temp canvas for the glow
  const glowCanvas = document.createElement('canvas')
  glowCanvas.width = w
  glowCanvas.height = h
  const gCtx = glowCanvas.getContext('2d')!

  // Build glow by drawing the image silhouette with shadow blur
  for (let pass = 0; pass < 3; pass++) {
    gCtx.save()
    gCtx.shadowColor = `rgba(${cr}, ${cg}, ${cb}, ${alpha * 0.5})`
    gCtx.shadowBlur = glowSize * (1 + pass * 0.5)
    gCtx.drawImage(img, 0, 0)
    gCtx.restore()
  }

  // Composite: glow layer, then original image on top
  ctx.clearRect(0, 0, w, h)
  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(glowCanvas, 0, 0)
  ctx.globalCompositeOperation = 'source-over'
  ctx.drawImage(img, 0, 0)

  return canvas.toDataURL('image/png')
}

export const auraCache = createEffectCache<AuraSettings>({
  name: 'aura',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
