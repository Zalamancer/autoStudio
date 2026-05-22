/**
 * Overlap Mixer -- computes per-line volume ducking for overlapping dialogue.
 *
 * Priority rules:
 * 1. The line that started first is "primary" (full volume).
 * 2. Subsequent overlapping lines are "secondary" (-6dB).
 * 3. If both started at the same frame, the character with higher z-index is primary.
 */

import type { DialogueLine } from '@/stores/useMultiCharacterStore'

/** Secondary speaker ducking in dB (configurable, default -6) */
const SECONDARY_DUCK_DB = -6
const SECONDARY_VOLUME_MULT = Math.pow(10, SECONDARY_DUCK_DB / 20) // ~0.5

/**
 * Given a set of dialogue lines and a frame, returns a Map of lineId -> volumeMultiplier.
 * Lines that are not active at the given frame are not included in the map.
 *
 * @param activeLines - dialogue lines active at the current frame
 * @param characterZIndices - optional map of characterId -> zIndex for tie-breaking
 * @returns Map<lineId, volumeMultiplier> where 1.0 = full volume, ~0.5 = ducked
 */
export function computeOverlapDucking(
  activeLines: DialogueLine[],
  characterZIndices?: Map<string, number>,
): Map<string, number> {
  const result = new Map<string, number>()

  if (activeLines.length === 0) return result

  if (activeLines.length === 1) {
    result.set(activeLines[0].id, 1.0)
    return result
  }

  // Sort by startFrame (ascending). Earlier start = primary.
  // Tie-break: higher z-index character is primary.
  const sorted = [...activeLines].sort((a, b) => {
    if (a.startFrame !== b.startFrame) return a.startFrame - b.startFrame
    const zA = characterZIndices?.get(a.characterId) ?? 0
    const zB = characterZIndices?.get(b.characterId) ?? 0
    return zB - zA // higher z-index first
  })

  // First line is primary (full volume), rest are secondary (ducked)
  sorted.forEach((line, i) => {
    result.set(line.id, i === 0 ? 1.0 : SECONDARY_VOLUME_MULT)
  })

  return result
}
