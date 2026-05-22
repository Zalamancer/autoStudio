/**
 * Sand Storm effect: sandy particle overlay with wind-driven blur.
 * Animated: cycles through seed variants per frame.
 */

import type { SandStormSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: SandStormSettings, seed?: number): string {
  return `sand-storm|${src}|${s.density}|${s.particleSize}|${s.windAngle}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: SandStormSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 7213 + 37)
  const windRad = (s.windAngle * Math.PI) / 180
  const cosWind = Math.cos(windRad)
  const sinWind = Math.sin(windRad)

  // Apply sandy color cast
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const sandTint = s.density * 0.3
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    d[i] = Math.min(255, d[i] + sandTint * 40)     // warm red
    d[i + 1] = Math.min(255, d[i + 1] + sandTint * 25) // warm green
    d[i + 2] = Math.max(0, d[i + 2] - sandTint * 15)  // reduce blue
  }
  ctx.putImageData(imageData, 0, 0)

  // Draw sand particles as wind-streaked dots
  const particleCount = Math.floor(s.density * 800)
  for (let i = 0; i < particleCount; i++) {
    const px = rng() * w
    const py = rng() * h
    const size = s.particleSize * (0.5 + rng())
    const streakLen = size * (2 + rng() * 4)
    const alpha = 0.1 + rng() * 0.4 * s.density

    // Sand colors: tan to brown
    const r = 180 + Math.floor(rng() * 60)
    const g = 150 + Math.floor(rng() * 50)
    const b = 80 + Math.floor(rng() * 40)

    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
    ctx.lineWidth = size
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(px + cosWind * streakLen, py + sinWind * streakLen)
    ctx.stroke()
  }

  // Overall dust haze overlay
  ctx.fillStyle = `rgba(200, 170, 120, ${s.density * 0.15})`
  ctx.fillRect(0, 0, w, h)

  return canvas.toDataURL('image/png')
}

export const sandStormCache = createEffectCache<SandStormSettings>({
  name: 'sand-storm',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
