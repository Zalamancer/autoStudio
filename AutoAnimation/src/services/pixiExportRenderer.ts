/**
 * GPU-accelerated frame renderer for video export using PixiJS (WebGL).
 *
 * Replaces the CPU-bound Canvas2D renderer (canvas2dRenderer.ts) with a
 * headless PixiJS Application that renders all composition layers to a
 * WebGL canvas. The canvas is then fed directly into VideoEncoder.
 *
 * Architecture:
 * - Props-driven: reads from serialized VideoCompositionProps, not Zustand stores
 * - Headless: no DOM insertion, no ticker — manual frame-by-frame rendering
 * - Layered: each layer type has its own Container/Sprite/Graphics hierarchy
 *
 * Layer draw order (matches canvas2dRenderer.ts / VideoCanvas.tsx):
 *  0. Background fill
 *  1. Background Lottie animations
 *  1.5. HTML Templates (composited from iframe captures)
 *  2. Media images
 *  3. Shapes
 *  4. Video layers
 *  5. Characters (body → viseme → eye → eyebrow → hair → shirt → pants → shoes)
 *  5.5. 3D Characters (composited from Three.js offscreen)
 *  6. Text overlays
 *  7. Overlay Lottie animations
 *  8. Captions
 */

import { Application, Container, Sprite, Graphics, Text, TextStyle, Texture, DEG_TO_RAD } from 'pixi.js'
import type { TextStyleFontWeight } from 'pixi.js'
import type { VideoCompositionProps, CaptionData } from '@/remotion/types'
import type { Viseme, VisemeEvent } from '@/types/voice'
import type { EmotionEvent } from '@/services/emotionTimeline'
import { getCurvatureFromEmotion } from '@/services/emotionMapping'
import { resolveVisemeSprite } from '@/services/visemeMapper'
import { interpolatePropertyKeyframes } from '@/services/interpolation'
import { useCharacterPartsStore, type LayerPart } from '@/stores/useCharacterPartsStore'
import { getPoseAtFrame } from '@/services/poseInterpolation'
import { deformMesh } from '@/services/meshDeformer'
import { renderMeshToCanvas } from '@/services/meshRenderer'
import type {
  LottieExportInstance,
  ThreeExportInstance,
  TemplateExportInstance,
  RigExportInstance,
  ImageCache,
  KeyframeIndex,
} from './canvas2dRenderer'
import { useCameraStore } from '@/stores/useCameraStore'

// ── Keyframe helper (uses pre-indexed map) ─────────────────────────────

function getKfValue(
  index: KeyframeIndex | undefined,
  objectType: string,
  objectId: string,
  property: string,
  frame: number,
): number | undefined {
  if (!index) return undefined
  const kfs = index.get(`${objectType}:${objectId}:${property}`)
  if (!kfs) return undefined
  return interpolatePropertyKeyframes(kfs, frame, property === 'rotation')
}

// ── Timeline binary search ─────────────────────────────────────────────

function searchTimeline<T extends { startFrame: number; endFrame: number }>(
  timeline: T[],
  frame: number,
): T | undefined {
  let lo = 0
  let hi = timeline.length - 1
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    const e = timeline[mid]
    if (frame < e.startFrame) hi = mid - 1
    else if (frame >= e.endFrame) lo = mid + 1
    else return e
  }
  return undefined
}

function getVisemeAtFrame(timeline: VisemeEvent[], frame: number): Viseme {
  const event = searchTimeline(timeline, frame)
  return (event?.viseme as Viseme) || 'Rest'
}

function getEmotionAtFrame(timeline: EmotionEvent[], frame: number): string {
  const event = searchTimeline(timeline, frame)
  return event?.emotion || 'Neutral'
}

function getVisemeSpriteUrl(
  character: VideoCompositionProps['character'],
  viseme: Viseme,
  emotion: string,
): string | null {
  const { curvedVisemes, savedImages, visemeMapping, visemeSpriteMap } = character
  const visemeImages = savedImages.viseme || []
  const curvature = getCurvatureFromEmotion(emotion)
  return resolveVisemeSprite(
    viseme,
    curvature,
    visemeSpriteMap as Record<string, string | null> | null | undefined,
    curvedVisemes,
    visemeImages,
    visemeMapping,
  )
}

// ── Caption lookup ─────────────────────────────────────────────────────

function getCaptionAtFrame(captions: CaptionData, frame: number): { text: string; highlightIndex?: number } | null {
  const { style, wordTimeline, sentenceTimeline } = captions
  switch (style) {
    case 'word-by-word': {
      const word = searchTimeline(wordTimeline as any[], frame) as any
      return word ? { text: word.word } : null
    }
    case 'sentence': {
      const s = searchTimeline(sentenceTimeline as any[], frame) as any
      return s ? { text: s.sentence } : null
    }
    case 'karaoke': {
      const s = searchTimeline(sentenceTimeline as any[], frame) as any
      if (!s) return null
      const idx = (s.words as any[]).findIndex((w: any) => frame >= w.startFrame && frame < w.endFrame)
      return { text: s.sentence, highlightIndex: idx >= 0 ? idx : undefined }
    }
    case 'phrase': {
      if (wordTimeline.length === 0) return null
      const size = Math.max(1, Math.min(5, Math.round(captions.phraseSize ?? 3)))
      let activeIndex = wordTimeline.findIndex((w) => frame >= w.startFrame && frame < w.endFrame)
      if (activeIndex === -1) {
        const next = wordTimeline.findIndex((w) => w.startFrame > frame)
        if (next === -1) return null
        activeIndex = next
      }
      const chunkStart = Math.floor(activeIndex / size) * size
      const chunk = wordTimeline.slice(chunkStart, chunkStart + size)
      if (chunk.length === 0) return null
      return {
        text: chunk.map((w) => w.word).join(' '),
        highlightIndex: activeIndex - chunkStart,
      }
    }
    default:
      return null
  }
}

// ── Constants ──────────────────────────────────────────────────────────

const BASE_CHARACTER_SIZE = 200

const FONT_WEIGHT_MAP: Record<string, TextStyleFontWeight> = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '900',
}

// ── PixiExportRenderer ─────────────────────────────────────────────────

export class PixiExportRenderer {
  private app!: Application
  private width: number
  private height: number
  private exportWidth: number
  private exportHeight: number

  // Camera container — wraps all scene layers for zoom/pan/rotation/shake
  private cameraContainer!: Container

