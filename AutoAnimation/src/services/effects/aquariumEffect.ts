import type { AquariumSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: AquariumSettings, seed?: number): string {
  return `aquarium|${src}|${s.causticIntensity}|${s.waterColor}|${s.lightRays}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: AquariumSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  // Water tint overlay
  const wc = parseInt(s.waterColor.replace('#', ''), 16)
  const wr = (wc >> 16) & 255, wg = (wc >> 8) & 255, wb = wc & 255
  ctx.globalAlpha = 0.25
  ctx.fillStyle = `rgb(${wr},${wg},${wb})`
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 1

  // Caustic light patterns
  const rng = mulberry32(seed * 4219 + 53)
  const phase = seed * s.speed * 0.3
  const causticCount = Math.floor(s.causticIntensity * 30) + 5

  for (let i = 0; i < causticCount; i++) {
    const cx = rng() * w
    const cy = rng() * h
    const rx = 20 + rng() * 60
    const ry = 10 + rng() * 40
    const rot = rng() * Math.PI + phase * 0.2

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)
    ctx.globalAlpha = 0.06 + rng() * 0.08 * s.causticIntensity
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // Light rays from top
  if (s.lightRays) {
    const rayCount = 5
    for (let i = 0; i < rayCount; i++) {
      const rx = (i / rayCount) * w + Math.sin(phase + i) * 30
      const rw = 20 + rng() * 40
      const grad = ctx.createLinearGradient(rx, 0, rx + rw * 0.5, h)
      grad.addColorStop(0, 'rgba(255,255,220,0.12)')
      grad.addColorStop(1, 'rgba(255,255,220,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.moveTo(rx - rw / 2, 0)
      ctx.lineTo(rx + rw / 2, 0)
      ctx.lineTo(rx + rw, h)
      ctx.lineTo(rx - rw * 0.5, h)
      ctx.closePath()
      ctx.fill()
    }
  }

  return canvas.toDataURL('image/png')
}

export const aquariumCache = createEffectCache<AquariumSettings>({
  name: 'aquarium',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
