/**
 * Draggable bezier control point for the curve editor.
 * Renders a handle that can be dragged to adjust cubic bezier curves.
 */
import { useRef, useCallback } from 'react'

interface BezierHandleProps {
  /** Handle position in canvas coordinates */
  x: number
  y: number
  /** The keyframe point this handle belongs to */
  anchorX: number
  anchorY: number
  /** Callback when the handle is dragged */
  onDrag: (dx: number, dy: number) => void
  /** Callback when drag ends */
  onDragEnd: () => void
  /** Color of the handle */
  color?: string
  /** Size in pixels */
  size?: number
}

export function BezierHandle({
  x,
  y,
  anchorX,
  anchorY,
  onDrag,
  onDragEnd,
  color = '#f97316',
  size = 6,
}: BezierHandleProps) {
  const draggingRef = useRef(false)
  const startRef = useRef({ x: 0, y: 0 })

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    draggingRef.current = true
    startRef.current = { x: e.clientX, y: e.clientY }

    const handleMouseMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return
      const dx = ev.clientX - startRef.current.x
      const dy = ev.clientY - startRef.current.y
      startRef.current = { x: ev.clientX, y: ev.clientY }
      onDrag(dx, dy)
    }

    const handleMouseUp = () => {
      draggingRef.current = false
      onDragEnd()
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }, [onDrag, onDragEnd])

  return (
    <g>
      {/* Line from anchor to handle */}
      <line
        x1={anchorX}
        y1={anchorY}
        x2={x}
        y2={y}
        stroke={color}
        strokeWidth={1}
        strokeDasharray="3,2"
        opacity={0.5}
      />
      {/* Handle circle */}
      <circle
        cx={x}
        cy={y}
        r={size}
        fill={color}
        stroke="white"
        strokeWidth={1}
        style={{ cursor: 'grab' }}
        onMouseDown={handleMouseDown}
      />
    </g>
  )
}
