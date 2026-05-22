import type { SakuraPetalsSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: SakuraPetalsSettings, seed?: number): string {
  return `sakura-petals|${src}|${s.density}|${s.fallSpeed}|${s.size}|${s.color}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function parseColor(hex: string): [number, number, number] {
  const c = parseInt(hex.replace('#', ''), 16)
  return [(c >> 16) & 255, (c >> 8) & 255, c & 255]
}

async function process(src: string, s: SakuraPetalsSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 7919 + 31)
  const count = Math.floor(s.density * 60) + 5
  const [cr, cg, cb] = parseColor(s.color)
  const petalSize = s.size * 3

  for (let i = 0; i < count; i++) {
    const px = rng() * w
    const py = (rng() * h * 1.2 - h * 0.1 + seed * s.fallSpeed * h * 0.1) % h
    const rot = rng() * Math.PI * 2
    const sz = petalSize * (0.5 + rng() * 0.5)
    const alpha = 0.3 + rng() * 0.5

    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(rot)
    ctx.globalAlpha = alpha
    ctx.fillStyle = `rgb(${cr},${cg},${cb})`
    ctx.beginPath()
    ctx.ellipse(0, 0, sz, sz * 0.5, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.ellipse(sz * 0.3, 0, sz * 0.8, sz * 0.4, Math.PI * 0.3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}

export const sakuraPetalsCache = createEffectCache<SakuraPetalsSettings>({
  name: 'sakura-petals',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
