import { Container, Text, TextStyle, Graphics, DEG_TO_RAD } from 'pixi.js'
import type { TextStyleFontWeight } from 'pixi.js'
import { useTextOverlayStore, type TextOverlay, type FontWeight, type TextCase } from '@/stores/useTextOverlayStore'
import { useTimelineStore } from '@/stores'

const fontWeightMap: Record<FontWeight, TextStyleFontWeight> = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '900',
}

/**
 * PixiTextOverlayLayer renders text overlays as PIXI.Text objects on the
 * WebGL canvas. This replaces the DOM-based TextOverlayLayer.tsx with
 * GPU-accelerated text rendering.
 *
 * Each text overlay gets:
 * - A PIXI.Text for the text content
 * - An optional PIXI.Graphics rectangle for the background
 * - Positioning logic matching the DOM version (top/center/bottom/free)
 *
 * Limitations vs DOM:
 * - PIXI.Text uses Canvas2D for text rasterization (still faster than full DOM layout)
 * - Font loading depends on browser font cache (Google Fonts must be loaded via CSS)
 * - No CSS flexbox — positioning is manual pixel math
 */
export class PixiTextOverlayLayer {
  private container: Container
  private entries = new Map<string, TextOverlayEntry>()

  // Canvas logical dimensions (e.g. 1920x1080)
  private logicalWidth = 1920
  // Canvas display dimensions (actual pixel size on screen)
  private displayWidth = 1920
  private displayHeight = 1080

  constructor(parentContainer: Container) {
    this.container = new Container()
    this.container.label = 'PixiTextOverlayLayer'
    this.container.sortableChildren = true
    parentContainer.addChild(this.container)
  }

  setDimensions(displayWidth: number, displayHeight: number, logicalWidth: number) {
    this.displayWidth = displayWidth
    this.displayHeight = displayHeight
    this.logicalWidth = logicalWidth
  }

  /**
   * Called each tick by the render loop.
   * @returns true if anything changed (dirty)
   */
  update(): boolean {
    const { overlays } = useTextOverlayStore.getState()
    const currentFrame = useTimelineStore.getState().currentFrame

    let dirty = false
    const activeIds = new Set<string>()

    for (const overlay of overlays) {
      if (!overlay.visible) continue

      activeIds.add(overlay.id)

      let entry = this.entries.get(overlay.id)
      if (!entry) {
        entry = this.createEntry(overlay.id)
        this.entries.set(overlay.id, entry)
        dirty = true
      }

      // Frame-range visibility
      const frameVisible = currentFrame >= overlay.startFrame && currentFrame < overlay.endFrame
      if (entry.container.visible !== frameVisible) {
        entry.container.visible = frameVisible
        dirty = true
      }
      if (!frameVisible) continue

      // Update text content, style, and position
      const cacheKey = this.getCacheKey(overlay)
      if (cacheKey !== entry.lastCacheKey) {
        this.updateEntry(entry, overlay)
        dirty = true
      }
    }

    // Remove entries that no longer exist
    for (const [id, entry] of this.entries) {
      if (!activeIds.has(id)) {
        this.container.removeChild(entry.container)
        entry.container.destroy({ children: true })
        this.entries.delete(id)
        dirty = true
      }
    }

    return dirty
  }

  private createEntry(id: string): TextOverlayEntry {
    const entryContainer = new Container()
    entryContainer.label = `textOverlay_${id}`
    entryContainer.sortableChildren = true
    this.container.addChild(entryContainer)

    const bg = new Graphics()
    bg.label = `textOverlay_bg_${id}`
    bg.visible = false
    entryContainer.addChild(bg)

    const text = new Text({ text: '', style: new TextStyle() })
    text.label = `textOverlay_text_${id}`
    entryContainer.addChild(text)

    return {
      container: entryContainer,
      text,
      bg,
      lastCacheKey: '',
      cachedWidth: 0,
      cachedHeight: 0,
    }
  }

