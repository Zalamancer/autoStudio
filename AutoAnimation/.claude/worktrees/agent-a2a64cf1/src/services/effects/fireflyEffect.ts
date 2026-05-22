import type { FireflySettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: FireflySettings, seed?: number): string {
  return `firefly|${src}|${s.count}|${s.brightness}|${s.wanderSpeed}|${s.color}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: FireflySettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 8111 + 23)
  const gc = parseInt(s.color.replace('#', ''), 16)
  const gr = (gc >> 16) & 255, gg = (gc >> 8) & 255, gb = gc & 255
  const phase = seed * s.wanderSpeed * 0.5

  for (let i = 0; i < s.count; i++) {
    const baseX = rng() * w
    const baseY = rng() * h
    const fx = baseX + Math.sin(phase + i * 3.7) * 15 * s.wanderSpeed
    const fy = baseY + Math.cos(phase + i * 2.3) * 15 * s.wanderSpeed
    const flicker = 0.3 + Math.abs(Math.sin(phase * 3 + i * 1.9)) * 0.7
    const radius = 2 + rng() * 4

    ctx.save()
    ctx.globalAlpha = s.brightness * flicker
    const grad = ctx.createRadialGradient(fx, fy, 0, fx, fy, radius * 4)
    grad.addColorStop(0, `rgba(${gr},${gg},${gb},1)`)
    grad.addColorStop(0.3, `rgba(${gr},${gg},${gb},0.5)`)
    grad.addColorStop(1, `rgba(${gr},${gg},${gb},0)`)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(fx, fy, radius * 4, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = `rgb(${Math.min(255, gr + 50)},${Math.min(255, gg + 50)},${Math.min(255, gb + 50)})`
    ctx.beginPath()
    ctx.arc(fx, fy, radius * 0.5, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  return canvas.toDataURL('image/png')
}

export const fireflyCache = createEffectCache<FireflySettings>({
  name: 'firefly',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
