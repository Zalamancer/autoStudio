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
      currentFrame,
      activeVoiceId,
      captionStyle,
      voiceStore.captionPhraseSize ?? 3,
      dialogueLines,
      isMultiCharMode,
      getCaptionAtFrame,
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

    const isPhrase = captionStyle === 'phrase'
    // Phrase style: force bigger & add black stroke
    const effectiveFontSize = isPhrase ? Math.max(scaledFontSize, 56 * scaleFactor) : scaledFontSize
    const highlightFill = isPhrase ? '#facc15' : '#4ade80'

    // Update cached styles only when style properties change
    const styleKey = `${effectiveFontSize}|${captionColor}|${scaleFactor}|${isPhrase}`
    if (styleKey !== this.lastStyleKey) {
      this.lastStyleKey = styleKey
      const dropShadow = {
        alpha: 1,
        color: 'rgba(0,0,0,0.6)',
        blur: (isPhrase ? 6 : 4) * scaleFactor,
        distance: (isPhrase ? 3 : 2) * scaleFactor,
        angle: Math.PI / 2,
      }
      this.cachedStyle.fontSize = effectiveFontSize
      this.cachedStyle.fontWeight = isPhrase ? '900' : 'bold'
      this.cachedStyle.fill = captionColor
      this.cachedStyle.dropShadow = dropShadow
      this.cachedStyle.stroke = { color: '#000000', width: isPhrase ? 4 * scaleFactor : 0 }
      this.cachedHighlightStyle.fontSize = effectiveFontSize
      this.cachedHighlightStyle.fontWeight = isPhrase ? '900' : 'bold'
      this.cachedHighlightStyle.fill = highlightFill
      this.cachedHighlightStyle.dropShadow = dropShadow
      this.cachedHighlightStyle.stroke = { color: '#000000', width: isPhrase ? 4 * scaleFactor : 0 }
    }

    let totalTextWidth = 0
    let totalTextHeight = 0

    if ((captionStyle === 'karaoke' || captionStyle === 'phrase') && caption.highlightIndex !== undefined) {
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

      const gap = isPhrase ? 14 * scaleFactor : 0
      let xOffset = 0
      for (let i = 0; i < words.length; i++) {
        const wt = this.wordPool[i]
        wt.visible = true
        const raw = words[i] + (i < words.length - 1 && !isPhrase ? ' ' : '')
        wt.text = isPhrase ? raw.toUpperCase() : raw
        wt.style = i === caption.highlightIndex ? this.cachedHighlightStyle : this.cachedStyle
        wt.x = xOffset
        wt.y = 0
        xOffset += wt.width + (i < words.length - 1 ? gap : 0)
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
    const padX = (isPhrase ? 16 : 24) * scaleFactor
    const padY = (isPhrase ? 8 : 12) * scaleFactor
    const bgWidth = totalTextWidth + padX * 2
    const bgHeight = totalTextHeight + padY * 2
    const borderRadius = (isPhrase ? 0 : 12) * scaleFactor

    this.bgGraphics.clear()
    if (!isPhrase) {
      this.bgGraphics.roundRect(0, 0, bgWidth, bgHeight, borderRadius)
      this.bgGraphics.fill({ color: 0x000000, alpha: captionBgOpacity })
    }

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
  phraseSize: number,
  dialogueLines: DialogueLine[],
  isMultiCharMode: boolean,
  getCaptionAtFrame: (frame: number) => CaptionData | null,
): CaptionData | null {
  if (!activeVoiceId) return null

  if (isMultiCharMode) {
    const activeLine = dialogueLines.find((l) => currentFrame >= l.startFrame && currentFrame < l.endFrame)
    if (!activeLine || activeLine.wordTimeline.length === 0) return null

    const relativeFrame = currentFrame - activeLine.startFrame

    switch (captionStyle) {
      case 'word-by-word': {
        const word = activeLine.wordTimeline.find((w) => relativeFrame >= w.startFrame && relativeFrame < w.endFrame)
        return word ? { text: word.word } : null
      }

      case 'phrase': {
        const size = Math.max(1, Math.min(5, Math.round(phraseSize || 3)))
        const words = activeLine.wordTimeline

        let activeIndex = words.findIndex((w) => relativeFrame >= w.startFrame && relativeFrame < w.endFrame)
        if (activeIndex === -1) {
          const next = words.findIndex((w) => w.startFrame > relativeFrame)
          if (next === -1) return null
          activeIndex = next
        }

        const chunkStart = Math.floor(activeIndex / size) * size
        const chunk = words.slice(chunkStart, chunkStart + size)
        if (chunk.length === 0) return null

        return {
          text: chunk.map((w) => w.word).join(' '),
          highlightIndex: activeIndex - chunkStart,
        }
      }

      case 'sentence':
      case 'karaoke': {
        const cleanScript = activeLine.script
          .replace(/\[[\w-]+\]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
        const sentenceTexts = cleanScript.match(/[^.!?]+[.!?]+/g) || [cleanScript]
        let wordIdx = 0
        let matchedSentence: { text: string; words: typeof activeLine.wordTimeline } | null = null

        for (const sentText of sentenceTexts) {
          const sentWords = sentText
            .trim()
            .split(/\s+/)
            .filter((w) => w.length > 0)
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
          (w) => relativeFrame >= w.startFrame && relativeFrame < w.endFrame,
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
