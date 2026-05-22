import { Container, Sprite, Texture, DEG_TO_RAD } from 'pixi.js'
import { pixiTextureCache } from './PixiTextureCache'
import { useCharacterConfigStore, useCharacterPartsStore, useTimelineStore, useVoiceStore, getEyeVariantSprite, getEyebrowVariantSprite, hasEyeVariants, hasEyebrowVariants } from '@/stores'
import { getCurvatureFromEmotion } from '@/services/emotionMapping'
import { resolveVisemeSprite } from '@/services/visemeMapper'
import type { Viseme } from '@/types/voice'
import type { MouthCurvature } from '@/types/nanoBanana'
import type { LayerPart } from '@/stores/useCharacterPartsStore'

const ALL_LAYER_PARTS: LayerPart[] = ['body', 'head', 'shirt', 'pants', 'shoes', 'viseme', 'eye', 'eyebrow', 'hair']

/**
 * PixiCharacterComposite renders the single-character 8-layer sprite system
 * (body, shirt, pants, shoes, viseme, eye, eyebrow, hair) as PixiJS Sprites
 * on a WebGL canvas.
 *
 * Lip sync and eye/eyebrow expression animation are driven by the existing
 * RAF-based loops in the store system -- this class reads the current
 * viseme/expression state each tick and updates sprite textures accordingly.
 *
 * Cross-fade viseme transitions use two overlapping sprites with alpha lerp.
 */
export class PixiCharacterComposite {
  private container: Container
  private sprites: Record<LayerPart, Sprite> = {
    body: new Sprite(),
    head: new Sprite(),
    viseme: new Sprite(),
    eye: new Sprite(),
    eyebrow: new Sprite(),
    hair: new Sprite(),
    shirt: new Sprite(),
    pants: new Sprite(),
    shoes: new Sprite(),
  }
  // Second viseme sprite for cross-fade
  private visemeB: Sprite = new Sprite()
  private activeVisemeSlot: 'A' | 'B' = 'A'
  private lastVisemeKey = ''
  private lastEmotionKey = ''
  private lastEyeSrc = ''
  private lastEyebrowSrc = ''
  private crossFadeProgress = 1 // 0->1 lerp
  private crossFadeDuration = 60 // ms

  // Cache current texture URLs to avoid redundant loads
  private currentUrls: Record<LayerPart, string> = {
    body: '',
    head: '',
    viseme: '',
    eye: '',
    eyebrow: '',
    hair: '',
    shirt: '',
    pants: '',
    shoes: '',
  }
  // Cached pivot dimensions to avoid expensive container.width/height every frame
  private cachedPivotW = 0
  private cachedPivotH = 0
  // Dirty tracking
  private _dirty = false
  private _lastGroupKey = ''
  private _lastPartKeys: Record<string, string> = {}

  constructor(parentContainer: Container) {
    this.container = new Container()
    this.container.label = 'PixiCharacterComposite'
    this.container.sortableChildren = true
    parentContainer.addChild(this.container)

    // Add all sprites to container
    for (const part of ALL_LAYER_PARTS) {
      this.sprites[part].label = `char_${part}`
      this.container.addChild(this.sprites[part])
    }
    this.visemeB.label = 'char_visemeB'
    this.container.addChild(this.visemeB)
    this.visemeB.alpha = 0
  }

