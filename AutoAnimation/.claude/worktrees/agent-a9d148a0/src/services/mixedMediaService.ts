import type { MixedMediaPreset, MixedMediaCategory } from '@/types/faceSwap'
import { MIXED_MEDIA_PRESETS } from '@/data/mixedMediaPresets'

export function getPresetsByCategory(category: MixedMediaCategory): MixedMediaPreset[] {
  return MIXED_MEDIA_PRESETS.filter((p) => p.category === category)
}

export function getAllPresets(): MixedMediaPreset[] {
  return MIXED_MEDIA_PRESETS
}

export function getPresetById(id: string): MixedMediaPreset | undefined {
  return MIXED_MEDIA_PRESETS.find((p) => p.id === id)
}

export function applyMixedMedia(
  ctx: CanvasRenderingContext2D,
  preset: MixedMediaPreset,
  frame: number,
  width: number,
  height: number
): void {
  ctx.save()
  ctx.globalCompositeOperation = preset.blendMode as GlobalCompositeOperation
  ctx.globalAlpha = preset.opacity

  const anim = preset.animation
  const t = anim ? (frame * anim.speed * 0.01) : 0

  switch (preset.category) {
    case 'film-grain':
      renderFilmGrain(ctx, width, height, preset.filters, frame)
      break
    case 'light-leak':
      renderLightLeak(ctx, width, height, preset.filters, t)
      break
    case 'bokeh':
      renderBokeh(ctx, width, height, preset.filters, t)
      break
    case 'texture':
      renderTexture(ctx, width, height, preset.filters)
      break
    case 'gradient':
      renderGradient(ctx, width, height, preset.filters, t)
      break
    case 'vintage':
      renderVintage(ctx, width, height, preset.filters)
      break
    case 'glitch':
      renderGlitch(ctx, width, height, preset.filters, frame)
      break
    case 'organic':
      renderOrganic(ctx, width, height, preset.filters, t)
      break
    case 'abstract':
      renderAbstract(ctx, width, height, preset.filters, t)
      break
  }

  ctx.restore()
}

function renderFilmGrain(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  filters: Record<string, number>, frame: number
) {
  const intensity = filters.intensity ?? 0.3
  const size = filters.grainSize ?? 1
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  const seed = frame * 1000

  for (let i = 0; i < data.length; i += 4 * size) {
    const noise = ((Math.sin(seed + i) * 43758.5453) % 1) * intensity * 255
    data[i] += noise
    data[i + 1] += noise
    data[i + 2] += noise
  }
  ctx.putImageData(imageData, 0, 0)
}

