import { useRef, useEffect, useCallback, memo } from 'react'
import { useMediaStore, type CanvasMediaItem } from '@/stores/useMediaStore'
import { useEditorStore } from '@/stores'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { SelectionTransformBox, type LiveTransformValues } from '@/components/canvas/SelectionTransformBox'
import { useKeyframeRecorder } from '@/hooks/useKeyframeRecorder'

interface MoveableProxyProps {
  item: CanvasMediaItem
  imageNaturalWidth: number
  imageNaturalHeight: number
  isSelected: boolean
}

/**
 * MoveableProxy renders an invisible DOM div positioned exactly over where a PixiJS
 * sprite appears on the canvas. Moveable.js attaches to this div for drag/resize/rotate
 * handles, and on transform events we update the Zustand store which the PixiJS render
 * loop picks up on the next tick.
 *
 * This avoids needing to implement custom PixiJS-based transform handles.
 */
export const MoveableProxy = memo(function MoveableProxy({
  item,
  imageNaturalWidth,
  imageNaturalHeight,
  isSelected,
}: MoveableProxyProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const updateCanvasItem = useMediaStore((s) => s.updateCanvasItem)
  const setSelectedCanvasItemId = useMediaStore((s) => s.setSelectedCanvasItemId)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const setLiveTransform = useLiveTransformStore((s) => s.setLiveTransform)
  const clearLiveTransform = useLiveTransformStore((s) => s.clearLiveTransform)
  const { recordIfEnabled } = useKeyframeRecorder()

  const baseWidth = imageNaturalWidth || 1920
  const baseHeight = imageNaturalHeight || 1080
  const displayWidth = baseWidth * item.scale
  const displayHeight = baseHeight * item.scale

  // Sync proxy div position with store values (for when store changes externally)
  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    el.style.left = `${item.position.x}px`
    el.style.top = `${item.position.y}px`
    el.style.width = `${displayWidth}px`
    el.style.height = `${displayHeight}px`
    el.style.transform = item.rotation !== 0 ? `rotate(${item.rotation}deg)` : ''
  }, [item.position.x, item.position.y, item.scale, item.rotation, displayWidth, displayHeight])

  const handleSelect = useCallback(() => {
    setSelectedCanvasItemId(item.id)
    setRightPanelTab('media-properties')
  }, [item.id, setSelectedCanvasItemId, setRightPanelTab])

  const handleLiveTransform = useCallback(
    (values: LiveTransformValues) => {
      const newScale = Math.max(0.01, values.width / baseWidth)
      setLiveTransform({
        type: 'media',
        id: item.id,
        x: values.left,
        y: values.top,
        rotation: Math.round(values.rotation),
        scale: newScale,
      })
    },
    [baseWidth, item.id, setLiveTransform]
  )

  const handleTransformEnd = useCallback(
    (state: { translate: [number, number]; width: number; height: number; rotate: number }) => {
      const el = targetRef.current
      if (!el) return

      clearLiveTransform()

      const finalLeft = parseFloat(el.style.left) || item.position.x
      const finalTop = parseFloat(el.style.top) || item.position.y
      const finalWidth = el.offsetWidth
      const newScale = Math.max(0.01, finalWidth / baseWidth)

      const updates: Partial<CanvasMediaItem> = {
        position: { x: finalLeft, y: finalTop },
        rotation: Math.round(state.rotate),
        scale: newScale,
      }

      updateCanvasItem(item.id, updates)

      recordIfEnabled(
        { objectType: 'media', objectId: item.id },
        { 'position.x': finalLeft, 'position.y': finalTop, rotation: Math.round(state.rotate), scale: newScale },
        { 'position.x': item.position.x, 'position.y': item.position.y, rotation: item.rotation, scale: item.scale }
      )
    },
    [item.id, item.position.x, item.position.y, item.rotation, item.scale, baseWidth, updateCanvasItem, clearLiveTransform, recordIfEnabled]
  )

  return (
    <>
      <div
        ref={targetRef}
        style={{
          position: 'absolute',
          left: item.position.x,
          top: item.position.y,
          width: displayWidth,
          height: displayHeight,
          transform: item.rotation !== 0 ? `rotate(${item.rotation}deg)` : undefined,
          opacity: 0, // Invisible — only used as Moveable target
          pointerEvents: isSelected ? 'auto' : 'auto', // Always clickable for selection
          cursor: 'move',
          zIndex: 50, // Above PixiJS canvas, below UI overlays
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
          keepRatio={true}
          color="#4a7eff"
        />
      )}
    </>
  )
})

/**
 * Container component that renders MoveableProxy divs for all media canvas items
 * when PixiJS rendering is active.
 */
export function MediaMoveableProxies() {
  const canvasItems = useMediaStore((s) => s.canvasItems)
  const assets = useMediaStore((s) => s.assets)
  const selectedCanvasItemId = useMediaStore((s) => s.selectedCanvasItemId)

  return (
    <>
      {canvasItems.map((item) => {
        const asset = assets.find((a) => a.id === item.assetId)
        if (!asset || !asset.url || !item.visible || asset.category !== 'images') return null

        return (
          <MoveableProxy
            key={item.id}
            item={item}
            imageNaturalWidth={asset.width || 1920}
            imageNaturalHeight={asset.height || 1080}
            isSelected={selectedCanvasItemId === item.id}
          />
        )
      })}
    </>
  )
}
