import type { BlackTearsSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: BlackTearsSettings, seed?: number): string {
  return `black-tears|${src}|${s.streakCount}|${s.opacity}|${s.blurAmount}|${s.color}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: BlackTearsSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(42)
  const tc = parseInt(s.color.replace('#', ''), 16)
  const tr = (tc >> 16) & 255, tg = (tc >> 8) & 255, tb = tc & 255

  // Approximate eye positions
  const eyeY = h * 0.35
  const eyePositions = [
    { x: w * 0.35, y: eyeY },
    { x: w * 0.65, y: eyeY },
  ]

  if (s.blurAmount > 0) {
    ctx.filter = `blur(${s.blurAmount}px)`
  }

  for (const eye of eyePositions) {
    for (let si = 0; si < s.streakCount; si++) {
      const offsetX = (rng() - 0.5) * w * 0.06
      const startX = eye.x + offsetX
      const startY = eye.y + h * 0.02
      const streakLen = h * 0.15 + rng() * h * 0.2
      const width = 2 + rng() * 4

      ctx.save()
      ctx.globalAlpha = s.opacity * (0.5 + rng() * 0.5)
      ctx.strokeStyle = `rgb(${tr},${tg},${tb})`
      ctx.lineWidth = width
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(startX, startY)

      // Wobbly drip path
      let cx = startX, cy = startY
      const steps = 8
      for (let j = 1; j <= steps; j++) {
        cx += (rng() - 0.5) * 4
        cy += streakLen / steps
        ctx.lineTo(cx, cy)
      }
      ctx.stroke()

      // Drip at bottom
      ctx.fillStyle = `rgba(${tr},${tg},${tb},${s.opacity * 0.6})`
      ctx.beginPath()
      ctx.arc(cx, cy, width * 0.8, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  ctx.filter = 'none'
  return canvas.toDataURL('image/png')
}

export const blackTearsCache = createEffectCache<BlackTearsSettings>({
  name: 'black-tears',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
