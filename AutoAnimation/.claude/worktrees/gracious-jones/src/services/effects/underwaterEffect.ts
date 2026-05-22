import type { UnderwaterSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: UnderwaterSettings, seed?: number): string {
  return `underwater|${src}|${s.depth}|${s.caustics}|${s.fogDensity}|${s.bubbles}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: UnderwaterSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  // Deep water color tint (blue-green gradient deepening)
  const depthAlpha = s.depth * 0.4
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, `rgba(0,60,120,${depthAlpha * 0.5})`)
  grad.addColorStop(1, `rgba(0,20,60,${depthAlpha})`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)

  // Fog density
  if (s.fogDensity > 0) {
    ctx.globalAlpha = s.fogDensity * 0.3
    ctx.fillStyle = '#0a3050'
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 1
  }

  // Caustic light overlay
  const rng = mulberry32(seed * 4801 + 29)
  if (s.caustics > 0) {
    const causticCount = Math.floor(s.caustics * 20) + 3
    for (let i = 0; i < causticCount; i++) {
      const cx = rng() * w
      const cy = rng() * h * 0.6
      const rx = 30 + rng() * 80
      const ry = 15 + rng() * 50
      const rot = rng() * Math.PI + seed * 0.2

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(rot)
      ctx.globalAlpha = 0.05 + rng() * 0.06 * s.caustics
      ctx.fillStyle = '#88ccff'
      ctx.beginPath()
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  // Bubbles
  if (s.bubbles) {
    const bubbleCount = 10 + Math.floor(rng() * 20)
    const riseOffset = seed * h * 0.08
    for (let i = 0; i < bubbleCount; i++) {
      const bx = rng() * w
      const by = ((rng() * h) - riseOffset) % h
      const br = 1 + rng() * 4

      ctx.save()
      ctx.globalAlpha = 0.2 + rng() * 0.3
      ctx.strokeStyle = 'rgba(180,220,255,0.6)'
      ctx.lineWidth = 0.5
      ctx.beginPath()
      ctx.arc(bx, by < 0 ? by + h : by, br, 0, Math.PI * 2)
      ctx.stroke()
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.beginPath()
      ctx.arc(bx - br * 0.3, (by < 0 ? by + h : by) - br * 0.3, br * 0.3, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  return canvas.toDataURL('image/png')
}

export const underwaterCache = createEffectCache<UnderwaterSettings>({
  name: 'underwater',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
