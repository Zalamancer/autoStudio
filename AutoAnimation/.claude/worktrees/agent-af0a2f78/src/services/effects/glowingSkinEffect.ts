import type { GlowingSkinSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: GlowingSkinSettings, seed?: number): string {
  return `glowing-skin|${src}|${s.intensity}|${s.color}|${s.radius}|${s.bloom}|s${seed ?? 0}`
}

async function process(src: string, s: GlowingSkinSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const gc = parseInt(s.color.replace('#', ''), 16)
  const gr = (gc >> 16) & 255, gg = (gc >> 8) & 255, gb = gc & 255

  // Create bloom layer - blurred copy of the image
  const bloomCanvas = document.createElement('canvas')
  bloomCanvas.width = w; bloomCanvas.height = h
  const bCtx = bloomCanvas.getContext('2d')!
  bCtx.filter = `blur(${s.radius}px)`
  bCtx.drawImage(img, 0, 0)
  bCtx.filter = 'none'

  // Tint the bloom layer
  bCtx.globalCompositeOperation = 'multiply'
  bCtx.fillStyle = `rgb(${gr},${gg},${gb})`
  bCtx.fillRect(0, 0, w, h)
  bCtx.globalCompositeOperation = 'source-over'

  // Blend bloom onto original
  ctx.globalAlpha = s.intensity * 0.5
  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(bloomCanvas, 0, 0)

  // Add bloom glow
  if (s.bloom > 0) {
    ctx.globalAlpha = s.bloom * 0.3
    ctx.globalCompositeOperation = 'lighter'
    bCtx.filter = `blur(${s.radius * 2}px)`
    bCtx.clearRect(0, 0, w, h)
    bCtx.drawImage(img, 0, 0)
    bCtx.filter = 'none'
    ctx.drawImage(bloomCanvas, 0, 0)
  }

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'

  return canvas.toDataURL('image/png')
}

export const glowingSkinCache = createEffectCache<GlowingSkinSettings>({
  name: 'glowing-skin',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
