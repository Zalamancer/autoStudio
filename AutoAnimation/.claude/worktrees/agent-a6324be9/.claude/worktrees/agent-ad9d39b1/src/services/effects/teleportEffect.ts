/**
 * Teleport effect: particle dissolve/materialize effect.
 * Static: progress controls dissolve amount.
 */

import type { TeleportSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: TeleportSettings, seed?: number): string {
  return `teleport|${src}|${s.progress}|${s.particleSize}|${s.direction}|${s.color}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

function parseHex(hex: string): [number, number, number] {
  const c = hex.replace('#', '')
  return [
    parseInt(c.substring(0, 2), 16) || 100,
    parseInt(c.substring(2, 4), 16) || 200,
    parseInt(c.substring(4, 6), 16) || 255,
  ]
}

async function process(src: string, s: TeleportSettings, seed = 0): Promise<string> {
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
  const rng = mulberry32(seed * 8831 + 43)
  const [cr, cg, cb] = parseHex(s.color)
  const pSize = s.particleSize

  // Dissolve: remove pixels based on progress threshold
  // Use a noise-based threshold so dissolution looks organic
  const particleCanvas = document.createElement('canvas')
  particleCanvas.width = w
  particleCanvas.height = h
  const pCtx = particleCanvas.getContext('2d')!

  for (let y = 0; y < h; y += pSize) {
    for (let x = 0; x < w; x += pSize) {
      // Noise threshold for this block
      const ny = y / h
      let threshold: number

      if (s.direction === 'up') {
        threshold = 1 - ny + (rng() - 0.5) * 0.4
      } else if (s.direction === 'down') {
        threshold = ny + (rng() - 0.5) * 0.4
      } else {
        // scatter
        threshold = rng()
      }

      if (threshold < s.progress) {
        // This block dissolves: remove from main, add as floating particle
        const particleAlpha = 1 - (s.progress - threshold) * 3
        if (particleAlpha > 0) {
          // Get average color of this block
          let sr = 0, sg = 0, sb = 0, count = 0
          for (let py = y; py < Math.min(h, y + pSize); py++) {
            for (let px = x; px < Math.min(w, x + pSize); px++) {
              const idx = (py * w + px) * 4
              if (d[idx + 3] > 0) {
                sr += d[idx]; sg += d[idx + 1]; sb += d[idx + 2]; count++
              }
            }
          }

          if (count > 0) {
            sr = Math.round(sr / count)
            sg = Math.round(sg / count)
            sb = Math.round(sb / count)

            // Draw floating particle with displacement
            let dx = 0, dy = 0
            const drift = s.progress * 30
            if (s.direction === 'up') { dy = -drift * rng(); dx = (rng() - 0.5) * drift }
            else if (s.direction === 'down') { dy = drift * rng(); dx = (rng() - 0.5) * drift }
            else { dx = (rng() - 0.5) * drift * 2; dy = (rng() - 0.5) * drift * 2 }

            // Blend particle color with effect color
            const blend = 0.3
            const pr = Math.round(sr * (1 - blend) + cr * blend)
            const pg = Math.round(sg * (1 - blend) + cg * blend)
            const pb = Math.round(sb * (1 - blend) + cb * blend)

            pCtx.fillStyle = `rgba(${pr}, ${pg}, ${pb}, ${particleAlpha * 0.8})`
            pCtx.fillRect(x + dx, y + dy, pSize, pSize)
          }
        }

        // Remove from source
        for (let py = y; py < Math.min(h, y + pSize); py++) {
          for (let px = x; px < Math.min(w, x + pSize); px++) {
            const idx = (py * w + px) * 4
            d[idx + 3] = 0
          }
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0)
  ctx.drawImage(particleCanvas, 0, 0)

  return canvas.toDataURL('image/png')
}

export const teleportCache = createEffectCache<TeleportSettings>({
  name: 'teleport',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
