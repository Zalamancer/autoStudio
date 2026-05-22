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

export const CaptionOverlay = memo(function CaptionOverlay() {
  const {
    activeVoiceId,
    captionStyle,
    captionFontSize,
    captionPosition,
    getCaptionAtFrame,
  } = useVoiceStore()

  const dialogueLines = useMultiCharacterStore((s) => s.dialogueLines)
  const isMultiCharMode = dialogueLines.length > 0

  // Refs for direct DOM manipulation (zero React re-renders per frame)
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const lastCaptionKey = useRef('')

  // RAF loop: compute caption and update DOM directly
  useEffect(() => {
    let rafId: number

    const update = () => {
      const currentFrame = useTimelineStore.getState().currentFrame
      const caption = computeCaption(
        currentFrame, activeVoiceId, captionStyle,
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
      } else {
        // Show container
        if (container.style.display === 'none') {
          container.style.display = ''
        }

        // Build a key to detect changes (text + highlight index)
        const key = `${caption.text}|${caption.highlightIndex ?? ''}`
        if (key !== lastCaptionKey.current) {
          lastCaptionKey.current = key

          if (captionStyle === 'karaoke' && caption.highlightIndex !== undefined) {
            // Karaoke: render words with highlight
            // Clear previous content and build DOM nodes to avoid XSS via innerHTML
            textEl.textContent = ''
            const words = caption.text.split(/\s+/)
            for (let i = 0; i < words.length; i++) {
              const span = document.createElement('span')
              span.className = `font-bold transition-colors duration-100 ${
                i === caption.highlightIndex ? 'text-green-400' : 'text-white/70'
              }`
              span.textContent = words[i] + (i < words.length - 1 ? ' ' : '')
              textEl.appendChild(span)
            }
          } else {
            // Regular text
            textEl.textContent = caption.text
          }
        }
      }

      rafId = requestAnimationFrame(update)
    }

    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [activeVoiceId, captionStyle, dialogueLines, isMultiCharMode, getCaptionAtFrame])

  // Position classes
  const positionClasses = {
    top: 'top-8',
    center: 'top-1/2 -translate-y-1/2',
    bottom: 'bottom-8',
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
        className="px-6 py-3 bg-black/70 rounded-xl backdrop-blur-sm text-white font-bold"
        style={{
          fontSize: captionFontSize,
          textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  )
})
