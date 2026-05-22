import { useCallback } from 'react'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import type { CanvasObjectRef } from '@/types/keyframes'

/**
 * Hook that provides keyframe recording functionality.
 * When record mode is ON and the user finishes a transform,
 * call `recordIfEnabled` with the object reference and changed properties.
 *
 * Pass `currentValues` (the values BEFORE the transform) so the store
 * can auto-create a frame-0 keyframe when it's the first keyframe for a property.
 *
 * NOTE: We read `isRecordMode` and `currentFrame` from the store at call-time
 * (via getState) rather than from the React-level subscription to avoid stale
 * closure issues — the user may seek the timeline and immediately transform
 * before React re-renders this component.
 */
export function useKeyframeRecorder() {
  const isRecordMode = useKeyframeStore((s) => s.isRecordMode)

  const recordIfEnabled = useCallback(
    (
      objectRef: CanvasObjectRef,
      properties: Record<string, number>,
      currentValues?: Record<string, number>
    ) => {
      // Read live values from stores to avoid stale closures
      const recordMode = useKeyframeStore.getState().isRecordMode
      if (!recordMode) return
      const frame = useTimelineStore.getState().currentFrame
      useKeyframeStore.getState().setKeyframesFromTransform(
        objectRef,
        frame,
        properties,
        currentValues
      )
    },
    [] // No deps needed — we read everything from getState() at call-time
  )

  return { isRecordMode, recordIfEnabled }
}
