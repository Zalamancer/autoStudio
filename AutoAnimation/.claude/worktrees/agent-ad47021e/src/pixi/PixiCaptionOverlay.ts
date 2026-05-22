import { Container, Text, TextStyle, Graphics } from 'pixi.js'
import { useTimelineStore, useVoiceStore } from '@/stores'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import type { DialogueLine } from '@/stores/useMultiCharacterStore'

interface CaptionData {
  text: string
  highlightIndex?: number
}

/**
 * PixiCaptionOverlay renders subtitle/caption text on the WebGL canvas.
 * This replaces the DOM-based CaptionOverlay.tsx with PixiJS Text objects.
 *
 * Supports three caption modes:
 * - word-by-word: Shows one word at a time
 * - sentence: Shows full sentence
 * - karaoke: Shows sentence with highlighted active word
 *
 * Performance: Uses object pooling for Text objects and caches TextStyles
 * to avoid per-frame allocations and expensive rasterization.
 */
export class PixiCaptionOverlay {
  private container: Container
  private bgGraphics: Graphics
  private textContainer: Container
  private lastCaptionKey = ''

  // Display dimensions (pixels on screen)
  private displayWidth = 1920
  private displayHeight = 1080

  // Object pool for word Text objects (karaoke mode)
  private wordPool: Text[] = []
  private activeWordCount = 0
  // Single text object for non-karaoke modes
  private singleText: Text
  // Cached TextStyle to avoid creating new ones every frame
  private cachedStyle: TextStyle
  private cachedHighlightStyle: TextStyle
  private lastStyleKey = ''

  constructor(parentContainer: Container) {
    this.container = new Container()
    this.container.label = 'PixiCaptionOverlay'
    this.container.visible = false
    parentContainer.addChild(this.container)

    // Background rectangle
    this.bgGraphics = new Graphics()
    this.bgGraphics.label = 'captionBg'
    this.container.addChild(this.bgGraphics)

    // Text container (holds single Text or multiple word Texts for karaoke)
    this.textContainer = new Container()
    this.textContainer.label = 'captionText'
    this.container.addChild(this.textContainer)

    // Pre-allocate reusable objects
    this.cachedStyle = new TextStyle({
      fontFamily: '"Inter", sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: '#ffffff',
    })
    this.cachedHighlightStyle = new TextStyle({
      fontFamily: '"Inter", sans-serif',
      fontSize: 24,
      fontWeight: 'bold',
      fill: '#4ade80',
    })
    this.singleText = new Text({ text: '', style: this.cachedStyle })
    this.singleText.label = 'captionSingle'
    this.singleText.visible = false
    this.textContainer.addChild(this.singleText)
  }

  setDimensions(displayWidth: number, displayHeight: number) {
    this.displayWidth = displayWidth
    this.displayHeight = displayHeight
  }

