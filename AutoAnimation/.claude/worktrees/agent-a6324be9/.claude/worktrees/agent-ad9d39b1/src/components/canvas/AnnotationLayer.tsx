import { useRef, useEffect, useCallback, memo } from 'react'
import { useAnnotationStore, type Annotation, type AnnotationPoint } from '@/stores/useAnnotationStore'
import { useTimelineStore } from '@/stores'

// ── Drawing helpers ───────────────────────────────────────────────────

function drawArrow(
  ctx: CanvasRenderingContext2D,
  p1: AnnotationPoint,
  p2: AnnotationPoint,
  color: string,
  thickness: number,
  opacity: number,
) {
  const headLen = Math.max(12, thickness * 4)
  const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x)

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.strokeStyle = color
  ctx.fillStyle = color
  ctx.lineWidth = thickness
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  // Shaft
  ctx.beginPath()
  ctx.moveTo(p1.x, p1.y)
  ctx.lineTo(p2.x, p2.y)
  ctx.stroke()

  // Arrowhead
  ctx.beginPath()
  ctx.moveTo(p2.x, p2.y)
  ctx.lineTo(
    p2.x - headLen * Math.cos(angle - Math.PI / 6),
    p2.y - headLen * Math.sin(angle - Math.PI / 6),
  )
  ctx.lineTo(
    p2.x - headLen * Math.cos(angle + Math.PI / 6),
    p2.y - headLen * Math.sin(angle + Math.PI / 6),
  )
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

function drawCircleAnnotation(
  ctx: CanvasRenderingContext2D,
  p1: AnnotationPoint,
  p2: AnnotationPoint,
  color: string,
  thickness: number,
  opacity: number,
) {
  const cx = (p1.x + p2.x) / 2
  const cy = (p1.y + p2.y) / 2
  const rx = Math.abs(p2.x - p1.x) / 2
  const ry = Math.abs(p2.y - p1.y) / 2

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.strokeStyle = color
  ctx.lineWidth = thickness
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.ellipse(cx, cy, Math.max(rx, 1), Math.max(ry, 1), 0, 0, Math.PI * 2)
  ctx.stroke()

  ctx.restore()
}

function drawRectAnnotation(
  ctx: CanvasRenderingContext2D,
  p1: AnnotationPoint,
  p2: AnnotationPoint,
  color: string,
  thickness: number,
  opacity: number,
) {
  const x = Math.min(p1.x, p2.x)
  const y = Math.min(p1.y, p2.y)
  const w = Math.abs(p2.x - p1.x)
  const h = Math.abs(p2.y - p1.y)

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.strokeStyle = color
  ctx.lineWidth = thickness
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.stroke()

  ctx.restore()
}

function drawHighlight(
  ctx: CanvasRenderingContext2D,
  p1: AnnotationPoint,
  p2: AnnotationPoint,
  color: string,
  opacity: number,
) {
  const x = Math.min(p1.x, p2.x)
  const y = Math.min(p1.y, p2.y)
  const w = Math.abs(p2.x - p1.x)
  const h = Math.abs(p2.y - p1.y)

  ctx.save()
  ctx.globalAlpha = opacity * 0.35
  ctx.fillStyle = color

  ctx.fillRect(x, y, w, h)

  ctx.restore()
}

function drawBlur(
  ctx: CanvasRenderingContext2D,
  p1: AnnotationPoint,
  p2: AnnotationPoint,
  blurRadius: number,
  opacity: number,
) {
  const x = Math.min(p1.x, p2.x)
  const y = Math.min(p1.y, p2.y)
  const w = Math.abs(p2.x - p1.x)
  const h = Math.abs(p2.y - p1.y)

  ctx.save()
  ctx.globalAlpha = opacity

  // Use filter for Gaussian blur effect on the region
  ctx.filter = `blur(${blurRadius}px)`

  // Draw the region back onto itself with blur
  try {
    ctx.drawImage(
      ctx.canvas,
      x, y, Math.max(w, 1), Math.max(h, 1),
      x, y, Math.max(w, 1), Math.max(h, 1),
    )
  } catch {
    // Fallback: draw a semi-transparent overlay
    ctx.filter = 'none'
    ctx.fillStyle = 'rgba(128,128,128,0.5)'
    ctx.fillRect(x, y, w, h)
  }

  ctx.filter = 'none'
  ctx.restore()
}

