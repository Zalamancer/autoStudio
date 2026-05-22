import React, { useCallback, useRef, useState, memo } from 'react'
import { useMaskStore } from '@/stores/useMaskStore'
import { useCanvasStore } from '@/stores'

type HandleType = 'tl' | 'tr' | 'bl' | 'br' | 'move'

export const MaskEditorOverlay = memo(function MaskEditorOverlay() {
  const { masks, activeEditingMaskId, updateMask } = useMaskStore()
  const { zoom, panX, panY } = useCanvasStore()
  const [dragging, setDragging] = useState<{ handle: HandleType; startX: number; startY: number; startMask: { x: number; y: number; w: number; h: number } } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const activeMask = masks.find((m) => m.id === activeEditingMaskId)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, handle: HandleType) => {
      e.preventDefault()
      e.stopPropagation()
      if (!activeMask) return
      setDragging({
        handle,
        startX: e.clientX,
        startY: e.clientY,
        startMask: {
          x: activeMask.position.x,
          y: activeMask.position.y,
          w: activeMask.width,
          h: activeMask.height,
        },
      })
    },
    [activeMask]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging || !activeEditingMaskId) return
      const dx = (e.clientX - dragging.startX) / zoom
      const dy = (e.clientY - dragging.startY) / zoom
      const { handle, startMask } = dragging

      switch (handle) {
        case 'move':
          updateMask(activeEditingMaskId, {
            position: { x: startMask.x + dx, y: startMask.y + dy },
          })
          break
        case 'br':
          updateMask(activeEditingMaskId, {
            width: Math.max(10, startMask.w + dx),
            height: Math.max(10, startMask.h + dy),
          })
          break
        case 'tl':
          updateMask(activeEditingMaskId, {
            position: { x: startMask.x + dx, y: startMask.y + dy },
            width: Math.max(10, startMask.w - dx),
            height: Math.max(10, startMask.h - dy),
          })
          break
        case 'tr':
          updateMask(activeEditingMaskId, {
            position: { x: startMask.x, y: startMask.y + dy },
            width: Math.max(10, startMask.w + dx),
            height: Math.max(10, startMask.h - dy),
          })
          break
        case 'bl':
          updateMask(activeEditingMaskId, {
            position: { x: startMask.x + dx, y: startMask.y },
            width: Math.max(10, startMask.w - dx),
            height: Math.max(10, startMask.h + dy),
          })
          break
      }
    },
    [dragging, activeEditingMaskId, zoom, updateMask]
  )

  const handleMouseUp = useCallback(() => {
    setDragging(null)
  }, [])

  if (!activeMask) return null

  const { position, width, height, type, inverted } = activeMask
  const handleSize = 8 / zoom

  // Render mask shape outline
  let shapeElement: React.ReactNode = null
  switch (type) {
    case 'rectangle':
      shapeElement = (
        <rect
          x={position.x}
          y={position.y}
          width={width}
          height={height}
          fill={inverted ? 'rgba(0,0,0,0.3)' : 'rgba(59,130,246,0.15)'}
          stroke="#3b82f6"
          strokeWidth={2 / zoom}
          strokeDasharray={`${6 / zoom} ${3 / zoom}`}
          style={{ pointerEvents: 'auto', cursor: 'move' }}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
        />
      )
      break
    case 'ellipse':
      shapeElement = (
        <ellipse
          cx={position.x + width / 2}
          cy={position.y + height / 2}
          rx={width / 2}
          ry={height / 2}
          fill={inverted ? 'rgba(0,0,0,0.3)' : 'rgba(59,130,246,0.15)'}
          stroke="#3b82f6"
          strokeWidth={2 / zoom}
          strokeDasharray={`${6 / zoom} ${3 / zoom}`}
          style={{ pointerEvents: 'auto', cursor: 'move' }}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
        />
      )
      break
    case 'path':
      // For path masks, show the path boundary
      if (activeMask.pathConfig) {
        const pts = activeMask.pathConfig.points
        const d = pts.length > 0
          ? `M ${pts[0].x} ${pts[0].y} ` + pts.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ') + ' Z'
          : ''
        shapeElement = (
          <path
            d={d}
            fill={inverted ? 'rgba(0,0,0,0.3)' : 'rgba(59,130,246,0.15)'}
            stroke="#3b82f6"
            strokeWidth={2 / zoom}
            strokeDasharray={`${6 / zoom} ${3 / zoom}`}
          />
        )
      }
      break
  }

  // Corner handles for rectangle/ellipse
  const cornerHandles = (type === 'rectangle' || type === 'ellipse') ? (
    <>
      {/* Top-left */}
      <rect
        x={position.x - handleSize / 2}
        y={position.y - handleSize / 2}
        width={handleSize}
        height={handleSize}
        fill="white"
        stroke="#3b82f6"
        strokeWidth={1.5 / zoom}
        style={{ pointerEvents: 'auto', cursor: 'nwse-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'tl')}
      />
      {/* Top-right */}
      <rect
        x={position.x + width - handleSize / 2}
        y={position.y - handleSize / 2}
        width={handleSize}
        height={handleSize}
        fill="white"
        stroke="#3b82f6"
        strokeWidth={1.5 / zoom}
        style={{ pointerEvents: 'auto', cursor: 'nesw-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'tr')}
      />
      {/* Bottom-left */}
      <rect
        x={position.x - handleSize / 2}
        y={position.y + height - handleSize / 2}
        width={handleSize}
        height={handleSize}
        fill="white"
        stroke="#3b82f6"
        strokeWidth={1.5 / zoom}
        style={{ pointerEvents: 'auto', cursor: 'nesw-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'bl')}
      />
      {/* Bottom-right */}
      <rect
        x={position.x + width - handleSize / 2}
        y={position.y + height - handleSize / 2}
        width={handleSize}
        height={handleSize}
        fill="white"
        stroke="#3b82f6"
        strokeWidth={1.5 / zoom}
        style={{ pointerEvents: 'auto', cursor: 'nwse-resize' }}
        onMouseDown={(e) => handleMouseDown(e, 'br')}
      />
    </>
  ) : null

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0"
      style={{
        zIndex: 9998,
        pointerEvents: dragging ? 'auto' : 'none',
        overflow: 'visible',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <g transform={`translate(${panX}, ${panY}) scale(${zoom})`}>
        {shapeElement}
        {cornerHandles}
      </g>
    </svg>
  )
})
