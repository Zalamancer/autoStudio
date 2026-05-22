import { useRef, useEffect } from 'react'
import { useFrame } from '@/engine'
import type { AnnotationExportData } from './types'

// ── Drawing helpers (mirrored from AnnotationLayer.tsx) ───────────────

interface Point { x: number; y: number }

function drawArrow(ctx: CanvasRenderingContext2D, p1: Point, p2: Point, color: string, thickness: number, opacity: number) {
  const headLen = Math.max(12, thickness * 4)
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = thickness
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(p1.x, p1.y)
  ctx.lineTo(p2.x, p2.y)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(p2.x, p2.y)
  ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6))
  ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6))
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawCircle(ctx: CanvasRenderingContext2D, p1: Point, p2: Point, color: string, thickness: number, opacity: number) {
  const cx = (p1.x + p2.x) / 2
  const cy = (p1.y + p2.y) / 2
  const rx = Math.abs(p2.x - p1.x) / 2
  const ry = Math.abs(p2.y - p1.y) / 2
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.strokeStyle = color
  ctx.lineWidth = thickness
  ctx.beginPath()
  ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

function drawRect(ctx: CanvasRenderingContext2D, p1: Point, p2: Point, color: string, thickness: number, opacity: number) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.strokeStyle = color
  ctx.lineWidth = thickness
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.rect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y))
  ctx.stroke()
  ctx.restore()
}

function drawHighlight(ctx: CanvasRenderingContext2D, p1: Point, p2: Point, color: string, opacity: number) {
  ctx.save()
  ctx.globalAlpha = opacity * 0.35
  ctx.fillStyle = color
  ctx.fillRect(Math.min(p1.x, p2.x), Math.min(p1.y, p2.y), Math.abs(p2.x - p1.x), Math.abs(p2.y - p1.y))
  ctx.restore()
}

function drawBlur(ctx: CanvasRenderingContext2D, p1: Point, p2: Point, blurRadius: number, opacity: number) {
  const x = Math.min(p1.x, p2.x)
  const y = Math.min(p1.y, p2.y)
  const w = Math.abs(p2.x - p1.x)
  const h = Math.abs(p2.y - p1.y)
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.filter = `blur(${blurRadius}px)`
  try {
    ctx.drawImage(ctx.canvas, x, y, Math.max(w, 1), Math.max(h, 1), x, y, Math.max(w, 1), Math.max(h, 1))
  } catch {
    ctx.filter = 'none'
    ctx.fillStyle = 'rgba(128,128,128,0.5)'
    ctx.fillRect(x, y, w, h)
  }
  ctx.filter = 'none'
  ctx.restore()
}

function drawText(ctx: CanvasRenderingContext2D, p1: Point, text: string, color: string, thickness: number, opacity: number) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = color
  ctx.font = `${Math.max(14, thickness * 6)}px Inter, system-ui, sans-serif`
  ctx.textBaseline = 'top'
  ctx.fillText(text, p1.x, p1.y)
  ctx.restore()
}

function drawFreehand(ctx: CanvasRenderingContext2D, points: Point[], color: string, thickness: number, opacity: number) {
  if (points.length < 2) return
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.strokeStyle = color
  ctx.lineWidth = thickness
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2
    const midY = (points[i].y + points[i + 1].y) / 2
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY)
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y)
  ctx.stroke()
  ctx.restore()
}

// ── Component ─────────────────────────────────────────────────────────

interface RemotionAnnotationLayerProps {
  annotations: AnnotationExportData[]
  canvasWidth: number
  canvasHeight: number
}

export function RemotionAnnotationLayer({ annotations, canvasWidth, canvasHeight }: RemotionAnnotationLayerProps) {
  const frame = useFrame()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    for (const ann of annotations) {
      if (!ann.visible) continue
      if (frame < ann.startFrame || frame >= ann.endFrame) continue
      if (ann.points.length < 1) continue

      // Animation progress
      const fadeDuration = 15
      const elapsed = frame - ann.startFrame
      let progress = 1
      if (ann.animation === 'fadeIn') progress = Math.min(1, elapsed / fadeDuration)
      if (ann.animation === 'draw') progress = Math.min(1, elapsed / fadeDuration)
      if (progress <= 0) continue

      const effectiveOpacity = ann.opacity * progress
      const p1 = ann.points[0]
      const p2 = ann.points.length > 1 ? ann.points[ann.points.length - 1] : { x: p1.x + 50, y: p1.y + 50 }

      switch (ann.type) {
        case 'arrow': {
          const endP = ann.animation === 'draw'
            ? { x: p1.x + (p2.x - p1.x) * progress, y: p1.y + (p2.y - p1.y) * progress }
            : p2
          drawArrow(ctx, p1, endP, ann.color, ann.thickness, effectiveOpacity)
          break
        }
        case 'circle':
          drawCircle(ctx, p1, p2, ann.color, ann.thickness, effectiveOpacity)
          break
        case 'rectangle':
          drawRect(ctx, p1, p2, ann.color, ann.thickness, effectiveOpacity)
          break
        case 'highlight':
          drawHighlight(ctx, p1, p2, ann.color, effectiveOpacity)
          break
        case 'blur':
          drawBlur(ctx, p1, p2, ann.blurRadius ?? 10, effectiveOpacity)
          break
        case 'text':
          drawText(ctx, p1, ann.textContent ?? 'Text', ann.color, ann.thickness, effectiveOpacity)
          break
        case 'freehand': {
          if (ann.animation === 'draw' && progress < 1) {
            const endIdx = Math.max(2, Math.ceil(ann.points.length * progress))
            drawFreehand(ctx, ann.points.slice(0, endIdx), ann.color, ann.thickness, effectiveOpacity)
          } else {
            drawFreehand(ctx, ann.points, ann.color, ann.thickness, effectiveOpacity)
          }
          break
        }
      }
    }
  }, [frame, annotations, canvasWidth, canvasHeight])

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: canvasWidth,
        height: canvasHeight,
        zIndex: 15,
        pointerEvents: 'none',
      }}
    />
  )
}
