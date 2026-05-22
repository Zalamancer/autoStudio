/**
 * React hook that provides the current formula context.
 *
 * Subscribes to relevant stores and returns a memoized context object.
 * Used by DraggableNumberInput when formula mode is active.
 */

import { useMemo } from 'react'
import type { FormulaContext } from '@/types/formula'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useTimelineStore } from '@/stores/useTimelineStore'

/**
 * Hook that builds a FormulaContext from current store values.
 * Re-renders when any subscribed value changes.
 */
export function useFormulaContext(): FormulaContext {
  const canvasWidth = useCanvasStore((s) => s.canvasWidth)
  const canvasHeight = useCanvasStore((s) => s.canvasHeight)
  const canvasZoom = useCanvasStore((s) => s.canvasZoom)

  const fps = useTimelineStore((s) => s.fps)
  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const totalFrames = useTimelineStore((s) => s.totalFrames)

  return useMemo(() => ({
    // Canvas
    width: canvasWidth,
    height: canvasHeight,
    centerX: canvasWidth / 2,
    centerY: canvasHeight / 2,
    zoom: canvasZoom,

    // Playback
    frame: currentFrame,
    fps,
    time: fps > 0 ? currentFrame / fps : 0,

    // Timeline
    totalFrames,
    duration: fps > 0 ? totalFrames / fps : 0,

    // Constants
    pi: Math.PI,
    e: Math.E,
    phi: (1 + Math.sqrt(5)) / 2,
    tau: Math.PI * 2,
  }), [canvasWidth, canvasHeight, canvasZoom, fps, currentFrame, totalFrames])
}
