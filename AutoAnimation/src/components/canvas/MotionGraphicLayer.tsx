import { useCallback, useMemo, useRef, memo } from 'react'
import { useTimelineStore, useCanvasStore, useEditorStore } from '@/stores'
import { useMotionGraphicStore } from '@/stores/useMotionGraphicStore'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { getMotionGraphic } from '@/motionGraphics'
import { computeTransitionStyle } from '@/services/motionDesign/visualFlow'
import { SelectionTransformBox, type LiveTransformValues } from './SelectionTransformBox'
import type { MotionGraphicInstance } from '@/stores/useMotionGraphicStore'
import type { FlowTransitionType } from '@/services/motionDesign/visualFlow'

export const MotionGraphicLayer = memo(function MotionGraphicLayer() {
  const instances = useMotionGraphicStore((s) => s.instances)
  const frame = useTimelineStore((s) => s.currentFrame)

  const visible = instances.filter((inst) => inst.visible && frame >= inst.startFrame && frame < inst.endFrame)

  // Compute flow transitions between overlapping instances
  const flowOverlaps = useMemo(() => {
    const overlaps = new Map<
      string,
      { transitionType: FlowTransitionType; overlapProgress: number; isExiting: boolean }
    >()

    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        const a = visible[i]
        const b = visible[j]

        // Check if a ends while b starts (a exits, b enters)
        if (a.endFrame > b.startFrame && a.startFrame < b.startFrame) {
          const overlapStart = b.startFrame
          const overlapEnd = Math.min(a.endFrame, b.startFrame + (a.endFrame - b.startFrame))
          const overlapDuration = overlapEnd - overlapStart

          if (overlapDuration > 0 && frame >= overlapStart && frame < overlapEnd) {
            const overlapProgress = (frame - overlapStart) / overlapDuration
            const transitionType = (a.flowTransition as FlowTransitionType) || 'crossfade'

            overlaps.set(a.id, { transitionType, overlapProgress, isExiting: true })
            overlaps.set(b.id, { transitionType, overlapProgress, isExiting: false })
          }
        }
      }
    }

    return overlaps
  }, [visible, frame])

  if (visible.length === 0) return null

  return (
    <>
      {visible.map((inst) => (
        <MotionGraphicItem key={inst.id} instance={inst} flowOverlap={flowOverlaps.get(inst.id)} />
      ))}
    </>
  )
})

function MotionGraphicItem({
  instance,
  flowOverlap,
}: {
  instance: MotionGraphicInstance
  flowOverlap?: { transitionType: FlowTransitionType; overlapProgress: number; isExiting: boolean }
}) {
  const frame = useTimelineStore((s) => s.currentFrame)
  const fps = useTimelineStore((s) => s.fps)
  const canvasWidth = useCanvasStore((s) => s.canvasWidth)
  const canvasHeight = useCanvasStore((s) => s.canvasHeight)
  const selectedInstanceId = useMotionGraphicStore((s) => s.selectedInstanceId)
  const setSelectedInstanceId = useMotionGraphicStore((s) => s.setSelectedInstanceId)
  const updateInstance = useMotionGraphicStore((s) => s.updateInstance)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const setLiveTransform = useLiveTransformStore((s) => s.setLiveTransform)
  const clearLiveTransform = useLiveTransformStore((s) => s.clearLiveTransform)
  const registration = getMotionGraphic(instance.templateId)

  const targetRef = useRef<HTMLDivElement>(null)
  const isSelected = selectedInstanceId === instance.id

  const handleSelect = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      setSelectedInstanceId(instance.id)
      setRightPanelTab('motion-graphic-properties')
    },
    [instance.id, setSelectedInstanceId, setRightPanelTab],
  )

  const handleLiveTransform = useCallback(
    (values: LiveTransformValues) => {
      const newScale = Math.max(0.01, values.width / canvasWidth)
      setLiveTransform({
        type: 'motion-graphic',
        id: instance.id,
        x: values.left,
        y: values.top,
        rotation: Math.round(values.rotation),
        scale: newScale,
      })
    },
    [canvasWidth, instance.id, setLiveTransform],
  )

  const handleTransformEnd = useCallback(
    (state: { translate: [number, number]; width: number; height: number; rotate: number }) => {
      const el = targetRef.current
      if (!el) return

      clearLiveTransform()

      const finalLeft = parseFloat(el.style.left) || instance.position.x
      const finalTop = parseFloat(el.style.top) || instance.position.y
      const newScale = Math.max(0.01, el.offsetWidth / canvasWidth)

      updateInstance(instance.id, {
        position: { x: finalLeft, y: finalTop },
        rotation: Math.round(state.rotate),
        scale: newScale,
      })
    },
    [instance.id, instance.position.x, instance.position.y, canvasWidth, updateInstance, clearLiveTransform],
  )

  if (!registration) return null

  const Component = registration.component
  const localFrame = frame - instance.startFrame
  const durationInFrames = instance.endFrame - instance.startFrame
  const progress = durationInFrames > 0 ? localFrame / durationInFrames : 0

  // Compute flow transition transform
  let flowTransform = ''
  let flowOpacity = instance.opacity
  if (flowOverlap) {
    const ts = computeTransitionStyle(flowOverlap.transitionType, flowOverlap.overlapProgress, flowOverlap.isExiting)
    const parts: string[] = []
    if (ts.x !== 0 || ts.y !== 0) parts.push(`translate(${ts.x}%, ${ts.y}%)`)
    if (ts.scale !== 1) parts.push(`scale(${ts.scale})`)
    flowTransform = parts.join(' ')
    flowOpacity = instance.opacity * ts.opacity
  }

  // Combine instance rotation with flow transform
  const baseTransform = instance.rotation !== 0 ? `rotate(${instance.rotation}deg)` : ''
  const combinedTransform = [baseTransform, flowTransform].filter(Boolean).join(' ')

  return (
    <>
      <div
        ref={targetRef}
        data-canvas-element="motion-graphic"
        onClick={handleSelect}
        style={{
          position: 'absolute',
          left: instance.position.x,
          top: instance.position.y,
          width: canvasWidth * instance.scale,
          height: canvasHeight * instance.scale,
          opacity: flowOpacity,
          zIndex: instance.zIndex,
          transform: combinedTransform || undefined,
          overflow: 'hidden',
          cursor: 'move',
        }}
      >
        <div style={{ pointerEvents: 'none' }}>
          <Component
            config={instance.config}
            frame={localFrame}
            fps={fps}
            durationInFrames={durationInFrames}
            width={canvasWidth}
            height={canvasHeight}
            progress={progress}
          />
        </div>
      </div>

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
}
