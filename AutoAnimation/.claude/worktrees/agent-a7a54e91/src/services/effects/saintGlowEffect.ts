/**
 * Saint Glow effect: divine radial glow halo around the subject.
 * Animated: pulse cycles through seed variants per frame.
 */

import type { SaintGlowSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: SaintGlowSettings, seed?: number): string {
  return `saint-glow|${src}|${s.radius}|${s.intensity}|${s.color}|${s.pulseSpeed}|s${seed ?? 0}`
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
    parseInt(c.substring(0, 2), 16) || 255,
    parseInt(c.substring(2, 4), 16) || 215,
    parseInt(c.substring(4, 6), 16) || 0,
  ]
}

async function process(src: string, s: SaintGlowSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!

  const [cr, cg, cb] = parseHex(s.color)

  // Pulse modulation
  const rng = mulberry32(seed * 3917 + 59)
  const pulsePhase = seed * s.pulseSpeed * 0.5
  const pulseMod = 1 + Math.sin(pulsePhase) * 0.2 * s.pulseSpeed

  // Draw glow behind the image
  const glowRadius = s.radius * pulseMod
  const cx = w / 2
  const cy = h * 0.35 // Glow centered above center (halo position)

  // Outer glow
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius * 3)
  grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${s.intensity * 0.6 * pulseMod})`)
  grad.addColorStop(0.3, `rgba(${cr}, ${cg}, ${cb}, ${s.intensity * 0.3 * pulseMod})`)
  grad.addColorStop(0.7, `rgba(${cr}, ${cg}, ${cb}, ${s.intensity * 0.1})`)
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Draw radial light rays
  ctx.globalCompositeOperation = 'screen'
  const rayCount = 12 + Math.floor(rng() * 8)
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 + rng() * 0.3
    const rayLen = glowRadius * (1.5 + rng() * 1.5)
    const rayWidth = 1 + rng() * 2
    const alpha = s.intensity * (0.05 + rng() * 0.1) * pulseMod

    ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, ${alpha})`
    ctx.lineWidth = rayWidth
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(angle) * rayLen, cy + Math.sin(angle) * rayLen)
    ctx.stroke()
  }

  ctx.globalCompositeOperation = 'source-over'

  // Draw the original image on top
  ctx.drawImage(img, 0, 0)

  return canvas.toDataURL('image/png')
}

export const saintGlowCache = createEffectCache<SaintGlowSettings>({
  name: 'saint-glow',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
