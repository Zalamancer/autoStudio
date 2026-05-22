import { useCallback, useMemo, useRef } from 'react'
import { useTimelineStore, useCanvasStore, useEditorStore } from '@/stores'
import { useMotionGraphicStore } from '@/stores/useMotionGraphicStore'
import { getMotionGraphic } from '@/motionGraphics'
import { computeTransitionStyle } from '@/services/motionDesign/visualFlow'
import type { MotionGraphicInstance } from '@/stores/useMotionGraphicStore'
import type { FlowTransitionType } from '@/services/motionDesign/visualFlow'

export function MotionGraphicLayer() {
  const instances = useMotionGraphicStore((s) => s.instances)
  const frame = useTimelineStore((s) => s.currentFrame)

  const visible = instances.filter(
    (inst) => inst.visible && frame >= inst.startFrame && frame < inst.endFrame,
  )

  // Compute flow transitions between overlapping instances
  const flowOverlaps = useMemo(() => {
    const overlaps = new Map<string, { transitionType: FlowTransitionType; overlapProgress: number; isExiting: boolean }>()

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
        <MotionGraphicItem
          key={inst.id}
          instance={inst}
          flowOverlap={flowOverlaps.get(inst.id)}
        />
      ))}
    </>
  )
}

function MotionGraphicItem({
  instance,
  flowOverlap,
}: {
  instance: MotionGraphicInstance
  flowOverlap?: { transitionType: FlowTransitionType; overlapProgress: number; isExiting: boolean }
}) {
  const frame = useTimelineStore((s) => s.currentFrame)
  const fps = useTimelineStore((s) => s.fps)
  const width = useCanvasStore((s) => s.canvasWidth)
  const height = useCanvasStore((s) => s.canvasHeight)
  const zoom = useCanvasStore((s) => s.zoom)
  const selectedInstanceId = useMotionGraphicStore((s) => s.selectedInstanceId)
  const setSelectedInstanceId = useMotionGraphicStore((s) => s.setSelectedInstanceId)
  const updateInstance = useMotionGraphicStore((s) => s.updateInstance)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const registration = getMotionGraphic(instance.templateId)

  const isSelected = selectedInstanceId === instance.id
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      e.preventDefault()

      // Select on mousedown
      setSelectedInstanceId(instance.id)
      setRightPanelTab('motion-graphic-properties')

      // Start drag tracking
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: instance.position.x,
        origY: instance.position.y,
      }

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current) return
        const dx = (ev.clientX - dragRef.current.startX) / zoom
        const dy = (ev.clientY - dragRef.current.startY) / zoom
        updateInstance(instance.id, {
          position: {
            x: dragRef.current.origX + dx,
            y: dragRef.current.origY + dy,
          },
        })
      }

      const handleMouseUp = () => {
        dragRef.current = null
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }

      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    },
    [instance.id, instance.position.x, instance.position.y, zoom, setSelectedInstanceId, setRightPanelTab, updateInstance],
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
    const ts = computeTransitionStyle(
      flowOverlap.transitionType,
      flowOverlap.overlapProgress,
      flowOverlap.isExiting,
    )
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
    <div
      style={{
        position: 'absolute',
        left: instance.position.x,
        top: instance.position.y,
        width: width * instance.scale,
        height: height * instance.scale,
        opacity: flowOpacity,
        zIndex: instance.zIndex,
        transform: combinedTransform || undefined,
        overflow: 'hidden',
      }}
    >
      {/* Component content */}
      <div style={{ pointerEvents: 'none' }}>
        <Component
          config={instance.config}
          frame={localFrame}
          fps={fps}
          durationInFrames={durationInFrames}
          width={width}
          height={height}
          progress={progress}
        />
      </div>
      {/* Drag + click overlay */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'absolute',
          inset: 0,
          cursor: isSelected ? 'grab' : 'pointer',
          border: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
          borderRadius: 2,
          boxSizing: 'border-box',
        }}
      />
    </div>
  )
}
