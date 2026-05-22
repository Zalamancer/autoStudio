/**
 * Lava Flow effect: molten lava veins across image with glowing heat.
 * Animated: cycles through seed variants per frame.
 */

import type { LavaFlowSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: LavaFlowSettings, seed?: number): string {
  return `lava-flow|${src}|${s.flowSpeed}|${s.glowIntensity}|${s.veinWidth}|${s.temperature}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: LavaFlowSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const rng = mulberry32(seed * 4391 + 71)

  // Darken base to simulate cooled rock
  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue
    d[i] = Math.floor(d[i] * 0.6)
    d[i + 1] = Math.floor(d[i + 1] * 0.5)
    d[i + 2] = Math.floor(d[i + 2] * 0.4)
  }
  ctx.putImageData(imageData, 0, 0)

  // Draw lava veins
  const veinCount = 5 + Math.floor(rng() * 10)
  ctx.globalCompositeOperation = 'screen'

  for (let v = 0; v < veinCount; v++) {
    let vx = rng() * w
    let vy = rng() * h
    const segments = 10 + Math.floor(rng() * 20)

    // Lava color based on temperature
    const r = Math.min(255, 200 + s.temperature * 55)
    const g = Math.floor(50 + s.temperature * 100)
    const b = Math.floor(s.temperature * 30)

    // Glow around vein
    ctx.shadowColor = `rgba(${r}, ${g}, 0, ${s.glowIntensity})`
    ctx.shadowBlur = s.veinWidth * 3
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${0.6 + s.glowIntensity * 0.4})`
    ctx.lineWidth = s.veinWidth
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    ctx.beginPath()
    ctx.moveTo(vx, vy)

    for (let seg = 0; seg < segments; seg++) {
      const phase = seed * 0.5 + seg * 0.3
      vx += (rng() - 0.5) * 30 + Math.sin(phase) * 10 * s.flowSpeed
      vy += rng() * 20 + 5
      ctx.lineTo(Math.max(0, Math.min(w, vx)), Math.max(0, Math.min(h, vy)))
    }
    ctx.stroke()

    // Hot spots along vein
    ctx.beginPath()
    for (let seg = 0; seg < segments; seg++) {
      if (rng() > 0.5) {
        const hx = rng() * w
        const hy = rng() * h
        const hr = s.veinWidth * (1 + rng() * 2)
        const grad = ctx.createRadialGradient(hx, hy, 0, hx, hy, hr)
        grad.addColorStop(0, `rgba(255, ${g + 50}, ${b + 20}, ${s.glowIntensity})`)
        grad.addColorStop(1, 'rgba(255, 50, 0, 0)')
        ctx.fillStyle = grad
        ctx.fillRect(hx - hr, hy - hr, hr * 2, hr * 2)
      }
    }
  }

  ctx.shadowBlur = 0
  ctx.shadowColor = 'transparent'
  ctx.globalCompositeOperation = 'source-over'

  return canvas.toDataURL('image/png')
}

export const lavaFlowCache = createEffectCache<LavaFlowSettings>({
  name: 'lava-flow',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
