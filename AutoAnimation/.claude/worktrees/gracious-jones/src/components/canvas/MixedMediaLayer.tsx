/**
 * MixedMediaLayer — renders artistic overlay effects on the canvas
 * based on the active preset from useMixedMediaStore.
 */

import { useRef, useEffect, useCallback } from 'react'
import { useMixedMediaStore } from '@/stores/useMixedMediaStore'
import type { MixedMediaPreset } from '@/types/faceSwap'

interface MixedMediaLayerProps {
  canvasWidth: number
  canvasHeight: number
}

/** Seeded PRNG for deterministic noise */
function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

export function MixedMediaLayer({ canvasWidth, canvasHeight }: MixedMediaLayerProps) {
  const activePreset = useMixedMediaStore((s) => s.activePreset)
  const overlayOpacity = useMixedMediaStore((s) => s.overlayOpacity)
  const isEnabled = useMixedMediaStore((s) => s.isEnabled)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const timeRef = useRef(0)
  const lastFrameRef = useRef(0)

  const render = useCallback((preset: MixedMediaPreset, t: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    ctx.clearRect(0, 0, w, h)

    const anim = preset.animation
    const speed = anim?.speed ?? 0
    const amplitude = anim?.amplitude ?? 0
    const animPhase = t * speed

    switch (preset.category) {
      case 'film-grain':
        renderFilmGrain(ctx, w, h, preset, animPhase, amplitude)
        break
      case 'light-leak':
        renderLightLeak(ctx, w, h, preset, animPhase, amplitude)
        break
      case 'bokeh':
        renderBokeh(ctx, w, h, preset, animPhase, amplitude)
        break
      case 'texture':
        renderTexture(ctx, w, h, preset)
        break
      case 'gradient':
        renderGradient(ctx, w, h, preset, animPhase, amplitude)
        break
      case 'vintage':
        renderVintage(ctx, w, h, preset)
        break
      case 'glitch':
        renderGlitch(ctx, w, h, preset, animPhase, amplitude)
        break
      case 'organic':
        renderOrganic(ctx, w, h, preset, animPhase, amplitude)
        break
      case 'abstract':
        renderAbstract(ctx, w, h, preset, animPhase, amplitude)
        break
    }
  }, [])

  useEffect(() => {
    if (!activePreset || !isEnabled) {
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        ctx?.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    const loop = (timestamp: number) => {
      if (!lastFrameRef.current) lastFrameRef.current = timestamp
      const delta = (timestamp - lastFrameRef.current) / 1000
      lastFrameRef.current = timestamp
      timeRef.current += delta
      render(activePreset, timeRef.current)
      rafRef.current = requestAnimationFrame(loop)
    }

    timeRef.current = 0
    lastFrameRef.current = 0
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [activePreset, isEnabled, render])

  if (!activePreset || !isEnabled) return null

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        mixBlendMode: activePreset.blendMode as React.CSSProperties['mixBlendMode'],
        opacity: activePreset.opacity * overlayOpacity,
      }}
    />
  )
}

/* ─── Renderers ─── */

