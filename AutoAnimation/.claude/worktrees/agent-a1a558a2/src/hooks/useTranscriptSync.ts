/**
 * useTranscriptSync — Bidirectional binding between Slate editor and timeline stores.
 *
 * Subscribes to useMultiCharacterStore changes to update the Slate editor (timeline-to-text),
 * and handles Slate onChange events to compute and apply timeline operations (text-to-timeline).
 * Includes a lock mechanism to prevent infinite update loops.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
// Voice store not needed for basic transcript sync
import { buildTranscript, type TranscriptLine } from '@/services/transcriptSync'
import type { ParagraphElement, WordNode } from '@/types/transcriptEditor'

/** Lock to prevent bidirectional sync loops */
let syncLock = false

function acquireLock(): boolean {
  if (syncLock) return false
  syncLock = true
  queueMicrotask(() => {
    syncLock = false
  })
  return true
}

/**
 * Build a Slate-compatible document from dialogue state.
 */
export function buildSlateDoc(transcriptLines: TranscriptLine[]): ParagraphElement[] {
  return transcriptLines.map((line) => {
    const words = line.text.split(/\s+/).filter(Boolean)
    const framesPerWord = words.length > 0
      ? (line.endFrame - line.startFrame) / words.length
      : 0

    const children: WordNode[] = words.map((word, i) => ({
      text: word + (i < words.length - 1 ? ' ' : ''),
      wordIndex: i,
      startFrame: Math.round(line.startFrame + i * framesPerWord),
      endFrame: Math.round(line.startFrame + (i + 1) * framesPerWord),
    }))

    if (children.length === 0) {
      children.push({ text: '', wordIndex: 0, startFrame: line.startFrame, endFrame: line.endFrame })
    }

    return {
      type: 'paragraph' as const,
      lineId: line.lineId,
      characterId: line.characterId,
      characterName: line.characterName,
      color: line.color,
      children,
    }
  })
}

/**
 * Hook that maintains bidirectional binding between Slate document and timeline.
 */
export function useTranscriptSync(
  onDocUpdate: (doc: ParagraphElement[]) => void,
) {
  const prevLinesRef = useRef<string>('')

  // Timeline-to-Text sync: watch dialogue changes and rebuild Slate doc
  useEffect(() => {
    const unsub = useMultiCharacterStore.subscribe(() => {
      if (!acquireLock()) return

      const transcript = buildTranscript()
      const linesKey = transcript.map((l) => `${l.lineId}:${l.startFrame}:${l.endFrame}:${l.text}`).join('|')

      if (linesKey !== prevLinesRef.current) {
        prevLinesRef.current = linesKey
        const doc = buildSlateDoc(transcript)
        onDocUpdate(doc)
      }
    })

    return unsub
  }, [onDocUpdate])

  // Text-to-Timeline sync: handle text changes from Slate
  const handleSlateChange = useCallback((paragraphs: ParagraphElement[]) => {
    if (!acquireLock()) return

    const multiChar = useMultiCharacterStore.getState()

    for (const para of paragraphs) {
      const line = multiChar.dialogueLines.find((l) => l.id === para.lineId)
      if (!line) continue

      const newText = para.children.map((c) => c.text).join('').trim()
      if (newText !== line.script) {
        multiChar.updateDialogueLine(para.lineId, { script: newText })
      }
    }
  }, [])

  return { handleSlateChange }
}
