import { useRef, useCallback, useEffect, memo } from 'react'
import { useMediaStore } from '@/stores/useMediaStore'
import { useEditorStore, useTimelineStore } from '@/stores'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import type { CanvasMediaItem, MediaTransitionType } from '@/stores/useMediaStore'
import { SelectionTransformBox, type LiveTransformValues } from './SelectionTransformBox'
import { useKeyframeRecorder } from '@/hooks/useKeyframeRecorder'

interface MediaLayerProps {
  canvasWidth: number
  canvasHeight: number
}

export function MediaLayer({ canvasWidth, canvasHeight }: MediaLayerProps) {
  const canvasItems = useMediaStore((s) => s.canvasItems)
  const assets = useMediaStore((s) => s.assets)
  const selectedCanvasItemId = useMediaStore((s) => s.selectedCanvasItemId)
  const setSelectedCanvasItemId = useMediaStore((s) => s.setSelectedCanvasItemId)
  const updateCanvasItem = useMediaStore((s) => s.updateCanvasItem)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  const handleSelect = useCallback((itemId: string) => {
    setSelectedCanvasItemId(itemId)
    setRightPanelTab('media-properties')
  }, [setSelectedCanvasItemId, setRightPanelTab])

  if (canvasItems.length === 0) return null

  return (
    <>
      {canvasItems.map((item) => {
        const asset = assets.find((a) => a.id === item.assetId)
        if (!asset || !asset.url || !item.visible) return null
        // Only render images here — video/audio handled by their own layers
        if (asset.category !== 'images') return null

        const isSelected = selectedCanvasItemId === item.id
        const imageUrl = item.treatedUrl || item.recoloredUrl || asset.url

        return (
          <MediaCanvasItem
            key={item.id}
            item={item}
            imageUrl={imageUrl}
            imageName={asset.name}
            imageNaturalWidth={asset.width}
            imageNaturalHeight={asset.height}
            isSelected={isSelected}
            onSelect={() => handleSelect(item.id)}
            onUpdate={(updates) => updateCanvasItem(item.id, updates)}
            canvasWidth={canvasWidth}
            canvasHeight={canvasHeight}
          />
        )
      })}
    </>
  )
}

// ── Transition math helpers ──────────────────────────────────────────────────

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** Compute CSS transform + opacity for a given transition type and progress (0→1). */
function getTransitionStyle(
  type: MediaTransitionType,
  progress: number, // 0 = start of transition, 1 = fully visible
  isExit: boolean,
): { opacity: number; transform: string } {
  // For exit transitions, reverse the progress (1 → 0)
  const t = isExit ? 1 - progress : progress
  const eased = easeInOutCubic(t)

  switch (type) {
    case 'fade':
      return { opacity: eased, transform: '' }
    case 'zoom-in':
      // Scale from 0.5 → 1
      return { opacity: eased, transform: `scale(${0.5 + 0.5 * eased})` }
    case 'zoom-out':
      // Scale from 1.3 → 1
      return { opacity: eased, transform: `scale(${1.3 - 0.3 * eased})` }
    case 'slide-left':
      // Slide from off-right to position
      return { opacity: 1, transform: `translateX(${(1 - eased) * 100}%)` }
    case 'slide-right':
      // Slide from off-left to position
      return { opacity: 1, transform: `translateX(${(eased - 1) * 100}%)` }
    case 'slide-up':
      // Slide from below to position
      return { opacity: 1, transform: `translateY(${(1 - eased) * 100}%)` }
    case 'ken-burns':
      // Slow zoom from 1.0 → 1.15 over the entire duration (not just transition)
      return { opacity: eased, transform: `scale(${1 + 0.15 * eased})` }
    case 'none':
    default:
      return { opacity: 1, transform: '' }
  }
}

// ── Per-item component ───────────────────────────────────────────────────────

interface MediaCanvasItemProps {
  item: CanvasMediaItem
  imageUrl: string
  imageName: string
  imageNaturalWidth?: number
  imageNaturalHeight?: number
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<CanvasMediaItem>) => void
  canvasWidth: number
  canvasHeight: number
}

