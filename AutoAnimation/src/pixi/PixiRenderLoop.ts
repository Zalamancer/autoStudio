import type { Application, Ticker } from 'pixi.js'
import type { PixiMediaLayer } from './PixiMediaLayer'
import type { PixiShapeLayer } from './PixiShapeLayer'
import type { PixiCharacterComposite } from './PixiCharacterComposite'
import type { PixiMultiCharacterLayer } from './PixiMultiCharacterLayer'
import type { PixiTextOverlayLayer } from './PixiTextOverlayLayer'
import type { PixiCaptionOverlay } from './PixiCaptionOverlay'
import type { PixiImageStoryLayer } from './PixiImageStoryLayer'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'

/**
 * PixiRenderLoop manages a single PIXI.Ticker callback that drives
 * all PixiJS layer updates. This replaces multiple independent RAF loops
 * with a single unified update cycle.
 *
 * Usage:
 *   const loop = new PixiRenderLoop(app)
 *   loop.setMediaLayer(mediaLayer)
 *   loop.setShapeLayer(shapeLayer)
 *   loop.start()
 *   // Later:
 *   loop.stop()
 *   loop.destroy()
 */
export class PixiRenderLoop {
  private app: Application
  private mediaLayer: PixiMediaLayer | null = null
  private shapeLayer: PixiShapeLayer | null = null
  private characterComposite: PixiCharacterComposite | null = null
  private multiCharacterLayer: PixiMultiCharacterLayer | null = null
  private textOverlayLayer: PixiTextOverlayLayer | null = null
  private captionOverlay: PixiCaptionOverlay | null = null
  private imageStoryLayer: PixiImageStoryLayer | null = null
  private tickerCallback: ((ticker: Ticker) => void) | null = null
  private currentFrame = 0
  private running = false

  // Logical canvas dimensions (export resolution, e.g. 1920×1080)
  private logicalWidth = 1920
  private logicalHeight = 1080
  // Display canvas dimensions (CSS pixels on screen, e.g. 1073×604)
  private displayWidth = 1920
  private displayHeight = 1080

  constructor(app: Application) {
    this.app = app
  }

  setMediaLayer(layer: PixiMediaLayer | null) {
    this.mediaLayer = layer
  }

  setShapeLayer(layer: PixiShapeLayer | null) {
    this.shapeLayer = layer
  }

  setCharacterComposite(composite: PixiCharacterComposite | null) {
    this.characterComposite = composite
  }

  setMultiCharacterLayer(layer: PixiMultiCharacterLayer | null) {
    this.multiCharacterLayer = layer
  }

  setTextOverlayLayer(layer: PixiTextOverlayLayer | null) {
    this.textOverlayLayer = layer
  }

  setCaptionOverlay(layer: PixiCaptionOverlay | null) {
    this.captionOverlay = layer
  }

  setImageStoryLayer(layer: PixiImageStoryLayer | null) {
    this.imageStoryLayer = layer
  }

  setCurrentFrame(frame: number) {
    this.currentFrame = frame
  }

  setLogicalDimensions(width: number, height: number) {
    this.logicalWidth = width
    this.logicalHeight = height
  }

  setDisplayDimensions(width: number, height: number) {
    this.displayWidth = width
    this.displayHeight = height
  }

  start() {
    if (this.running) return
    this.running = true

    this.tickerCallback = (ticker: Ticker) => {
      const deltaMs = ticker.deltaMS
      let dirty = false

      // Determine character rendering mode: single composite vs multi-character
      const isMultiCharMode = useMultiCharacterStore.getState().characters.length > 0

      // Update all registered layers each frame — each returns true if something changed
      if (this.mediaLayer?.update(this.displayWidth, this.displayHeight)) dirty = true
      if (this.shapeLayer?.update()) dirty = true

      // Only one character layer should be active at a time
      if (isMultiCharMode) {
        this.characterComposite?.setVisible(false)
        if (
          this.multiCharacterLayer?.update(
            this.logicalWidth,
            this.logicalHeight,
            this.displayWidth,
            this.displayHeight,
            deltaMs,
          )
        )
          dirty = true
      } else {
        if (
          this.characterComposite?.update(
            this.logicalWidth,
            this.logicalHeight,
            this.displayWidth,
            this.displayHeight,
            deltaMs,
          )
        )
          dirty = true
      }

      if (this.imageStoryLayer?.update(this.currentFrame)) dirty = true
      if (this.textOverlayLayer?.update()) dirty = true
      if (this.captionOverlay?.update()) dirty = true

      // Only render when something actually changed
      if (dirty) {
        this.app.render()
      }
    }

    this.app.ticker.add(this.tickerCallback)
    this.app.ticker.start()
  }

  stop() {
    if (!this.running) return
    this.running = false

    if (this.tickerCallback) {
      this.app.ticker.remove(this.tickerCallback)
      this.tickerCallback = null
    }
    this.app.ticker.stop()
  }

  destroy() {
    this.stop()
    this.mediaLayer = null
    this.shapeLayer = null
    this.characterComposite = null
    this.multiCharacterLayer = null
    this.textOverlayLayer = null
    this.captionOverlay = null
    this.imageStoryLayer = null
  }
}
