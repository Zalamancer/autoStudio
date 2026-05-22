import type { SunbeamSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: SunbeamSettings, seed?: number): string {
  return `sunbeam|${src}|${s.rayCount}|${s.intensity}|${s.angle}|${s.warmth}|s${seed ?? 0}`
}

async function process(src: string, s: SunbeamSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const angleRad = (s.angle * Math.PI) / 180
  const warmR = Math.floor(255 * (0.8 + s.warmth * 0.2))
  const warmG = Math.floor(230 * (0.7 + s.warmth * 0.3))
  const warmB = Math.floor(180 * (1 - s.warmth * 0.5))

  for (let i = 0; i < s.rayCount; i++) {
    const frac = (i + 0.5) / s.rayCount
    const originX = frac * w
    const originY = -10
    const spread = (30 + i * 7) * (1 + Math.sin(seed * 0.3 + i) * 0.15)
    const rayLen = h * 1.5
    const endX1 = originX - spread + Math.cos(angleRad) * rayLen * 0.3
    const endX2 = originX + spread + Math.cos(angleRad) * rayLen * 0.3
    const endY = originY + Math.sin(Math.PI / 2 - angleRad * 0.2) * rayLen

    ctx.save()
    ctx.globalAlpha = s.intensity * (0.04 + Math.abs(Math.sin(seed * 0.2 + i * 1.3)) * 0.06)
    ctx.fillStyle = `rgb(${warmR},${warmG},${warmB})`
    ctx.beginPath()
    ctx.moveTo(originX - 2, originY)
    ctx.lineTo(originX + 2, originY)
    ctx.lineTo(endX2, endY)
    ctx.lineTo(endX1, endY)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // Warm color overlay
  if (s.warmth > 0.3) {
    ctx.globalAlpha = s.warmth * 0.06
    ctx.fillStyle = `rgb(${warmR},${warmG},${warmB})`
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = 1
  }

  return canvas.toDataURL('image/png')
}

export const sunbeamCache = createEffectCache<SunbeamSettings>({
  name: 'sunbeam',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