  // Layer containers (ordered by z-index)
  private bgFill!: Graphics
  private bgLottieContainer!: Container
  private templateContainer!: Container
  private mediaContainer!: Container
  private shapeContainer!: Container
  private videoContainer!: Container
  private characterContainer!: Container
  private riggedContainer!: Container
  private threeDContainer!: Container
  private textContainer!: Container
  private overlayLottieContainer!: Container
  private captionContainer!: Container

  // Texture cache
  private textures = new Map<string, Texture>()

  // Sprite pools
  private mediaSprites = new Map<string, Sprite>()
  private shapeGraphics = new Map<string, Graphics>()
  private textEntries = new Map<string, { container: Container; text: Text; bg: Graphics }>()
  private captionBg!: Graphics
  private captionTextContainer!: Container
  private captionSingleText!: Text
  private captionWordPool: Text[] = []
  private captionActiveWords = 0

  // Lottie compositing sprites
  private lottieSprites = new Map<string, Sprite>()

  // 3D compositing sprite
  private threeSprite: Sprite | null = null

  // 2D rigged character compositing sprite
  private riggedSprites = new Map<string, Sprite>()

  // Template compositing sprites
  private templateSprites = new Map<string, Sprite>()

  // Video compositing sprites
  private videoSprites = new Map<string, Sprite>()

  // Character sprite structures
  private singleCharContainer: Container | null = null
  private singleCharParts: Record<LayerPart, Sprite> | null = null
  private dialogueCharContainers = new Map<
    string,
    {
      container: Container
      parts: Record<LayerPart, Sprite>
    }
  >()

  // Pre-built keyframe index
  private kfIndex: KeyframeIndex | undefined

  // Cached text styles for captions
  private captionStyle!: TextStyle
  private captionHighlightStyle!: TextStyle
  private lastCaptionStyleKey = ''

  constructor(exportWidth: number, exportHeight: number, logicalWidth?: number, logicalHeight?: number) {
    this.exportWidth = exportWidth
    this.exportHeight = exportHeight
    this.width = logicalWidth ?? exportWidth
    this.height = logicalHeight ?? exportHeight
  }

  /**
   * Initialize the headless PixiJS application.
   * Must be called before any rendering.
   */
  async init(): Promise<void> {
    this.app = new Application()
    await this.app.init({
      width: this.exportWidth,
      height: this.exportHeight,
      backgroundAlpha: 1,
      antialias: true,
      resolution: 1,
      autoDensity: false,
      preference: 'webgl',
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    })

    // Disable ticker — we render manually
    this.app.ticker.autoStart = false
    this.app.ticker.stop()

    // Scale stage so logical coordinates (this.width × this.height) map to export pixels
    this.app.stage.scale.set(this.exportWidth / this.width, this.exportHeight / this.height)

    this.app.stage.sortableChildren = true

    // Camera container — wraps all scene layers so camera transforms
    // (zoom/pan/rotation/shake) apply to content but not to captions.
    // Pivot is set to canvas center so scale/rotation occur around center.
    this.cameraContainer = new Container()
    this.cameraContainer.zIndex = 0
    this.cameraContainer.sortableChildren = true
    this.cameraContainer.pivot.set(this.width / 2, this.height / 2)
    this.cameraContainer.position.set(this.width / 2, this.height / 2)
    this.app.stage.addChild(this.cameraContainer)

    // Create layer containers in order (inside camera container)
    this.bgFill = new Graphics()
    this.bgFill.zIndex = 0
    this.cameraContainer.addChild(this.bgFill)

    this.bgLottieContainer = new Container()
    this.bgLottieContainer.zIndex = 1
    this.cameraContainer.addChild(this.bgLottieContainer)

    this.templateContainer = new Container()
    this.templateContainer.zIndex = 2
    this.cameraContainer.addChild(this.templateContainer)

    this.mediaContainer = new Container()
    this.mediaContainer.zIndex = 3
    this.mediaContainer.sortableChildren = true
    this.cameraContainer.addChild(this.mediaContainer)

    this.shapeContainer = new Container()
    this.shapeContainer.zIndex = 4
    this.shapeContainer.sortableChildren = true
    this.cameraContainer.addChild(this.shapeContainer)

    this.videoContainer = new Container()
    this.videoContainer.zIndex = 5
    this.cameraContainer.addChild(this.videoContainer)

    this.characterContainer = new Container()
    this.characterContainer.zIndex = 6
    this.characterContainer.sortableChildren = true
    this.cameraContainer.addChild(this.characterContainer)

    this.riggedContainer = new Container()
    this.riggedContainer.zIndex = 6.5
    this.cameraContainer.addChild(this.riggedContainer)

    this.threeDContainer = new Container()
    this.threeDContainer.zIndex = 7
    this.cameraContainer.addChild(this.threeDContainer)

    this.textContainer = new Container()
    this.textContainer.zIndex = 8
    this.textContainer.sortableChildren = true
    this.cameraContainer.addChild(this.textContainer)

    this.overlayLottieContainer = new Container()
    this.overlayLottieContainer.zIndex = 9
    this.cameraContainer.addChild(this.overlayLottieContainer)

    // Captions stay on stage directly (outside camera transform)
    // so they remain fixed on screen during zoom/pan/rotation
    this.captionContainer = new Container()
    this.captionContainer.zIndex = 10
    this.app.stage.addChild(this.captionContainer)

    // Set up caption objects
    this.captionBg = new Graphics()
    this.captionContainer.addChild(this.captionBg)
    this.captionTextContainer = new Container()
    this.captionContainer.addChild(this.captionTextContainer)

    this.captionStyle = new TextStyle({
      fontFamily: '"Inter", sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: '#ffffff',
    })
    this.captionHighlightStyle = new TextStyle({
      fontFamily: '"Inter", sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: '#4ade80',
    })
    this.captionSingleText = new Text({ text: '', style: this.captionStyle })
    this.captionSingleText.visible = false
    this.captionTextContainer.addChild(this.captionSingleText)
  }

  /**
   * Pre-load all textures from the composition props into GPU memory.
   */
  async preload(_props: VideoCompositionProps, imageCache: ImageCache): Promise<void> {
    // Convert all pre-loaded HTMLImageElements to PixiJS textures
    const promises: Promise<void>[] = []

    for (const [url, img] of imageCache) {
      promises.push(
        (async () => {
          try {
            const texture = Texture.from(img)
            this.textures.set(url, texture)
          } catch {
            // Skip failed textures
          }
        })(),
      )
    }

    await Promise.all(promises)
  }

