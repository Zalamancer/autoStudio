/**
 * Smoke effect: billowing smoke overlay with configurable rise and color.
 * Animated: cycles through seed variants per frame.
 */

import type { SmokeSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: SmokeSettings, seed?: number): string {
  return `smoke|${src}|${s.density}|${s.riseSpeed}|${s.color}|${s.opacity}|s${seed ?? 0}`
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
    parseInt(c.substring(0, 2), 16) || 80,
    parseInt(c.substring(2, 4), 16) || 80,
    parseInt(c.substring(4, 6), 16) || 80,
  ]
}

async function process(src: string, s: SmokeSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 6571 + 43)
  const [sr, sg, sb] = parseHex(s.color)

  // Draw smoke puffs
  const puffCount = Math.floor(s.density * 50)
  const riseOffset = seed * s.riseSpeed * 15

  for (let i = 0; i < puffCount; i++) {
    const baseX = rng() * w
    const baseY = h * (0.3 + rng() * 0.7) - riseOffset % (h * 0.5)
    const radius = 15 + rng() * 40
    const alpha = s.opacity * (0.1 + rng() * 0.3)

    // Multi-layer smoke puff for soft look
    for (let layer = 0; layer < 3; layer++) {
      const lx = baseX + (rng() - 0.5) * radius * 0.5
      const ly = baseY + (rng() - 0.5) * radius * 0.3
      const lr = radius * (0.6 + layer * 0.2)

      const grad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr)
      grad.addColorStop(0, `rgba(${sr}, ${sg}, ${sb}, ${alpha})`)
      grad.addColorStop(0.5, `rgba(${sr}, ${sg}, ${sb}, ${alpha * 0.5})`)
      grad.addColorStop(1, `rgba(${sr}, ${sg}, ${sb}, 0)`)

      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(lx, ly, lr, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Atmospheric haze at bottom
  const hazeGrad = ctx.createLinearGradient(0, h * 0.7, 0, h)
  hazeGrad.addColorStop(0, `rgba(${sr}, ${sg}, ${sb}, 0)`)
  hazeGrad.addColorStop(1, `rgba(${sr}, ${sg}, ${sb}, ${s.opacity * 0.2})`)
  ctx.fillStyle = hazeGrad
  ctx.fillRect(0, h * 0.7, w, h * 0.3)

  return canvas.toDataURL('image/png')
}

export const smokeCache = createEffectCache<SmokeSettings>({
  name: 'smoke',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
