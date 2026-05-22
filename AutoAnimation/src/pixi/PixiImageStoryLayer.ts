import * as PIXI from 'pixi.js'
import type { ImageStoryWordTiming } from '@/types/imageStory'
import { computeRegion } from '@/types/imageStory'
import { useImageStoryStore } from '@/stores/useImageStoryStore'

/**
 * PixiJS layer for editor preview of image stories.
 * Manages a sprite pool, listens to word timing from the playback clock,
 * and conditionally loads/shows sprites as words are spoken.
 */
export class PixiImageStoryLayer {
  private container: PIXI.Container
  private sprites: Map<string, PIXI.Sprite> = new Map()
  private bgSprite: PIXI.Sprite | null = null
  private wordTimings: ImageStoryWordTiming[] = []
  private canvasWidth: number
  private canvasHeight: number
  private fps: number
  private lastActiveSceneId: string | null = null

  constructor(
    stage: PIXI.Container,
    canvasWidth: number,
    canvasHeight: number,
    fps: number,
  ) {
    this.container = new PIXI.Container()
    this.container.sortableChildren = true
    stage.addChild(this.container)
    this.canvasWidth = canvasWidth
    this.canvasHeight = canvasHeight
    this.fps = fps
  }

  setZIndex(z: number) {
    this.container.zIndex = z
  }

  setWordTimings(timings: ImageStoryWordTiming[]) {
    this.wordTimings = timings
  }

  /**
   * Called each frame by the render loop. Returns true if something changed.
   */
  update(currentFrame: number): boolean {
    const store = useImageStoryStore.getState()
    const selectedAssets = store.selectedAssets
    const plan = store.plan
    if (!plan || this.wordTimings.length === 0) {
      if (this.container.visible) {
        this.container.visible = false
        return true
      }
      return false
    }

    const preEntryFrames = Math.round((200 / 1000) * this.fps)

    // Find active scene
    const activeScene = plan.scenes.find((scene) => {
      const sceneTimings = this.wordTimings.filter((t) =>
        scene.words.some((w) => w.text === t.word.text),
      )
      if (sceneTimings.length === 0) return false
      return (
        currentFrame >= sceneTimings[0].startFrame &&
        currentFrame <= sceneTimings[sceneTimings.length - 1].endFrame
      )
    })

    // Hide all if no active scene
    if (!activeScene) {
      if (this.container.visible) {
        this.container.visible = false
        return true
      }
      return false
    }

    this.container.visible = true
    let dirty = activeScene.id !== this.lastActiveSceneId
    this.lastActiveSceneId = activeScene.id

    // Update background
    const bgUrl = selectedAssets[`bg_${activeScene.id}`]
    if (bgUrl && (!this.bgSprite || (this.bgSprite as PIXI.Sprite & { _srcUrl?: string })._srcUrl !== bgUrl)) {
      if (this.bgSprite) {
        this.container.removeChild(this.bgSprite)
        this.bgSprite.destroy()
      }
      const texture = PIXI.Texture.from(bgUrl)
      this.bgSprite = new PIXI.Sprite(texture)
      this.bgSprite.width = this.canvasWidth
      this.bgSprite.height = this.canvasHeight
      this.bgSprite.zIndex = 0
      ;(this.bgSprite as PIXI.Sprite & { _srcUrl?: string })._srcUrl = bgUrl
      this.container.addChild(this.bgSprite)
      dirty = true
    }

    // Update noun sprites
    const activeNouns = activeScene.words.filter((w) => {
      if (w.role !== 'image_noun') return false
      const timing = this.wordTimings.find((t) => t.word.text === w.text)
      if (!timing) return false
      const entryFrame = Math.max(0, timing.startFrame - preEntryFrames)
      return currentFrame >= entryFrame
    })

    // Show/hide sprites based on active nouns
    for (const [key, sprite] of this.sprites) {
      const isActive = activeNouns.some((n) => n.text === key)
      if (sprite.visible !== isActive) {
        sprite.visible = isActive
        dirty = true
      }
    }

    // Create new sprites as needed
    for (const noun of activeNouns) {
      if (!this.sprites.has(noun.text)) {
        const url = selectedAssets[noun.text]
        if (!url) continue
        const texture = PIXI.Texture.from(url)
        const sprite = new PIXI.Sprite(texture)
        sprite.zIndex = 1 + activeNouns.indexOf(noun)
        this.sprites.set(noun.text, sprite)
        this.container.addChild(sprite)
        dirty = true
      }

      // Position sprite using shared layout utility
      const sprite = this.sprites.get(noun.text)
      if (sprite) {
        const idx = activeNouns.indexOf(noun)
        const total = activeNouns.length
        const region = computeRegion(idx, total, this.canvasWidth, this.canvasHeight)
        sprite.x = region.x
        sprite.y = region.y
        sprite.width = region.width
        sprite.height = region.height
      }
    }

    return dirty
  }

  destroy() {
    for (const [, sprite] of this.sprites) {
      sprite.destroy()
    }
    this.sprites.clear()
    if (this.bgSprite) {
      this.bgSprite.destroy()
      this.bgSprite = null
    }
    this.container.destroy({ children: true })
  }
}
