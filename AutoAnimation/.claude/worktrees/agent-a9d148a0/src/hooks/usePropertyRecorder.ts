import { useCallback, useRef } from 'react'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import type { CanvasObjectRef } from '@/types/keyframes'

/**
 * Lightweight hook for right-panel property recording.
 *
 * Returns a callback that, when called with a new value, records a keyframe
 * if record mode is enabled. Uses `getState()` at call-time to avoid stale
 * closures (same pattern as useKeyframeRecorder).
 *
 * Usage:
 *   const recordOpacity = usePropertyRecorder(
 *     { objectType: 'media', objectId: item.id },
 *     'opacity',
 *     item.opacity
 *   )
 *
 *   <DraggableNumberInput
 *     onChange={(v) => {
 *       updateCanvasItem(item.id, { opacity: v / 100 })
 *       recordOpacity(v / 100)
 *     }}
 *   />
 */
export function usePropertyRecorder(
  objectRef: CanvasObjectRef,
  propertyKey: string,
  currentValue: number
): (newValue: number) => void {
  // Track the "pre-change" value so we can bootstrap frame-0 keyframes
  const preChangeRef = useRef(currentValue)

  const recordProperty = useCallback(
    (newValue: number) => {
      const kfState = useKeyframeStore.getState()
      if (!kfState.isRecordMode) return

      const frame = useTimelineStore.getState().currentFrame

      kfState.setKeyframesFromTransform(
        objectRef,
        frame,
        { [propertyKey]: newValue },
        { [propertyKey]: preChangeRef.current }
      )
    },
    // We intentionally use the individual fields instead of the objectRef object
    // to keep the callback stable across re-renders (objectRef may be a new object each render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [objectRef.objectType, objectRef.objectId, propertyKey]
  )

  // Update pre-change ref when value settles (on each render)
  preChangeRef.current = currentValue

  return recordProperty
}

/**
 * Non-hook utility: record a single property change as a keyframe.
 *
 * Call this directly from onChange handlers when using a hook per-property
 * is impractical (e.g., early returns before hooks, or many properties).
 *
 * Usage:
 *   onChange={(v) => {
 *     updateCanvasItem(item.id, { opacity: v / 100 })
 *     recordPropertyChange(
 *       { objectType: 'media', objectId: item.id },
 *       'opacity', v / 100, item.opacity
 *     )
 *   }}
 */
export function recordPropertyChange(
  objectRef: CanvasObjectRef,
  propertyKey: string,
  newValue: number,
  previousValue: number
): void {
  const kfState = useKeyframeStore.getState()
  if (!kfState.isRecordMode) return

  const frame = useTimelineStore.getState().currentFrame

  kfState.setKeyframesFromTransform(
    objectRef,
    frame,
    { [propertyKey]: newValue },
    { [propertyKey]: previousValue }
  )
}
