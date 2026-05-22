import { useEffect, useRef, memo } from 'react'
import { cn } from '@/lib/utils'
import { useTimelineStore, useVoiceStore } from '@/stores'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import type { DialogueLine } from '@/stores/useMultiCharacterStore'

interface CaptionData {
  text: string
  highlightIndex?: number
}

/**
 * Compute caption data for a given frame.
 * Pure function — no React hooks, no subscriptions.
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

      case 'phrase': {
        const size = Math.max(1, Math.min(5, Math.round(phraseSize || 3)))
        const words = activeLine.wordTimeline

        let activeIndex = words.findIndex(
          (w) => relativeFrame >= w.startFrame && relativeFrame < w.endFrame
        )
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

export const CaptionOverlay = memo(function CaptionOverlay() {
  const {
    activeVoiceId,
    captionStyle,
    captionFontSize,
    captionPosition,
    captionColor,
    captionBgOpacity,
    captionPhraseSize,
    getCaptionAtFrame,
  } = useVoiceStore()

  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines)
  const isMultiCharMode = dialogueLines.length > 0

  const isPhrase = captionStyle === 'phrase'

  // Refs for direct DOM manipulation (zero React re-renders per frame)
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const lastCaptionKey = useRef('')
  const lastHighlightIdx = useRef<number | null>(null)

  // RAF loop: compute caption and update DOM directly
  useEffect(() => {
    let rafId: number

    const update = () => {
      const currentFrame = useTimelineStore.getState().currentFrame
      const caption = computeCaption(
        currentFrame, activeVoiceId, captionStyle, captionPhraseSize,
        dialogueLines, isMultiCharMode, getCaptionAtFrame
      )

      const container = containerRef.current
      const textEl = textRef.current
      if (!container || !textEl) {
        rafId = requestAnimationFrame(update)
        return
      }

      if (!caption) {
        // Hide container
        if (container.style.display !== 'none') {
          container.style.display = 'none'
        }
        lastCaptionKey.current = ''
        lastHighlightIdx.current = null
      } else {
        // Show container
        if (container.style.display === 'none') {
          container.style.display = ''
        }

        const textKey = `${caption.text}|${captionStyle}`
        const highlightIdx = caption.highlightIndex ?? -1

        // Rebuild DOM only when text itself changed (phrase/karaoke) or style changed
        if (textKey !== lastCaptionKey.current) {
          lastCaptionKey.current = textKey
          lastHighlightIdx.current = null

          if ((captionStyle === 'karaoke' || captionStyle === 'phrase') && caption.highlightIndex !== undefined) {
            // Render words as spans so we can switch the highlighted word cheaply
            textEl.textContent = ''
            const words = caption.text.split(/\s+/)
            for (let i = 0; i < words.length; i++) {
              const span = document.createElement('span')
              span.dataset.word = String(i)
              span.textContent = words[i] + (i < words.length - 1 ? ' ' : '')
              textEl.appendChild(span)
            }
          } else {
            textEl.textContent = caption.text
          }
        }

        // Update highlight color without rebuilding DOM
        if ((captionStyle === 'karaoke' || captionStyle === 'phrase') && highlightIdx !== lastHighlightIdx.current) {
          lastHighlightIdx.current = highlightIdx
          const spans = textEl.children
          for (let i = 0; i < spans.length; i++) {
            const span = spans[i] as HTMLSpanElement
            const isActive = i === highlightIdx
            if (isPhrase) {
              // TikTok-style: active word pops with highlight color, inactive stays white
              span.style.color = isActive ? '#facc15' : captionColor || '#ffffff'
              span.style.transform = isActive ? 'scale(1.08)' : 'scale(1)'
              span.style.display = 'inline-block'
              span.style.transition = 'color 80ms, transform 80ms'
              span.style.transformOrigin = 'center'
            } else {
              span.style.color = isActive ? '#4ade80' : 'rgba(255,255,255,0.7)'
            }
          }
        }
      }

      rafId = requestAnimationFrame(update)
    }

    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [activeVoiceId, captionStyle, captionPhraseSize, captionColor, isPhrase, dialogueLines, isMultiCharMode, getCaptionAtFrame])

  // Position classes
  const positionClasses = {
    top: 'top-8',
    center: 'top-1/2 -translate-y-1/2',
    bottom: 'bottom-8',
  }

  // TikTok-style phrase captions: bigger, chunkier, thick outline, no bg
  const phraseStyle: React.CSSProperties = isPhrase
    ? {
        fontSize: Math.max(captionFontSize, 56),
        fontWeight: 900,
        letterSpacing: '0.02em',
        WebkitTextStroke: '4px #000',
        paintOrder: 'stroke fill',
        textShadow: '0 4px 8px rgba(0,0,0,0.6)',
        textTransform: 'uppercase',
        textAlign: 'center',
      }
    : {
        fontSize: captionFontSize,
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
      }

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute left-0 right-0 flex justify-center pointer-events-none z-50',
        positionClasses[captionPosition]
      )}
      style={{ display: 'none' }}
    >
      <div
        ref={textRef}
        className={cn(
          'font-bold',
          isPhrase ? 'px-4 py-2' : 'px-6 py-3 rounded-xl backdrop-blur-sm text-white'
        )}
        style={{
          ...phraseStyle,
          ...(isPhrase
            ? {}
            : { backgroundColor: `rgba(0, 0, 0, ${captionBgOpacity})` }),
        }}
      />
    </div>
  )
})
