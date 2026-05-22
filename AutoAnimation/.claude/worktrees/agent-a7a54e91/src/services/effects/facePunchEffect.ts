/**
 * Face Punch effect: Impact deformation with motion blur.
 */

import type { FacePunchSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: FacePunchSettings, seed?: number): string {
  return `face-punch|${src}|${s.impactX}|${s.impactY}|${s.force}|${s.motionBlur}|s${seed ?? 0}`
}

async function process(src: string, s: FacePunchSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const imageData = ctx.getImageData(0, 0, w, h)
  const d = imageData.data
  const out = new Uint8ClampedArray(d)

  const impX = s.impactX * w
  const impY = s.impactY * h
  const force = s.force
  const blurDist = s.motionBlur

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4
      if (d[idx + 3] === 0) continue

      const dx = x - impX; const dy = y - impY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const maxDist = Math.sqrt(w * w + h * h) * 0.5

      // Impact deformation: push pixels away from impact point
      const impactFalloff = Math.max(0, 1 - dist / maxDist)
      const pushStrength = impactFalloff * impactFalloff * force * 30
      const angle = Math.atan2(dy, dx)

      const pushX = Math.cos(angle) * pushStrength
      const pushY = Math.sin(angle) * pushStrength

      const sx = Math.max(0, Math.min(w - 1, Math.floor(x - pushX)))
      const sy = Math.max(0, Math.min(h - 1, Math.floor(y - pushY)))

      // Motion blur in impact direction
      if (blurDist > 0 && impactFalloff > 0.2) {
        const samples = Math.min(Math.floor(blurDist * impactFalloff), 10)
        let rSum = 0, gSum = 0, bSum = 0, aSum = 0
        for (let s2 = 0; s2 <= samples; s2++) {
          const t = s2 / Math.max(1, samples)
          const bx = Math.max(0, Math.min(w - 1, Math.floor(sx + Math.cos(angle) * t * blurDist * impactFalloff)))
          const by = Math.max(0, Math.min(h - 1, Math.floor(sy + Math.sin(angle) * t * blurDist * impactFalloff)))
          const bi = (by * w + bx) * 4
          rSum += d[bi]; gSum += d[bi + 1]; bSum += d[bi + 2]; aSum += d[bi + 3]
        }
        const count = samples + 1
        out[idx] = Math.floor(rSum / count)
        out[idx + 1] = Math.floor(gSum / count)
        out[idx + 2] = Math.floor(bSum / count)
        out[idx + 3] = Math.floor(aSum / count)
      } else {
        const si = (sy * w + sx) * 4
        out[idx] = d[si]; out[idx + 1] = d[si + 1]
        out[idx + 2] = d[si + 2]; out[idx + 3] = d[si + 3]
      }
    }
  }

  const outData = ctx.createImageData(w, h)
  outData.data.set(out)
  ctx.putImageData(outData, 0, 0)
  return canvas.toDataURL('image/png')
}

export const facePunchCache = createEffectCache<FacePunchSettings>({
  name: 'face-punch',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