function renderFilmGrain(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  preset: MixedMediaPreset, phase: number, amplitude: number,
) {
  const intensity = (preset.filters.intensity ?? 0.4) as number
  const grainSize = (preset.filters.grainSize ?? 1) as number
  const flicker = 1 - amplitude * Math.sin(phase * 6) * 0.5

  const step = Math.max(1, Math.round(grainSize))
  const imgData = ctx.createImageData(w, h)
  const data = imgData.data
  const rng = mulberry32(Math.floor(phase * 10))

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const v = Math.floor(rng() * 255 * intensity * flicker)
      for (let dy = 0; dy < step && y + dy < h; dy++) {
        for (let dx = 0; dx < step && x + dx < w; dx++) {
          const i = ((y + dy) * w + (x + dx)) * 4
          data[i] = v
          data[i + 1] = v
          data[i + 2] = v
          data[i + 3] = Math.floor(intensity * 180)
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0)
}

function renderLightLeak(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  preset: MixedMediaPreset, phase: number, amplitude: number,
) {
  const hue = (preset.filters.hue ?? 35) as number
  const spread = (preset.filters.spread ?? 0.5) as number

  const offsetX = Math.sin(phase) * amplitude * w * 0.3
  const offsetY = Math.cos(phase * 0.7) * amplitude * h * 0.2
  const cx = w * 0.7 + offsetX
  const cy = h * 0.3 + offsetY
  const radius = Math.max(w, h) * spread

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
  const [r, g, b] = hslToRgb(hue, 0.9, 0.6)
  grad.addColorStop(0, `rgba(${r},${g},${b},0.8)`)
  grad.addColorStop(0.4, `rgba(${r},${g},${b},0.3)`)
  grad.addColorStop(1, 'rgba(0,0,0,0)')

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

function renderBokeh(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  preset: MixedMediaPreset, phase: number, amplitude: number,
) {
  const count = (preset.filters.count ?? 15) as number
  const maxSize = (preset.filters.maxSize ?? 30) as number
  const hue = (preset.filters.hue ?? 40) as number
  const rng = mulberry32(42)

  for (let i = 0; i < count; i++) {
    const baseX = rng() * w
    const baseY = rng() * h
    const size = rng() * maxSize + 5
    const alpha = rng() * 0.4 + 0.1
    const drift = Math.sin(phase * 0.5 + i) * amplitude * 30

    const x = baseX + drift
    const y = baseY + Math.cos(phase * 0.3 + i * 0.7) * amplitude * 20
    const h2 = (hue + rng() * 40 - 20 + 360) % 360
    const [r, g, b] = hslToRgb(h2, 0.7, 0.7)

    const grad = ctx.createRadialGradient(x, y, 0, x, y, size)
    grad.addColorStop(0, `rgba(${r},${g},${b},${alpha})`)
    grad.addColorStop(0.7, `rgba(${r},${g},${b},${alpha * 0.3})`)
    grad.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
}

function renderTexture(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  preset: MixedMediaPreset,
) {
  const roughness = (preset.filters.roughness ?? 0.3) as number
  const scale = (preset.filters.scale ?? 2) as number
  const step = Math.max(1, Math.round(scale))
  const imgData = ctx.createImageData(w, h)
  const data = imgData.data
  const rng = mulberry32(123)

  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const v = Math.floor(128 + (rng() - 0.5) * 255 * roughness)
      for (let dy = 0; dy < step && y + dy < h; dy++) {
        for (let dx = 0; dx < step && x + dx < w; dx++) {
          const i = ((y + dy) * w + (x + dx)) * 4
          data[i] = v
          data[i + 1] = v
          data[i + 2] = v
          data[i + 3] = Math.floor(roughness * 120)
        }
      }
    }
  }
  ctx.putImageData(imgData, 0, 0)
}

function renderGradient(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  preset: MixedMediaPreset, phase: number, amplitude: number,
) {
  const hue1 = ((preset.filters.hue1 ?? 220) as number + phase * amplitude * 60) % 360
  const hue2 = ((preset.filters.hue2 ?? 340) as number + phase * amplitude * 40) % 360
  const angle = ((preset.filters.angle ?? 135) as number) * Math.PI / 180

  const cx = w / 2
  const cy = h / 2
  const len = Math.max(w, h)
  const x0 = cx - Math.cos(angle) * len / 2
  const y0 = cy - Math.sin(angle) * len / 2
  const x1 = cx + Math.cos(angle) * len / 2
  const y1 = cy + Math.sin(angle) * len / 2

  const [r1, g1, b1] = hslToRgb(hue1, 0.7, 0.5)
  const [r2, g2, b2] = hslToRgb(hue2, 0.7, 0.5)

  const grad = ctx.createLinearGradient(x0, y0, x1, y1)
  grad.addColorStop(0, `rgb(${r1},${g1},${b1})`)
  grad.addColorStop(1, `rgb(${r2},${g2},${b2})`)

  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
}

function renderVintage(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  preset: MixedMediaPreset,
) {
  const sepia = (preset.filters.sepia ?? 0.5) as number
  const vignette = (preset.filters.vignette ?? 0.5) as number

  // Sepia tone fill
  const sepiaAlpha = Math.floor(sepia * 100)
  ctx.fillStyle = `rgba(112,66,20,${sepiaAlpha / 255})`
  ctx.fillRect(0, 0, w, h)

  // Vignette
  if (vignette > 0) {
    const cx = w / 2
    const cy = h / 2
    const radius = Math.max(w, h) * 0.7
    const grad = ctx.createRadialGradient(cx, cy, radius * (1 - vignette), cx, cy, radius)
    grad.addColorStop(0, 'rgba(0,0,0,0)')
    grad.addColorStop(1, `rgba(0,0,0,${vignette * 0.8})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }
}

function renderGlitch(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  preset: MixedMediaPreset, phase: number, amplitude: number,
) {
  const intensity = (preset.filters.intensity ?? 0.3) as number
  const slices = (preset.filters.slices ?? 5) as number
  const rng = mulberry32(Math.floor(phase * 8))

  // Scan lines
  ctx.fillStyle = `rgba(0,255,128,${intensity * 0.15})`
  const sliceH = h / slices
  for (let i = 0; i < slices; i++) {
    if (rng() < amplitude) {
      const y = i * sliceH + rng() * sliceH * 0.5
      const height = rng() * sliceH * 0.6 + 2
      const shift = (rng() - 0.5) * w * intensity * 0.3
      ctx.fillRect(shift, y, w, height)
    }
  }

  // Color bars
  const barCount = Math.floor(slices * amplitude * 2)
  for (let i = 0; i < barCount; i++) {
    const y = rng() * h
    const barH = rng() * 4 + 1
    const colors = ['rgba(255,0,0,0.2)', 'rgba(0,255,0,0.2)', 'rgba(0,0,255,0.2)']
    ctx.fillStyle = colors[Math.floor(rng() * 3)]
    ctx.fillRect(0, y, w, barH)
  }
}

function renderOrganic(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  preset: MixedMediaPreset, phase: number, amplitude: number,
) {
  const count = (preset.filters.count ?? 30) as number
  const maxSize = (preset.filters.maxSize ?? 3) as number
  const alpha = (preset.filters.alpha ?? 0.2) as number
  const rng = mulberry32(77)

  for (let i = 0; i < count; i++) {
    const baseX = rng() * w
    const baseY = rng() * h
    const size = rng() * maxSize + 1
    const drift = Math.sin(phase * 0.3 + i * 0.5) * amplitude * 20
    const rise = (phase * 15 * (0.5 + rng() * 0.5)) % (h + 40) - 20

    const x = baseX + drift
    const y = (baseY - rise + h) % h
    const a = alpha * (0.5 + Math.sin(phase + i) * 0.5)

    ctx.fillStyle = `rgba(255,255,240,${a})`
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
  }
}

function renderAbstract(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  preset: MixedMediaPreset, phase: number, amplitude: number,
) {
  const complexity = (preset.filters.complexity ?? 6) as number
  const hue = (preset.filters.hue ?? 200) as number
  const rng = mulberry32(99)

  for (let i = 0; i < complexity; i++) {
    const cx = rng() * w + Math.sin(phase * 0.4 + i) * amplitude * w * 0.15
    const cy = rng() * h + Math.cos(phase * 0.3 + i * 1.3) * amplitude * h * 0.15
    const size = rng() * 60 + 20
    const rotation = phase * 0.2 + i
    const h2 = (hue + rng() * 60) % 360
    const [r, g, b] = hslToRgb(h2, 0.6, 0.6)

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(rotation)
    ctx.strokeStyle = `rgba(${r},${g},${b},0.3)`
    ctx.lineWidth = 1.5
    ctx.beginPath()
    // Draw polygon
    const sides = Math.floor(rng() * 4) + 3
    for (let s = 0; s <= sides; s++) {
      const angle = (s / sides) * Math.PI * 2
      const px = Math.cos(angle) * size
      const py = Math.sin(angle) * size
      if (s === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }
}
