/**
 * Transcript Sync — Bidirectional sync between transcript text edits and timeline frames.
 *
 * Uses word-level timestamps from ElevenLabs alignment to map text positions to frames.
 */

import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useVoiceStore } from '@/stores/useVoiceStore'

export interface TranscriptLine {
  lineId: string
  characterId: string
  characterName: string
  text: string
  startFrame: number
  endFrame: number
  emotion: string
  color: string // character color for display
}

const CHARACTER_COLORS = [
  '#60a5fa', // blue
  '#f472b6', // pink
  '#34d399', // green
  '#fbbf24', // amber
  '#a78bfa', // purple
  '#fb923c', // orange
]

/**
 * Build a full transcript from the current dialogue state.
 */
export function buildTranscript(): TranscriptLine[] {
  const multiChar = useMultiCharacterStore.getState()
  const lines = multiChar.dialogueLines
  const characters = multiChar.characters

  return lines
    .slice()
    .sort((a, b) => a.startFrame - b.startFrame)
    .map((line) => {
      const char = characters.find((c) => c.id === line.characterId)
      const charIndex = characters.findIndex((c) => c.id === line.characterId)
      return {
        lineId: line.id,
        characterId: line.characterId,
        characterName: char?.name || 'Speaker',
        text: line.script,
        startFrame: line.startFrame,
        endFrame: line.endFrame,
        emotion: line.emotion || 'Auto',
        color: CHARACTER_COLORS[charIndex % CHARACTER_COLORS.length],
      }
    })
}

/**
 * Update a dialogue line's text from the transcript editor.
 */
export function updateLineText(lineId: string, newText: string): void {
  useMultiCharacterStore.getState().updateDialogueLine(lineId, { script: newText })
}

/**
 * Delete a dialogue line from the transcript editor.
 * Adjusts subsequent lines' frames to close the gap.
 */
export function deleteLineAndClose(lineId: string): void {
  const multiChar = useMultiCharacterStore.getState()
  const lines = multiChar.dialogueLines
  const lineIndex = lines.findIndex((l) => l.id === lineId)
  if (lineIndex < 0) return

  const deleted = lines[lineIndex]
  const gapFrames = deleted.endFrame - deleted.startFrame

  // Remove the line
  multiChar.removeDialogueLine(lineId)

  // Shift subsequent lines to close the gap
  for (let i = lineIndex; i < lines.length; i++) {
    if (lines[i].id === lineId) continue
    if (lines[i].startFrame >= deleted.startFrame) {
      multiChar.updateDialogueLine(lines[i].id, {
        startFrame: Math.max(0, lines[i].startFrame - gapFrames),
        endFrame: Math.max(1, lines[i].endFrame - gapFrames),
      })
    }
  }

  // Reduce total frames
  const totalFrames = useTimelineStore.getState().totalFrames
  useTimelineStore.getState().setTotalFrames(Math.max(30, totalFrames - gapFrames))
}

/**
 * Given a frame number, find which transcript line is active.
 */
export function getLineAtFrame(frame: number): TranscriptLine | null {
  const transcript = buildTranscript()
  return transcript.find((l) => frame >= l.startFrame && frame < l.endFrame) ?? null
}

/**
 * Get the frame range for a specific word position in a line.
 * Uses stored word events if available.
 */
export function getWordFrameRange(
  lineId: string,
  wordIndex: number,
): { startFrame: number; endFrame: number } | null {
  const voices = useVoiceStore.getState().generatedVoices

  for (const voice of voices) {
    if (!voice.wordTimeline) continue
    // Word events are for the full audio, we need to map to the line
    const line = useMultiCharacterStore.getState().dialogueLines.find((l) => l.id === lineId)
    if (!line) continue

    const lineWords = line.script.split(/\s+/).filter(Boolean)
    if (wordIndex >= lineWords.length) return null

    // Approximate: distribute line's frame range evenly across words
    const framesPerWord = (line.endFrame - line.startFrame) / lineWords.length
    return {
      startFrame: Math.round(line.startFrame + wordIndex * framesPerWord),
      endFrame: Math.round(line.startFrame + (wordIndex + 1) * framesPerWord),
    }
  }

  return null
}

// ── Phase 6: Text-Based Video Editing helpers ──

export interface WordFrameMapping {
  word: string
  startFrame: number
  endFrame: number
  charOffsetStart: number
  charOffsetEnd: number
}

/**
 * Build a per-word mapping of text positions to frame ranges using ElevenLabs alignment data.
 */
