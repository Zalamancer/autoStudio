/**
 * WhiteboardDrawingOverlay
 *
 * Canvas overlay that captures pointer events for freehand drawing.
 * Works with WhiteboardToolbar — only active when a drawing tool is selected.
 */

import { useRef, useCallback, memo } from 'react'
import { useWhiteboardStore } from '@/stores/useWhiteboardStore'
import { createFreehandStroke } from '@/services/whiteboardAnimation'
import { useTimelineStore } from '@/stores'
import { ALL_TOOLS } from './WhiteboardToolbar'

interface WhiteboardDrawingOverlayProps {
  canvasWidth: number
  canvasHeight: number
}

export const WhiteboardDrawingOverlay = memo(function WhiteboardDrawingOverlay({ canvasWidth, canvasHeight }: WhiteboardDrawingOverlayProps) {
  const enabled = useWhiteboardStore((s) => s.enabled)
  const drawingActive = useWhiteboardStore((s) => s.drawingActive ?? false)
  const addStroke = useWhiteboardStore((s) => s.addStroke)
  const activeBrush = useWhiteboardStore((s) => s.activeBrush ?? 'cursor')
  const drawingColor = useWhiteboardStore((s) => s.drawingColor ?? '#ffffff')

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const points = useRef<Array<{ x: number; y: number }>>([])
  const drawStartFrame = useRef(0)
  const wasPlayingOnStart = useRef(false)

  const tool = ALL_TOOLS.find((t) => t.id === activeBrush)
  const brushWidth = tool?.width ?? 3
  const brushOpacity = tool?.opacity ?? 0.9
  const isEraser = tool?.isEraser ?? false
  const isShape = activeBrush === 'line' || activeBrush === 'rectangle' || activeBrush === 'circle'
  const startPoint = useRef<{ x: number; y: number } | null>(null)
  const isPrecisionEraser = activeBrush === 'precise-eraser'
  const isStandardEraser = activeBrush === 'eraser'

  const drawPreview = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasWidth, canvasHeight)

    if (isPrecisionEraser) {
      ctx.strokeStyle = 'rgba(255,100,100,0.6)'
      ctx.setLineDash([4, 4])
    } else if (isStandardEraser) {
      ctx.strokeStyle = 'rgba(200,200,200,0.5)'
      ctx.setLineDash([])
    } else {
      ctx.strokeStyle = drawingColor
      ctx.setLineDash([])
    }

    ctx.lineWidth = brushWidth
    ctx.lineCap = activeBrush === 'marker' ? 'square' : 'round'
    ctx.lineJoin = 'round'
    ctx.globalAlpha = (isPrecisionEraser || isStandardEraser) ? 0.6 : brushOpacity

    if (isShape && startPoint.current && points.current.length > 0) {
      const sp = startPoint.current
      const ep = points.current[points.current.length - 1]
      ctx.beginPath()
      if (activeBrush === 'line') {
        ctx.moveTo(sp.x, sp.y)
        ctx.lineTo(ep.x, ep.y)
      } else if (activeBrush === 'rectangle') {
        ctx.rect(sp.x, sp.y, ep.x - sp.x, ep.y - sp.y)
      } else if (activeBrush === 'circle') {
        const rx = Math.abs(ep.x - sp.x) / 2
        const ry = Math.abs(ep.y - sp.y) / 2
        const cx = (sp.x + ep.x) / 2
        const cy = (sp.y + ep.y) / 2
        ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2)
      }
      ctx.stroke()
    } else if (points.current.length >= 2) {
      ctx.beginPath()
      ctx.moveTo(points.current[0].x, points.current[0].y)
      for (let i = 1; i < points.current.length; i++) {
        const prev = points.current[i - 1]
        const curr = points.current[i]
        const mx = (prev.x + curr.x) / 2
        const my = (prev.y + curr.y) / 2
        ctx.quadraticCurveTo(prev.x, prev.y, mx, my)
      }
      ctx.stroke()
    }

    ctx.globalAlpha = 1
    ctx.setLineDash([])
  }, [canvasWidth, canvasHeight, drawingColor, brushWidth, brushOpacity, isEraser, activeBrush, isShape, isPrecisionEraser, isStandardEraser])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    isDrawing.current = true
    drawStartFrame.current = useTimelineStore.getState().currentFrame
    wasPlayingOnStart.current = useTimelineStore.getState().isPlaying
    const x = ((e.clientX - rect.left) / rect.width) * canvasWidth
    const y = ((e.clientY - rect.top) / rect.height) * canvasHeight
    points.current = [{ x, y }]
    if (isShape) startPoint.current = { x, y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [canvasWidth, canvasHeight, isShape])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawing.current) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width) * canvasWidth
    const y = ((e.clientY - rect.top) / rect.height) * canvasHeight
    if (isShape) {
      points.current = [{ x, y }]
    } else {
      points.current.push({ x, y })
    }
    drawPreview()
  }, [canvasWidth, canvasHeight, drawPreview, isShape])

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current) return
    isDrawing.current = false

    const hasEnoughPoints = isShape ? (points.current.length >= 1 && !!startPoint.current) : points.current.length >= 2
    if (hasEnoughPoints) {
      if (isPrecisionEraser) {
        // Precision eraser: remove entire strokes that the eraser path touches
        const eraserPoints = points.current
        const threshold = brushWidth * 2
        const strokes = useWhiteboardStore.getState().config.strokes
        for (const stroke of strokes) {
          if (stroke.isEraser) continue // don't erase eraser strokes
          const match = stroke.path.match(/-?[0-9]*\.?[0-9]+/g)
          if (!match || match.length < 2) continue
          const strokePoints: { x: number; y: number }[] = []
          for (let i = 0; i < match.length - 1; i += 2) {
            strokePoints.push({ x: parseFloat(match[i]), y: parseFloat(match[i + 1]) })
          }
          const shouldRemove = eraserPoints.some((ep) =>
            strokePoints.some((sp) => Math.hypot(ep.x - sp.x, ep.y - sp.y) < threshold)
          )
          if (shouldRemove) {
            useWhiteboardStore.getState().removeStroke(stroke.id)
          }
        }
      } else if (isStandardEraser) {
        // Standard eraser: immediately visible, no animation
        const stroke = createFreehandStroke(points.current, 0, 0, '#000000', brushWidth)
        stroke.isEraser = true
        addStroke(stroke)
      } else {
        // ── Stroke timing: real-time recording vs instant ──
        // If timeline was playing when the user started drawing,
        // record the stroke in real time (startFrame = pen down, endFrame = pen up).
        // If timeline was paused, the stroke appears instantly (no animation).
        const currentFrame = useTimelineStore.getState().currentFrame
        const wasPlaying = wasPlayingOnStart.current
        const penDownFrame = drawStartFrame.current
        const penUpFrame = currentFrame

        let sf: number
        let ef: number

        if (wasPlaying && penUpFrame > penDownFrame) {
          // Real-time recorded: the stroke draws exactly over the duration you drew it
          sf = penDownFrame
          ef = penUpFrame
        } else {
          // Not playing: stroke appears instantly at all frames
          sf = 0
          ef = 0
        }

        if (isShape && startPoint.current && points.current.length > 0) {
          // Shape: generate SVG path
          const sp = startPoint.current
          const ep = points.current[points.current.length - 1]
          let pathD = ''

          if (activeBrush === 'line') {
            pathD = `M ${sp.x} ${sp.y} L ${ep.x} ${ep.y}`
          } else if (activeBrush === 'rectangle') {
            const x = Math.min(sp.x, ep.x)
            const y = Math.min(sp.y, ep.y)
            const w = Math.abs(ep.x - sp.x)
            const h = Math.abs(ep.y - sp.y)
            pathD = `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`
          } else if (activeBrush === 'circle') {
            const cx = (sp.x + ep.x) / 2
            const cy = (sp.y + ep.y) / 2
            const rx = Math.abs(ep.x - sp.x) / 2
            const ry = Math.abs(ep.y - sp.y) / 2
            const k = 0.5522848
            const kx = rx * k
            const ky = ry * k
            pathD = `M ${cx} ${cy - ry} C ${cx + kx} ${cy - ry} ${cx + rx} ${cy - ky} ${cx + rx} ${cy} C ${cx + rx} ${cy + ky} ${cx + kx} ${cy + ry} ${cx} ${cy + ry} C ${cx - kx} ${cy + ry} ${cx - rx} ${cy + ky} ${cx - rx} ${cy} C ${cx - rx} ${cy - ky} ${cx - kx} ${cy - ry} ${cx} ${cy - ry} Z`
          }

          if (pathD) {
            // Read latest pen settings from store (not closure) so right panel changes apply
            const liveColor = useWhiteboardStore.getState().drawingColor ?? drawingColor
            const liveWidth = useWhiteboardStore.getState().drawingPenStyle?.size ?? brushWidth
            addStroke({
              id: `shape-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              path: pathD,
              color: liveColor,
              strokeWidth: liveWidth,
              startFrame: sf,
              endFrame: ef,
              easing: 'ease-out',
            })
          }
        } else {
          // Freehand stroke — save pen style with the stroke for later editing
          const penState = useWhiteboardStore.getState().drawingPenStyle
          const liveColor = useWhiteboardStore.getState().drawingColor ?? drawingColor
          const liveWidth = penState?.size ?? brushWidth
          const stroke = createFreehandStroke(points.current, sf, ef, liveColor, liveWidth)
          stroke.easing = wasPlaying ? 'linear' : undefined
          if (penState) {
            stroke.penStyle = {
              size: penState.size,
              thinning: penState.thinning,
              smoothing: penState.smoothing,
              streamline: penState.streamline,
              simulatePressure: penState.simulatePressure,
              taperStart: penState.taperStart,
              taperEnd: penState.taperEnd,
            }
          }
          addStroke(stroke)
        }
      }
    }

    points.current = []
    startPoint.current = null
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx) ctx.clearRect(0, 0, canvasWidth, canvasHeight)
  }, [addStroke, drawingColor, brushWidth, isEraser, isShape, activeBrush, canvasWidth, canvasHeight, isPrecisionEraser, isStandardEraser])

  if (!enabled || !drawingActive) return null

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      data-canvas-element="whiteboard-drawing"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 50,
        cursor: tool?.cursor ?? 'crosshair',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  )
})
