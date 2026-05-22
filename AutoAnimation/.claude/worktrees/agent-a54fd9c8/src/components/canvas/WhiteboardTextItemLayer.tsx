/**
 * WhiteboardTextItemLayer
 *
 * Renders selectable whiteboard text items with progressive Canvas 2D
 * drawing animation. Each character is drawn point-by-point at 60fps
 * using perfect-freehand for realistic pen/chalk/marker strokes.
 *
 * This is NOT stroke-dashoffset. A pen tip visibly moves along each
 * letter's path, leaving a trail behind it like a real drawing.
 */

import { useRef, useEffect, useMemo, memo } from 'react'
import { useWhiteboardStore, type WhiteboardTextItem } from '@/stores/useWhiteboardStore'
import { useTimelineStore, useEditorStore } from '@/stores'
import { SelectionTransformBox } from './SelectionTransformBox'
import {
  samplePath,
  computeDrawingFrame,
  PEN_PRESETS,
  type PathPoint,
} from '@/services/progressiveDrawing'

interface WhiteboardTextItemLayerProps {
  canvasWidth: number
  canvasHeight: number
}

export function WhiteboardTextItemLayer({ canvasWidth, canvasHeight }: WhiteboardTextItemLayerProps) {
  const textItems = useWhiteboardStore((s) => s.textItems)
  const enabled = useWhiteboardStore((s) => s.enabled)
  const selectedId = useWhiteboardStore((s) => s.selectedTextItemId)
  const setSelectedId = useWhiteboardStore((s) => s.setSelectedTextItemId)
  const updateTextItem = useWhiteboardStore((s) => s.updateTextItem)

  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  if (!enabled || textItems.length === 0) return null

  return (
    <>
      {textItems.map((item) => (
        <WhiteboardTextElement
          key={item.id}
          item={item}
          isSelected={selectedId === item.id}
          onSelect={() => { setSelectedId(item.id); setRightPanelTab('whiteboard-text-properties') }}
          onUpdate={(updates) => updateTextItem(item.id, updates)}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      ))}
    </>
  )
}

interface WhiteboardTextElementProps {
  item: WhiteboardTextItem
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<WhiteboardTextItem>) => void
  canvasWidth: number
  canvasHeight: number
}

const WhiteboardTextElement = memo(function WhiteboardTextElement({
  item,
  isSelected,
  onSelect,
  onUpdate,
  canvasWidth,
  canvasHeight,
}: WhiteboardTextElementProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Pre-sample all paths once (expensive, memoize)
  const sampledPaths = useMemo<PathPoint[][]>(() => {
    const penStyle = PEN_PRESETS[item.drawStyle === 'handwriting' ? 'chalk' : 'pen'] ?? PEN_PRESETS.pen
    return item.charPaths.map((p) =>
      samplePath(p, Math.max(1, penStyle.size * 0.5))
    )
  }, [item.charPaths, item.drawStyle])

  // Position: percentage-based center → absolute px
  const scaledW = item.textWidth * item.scale
  const scaledH = item.textHeight * item.scale
  const left = (item.x / 100) * canvasWidth - scaledW / 2
  const top = (item.y / 100) * canvasHeight - scaledH / 2

  // Get pen style — use override if set, otherwise default preset
  const penStyle = useMemo(() => {
    if (item.penStyleOverride) {
      return {
        ...item.penStyleOverride,
        capStart: true,
        capEnd: true,
      }
    }
    const presetName = item.drawStyle === 'handwriting' ? 'chalk' : 'pen'
    const base = PEN_PRESETS[presetName] ?? PEN_PRESETS.pen
    return { ...base, size: item.strokeWidth || base.size }
  }, [item.penStyleOverride, item.drawStyle, item.strokeWidth])

  // RAF-driven rendering for smooth 60fps animation
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    let rafId: number
    let lastFrame = -1

    const render = () => {
      const currentFrame = useTimelineStore.getState().currentFrame

      if (currentFrame !== lastFrame) {
        lastFrame = currentFrame

        // Only apply chalk texture when the actual pen preset is chalk
        const isChalk = item.penPresetName === 'chalk'
        const texture = isChalk ? 'chalk' as const : 'none' as const

        const result = computeDrawingFrame(
          item.charPaths,
          currentFrame,
          item.startFrame,
          item.framesPerChar,
          penStyle,
          sampledPaths,
          texture,
          item.color,
        )

        // Clear and re-render SVG paths
        const toRemove: Element[] = []
        svg.querySelectorAll('[data-drawn]').forEach((p) => toRemove.push(p))
        toRemove.forEach((p) => p.remove())

        // Remove old pen tip and texture
        svg.querySelectorAll('circle[data-pen-tip]').forEach((c) => c.remove())
        svg.querySelectorAll('g[data-texture]').forEach((g) => g.remove())

        // Add drawn stroke paths (lower opacity for chalk to let texture show)
        const strokeOpacity = isChalk ? '0.55' : '0.92'
        for (const pathD of result.drawnPaths) {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
          path.setAttribute('d', pathD)
          path.setAttribute('fill', item.color)
          path.setAttribute('stroke', 'none')
          path.setAttribute('opacity', strokeOpacity)
          path.setAttribute('data-drawn', '1')
          svg.appendChild(path)
        }

        // Add chalk texture dots (scattered grainy particles)
        if (result.textureDots.length > 0) {
          const g = document.createElementNS('http://www.w3.org/2000/svg', 'g')
          g.setAttribute('data-texture', '1')
          g.innerHTML = result.textureDots.join('')
          svg.appendChild(g)
        }

        // Add pen tip indicator
        if (result.penTip) {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
          circle.setAttribute('cx', String(result.penTip.x))
          circle.setAttribute('cy', String(result.penTip.y))
          circle.setAttribute('r', String(Math.max(2, penStyle.size * 0.4)))
          circle.setAttribute('fill', item.color)
          circle.setAttribute('opacity', '0.6')
          circle.setAttribute('data-pen-tip', '1')
          svg.appendChild(circle)
        }
      }

      rafId = requestAnimationFrame(render)
    }

    rafId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(rafId)
  }, [item.charPaths, item.startFrame, item.framesPerChar, item.color, penStyle, sampledPaths])

  return (
    <>
      <div
        ref={targetRef}
        style={{
          position: 'absolute',
          left,
          top,
          width: scaledW,
          height: scaledH,
          transform: `rotate(${item.rotation}deg)`,
          transformOrigin: 'center center',
          cursor: 'pointer',
          zIndex: 1,
        }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <svg
          ref={svgRef}
          width={scaledW}
          height={scaledH}
          viewBox={`0 0 ${item.textWidth} ${item.textHeight}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ overflow: 'visible' }}
        />
      </div>

      {isSelected && (
        <SelectionTransformBox
          targetRef={targetRef}
          onTransformEnd={(state) => {
            const newLeft = state.left
            const newTop = state.top
            const newCenterX = (newLeft + scaledW / 2) / canvasWidth * 100
            const newCenterY = (newTop + scaledH / 2) / canvasHeight * 100
            onUpdate({
              x: Math.max(0, Math.min(100, newCenterX)),
              y: Math.max(0, Math.min(100, newCenterY)),
              rotation: state.rotate,
            })
          }}
          onScaleEnd={(scale) => {
            onUpdate({ scale: item.scale * scale })
          }}
          resizable={false}
          scalable={true}
          keepRatio={true}
          color="#22c55e"
        />
      )}
    </>
  )
})
