/**
 * Formula Context Builder.
 *
 * Builds the variable context from Zustand stores for formula evaluation.
 * Returns a FormulaContext record mapping variable names to numeric values.
 */

import type { FormulaContext } from '@/types/formula'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useTimelineStore } from '@/stores/useTimelineStore'

/**
 * Build formula context by reading current store state.
 * Call this whenever you need to evaluate a formula.
 */
export function buildFormulaContext(): FormulaContext {
  const canvasState = useCanvasStore.getState()
  const timelineState = useTimelineStore.getState()

  const width = canvasState.canvasWidth
  const height = canvasState.canvasHeight
  const zoom = canvasState.canvasZoom
  const fps = timelineState.fps || 30
  const frame = timelineState.currentFrame || 0
  const totalFrames = timelineState.totalFrames || 0

  return {
    // Canvas
    width,
    height,
    centerX: width / 2,
    centerY: height / 2,
    zoom,

    // Playback
    frame,
    fps,
    time: fps > 0 ? frame / fps : 0,

    // Timeline
    totalFrames,
    duration: fps > 0 ? totalFrames / fps : 0,

    // Constants (also available in the engine, but convenient here)
    pi: Math.PI,
    e: Math.E,
    phi: (1 + Math.sqrt(5)) / 2,
    tau: Math.PI * 2,
  }
}

/**
 * Get formula variables as a selector for store subscriptions.
 */
export function getCanvasFormulaVariables(): {
  width: number
  height: number
  zoom: number
  centerX: number
  centerY: number
} {
  const { canvasWidth, canvasHeight, canvasZoom } = useCanvasStore.getState()
  return {
    width: canvasWidth,
    height: canvasHeight,
    zoom: canvasZoom,
    centerX: canvasWidth / 2,
    centerY: canvasHeight / 2,
  }
}
