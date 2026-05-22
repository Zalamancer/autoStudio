/**
 * Confetti effect: colorful confetti particles.
 * Animated: 8 seed variants cycled per frame.
 */

import type { ConfettiSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: ConfettiSettings, seed?: number): string {
  return `confetti|${src}|${s.density}|${s.colors}|${s.size}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: ConfettiSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 6637 + 23)
  const colors = (s.colors || '#FF0000,#00FF00,#0000FF,#FFFF00,#FF00FF,#00FFFF').split(',').map(c => c.trim())
  const count = Math.floor(s.density * 80) + 10
  const sz = s.size * 4

  for (let i = 0; i < count; i++) {
    const cx = rng() * w
    const cy = (rng() * (h + sz * 2) + seed * s.speed * 30) % (h + sz * 2) - sz
    const rot = seed * s.speed * 3 + rng() * Math.PI * 2
    const color = colors[Math.floor(rng() * colors.length)]
    const pieceW = sz * (0.3 + rng() * 0.7)
    const pieceH = pieceW * (0.4 + rng() * 0.3)
    const scaleX = Math.cos(seed * 2 + i * 1.5)

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rot)
    ctx.scale(scaleX, 1)
    ctx.globalAlpha = 0.7 + rng() * 0.3
    ctx.fillStyle = color

    if (rng() > 0.5) {
      // Rectangle confetti
      ctx.fillRect(-pieceW * 0.5, -pieceH * 0.5, pieceW, pieceH)
    } else {
      // Circle confetti
      ctx.beginPath()
      ctx.arc(0, 0, pieceW * 0.4, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }

  ctx.globalAlpha = 1
  return canvas.toDataURL('image/png')
}

export const confettiCache = createEffectCache<ConfettiSettings>({
  name: 'confetti',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
