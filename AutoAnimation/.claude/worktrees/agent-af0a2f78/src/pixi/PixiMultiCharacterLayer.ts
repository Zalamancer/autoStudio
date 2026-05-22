import { Container, Sprite, Texture, DEG_TO_RAD } from 'pixi.js'
import { pixiTextureCache } from './PixiTextureCache'
import { useMultiCharacterStore, type DialogueCharacter, type DialogueLine } from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore, type SavedCharacter } from '@/stores/useSavedCharactersStore'
import { useTimelineStore } from '@/stores'
import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { getCurvatureFromEmotion, detectEmotionFromText, getExpressionFromEmotion } from '@/services/emotionMapping'
import { resolveVisemeSprite } from '@/services/visemeMapper'
import type { Viseme } from '@/types/voice'
import type { MouthCurvature } from '@/types/nanoBanana'
import type { LayerPart } from '@/stores/useCharacterPartsStore'

/**
 * Per-character rendering state tracked by the multi-character layer.
 */
interface CharacterRenderState {
  container: Container
  /** 8 body part sprites */
  parts: Record<LayerPart, Sprite>
  /** Second viseme sprite for cross-fade */
  visemeB: Sprite
  /** Cross-fade state */
  activeSlot: 'A' | 'B'
  lastVisemeKey: string
  lastEmotionKey: string
  crossFadeProgress: number
  /** Cached URLs */
  currentUrls: Record<LayerPart, string>
  /** Cached lip sync capability (avoid Object.values() every frame) */
  _cachedSavedCharId: string
  _canLipSync: boolean
  _hasEyeVariants: boolean
  _hasEyebrowVariants: boolean
  /** Cross-fade duration */
  _fadeDuration: number
  /** Current display size (BASE_CHARACTER_SIZE * scale) -- set by updateCharacterTransform */
  _displaySize: number
}

const BASE_CHARACTER_SIZE = 200
const EMPTY_LINES: DialogueLine[] = []
const ALL_LAYER_PARTS: LayerPart[] = ['body', 'head', 'shirt', 'pants', 'shoes', 'viseme', 'eye', 'eyebrow', 'hair']
const DEFAULT_LAYER_ORDER: LayerPart[] = ['body', 'shirt', 'pants', 'shoes', 'head', 'eye', 'eyebrow', 'viseme', 'hair']

/**
 * PixiMultiCharacterLayer manages multiple dialogue characters on the PixiJS canvas.
 * Each character gets its own container with body/shirt/pants/shoes/viseme/eye/eyebrow/hair sprites.
 *
 * Lip sync and eye/eyebrow expression animations are driven per-character using the
 * same store data as the DOM version (CharacterLayer.tsx).
 */
export class PixiMultiCharacterLayer {
  private container: Container
  private characters = new Map<string, CharacterRenderState>()
  private _dirty = false

  constructor(parentContainer: Container) {
    this.container = new Container()
    this.container.label = 'PixiMultiCharacterLayer'
    this.container.sortableChildren = true
    parentContainer.addChild(this.container)
  }

  // Reusable Map to avoid creating new objects every frame
  private linesByCharId = new Map<string, DialogueLine[]>()

