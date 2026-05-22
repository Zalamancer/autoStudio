import type { SnowSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: SnowSettings, seed?: number): string {
  return `snow|${src}|${s.density}|${s.flakeSize}|${s.windDrift}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: SnowSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 6841 + 19)
  const count = Math.floor(s.density * 200) + 10
  const fallOffset = seed * s.speed * h * 0.1

  for (let i = 0; i < count; i++) {
    const drift = Math.sin(seed * s.speed * 0.3 + i * 0.7) * s.windDrift * 20
    const x = (rng() * w + drift) % w
    const y = ((rng() * h * 1.3) + fallOffset) % (h * 1.2) - h * 0.1
    const r = s.flakeSize * (0.5 + rng() * 0.8)
    const alpha = 0.4 + rng() * 0.5

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(200,220,255,0.6)'
    ctx.shadowBlur = r * 2
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}

export const snowCache = createEffectCache<SnowSettings>({
  name: 'snow',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
