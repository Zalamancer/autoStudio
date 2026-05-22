import { useCanvasStore } from '@/stores'

/**
 * Coordinates bridge between PixiJS canvas space and DOM screen space.
 *
 * PixiJS sprites live in "logical canvas" coordinates (e.g. 0–1920 for 16:9).
 * The DOM container displays the canvas at a scaled size (canvasDisplayWidth × canvasDisplayHeight)
 * with zoom and pan applied. The MoveableProxy divs need to be positioned in
 * DOM pixels matching where the PixiJS sprite appears on screen.
 *
 * Coordinate spaces:
 *   Logical (PixiJS)  →  Display (DOM pixels within the canvas container)
 *   e.g. (960, 540)   →  depends on canvasDisplayWidth, canvasDisplayHeight
 */

export interface CoordinateContext {
  /** Logical canvas width (e.g. 1920) */
  logicalWidth: number
  /** Logical canvas height (e.g. 1080) */
  logicalHeight: number
  /** Displayed canvas width in CSS pixels */
  displayWidth: number
  /** Displayed canvas height in CSS pixels */
  displayHeight: number
}

/**
 * Convert logical canvas coordinates (used by PixiJS and stores)
 * to display coordinates (CSS pixels within the canvas container div).
 */
export function logicalToDisplay(
  logicalX: number,
  logicalY: number,
  ctx: CoordinateContext
): { x: number; y: number } {
  const scaleX = ctx.displayWidth / ctx.logicalWidth
  const scaleY = ctx.displayHeight / ctx.logicalHeight
  return {
    x: logicalX * scaleX,
    y: logicalY * scaleY,
  }
}

/**
 * Convert display coordinates (CSS pixels within the canvas container)
 * back to logical canvas coordinates.
 */
export function displayToLogical(
  displayX: number,
  displayY: number,
  ctx: CoordinateContext
): { x: number; y: number } {
  const scaleX = ctx.logicalWidth / ctx.displayWidth
  const scaleY = ctx.logicalHeight / ctx.displayHeight
  return {
    x: displayX * scaleX,
    y: displayY * scaleY,
  }
}

/**
 * Compute the scale factor from logical to display coordinates.
 * Uniform scale (assumes aspect ratio is maintained).
 */
export function getLogicalToDisplayScale(ctx: CoordinateContext): number {
  return ctx.displayWidth / ctx.logicalWidth
}

/**
 * Convert a logical size (width, height) to display pixels.
 */
export function logicalSizeToDisplay(
  logicalW: number,
  logicalH: number,
  ctx: CoordinateContext
): { width: number; height: number } {
  const scale = getLogicalToDisplayScale(ctx)
  return {
    width: logicalW * scale,
    height: logicalH * scale,
  }
}

/**
 * Get the current coordinate context from stores.
 * Call this from within React components or effects.
 */
export function getCoordinateContext(
  displayWidth: number,
  displayHeight: number
): CoordinateContext {
  const { canvasWidth, canvasHeight } = useCanvasStore.getState()
  return {
    logicalWidth: canvasWidth,
    logicalHeight: canvasHeight,
    displayWidth,
    displayHeight,
  }
}
