/**
 * Rotation 3D effect: Perspective skew simulating 3D rotation.
 */

import type { Rotation3dSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: Rotation3dSettings, seed?: number): string {
  return `rotation3d|${src}|${s.rotateX}|${s.rotateY}|${s.perspective}|s${seed ?? 0}`
}

async function process(src: string, s: Rotation3dSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!

  const imageData = (() => {
    const tmpCanvas = document.createElement('canvas')
    tmpCanvas.width = w; tmpCanvas.height = h
    const tmpCtx = tmpCanvas.getContext('2d')!
    tmpCtx.drawImage(img, 0, 0)
    return tmpCtx.getImageData(0, 0, w, h)
  })()
  const d = imageData.data
  const out = ctx.createImageData(w, h)
  const od = out.data

  const cx = w / 2; const cy = h / 2
  const radX = (s.rotateX * Math.PI) / 180
  const radY = (s.rotateY * Math.PI) / 180
  const perspective = s.perspective
  const cosX = Math.cos(radX); const sinX = Math.sin(radX)
  const cosY = Math.cos(radY); const sinY = Math.sin(radY)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4

      // Normalize to -1..1
      let nx = (x - cx) / cx
      let ny = (y - cy) / cy

      // Apply Y rotation (horizontal turn)
      let z = 0
      const x2 = nx * cosY - z * sinY
      z = nx * sinY + z * cosY
      nx = x2

      // Apply X rotation (vertical tilt)
      const y2 = ny * cosX - z * sinX
      z = ny * sinX + z * cosX
      ny = y2

      // Perspective projection
      const scale = perspective / (perspective + z * 100)
      const sx = Math.floor(nx * scale * cx + cx)
      const sy = Math.floor(ny * scale * cy + cy)

      if (sx >= 0 && sx < w && sy >= 0 && sy < h) {
        const si = (sy * w + sx) * 4
        od[idx] = d[si]; od[idx + 1] = d[si + 1]
        od[idx + 2] = d[si + 2]; od[idx + 3] = d[si + 3]
      }
    }
  }

  ctx.putImageData(out, 0, 0)
  return canvas.toDataURL('image/png')
}

export const rotation3dCache = createEffectCache<Rotation3dSettings>({
  name: 'rotation3d',
  maxEntries: 50,
  cacheKeyFn: cacheKey,
  processFn: process,
})