  /**
   * Set the pre-built keyframe index for O(1) track lookups.
   */
  setKeyframeIndex(index: KeyframeIndex): void {
    this.kfIndex = index
  }

  /**
   * Returns the canvas element for VideoFrame creation.
   */
  get canvas(): HTMLCanvasElement {
    return this.app.canvas as HTMLCanvasElement
  }

  /**
   * Render a single frame of the composition.
   * Updates all layer objects and calls app.render() once.
   */
  async renderFrame(
    props: VideoCompositionProps,
    frame: number,
    lottieInstances: Map<string, LottieExportInstance>,
    videoElements: Map<string, HTMLVideoElement>,
    threeInstance: ThreeExportInstance | null,
    templateInstances: Map<string, TemplateExportInstance>,
    rigInstances?: Map<string, RigExportInstance> | null,
  ): Promise<void> {
    // ── Camera transform ──
    // Apply virtual camera (zoom/pan/rotation/shake) to the camera container.
    // Captions are outside the camera container so they stay fixed on screen.
    const camState = useCameraStore.getState()
    const cameraEnabled =
      camState.enabled && (camState.keyframes.length > 0 || camState.shakes.length > 0 || camState.focusPull !== null)
    if (cameraEnabled) {
      const cam = camState.getCameraAtFrame(frame, props.fps)
      const translateX = (cam.panX / 100) * this.width
      const translateY = (cam.panY / 100) * this.height
      this.cameraContainer.scale.set(cam.zoom)
      this.cameraContainer.rotation = (cam.rotation * Math.PI) / 180
      // Pan: offset from center (pivot is already at center)
      this.cameraContainer.position.set(this.width / 2 - translateX, this.height / 2 - translateY)
    } else {
      // Reset to identity transform
      this.cameraContainer.scale.set(1)
      this.cameraContainer.rotation = 0
      this.cameraContainer.position.set(this.width / 2, this.height / 2)
    }

    // 0. Background fill
    this.bgFill.clear()
    this.bgFill.rect(0, 0, this.width, this.height)
    this.bgFill.fill({ color: 0x18181b })

    // 1. Background Lottie
    this.updateLottieLayers(props, frame, lottieInstances, 'background', this.bgLottieContainer)

    // 1.5. HTML Templates
    await this.updateTemplateLayers(props, frame, templateInstances)

    // 2. Media images
    this.updateMediaLayers(props, frame)

    // 3. Shapes
    this.updateShapeLayers(props, frame)

    // 4. Video layers
    this.updateVideoLayers(props, frame, videoElements)

    // 5. Characters
    this.updateCharacterLayers(props, frame)

    // 5.25. 2D Rigged Characters
    this.updateRiggedLayers(props, frame, rigInstances || null)

    // 5.5. 3D Characters
    this.update3DLayers(props, frame, threeInstance)

    // 6. Text overlays
    this.updateTextOverlays(props, frame)

    // 7. Overlay Lottie
    this.updateLottieLayers(props, frame, lottieInstances, 'overlay', this.overlayLottieContainer)

    // 8. Captions (outside camera container, fixed on screen)
    this.updateCaptions(props, frame)

    // Render the scene
    this.app.render()
  }

  // ── Lottie Layers ──────────────────────────────────────────────────

  private updateLottieLayers(
    props: VideoCompositionProps,
    frame: number,
    lottieInstances: Map<string, LottieExportInstance>,
    category: 'background' | 'overlay',
    container: Container,
  ): void {
    if (!props.animations) {
      container.visible = false
      return
    }

    container.visible = true

    for (const anim of props.animations) {
      if (anim.category !== category) continue
      const instance = lottieInstances.get(anim.id)
      if (!instance) continue

      // Seek Lottie to the correct frame
      const localFrame = (frame * anim.speed) % instance.totalFrames
      instance.anim.goToAndStop(localFrame, true)

      // Get or create a Sprite for this Lottie
      const spriteKey = `${category}_${anim.id}`
      let sprite = this.lottieSprites.get(spriteKey)
      if (!sprite) {
        sprite = new Sprite()
        this.lottieSprites.set(spriteKey, sprite)
        container.addChild(sprite)
      }

      // Update texture from the Lottie canvas
      sprite.texture = Texture.from(instance.canvas)
      sprite.x = anim.position.x
      sprite.y = anim.position.y
      sprite.scale.set(anim.scale)
      sprite.alpha = anim.opacity
      sprite.visible = true
    }
  }

  // ── HTML Template Layers ───────────────────────────────────────────

  private async updateTemplateLayers(
    props: VideoCompositionProps,
    frame: number,
    templateInstances: Map<string, TemplateExportInstance>,
  ): Promise<void> {
    if (!props.htmlTemplates || templateInstances.size === 0) {
      this.templateContainer.visible = false
      return
    }

    this.templateContainer.visible = true

    // Import captureTemplateFrame and computeTemplateDimensions dynamically
    // to avoid circular dependency — these are only needed for template rendering
    const { computeTemplateDimensions } = await import('@/stores/useHTMLTemplateLayerStore')

    for (const template of props.htmlTemplates) {
      if (!template.visible) continue
      if (frame < template.startFrame || frame >= template.endFrame) continue

      const instance = templateInstances.get(template.id)
      if (!instance) continue

      // Capture the template frame (async iframe operation)
      if (instance.iframe.contentWindow && template.frameSync) {
        instance.iframe.contentWindow.postMessage(
          {
            type: 'FRAME_UPDATE',
            currentFrame: frame,
            isPlaying: true,
            fps: props.fps,
            totalFrames: props.durationInFrames,
          },
          '*',
        )
        await new Promise((r) => setTimeout(r, 16))
      }

      // Try to capture the iframe content
      const doc = instance.iframe.contentDocument
      if (doc) {
        instance.ctx.clearRect(0, 0, instance.canvas.width, instance.canvas.height)
        const internalCanvases = doc.querySelectorAll('canvas')
        if (internalCanvases.length > 0) {
          let mainCanvas: HTMLCanvasElement | null = null
          let maxArea = 0
          internalCanvases.forEach((c) => {
            const area = c.width * c.height
            if (area > maxArea) {
              maxArea = area
              mainCanvas = c
            }
          })
          if (mainCanvas && maxArea > 0) {
            instance.ctx.drawImage(mainCanvas, 0, 0, instance.canvas.width, instance.canvas.height)
          }
        }
      }

      // Get or create sprite
      let sprite = this.templateSprites.get(template.id)
      if (!sprite) {
        sprite = new Sprite()
        this.templateSprites.set(template.id, sprite)
        this.templateContainer.addChild(sprite)
      }

      // Update texture from captured canvas
      sprite.texture = Texture.from(instance.canvas)

      const dims = computeTemplateDimensions(template.templateAspectRatio, this.width, this.height, template.scale)

      sprite.x = template.position.x
      sprite.y = template.position.y
      sprite.width = dims.displayWidth
      sprite.height = dims.displayHeight
      sprite.alpha = template.opacity
      sprite.rotation = template.rotation * DEG_TO_RAD
      sprite.visible = true
    }
  }

