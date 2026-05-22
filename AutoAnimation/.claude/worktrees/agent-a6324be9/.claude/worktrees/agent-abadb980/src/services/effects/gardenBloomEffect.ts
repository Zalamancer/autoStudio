import type { GardenBloomSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: GardenBloomSettings, seed?: number): string {
  return `garden-bloom|${src}|${s.bloomCount}|${s.colorPalette}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

const PALETTES: Record<string, string[]> = {
  spring: ['#FFB7C5', '#FF69B4', '#98FB98', '#FFD700', '#DDA0DD'],
  summer: ['#FF6347', '#FF4500', '#FFD700', '#32CD32', '#FF1493'],
  autumn: ['#D2691E', '#B22222', '#DAA520', '#CD853F', '#8B4513'],
}

async function process(src: string, s: GardenBloomSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 6271 + 17)
  const colors = PALETTES[s.colorPalette] || PALETTES.spring
  const progress = (seed * 0.15) % 1

  for (let i = 0; i < s.bloomCount; i++) {
    const edge = Math.floor(rng() * 4)
    let bx: number, by: number
    if (edge === 0) { bx = rng() * w; by = h - rng() * h * 0.3 }
    else if (edge === 1) { bx = rng() * w; by = rng() * h * 0.3 }
    else if (edge === 2) { bx = rng() * w * 0.3; by = rng() * h }
    else { bx = w - rng() * w * 0.3; by = rng() * h }

    const color = colors[Math.floor(rng() * colors.length)]
    const sz = (8 + rng() * 12) * Math.min(1, progress * s.speed * 0.5 + 0.3)
    const petals = 5 + Math.floor(rng() * 3)

    ctx.save()
    ctx.translate(bx, by)
    ctx.globalAlpha = 0.4 + rng() * 0.4

    for (let p = 0; p < petals; p++) {
      const angle = (p / petals) * Math.PI * 2
      ctx.save()
      ctx.rotate(angle)
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.ellipse(sz * 0.5, 0, sz * 0.5, sz * 0.25, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(0, 0, sz * 0.15, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}

export const gardenBloomCache = createEffectCache<GardenBloomSettings>({
  name: 'garden-bloom',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
