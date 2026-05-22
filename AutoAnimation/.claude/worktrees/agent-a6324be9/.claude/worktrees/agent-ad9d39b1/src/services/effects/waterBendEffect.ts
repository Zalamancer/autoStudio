/**
 * Water Bend effect: liquid wave distortion across the image.
 * Animated: cycles through seed variants per frame.
 */

import type { WaterBendSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: WaterBendSettings, seed?: number): string {
  return `water-bend|${src}|${s.amplitude}|${s.frequency}|${s.viscosity}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

async function process(src: string, s: WaterBendSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const out = new Uint8ClampedArray(d.length)
  out.set(d)
  const rng = mulberry32(seed * 4217 + 7)

  const amp = s.amplitude
  const freq = s.frequency
  const visc = 1 - s.viscosity // Higher viscosity = less displacement
  const phase = seed * 0.8

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x / w
      const ny = y / h
      // Multi-layered wave displacement for liquid feel
      const wave1 = Math.sin(ny * freq * Math.PI * 2 + phase) * amp * visc
      const wave2 = Math.sin(nx * freq * 1.5 * Math.PI * 2 + phase * 1.3) * amp * 0.5 * visc
      const wave3 = Math.cos((nx + ny) * freq * Math.PI + phase * 0.7) * amp * 0.3 * visc
      const noise = (rng() - 0.5) * amp * 0.2 * visc

      const dx = wave1 + wave3 + noise
      const dy = wave2 + noise * 0.5

      const srcX = Math.max(0, Math.min(w - 1, Math.round(x + dx)))
      const srcY = Math.max(0, Math.min(h - 1, Math.round(y + dy)))
      const dstIdx = (y * w + x) * 4
      const srcIdx = (srcY * w + srcX) * 4
      out[dstIdx] = d[srcIdx]
      out[dstIdx + 1] = d[srcIdx + 1]
      out[dstIdx + 2] = d[srcIdx + 2]
      out[dstIdx + 3] = d[srcIdx + 3]
    }
  }

  // Slight blue tint for water feel
  for (let i = 0; i < out.length; i += 4) {
    if (out[i + 3] === 0) continue
    out[i] = Math.max(0, out[i] - 5)      // reduce red
    out[i + 1] = Math.max(0, out[i + 1] - 2) // reduce green slightly
    out[i + 2] = Math.min(255, out[i + 2] + 8) // boost blue
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const waterBendCache = createEffectCache<WaterBendSettings>({
  name: 'water-bend',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
