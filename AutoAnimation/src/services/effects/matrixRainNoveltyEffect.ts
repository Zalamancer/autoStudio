/**
 * Matrix Rain Novelty effect: falling matrix-style characters.
 * Animated: 8 seed variants cycled per frame.
 */

import type { MatrixRainNoveltySettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'
import { hexToRgb } from '@/utils/color'

function cacheKey(src: string, s: MatrixRainNoveltySettings, seed?: number): string {
  return `matrix-rain-n|${src}|${s.density}|${s.charSize}|${s.color}|${s.speed}|s${seed ?? 0}`
}

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CHARS = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ0123456789ABCDEFZ'

async function process(src: string, s: MatrixRainNoveltySettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w === 0 || h === 0) return src

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  // Dark overlay
  ctx.globalAlpha = 0.3
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 1

  const rng = mulberry32(seed * 7331 + 11)
  const [cr, cg, cb] = hexToRgb(s.color || '#00FF00')
  const cols = Math.floor(w / s.charSize)
  const streamCount = Math.floor(cols * s.density)

  ctx.font = `${s.charSize}px monospace`
  ctx.textAlign = 'center'

  for (let i = 0; i < streamCount; i++) {
    const col = Math.floor(rng() * cols)
    const x = col * s.charSize + s.charSize * 0.5
    const streamLen = 5 + Math.floor(rng() * 20)
    const startY = (rng() * h + seed * s.speed * s.charSize * 3) % (h + streamLen * s.charSize)

    for (let j = 0; j < streamLen; j++) {
      const y = startY + j * s.charSize
      if (y < 0 || y > h) continue
      const char = CHARS[Math.floor(rng() * CHARS.length)]
      const fade = j === 0 ? 1 : Math.max(0.1, 1 - j / streamLen)

      ctx.globalAlpha = fade * 0.8
      ctx.fillStyle = j === 0 ? '#FFFFFF' : `rgb(${cr},${cg},${cb})`
      ctx.fillText(char, x, y)
    }
  }

  ctx.globalAlpha = 1
  return canvas.toDataURL('image/png')
}

export const matrixRainNoveltyCache = createEffectCache<MatrixRainNoveltySettings>({
  name: 'matrix-rain-novelty',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