  /**
   * Called each tick by the render loop.
   * Reads character config, transforms, and lip sync state to update sprites.
   * @returns true if anything changed (dirty)
   */
  update(logicalW: number, logicalH: number, displayW: number, displayH: number, deltaMs: number): boolean {
    this._dirty = false
    const { transforms, selectedSprites, layerOrder, renderMode, rigId } = useCharacterPartsStore.getState()
    const configStore = useCharacterConfigStore.getState()
    const savedImages = configStore.savedImages
    const isPlaying = useTimelineStore.getState().isPlaying

    // Skip if rigged mode (handled by DOM overlay)
    if (renderMode === 'rigged' && rigId) {
      if (this.container.visible) { this.container.visible = false; this._dirty = true }
      return this._dirty
    }

    const groupTransform = transforms.group
    if (!groupTransform.visible) {
      if (this.container.visible) { this.container.visible = false; this._dirty = true }
      return this._dirty
    }
    if (!this.container.visible) { this.container.visible = true; this._dirty = true }

    // Group transform: dirty check
    const groupKey = `${groupTransform.x},${groupTransform.y},${groupTransform.rotation},${groupTransform.scaleX},${groupTransform.scaleY},${displayW},${displayH}`
    if (groupKey !== this._lastGroupKey) {
      this._lastGroupKey = groupKey
      const coordScaleX = displayW / logicalW
      const coordScaleY = displayH / logicalH
      this.container.x = groupTransform.x * coordScaleX
      this.container.y = groupTransform.y * coordScaleY
      this.container.pivot.set(this.cachedPivotW / 2, this.cachedPivotH / 2)
      this.container.rotation = groupTransform.rotation * DEG_TO_RAD
      this.container.scale.set(groupTransform.scaleX, groupTransform.scaleY)
      this._dirty = true
    }

    // Get sprite source URLs for all layers
    const eyeImages = savedImages?.eye || []
    const eyebrowImages = savedImages?.eyebrow || []
    const hairImages = savedImages?.hair || []
    const bodyImages = savedImages?.body || []
    const headImages = savedImages?.head || []
    const shirtImages = savedImages?.shirt || []
    const pantsImages = savedImages?.pants || []
    const shoesImages = savedImages?.shoes || []

    const eyeSprite = selectedSprites.eye !== null ? eyeImages[selectedSprites.eye] : null
    const eyebrowSprite = selectedSprites.eyebrow !== null ? eyebrowImages[selectedSprites.eyebrow] : null
    const hairSprite = selectedSprites.hair !== null ? hairImages[selectedSprites.hair] : null
    const bodySprite = selectedSprites.body !== null ? bodyImages[selectedSprites.body] : null
    const headSprite = selectedSprites.head !== null ? headImages[selectedSprites.head] : null
    const shirtSprite = selectedSprites.shirt !== null ? shirtImages[selectedSprites.shirt] : null
    const pantsSprite = selectedSprites.pants !== null ? pantsImages[selectedSprites.pants] : null
    const shoesSprite = selectedSprites.shoes !== null ? shoesImages[selectedSprites.shoes] : null

    const displayEye = eyeSprite || eyeImages[0] || null
    const displayEyebrow = eyebrowSprite || eyebrowImages[0] || null
    const displayHair = hairSprite || hairImages[0] || null
    const displayBody = bodySprite || bodyImages[0] || null
    const displayHead = headSprite || headImages[0] || null
    const displayShirt = shirtSprite || shirtImages[0] || null
    const displayPants = pantsSprite || pantsImages[0] || null
    const displayShoes = shoesSprite || shoesImages[0] || null

    // Update layer ordering and transforms
    for (let idx = 0; idx < layerOrder.length; idx++) {
      const part = layerOrder[idx]
      const sprite = this.sprites[part]
      const t = transforms[part]

      if (!t.visible) {
        if (sprite.visible) { sprite.visible = false; this._dirty = true }
        if (part === 'viseme' && this.visemeB.visible) { this.visemeB.visible = false; this._dirty = true }
        continue
      }
      if (!sprite.visible) { sprite.visible = true; this._dirty = true }

      // Per-part transform with dirty check
      const partKey = `${t.x},${t.y},${t.rotation},${t.scaleX},${t.scaleY},${idx}`
      if (partKey !== this._lastPartKeys[part]) {
        this._lastPartKeys[part] = partKey
        sprite.x = t.x
        sprite.y = t.y
        sprite.rotation = t.rotation * DEG_TO_RAD
        sprite.scale.set(t.scaleX, t.scaleY)
        sprite.zIndex = idx
        this._dirty = true
      }

      // Load textures
      let src: string | null = null
      switch (part) {
        case 'body': src = displayBody; break
        case 'head': src = displayHead; break
        case 'eye': src = displayEye; break
        case 'eyebrow': src = displayEyebrow; break
        case 'hair': src = displayHair; break
        case 'shirt': src = displayShirt; break
        case 'pants': src = displayPants; break
        case 'shoes': src = displayShoes; break
        case 'viseme': {
          // Viseme is special -- handled by lip sync logic below
          src = null
          break
        }
      }

      if (src && src !== this.currentUrls[part] && part !== 'viseme') {
        this.currentUrls[part] = src
        this.loadTextureForSprite(sprite, src)
        this._dirty = true
      }
    }

    // --- Lip sync ---
    this.updateLipSync(isPlaying)

    // --- Eye/eyebrow expression ---
    this.updateExpression(isPlaying, displayEye, displayEyebrow)

    // --- Cross-fade interpolation ---
    this.updateCrossFade(deltaMs)

    return this._dirty
  }

  private updateLipSync(isPlaying: boolean) {
    const configStore = useCharacterConfigStore.getState()
    const visemeImages = configStore.savedImages?.viseme || []
    const { visemeSpriteMap, curvedVisemes, visemeMapping, visemeTransitionMs } = configStore
    this.crossFadeDuration = visemeTransitionMs

    if (!isPlaying) {
      // Show Rest sprite when not playing
      const restSrc = resolveVisemeSprite('Rest', 'neutral', visemeSpriteMap, curvedVisemes, visemeImages, visemeMapping)
      if (restSrc && restSrc !== this.currentUrls.viseme) {
        this.currentUrls.viseme = restSrc
        this.loadTextureForSprite(this.sprites.viseme, restSrc)
        this.sprites.viseme.alpha = 1
        this.visemeB.alpha = 0
        this.activeVisemeSlot = 'A'
        this.lastVisemeKey = ''
        this._dirty = true
      }
      return
    }

    const currentFrame = useTimelineStore.getState().currentFrame
    const { activeVisemeTimeline } = useVoiceStore.getState()
    const currentEmotion = useVoiceStore.getState().getEmotionAtFrame(currentFrame)
    const curvature: MouthCurvature = getCurvatureFromEmotion(currentEmotion)

    const event = activeVisemeTimeline.find(
      (e) => currentFrame >= e.startFrame && currentFrame < e.endFrame
    )
    const currentViseme: Viseme = (event?.viseme as Viseme) || 'Rest'
    const spriteKey = `${curvature}_${currentViseme}`

    if (spriteKey !== this.lastVisemeKey) {
      const newSrc = resolveVisemeSprite(currentViseme, curvature, visemeSpriteMap, curvedVisemes, visemeImages, visemeMapping)
      if (newSrc) {
        // Start cross-fade: load new texture into the incoming slot
        const incoming = this.activeVisemeSlot === 'A' ? this.visemeB : this.sprites.viseme
        this.loadTextureForSprite(incoming, newSrc)

        // Begin cross-fade
        this.crossFadeProgress = 0
        this.activeVisemeSlot = this.activeVisemeSlot === 'A' ? 'B' : 'A'
        this._dirty = true
      }
      this.lastVisemeKey = spriteKey
    }
  }

