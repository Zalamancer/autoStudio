/**
 * useOverlappingVisemes -- returns the active VisemeEvent for a specific character
 * from potentially overlapping dialogue lines at the current frame.
 *
 * When a character has two active lines at the same frame (rare edge case:
 * finishing one sentence while starting another), the later-starting line
 * takes priority for viseme rendering.
 */

import type { VisemeEvent } from '@/types/voice'
import type { DialogueLine } from '@/stores/useMultiCharacterStore'

/**
 * Resolve the active viseme for a specific character at a given frame,
 * supporting overlapping dialogue lines.
 *
 * @param characterId - ID of the character to resolve visemes for
 * @param frame - current timeline frame
 * @param allLines - all dialogue lines (pre-filtered to active frame if desired)
 * @returns the active VisemeEvent or null if character is not speaking
 */
export function resolveCharacterVisemeAtFrame(
  characterId: string,
  frame: number,
  allLines: DialogueLine[],
): { visemeEvent: VisemeEvent | null; activeLine: DialogueLine | null } {
  // Filter to lines for this character that are active at this frame
  const charLines = allLines.filter(
    (l) => l.characterId === characterId && frame >= l.startFrame && frame < l.endFrame
  )

  if (charLines.length === 0) {
    return { visemeEvent: null, activeLine: null }
  }

  // If multiple lines overlap for the same character, use the later-starting one
  // (the newer line takes visual priority)
  const activeLine = charLines.length === 1
    ? charLines[0]
    : charLines.reduce((latest, line) =>
        line.startFrame > latest.startFrame ? line : latest
      )

  if (!activeLine.visemeTimeline || activeLine.visemeTimeline.length === 0) {
    return { visemeEvent: null, activeLine }
  }

  // Find the viseme at the relative frame position within this line
  const relativeFrame = frame - activeLine.startFrame
  const event = activeLine.visemeTimeline.find(
    (e) => relativeFrame >= e.startFrame && relativeFrame < e.endFrame
  ) || null

  return { visemeEvent: event, activeLine }
}
