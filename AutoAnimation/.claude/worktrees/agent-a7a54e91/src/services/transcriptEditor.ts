/**
 * Transcript Editor Service
 *
 * Maps word-level alignment data to frame ranges, enabling
 * click-to-seek and text-based video editing (Descript-style).
 *
 * Phase 6: Added Slate.js bidirectional sync engine.
 */

import type { Descendant } from 'slate'
import type { WordEvent } from '@/types/voice'
import type { DialogueLine } from '@/stores/useMultiCharacterStore'
import type {
  ParagraphElement,
  GapElement,
  WordFrameMapping,
  TimelineOp,
  WordNode,
} from '@/types/transcriptEditor'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTimelineStore } from '@/stores/useTimelineStore'

export interface TranscriptWord {
  /** The word text */
  text: string
  /** Start frame (absolute) */
  startFrame: number
  /** End frame (absolute) */
  endFrame: number
  /** Dialogue line index this word belongs to */
  lineIndex: number
  /** Character name speaking this word */
  characterName: string
  /** Index of this word within its line */
  wordIndex: number
}

export interface TranscriptLine {
  /** Dialogue line index */
  lineIndex: number
  /** Character name */
  characterName: string
  /** Full text of this line */
  fullText: string
  /** Start frame of the line */
  startFrame: number
  /** End frame of the line */
  endFrame: number
  /** Individual words with frame timings */
  words: TranscriptWord[]
}

/**
 * Build a full transcript from multi-character dialogue data.
 *
 * @param dialogueLines Array of dialogue line metadata
 * @param generatedVoices Array of generated voice data with word timelines
 * @returns Structured transcript with word-level timing
 */
export function buildTranscript(
  dialogueLines: Array<{
    id: string
    characterId: string
    characterName: string
    script: string
    startFrame: number
    endFrame: number
  }>,
  generatedVoices: Array<{
    id: string
    wordTimeline?: WordEvent[]
  }>,
): TranscriptLine[] {
  const lines: TranscriptLine[] = []

  for (let i = 0; i < dialogueLines.length; i++) {
    const dLine = dialogueLines[i]
    const voice = generatedVoices[i]

    const words: TranscriptWord[] = []

    if (voice?.wordTimeline && voice.wordTimeline.length > 0) {
      for (let w = 0; w < voice.wordTimeline.length; w++) {
        const wordEvent = voice.wordTimeline[w]
        words.push({
          text: wordEvent.word,
          startFrame: wordEvent.startFrame + dLine.startFrame,
          endFrame: wordEvent.endFrame + dLine.startFrame,
          lineIndex: i,
          characterName: dLine.characterName,
          wordIndex: w,
        })
      }
    } else {
      // Fallback: split text into words with estimated timing
      const cleanText = dLine.script.replace(/\[.*?\]/g, '').trim()
      const wordTexts = cleanText.split(/\s+/).filter(Boolean)
      const frameDuration = dLine.endFrame - dLine.startFrame
      const framesPerWord = frameDuration / Math.max(wordTexts.length, 1)

      for (let w = 0; w < wordTexts.length; w++) {
        words.push({
          text: wordTexts[w],
          startFrame: Math.round(dLine.startFrame + w * framesPerWord),
          endFrame: Math.round(dLine.startFrame + (w + 1) * framesPerWord),
          lineIndex: i,
          characterName: dLine.characterName,
          wordIndex: w,
        })
      }
    }

    lines.push({
      lineIndex: i,
      characterName: dLine.characterName,
      fullText: dLine.script.replace(/\[.*?\]/g, '').trim(),
      startFrame: dLine.startFrame,
      endFrame: dLine.endFrame,
      words,
    })
  }

  return lines
}

/**
 * Find the word at a specific frame position.
 */
export function findWordAtFrame(
  transcript: TranscriptLine[],
  frame: number,
): TranscriptWord | null {
  for (const line of transcript) {
    if (frame < line.startFrame || frame > line.endFrame) continue
    for (const word of line.words) {
      if (frame >= word.startFrame && frame <= word.endFrame) {
        return word
      }
    }
  }
  return null
}

/**
 * Find the line at a specific frame position.
 */
export function findLineAtFrame(
  transcript: TranscriptLine[],
  frame: number,
): TranscriptLine | null {
  for (const line of transcript) {
    if (frame >= line.startFrame && frame <= line.endFrame) {
      return line
    }
  }
  return null
}

// ── Phase 6: Slate.js Bidirectional Sync ─────────────────────────────

/**
 * Convert dialogue lines + word maps into a Slate document.
 */
