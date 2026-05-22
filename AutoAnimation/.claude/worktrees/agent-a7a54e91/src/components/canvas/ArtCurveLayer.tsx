import { useRef, useCallback, memo, useMemo } from 'react'
import { useArtCurveStore } from '@/stores/useArtCurveStore'
import { useEditorStore } from '@/stores'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { SelectionTransformBox, type LiveTransformValues } from './SelectionTransformBox'
import { useFrameVisibility } from '@/hooks/useFrameVisibility'
import { buildVariableWidthSVG } from '@/services/artCurveGenerator'
import type { ArtCurveComposition } from '@/types/artCurves'

interface ArtCurveLayerProps {
  canvasWidth: number
  canvasHeight: number
}

export function ArtCurveLayer({ canvasWidth: _canvasWidth, canvasHeight: _canvasHeight }: ArtCurveLayerProps) {
  const compositions = useArtCurveStore((s) => s.compositions)
  const selectedId = useArtCurveStore((s) => s.selectedCompositionId)
  const setSelectedId = useArtCurveStore((s) => s.setSelectedCompositionId)
  const updateComposition = useArtCurveStore((s) => s.updateComposition)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  if (compositions.length === 0) return null

  return (
    <>
      {compositions.map((comp) => {
        if (!comp.visible) return null
        const isSelected = selectedId === comp.id

        return (
          <ArtCurveCanvasItem
            key={comp.id}
            composition={comp}
            isSelected={isSelected}
            onSelect={() => {
              setSelectedId(comp.id)
              setRightPanelTab('art-curve-properties')
            }}
            onUpdate={(updates) => updateComposition(comp.id, updates)}
          />
        )
      })}
    </>
  )
}

interface ArtCurveCanvasItemProps {
  composition: ArtCurveComposition
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<ArtCurveComposition>) => void
}

const ArtCurveCanvasItem = memo(function ArtCurveCanvasItem({
  composition,
  isSelected,
  onSelect,
  onUpdate,
}: ArtCurveCanvasItemProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const setLiveTransform = useLiveTransformStore((s) => s.setLiveTransform)
  const clearLiveTransform = useLiveTransformStore((s) => s.clearLiveTransform)

  useFrameVisibility(targetRef, composition.startFrame, composition.endFrame)

  const svgContent = useMemo(
    () => buildVariableWidthSVG(composition.curves, 800, 600, composition.animated),
    [composition.curves, composition.animated]
  )

  // Default display size
  const displayWidth = 800 * composition.scale
  const displayHeight = 600 * composition.scale

  const handleLiveTransform = useCallback(
    (values: LiveTransformValues) => {
      setLiveTransform({
        type: 'shape',
        id: composition.id,
        x: values.left,
        y: values.top,
        rotation: Math.round(values.rotation),
        scale: values.width / 800,
      })
    },
    [composition.id, setLiveTransform]
  )

  const handleTransformEnd = useCallback(
    (state: { translate: [number, number]; width: number; height: number; rotate: number }) => {
      const el = targetRef.current
      if (!el) return

      clearLiveTransform()

      const finalLeft = parseFloat(el.style.left) || composition.position.x
      const finalTop = parseFloat(el.style.top) || composition.position.y
      const finalWidth = el.offsetWidth

      onUpdate({
        position: { x: finalLeft, y: finalTop },
        scale: finalWidth / 800,
        rotation: Math.round(state.rotate),
      })
    },
    [composition.id, composition.position.x, composition.position.y, onUpdate, clearLiveTransform]
  )

  const style: React.CSSProperties = {
    position: 'absolute',
    left: composition.position.x,
    top: composition.position.y,
    width: displayWidth,
    height: displayHeight,
    opacity: composition.opacity,
    zIndex: composition.zIndex,
    cursor: 'move',
    backgroundColor: composition.bgTransparent ? 'transparent' : composition.bgColor,
    borderRadius: composition.bgTransparent ? undefined : 8,
  }

  if (composition.rotation !== 0) {
    style.transform = `rotate(${composition.rotation}deg)`
  }

  return (
    <>
      <div
        ref={targetRef}
        style={style}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <div
          className="w-full h-full pointer-events-none"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </div>

      {isSelected && (
        <SelectionTransformBox
          targetRef={targetRef}
          onTransformEnd={handleTransformEnd}
          onLiveTransform={handleLiveTransform}
          keepRatio
          color="#f59e0b"
        />
      )}
    </>
  )
})
