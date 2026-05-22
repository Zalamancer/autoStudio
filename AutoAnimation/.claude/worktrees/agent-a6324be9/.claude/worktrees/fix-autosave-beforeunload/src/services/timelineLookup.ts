/**
 * Shared timeline lookup utilities with binary search + sequential hint caching.
 * Replaces duplicate getVisemeAtFrame/getEmotionAtFrame implementations across
 * canvas2dRenderer.ts, pixiExportRenderer.ts, RemotionCharacter.tsx, and Remotion3DCharacter.tsx.
 */

import type { Viseme, VisemeEvent } from '@/types/voice'
import type { EmotionEvent } from '@/services/emotionTimeline'

/**
 * Binary search for the event at a given frame in a sorted timeline.
 * Uses a hint index for O(1) sequential access (common in frame-by-frame playback).
 * Returns the index, or -1 if not found.
 */
export function binarySearchTimeline<T extends { startFrame: number; endFrame: number }>(
  timeline: T[],
  frame: number,
  hint: number = 0,
): number {
  const len = timeline.length
  if (len === 0) return -1

  // Fast path: check hint index (sequential frames hit the same or next event)
  if (hint >= 0 && hint < len) {
    const e = timeline[hint]
    if (frame >= e.startFrame && frame < e.endFrame) return hint
    // Check next
    if (hint + 1 < len) {
      const next = timeline[hint + 1]
      if (frame >= next.startFrame && frame < next.endFrame) return hint + 1
    }
  }

  // Binary search
  let lo = 0
  let hi = len - 1
  while (lo <= hi) {
    const mid = (lo + hi) >>> 1
    const e = timeline[mid]
    if (frame < e.startFrame) {
      hi = mid - 1
    } else if (frame >= e.endFrame) {
      lo = mid + 1
    } else {
      return mid
    }
  }
  return -1
}

/**
 * Stateful timeline lookup with sequential hint caching.
 * Create one instance per rendering context (e.g., per export run, per component).
 */
export class TimelineLookupCache {
  private visemeHint = 0
  private emotionHint = 0

  reset() {
    this.visemeHint = 0
    this.emotionHint = 0
  }

  getVisemeAtFrame(timeline: VisemeEvent[], frame: number): Viseme {
    const idx = binarySearchTimeline(timeline, frame, this.visemeHint)
    if (idx >= 0) {
      this.visemeHint = idx
      return (timeline[idx].viseme as Viseme) || 'Rest'
    }
    return 'Rest'
  }

  getEmotionAtFrame(timeline: EmotionEvent[], frame: number): string {
    const idx = binarySearchTimeline(timeline, frame, this.emotionHint)
    if (idx >= 0) {
      this.emotionHint = idx
      return timeline[idx].emotion || 'Neutral'
    }
    return 'Neutral'
  }
}

/**
 * Simple stateless lookup (O(n)) for small timelines or one-shot use.
 * For repeated frame-by-frame access, prefer TimelineLookupCache.
 */
export function getVisemeAtFrame(timeline: VisemeEvent[], frame: number): Viseme {
  for (const event of timeline) {
    if (frame >= event.startFrame && frame < event.endFrame) return event.viseme
  }
  return 'Rest'
}

export function getEmotionAtFrame(timeline: EmotionEvent[], frame: number): string {
  for (const event of timeline) {
    if (frame >= event.startFrame && frame < event.endFrame) return event.emotion
  }
  return 'Neutral'
}
