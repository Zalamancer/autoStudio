/**
 * Plasma effect: pulsating plasma energy field overlay.
 * Animated: cycles through seed variants per frame.
 */

import type { PlasmaSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: PlasmaSettings, seed?: number): string {
  return `plasma|${src}|${s.intensity}|${s.colorScheme}|${s.frequency}|${s.speed}|s${seed ?? 0}`
}

function getPlasmaColor(scheme: string, val: number): [number, number, number] {
  // val is 0-1
  switch (scheme) {
    case 'purple':
      return [Math.floor(80 + val * 175), Math.floor(val * 50), Math.floor(150 + val * 105)]
    case 'blue':
      return [Math.floor(val * 80), Math.floor(80 + val * 100), Math.floor(180 + val * 75)]
    case 'red':
      return [Math.floor(180 + val * 75), Math.floor(val * 60), Math.floor(val * 40)]
    case 'green':
      return [Math.floor(val * 60), Math.floor(150 + val * 105), Math.floor(val * 80)]
    default:
      return [Math.floor(80 + val * 175), Math.floor(val * 50), Math.floor(150 + val * 105)]
  }
}

async function process(src: string, s: PlasmaSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  // Generate plasma field
  const plasmaCanvas = document.createElement('canvas')
  plasmaCanvas.width = w
  plasmaCanvas.height = h
  const pCtx = plasmaCanvas.getContext('2d')!
  const plasmaData = pCtx.createImageData(w, h)
  const pd = plasmaData.data

  const freq = s.frequency * 8
  const time = seed * 0.5

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = x / w
      const ny = y / h

      // Classic plasma formula with multiple sine waves
      const v1 = Math.sin(nx * freq + time)
      const v2 = Math.sin(ny * freq + time * 1.3)
      const v3 = Math.sin((nx + ny) * freq * 0.7 + time * 0.7)
      const v4 = Math.sin(Math.sqrt((nx - 0.5) ** 2 + (ny - 0.5) ** 2) * freq * 2 + time * 1.5)
      const val = (v1 + v2 + v3 + v4 + 4) / 8 // Normalize to 0-1

      const [r, g, b] = getPlasmaColor(s.colorScheme, val)
      const idx = (y * w + x) * 4
      pd[idx] = r
      pd[idx + 1] = g
      pd[idx + 2] = b
      pd[idx + 3] = Math.floor(s.intensity * val * 180)
    }
  }

  pCtx.putImageData(plasmaData, 0, 0)

  // Blend plasma onto original image
  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(plasmaCanvas, 0, 0)
  ctx.globalCompositeOperation = 'source-over'

  return canvas.toDataURL('image/png')
}

export const plasmaCache = createEffectCache<PlasmaSettings>({
  name: 'plasma',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
