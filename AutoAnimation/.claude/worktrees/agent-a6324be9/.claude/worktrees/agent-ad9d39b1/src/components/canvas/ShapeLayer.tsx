import { useRef, useCallback, memo } from 'react'
import { useShapeStore } from '@/stores/useShapeStore'
import { useEditorStore } from '@/stores'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { SelectionTransformBox, type LiveTransformValues } from './SelectionTransformBox'
import { useKeyframeRecorder } from '@/hooks/useKeyframeRecorder'
import { useFrameVisibility } from '@/hooks/useFrameVisibility'
import type { CanvasShape } from '@/types/shapes'
import type { GradientFill } from '@/types/gradient'

/** Extract a CSS-compatible fill string from a fill value (solid string or GradientFill) */
function resolveFillString(fill: string | GradientFill): string {
  if (typeof fill === 'string') return fill
  // For SVG, use the first stop color as a solid fallback
  return fill.stops?.[0]?.color ?? '#000000'
}

interface ShapeLayerProps {
  canvasWidth: number
  canvasHeight: number
}

export function ShapeLayer({ canvasWidth: _canvasWidth, canvasHeight: _canvasHeight }: ShapeLayerProps) {
  const shapes = useShapeStore((s) => s.shapes)
  const selectedShapeId = useShapeStore((s) => s.selectedShapeId)
  // REMOVED: currentFrame subscription — visibility is now handled per-child via useFrameVisibility

  if (shapes.length === 0) return null

  return (
    <>
      {shapes.map((shape) => {
        if (!shape.visible) return null

        return (
          <ShapeCanvasItem
            key={shape.id}
            shape={shape}
            isSelected={selectedShapeId === shape.id}
          />
        )
      })}
    </>
  )
}

interface ShapeCanvasItemProps {
  shape: CanvasShape
  isSelected: boolean
}

const ShapeCanvasItem = memo(function ShapeCanvasItem({ shape, isSelected }: ShapeCanvasItemProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const setLiveTransform = useLiveTransformStore((s) => s.setLiveTransform)
  const clearLiveTransform = useLiveTransformStore((s) => s.clearLiveTransform)
  const { recordIfEnabled } = useKeyframeRecorder()

  // Zero-re-render frame-range visibility (RAF + CSS display toggle)
  useFrameVisibility(targetRef, shape.startFrame, shape.endFrame)

  const handleSelect = useCallback(() => {
    useShapeStore.getState().setSelectedShapeId(shape.id)
    useEditorStore.getState().setRightPanelTab('shape-properties')
  }, [shape.id])

  const handleLiveTransform = useCallback(
    (values: LiveTransformValues) => {
      setLiveTransform({
        type: 'shape',
        id: shape.id,
        x: values.left,
        y: values.top,
        rotation: Math.round(values.rotation),
        scale: values.width / shape.width,
      })
    },
    [shape.id, shape.width, setLiveTransform]
  )

  const handleTransformEnd = useCallback(
    (state: { translate: [number, number]; width: number; height: number; rotate: number }) => {
      const el = targetRef.current
      if (!el) return

      clearLiveTransform()

      const finalLeft = parseFloat(el.style.left) || shape.position.x
      const finalTop = parseFloat(el.style.top) || shape.position.y
      const finalWidth = el.offsetWidth
      const finalHeight = el.offsetHeight

      useShapeStore.getState().updateShape(shape.id, {
        position: { x: finalLeft, y: finalTop },
        width: finalWidth,
        height: finalHeight,
        rotation: Math.round(state.rotate),
      })

      // Record keyframes if in record mode
      recordIfEnabled(
        { objectType: 'shape', objectId: shape.id },
        {
          x: finalLeft,
          y: finalTop,
          width: finalWidth,
          height: finalHeight,
          rotation: Math.round(state.rotate),
          opacity: shape.opacity,
        },
        {
          x: shape.position.x,
          y: shape.position.y,
          width: shape.width,
          height: shape.height,
          rotation: shape.rotation,
          opacity: shape.opacity,
        }
      )
    },
    [shape.id, shape.position.x, shape.position.y, shape.width, shape.height, shape.rotation, shape.opacity, clearLiveTransform, recordIfEnabled]
  )

  const style: React.CSSProperties = {
    position: 'absolute',
    left: shape.position.x,
    top: shape.position.y,
    width: shape.width,
    height: shape.height,
    opacity: shape.opacity,
    zIndex: shape.zIndex,
    cursor: 'move',
  }

  if (shape.rotation !== 0) {
    style.transform = `rotate(${shape.rotation}deg)`
  }

  return (
    <>
      <div
        ref={targetRef}
        data-canvas-element="shape"
        style={style}
        onClick={(e) => {
          e.stopPropagation()
          handleSelect()
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${shape.width} ${shape.height}`}
          xmlns="http://www.w3.org/2000/svg"
          className="pointer-events-none"
        >
          <ShapeSVG shape={shape} />
        </svg>
      </div>

      {isSelected && (
        <SelectionTransformBox
          targetRef={targetRef}
          onTransformEnd={handleTransformEnd}
          onLiveTransform={handleLiveTransform}
          keepRatio={false}
          color="#8b5cf6"
        />
      )}
    </>
  )
})

function ShapeSVG({ shape }: { shape: CanvasShape }) {
  const { width, height, fill: rawFill, stroke, strokeWidth, type } = shape
  const fill = resolveFillString(rawFill)

  // If the shape has a custom SVG path (e.g. from shape morphing), render it directly
  if (shape.svgPath) {
    return (
      <path
        d={shape.svgPath}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />
    )
  }

  switch (type) {
    case 'rectangle':
      return (
        <rect
          x={strokeWidth / 2}
          y={strokeWidth / 2}
          width={width - strokeWidth}
          height={height - strokeWidth}
          rx={shape.borderRadius ?? 0}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )

    case 'circle':
      return (
        <ellipse
          cx={width / 2}
          cy={height / 2}
          rx={(width - strokeWidth) / 2}
          ry={(height - strokeWidth) / 2}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      )

    case 'triangle': {
      const inset = strokeWidth / 2
      const points = `${width / 2},${inset} ${width - inset},${height - inset} ${inset},${height - inset}`
      return (
        <polygon
          points={points}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )
    }

    case 'star': {
      const cx = width / 2
      const cy = height / 2
      const outerR = Math.min(width, height) / 2 - strokeWidth / 2
      const innerR = outerR * (shape.innerRadius ?? 0.4)
      const numPoints = shape.points ?? 5
      const pts: string[] = []

      for (let i = 0; i < numPoints * 2; i++) {
        const angle = (Math.PI * i) / numPoints - Math.PI / 2
        const r = i % 2 === 0 ? outerR : innerR
        pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
      }

      return (
        <polygon
          points={pts.join(' ')}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
      )
    }

    default:
      return null
  }
}
