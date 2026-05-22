import { useRef, useEffect, useCallback, useState, memo } from 'react'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useTimelineStore } from '@/stores'
import { useEditorStore } from '@/stores/useEditorStore'
import { buildSingleObjectSVG } from '@/services/svgComposer'
import { getComposedFilterStyle } from '@/services/boilingLineEffect'
import { getPixelatedFromCache, pixelateImageSrc } from '@/services/pixelArtEffect'
import { getEffectFromCache, processEffectAsync, getAnimatedSeed, isEffectEnabled } from '@/services/effects/effectDispatcher'
import { isSVGFilterEffect, getStyleEffectFilterStyle } from '@/services/styleEffectFilters'
import { SelectionTransformBox, type LiveTransformValues } from './SelectionTransformBox'
import type { SVGObject } from '@/types/svgObjects'

interface SVGObjectLayerProps {
  canvasWidth: number
  canvasHeight: number
}

/**
 * SVGObjectLayer renders SVG objects on the canvas.
 * Each object is rendered as an individual element so it can be clicked/selected.
 * A combined image is rendered underneath for the background.
 */
export const SVGObjectLayer = memo(function SVGObjectLayer({ canvasWidth, canvasHeight }: SVGObjectLayerProps) {
  const composition = useSVGObjectStore((s) => s.composition)
  const selectedObjectId = useSVGObjectStore((s) => s.selectedObjectId)

  // Force re-render on frame changes for per-object visibility
  const [, setTick] = useState(0)

  useEffect(() => {
    if (!composition) return
    let rafId: number
    let lastFrame = -1

    const sync = () => {
      const frame = useTimelineStore.getState().currentFrame
      if (frame !== lastFrame) {
        lastFrame = frame
        setTick((t) => t + 1)
      }
      rafId = requestAnimationFrame(sync)
    }

    rafId = requestAnimationFrame(sync)
    return () => cancelAnimationFrame(rafId)
  }, [composition])

  // Also re-render when store updates (colors, visibility changes)
  useEffect(() => {
    if (!composition) return
    return useSVGObjectStore.subscribe(() => setTick((t) => t + 1))
  }, [composition])

  const handleBackgroundClick = useCallback(() => {
    useSVGObjectStore.getState().selectObject(null)
  }, [])

  if (!composition) return null

  const scaleX = canvasWidth / composition.width
  const scaleY = canvasHeight / composition.height
  const scale = Math.min(scaleX, scaleY)
  const currentFrame = useTimelineStore.getState().currentFrame

  // Get visible objects sorted by zIndex
  const visibleObjects = composition.objects
    .filter((obj) => obj.visible && currentFrame >= obj.startFrame && currentFrame <= obj.endFrame)
    .sort((a, b) => a.zIndex - b.zIndex)

  // Build background SVG (just the background rect, no objects)
  const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${composition.width}" height="${composition.height}" viewBox="0 0 ${composition.width} ${composition.height}"><rect width="${composition.width}" height="${composition.height}" fill="${composition.background}"/></svg>`
  const bgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(bgSvg)}`

  return (
    <div
      className="absolute inset-0"
      style={{ zIndex: 6.5 }}
      onClick={handleBackgroundClick}
    >
      {/* Background layer */}
      {composition.background && composition.background !== 'transparent' && (
        <img
          src={bgDataUri}
          alt=""
          style={{
            position: 'absolute',
            width: composition.width * scale,
            height: composition.height * scale,
            pointerEvents: 'none',
          }}
          draggable={false}
        />
      )}

      {/* Per-object layers */}
      {visibleObjects.map((obj) => (
        <SVGObjectItem
          key={obj.id}
          obj={obj}
          compositionWidth={composition.width}
          compositionHeight={composition.height}
          scale={scale}
          currentFrame={currentFrame}
          isSelected={selectedObjectId === obj.id}
        />
      ))}
    </div>
  )
})

interface SVGObjectItemProps {
  obj: SVGObject
  compositionWidth: number
  compositionHeight: number
  scale: number
  currentFrame: number
  isSelected: boolean
}

const SVGObjectItem = memo(function SVGObjectItem({
  obj,
  compositionWidth,
  compositionHeight,
  scale,
  currentFrame,
  isSelected,
}: SVGObjectItemProps) {
  const targetRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const prevSvgRef = useRef('')

  const handleSelect = useCallback(() => {
    useSVGObjectStore.getState().selectObject(obj.id)
    useEditorStore.getState().setRightPanelTab('svg-object-properties')
  }, [obj.id])

  // Build and set the SVG data URI (with optional pixel art post-processing)
  useEffect(() => {
    if (!imgRef.current) return
    const svgString = buildSingleObjectSVG(obj, compositionWidth, compositionHeight, currentFrame)
    if (!svgString) return
    if (svgString === prevSvgRef.current) return
    prevSvgRef.current = svgString
    const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`

    const ase = obj.activeStyleEffect
    if (isEffectEnabled(ase)) {
      const seed = getAnimatedSeed(currentFrame, ase!)
      const cached = getEffectFromCache(dataUri, ase!, seed)
      if (cached) {
        imgRef.current.src = cached
      } else {
        imgRef.current.src = dataUri
        processEffectAsync(dataUri, ase!, seed).then((processed) => {
          if (imgRef.current && prevSvgRef.current === svgString) {
            imgRef.current.src = processed
          }
        }).catch(() => {})
      }
    } else if (obj.pixelArt?.enabled) {
      const cached = getPixelatedFromCache(dataUri, obj.pixelArt)
      if (cached) {
        imgRef.current.src = cached
      } else {
        imgRef.current.src = dataUri
        const settings = obj.pixelArt
        pixelateImageSrc(dataUri, settings).then((pixelated) => {
          if (imgRef.current && prevSvgRef.current === svgString) {
            imgRef.current.src = pixelated
          }
        }).catch(() => {})
      }
    } else {
      imgRef.current.src = dataUri
    }
  }, [obj, compositionWidth, compositionHeight, currentFrame])

  const handleTransformEnd = useCallback(
    (_state: { translate: [number, number]; width: number; height: number; rotate: number }) => {
      // SVG objects don't have individual position/size in the store yet,
      // but the selection box still provides visual feedback
    },
    []
  )

  const handleLiveTransform = useCallback(
    (_values: LiveTransformValues) => {
      // Visual feedback only for now
    },
    []
  )

  return (
    <>
      <div
        ref={targetRef}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: compositionWidth * scale,
          height: compositionHeight * scale,
          zIndex: obj.zIndex,
          cursor: 'pointer',
        }}
        onClick={(e) => {
          e.stopPropagation()
          handleSelect()
        }}
      >
        <img
          ref={imgRef}
          alt={obj.name}
          style={{
            width: '100%',
            height: '100%',
            imageRendering: obj.pixelArt?.enabled ? 'pixelated' : 'auto',
            pointerEvents: 'none',
            filter: (() => {
              const parts: string[] = []
              const svgFx = obj.activeStyleEffect
              if (svgFx && isEffectEnabled(svgFx) && isSVGFilterEffect(svgFx.type)) {
                const f = getStyleEffectFilterStyle(currentFrame, svgFx)
                if (f) parts.push(f)
              }
              if (obj.boilingLine?.enabled) {
                const f = getComposedFilterStyle(currentFrame, obj.boilingLine)
                if (f) parts.push(f)
              }
              return parts.length > 0 ? parts.join(' ') : undefined
            })(),
          }}
          draggable={false}
        />
      </div>

      {isSelected && (
        <SelectionTransformBox
          targetRef={targetRef}
          onTransformEnd={handleTransformEnd}
          onLiveTransform={handleLiveTransform}
          keepRatio={true}
          color="#10b981"
        />
      )}
    </>
  )
})
