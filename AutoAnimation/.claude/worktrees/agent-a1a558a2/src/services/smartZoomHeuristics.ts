/**
 * Smart Zoom Heuristics — Rule-based emphasis detection for camera zoom.
 *
 * Detects sentence starts, exclamation marks, question marks, speaker changes,
 * topic transitions, and keywords to generate zoom points.
 */

import type { WhisperWord, WhisperSegment } from '@/services/whisperTranscript'
import type { ZoomPoint, SmartZoomConfig, ZoomTriggerType } from '@/types/smartZoom'

/**
 * Detect sentence start boundaries.
 */
export function detectSentenceStarts(
  segments: WhisperSegment[],
  fps: number,
): ZoomPoint[] {
  return segments.map((seg) => ({
    frame: Math.round(seg.start * fps),
    intensity: 0.5,
    type: 'sentence-start' as ZoomTriggerType,
    description: `Sentence start: "${seg.text.slice(0, 30)}..."`,
  }))
}

/**
 * Detect exclamation marks (high emphasis).
 */
export function detectExclamations(
  words: WhisperWord[],
  fps: number,
): ZoomPoint[] {
  const points: ZoomPoint[] = []
  for (const word of words) {
    if (word.word.includes('!')) {
      points.push({
        frame: Math.round(word.start * fps),
        intensity: 0.9,
        type: 'exclamation',
        description: `Exclamation: "${word.word}"`,
      })
    }
  }
  return points
}

/**
 * Detect question marks (medium emphasis).
 */
export function detectQuestions(
  words: WhisperWord[],
  fps: number,
): ZoomPoint[] {
  const points: ZoomPoint[] = []
  for (const word of words) {
    if (word.word.includes('?')) {
      points.push({
        frame: Math.round(word.start * fps),
        intensity: 0.6,
        type: 'question',
        description: `Question: "${word.word}"`,
      })
    }
  }
  return points
}

/**
 * Detect keyword emphasis.
 */
export function detectKeywords(
  words: WhisperWord[],
  keywordList: string[],
  fps: number,
): ZoomPoint[] {
  const points: ZoomPoint[] = []
  const keywords = new Set(keywordList.map((k) => k.toLowerCase()))

  for (const word of words) {
    const cleaned = word.word.toLowerCase().replace(/[.,!?;:"'()[\]{}]/g, '')
    if (keywords.has(cleaned)) {
      points.push({
        frame: Math.round(word.start * fps),
        intensity: 0.7,
        type: 'keyword',
        description: `Keyword: "${word.word}"`,
      })
    }
  }
  return points
}

/**
 * Detect topic transitions (large gaps between segments + topic change indicator).
 */
export function detectTopicTransitions(
  segments: WhisperSegment[],
  fps: number,
): ZoomPoint[] {
  const points: ZoomPoint[] = []
  const TOPIC_GAP_THRESHOLD = 2.0 // seconds

  for (let i = 1; i < segments.length; i++) {
    const gap = segments[i].start - segments[i - 1].end
    if (gap > TOPIC_GAP_THRESHOLD) {
      points.push({
        frame: Math.round(segments[i].start * fps),
        intensity: 0.6,
        type: 'topic-transition',
        description: `Topic transition (${gap.toFixed(1)}s gap)`,
      })
    }
  }
  return points
}

/**
 * Detect speaker changes.
 */
export function detectSpeakerChanges(
  segments: WhisperSegment[],
  fps: number,
): ZoomPoint[] {
  const points: ZoomPoint[] = []

  for (let i = 1; i < segments.length; i++) {
    if (
      segments[i].speaker &&
      segments[i - 1].speaker &&
      segments[i].speaker !== segments[i - 1].speaker
    ) {
      points.push({
        frame: Math.round(segments[i].start * fps),
        intensity: 0.3,
        type: 'speaker-change',
        description: `Speaker change: ${segments[i - 1].speaker} -> ${segments[i].speaker}`,
      })
    }
  }
  return points
}

/**
 * Detect all heuristic zoom points and merge/deduplicate.
 */
export function detectAllHeuristic(
  segments: WhisperSegment[],
  words: WhisperWord[],
  config: SmartZoomConfig,
  fps: number,
): ZoomPoint[] {
  let allPoints: ZoomPoint[] = []

  // Always detect sentence starts and punctuation
  if (config.includeEmphasis) {
    allPoints = allPoints.concat(detectSentenceStarts(segments, fps))
  }

  if (config.includePunctuation) {
    allPoints = allPoints.concat(detectExclamations(words, fps))
    allPoints = allPoints.concat(detectQuestions(words, fps))
  }

  if (config.includeTopicTransitions) {
    allPoints = allPoints.concat(detectTopicTransitions(segments, fps))
  }

  if (config.includeSpeakerChanges) {
    allPoints = allPoints.concat(detectSpeakerChanges(segments, fps))
  }

  // Deduplicate nearby points (within 1 second / fps frames)
  allPoints = deduplicatePoints(allPoints, fps)

  // Cap at max 1 zoom per 2 seconds
  allPoints = enforceMinSpacing(allPoints, fps * 2)

  // Filter by frequency setting
  allPoints = filterByFrequency(allPoints, config.frequency)

  return allPoints
}

/**
 * Deduplicate zoom points within 1 second of each other.
 * Keeps the higher-intensity point.
 */
function deduplicatePoints(points: ZoomPoint[], fps: number): ZoomPoint[] {
  if (points.length === 0) return []

  const sorted = [...points].sort((a, b) => a.frame - b.frame)
  const result: ZoomPoint[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const last = result[result.length - 1]
    if (sorted[i].frame - last.frame < fps) {
      // Within 1 second — keep the higher intensity one
      if (sorted[i].intensity > last.intensity) {
        result[result.length - 1] = sorted[i]
      }
    } else {
      result.push(sorted[i])
    }
  }

  return result
}

/**
 * Enforce minimum spacing between zoom points.
 */
function enforceMinSpacing(points: ZoomPoint[], minFrameGap: number): ZoomPoint[] {
  if (points.length === 0) return []

  const sorted = [...points].sort((a, b) => b.intensity - a.intensity) // Sort by intensity (highest first)
  const kept: ZoomPoint[] = []

  for (const point of sorted) {
    const tooClose = kept.some((k) => Math.abs(k.frame - point.frame) < minFrameGap)
    if (!tooClose) {
      kept.push(point)
    }
  }

  return kept.sort((a, b) => a.frame - b.frame)
}

/**
 * Filter points by frequency setting.
 */
function filterByFrequency(
  points: ZoomPoint[],
  frequency: 'conservative' | 'moderate' | 'aggressive',
): ZoomPoint[] {
  const percentages: Record<string, number> = {
    conservative: 0.2,
    moderate: 0.5,
    aggressive: 0.8,
  }

  const keepRatio = percentages[frequency] || 0.5

  // Sort by intensity (highest first) and keep top N%
  const sorted = [...points].sort((a, b) => b.intensity - a.intensity)
  const keepCount = Math.max(1, Math.ceil(sorted.length * keepRatio))
  const kept = sorted.slice(0, keepCount)

  // Re-sort by frame for chronological order
  return kept.sort((a, b) => a.frame - b.frame)
}
