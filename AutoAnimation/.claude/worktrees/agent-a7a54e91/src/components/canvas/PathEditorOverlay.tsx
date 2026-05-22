import React, { useCallback, useRef, useState } from 'react'
import { usePathStore } from '@/stores/usePathStore'
import { useCanvasStore } from '@/stores'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { pathToSVGPath, evaluatePath } from '@/engine/path'

/** Check if a control point is an on-curve point based on path type */
function isOnCurvePoint(index: number, type: string): boolean {
  if (type === 'cubic-bezier') {
    return index === 0 || index === 3
  }
  if (type === 'quadratic-bezier') {
    return index === 0 || index === 2
  }
  // For catmull-rom, linear, etc., all points are on-curve
  return true
}

export const PathEditorOverlay: React.FC = () => {
  const { paths, activeEditingPathId, updateControlPoint, addControlPoint, removeControlPoint } = usePathStore()
  const { zoom, panX, panY } = useCanvasStore()
  const currentFrame = usePlaybackStore((s) => s.currentFrame)
  const [dragging, setDragging] = useState<{ pointIndex: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const activePath = paths.find((p) => p.id === activeEditingPathId)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, pointIndex: number) => {
      e.preventDefault()
      e.stopPropagation()
      setDragging({ pointIndex })
    },
    []
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !activeEditingPathId || !svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / zoom - panX / zoom
      const y = (e.clientY - rect.top) / zoom - panY / zoom
      updateControlPoint(activeEditingPathId, dragging.pointIndex, { x, y })
    },
    [dragging, activeEditingPathId, zoom, panX, panY, updateControlPoint]
  )

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!activeEditingPathId || !activePath || !svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / zoom - panX / zoom
      const y = (e.clientY - rect.top) / zoom - panY / zoom
      // Add point after the last point
      addControlPoint(activeEditingPathId, { x, y }, activePath.config.points.length - 1)
    },
    [activeEditingPathId, activePath, zoom, panX, panY, addControlPoint]
  )

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, pointIndex: number) => {
      e.preventDefault()
      if (activeEditingPathId) {
        removeControlPoint(activeEditingPathId, pointIndex)
      }
    },
    [activeEditingPathId, removeControlPoint]
  )

  if (!activePath) return null

  const svgD = pathToSVGPath(activePath.config)
  const pts = activePath.config.points

  // Compute current position on path for the ghost indicator
  let ghostPos: { x: number; y: number } | null = null
  const duration = activePath.endFrame - activePath.startFrame
  if (duration > 0) {
    const t = Math.max(0, Math.min(1, (currentFrame - activePath.startFrame) / duration))
    const result = evaluatePath(t, activePath.config)
    ghostPos = { x: result.x, y: result.y }
  }

  // Direction arrows along the path
  const arrows: { x: number; y: number; angle: number }[] = []
  for (let i = 1; i <= 4; i++) {
    const t = i / 5
    const result = evaluatePath(t, activePath.config)
    arrows.push({ x: result.x, y: result.y, angle: result.angle })
  }

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0"
      style={{
        zIndex: 9999,
        pointerEvents: dragging ? 'auto' : 'none',
        overflow: 'visible',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
        {/* Path curve */}
        <path
          d={svgD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2 / zoom}
          strokeDasharray={`${8 / zoom} ${4 / zoom}`}
          style={{ pointerEvents: 'auto' }}
          onDoubleClick={handleDoubleClick}
        />

        {/* Direction arrows */}
        {arrows.map((arrow, i) => (
          <g
            key={`arrow-${i}`}
            transform={`translate(${arrow.x}, ${arrow.y}) rotate(${arrow.angle})`}
          >
            <polygon
              points={`0,${-4 / zoom} ${8 / zoom},0 0,${4 / zoom}`}
              fill="#3b82f6"
              opacity={0.6}
            />
          </g>
        ))}

        {/* Tangent handle lines (for cubic bezier) */}
        {activePath.config.type === 'cubic-bezier' && pts.length >= 4 && (
          <>
            <line
              x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y}
              stroke="#3b82f6" strokeWidth={1 / zoom} opacity={0.5}
            />
            <line
              x1={pts[3].x} y1={pts[3].y} x2={pts[2].x} y2={pts[2].y}
              stroke="#3b82f6" strokeWidth={1 / zoom} opacity={0.5}
            />
          </>
        )}

        {/* Tangent handle lines (for quadratic bezier) */}
        {activePath.config.type === 'quadratic-bezier' && pts.length >= 3 && (
          <>
            <line
              x1={pts[0].x} y1={pts[0].y} x2={pts[1].x} y2={pts[1].y}
              stroke="#3b82f6" strokeWidth={1 / zoom} opacity={0.5}
            />
            <line
              x1={pts[2].x} y1={pts[2].y} x2={pts[1].x} y2={pts[1].y}
              stroke="#3b82f6" strokeWidth={1 / zoom} opacity={0.5}
            />
          </>
        )}

        {/* Control points */}
        {pts.map((pt, i) => (
          <circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r={6 / zoom}
            fill={isOnCurvePoint(i, activePath.config.type) ? '#3b82f6' : 'white'}
            stroke="#3b82f6"
            strokeWidth={2 / zoom}
            style={{ pointerEvents: 'auto', cursor: dragging ? 'grabbing' : 'grab' }}
            onMouseDown={(e) => handleMouseDown(e, i)}
            onContextMenu={(e) => handleContextMenu(e, i)}
          />
        ))}

        {/* Ghost position indicator */}
        {ghostPos && (
          <circle
            cx={ghostPos.x}
            cy={ghostPos.y}
            r={4 / zoom}
            fill="#f59e0b"
            opacity={0.8}
          />
        )}
      </g>
    </svg>
  )
}
