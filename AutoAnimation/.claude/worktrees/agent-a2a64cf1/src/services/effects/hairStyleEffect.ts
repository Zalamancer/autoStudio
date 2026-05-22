import type { HairStyleSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: HairStyleSettings, seed?: number): string {
  return `hair-style|${src}|${s.color}|${s.coverage}|${s.blendMode}|${s.gradient}|s${seed ?? 0}`
}

async function process(src: string, s: HairStyleSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const hc = parseInt(s.color.replace('#', ''), 16)
  const hr = (hc >> 16) & 255, hg = (hc >> 8) & 255, hb = hc & 255
  const coverageH = h * s.coverage

  // Create tint overlay for upper portion
  const tintCanvas = document.createElement('canvas')
  tintCanvas.width = w; tintCanvas.height = h
  const tCtx = tintCanvas.getContext('2d')!

  if (s.gradient) {
    const grad = tCtx.createLinearGradient(0, 0, 0, coverageH)
    grad.addColorStop(0, `rgba(${hr},${hg},${hb},0.6)`)
    grad.addColorStop(0.7, `rgba(${hr},${hg},${hb},0.3)`)
    grad.addColorStop(1, `rgba(${hr},${hg},${hb},0)`)
    tCtx.fillStyle = grad
  } else {
    tCtx.fillStyle = `rgba(${hr},${hg},${hb},0.4)`
  }
  tCtx.fillRect(0, 0, w, coverageH)

  // Use alpha from original image as mask
  const srcData = ctx.getImageData(0, 0, w, h)
  const tintData = tCtx.getImageData(0, 0, w, h)
  for (let i = 3; i < tintData.data.length; i += 4) {
    tintData.data[i] = Math.min(tintData.data[i], srcData.data[i])
  }
  tCtx.putImageData(tintData, 0, 0)

  ctx.globalCompositeOperation = s.blendMode === 'multiply' ? 'multiply' : 'overlay'
  ctx.drawImage(tintCanvas, 0, 0)
  ctx.globalCompositeOperation = 'source-over'

  return canvas.toDataURL('image/png')
}

export const hairStyleCache = createEffectCache<HairStyleSettings>({
  name: 'hair-style',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
