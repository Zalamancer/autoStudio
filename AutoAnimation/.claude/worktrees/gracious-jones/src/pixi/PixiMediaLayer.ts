import { Container, Sprite, Assets, Texture, DEG_TO_RAD } from 'pixi.js'
import { useMediaStore, type CanvasMediaItem, type MediaAsset } from '@/stores/useMediaStore'
import { useTimelineStore } from '@/stores'

/**
 * PixiMediaLayer manages PIXI.Sprite instances for media images on the canvas.
 * It subscribes to the Zustand media store and syncs sprites each tick.
 *
 * Usage:
 *   const layer = new PixiMediaLayer(stage)
 *   // On each tick:
 *   layer.update()
 *   // On cleanup:
 *   layer.destroy()
 */
export class PixiMediaLayer {
  private container: Container
  private sprites = new Map<string, Sprite>()
  private textureCache = new Map<string, Texture>()
  private loadingUrls = new Set<string>()
  // Display canvas dimensions (CSS pixels) — used as fallback for assets without known dimensions
  private _displayW = 1920
  private _displayH = 1080
  // Dirty tracking: cache per-item transform keys to skip no-op frames
  private _lastTransformKeys = new Map<string, string>()

  constructor(parentContainer: Container) {
    this.container = new Container()
    this.container.label = 'PixiMediaLayer'
    parentContainer.addChild(this.container)
  }

  /**
   * Called each frame by the render loop.
   * Reads the latest store state and syncs sprites.
   * @returns true if anything changed (dirty), false if frame can be skipped
   */
  update(displayW?: number, displayH?: number): boolean {
    this._displayW = displayW || this._displayW
    this._displayH = displayH || this._displayH
    const { canvasItems, assets } = useMediaStore.getState()
    const currentFrame = useTimelineStore.getState().currentFrame

    let dirty = false

    // Track which item IDs are still active
    const activeIds = new Set<string>()

    for (const item of canvasItems) {
      if (!item.visible) continue

      const asset = assets.find((a) => a.id === item.assetId)
      if (!asset || !asset.url || asset.category !== 'images') continue

      activeIds.add(item.id)
      const imageUrl = item.recoloredUrl || asset.url

      let sprite = this.sprites.get(item.id)

      if (!sprite) {
        // Create new sprite
        sprite = new Sprite()
        sprite.label = item.id
        this.sprites.set(item.id, sprite)
        this.container.addChild(sprite)

        // Load texture async
        this.loadTexture(item.id, imageUrl)
        dirty = true
      } else {
        // Check if URL changed (e.g. after recolor)
        const currentTexUrl = (sprite as any).__texUrl as string | undefined
        if (currentTexUrl && currentTexUrl !== imageUrl) {
          this.loadTexture(item.id, imageUrl)
          dirty = true
        }
      }

      // Build transform key to check if anything moved
      const transformKey = `${item.position.x},${item.position.y},${item.rotation},${item.opacity},${item.scale},${item.zIndex},${currentFrame >= item.startFrame && currentFrame < item.endFrame}`
      const lastKey = this._lastTransformKeys.get(item.id)
      if (transformKey !== lastKey) {
        this._lastTransformKeys.set(item.id, transformKey)
        // Update transform from store
        this.syncSpriteTransform(sprite, item, asset, currentFrame)
        dirty = true
      }
    }

    // Remove sprites for items that no longer exist
    for (const [id, sprite] of this.sprites) {
      if (!activeIds.has(id)) {
        this.container.removeChild(sprite)
        sprite.destroy()
        this.sprites.delete(id)
        this._lastTransformKeys.delete(id)
        dirty = true
      }
    }

    return dirty
  }

  private syncSpriteTransform(
    sprite: Sprite,
    item: CanvasMediaItem,
    asset: MediaAsset,
    currentFrame: number
  ) {
    // Frame-range visibility
    const visible = currentFrame >= item.startFrame && currentFrame < item.endFrame
    sprite.visible = visible
    if (!visible) return

    // Position (same coordinate system as DOM — left/top in logical pixels)
    sprite.x = item.position.x
    sprite.y = item.position.y

    // Scale: the DOM version computes displayWidth = naturalWidth * scale
    // In PixiJS, we set the sprite width/height directly
    // Fallback matches DOM MediaLayer: uses canvasWidth (display pixels) when no natural dimensions
    const baseWidth = asset.width || this._displayW
    const baseHeight = asset.height || this._displayH
    sprite.width = baseWidth * item.scale
    sprite.height = baseHeight * item.scale

    // Rotation (PixiJS uses radians, DOM uses degrees)
    sprite.rotation = item.rotation * DEG_TO_RAD

    // Opacity
    sprite.alpha = item.opacity

    // Z-index: PixiJS uses child ordering, we'll set zIndex and rely on sortableChildren
    sprite.zIndex = item.zIndex
  }

  private async loadTexture(itemId: string, url: string) {
    if (this.loadingUrls.has(url)) return

    // Check cache first
    let texture = this.textureCache.get(url)
    if (texture) {
      const sprite = this.sprites.get(itemId)
      if (sprite) {
        sprite.texture = texture
        ;(sprite as any).__texUrl = url
      }
      return
    }

    this.loadingUrls.add(url)

    try {
      texture = await Assets.load<Texture>(url)
      this.textureCache.set(url, texture)

      const sprite = this.sprites.get(itemId)
      if (sprite) {
        sprite.texture = texture
        ;(sprite as any).__texUrl = url
      }
    } catch (err) {
      console.warn(`[PixiMediaLayer] Failed to load texture: ${url}`, err)
    } finally {
      this.loadingUrls.delete(url)
    }
  }

  /**
   * Returns the sprite for a given item ID (used by MoveableProxy for positioning).
   */
  getSprite(itemId: string): Sprite | undefined {
    return this.sprites.get(itemId)
  }

  /** Set the z-index of this layer's container on the stage. */
  setZIndex(z: number) {
    this.container.zIndex = z
  }

  /**
   * Cleanup: remove all sprites and the container from the stage.
   */
  destroy() {
    for (const [, sprite] of this.sprites) {
      sprite.destroy()
    }
    this.sprites.clear()
    this.textureCache.clear()
    this.container.destroy({ children: true })
  }
}