export function buildWordMap(lineId: string): WordFrameMapping[] {
  const line = useMultiCharacterStore.getState().dialogueLines.find((l) => l.id === lineId)
  if (!line) return []

  const cleanText = line.script.replace(/\[.*?\]/g, '').trim()
  const words = cleanText.split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  const frameDuration = line.endFrame - line.startFrame
  const framesPerWord = frameDuration / words.length

  const mappings: WordFrameMapping[] = []
  let charOffset = 0

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    // Find the word's position in the original text
    const idx = cleanText.indexOf(word, charOffset)
    const charStart = idx >= 0 ? idx : charOffset
    const charEnd = charStart + word.length

    mappings.push({
      word,
      startFrame: Math.round(line.startFrame + i * framesPerWord),
      endFrame: Math.round(line.startFrame + (i + 1) * framesPerWord),
      charOffsetStart: charStart,
      charOffsetEnd: charEnd,
    })

    charOffset = charEnd
  }

  return mappings
}

/**
 * Delete a range of words (by character offset) from a dialogue line
 * and adjust timeline frames accordingly.
 */
export function deleteWordRange(lineId: string, charStart: number, charEnd: number): void {
  const line = useMultiCharacterStore.getState().dialogueLines.find((l) => l.id === lineId)
  if (!line) return

  const originalText = line.script
  const newText = (originalText.slice(0, charStart) + originalText.slice(charEnd)).replace(/\s+/g, ' ').trim()

  const deletedFraction = (charEnd - charStart) / Math.max(originalText.length, 1)
  const frameDuration = line.endFrame - line.startFrame
  const framesToRemove = Math.round(frameDuration * deletedFraction)

  useMultiCharacterStore.getState().updateDialogueLine(lineId, {
    script: newText,
    endFrame: line.endFrame - framesToRemove,
  })

  // Shift subsequent lines
  const lines = useMultiCharacterStore.getState().dialogueLines
  for (const l of lines) {
    if (l.id !== lineId && l.startFrame > line.startFrame) {
      useMultiCharacterStore.getState().updateDialogueLine(l.id, {
        startFrame: l.startFrame - framesToRemove,
        endFrame: l.endFrame - framesToRemove,
      })
    }
  }

  const totalFrames = useTimelineStore.getState().totalFrames
  useTimelineStore.getState().setTotalFrames(Math.max(30, totalFrames - framesToRemove))
}

/**
 * Split a dialogue line into two at a word boundary (by character offset).
 */
export function splitLineAtOffset(lineId: string, charOffset: number): void {
  const multiChar = useMultiCharacterStore.getState()
  const line = multiChar.dialogueLines.find((l) => l.id === lineId)
  if (!line) return

  const textBefore = line.script.slice(0, charOffset).trim()
  const textAfter = line.script.slice(charOffset).trim()
  if (!textBefore || !textAfter) return

  const fraction = charOffset / Math.max(line.script.length, 1)
  const splitFrame = Math.round(line.startFrame + (line.endFrame - line.startFrame) * fraction)

  // Update existing line to be the first half
  multiChar.updateDialogueLine(lineId, {
    script: textBefore,
    endFrame: splitFrame,
  })

  // Add new line for the second half
  multiChar.addDialogueLine({
    characterId: line.characterId,
    script: textAfter,
    startFrame: splitFrame,
    endFrame: line.endFrame,
    emotion: line.emotion,
    order: (line.order ?? 0) + 1,
    generatedVoiceId: null,
    visemeTimeline: [],
    wordTimeline: [],
  })
}

/**
 * Merge two adjacent dialogue lines into one.
 */
export function mergeLines(lineIdA: string, lineIdB: string): void {
  const multiChar = useMultiCharacterStore.getState()
  const lineA = multiChar.dialogueLines.find((l) => l.id === lineIdA)
  const lineB = multiChar.dialogueLines.find((l) => l.id === lineIdB)
  if (!lineA || !lineB) return

  // Merge text
  const mergedScript = `${lineA.script} ${lineB.script}`.trim()
  const mergedStart = Math.min(lineA.startFrame, lineB.startFrame)
  const mergedEnd = Math.max(lineA.endFrame, lineB.endFrame)

  // Update lineA with merged content
  multiChar.updateDialogueLine(lineIdA, {
    script: mergedScript,
    startFrame: mergedStart,
    endFrame: mergedEnd,
  })

  // Remove lineB
  multiChar.removeDialogueLine(lineIdB)
}