  /**
   * Called each tick by the render loop.
   *
   * @param logicalW  Logical canvas width (e.g. 1920) -- store coordinate space for character positions
   * @param logicalH  Logical canvas height (e.g. 1080)
   * @param displayW  Display canvas width in CSS pixels (e.g. 1098)
   * @param displayH  Display canvas height in CSS pixels (e.g. 618)
   * @param deltaMs   Frame delta in milliseconds
   */
  update(_logicalW: number, _logicalH: number, _displayW: number, _displayH: number, deltaMs: number): boolean {
    this._dirty = false
    // Note: multi-character positions are in display-pixel space (same as DOM CharacterLayer.tsx)
    // so no coordinate mapping is needed here.
    const { characters, dialogueLines } = useMultiCharacterStore.getState()
    const savedCharacters = useSavedCharactersStore.getState().characters
    const timelineState = useTimelineStore.getState()
    const currentFrame = timelineState.currentFrame
    const isPlaying = timelineState.isPlaying

    // Build dialogue lines index by character ID once per frame (O(n) instead of O(n*m))
    this.linesByCharId.clear()
    for (const line of dialogueLines) {
      let arr = this.linesByCharId.get(line.characterId)
      if (!arr) {
        arr = []
        this.linesByCharId.set(line.characterId, arr)
      }
      arr.push(line)
    }

    const activeIds = new Set<string>()

    for (const dChar of characters) {
      if (!dChar.visible) continue

      activeIds.add(dChar.id)

      // Rigged characters are rendered by RigPlaybackViewer (DOM layer). Hide the PixiJS
      // sprite so it doesn't duplicate, but keep the state alive so cleanup doesn't fire
      // and potentially interfere when the GPU renderer is toggled on/off.
      if (dChar.renderMode === 'rigged') {
        const existing = this.characters.get(dChar.id)
        if (existing) existing.container.visible = false
        continue
      }

      let state = this.characters.get(dChar.id)
      if (!state) {
        state = this.createCharacterState(dChar.id)
        this.characters.set(dChar.id, state)
        this._dirty = true
      }
      // Restore visibility if character was previously rigged (hidden) and switched to sprite mode
      if (!state.container.visible) state.container.visible = true

      // Use Map lookup instead of Array.find for saved character
      const savedChar = this.findSavedChar(savedCharacters, dChar.savedCharacterId)

      // Use pre-indexed lines
      const charLines = this.linesByCharId.get(dChar.id) || EMPTY_LINES
      const activeLine = this.findActiveLine(charLines, currentFrame)

      // Update cached capability flags when saved character changes
      if (savedChar && savedChar.id !== state._cachedSavedCharId) {
        state._cachedSavedCharId = savedChar.id
        this.updateCachedCapabilities(state, savedChar)
      }

      this.updateCharacterTransform(state, dChar)
      this.updateCharacterSprites(state, dChar, savedChar, activeLine)
      this.updateCharacterLipSync(state, savedChar, charLines, activeLine, currentFrame, isPlaying)
      this.updateCharacterExpression(state, savedChar, activeLine, isPlaying)
      this.updateCrossFade(state, deltaMs)
    }

    // Remove characters that no longer exist
    for (const [id, state] of this.characters) {
      if (!activeIds.has(id)) {
        this.container.removeChild(state.container)
        state.container.destroy({ children: true })
        this.characters.delete(id)
        this._dirty = true
      }
    }

    return this._dirty
  }

  // Cached saved character lookup (avoid .find() every frame for each character)
  private savedCharMap = new Map<string, SavedCharacter>()
  private lastSavedCharVersion = -1

  private findSavedChar(savedChars: SavedCharacter[], id: string | null | undefined): SavedCharacter | null {
    if (!id) return null
    // Rebuild map when the array reference changes (new length = new version)
    if (savedChars.length !== this.lastSavedCharVersion) {
      this.savedCharMap.clear()
      for (const sc of savedChars) this.savedCharMap.set(sc.id, sc)
      this.lastSavedCharVersion = savedChars.length
    }
    return this.savedCharMap.get(id) ?? null
  }

  private findActiveLine(lines: DialogueLine[], currentFrame: number): DialogueLine | null {
    for (const l of lines) {
      if (currentFrame >= l.startFrame && currentFrame < l.endFrame) return l
    }
    return null
  }

  private updateCachedCapabilities(state: CharacterRenderState, savedChar: SavedCharacter) {
    const { visemeSpriteMap, curvedVisemes, bodyParts, eyeVariants, eyebrowVariants } = savedChar
    const bodyPartVisemes = bodyParts?.viseme || []

    const hasCurved = curvedVisemes
      ? Object.values(curvedVisemes).some((v) => v !== null)
      : false
    const hasVisemeMap = visemeSpriteMap
      ? Object.values(visemeSpriteMap).some((v) => v !== null)
      : false
    state._canLipSync = hasCurved || bodyPartVisemes.length > 1 || hasVisemeMap

    state._hasEyeVariants = eyeVariants
      ? Object.values(eyeVariants).some((v) => v !== null)
      : false

    state._hasEyebrowVariants = eyebrowVariants
      ? Object.values(eyebrowVariants).some((v) => v !== null)
      : false
  }