  // ── Media Layers ───────────────────────────────────────────────────

  private updateMediaLayers(props: VideoCompositionProps, frame: number): void {
    if (!props.mediaItems) {
      this.mediaContainer.visible = false
      return
    }

    this.mediaContainer.visible = true
    const activeIds = new Set<string>()

    for (const item of props.mediaItems) {
      if (!item.visible || !item.imageUrl) continue
      if (frame < item.startFrame || frame >= item.endFrame) continue

      const texture = this.textures.get(item.imageUrl)
      if (!texture) continue

      activeIds.add(item.id)

      let sprite = this.mediaSprites.get(item.id)
      if (!sprite) {
        sprite = new Sprite()
        this.mediaSprites.set(item.id, sprite)
        this.mediaContainer.addChild(sprite)
      }

      sprite.texture = texture
      sprite.visible = true

      // Apply keyframe interpolation
      const x = getKfValue(this.kfIndex, 'media', item.id, 'position.x', frame) ?? item.position.x
      const y = getKfValue(this.kfIndex, 'media', item.id, 'position.y', frame) ?? item.position.y
      const scale = getKfValue(this.kfIndex, 'media', item.id, 'scale', frame) ?? item.scale
      const opacity = getKfValue(this.kfIndex, 'media', item.id, 'opacity', frame) ?? item.opacity
      const rotation = getKfValue(this.kfIndex, 'media', item.id, 'rotation', frame) ?? item.rotation

      const w = this.width * scale
      const h = this.height * scale
      sprite.x = x + w / 2
      sprite.y = y + h / 2
      sprite.width = w
      sprite.height = h
      sprite.anchor.set(0.5)
      sprite.rotation = rotation * DEG_TO_RAD
      sprite.alpha = opacity
    }

    // Hide inactive sprites
    for (const [id, sprite] of this.mediaSprites) {
      if (!activeIds.has(id)) sprite.visible = false
    }
  }

  // ── Shape Layers ───────────────────────────────────────────────────

  private updateShapeLayers(props: VideoCompositionProps, frame: number): void {
    if (!props.shapes) {
      this.shapeContainer.visible = false
      return
    }

    this.shapeContainer.visible = true
    const activeIds = new Set<string>()

    for (const shape of props.shapes) {
      if (!shape.visible) continue
      if (frame < shape.startFrame || frame >= shape.endFrame) continue

      activeIds.add(shape.id)

      let gfx = this.shapeGraphics.get(shape.id)
      if (!gfx) {
        gfx = new Graphics()
        this.shapeGraphics.set(shape.id, gfx)
        this.shapeContainer.addChild(gfx)
      }

      gfx.visible = true

      const x = getKfValue(this.kfIndex, 'shape', shape.id, 'position.x', frame) ?? shape.position.x
      const y = getKfValue(this.kfIndex, 'shape', shape.id, 'position.y', frame) ?? shape.position.y
      const w = getKfValue(this.kfIndex, 'shape', shape.id, 'width', frame) ?? shape.width
      const h = getKfValue(this.kfIndex, 'shape', shape.id, 'height', frame) ?? shape.height
      const opacity = getKfValue(this.kfIndex, 'shape', shape.id, 'opacity', frame) ?? shape.opacity
      const rotation = getKfValue(this.kfIndex, 'shape', shape.id, 'rotation', frame) ?? shape.rotation
      const strokeWidth = getKfValue(this.kfIndex, 'shape', shape.id, 'strokeWidth', frame) ?? shape.strokeWidth
      const borderRadius = getKfValue(this.kfIndex, 'shape', shape.id, 'borderRadius', frame) ?? shape.borderRadius ?? 0
      const innerRadius = getKfValue(this.kfIndex, 'shape', shape.id, 'innerRadius', frame) ?? shape.innerRadius ?? 0.4

      gfx.x = x + w / 2
      gfx.y = y + h / 2
      gfx.rotation = rotation * DEG_TO_RAD
      gfx.alpha = opacity

      // Redraw shape
      gfx.clear()

      const fillStr =
        typeof shape.fill === 'string' ? shape.fill : ((shape.fill as any)?.stops?.[0]?.color ?? '#000000')
      if (fillStr && fillStr !== 'transparent') {
        gfx.fill({ color: fillStr })
      }
      if (shape.stroke && shape.stroke !== 'transparent' && strokeWidth > 0) {
        gfx.stroke({ color: shape.stroke, width: strokeWidth })
      }

      this.drawShapePath(gfx, shape.type as string, w, h, strokeWidth, borderRadius, innerRadius, shape.points)
    }

    for (const [id, gfx] of this.shapeGraphics) {
      if (!activeIds.has(id)) gfx.visible = false
    }
  }

