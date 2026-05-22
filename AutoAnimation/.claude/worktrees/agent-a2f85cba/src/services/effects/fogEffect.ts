import type { FogSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: FogSettings, seed?: number): string {
  return `fog|${src}|${s.density}|${s.height}|${s.color}|${s.drift}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: FogSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const fc = parseInt(s.color.replace('#', ''), 16)
  const fr = (fc >> 16) & 255, fg = (fc >> 8) & 255, fb = fc & 255
  const rng = mulberry32(seed * 3001 + 13)
  const driftOffset = seed * s.drift * w * 0.05

  // Fog layers - multiple overlapping ellipses
  const layerCount = 5 + Math.floor(s.density * 10)
  const fogTop = h * (1 - s.height)

  for (let i = 0; i < layerCount; i++) {
    const cx = (rng() * w * 1.5 - w * 0.25 + driftOffset) % (w * 1.5) - w * 0.25
    const cy = fogTop + rng() * h * s.height
    const rx = w * 0.3 + rng() * w * 0.5
    const ry = h * 0.05 + rng() * h * 0.15
    const alpha = s.density * (0.08 + rng() * 0.12)

    ctx.save()
    ctx.globalAlpha = alpha
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry))
    grad.addColorStop(0, `rgba(${fr},${fg},${fb},1)`)
    grad.addColorStop(0.5, `rgba(${fr},${fg},${fb},0.6)`)
    grad.addColorStop(1, `rgba(${fr},${fg},${fb},0)`)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Bottom fog gradient
  const bottomGrad = ctx.createLinearGradient(0, fogTop, 0, h)
  bottomGrad.addColorStop(0, `rgba(${fr},${fg},${fb},0)`)
  bottomGrad.addColorStop(1, `rgba(${fr},${fg},${fb},${s.density * 0.3})`)
  ctx.fillStyle = bottomGrad
  ctx.fillRect(0, fogTop, w, h - fogTop)

  return canvas.toDataURL('image/png')
}

export const fogCache = createEffectCache<FogSettings>({
  name: 'fog',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
