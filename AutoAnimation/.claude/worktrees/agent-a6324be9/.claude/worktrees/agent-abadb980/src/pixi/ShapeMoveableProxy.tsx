import { useRef, useEffect, useCallback, memo } from 'react'
import { useShapeStore } from '@/stores/useShapeStore'
import { useEditorStore } from '@/stores'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { SelectionTransformBox, type LiveTransformValues } from '@/components/canvas/SelectionTransformBox'
import { useKeyframeRecorder } from '@/hooks/useKeyframeRecorder'
import type { CanvasShape } from '@/types/shapes'

interface ShapeProxyProps {
  shape: CanvasShape
  isSelected: boolean
}

/**
 * Invisible DOM div positioned over a PixiJS-rendered shape.
 * Moveable.js attaches to this div for drag/resize/rotate.
 */
const ShapeProxy = memo(function ShapeProxy({ shape, isSelected }: ShapeProxyProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const updateShape = useShapeStore((s) => s.updateShape)
  const setSelectedShapeId = useShapeStore((s) => s.setSelectedShapeId)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const setLiveTransform = useLiveTransformStore((s) => s.setLiveTransform)
  const clearLiveTransform = useLiveTransformStore((s) => s.clearLiveTransform)
  const { recordIfEnabled } = useKeyframeRecorder()

  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    el.style.left = `${shape.position.x}px`
    el.style.top = `${shape.position.y}px`
    el.style.width = `${shape.width}px`
    el.style.height = `${shape.height}px`
    el.style.transform = shape.rotation !== 0 ? `rotate(${shape.rotation}deg)` : ''
  }, [shape.position.x, shape.position.y, shape.width, shape.height, shape.rotation])

  const handleSelect = useCallback(() => {
    setSelectedShapeId(shape.id)
    setRightPanelTab('shape-properties')
  }, [shape.id, setSelectedShapeId, setRightPanelTab])

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

      updateShape(shape.id, {
        position: { x: finalLeft, y: finalTop },
        width: finalWidth,
        height: finalHeight,
        rotation: Math.round(state.rotate),
      })

      recordIfEnabled(
        { objectType: 'shape', objectId: shape.id },
        { x: finalLeft, y: finalTop, width: finalWidth, height: finalHeight, rotation: Math.round(state.rotate), opacity: shape.opacity },
        { x: shape.position.x, y: shape.position.y, width: shape.width, height: shape.height, rotation: shape.rotation, opacity: shape.opacity }
      )
    },
    [shape.id, shape.position.x, shape.position.y, shape.width, shape.height, shape.rotation, shape.opacity, updateShape, clearLiveTransform, recordIfEnabled]
  )

  return (
    <>
      <div
        ref={targetRef}
        style={{
          position: 'absolute',
          left: shape.position.x,
          top: shape.position.y,
          width: shape.width,
          height: shape.height,
          transform: shape.rotation !== 0 ? `rotate(${shape.rotation}deg)` : undefined,
          opacity: 0,
          pointerEvents: 'auto',
          cursor: 'move',
          zIndex: 50,
        }}
        onClick={(e) => {
          e.stopPropagation()
          handleSelect()
        }}
      />
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

/**
 * Renders MoveableProxy divs for all shapes when PixiJS rendering is active.
 */
export function ShapeMoveableProxies() {
  const shapes = useShapeStore((s) => s.shapes)
  const selectedShapeId = useShapeStore((s) => s.selectedShapeId)

  return (
    <>
      {shapes.map((shape) => {
        if (!shape.visible) return null
        return (
          <ShapeProxy
            key={shape.id}
            shape={shape}
            isSelected={selectedShapeId === shape.id}
          />
        )
      })}
    </>
  )
}