const MediaCanvasItem = memo(function MediaCanvasItem({
  item,
  imageUrl,
  imageName,
  imageNaturalWidth: _imageNaturalWidth,
  imageNaturalHeight: _imageNaturalHeight,
  isSelected,
  onSelect,
  onUpdate,
  canvasWidth,
  canvasHeight,
}: MediaCanvasItemProps) {
  void _imageNaturalWidth
  void _imageNaturalHeight
  const targetRef = useRef<HTMLDivElement>(null)
  const { recordIfEnabled } = useKeyframeRecorder()

  // ── Canvas-relative rendering model ──
  // scale: 1 = fit to canvas (same as VideoLayer), not natural pixel size.
  // The container is always canvas-sized, and the image uses object-fit:contain.
  // This means images automatically fit regardless of their natural resolution.
  const baseWidth = canvasWidth
  const baseHeight = canvasHeight

  // Displayed dimensions = canvas size * scale
  const displayWidth = baseWidth * item.scale
  const displayHeight = baseHeight * item.scale

  const setLiveTransform = useLiveTransformStore((s) => s.setLiveTransform)
  const clearLiveTransform = useLiveTransformStore((s) => s.clearLiveTransform)

  // ── Frame visibility + transition RAF loop (zero re-renders) ──
  // Runs continuously only during playback; applies once on pause/scrub.
  useEffect(() => {
    let rafId: number
    let lastDisplay = ''
    let lastOpacity = ''
    let lastTransform = ''
    let lastFrame = -1

    const applyFrame = (el: HTMLDivElement, frame: number) => {
      const { startFrame, endFrame, enterTransition, exitTransition, transitionFrames } = item
      const visible = frame >= startFrame && frame < endFrame

      // Toggle display
      const display = visible ? '' : 'none'
      if (display !== lastDisplay) {
        el.style.display = display
        lastDisplay = display
      }

      if (visible) {
        let opacity = 1
        let transitionTransform = ''

        const framesIn = frame - startFrame
        const framesOut = endFrame - frame

        // Enter transition
        if (enterTransition !== 'none' && transitionFrames > 0 && framesIn < transitionFrames) {
          const progress = framesIn / transitionFrames
          const style = getTransitionStyle(enterTransition, progress, false)
          opacity = style.opacity
          transitionTransform = style.transform
        }
        // Exit transition
        else if (exitTransition !== 'none' && transitionFrames > 0 && framesOut < transitionFrames) {
          const progress = framesOut / transitionFrames
          const style = getTransitionStyle(exitTransition, progress, true)
          opacity = style.opacity
          transitionTransform = style.transform
        }
        // Ken-burns continuous (slow zoom over entire duration)
        else if (enterTransition === 'ken-burns' || exitTransition === 'ken-burns') {
          const totalDuration = endFrame - startFrame
          const normalizedProgress = totalDuration > 0 ? framesIn / totalDuration : 1
          // Slow zoom 1.0 → 1.15 over entire clip
          transitionTransform = `scale(${1 + 0.15 * normalizedProgress})`
        }

        // Combine with rotation
        const rotationStr = item.rotation !== 0 ? `rotate(${item.rotation}deg)` : ''
        const fullTransform = [transitionTransform, rotationStr].filter(Boolean).join(' ') || ''

        const opacityStr = String(Math.round(opacity * item.opacity * 100) / 100)

        if (opacityStr !== lastOpacity) {
          el.style.opacity = opacityStr
          lastOpacity = opacityStr
        }
        if (fullTransform !== lastTransform) {
          el.style.transform = fullTransform
          lastTransform = fullTransform
        }
      }
    }

    const tick = () => {
      const el = targetRef.current
      if (!el) { rafId = requestAnimationFrame(tick); return }

      const state = useTimelineStore.getState()
      if (state.currentFrame !== lastFrame) {
        lastFrame = state.currentFrame
        applyFrame(el, state.currentFrame)
      }

      // Only continue the RAF loop while playing
      if (state.isPlaying) {
        rafId = requestAnimationFrame(tick)
      }
    }

    // Apply once immediately (for scrub-while-paused)
    const el = targetRef.current
    if (el) {
      const frame = useTimelineStore.getState().currentFrame
      applyFrame(el, frame)
      lastFrame = frame
    }

    // Subscribe to timeline store changes when paused, so scrubbing still works
    const unsub = useTimelineStore.subscribe((state) => {
      if (!state.isPlaying && targetRef.current && state.currentFrame !== lastFrame) {
        lastFrame = state.currentFrame
        applyFrame(targetRef.current, state.currentFrame)
      }
      // Start RAF loop when playback begins
      if (state.isPlaying) {
        cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(tick)
      }
    })

    // Start RAF loop if currently playing
    if (useTimelineStore.getState().isPlaying) {
      rafId = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(rafId)
      unsub()
    }
  }, [
    item.startFrame, item.endFrame, item.enterTransition, item.exitTransition,
    item.transitionFrames, item.opacity, item.rotation,
  ])

  // ── Live: push real-time values to lightweight store during manipulation ──
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

  // ── Commit: read final left/top/width from DOM ──
  const handleTransformEnd = useCallback(
    (state: { translate: [number, number]; width: number; height: number; rotate: number }) => {
      const el = targetRef.current
      if (!el) return

      // Clear live transform — the main store will now have the final values
      clearLiveTransform()

      // Read final position from DOM (Moveable sets left/top directly)
      const finalLeft = parseFloat(el.style.left) || item.position.x
      const finalTop = parseFloat(el.style.top) || item.position.y

      // Compute new scale from width
      const finalWidth = el.offsetWidth
      const newScale = Math.max(0.01, finalWidth / baseWidth)

      const updates: Partial<CanvasMediaItem> = {
        position: { x: finalLeft, y: finalTop },
        rotation: Math.round(state.rotate),
        scale: newScale,
      }

      onUpdate(updates)

      // Record keyframes if in record mode
      recordIfEnabled(
        { objectType: 'media', objectId: item.id },
        { 'position.x': finalLeft, 'position.y': finalTop, rotation: Math.round(state.rotate), scale: newScale },
        { 'position.x': item.position.x, 'position.y': item.position.y, rotation: item.rotation, scale: item.scale }
      )
    },
    [item.id, item.position.x, item.position.y, item.rotation, item.scale, baseWidth, onUpdate, clearLiveTransform, recordIfEnabled]
  )

  // Element uses left/top in px — rotation + transitions are handled by the RAF loop above
  const style: React.CSSProperties = {
    position: 'absolute',
    left: item.position.x,
    top: item.position.y,
    width: displayWidth,
    height: displayHeight,
    opacity: item.opacity,
    zIndex: item.zIndex,
    cursor: 'move',
    overflow: 'hidden', // clip ken-burns zoom overflow
    mixBlendMode: item.blendMode && item.blendMode !== 'source-over' ? item.blendMode as React.CSSProperties['mixBlendMode'] : undefined,
  }

  // Don't set rotation in React style — the RAF loop manages the full transform string
  // (to avoid React overwriting the transition transforms)

  return (
    <>
      <div
        ref={targetRef}
        data-canvas-element="media"
        style={style}
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
      >
        <img
          src={imageUrl}
          alt={imageName}
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </div>

      {/* Moveable control box — only shown when selected */}
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
