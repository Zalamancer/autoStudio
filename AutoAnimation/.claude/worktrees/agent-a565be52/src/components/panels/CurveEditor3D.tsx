/**
 * Animation curve graph editor for per-property keyframes.
 * SVG-based graph — X-axis: frames, Y-axis: property value.
 * Renders curves for selected bone's properties with color coding.
 */
import { useState, useRef, useMemo, useCallback } from 'react'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { IconButton } from '@/components/ui'
import { use3DRigStore } from '@/stores/use3DRigStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { PROPERTY_COLORS, ALL_BONE_PROPERTIES } from '@/types/animCurves'
import type { BonePropertyTrack } from '@/types/animCurves'

interface CurveEditor3DProps {
  /** Per-property tracks for the selected bone */
  propertyTracks: BonePropertyTrack[]
  /** Callback when a keyframe value is changed */
  onKeyframeChange?: (trackId: string, keyframeId: string, value: number) => void
  /** Callback to add a keyframe */
  onAddKeyframe?: (boneName: string, property: string, frame: number, value: number) => void
}

const GRAPH_PADDING = { top: 20, right: 20, bottom: 30, left: 50 }
const GRAPH_HEIGHT = 200
const DIAMOND_SIZE = 4

export function CurveEditor3D({
  propertyTracks,
}: CurveEditor3DProps) {
  const selectedBoneName = use3DRigStore((s) => s.selectedBoneName)
  const totalFrames = useTimelineStore((s) => s.totalFrames)
  const currentFrame = useTimelineStore((s) => s.currentFrame)

  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [visibleProps, setVisibleProps] = useState<Set<string>>(
    new Set(ALL_BONE_PROPERTIES)
  )

  const graphWidth = Math.max(400, totalFrames * 4 * zoom)
  const drawWidth = graphWidth - GRAPH_PADDING.left - GRAPH_PADDING.right
  const drawHeight = GRAPH_HEIGHT - GRAPH_PADDING.top - GRAPH_PADDING.bottom

  // Calculate value range across all visible tracks
  const { minVal, maxVal } = useMemo(() => {
    let min = -1
    let max = 1
    for (const track of propertyTracks) {
      if (!visibleProps.has(track.property)) continue
      for (const kf of track.keyframes) {
        min = Math.min(min, kf.value)
        max = Math.max(max, kf.value)
      }
    }
    const padding = (max - min) * 0.1 || 1
    return { minVal: min - padding, maxVal: max + padding }
  }, [propertyTracks, visibleProps])

  const frameToX = useCallback(
    (frame: number) => GRAPH_PADDING.left + (frame / totalFrames) * drawWidth,
    [totalFrames, drawWidth]
  )

  const valueToY = useCallback(
    (value: number) => {
      const range = maxVal - minVal || 1
      const t = (value - minVal) / range
      return GRAPH_PADDING.top + drawHeight * (1 - t)
    },
    [minVal, maxVal, drawHeight]
  )

  const toggleProperty = useCallback((prop: string) => {
    setVisibleProps((prev) => {
      const next = new Set(prev)
      if (next.has(prop)) next.delete(prop)
      else next.add(prop)
      return next
    })
  }, [])

  if (!selectedBoneName) {
    return (
      <div className="p-4 text-center text-xs text-zinc-600">
        Select a bone to view its animation curves.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-2">
        <span className="text-xs text-zinc-400 truncate">{selectedBoneName}</span>
        <div className="flex items-center gap-1">
          <IconButton
            icon={ZoomOut}
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.max(0.25, z / 1.5))}
            tooltip="Zoom out"
          />
          <IconButton
            icon={ZoomIn}
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.min(4, z * 1.5))}
            tooltip="Zoom in"
          />
        </div>
      </div>

      {/* Property toggles */}
      <div className="flex flex-wrap gap-1 px-2">
        {ALL_BONE_PROPERTIES.map((prop) => {
          const isVisible = visibleProps.has(prop)
          const color = PROPERTY_COLORS[prop] || '#888'
          const hasData = propertyTracks.some((t) => t.property === prop && t.keyframes.length > 0)
          return (
            <button
              key={prop}
              onClick={() => toggleProperty(prop)}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-xs transition-colors border"
              style={{
                backgroundColor: isVisible ? `${color}20` : 'transparent',
                color: isVisible ? color : '#666',
                borderColor: isVisible ? `${color}40` : 'transparent',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: hasData ? color : '#444' }}
              />
              {prop.split('.')[1]?.toUpperCase() || prop}
            </button>
          )
        })}
      </div>

      {/* Graph */}
      <div ref={containerRef} className="overflow-x-auto bg-zinc-900/50 rounded-lg">
        <svg
          width={graphWidth}
          height={GRAPH_HEIGHT}
          className="block"
        >
          {/* Grid lines */}
          <GridLines
            frameToX={frameToX}
            valueToY={valueToY}
            totalFrames={totalFrames}
            minVal={minVal}
            maxVal={maxVal}
            drawWidth={drawWidth}
            drawHeight={drawHeight}
          />

          {/* Current frame indicator */}
          <line
            x1={frameToX(currentFrame)}
            y1={GRAPH_PADDING.top}
            x2={frameToX(currentFrame)}
            y2={GRAPH_PADDING.top + drawHeight}
            stroke="#22c55e"
            strokeWidth={1}
            opacity={0.5}
          />

          {/* Curves */}
          {propertyTracks.map((track) => {
            if (!visibleProps.has(track.property)) return null
            if (track.keyframes.length === 0) return null
            const color = PROPERTY_COLORS[track.property] || '#888'

            // Build path
            const points = track.keyframes.map((kf) => ({
              x: frameToX(kf.frame),
              y: valueToY(kf.value),
            }))
            const pathD = points
              .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
              .join(' ')

            return (
              <g key={track.id}>
                {/* Curve line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.8}
                />
                {/* Keyframe diamonds */}
                {points.map((p, i) => (
                  <g key={track.keyframes[i].id}>
                    <rect
                      x={p.x - DIAMOND_SIZE}
                      y={p.y - DIAMOND_SIZE}
                      width={DIAMOND_SIZE * 2}
                      height={DIAMOND_SIZE * 2}
                      fill={color}
                      stroke="white"
                      strokeWidth={0.5}
                      transform={`rotate(45 ${p.x} ${p.y})`}
                      style={{ cursor: 'pointer' }}
                    />
                  </g>
                ))}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

// ─── Grid Sub-component ──────────────────────────────────────────────────────

function GridLines({
  frameToX,
  valueToY,
  totalFrames,
  minVal,
  maxVal,
  drawWidth,
  drawHeight,
}: {
  frameToX: (f: number) => number
  valueToY: (v: number) => number
  totalFrames: number
  minVal: number
  maxVal: number
  drawWidth: number
  drawHeight: number
}) {
  // Vertical lines (frame markers)
  const frameStep = Math.max(1, Math.round(totalFrames / 10))
  const frameLines = []
  for (let f = 0; f <= totalFrames; f += frameStep) {
    const x = frameToX(f)
    frameLines.push(
      <g key={`f-${f}`}>
        <line
          x1={x}
          y1={GRAPH_PADDING.top}
          x2={x}
          y2={GRAPH_PADDING.top + drawHeight}
          stroke="#333"
          strokeWidth={0.5}
        />
        <text x={x} y={GRAPH_PADDING.top + drawHeight + 12} fill="#555" fontSize={8} textAnchor="middle">
          {f}
        </text>
      </g>
    )
  }

  // Horizontal lines (value markers)
  const valueRange = maxVal - minVal || 1
  const valueStep = valueRange / 5
  const valueLines = []
  for (let i = 0; i <= 5; i++) {
    const val = minVal + valueStep * i
    const y = valueToY(val)
    valueLines.push(
      <g key={`v-${i}`}>
        <line
          x1={GRAPH_PADDING.left}
          y1={y}
          x2={GRAPH_PADDING.left + drawWidth}
          y2={y}
          stroke="#333"
          strokeWidth={0.5}
        />
        <text x={GRAPH_PADDING.left - 4} y={y + 3} fill="#555" fontSize={8} textAnchor="end">
          {val.toFixed(1)}
        </text>
      </g>
    )
  }

  return (
    <>
      {frameLines}
      {valueLines}
      {/* Zero line */}
      {minVal <= 0 && maxVal >= 0 && (
        <line
          x1={GRAPH_PADDING.left}
          y1={valueToY(0)}
          x2={GRAPH_PADDING.left + drawWidth}
          y2={valueToY(0)}
          stroke="#555"
          strokeWidth={1}
        />
      )}
    </>
  )
}