function renderLightLeak(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  filters: Record<string, number>, t: number
) {
  const hue = filters.hue ?? 30
  const spread = filters.spread ?? 0.5
  const x = w * (0.3 + Math.sin(t) * 0.2)
  const y = h * (0.3 + Math.cos(t * 0.7) * 0.2)
  const radius = Math.max(w, h) * spread

  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius)
  grad.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.4)`)
  grad.addColorStop(0.5, `hsla(${hue + 20}, 70%, 50%, 0.15)`)
  grad.addColorStop(1, 'transparent')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

function renderBokeh(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  filters: Record<string, number>, t: number
) {
  const count = filters.count ?? 15
  const maxSize = filters.maxSize ?? 40
  const hue = filters.hue ?? 200

  for (let i = 0; i < count; i++) {
    const seed = i * 137.5
    const bx = (Math.sin(seed + t * 0.3) * 0.5 + 0.5) * w
    const by = (Math.cos(seed * 1.3 + t * 0.2) * 0.5 + 0.5) * h
    const size = (Math.sin(seed * 2.7) * 0.5 + 0.5) * maxSize + 5
    const alpha = (Math.sin(seed * 3.1 + t) * 0.5 + 0.5) * 0.3

    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, size)
    grad.addColorStop(0, `hsla(${hue + i * 10}, 60%, 70%, ${alpha})`)
    grad.addColorStop(0.7, `hsla(${hue + i * 10}, 60%, 70%, ${alpha * 0.3})`)
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(bx, by, size, 0, Math.PI * 2)
    ctx.fill()
  }
}

function renderTexture(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  filters: Record<string, number>
) {
  const roughness = filters.roughness ?? 0.5
  const scale = filters.scale ?? 4

  for (let y = 0; y < h; y += scale) {
    for (let x = 0; x < w; x += scale) {
      const noise = (Math.random() - 0.5) * roughness * 60
      const gray = 128 + noise
      ctx.fillStyle = `rgba(${gray}, ${gray}, ${gray}, 0.05)`
      ctx.fillRect(x, y, scale, scale)
    }
  }
}

function renderGradient(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  filters: Record<string, number>, t: number
) {
  const hue1 = (filters.hue1 ?? 0) + t * 10
  const hue2 = (filters.hue2 ?? 180) + t * 10
  const angle = (filters.angle ?? 45) * Math.PI / 180

  const x1 = w / 2 - Math.cos(angle) * w
  const y1 = h / 2 - Math.sin(angle) * h
  const x2 = w / 2 + Math.cos(angle) * w
  const y2 = h / 2 + Math.sin(angle) * h

  const grad = ctx.createLinearGradient(x1, y1, x2, y2)
  grad.addColorStop(0, `hsla(${hue1 % 360}, 70%, 50%, 0.3)`)
  grad.addColorStop(1, `hsla(${hue2 % 360}, 70%, 50%, 0.3)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

function renderVintage(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  filters: Record<string, number>
) {
  const sepia = filters.sepia ?? 0.4
  const vignette = filters.vignette ?? 0.6

  // Sepia tint
  ctx.fillStyle = `rgba(112, 66, 20, ${sepia * 0.3})`
  ctx.fillRect(0, 0, w, h)

  // Vignette
  if (vignette > 0) {
    const cx = w / 2, cy = h / 2
    const radius = Math.max(w, h) * 0.7
    const grad = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius)
    grad.addColorStop(0, 'transparent')
    grad.addColorStop(1, `rgba(0, 0, 0, ${vignette})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }
}

function renderGlitch(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  filters: Record<string, number>, frame: number
) {
  const intensity = filters.intensity ?? 0.5
  const sliceCount = Math.floor((filters.slices ?? 5) * intensity)

  if (frame % 3 !== 0) return // Only glitch every 3rd frame

  for (let i = 0; i < sliceCount; i++) {
    const sy = Math.random() * h
    const sh = Math.random() * 20 + 5
    const offset = (Math.random() - 0.5) * intensity * 40
    const imageData = ctx.getImageData(0, sy, w, sh)
    ctx.putImageData(imageData, offset, sy)
  }
}

function renderOrganic(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  filters: Record<string, number>, t: number
) {
  const count = filters.count ?? 30
  const maxSize = filters.maxSize ?? 3
  const alpha = filters.alpha ?? 0.2

  for (let i = 0; i < count; i++) {
    const seed = i * 73.7
    const x = (Math.sin(seed + t * 0.1) * 0.5 + 0.5) * w
    const y = (Math.cos(seed * 1.7) * 0.5 + 0.5) * h + t * 20
    const size = Math.random() * maxSize + 1
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.beginPath()
    ctx.arc(x, y % h, size, 0, Math.PI * 2)
    ctx.fill()
  }
}

function renderAbstract(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  filters: Record<string, number>, t: number
) {
  const complexity = filters.complexity ?? 5
  const hue = (filters.hue ?? 200) + t * 5

  for (let i = 0; i < complexity; i++) {
    const x = Math.sin(t + i * 2) * w * 0.3 + w / 2
    const y = Math.cos(t * 0.7 + i * 1.5) * h * 0.3 + h / 2
    const size = 50 + Math.sin(t + i) * 30

    ctx.fillStyle = `hsla(${(hue + i * 30) % 360}, 50%, 50%, 0.08)`
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
}