function drawTextAnnotation(
  ctx: CanvasRenderingContext2D,
  p1: AnnotationPoint,
  text: string,
  color: string,
  thickness: number,
  opacity: number,
) {
  ctx.save()
  ctx.globalAlpha = opacity
  ctx.fillStyle = color
  ctx.font = `${Math.max(14, thickness * 6)}px Inter, system-ui, sans-serif`
  ctx.textBaseline = 'top'

  ctx.fillText(text, p1.x, p1.y)

  ctx.restore()
}

function drawFreehand(
  ctx: CanvasRenderingContext2D,
  points: AnnotationPoint[],
  color: string,
  thickness: number,
  opacity: number,
) {
  if (points.length < 2) return

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.strokeStyle = color
  ctx.lineWidth = thickness
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)

  // Smooth path using quadratic curves
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2
    const midY = (points[i].y + points[i + 1].y) / 2
    ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY)
  }

  // Last point
  const last = points[points.length - 1]
  ctx.lineTo(last.x, last.y)
  ctx.stroke()

  ctx.restore()
}

/** Compute animation progress for an annotation at the given frame */
function getAnimationProgress(annotation: Annotation, frame: number): number {
  if (annotation.animation === 'none') return 1

  const elapsed = frame - annotation.startFrame
  const fadeDuration = 15 // frames for animation

  if (annotation.animation === 'fadeIn') {
    return Math.min(1, elapsed / fadeDuration)
  }

  if (annotation.animation === 'draw') {
    return Math.min(1, elapsed / fadeDuration)
  }

  return 1
}

