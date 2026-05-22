import type { EyeGlowSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: EyeGlowSettings, seed?: number): string {
  return `eye-glow|${src}|${s.color}|${s.intensity}|${s.radius}|${s.pulse}|s${seed ?? 0}`
}

async function process(src: string, s: EyeGlowSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imgData = ctx.getImageData(0, 0, w, h)
  const d = imgData.data

  // Detect bright spots (potential eye highlights)
  const spots: { x: number; y: number; b: number }[] = []
  const step = 3
  for (let y = Math.floor(h * 0.15); y < h * 0.55; y += step) {
    for (let x = Math.floor(w * 0.2); x < w * 0.8; x += step) {
      const idx = (y * w + x) * 4
      const brightness = d[idx] * 0.299 + d[idx + 1] * 0.587 + d[idx + 2] * 0.114
      if (brightness > 200 && d[idx + 3] > 200) {
        spots.push({ x, y, b: brightness })
      }
    }
  }

  // Sort by brightness, pick top spots
  spots.sort((a, b) => b.b - a.b)
  const eyeSpots = spots.slice(0, Math.min(6, spots.length))

  const gc = parseInt(s.color.replace('#', ''), 16)
  const gr = (gc >> 16) & 255, gg = (gc >> 8) & 255, gb = gc & 255
  const pulseScale = s.pulse ? (0.7 + Math.sin(seed * 0.8) * 0.3) : 1

  for (const spot of eyeSpots) {
    const rad = s.radius * pulseScale
    const grad = ctx.createRadialGradient(spot.x, spot.y, 0, spot.x, spot.y, rad)
    grad.addColorStop(0, `rgba(${gr},${gg},${gb},${s.intensity * 0.8})`)
    grad.addColorStop(0.4, `rgba(${gr},${gg},${gb},${s.intensity * 0.4})`)
    grad.addColorStop(1, `rgba(${gr},${gg},${gb},0)`)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(spot.x, spot.y, rad, 0, Math.PI * 2)
    ctx.fill()
  }

  return canvas.toDataURL('image/png')
}

export const eyeGlowCache = createEffectCache<EyeGlowSettings>({
  name: 'eye-glow',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
