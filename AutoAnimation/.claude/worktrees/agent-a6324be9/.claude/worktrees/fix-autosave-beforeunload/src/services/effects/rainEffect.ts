import type { RainSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: RainSettings, seed?: number): string {
  return `rain|${src}|${s.intensity}|${s.dropLength}|${s.windAngle}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: RainSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  // Slight darkening for rain mood
  ctx.globalAlpha = 0.15
  ctx.fillStyle = '#1a2a3a'
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 1

  const rng = mulberry32(seed * 5501 + 37)
  const count = Math.floor(s.intensity * 300) + 20
  const angleRad = (s.windAngle * Math.PI) / 180
  const dx = Math.sin(angleRad)
  const dy = Math.cos(angleRad)
  const fallOffset = seed * s.speed * h * 0.15

  ctx.strokeStyle = 'rgba(180,200,220,0.4)'
  ctx.lineWidth = 1

  for (let i = 0; i < count; i++) {
    const x = rng() * w * 1.3 - w * 0.15
    const y = ((rng() * h * 1.5 - h * 0.25) + fallOffset) % (h * 1.3) - h * 0.15
    const len = s.dropLength * (0.6 + rng() * 0.4)
    const alpha = 0.15 + rng() * 0.3

    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + dx * len, y + dy * len)
    ctx.stroke()
  }

  ctx.globalAlpha = 1
  return canvas.toDataURL('image/png')
}

export const rainCache = createEffectCache<RainSettings>({
  name: 'rain',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