/** Draw a single annotation on the canvas */
function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
  frame: number,
) {
  if (!annotation.visible) return
  if (frame < annotation.startFrame || frame >= annotation.endFrame) return
  if (annotation.points.length < 1) return

  const progress = getAnimationProgress(annotation, frame)
  if (progress <= 0) return

  const effectiveOpacity = annotation.opacity * progress
  const p1 = annotation.points[0]
  const p2 = annotation.points.length > 1 ? annotation.points[annotation.points.length - 1] : { x: p1.x + 50, y: p1.y + 50 }

  switch (annotation.type) {
    case 'arrow': {
      // For 'draw' animation, interpolate end point
      const endP = annotation.animation === 'draw'
        ? { x: p1.x + (p2.x - p1.x) * progress, y: p1.y + (p2.y - p1.y) * progress }
        : p2
      drawArrow(ctx, p1, endP, annotation.color, annotation.thickness, effectiveOpacity)
      break
    }
    case 'circle':
      drawCircleAnnotation(ctx, p1, p2, annotation.color, annotation.thickness, effectiveOpacity)
      break
    case 'rectangle':
      drawRectAnnotation(ctx, p1, p2, annotation.color, annotation.thickness, effectiveOpacity)
      break
    case 'highlight':
      drawHighlight(ctx, p1, p2, annotation.color, effectiveOpacity)
      break
    case 'blur':
      drawBlur(ctx, p1, p2, annotation.blurRadius ?? 10, effectiveOpacity)
      break
    case 'text':
      drawTextAnnotation(ctx, p1, annotation.textContent ?? 'Text', annotation.color, annotation.thickness, effectiveOpacity)
      break
    case 'freehand': {
      if (annotation.animation === 'draw' && progress < 1) {
        const endIdx = Math.max(2, Math.ceil(annotation.points.length * progress))
        drawFreehand(ctx, annotation.points.slice(0, endIdx), annotation.color, annotation.thickness, effectiveOpacity)
      } else {
        drawFreehand(ctx, annotation.points, annotation.color, annotation.thickness, effectiveOpacity)
      }
      break
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────

interface AnnotationLayerProps {
  canvasWidth: number
  canvasHeight: number
}

export const AnnotationLayer = memo(function AnnotationLayer({ canvasWidth, canvasHeight }: AnnotationLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const annotations = useAnnotationStore((s) => s.annotations)
  const activeTool = useAnnotationStore((s) => s.activeTool)
  const drawing = useAnnotationStore((s) => s.drawing)
  const style = useAnnotationStore((s) => s.style)
  const startDrawing = useAnnotationStore((s) => s.startDrawing)
  const addPoint = useAnnotationStore((s) => s.addPoint)
  const finishDrawing = useAnnotationStore((s) => s.finishDrawing)
  const currentFrame = useTimelineStore((s) => s.currentFrame)

  // Render annotations on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    // Draw all annotations for current frame
    for (const annotation of annotations) {
      drawAnnotation(ctx, annotation, currentFrame)
    }

    // Draw in-progress stroke
    if (drawing.isDrawing && drawing.currentPoints.length > 0 && activeTool) {
      const points = drawing.currentPoints
      const p1 = points[0]
      const p2 = points.length > 1 ? points[points.length - 1] : { x: p1.x + 1, y: p1.y + 1 }

      switch (activeTool) {
        case 'arrow':
          drawArrow(ctx, p1, p2, style.color, style.thickness, style.opacity * 0.6)
          break
        case 'circle':
          drawCircleAnnotation(ctx, p1, p2, style.color, style.thickness, style.opacity * 0.6)
          break
        case 'rectangle':
          drawRectAnnotation(ctx, p1, p2, style.color, style.thickness, style.opacity * 0.6)
          break
        case 'highlight':
          drawHighlight(ctx, p1, p2, style.color, style.opacity * 0.6)
          break
        case 'blur':
          drawBlur(ctx, p1, p2, 10, style.opacity * 0.6)
          break
        case 'text':
          drawTextAnnotation(ctx, p1, 'Text', style.color, style.thickness, style.opacity * 0.6)
          break
        case 'freehand':
          drawFreehand(ctx, points, style.color, style.thickness, style.opacity * 0.6)
          break
      }
    }
  }, [annotations, currentFrame, drawing, activeTool, style, canvasWidth, canvasHeight])

  // ── Mouse event handlers ────────────────────────────────────────────

  const getCanvasPoint = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): AnnotationPoint => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvasWidth / rect.width
      const scaleY = canvasHeight / rect.height
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    },
    [canvasWidth, canvasHeight],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!activeTool) return
      e.preventDefault()
      e.stopPropagation()
      const point = getCanvasPoint(e)
      startDrawing(point)
    },
    [activeTool, getCanvasPoint, startDrawing],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!drawing.isDrawing || !activeTool) return
      e.preventDefault()
      const point = getCanvasPoint(e)

      if (activeTool === 'freehand') {
        addPoint(point)
      } else {
        // For shape tools, replace the last point (keep only start + current)
        const store = useAnnotationStore.getState()
        const pts = store.drawing.currentPoints
        if (pts.length > 1) {
          // Replace last point
          useAnnotationStore.setState((state) => {
            state.drawing.currentPoints = [pts[0], point]
          })
        } else {
          addPoint(point)
        }
      }
    },
    [drawing.isDrawing, activeTool, getCanvasPoint, addPoint],
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!drawing.isDrawing || !activeTool) return
      e.preventDefault()
      finishDrawing()
    },
    [drawing.isDrawing, activeTool, finishDrawing],
  )

  // Don't render if no annotations and no active tool
  if (annotations.length === 0 && !activeTool) return null

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        zIndex: 15,
        pointerEvents: activeTool ? 'auto' : 'none',
        cursor: activeTool ? 'crosshair' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  )
})

// ── Export drawing functions for canvas2dRenderer ─────────────────────

export { drawAnnotation, getAnimationProgress }