  private drawShapePath(
    gfx: Graphics,
    type: string,
    w: number,
    h: number,
    sw: number,
    borderRadius: number,
    innerRadius: number,
    points?: number,
  ): void {
    const hw = w / 2
    const hh = h / 2

    switch (type) {
      case 'rectangle': {
        if (borderRadius > 0) {
          const r = Math.min(borderRadius, hw, hh)
          gfx.roundRect(-hw, -hh, w, h, r)
        } else {
          gfx.rect(-hw, -hh, w, h)
        }
        gfx.fill()
        if (sw > 0) gfx.stroke()
        break
      }
      case 'circle': {
        gfx.ellipse(0, 0, hw - sw / 2, hh - sw / 2)
        gfx.fill()
        if (sw > 0) gfx.stroke()
        break
      }
      case 'triangle': {
        const inset = sw / 2
        gfx.moveTo(0, -hh + inset)
        gfx.lineTo(hw - inset, hh - inset)
        gfx.lineTo(-hw + inset, hh - inset)
        gfx.closePath()
        gfx.fill()
        if (sw > 0) gfx.stroke()
        break
      }
      case 'star': {
        const outerR = Math.min(hw, hh) - sw / 2
        const iR = outerR * innerRadius
        const numPoints = points ?? 5
        for (let i = 0; i < numPoints * 2; i++) {
          const angle = (Math.PI * i) / numPoints - Math.PI / 2
          const r = i % 2 === 0 ? outerR : iR
          const px = r * Math.cos(angle)
          const py = r * Math.sin(angle)
          if (i === 0) gfx.moveTo(px, py)
          else gfx.lineTo(px, py)
        }
        gfx.closePath()
        gfx.fill()
        if (sw > 0) gfx.stroke()
        break
      }
    }
  }

  // ── Video Layers ───────────────────────────────────────────────────

  private updateVideoLayers(
    props: VideoCompositionProps,
    frame: number,
    videoElements: Map<string, HTMLVideoElement>,
  ): void {
    if (!props.videos) {
      this.videoContainer.visible = false
      return
    }

    this.videoContainer.visible = true

    for (const v of props.videos) {
      if (!v.visible || !v.sourceUrl) continue

      const videoEl = videoElements.get(v.id)
      if (!videoEl || videoEl.readyState < 2) continue

      const time = frame / props.fps
      const videoTime = v.loop ? time % v.durationSeconds : Math.min(time, v.durationSeconds)
      if (Math.abs(videoEl.currentTime - videoTime) > 0.05) {
        videoEl.currentTime = videoTime
      }

      let sprite = this.videoSprites.get(v.id)
      if (!sprite) {
        sprite = new Sprite()
        this.videoSprites.set(v.id, sprite)
        this.videoContainer.addChild(sprite)
      }

      sprite.texture = Texture.from(videoEl)
      sprite.visible = true

      const x = getKfValue(this.kfIndex, 'video', v.id, 'position.x', frame) ?? v.position.x
      const y = getKfValue(this.kfIndex, 'video', v.id, 'position.y', frame) ?? v.position.y
      const scale = getKfValue(this.kfIndex, 'video', v.id, 'scale', frame) ?? v.scale
      const opacity = getKfValue(this.kfIndex, 'video', v.id, 'opacity', frame) ?? v.opacity

      sprite.x = x
      sprite.y = y
      sprite.scale.set(scale)
      sprite.alpha = opacity
    }
  }

  // ── Character Layers ───────────────────────────────────────────────

  private updateCharacterLayers(props: VideoCompositionProps, frame: number): void {
    if (props.dialogueCharacters && props.dialogueCharacters.length > 0) {
      this.updateMultiCharacters(props, frame)
    } else {
      this.updateSingleCharacter(props, frame)
    }
  }

  private getOrCreateCharSprites(
    id: string,
    parent: Container,
  ): {
    container: Container
    parts: Record<LayerPart, Sprite>
  } {
    let entry = this.dialogueCharContainers.get(id)
    if (!entry) {
      const container = new Container()
      container.sortableChildren = true
      parent.addChild(container)

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
      for (const part of [
        'body',
        'head',
        'viseme',
        'eye',
        'eyebrow',
        'hair',
        'shirt',
        'pants',
        'shoes',
      ] as LayerPart[]) {
        parts[part].anchor.set(0.5)
        container.addChild(parts[part])
      }

      entry = { container, parts }
      this.dialogueCharContainers.set(id, entry)
    }
    return entry
  }

  private updateMultiCharacters(props: VideoCompositionProps, frame: number): void {
    const layerOrder = useCharacterPartsStore.getState().layerOrder

    for (const dc of props.dialogueCharacters!) {
      if (!dc.visible) continue

      const { container, parts } = this.getOrCreateCharSprites(dc.id, this.characterContainer)

      // Find active dialogue line
      const activeLine = dc.dialogueLines.find((l) => frame >= l.startFrame && frame < l.endFrame)
      const relativeFrame = activeLine ? frame - activeLine.startFrame : 0
      const visemeTimeline = activeLine?.visemeTimeline || []
      const emotionTimeline = activeLine?.emotionTimeline || []

      // Resolve current viseme/emotion
      const currentViseme = getVisemeAtFrame(visemeTimeline, relativeFrame)
      const currentEmotion = getEmotionAtFrame(emotionTimeline, relativeFrame)
      const visemeUrl = getVisemeSpriteUrl(dc.savedCharacter, currentViseme, currentEmotion)

      const character = dc.savedCharacter
      const { savedImages, transforms, selectedSprites } = character

      const eyeImages = savedImages.eye || []
      const eyebrowImages = savedImages.eyebrow || []
      const hairImages = savedImages.hair || []
      const bodyImages = savedImages.body || []
      const headImages = savedImages.head || []
      const shirtImages = savedImages.shirt || []
      const pantsImages = savedImages.pants || []
      const shoesImages = savedImages.shoes || []

      const displayBody =
        (selectedSprites.body !== null ? bodyImages[selectedSprites.body] : null) || bodyImages[0] || null
      const displayHead =
        (selectedSprites.head !== null ? headImages[selectedSprites.head] : null) || headImages[0] || null
      const displayEye = (selectedSprites.eye !== null ? eyeImages[selectedSprites.eye] : null) || eyeImages[0] || null
      const displayEyebrow =
        (selectedSprites.eyebrow !== null ? eyebrowImages[selectedSprites.eyebrow] : null) || eyebrowImages[0] || null
      const displayHair =
        (selectedSprites.hair !== null ? hairImages[selectedSprites.hair] : null) || hairImages[0] || null
      const displayShirt =
        (selectedSprites.shirt !== null ? shirtImages[selectedSprites.shirt] : null) || shirtImages[0] || null
      const displayPants =
        (selectedSprites.pants !== null ? pantsImages[selectedSprites.pants] : null) || pantsImages[0] || null
      const displayShoes =
        (selectedSprites.shoes !== null ? shoesImages[selectedSprites.shoes] : null) || shoesImages[0] || null

      // Position
      let posX = dc.position.x
      let posY = dc.position.y
      let scale = dc.scale

      if (props.keyframeData) {
        posX = getKfValue(this.kfIndex, 'dialogueCharacter', dc.id, 'position.x', frame) ?? posX
        posY = getKfValue(this.kfIndex, 'dialogueCharacter', dc.id, 'position.y', frame) ?? posY
        const kfScale = getKfValue(this.kfIndex, 'dialogueCharacter', dc.id, 'scale', frame)
        if (kfScale !== undefined) scale = kfScale
      }

      const displaySize = BASE_CHARACTER_SIZE * scale
      container.x = posX
      container.y = posY
      container.visible = true
      container.zIndex = dc.zIndex

      // Draw parts
      const spriteMap: Record<LayerPart, string | null> = {
        body: displayBody,
        head: displayHead,
        viseme: visemeUrl,
        eye: displayEye,
        eyebrow: displayEyebrow,
        hair: displayHair,
        shirt: displayShirt,
        pants: displayPants,
        shoes: displayShoes,
      }

      for (let idx = 0; idx < layerOrder.length; idx++) {
        const part = layerOrder[idx]
        const sprite = parts[part]
        const src = spriteMap[part]
        const transform = transforms[part]

        if (!transform || !transform.visible || !src) {
          sprite.visible = false
          continue
        }

        const texture = this.textures.get(src)
        if (!texture) {
          sprite.visible = false
          continue
        }

        sprite.visible = true
        sprite.texture = texture
        sprite.zIndex = idx

        // Apply transform
        sprite.x = transform.x * scale
        sprite.y = transform.y * scale
        sprite.rotation = transform.rotation * DEG_TO_RAD
        sprite.scale.set(transform.scaleX, transform.scaleY)

        // Size to fit
        const imgW = texture.width
        const imgH = texture.height
        const fitScale = Math.min(displaySize / imgW, displaySize / imgH)
        sprite.width = imgW * fitScale * transform.scaleX
        sprite.height = imgH * fitScale * transform.scaleY
      }
    }
  }

