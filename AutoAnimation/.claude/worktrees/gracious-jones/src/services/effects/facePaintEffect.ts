import type { FacePaintSettings } from '@/types/styleEffects'
import { createEffectCache, loadImage } from '@/services/styleEffectCache'

function cacheKey(src: string, s: FacePaintSettings, seed?: number): string {
  return `face-paint|${src}|${s.pattern}|${s.color}|${s.opacity}|s${seed ?? 0}`
}

function drawTribalPattern(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round'
  // Horizontal stripes across cheeks
  const cheekY = h * 0.45
  for (let i = 0; i < 3; i++) {
    const y = cheekY + i * 8
    ctx.beginPath(); ctx.moveTo(w * 0.1, y); ctx.lineTo(w * 0.35, y); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(w * 0.65, y); ctx.lineTo(w * 0.9, y); ctx.stroke()
  }
  // Forehead line
  ctx.beginPath(); ctx.moveTo(w * 0.3, h * 0.2); ctx.lineTo(w * 0.7, h * 0.2); ctx.stroke()
}

function drawSportPattern(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.fillStyle = color
  // Eye black strips under eyes
  const eyeY = h * 0.4
  ctx.fillRect(w * 0.2, eyeY, w * 0.15, h * 0.08)
  ctx.fillRect(w * 0.65, eyeY, w * 0.15, h * 0.08)
}

function drawClownPattern(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  // Red nose
  ctx.fillStyle = '#ff0000'
  ctx.beginPath(); ctx.arc(w * 0.5, h * 0.48, w * 0.06, 0, Math.PI * 2); ctx.fill()
  // Cheek circles
  ctx.fillStyle = color
  ctx.beginPath(); ctx.arc(w * 0.3, h * 0.45, w * 0.07, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(w * 0.7, h * 0.45, w * 0.07, 0, Math.PI * 2); ctx.fill()
  // Smile
  ctx.strokeStyle = color; ctx.lineWidth = 3
  ctx.beginPath(); ctx.arc(w * 0.5, h * 0.5, w * 0.2, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke()
}

function drawSkullPattern(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  ctx.fillStyle = color
  // Dark eye sockets
  ctx.beginPath(); ctx.ellipse(w * 0.35, h * 0.35, w * 0.08, h * 0.06, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(w * 0.65, h * 0.35, w * 0.08, h * 0.06, 0, 0, Math.PI * 2); ctx.fill()
  // Nose
  ctx.beginPath()
  ctx.moveTo(w * 0.47, h * 0.48); ctx.lineTo(w * 0.5, h * 0.44); ctx.lineTo(w * 0.53, h * 0.48)
  ctx.fill()
  // Teeth stitches
  ctx.strokeStyle = color; ctx.lineWidth = 2
  for (let i = 0; i < 5; i++) {
    const x = w * 0.38 + i * w * 0.06
    ctx.beginPath(); ctx.moveTo(x, h * 0.55); ctx.lineTo(x, h * 0.62); ctx.stroke()
  }
}

async function process(src: string, s: FacePaintSettings, _seed = 0): Promise<string> {
  const img = await loadImage(src)
  const w = img.naturalWidth; const h = img.naturalHeight
  if (w === 0 || h === 0) return src
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0)

  // Paint overlay canvas
  const paintCanvas = document.createElement('canvas')
  paintCanvas.width = w; paintCanvas.height = h
  const pCtx = paintCanvas.getContext('2d')!

  switch (s.pattern) {
    case 'tribal': drawTribalPattern(pCtx, w, h, s.color); break
    case 'sport': drawSportPattern(pCtx, w, h, s.color); break
    case 'clown': drawClownPattern(pCtx, w, h, s.color); break
    case 'skull': drawSkullPattern(pCtx, w, h, s.color); break
  }

  // Mask paint overlay with original alpha
  const srcData = ctx.getImageData(0, 0, w, h)
  const paintData = pCtx.getImageData(0, 0, w, h)
  for (let i = 3; i < paintData.data.length; i += 4) {
    paintData.data[i] = Math.min(paintData.data[i], srcData.data[i])
  }
  pCtx.putImageData(paintData, 0, 0)

  ctx.globalAlpha = s.opacity
  ctx.drawImage(paintCanvas, 0, 0)
  ctx.globalAlpha = 1

  return canvas.toDataURL('image/png')
}

export const facePaintCache = createEffectCache<FacePaintSettings>({
  name: 'face-paint',
  maxEntries: 100,
  cacheKeyFn: cacheKey,
  processFn: process,
})