export function slateDocFromDialogue(
  lines: DialogueLine[],
  wordMaps: Map<string, WordFrameMapping[]>,
  characters: Array<{ id: string; name: string; color: string }>,
): Descendant[] {
  const sorted = [...lines].sort((a, b) => a.order - b.order)
  const doc: Descendant[] = []

  for (let i = 0; i < sorted.length; i++) {
    const line = sorted[i]
    const char = characters.find((c) => c.id === line.characterId)
    const wmap = wordMaps.get(line.id)

    // Insert gap element between non-adjacent lines
    if (i > 0) {
      const prevLine = sorted[i - 1]
      const gapFrames = line.startFrame - prevLine.endFrame
      if (gapFrames > 0) {
        const gapEl: GapElement = {
          type: 'gap',
          durationFrames: gapFrames,
          children: [{ text: '' } as unknown as WordNode],
        }
        doc.push(gapEl as unknown as Descendant)
      }
    }

    // Build word nodes
    const children: WordNode[] = []
    if (wmap && wmap.length > 0) {
      for (let wi = 0; wi < wmap.length; wi++) {
        const w = wmap[wi]
        children.push({
          text: wi < wmap.length - 1 ? w.word + ' ' : w.word,
          wordIndex: wi,
          startFrame: w.startFrame,
          endFrame: w.endFrame,
        })
      }
    } else {
      // No word map -- single text node for the whole line
      children.push({
        text: line.script || ' ',
        wordIndex: 0,
        startFrame: line.startFrame,
        endFrame: line.endFrame,
      })
    }

    const paragraphEl: ParagraphElement = {
      type: 'paragraph',
      lineId: line.id,
      characterId: line.characterId,
      characterName: char?.name || 'Speaker',
      color: char?.color || '#999',
      children,
    }
    doc.push(paragraphEl as unknown as Descendant)
  }

  // Ensure doc is never empty
  if (doc.length === 0) {
    doc.push({
      type: 'paragraph',
      lineId: '',
      characterId: '',
      characterName: 'Speaker',
      color: '#999',
      children: [{ text: '', wordIndex: 0, startFrame: 0, endFrame: 0 }],
    } as unknown as Descendant)
  }

  return doc
}

/**
 * Extract dialogue line data from a Slate document.
 */
export function dialogueFromSlateDoc(doc: Descendant[]): Array<{
  lineId: string
  characterId: string
  text: string
}> {
  const results: Array<{ lineId: string; characterId: string; text: string }> = []

  for (const node of doc) {
    const el = node as unknown as ParagraphElement | GapElement
    if (el.type === 'paragraph' && el.lineId) {
      const text = el.children.map((c: WordNode) => c.text).join('')
      results.push({
        lineId: el.lineId,
        characterId: el.characterId,
        text: text.trim(),
      })
    }
  }

  return results
}

/**
 * Compute minimal set of timeline operations from old doc to new doc.
 */
export function diffSlateChanges(
  oldDoc: Descendant[],
  newDoc: Descendant[],
): TimelineOp[] {
  const ops: TimelineOp[] = []

  const oldLines = dialogueFromSlateDoc(oldDoc)
  const newLines = dialogueFromSlateDoc(newDoc)

  const oldMap = new Map(oldLines.map((l) => [l.lineId, l]))
  const newMap = new Map(newLines.map((l) => [l.lineId, l]))

  // Detect deleted lines
  for (const old of oldLines) {
    if (!newMap.has(old.lineId)) {
      ops.push({ type: 'delete-frames', lineId: old.lineId })
    }
  }

  // Detect text changes
  for (const nl of newLines) {
    const ol = oldMap.get(nl.lineId)
    if (ol && ol.text !== nl.text) {
      ops.push({ type: 'update-text', lineId: nl.lineId, newText: nl.text })
    }
  }

  // Detect reordering
  const oldOrder = oldLines.map((l) => l.lineId)
  const newOrder = newLines.map((l) => l.lineId)
  if (JSON.stringify(oldOrder) !== JSON.stringify(newOrder)) {
    for (let i = 0; i < newOrder.length; i++) {
      const lineId = newOrder[i]
      const oldIdx = oldOrder.indexOf(lineId)
      if (oldIdx !== -1 && oldIdx !== i) {
        ops.push({ type: 'move-frames', lineId, toIndex: i })
      }
    }
  }

  return ops
}

/**
 * Execute timeline operations on the multicharacter and timeline stores.
 */
export function applyTimelineOps(ops: TimelineOp[]): void {
  const multiChar = useMultiCharacterStore.getState()

  for (const op of ops) {
    switch (op.type) {
      case 'delete-frames': {
        const line = multiChar.dialogueLines.find((l) => l.id === op.lineId)
        if (line && op.lineId) {
          const gapFrames = line.endFrame - line.startFrame
          multiChar.removeDialogueLine(op.lineId)
          const remaining = useMultiCharacterStore.getState().dialogueLines
          for (const l of remaining) {
            if (l.startFrame >= (line.startFrame)) {
              multiChar.updateDialogueLine(l.id, {
                startFrame: Math.max(0, l.startFrame - gapFrames),
                endFrame: Math.max(1, l.endFrame - gapFrames),
              })
            }
          }
          const totalFrames = useTimelineStore.getState().totalFrames
          useTimelineStore.getState().setTotalFrames(Math.max(30, totalFrames - gapFrames))
        }
        break
      }
      case 'update-text': {
        if (op.newText !== undefined && op.lineId) {
          multiChar.updateDialogueLine(op.lineId, { script: op.newText })
        }
        break
      }
      case 'move-frames': {
        const sorted = multiChar.getSortedLines()
        const currentOrder = sorted.map((l) => l.id)
        const fromIdx = op.lineId ? currentOrder.indexOf(op.lineId) : -1
        if (fromIdx !== -1 && op.toIndex !== undefined && op.lineId) {
          const newOrder = [...currentOrder]
          newOrder.splice(fromIdx, 1)
          newOrder.splice(op.toIndex, 0, op.lineId)
          multiChar.reorderDialogueLines(newOrder)
        }
        break
      }
    }
  }
}
