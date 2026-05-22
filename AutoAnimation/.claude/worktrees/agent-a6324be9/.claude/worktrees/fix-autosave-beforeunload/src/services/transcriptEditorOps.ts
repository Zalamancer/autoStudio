/**
 * Transcript Editor Operations — High-level editing operations for text-based video editing.
 *
 * - deleteSelectedText: removes selected words and corresponding frames
 * - rearrangeParagraphs: moves a dialogue line and its frames
 * - changeCharacterForParagraph: reassigns a dialogue line to a different character
 * - regenerateVoiceForLine: flags a modified line for voice regeneration
 */

import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useVoiceStore } from '@/stores/useVoiceStore'

/**
 * Delete a range of text from a dialogue line and adjust timeline frames accordingly.
 */
export function deleteSelectedText(lineId: string, charStart: number, charEnd: number): void {
  const multiChar = useMultiCharacterStore.getState()
  const line = multiChar.dialogueLines.find((l) => l.id === lineId)
  if (!line) return

  const originalText = line.script
  const newText = originalText.slice(0, charStart) + originalText.slice(charEnd)

  // Estimate frame reduction proportional to deleted text
  const deletedFraction = (charEnd - charStart) / Math.max(originalText.length, 1)
  const frameDuration = line.endFrame - line.startFrame
  const framesToRemove = Math.round(frameDuration * deletedFraction)

  multiChar.updateDialogueLine(lineId, {
    script: newText.trim(),
    endFrame: line.endFrame - framesToRemove,
  })

  // Shift subsequent lines
  const sortedLines = multiChar.dialogueLines.slice().sort((a, b) => a.startFrame - b.startFrame)
  const lineIndex = sortedLines.findIndex((l) => l.id === lineId)
  for (let i = lineIndex + 1; i < sortedLines.length; i++) {
    const subsequent = sortedLines[i]
    multiChar.updateDialogueLine(subsequent.id, {
      startFrame: subsequent.startFrame - framesToRemove,
      endFrame: subsequent.endFrame - framesToRemove,
    })
  }

  // Reduce total duration
  const totalFrames = useTimelineStore.getState().totalFrames
  useTimelineStore.getState().setTotalFrames(Math.max(30, totalFrames - framesToRemove))
}

/**
 * Move a dialogue line from one position to another in the timeline ordering.
 */
export function rearrangeParagraphs(fromLineId: string, afterLineId: string | null): void {
  const multiChar = useMultiCharacterStore.getState()
  const lines = multiChar.dialogueLines.slice().sort((a, b) => a.startFrame - b.startFrame)

  const fromLine = lines.find((l) => l.id === fromLineId)
  if (!fromLine) return

  const fromDuration = fromLine.endFrame - fromLine.startFrame
  const otherLines = lines.filter((l) => l.id !== fromLineId)

  // Find insertion point
  let insertAfterIndex = -1
  if (afterLineId) {
    insertAfterIndex = otherLines.findIndex((l) => l.id === afterLineId)
  }

  // Rebuild frame positions
  const reordered = [
    ...otherLines.slice(0, insertAfterIndex + 1),
    fromLine,
    ...otherLines.slice(insertAfterIndex + 1),
  ]

  let currentFrame = 0
  for (const line of reordered) {
    const duration = line.endFrame - line.startFrame
    multiChar.updateDialogueLine(line.id, {
      startFrame: currentFrame,
      endFrame: currentFrame + (line.id === fromLineId ? fromDuration : duration),
    })
    currentFrame += line.id === fromLineId ? fromDuration : duration
  }
}

/**
 * Change the character assignment for a dialogue line.
 */
export function changeCharacterForParagraph(lineId: string, newCharacterId: string): void {
  useMultiCharacterStore.getState().updateDialogueLine(lineId, {
    characterId: newCharacterId,
  })
}

/**
 * Flag a line as needing voice regeneration. Returns the line ID for UI display.
 */
export function regenerateVoiceForLine(lineId: string): void {
  const line = useMultiCharacterStore.getState().dialogueLines.find((l) => l.id === lineId)
  if (!line) return

  // Clear the generated voice reference to indicate regeneration needed
  useMultiCharacterStore.getState().updateDialogueLine(lineId, {
    generatedVoiceId: null,
  })

  // Remove the old generated voice if it exists
  const voices = useVoiceStore.getState().generatedVoices
  const voice = voices.find((v) => v.id === line.generatedVoiceId)
  if (voice) {
    useVoiceStore.getState().removeGeneratedVoice(voice.id)
  }
}