  /**
   * Called each tick by the render loop.
   * @returns true if anything changed (dirty)
   */
  update(): boolean {
    const currentFrame = useTimelineStore.getState().currentFrame
    const voiceStore = useVoiceStore.getState()
    const { activeVoiceId, captionStyle, captionFontSize, captionPosition, getCaptionAtFrame } = voiceStore

    const { dialogueLines } = useMultiCharacterStore.getState()
    const isMultiCharMode = dialogueLines.length > 0

    const caption = computeCaption(
      currentFrame, activeVoiceId, captionStyle,
      dialogueLines, isMultiCharMode, getCaptionAtFrame
    )

    if (!caption) {
      if (this.container.visible) {
        this.container.visible = false
        this.lastCaptionKey = ''
        return true
      }
      return false
    }

    if (!this.container.visible) this.container.visible = true

    // Build key to detect changes
    const key = `${caption.text}|${caption.highlightIndex ?? ''}|${captionFontSize}|${captionPosition}|${this.displayWidth}`
    if (key === this.lastCaptionKey) return false
    this.lastCaptionKey = key

    const captionColor = voiceStore.captionColor || '#ffffff'
    const captionBgOpacity = voiceStore.captionBgOpacity ?? 0.7

    // Scale font size relative to display
    const scaleFactor = this.displayWidth / 1920
    const scaledFontSize = captionFontSize * scaleFactor

    // Update cached styles only when style properties change
    const styleKey = `${scaledFontSize}|${captionColor}|${scaleFactor}`
    if (styleKey !== this.lastStyleKey) {
      this.lastStyleKey = styleKey
      const dropShadow = {
        alpha: 1,
        color: 'rgba(0,0,0,0.5)',
        blur: 4 * scaleFactor,
        distance: 2 * scaleFactor,
        angle: Math.PI / 2,
      }
      this.cachedStyle.fontSize = scaledFontSize
      this.cachedStyle.fill = captionColor
      this.cachedStyle.dropShadow = dropShadow
      this.cachedHighlightStyle.fontSize = scaledFontSize
      this.cachedHighlightStyle.fill = '#4ade80'
      this.cachedHighlightStyle.dropShadow = dropShadow
    }

    let totalTextWidth = 0
    let totalTextHeight = 0

    if (captionStyle === 'karaoke' && caption.highlightIndex !== undefined) {
      // Karaoke mode: reuse pooled word Text objects
      this.singleText.visible = false
      const words = caption.text.split(/\s+/)

      // Ensure pool has enough Text objects
      while (this.wordPool.length < words.length) {
        const t = new Text({ text: '', style: this.cachedStyle })
        t.label = `captionWord_${this.wordPool.length}`
        t.visible = false
        this.textContainer.addChild(t)
        this.wordPool.push(t)
      }

      let xOffset = 0
      for (let i = 0; i < words.length; i++) {
        const wt = this.wordPool[i]
        wt.visible = true
        wt.text = words[i] + (i < words.length - 1 ? ' ' : '')
        wt.style = i === caption.highlightIndex ? this.cachedHighlightStyle : this.cachedStyle
        wt.x = xOffset
        wt.y = 0
        xOffset += wt.width
        totalTextHeight = Math.max(totalTextHeight, wt.height)
      }
      totalTextWidth = xOffset

      // Hide excess pool entries
      for (let i = words.length; i < this.activeWordCount; i++) {
        this.wordPool[i].visible = false
      }
      this.activeWordCount = words.length
    } else {
      // Regular text (word-by-word or sentence) — reuse single Text
      for (let i = 0; i < this.activeWordCount; i++) {
        this.wordPool[i].visible = false
      }
      this.activeWordCount = 0

      this.singleText.visible = true
      this.singleText.text = caption.text
      this.singleText.style = this.cachedStyle
      this.singleText.x = 0
      this.singleText.y = 0
      totalTextWidth = this.singleText.width
      totalTextHeight = this.singleText.height
    }

    // Draw background
    const padX = 24 * scaleFactor
    const padY = 12 * scaleFactor
    const bgWidth = totalTextWidth + padX * 2
    const bgHeight = totalTextHeight + padY * 2
    const borderRadius = 12 * scaleFactor

    this.bgGraphics.clear()
    this.bgGraphics.roundRect(0, 0, bgWidth, bgHeight, borderRadius)
    this.bgGraphics.fill({ color: 0x000000, alpha: captionBgOpacity })

    // Position text within background
    this.textContainer.x = padX
    this.textContainer.y = padY

    // Position the caption container on canvas
    const centerX = (this.displayWidth - bgWidth) / 2

    switch (captionPosition) {
      case 'top':
        this.container.x = centerX
        this.container.y = this.displayHeight * 0.04
        break
      case 'center':
        this.container.x = centerX
        this.container.y = (this.displayHeight - bgHeight) / 2
        break
      case 'bottom':
      default:
        this.container.x = centerX
        this.container.y = this.displayHeight * 0.96 - bgHeight
        break
    }

    return true
  }

  /** Set the z-index of this layer's container on the stage. */
  setZIndex(z: number) {
    this.container.zIndex = z
  }

  destroy() {
    this.container.destroy({ children: true })
  }
}

/**
 * Compute caption data for a given frame.
 * Pure function — ported from CaptionOverlay.tsx
 */
function computeCaption(
  currentFrame: number,
  activeVoiceId: string | null,
  captionStyle: string,
  dialogueLines: DialogueLine[],
  isMultiCharMode: boolean,
  getCaptionAtFrame: (frame: number) => CaptionData | null,
): CaptionData | null {
  if (!activeVoiceId) return null

  if (isMultiCharMode) {
    const activeLine = dialogueLines.find(
      (l) => currentFrame >= l.startFrame && currentFrame < l.endFrame
    )
    if (!activeLine || activeLine.wordTimeline.length === 0) return null

    const relativeFrame = currentFrame - activeLine.startFrame

    switch (captionStyle) {
      case 'word-by-word': {
        const word = activeLine.wordTimeline.find(
          (w) => relativeFrame >= w.startFrame && relativeFrame < w.endFrame
        )
        return word ? { text: word.word } : null
      }

      case 'sentence':
      case 'karaoke': {
        const cleanScript = activeLine.script.replace(/\[[\w-]+\]/g, '').replace(/\s+/g, ' ').trim()
        const sentenceTexts = cleanScript.match(/[^.!?]+[.!?]+/g) || [cleanScript]
        let wordIdx = 0
        let matchedSentence: { text: string; words: typeof activeLine.wordTimeline } | null = null

        for (const sentText of sentenceTexts) {
          const sentWords = sentText.trim().split(/\s+/).filter((w) => w.length > 0)
          const sentWordEvents = activeLine.wordTimeline.slice(wordIdx, wordIdx + sentWords.length)
          wordIdx += sentWords.length

          if (sentWordEvents.length > 0) {
            const sentStart = sentWordEvents[0].startFrame
            const sentEnd = sentWordEvents[sentWordEvents.length - 1].endFrame
            if (relativeFrame >= sentStart && relativeFrame < sentEnd) {
              matchedSentence = { text: sentText.trim(), words: sentWordEvents }
              break
            }
          }
        }

        if (!matchedSentence) return null

        if (captionStyle === 'sentence') {
          return { text: matchedSentence.text }
        }

        const activeWordIndex = matchedSentence.words.findIndex(
          (w) => relativeFrame >= w.startFrame && relativeFrame < w.endFrame
        )
        return {
          text: matchedSentence.text,
          highlightIndex: activeWordIndex >= 0 ? activeWordIndex : undefined,
        }
      }

      default:
        return null
    }
  }

  return getCaptionAtFrame(currentFrame)
}