  private createCharacterState(id: string): CharacterRenderState {
    const container = new Container()
    container.label = `multiChar_${id}`
    container.sortableChildren = true
    this.container.addChild(container)

    const parts: Record<LayerPart, Sprite> = {
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
    const visemeB = new Sprite()
    visemeB.alpha = 0

    for (const part of ALL_LAYER_PARTS) {
      parts[part].label = `${id}_${part}`
      container.addChild(parts[part])
    }
    visemeB.label = `${id}_visemeB`
    container.addChild(visemeB)

    return {
      container,
      parts,
      visemeB,
      activeSlot: 'A',
      lastVisemeKey: '',
      lastEmotionKey: '',
      crossFadeProgress: 1,
      currentUrls: { body: '', head: '', viseme: '', eye: '', eyebrow: '', hair: '', shirt: '', pants: '', shoes: '' },
      _cachedSavedCharId: '',
      _canLipSync: false,
      _hasEyeVariants: false,
      _hasEyebrowVariants: false,
      _fadeDuration: 60,
      _displaySize: BASE_CHARACTER_SIZE,
    }
  }

  private updateCharacterTransform(state: CharacterRenderState, dChar: DialogueCharacter) {
    // Check for live transform (active during Moveable drag/resize)
    const live = useLiveTransformStore.getState().active
    const isLive = live && live.id === dChar.id

    const scale = isLive ? live.scale : dChar.scale
    const posX = isLive ? live.x : dChar.position.x
    const posY = isLive ? live.y : dChar.position.y
    const rotation = isLive ? live.rotation : (dChar.rotation || 0)

    const displaySize = BASE_CHARACTER_SIZE * scale

    // Only update if transform changed
    if (
      state.container.x !== posX ||
      state.container.y !== posY ||
      state._displaySize !== displaySize ||
      state.container.zIndex !== dChar.zIndex
    ) {
      state.container.x = posX
      state.container.y = posY
      state.container.pivot.set(displaySize / 2, displaySize / 2)
      state.container.rotation = rotation * DEG_TO_RAD
      state.container.zIndex = dChar.zIndex
      state._displaySize = displaySize
      this._dirty = true
    }
  }

  private updateCharacterSprites(
    state: CharacterRenderState,
    dChar: DialogueCharacter,
    savedChar: SavedCharacter | null,
    activeLine: DialogueLine | null
  ) {
    if (!savedChar || !savedChar._hydrated) return

    const bodyParts = savedChar.bodyParts
    if (!bodyParts) return

    const overrides = activeLine?.spriteOverrides || dChar.defaultSpriteOverrides
    const layerOrder = dChar.layerOrder || DEFAULT_LAYER_ORDER
    const partTransforms = dChar.partTransforms
    const displaySize = state._displaySize

    for (let idx = 0; idx < layerOrder.length; idx++) {
      const part = layerOrder[idx]
      const sprite = state.parts[part]
      sprite.zIndex = idx

      const pt = partTransforms?.[part]
      if (pt && !pt.visible) {
        sprite.visible = false
        if (part === 'viseme') state.visemeB.visible = false
        continue
      }
      sprite.visible = true

      // Apply group size first, then per-part transforms on top.
      // In DOM: container is displaySize x displaySize, images use w-full h-full object-contain,
      // then per-part CSS transform applies translate/rotate/scale.
      // In PixiJS: set sprite width/height to group size, then apply per-part scale as multiplier.
      if (sprite.texture !== Texture.EMPTY) {
        const ptScaleX = pt?.scaleX ?? 1
        const ptScaleY = pt?.scaleY ?? 1
        // Base size from group, multiplied by per-part scale
        sprite.width = displaySize * ptScaleX
        sprite.height = displaySize * ptScaleY
      }
      if (pt) {
        sprite.x = pt.x
        sprite.y = pt.y
        sprite.rotation = pt.rotation * DEG_TO_RAD
        // Note: scale is already applied via width/height above, don't call sprite.scale.set()
      }

      // Load appropriate sprite URL (skip viseme -- handled by lip sync)
      if (part === 'viseme') continue

      let url: string | null = null
      const partArr = bodyParts[part] || []

      if (part === 'eye') {
        const idx = overrides?.eye ?? 0
        url = partArr[idx] || partArr[0] || null
      } else if (part === 'eyebrow') {
        const idx = overrides?.eyebrow ?? 0
        url = partArr[idx] || partArr[0] || null
      } else if (part === 'body') {
        const idx = overrides?.body ?? 0
        url = partArr[idx] || partArr[0] || null
      } else if (part === 'head') {
        const idx = overrides?.head ?? 0
        url = partArr[idx] || partArr[0] || null
      } else if (part === 'hair') {
        const idx = overrides?.hair ?? 0
        url = partArr[idx] || partArr[0] || null
      } else if (part === 'shirt') {
        const idx = overrides?.shirt ?? 0
        url = partArr[idx] || partArr[0] || null
      } else if (part === 'pants') {
        const idx = overrides?.pants ?? 0
        url = partArr[idx] || partArr[0] || null
      } else if (part === 'shoes') {
        const idx = overrides?.shoes ?? 0
        url = partArr[idx] || partArr[0] || null
      }

      if (url && url.length > 50 && url !== state.currentUrls[part]) {
        state.currentUrls[part] = url
        this.loadTexture(sprite, url)
        this._dirty = true
      }
    }
  }

  private updateCharacterLipSync(
    state: CharacterRenderState,
    savedChar: SavedCharacter | null,
    charLines: DialogueLine[],
    activeLine: DialogueLine | null,
    currentFrame: number,
    isPlaying: boolean
  ) {
    if (!savedChar?._hydrated) return

    const { visemeSpriteMap, curvedVisemes } = savedChar
    const bodyPartVisemes = savedChar.bodyParts?.viseme || []
    const configState = useCharacterConfigStore.getState()
    const visemeMapping = configState.visemeMapping
    const visemeTransitionMs = configState.visemeTransitionMs

    // Use cached capability flag (computed only when savedChar changes)
    if (!isPlaying || !state._canLipSync || charLines.length === 0) {
      // Show Rest when not playing
      const restSrc = resolveVisemeSprite('Rest', 'neutral', visemeSpriteMap || null, curvedVisemes || null, bodyPartVisemes, visemeMapping)
      if (restSrc && restSrc.length > 50 && restSrc !== state.currentUrls.viseme) {
        state.currentUrls.viseme = restSrc
        this.loadTexture(state.parts.viseme, restSrc)
        state.parts.viseme.alpha = 1
        state.visemeB.alpha = 0
        state.activeSlot = 'A'
        state.lastVisemeKey = ''
        this._dirty = true
      }
      return
    }

    if (!activeLine || activeLine.visemeTimeline.length === 0) {
      // Not speaking -- fade to Rest
      const restKey = 'rest_idle'
      if (state.lastVisemeKey !== restKey) {
        const restSrc = resolveVisemeSprite('Rest', 'neutral', visemeSpriteMap || null, curvedVisemes || null, bodyPartVisemes, visemeMapping)
        if (restSrc && restSrc.length > 50) {
          this.startCrossFade(state, restSrc, visemeTransitionMs)
          this._dirty = true
        }
        state.lastVisemeKey = restKey
      }
      return
    }

    // Find current viseme
    const relativeFrame = currentFrame - activeLine.startFrame
    const event = activeLine.visemeTimeline.find(
      (e) => relativeFrame >= e.startFrame && relativeFrame < e.endFrame
    )
    const currentViseme: Viseme = (event?.viseme as Viseme) || 'Rest'

    let emotion = 'Neutral'
    if (activeLine.emotion && activeLine.emotion !== 'Auto') {
      emotion = activeLine.emotion
    } else {
      emotion = detectEmotionFromText(activeLine.script)
    }
    const curvature: MouthCurvature = getCurvatureFromEmotion(emotion)
    const spriteKey = `${curvature}_${currentViseme}`

    if (spriteKey !== state.lastVisemeKey) {
      const newSrc = resolveVisemeSprite(currentViseme, curvature, visemeSpriteMap || null, curvedVisemes || null, bodyPartVisemes, visemeMapping)
      if (newSrc && newSrc.length > 50) {
        this.startCrossFade(state, newSrc, visemeTransitionMs)
        this._dirty = true
      }
      state.lastVisemeKey = spriteKey
    }
  }

  private updateCharacterExpression(
    state: CharacterRenderState,
    savedChar: SavedCharacter | null,
    activeLine: DialogueLine | null,
    isPlaying: boolean
  ) {
    if (!isPlaying || !savedChar?._hydrated) return

    // Use cached flags (computed only when savedChar changes)
    if (!state._hasEyeVariants && !state._hasEyebrowVariants) return

    const eyeVariants = savedChar.eyeVariants
    const eyebrowVariants = savedChar.eyebrowVariants

    let emotion = 'Neutral'
    if (activeLine) {
      if (activeLine.emotion && activeLine.emotion !== 'Auto') {
        emotion = activeLine.emotion
      } else {
        emotion = detectEmotionFromText(activeLine.script)
      }
    }

    if (emotion === state.lastEmotionKey) return
    state.lastEmotionKey = emotion

    // Get expression (eye + eyebrow variant) from emotion
    const expression = getExpressionFromEmotion(emotion)

    // Update eye sprite
    if (state._hasEyeVariants && eyeVariants) {
      const eyeSrc = eyeVariants[expression.eye] ?? null
      if (eyeSrc && eyeSrc.length > 50 && eyeSrc !== state.currentUrls.eye) {
        state.currentUrls.eye = eyeSrc
        this.loadTexture(state.parts.eye, eyeSrc)
        this._dirty = true
      }
    }

    // Update eyebrow sprite
    if (state._hasEyebrowVariants && eyebrowVariants) {
      const eyebrowSrc = eyebrowVariants[expression.eyebrow] ?? null
      if (eyebrowSrc && eyebrowSrc.length > 50 && eyebrowSrc !== state.currentUrls.eyebrow) {
        state.currentUrls.eyebrow = eyebrowSrc
        this.loadTexture(state.parts.eyebrow, eyebrowSrc)
        this._dirty = true
      }
    }
  }

  private startCrossFade(state: CharacterRenderState, url: string, durationMs: number) {
    const incoming = state.activeSlot === 'A' ? state.visemeB : state.parts.viseme
    this.loadTexture(incoming, url)
    state.crossFadeProgress = 0
    state.activeSlot = state.activeSlot === 'A' ? 'B' : 'A'
    state._fadeDuration = durationMs
  }

  private updateCrossFade(state: CharacterRenderState, deltaMs: number) {
    if (state.crossFadeProgress >= 1) return
    this._dirty = true // Cross-fade in progress = always dirty

    const duration = state._fadeDuration || 60
    state.crossFadeProgress = Math.min(1, state.crossFadeProgress + deltaMs / duration)

    const inAlpha = state.crossFadeProgress
    const outAlpha = 1 - state.crossFadeProgress

    if (state.activeSlot === 'B') {
      state.visemeB.alpha = inAlpha
      state.parts.viseme.alpha = outAlpha
    } else {
      state.parts.viseme.alpha = inAlpha
      state.visemeB.alpha = outAlpha
    }

    // Keep visemeB transform in sync
    state.visemeB.x = state.parts.viseme.x
    state.visemeB.y = state.parts.viseme.y
    state.visemeB.rotation = state.parts.viseme.rotation
    state.visemeB.scale.copyFrom(state.parts.viseme.scale)
    state.visemeB.zIndex = state.parts.viseme.zIndex
    state.visemeB.visible = state.parts.viseme.visible
  }

  private async loadTexture(sprite: Sprite, url: string) {
    try {
      const texture = await pixiTextureCache.load(url)
      if (texture && texture !== Texture.EMPTY) {
        sprite.texture = texture
      }
    } catch {
      // Keep previous texture on failure
    }
  }

  /** Set the z-index of this layer's container on the stage. */
  setZIndex(z: number) {
    this.container.zIndex = z
  }

  destroy() {
    for (const [, state] of this.characters) {
      state.container.destroy({ children: true })
    }
    this.characters.clear()
    this.container.destroy({ children: true })
  }
}