  private updateExpression(isPlaying: boolean, defaultEye: string | null, defaultEyebrow: string | null) {
    if (!isPlaying) return

    const currentFrame = useTimelineStore.getState().currentFrame
    const currentEmotion = useVoiceStore.getState().getEmotionAtFrame(currentFrame)

    if (currentEmotion === this.lastEmotionKey) return
    this.lastEmotionKey = currentEmotion

    // Update eye variant sprite
    if (hasEyeVariants()) {
      const eyeSrc = getEyeVariantSprite(currentEmotion)
      if (eyeSrc && eyeSrc !== this.lastEyeSrc) {
        this.lastEyeSrc = eyeSrc
        this.loadTextureForSprite(this.sprites.eye, eyeSrc)
        this._dirty = true
      } else if (!eyeSrc && defaultEye && defaultEye !== this.lastEyeSrc) {
        this.lastEyeSrc = defaultEye
        this.loadTextureForSprite(this.sprites.eye, defaultEye)
        this._dirty = true
      }
    }

    // Update eyebrow variant sprite
    if (hasEyebrowVariants()) {
      const eyebrowSrc = getEyebrowVariantSprite(currentEmotion)
      if (eyebrowSrc && eyebrowSrc !== this.lastEyebrowSrc) {
        this.lastEyebrowSrc = eyebrowSrc
        this.loadTextureForSprite(this.sprites.eyebrow, eyebrowSrc)
        this._dirty = true
      } else if (!eyebrowSrc && defaultEyebrow && defaultEyebrow !== this.lastEyebrowSrc) {
        this.lastEyebrowSrc = defaultEyebrow
        this.loadTextureForSprite(this.sprites.eyebrow, defaultEyebrow)
        this._dirty = true
      }
    }
  }

  private updateCrossFade(deltaMs: number) {
    if (this.crossFadeProgress >= 1) return

    this._dirty = true // Cross-fade in progress = always dirty
    this.crossFadeProgress = Math.min(1, this.crossFadeProgress + deltaMs / this.crossFadeDuration)

    const incomingAlpha = this.crossFadeProgress
    const outgoingAlpha = 1 - this.crossFadeProgress

    if (this.activeVisemeSlot === 'B') {
      this.visemeB.alpha = incomingAlpha
      this.sprites.viseme.alpha = outgoingAlpha
    } else {
      this.sprites.viseme.alpha = incomingAlpha
      this.visemeB.alpha = outgoingAlpha
    }

    // Match viseme transform with the main viseme sprite
    this.visemeB.x = this.sprites.viseme.x
    this.visemeB.y = this.sprites.viseme.y
    this.visemeB.rotation = this.sprites.viseme.rotation
    this.visemeB.scale.copyFrom(this.sprites.viseme.scale)
    this.visemeB.zIndex = this.sprites.viseme.zIndex
    this.visemeB.visible = this.sprites.viseme.visible
  }

  private async loadTextureForSprite(sprite: Sprite, url: string) {
    try {
      const texture = await pixiTextureCache.load(url)
      if (texture && texture !== Texture.EMPTY) {
        sprite.texture = texture
        this.updatePivotCache()
      }
    } catch {
      // Texture load failed, keep previous texture
    }
  }

  /** Recompute cached container dimensions for pivot (only called when textures change) */
  private updatePivotCache() {
    let maxW = 0, maxH = 0
    for (const part of ALL_LAYER_PARTS) {
      const s = this.sprites[part]
      if (s.visible && s.texture !== Texture.EMPTY) {
        maxW = Math.max(maxW, s.x + s.texture.width * Math.abs(s.scale.x))
        maxH = Math.max(maxH, s.y + s.texture.height * Math.abs(s.scale.y))
      }
    }
    this.cachedPivotW = maxW
    this.cachedPivotH = maxH
  }

  /**
   * Set overall visibility (used when switching between single/multi character mode).
   */
  setVisible(visible: boolean) {
    this.container.visible = visible
  }

  /** Set the z-index of this layer's container on the stage. */
  setZIndex(z: number) {
    this.container.zIndex = z
  }

  destroy() {
    for (const part of Object.values(this.sprites)) {
      part.destroy()
    }
    this.visemeB.destroy()
    this.container.destroy({ children: true })
  }
}
