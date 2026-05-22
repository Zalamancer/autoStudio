import { Container, Graphics, DEG_TO_RAD } from 'pixi.js'
import { useShapeStore } from '@/stores/useShapeStore'
import { useTimelineStore } from '@/stores'
import type { CanvasShape, ShapeType } from '@/types/shapes'

/**
 * PixiShapeLayer renders shapes (rectangles, circles, triangles, stars) as
 * PIXI.Graphics objects on the WebGL canvas. This replaces the DOM-based
 * ShapeLayer which used SVG elements.
 *
 * Each shape becomes a PIXI.Graphics child of the container.
 * Shapes are synced from the Zustand store every tick.
 */
export class PixiShapeLayer {
  private container: Container
  private graphics = new Map<string, Graphics>()
  // Dirty tracking
  private _lastTransformKeys = new Map<string, string>()

  constructor(parentContainer: Container) {
    this.container = new Container()
    this.container.label = 'PixiShapeLayer'
    this.container.sortableChildren = true
    parentContainer.addChild(this.container)
  }

  /**
   * Called each frame by the render loop.
   * @returns true if anything changed (dirty)
   */
  update(): boolean {
    const { shapes } = useShapeStore.getState()
    const currentFrame = useTimelineStore.getState().currentFrame

    let dirty = false
    const activeIds = new Set<string>()

    for (const shape of shapes) {
      if (!shape.visible) continue

      activeIds.add(shape.id)

      let gfx = this.graphics.get(shape.id)
      if (!gfx) {
        gfx = new Graphics()
        gfx.label = shape.id
        this.graphics.set(shape.id, gfx)
        this.container.addChild(gfx)
        dirty = true
      }

      // Frame-range visibility
      const visible = currentFrame >= shape.startFrame && currentFrame < shape.endFrame
      if (gfx.visible !== visible) {
        gfx.visible = visible
        dirty = true
      }
      if (!visible) continue

      // Build transform key for dirty check
      const transformKey = `${shape.position.x},${shape.position.y},${shape.rotation},${shape.opacity},${shape.zIndex}`
      const lastKey = this._lastTransformKeys.get(shape.id)
      if (transformKey !== lastKey) {
        this._lastTransformKeys.set(shape.id, transformKey)
        // Update transform
        gfx.x = shape.position.x
        gfx.y = shape.position.y
        gfx.rotation = shape.rotation * DEG_TO_RAD
        gfx.alpha = shape.opacity
        gfx.zIndex = shape.zIndex
        dirty = true
      }

      // Redraw the shape graphics (drawShape has its own cache key)
      const shapeKey = this.getShapeCacheKey(shape)
      if ((gfx as any).__cacheKey !== shapeKey) {
        this.drawShape(gfx, shape)
        dirty = true
      }
    }

    // Remove graphics for shapes that no longer exist
    for (const [id, gfx] of this.graphics) {
      if (!activeIds.has(id)) {
        this.container.removeChild(gfx)
        gfx.destroy()
        this.graphics.delete(id)
        this._lastTransformKeys.delete(id)
        dirty = true
      }
    }

    return dirty
  }

  private drawShape(gfx: Graphics, shape: CanvasShape) {
    // Check if we need to redraw (compare against cached version)
    const cacheKey = this.getShapeCacheKey(shape)
    if ((gfx as any).__cacheKey === cacheKey) return

    gfx.clear()

    const rawFill = shape.fill
    const fillColor = typeof rawFill === 'string' ? rawFill : (rawFill as any)?.stops?.[0]?.color ?? '#000000'
    const strokeColor = shape.stroke
    const strokeWidth = shape.strokeWidth

    // Set fill
    if (fillColor && fillColor !== 'transparent') {
      gfx.fill({ color: fillColor })
    }

    // Set stroke
    if (strokeColor && strokeColor !== 'transparent' && strokeWidth > 0) {
      gfx.stroke({ color: strokeColor, width: strokeWidth })
    }

    // Draw the shape path
    this.drawShapePath(gfx, shape)

    // Cache the key to avoid unnecessary redraws
    ;(gfx as any).__cacheKey = cacheKey
  }

  private drawShapePath(gfx: Graphics, shape: CanvasShape) {
    const { width, height, type, strokeWidth } = shape
    const sw = strokeWidth || 0

    switch (type as ShapeType) {
      case 'rectangle': {
        const br = shape.borderRadius ?? 0
        if (br > 0) {
          gfx.roundRect(sw / 2, sw / 2, width - sw, height - sw, br)
        } else {
          gfx.rect(sw / 2, sw / 2, width - sw, height - sw)
        }
        gfx.fill()
        if (sw > 0) gfx.stroke()
        break
      }

      case 'circle': {
        gfx.ellipse(width / 2, height / 2, (width - sw) / 2, (height - sw) / 2)
        gfx.fill()
        if (sw > 0) gfx.stroke()
        break
      }

      case 'triangle': {
        const inset = sw / 2
        gfx.moveTo(width / 2, inset)
        gfx.lineTo(width - inset, height - inset)
        gfx.lineTo(inset, height - inset)
        gfx.closePath()
        gfx.fill()
        if (sw > 0) gfx.stroke()
        break
      }

      case 'star': {
        const cx = width / 2
        const cy = height / 2
        const outerR = Math.min(width, height) / 2 - sw / 2
        const innerR = outerR * (shape.innerRadius ?? 0.4)
        const numPoints = shape.points ?? 5

        for (let i = 0; i < numPoints * 2; i++) {
          const angle = (Math.PI * i) / numPoints - Math.PI / 2
          const r = i % 2 === 0 ? outerR : innerR
          const px = cx + r * Math.cos(angle)
          const py = cy + r * Math.sin(angle)
          if (i === 0) {
            gfx.moveTo(px, py)
          } else {
            gfx.lineTo(px, py)
          }
        }
        gfx.closePath()
        gfx.fill()
        if (sw > 0) gfx.stroke()
        break
      }
    }
  }

  private getShapeCacheKey(shape: CanvasShape): string {
    return `${shape.type}_${shape.width}_${shape.height}_${shape.fill}_${shape.stroke}_${shape.strokeWidth}_${shape.borderRadius}_${shape.points}_${shape.innerRadius}`
  }

  /**
   * Returns the Graphics object for a given shape ID (used by MoveableProxy).
   */
  getGraphics(shapeId: string): Graphics | undefined {
    return this.graphics.get(shapeId)
  }

  /** Set the z-index of this layer's container on the stage. */
  setZIndex(z: number) {
    this.container.zIndex = z
  }

  destroy() {
    for (const [, gfx] of this.graphics) {
      gfx.destroy()
    }
    this.graphics.clear()
    this.container.destroy({ children: true })
  }
}