  private updateEntry(entry: TextOverlayEntry, overlay: TextOverlay) {
    const cacheKey = this.getCacheKey(overlay)
    const needsRestyle = cacheKey !== entry.lastCacheKey

    if (needsRestyle) {
      entry.lastCacheKey = cacheKey

      // Scale factor: display pixels per logical pixel
      const scaleFactor = this.displayWidth / this.logicalWidth

      // Apply text case
      let displayContent = overlay.content
      switch (overlay.textCase as TextCase) {
        case 'uppercase': displayContent = displayContent.toUpperCase(); break
        case 'lowercase': displayContent = displayContent.toLowerCase(); break
        default: break
      }

      // Build PIXI TextStyle
      const scaledFontSize = overlay.fontSize * scaleFactor
      const style = new TextStyle({
        fontFamily: `"${overlay.fontFamily}", sans-serif`,
        fontSize: scaledFontSize,
        fontWeight: fontWeightMap[overlay.fontWeight],
        fill: overlay.color,
        align: overlay.align === 'justify' ? 'left' : overlay.align,
        lineHeight: scaledFontSize * overlay.lineHeight,
        letterSpacing: overlay.letterSpacing * scaleFactor,
        wordWrap: true,
        wordWrapWidth: this.displayWidth * 0.9,
        dropShadow: overlay.shadow ? {
          color: 'rgba(0,0,0,0.8)',
          blur: 8 * scaleFactor,
          distance: 2 * scaleFactor,
          angle: Math.PI / 2,
        } : undefined,
      })

      entry.text.text = displayContent
      entry.text.style = style

      // Cache text dimensions (avoids repeated bounds recalculation)
      entry.cachedWidth = entry.text.width
      entry.cachedHeight = entry.text.height

      // Background
      if (overlay.background) {
        entry.bg.visible = true
        entry.bg.clear()
        const padX = Math.max(4, scaledFontSize * 0.3)
        const padY = Math.max(2, scaledFontSize * 0.15)
        const bgWidth = entry.cachedWidth + padX * 2
        const bgHeight = entry.cachedHeight + padY * 2

        entry.bg.roundRect(-padX, -padY, bgWidth, bgHeight, 6 * scaleFactor)
        entry.bg.fill({ color: 0x000000, alpha: overlay.backgroundOpacity })
      } else {
        entry.bg.visible = false
      }
    }

    // Position the entry container
    this.positionEntry(entry, overlay)

    // Z-index and opacity
    entry.container.zIndex = overlay.zIndex
    entry.container.alpha = overlay.opacity
  }

  private positionEntry(entry: TextOverlayEntry, overlay: TextOverlay) {
    const textWidth = entry.cachedWidth
    const textHeight = entry.cachedHeight

    switch (overlay.position) {
      case 'top': {
        const y = this.displayHeight * 0.08
        entry.container.y = y
        entry.container.x = this.getAlignedX(overlay.align, textWidth)
        entry.container.rotation = 0
        break
      }
      case 'center': {
        const y = (this.displayHeight - textHeight) / 2
        entry.container.y = y
        entry.container.x = this.getAlignedX(overlay.align, textWidth)
        entry.container.rotation = 0
        break
      }
      case 'bottom': {
        const y = this.displayHeight * 0.92 - textHeight
        entry.container.y = y
        entry.container.x = this.getAlignedX(overlay.align, textWidth)
        entry.container.rotation = 0
        break
      }
      case 'free': {
        // freeX/freeY are center-based percentages of the canvas
        const centerX = (overlay.freeX / 100) * this.displayWidth
        const centerY = (overlay.freeY / 100) * this.displayHeight
        entry.container.x = centerX - textWidth / 2
        entry.container.y = centerY - textHeight / 2
        entry.container.rotation = overlay.rotation * DEG_TO_RAD
        // Set pivot to center for rotation
        entry.container.pivot.set(0, 0)
        if (overlay.rotation !== 0) {
          // Rotate around center of text
          entry.container.pivot.set(textWidth / 2, textHeight / 2)
          entry.container.x = centerX
          entry.container.y = centerY
        }
        break
      }
    }
  }

  private getAlignedX(align: string, textWidth: number): number {
    switch (align) {
      case 'center':
        return (this.displayWidth - textWidth) / 2
      case 'right':
        return this.displayWidth * 0.95 - textWidth
      default: // left, justify
        return this.displayWidth * 0.05
    }
  }

  private getCacheKey(overlay: TextOverlay): string {
    return [
      overlay.content,
      overlay.fontFamily,
      overlay.fontSize,
      overlay.fontWeight,
      overlay.color,
      overlay.align,
      overlay.position,
      overlay.freeX,
      overlay.freeY,
      overlay.lineHeight,
      overlay.letterSpacing,
      overlay.textCase,
      overlay.shadow,
      overlay.background,
      overlay.backgroundOpacity,
      overlay.opacity,
      overlay.rotation,
      this.displayWidth,
      this.displayHeight,
    ].join('|')
  }

  /**
   * Get the container for a specific text overlay (used by MoveableProxy).
   */
  getEntryContainer(overlayId: string): Container | undefined {
    return this.entries.get(overlayId)?.container
  }

  /** Set the z-index of this layer's container on the stage. */
  setZIndex(z: number) {
    this.container.zIndex = z
  }

  destroy() {
    for (const [, entry] of this.entries) {
      entry.container.destroy({ children: true })
    }
    this.entries.clear()
    this.container.destroy({ children: true })
  }
}

interface TextOverlayEntry {
  container: Container
  text: Text
  bg: Graphics
  lastCacheKey: string
  /** Cached text dimensions to avoid expensive bounds recalculation */
  cachedWidth: number
  cachedHeight: number
}
