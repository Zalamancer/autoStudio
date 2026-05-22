/**
 * Silence Removal Service
 *
 * Analyzes transcript word timestamps to detect silences and filler words.
 * Generates TimelineEdit[] that the timeline store can apply.
 */

import { detectSilences, detectFillers, type WhisperWord } from '@/services/whisperTranscript'
import type {
  SilenceRegion,
  FillerRegion,
  RemovalMode,
  TimelineEdit,
  AnalysisResult,
} from '@/types/silenceRemoval'

// Silence thresholds per mode (seconds)
const MODE_THRESHOLDS: Record<RemovalMode, number> = {
  natural: 1.5,
  fast: 0.8,
  'extra-fast': 0.3,
}

// Minimum gap to keep between clips after removal (seconds)
const MIN_GAP_SEC = 0.075

export class SilenceRemovalService {
  /**
   * Full analysis: detect silences and fillers, compute timeline edits.
   */
  analyzeTranscript(
    words: WhisperWord[],
    mode: RemovalMode,
    fps: number,
    customThreshold?: number,
    customFillerWords?: string[],
  ): AnalysisResult {
    const threshold = customThreshold ?? MODE_THRESHOLDS[mode]
    const silences = detectSilences(words, threshold)

    const defaultFillers = [
      'um', 'uh', 'uhm', 'uhh', 'hmm', 'hm', 'er', 'ah',
      'like', 'you know', 'basically', 'actually', 'literally',
      'sort of', 'kind of', 'i mean', 'right', 'so',
    ]
    const fillers = mode === 'extra-fast'
      ? detectFillers(words, customFillerWords ?? defaultFillers)
      : []

    const edits = this.generateEdits(silences, fillers, fps)

    const totalRemovedSec =
      silences.reduce((sum, s) => sum + Math.max(s.duration - MIN_GAP_SEC, 0), 0) +
      fillers.reduce((sum, f) => sum + (f.endTime - f.startTime), 0)

    return { silences, fillers, totalRemovedSec, edits }
  }

  /**
   * Generate preview data (same as analyze, but intended for UI highlighting).
   */
  generatePreview(
    words: WhisperWord[],
    mode: RemovalMode,
    fps: number,
    customThreshold?: number,
    customFillerWords?: string[],
  ): AnalysisResult {
    return this.analyzeTranscript(words, mode, fps, customThreshold, customFillerWords)
  }

  /**
   * Convert silence/filler regions to TimelineEdit array.
   */
  private generateEdits(
    silences: SilenceRegion[],
    fillers: FillerRegion[],
    fps: number,
  ): TimelineEdit[] {
    const edits: TimelineEdit[] = []

    for (const silence of silences) {
      // Keep a small gap for natural breathing room
      const adjustedEnd = Math.max(silence.endTime - MIN_GAP_SEC, silence.startTime + 0.01)
      edits.push({
        type: 'remove',
        startFrame: Math.round(silence.startTime * fps),
        endFrame: Math.round(adjustedEnd * fps),
        reason: `Silence (${silence.duration.toFixed(1)}s)`,
      })
    }

    for (const filler of fillers) {
      edits.push({
        type: 'remove',
        startFrame: Math.round(filler.startTime * fps),
        endFrame: Math.round(filler.endTime * fps),
        reason: `Filler: "${filler.word}"`,
      })
    }

    // Sort by start frame
    edits.sort((a, b) => a.startFrame - b.startFrame)

    // Remove overlapping edits (merge if overlapping)
    const merged: TimelineEdit[] = []
    for (const edit of edits) {
      const last = merged[merged.length - 1]
      if (last && edit.startFrame <= last.endFrame) {
        // Merge overlapping edits
        last.endFrame = Math.max(last.endFrame, edit.endFrame)
        last.reason = `${last.reason} + ${edit.reason}`
      } else {
        merged.push({ ...edit })
      }
    }

    return merged
  }
}

// Singleton
let _instance: SilenceRemovalService | null = null
export function getSilenceRemovalService(): SilenceRemovalService {
  if (!_instance) _instance = new SilenceRemovalService()
  return _instance
}
