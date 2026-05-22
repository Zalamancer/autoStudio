/**
 * Flame effect: realistic flame overlay on edges.
 * Animated: cycles through seed variants per frame.
 */

import type { FlameSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: FlameSettings, seed?: number): string {
  return `flame|${src}|${s.height}|${s.intensity}|${s.colorBase}|${s.speed}|s${seed ?? 0}`
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
    parseInt(c.substring(2, 4), 16) || 120,
    parseInt(c.substring(4, 6), 16) || 0,
  ]
}

async function process(src: string, s: FlameSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 8293 + 41)
  const [br, bg, bb] = parseHex(s.colorBase)

  // Find bottom edge pixels
  ctx.getImageData(0, 0, w, h)

  // Draw flames rising from bottom and edges
  const flameCount = Math.floor(w * s.intensity * 0.3)
  ctx.globalCompositeOperation = 'screen'

  for (let i = 0; i < flameCount; i++) {
    const baseX = rng() * w
    const baseY = h - rng() * 10
    const flameH = s.height * (0.5 + rng() * 0.5)
    const flameW = 3 + rng() * 8

    // Draw individual flame tongue
    const grad = ctx.createLinearGradient(baseX, baseY, baseX, baseY - flameH)
    grad.addColorStop(0, `rgba(${br}, ${bg}, ${bb}, ${s.intensity})`)
    grad.addColorStop(0.3, `rgba(${Math.min(255, br + 30)}, ${Math.floor(bg * 0.7)}, 0, ${s.intensity * 0.7})`)
    grad.addColorStop(0.7, `rgba(${Math.floor(br * 0.6)}, ${Math.floor(bg * 0.3)}, 0, ${s.intensity * 0.3})`)
    grad.addColorStop(1, 'rgba(50, 10, 0, 0)')

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(baseX - flameW / 2, baseY)

    // Wavy flame shape
    const midX = baseX + (rng() - 0.5) * flameW * 2
    const midY = baseY - flameH * 0.5
    ctx.quadraticCurveTo(
      midX - flameW, midY,
      baseX + (rng() - 0.5) * 3, baseY - flameH,
    )
    ctx.quadraticCurveTo(
      midX + flameW, midY,
      baseX + flameW / 2, baseY,
    )
    ctx.closePath()
    ctx.fill()
  }

  ctx.globalCompositeOperation = 'source-over'

  // Add glow at base
  const glowGrad = ctx.createLinearGradient(0, h, 0, h - s.height * 0.3)
  glowGrad.addColorStop(0, `rgba(${br}, ${bg}, ${bb}, ${s.intensity * 0.4})`)
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = glowGrad
  ctx.fillRect(0, h - s.height * 0.3, w, s.height * 0.3)

  return canvas.toDataURL('image/png')
}

export const flameCache = createEffectCache<FlameSettings>({
  name: 'flame',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