  private updateSingleCharacter(props: VideoCompositionProps, frame: number): void {
    const { character, visemeTimeline, emotionTimeline } = props

    if (!this.singleCharContainer) {
      this.singleCharContainer = new Container()
      this.singleCharContainer.sortableChildren = true
      this.characterContainer.addChild(this.singleCharContainer)

      this.singleCharParts = {
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
      for (const part of [
        'body',
        'head',
        'viseme',
        'eye',
        'eyebrow',
        'hair',
        'shirt',
        'pants',
        'shoes',
      ] as LayerPart[]) {
        this.singleCharParts[part].anchor.set(0.5)
        this.singleCharContainer.addChild(this.singleCharParts[part])
      }
    }

    const { savedImages, transforms, selectedSprites } = character
    const groupTransform = transforms.group
    if (!groupTransform.visible) {
      this.singleCharContainer.visible = false
      return
    }
    this.singleCharContainer.visible = true

    // Group transform
    let groupX = groupTransform.x
    let groupY = groupTransform.y
    let groupScaleX = groupTransform.scaleX
    let groupScaleY = groupTransform.scaleY

    if (props.keyframeData) {
      groupX = getKfValue(this.kfIndex, 'character', 'composite', 'position.x', frame) ?? groupX
      groupY = getKfValue(this.kfIndex, 'character', 'composite', 'position.y', frame) ?? groupY
      const kfScale = getKfValue(this.kfIndex, 'character', 'composite', 'scale', frame)
      if (kfScale !== undefined) {
        groupScaleX = kfScale
        groupScaleY = kfScale
      }
    }

    this.singleCharContainer.x = groupX
    this.singleCharContainer.y = groupY
    this.singleCharContainer.rotation = groupTransform.rotation * DEG_TO_RAD
    this.singleCharContainer.scale.set(groupScaleX, groupScaleY)

    // Resolve sprites
    const eyeImages = savedImages.eye || []
    const eyebrowImages = savedImages.eyebrow || []
    const hairImages = savedImages.hair || []
    const bodyImages = savedImages.body || []
    const headImages = savedImages.head || []
    const shirtImages = savedImages.shirt || []
    const pantsImages = savedImages.pants || []
    const shoesImages = savedImages.shoes || []

    const displayBody =
      (selectedSprites.body !== null ? bodyImages[selectedSprites.body] : null) || bodyImages[0] || null
    const displayHead =
      (selectedSprites.head !== null ? headImages[selectedSprites.head] : null) || headImages[0] || null
    const displayEye = (selectedSprites.eye !== null ? eyeImages[selectedSprites.eye] : null) || eyeImages[0] || null
    const displayEyebrow =
      (selectedSprites.eyebrow !== null ? eyebrowImages[selectedSprites.eyebrow] : null) || eyebrowImages[0] || null
    const displayHair =
      (selectedSprites.hair !== null ? hairImages[selectedSprites.hair] : null) || hairImages[0] || null
    const displayShirt =
      (selectedSprites.shirt !== null ? shirtImages[selectedSprites.shirt] : null) || shirtImages[0] || null
    const displayPants =
      (selectedSprites.pants !== null ? pantsImages[selectedSprites.pants] : null) || pantsImages[0] || null
    const displayShoes =
      (selectedSprites.shoes !== null ? shoesImages[selectedSprites.shoes] : null) || shoesImages[0] || null

    const currentViseme = getVisemeAtFrame(visemeTimeline, frame)
    const currentEmotion = getEmotionAtFrame(emotionTimeline, frame)
    const displayVisemeUrl = getVisemeSpriteUrl(character, currentViseme, currentEmotion)

    const layerOrder = useCharacterPartsStore.getState().layerOrder
    const spriteMap: Record<LayerPart, string | null> = {
      body: displayBody,
      head: displayHead,
      viseme: displayVisemeUrl,
      eye: displayEye,
      eyebrow: displayEyebrow,
      hair: displayHair,
      shirt: displayShirt,
      pants: displayPants,
      shoes: displayShoes,
    }

    for (let idx = 0; idx < layerOrder.length; idx++) {
      const part = layerOrder[idx]
      const sprite = this.singleCharParts![part]
      const src = spriteMap[part]
      const transform = transforms[part]

      if (!transform || !transform.visible || !src) {
        sprite.visible = false
        continue
      }

      const texture = this.textures.get(src)
      if (!texture) {
        sprite.visible = false
        continue
      }

      sprite.visible = true
      sprite.texture = texture
      sprite.zIndex = idx
      sprite.x = transform.x
      sprite.y = transform.y
      sprite.rotation = transform.rotation * DEG_TO_RAD

      // Draw at natural size centered
      sprite.width = texture.width * transform.scaleX
      sprite.height = texture.height * transform.scaleY
    }
  }

  // ── 3D Character Layers ────────────────────────────────────────────

  private update3DLayers(props: VideoCompositionProps, frame: number, threeInstance: ThreeExportInstance | null): void {
    if (!threeInstance || !props.characters3D) {
      this.threeDContainer.visible = false
      return
    }

    this.threeDContainer.visible = true

    // Seek animations
    for (const char of props.characters3D) {
      if (!char.visible) continue
      const entry = threeInstance.characters.get(char.id)
      if (!entry?.mixer) continue
      // Don't multiply by animationSpeed — already applied via action.setEffectiveTimeScale()
      const timeInSeconds = (frame - char.animationStartFrame) / props.fps
      entry.mixer.setTime(Math.max(0, timeInSeconds))
      // Force PropertyBindings to evaluate and write transforms to bones
      entry.mixer.update(0)
    }

    // Render Three.js scene
    threeInstance.renderer.render(threeInstance.scene, threeInstance.camera)

    // Composite via sprite
    if (!this.threeSprite) {
      this.threeSprite = new Sprite()
      this.threeDContainer.addChild(this.threeSprite)
    }

    this.threeSprite.texture = Texture.from(threeInstance.canvas)
    this.threeSprite.visible = true
  }

  // ── 2D Rigged Character Layers ─────────────────────────────────────

  private updateRiggedLayers(
    props: VideoCompositionProps,
    frame: number,
    rigInstances: Map<string, RigExportInstance> | null,
  ): void {
    if (!rigInstances || !props.rigData) {
      this.riggedContainer.visible = false
      return
    }

    this.riggedContainer.visible = true

    for (const rig of props.rigData) {
      const instance = rigInstances.get(rig.id)
      if (!instance) continue

      // Get pose at current frame
      let currentPose = instance.restPose
      if (instance.poseTracks.length > 0) {
        const track = instance.poseTracks[0]
        if (track.keyframes.length > 0) {
          const interpolated = getPoseAtFrame(track.keyframes, frame)
          if (interpolated) currentPose = interpolated
        }
      }

      // Deform mesh
      if (instance.brEngine) {
        const poseDeltas: Record<string, { x: number; y: number }> = {}
        for (const [jointId, state] of Object.entries(currentPose)) {
          const joint = instance.skeleton.joints.find((j) => j.id === jointId)
          const key = joint?.name || jointId
          poseDeltas[key] = { x: state.dx, y: state.dy }
        }
        const deformedPositions = instance.brEngine.getDeformedMeshForPose(poseDeltas)
        const len = Math.min(instance.mesh.vertices.length, deformedPositions.length)
        for (let i = 0; i < len; i++) {
          instance.mesh.vertices[i].deformedX = deformedPositions[i].x
          instance.mesh.vertices[i].deformedY = deformedPositions[i].y
        }
      } else {
        deformMesh(instance.mesh, instance.skinning, instance.skeleton, instance.restPose, currentPose)
      }

      // Render to offscreen canvas
      instance.ctx.clearRect(0, 0, instance.canvas.width, instance.canvas.height)
      instance.ctx.resetTransform()
      renderMeshToCanvas(instance.ctx, instance.mesh, instance.texture)

      // Composite via PixiJS sprite
      let sprite = this.riggedSprites.get(rig.id)
      if (!sprite) {
        sprite = new Sprite()
        this.riggedContainer.addChild(sprite)
        this.riggedSprites.set(rig.id, sprite)
      }
      sprite.texture = Texture.from(instance.canvas)
      sprite.visible = true
    }
  }

  // ── Text Overlay Layers ────────────────────────────────────────────

  private updateTextOverlays(props: VideoCompositionProps, frame: number): void {
    if (!props.textOverlays) {
      this.textContainer.visible = false
      return
    }

    this.textContainer.visible = true
    const activeIds = new Set<string>()

    for (const overlay of props.textOverlays) {
      if (frame < overlay.startFrame || frame >= overlay.endFrame) continue

      activeIds.add(overlay.id)

      let entry = this.textEntries.get(overlay.id)
      if (!entry) {
        const container = new Container()
        this.textContainer.addChild(container)
        const bg = new Graphics()
        bg.visible = false
        container.addChild(bg)
        const text = new Text({ text: '', style: new TextStyle() })
        container.addChild(text)
        entry = { container, text, bg }
        this.textEntries.set(overlay.id, entry)
      }

      entry.container.visible = true

      // Keyframe interpolation
      const freeX = getKfValue(this.kfIndex, 'text', overlay.id, 'freeX', frame) ?? overlay.freeX
      const freeY = getKfValue(this.kfIndex, 'text', overlay.id, 'freeY', frame) ?? overlay.freeY
      const fontSize = getKfValue(this.kfIndex, 'text', overlay.id, 'fontSize', frame) ?? overlay.fontSize
      const opacity = getKfValue(this.kfIndex, 'text', overlay.id, 'opacity', frame) ?? overlay.opacity
      const rotation = getKfValue(this.kfIndex, 'text', overlay.id, 'rotation', frame) ?? overlay.rotation
      const letterSpacing =
        getKfValue(this.kfIndex, 'text', overlay.id, 'letterSpacing', frame) ?? overlay.letterSpacing
      const lineHeight = getKfValue(this.kfIndex, 'text', overlay.id, 'lineHeight', frame) ?? overlay.lineHeight
      const backgroundOpacity =
        getKfValue(this.kfIndex, 'text', overlay.id, 'backgroundOpacity', frame) ?? overlay.backgroundOpacity

      // Text content
      let displayText = overlay.content
      if (overlay.textCase === 'uppercase') displayText = displayText.toUpperCase()
      else if (overlay.textCase === 'lowercase') displayText = displayText.toLowerCase()

      // Update text style
      const style = new TextStyle({
        fontFamily: `"${overlay.fontFamily}", sans-serif`,
        fontSize,
        fontWeight: (FONT_WEIGHT_MAP[overlay.fontWeight] || '400') as TextStyleFontWeight,
        fill: overlay.color,
        align: overlay.align === 'justify' ? 'left' : (overlay.align as 'left' | 'center' | 'right'),
        lineHeight: fontSize * lineHeight,
        letterSpacing,
        wordWrap: true,
        wordWrapWidth: this.width * 0.9,
        dropShadow: overlay.shadow
          ? {
              color: 'rgba(0,0,0,0.8)',
              blur: 8,
              distance: 2,
              angle: Math.PI / 2,
            }
          : undefined,
      })

      entry.text.text = displayText
      entry.text.style = style

      const textWidth = entry.text.width
      const textHeight = entry.text.height

      // Background
      if (overlay.background) {
        entry.bg.visible = true
        entry.bg.clear()
        const padX = fontSize * 0.3
        const padY = fontSize * 0.15
        entry.bg.roundRect(-padX, -padY, textWidth + padX * 2, textHeight + padY * 2, 6)
        entry.bg.fill({ color: 0x000000, alpha: backgroundOpacity })
      } else {
        entry.bg.visible = false
      }

      // Position
      entry.container.alpha = opacity

      switch (overlay.position) {
        case 'top':
          entry.container.x = (this.width - textWidth) / 2
          entry.container.y = this.height * 0.08
          entry.container.rotation = 0
          break
        case 'center':
          entry.container.x = (this.width - textWidth) / 2
          entry.container.y = (this.height - textHeight) / 2
          entry.container.rotation = 0
          break
        case 'bottom':
          entry.container.x = (this.width - textWidth) / 2
          entry.container.y = this.height * 0.92 - textHeight
          entry.container.rotation = 0
          break
        case 'free':
        default: {
          const cx = (freeX / 100) * this.width
          const cy = (freeY / 100) * this.height
          entry.container.x = cx - textWidth / 2
          entry.container.y = cy - textHeight / 2
          if (rotation !== 0) {
            entry.container.pivot.set(textWidth / 2, textHeight / 2)
            entry.container.x = cx
            entry.container.y = cy
            entry.container.rotation = rotation * DEG_TO_RAD
          } else {
            entry.container.pivot.set(0, 0)
            entry.container.rotation = 0
          }
          break
        }
      }
    }

    // Hide inactive text overlays
    for (const [id, entry] of this.textEntries) {
      if (!activeIds.has(id)) entry.container.visible = false
    }
  }

  // ── Caption Layer ──────────────────────────────────────────────────

  private updateCaptions(props: VideoCompositionProps, frame: number): void {
    const { captions } = props
    if (!captions || !captions.wordTimeline || captions.wordTimeline.length === 0) {
      this.captionContainer.visible = false
      return
    }

    const captionData = getCaptionAtFrame(captions, frame)
    if (!captionData) {
      this.captionContainer.visible = false
      return
    }

    this.captionContainer.visible = true

    const { style: captionStyle, fontSize, position } = captions

    // Update styles if needed
    const styleKey = `${fontSize}`
    if (styleKey !== this.lastCaptionStyleKey) {
      this.lastCaptionStyleKey = styleKey
      const dropShadow = { alpha: 1, color: 'rgba(0,0,0,0.5)', blur: 4, distance: 2, angle: Math.PI / 2 }
      this.captionStyle.fontSize = fontSize
      this.captionStyle.dropShadow = dropShadow
      this.captionHighlightStyle.fontSize = fontSize
      this.captionHighlightStyle.dropShadow = dropShadow
    }

    let totalTextWidth = 0
    let totalTextHeight = 0

    if (captionStyle === 'karaoke' && captionData.highlightIndex !== undefined) {
      this.captionSingleText.visible = false
      const words = captionData.text.split(' ')

      // Ensure pool
      while (this.captionWordPool.length < words.length) {
        const t = new Text({ text: '', style: this.captionStyle })
        t.visible = false
        this.captionTextContainer.addChild(t)
        this.captionWordPool.push(t)
      }

      let xOffset = 0
      for (let i = 0; i < words.length; i++) {
        const wt = this.captionWordPool[i]
        wt.visible = true
        wt.text = words[i] + (i < words.length - 1 ? ' ' : '')
        wt.style = i === captionData.highlightIndex ? this.captionHighlightStyle : this.captionStyle
        wt.x = xOffset
        wt.y = 0
        xOffset += wt.width
        totalTextHeight = Math.max(totalTextHeight, wt.height)
      }
      totalTextWidth = xOffset

      for (let i = words.length; i < this.captionActiveWords; i++) {
        this.captionWordPool[i].visible = false
      }
      this.captionActiveWords = words.length
    } else {
      for (let i = 0; i < this.captionActiveWords; i++) {
        this.captionWordPool[i].visible = false
      }
      this.captionActiveWords = 0

      const textColor = captionStyle === 'word-by-word' ? '#4ade80' : 'white'
      this.captionStyle.fill = textColor
      this.captionSingleText.visible = true
      this.captionSingleText.text = captionData.text
      this.captionSingleText.style = this.captionStyle
      totalTextWidth = this.captionSingleText.width
      totalTextHeight = this.captionSingleText.height
    }

    // Background
    const padX = 24
    const padY = 12
    const bgWidth = totalTextWidth + padX * 2
    const bgHeight = totalTextHeight + padY * 2

    this.captionBg.clear()
    this.captionBg.roundRect(0, 0, bgWidth, bgHeight, 12)
    this.captionBg.fill({ color: 0x000000, alpha: 0.7 })

    this.captionTextContainer.x = padX
    this.captionTextContainer.y = padY

    const centerX = (this.width - bgWidth) / 2

    switch (position) {
      case 'top':
        this.captionContainer.x = centerX
        this.captionContainer.y = 32
        break
      case 'center':
        this.captionContainer.x = centerX
        this.captionContainer.y = (this.height - bgHeight) / 2
        break
      case 'bottom':
      default:
        this.captionContainer.x = centerX
        this.captionContainer.y = this.height - 32 - bgHeight
        break
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────

  dispose(): void {
    // Destroy all PixiJS objects
    this.textures.clear()
    this.mediaSprites.clear()
    this.shapeGraphics.clear()
    this.textEntries.clear()
    this.lottieSprites.clear()
    this.templateSprites.clear()
    this.videoSprites.clear()
    this.dialogueCharContainers.clear()

    this.app.destroy(true, { children: true, texture: false })
  }
}

/**
 * Check if the browser supports WebGL2 (required for PixiJS export renderer).
 */
export function isWebGL2Supported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2')
    return !!gl
  } catch {
    return false
  }
}
