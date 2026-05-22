/**
 * PenToolLayer — Renders vector paths created with the pen tool.
 *
 * Uses SVG to render bezier curves with stroke/fill styling.
 * When the pen tool is active, also renders anchor point handles
 * and a preview line for the next point.
 */

import React, { memo } from 'react'
import { usePenToolStore } from '@/stores/usePenToolStore'
import { useFrameVisibility } from '@/hooks/useFrameVisibility'
import { anchorsToSVGPath } from '@/types/penTool'
import type { VectorPath, AnchorPoint } from '@/types/penTool'
import { useRef } from 'react'

interface PenToolLayerProps {
  canvasWidth: number
  canvasHeight: number
}

export function PenToolLayer({ canvasWidth, canvasHeight }: PenToolLayerProps) {
  const paths = usePenToolStore((s) => s.paths)
  const isActive = usePenToolStore((s) => s.isActive)
  const mode = usePenToolStore((s) => s.mode)
  const selectedPathId = usePenToolStore((s) => s.selectedPathId)
  const selectedAnchorId = usePenToolStore((s) => s.selectedAnchorId)
  const drawingPathId = usePenToolStore((s) => s.drawingPathId)
  const previewPoint = usePenToolStore((s) => s.previewPoint)
  const setSelectedPathId = usePenToolStore((s) => s.setSelectedPathId)
  const setSelectedAnchorId = usePenToolStore((s) => s.setSelectedAnchorId)

  if (paths.length === 0 && !isActive) return null

  return (
    <svg
      width={canvasWidth}
      height={canvasHeight}
      viewBox={`0 0 ${canvasWidth} ${canvasHeight}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: isActive ? 'auto' : 'none',
        zIndex: 8,
      }}
    >
      {/* Render all paths */}
      {paths.map((path) => (
        <VectorPathRenderer
          key={path.id}
          path={path}
          isSelected={path.id === selectedPathId}
          isEditing={isActive && path.id === selectedPathId && mode === 'editing'}
          selectedAnchorId={selectedAnchorId}
          onSelectPath={() => setSelectedPathId(path.id)}
          onSelectAnchor={(id) => setSelectedAnchorId(id)}
        />
      ))}

      {/* Preview line while drawing */}
      {isActive && mode === 'drawing' && drawingPathId && previewPoint && (
        <DrawingPreview
          pathId={drawingPathId}
          previewPoint={previewPoint}
        />
      )}
    </svg>
  )
}

// ── Vector Path Renderer ──

const VectorPathRenderer = memo(function VectorPathRenderer({
  path,
  isSelected,
  isEditing,
  selectedAnchorId,
  onSelectPath,
  onSelectAnchor,
}: {
  path: VectorPath
  isSelected: boolean
  isEditing: boolean
  selectedAnchorId: string | null
  onSelectPath: () => void
  onSelectAnchor: (id: string) => void
}) {
  const ref = useRef<SVGGElement>(null)
  useFrameVisibility(ref as unknown as React.RefObject<HTMLElement>, path.startFrame, path.endFrame)

  if (!path.visible) return null

  const d = anchorsToSVGPath(path.anchors, path.closed)
  if (!d) return null

  return (
    <g
      ref={ref as React.RefObject<SVGGElement>}
      transform={`translate(${path.position.x}, ${path.position.y}) rotate(${path.rotation}) scale(${path.scale.x}, ${path.scale.y})`}
      opacity={path.opacity}
    >
      {/* Main path */}
      <path
        d={d}
        fill={path.closed && path.fill ? path.fill : 'none'}
        stroke={path.stroke}
        strokeWidth={path.strokeWidth}
        strokeLinecap={path.lineCap}
        strokeLinejoin={path.lineJoin}
        strokeDasharray={path.dashArray.length > 0 ? path.dashArray.join(' ') : undefined}
        style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
        onClick={(e) => {
          e.stopPropagation()
          onSelectPath()
        }}
      />

      {/* Selection outline */}
      {isSelected && (
        <path
          d={d}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={1}
          strokeDasharray="4 4"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Anchor points and handles (when editing) */}
      {isEditing &&
        path.anchors.map((anchor, i) => (
          <AnchorPointRenderer
            key={anchor.id}
            anchor={anchor}
            isSelected={anchor.id === selectedAnchorId}
            isFirst={i === 0}
            onSelect={() => onSelectAnchor(anchor.id)}
          />
        ))}
    </g>
  )
})

// ── Anchor Point Renderer ──

function AnchorPointRenderer({
  anchor,
  isSelected,
  isFirst,
  onSelect,
}: {
  anchor: AnchorPoint
  isSelected: boolean
  isFirst: boolean
  onSelect: () => void
}) {
  const handleSize = 4
  const anchorSize = isFirst ? 6 : 5

  return (
    <g>
      {/* Handle In line */}
      {anchor.handleIn && (anchor.handleIn.x !== 0 || anchor.handleIn.y !== 0) && isSelected && (
        <>
          <line
            x1={anchor.x}
            y1={anchor.y}
            x2={anchor.x + anchor.handleIn.x}
            y2={anchor.y + anchor.handleIn.y}
            stroke="#3b82f6"
            strokeWidth={0.5}
            style={{ pointerEvents: 'none' }}
          />
          <circle
            cx={anchor.x + anchor.handleIn.x}
            cy={anchor.y + anchor.handleIn.y}
            r={handleSize}
            fill="#3b82f6"
            stroke="white"
            strokeWidth={1}
            style={{ cursor: 'pointer' }}
          />
        </>
      )}

      {/* Handle Out line */}
      {anchor.handleOut && (anchor.handleOut.x !== 0 || anchor.handleOut.y !== 0) && isSelected && (
        <>
          <line
            x1={anchor.x}
            y1={anchor.y}
            x2={anchor.x + anchor.handleOut.x}
            y2={anchor.y + anchor.handleOut.y}
            stroke="#3b82f6"
            strokeWidth={0.5}
            style={{ pointerEvents: 'none' }}
          />
          <circle
            cx={anchor.x + anchor.handleOut.x}
            cy={anchor.y + anchor.handleOut.y}
            r={handleSize}
            fill="#3b82f6"
            stroke="white"
            strokeWidth={1}
            style={{ cursor: 'pointer' }}
          />
        </>
      )}

      {/* Anchor point */}
      {anchor.type === 'smooth' ? (
        <circle
          cx={anchor.x}
          cy={anchor.y}
          r={anchorSize}
          fill={isSelected ? '#3b82f6' : 'white'}
          stroke={isFirst ? '#ef4444' : '#3b82f6'}
          strokeWidth={1.5}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        />
      ) : (
        <rect
          x={anchor.x - anchorSize}
          y={anchor.y - anchorSize}
          width={anchorSize * 2}
          height={anchorSize * 2}
          fill={isSelected ? '#3b82f6' : 'white'}
          stroke={isFirst ? '#ef4444' : '#3b82f6'}
          strokeWidth={1.5}
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
        />
      )}
    </g>
  )
}

// ── Drawing Preview ──

function DrawingPreview({
  pathId,
  previewPoint,
}: {
  pathId: string
  previewPoint: { x: number; y: number }
}) {
  const path = usePenToolStore((s) => s.paths.find((p) => p.id === pathId))
  if (!path || path.anchors.length === 0) return null

  const lastAnchor = path.anchors[path.anchors.length - 1]

  return (
    <line
      x1={lastAnchor.x}
      y1={lastAnchor.y}
      x2={previewPoint.x}
      y2={previewPoint.y}
      stroke="#3b82f6"
      strokeWidth={1}
      strokeDasharray="4 4"
      opacity={0.6}
      style={{ pointerEvents: 'none' }}
    />
  )
}
