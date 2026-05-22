import type { LaserEyesSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: LaserEyesSettings, seed?: number): string {
  return `laser-eyes|${src}|${s.color}|${s.beamWidth}|${s.intensity}|${s.length}|s${seed ?? 0}`
}

async function process(src: string, s: LaserEyesSettings, seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  const lc = parseInt(s.color.replace('#', ''), 16)
  const lr = (lc >> 16) & 255, lg = (lc >> 8) & 255, lb = lc & 255

  // Eye positions (approximate)
  const eyes = [
    { x: w * 0.37, y: h * 0.33 },
    { x: w * 0.63, y: h * 0.33 },
  ]

  const pulseIntensity = 0.7 + Math.sin(seed * 0.6) * 0.3

  for (const eye of eyes) {
    const beamLen = s.length * pulseIntensity
    const endX = eye.x + beamLen * 0.3
    const endY = eye.y + beamLen * 0.1

    // Outer glow
    ctx.save()
    ctx.globalAlpha = s.intensity * 0.3 * pulseIntensity
    ctx.strokeStyle = `rgb(${lr},${lg},${lb})`
    ctx.lineWidth = s.beamWidth * 3
    ctx.lineCap = 'round'
    ctx.filter = `blur(${s.beamWidth}px)`
    ctx.beginPath()
    ctx.moveTo(eye.x, eye.y)
    ctx.lineTo(endX, endY)
    ctx.stroke()
    ctx.restore()

    // Core beam
    ctx.save()
    ctx.globalAlpha = s.intensity * pulseIntensity
    const grad = ctx.createLinearGradient(eye.x, eye.y, endX, endY)
    grad.addColorStop(0, `rgba(255,255,255,0.9)`)
    grad.addColorStop(0.1, `rgba(${lr},${lg},${lb},1)`)
    grad.addColorStop(1, `rgba(${lr},${lg},${lb},0)`)
    ctx.strokeStyle = grad
    ctx.lineWidth = s.beamWidth
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(eye.x, eye.y)
    ctx.lineTo(endX, endY)
    ctx.stroke()
    ctx.restore()

    // Eye glow
    const eyeGrad = ctx.createRadialGradient(eye.x, eye.y, 0, eye.x, eye.y, s.beamWidth * 3)
    eyeGrad.addColorStop(0, `rgba(255,255,255,${s.intensity * 0.8 * pulseIntensity})`)
    eyeGrad.addColorStop(0.3, `rgba(${lr},${lg},${lb},${s.intensity * 0.5 * pulseIntensity})`)
    eyeGrad.addColorStop(1, `rgba(${lr},${lg},${lb},0)`)
    ctx.fillStyle = eyeGrad
    ctx.beginPath()
    ctx.arc(eye.x, eye.y, s.beamWidth * 3, 0, Math.PI * 2)
    ctx.fill()
  }

  return canvas.toDataURL('image/png')
}

export const laserEyesCache = createEffectCache<LaserEyesSettings>({
  name: 'laser-eyes',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
