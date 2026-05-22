/**
 * Timing intelligence for motion graphics.
 * Syncs motion element transitions to audio beats, dialogue pauses,
 * and emotional cues for natural-feeling animations.
 */

import type { WordEvent } from '@/types/voice'

// ── Types ──

export interface AudioBeat {
  /** Time in seconds */
  time: number
  /** Beat strength 0-1 */
  strength: number
  /** Whether this is a downbeat (start of bar) */
  isDownbeat: boolean
}

export interface DialoguePause {
  /** Start time in seconds */
  startTime: number
  /** End time in seconds */
  endTime: number
  /** Duration in seconds */
  duration: number
  /** Pause type */
  type: 'sentence' | 'paragraph' | 'breath' | 'dramatic'
}

export interface EmotionCue {
  /** Time in seconds */
  time: number
  /** Emotion name */
  emotion: string
  /** Intensity 0-1 */
  intensity: number
}

export interface TimingWindow {
  /** Safe window start (seconds) */
  start: number
  /** Safe window end (seconds) */
  end: number
  /** How good this window is for transitions (0-1) */
  score: number
  /** What triggered this window */
  reason: 'pause' | 'beat' | 'sentence-end' | 'emotion-change' | 'silence'
}

// ── Dialogue analysis ──

/**
 * Extract pauses from word events (ElevenLabs alignment data).
 * A pause is any gap between words longer than the threshold.
 */
export function extractPauses(
  wordEvents: WordEvent[],
  minPauseSec = 0.3,
): DialoguePause[] {
  if (wordEvents.length < 2) return []

  const pauses: DialoguePause[] = []

  for (let i = 0; i < wordEvents.length - 1; i++) {
    const currentEnd = wordEvents[i].endTime
    const nextStart = wordEvents[i + 1].startTime
    const gap = nextStart - currentEnd

    if (gap >= minPauseSec) {
      // Classify pause type
      let type: DialoguePause['type'] = 'breath'
      const prevWord = wordEvents[i].word.trim()
      if (prevWord.endsWith('.') || prevWord.endsWith('!') || prevWord.endsWith('?')) {
        type = gap > 0.8 ? 'paragraph' : 'sentence'
      } else if (gap > 1.0) {
        type = 'dramatic'
      }

      pauses.push({
        startTime: currentEnd,
        endTime: nextStart,
        duration: gap,
        type,
      })
    }
  }

  return pauses
}

/**
 * Extract emotion cues from script text with [emotion] markers.
 * E.g., "[Joy] This is amazing!" yields { time: ..., emotion: 'Joy', intensity: 0.8 }
 */
export function extractEmotionCues(
  script: string,
  wordEvents: WordEvent[],
): EmotionCue[] {
  const cues: EmotionCue[] = []
  const emotionRegex = /\[(\w+)(?::(\d+))?\]/g
  let match

  while ((match = emotionRegex.exec(script)) !== null) {
    const emotion = match[1]
    const intensityStr = match[2]
    const intensity = intensityStr ? parseInt(intensityStr) / 10 : 0.7

    // Find the position in the plain text to map to timing
    const beforeEmote = script.slice(0, match.index).replace(/\[\w+(?::\d+)?\]\s*/g, '')
    const wordCountBefore = beforeEmote.split(/\s+/).filter(Boolean).length

    // Find corresponding word event
    const targetWordIndex = Math.min(wordCountBefore, wordEvents.length - 1)
    const time = wordEvents[targetWordIndex]?.startTime ?? 0

    cues.push({ time, emotion, intensity })
  }

  return cues
}

// ── Beat detection (simplified) ──

/**
 * Simple onset detection from audio amplitude data.
 * For more accurate beat detection, use the Web Audio API.
 * This provides reasonable estimates from RMS energy analysis.
 */
export function estimateBeats(
  audioDurationSec: number,
  bpm = 120,
  startOffset = 0,
): AudioBeat[] {
  const beats: AudioBeat[] = []
  const beatInterval = 60 / bpm
  const beatsPerBar = 4

  let time = startOffset
  let beatCount = 0

  while (time < audioDurationSec) {
    const isDownbeat = beatCount % beatsPerBar === 0
    beats.push({
      time,
      strength: isDownbeat ? 1.0 : beatCount % 2 === 0 ? 0.7 : 0.4,
      isDownbeat,
    })
    time += beatInterval
    beatCount++
  }

  return beats
}

// ── Timing windows ──

/**
 * Find optimal timing windows for motion graphic transitions.
 * Combines pause, beat, and emotion data to identify natural cut/transition points.
 */
export function findTimingWindows(
  _totalDurationSec: number,
  pauses: DialoguePause[] = [],
  beats: AudioBeat[] = [],
  emotionCues: EmotionCue[] = [],
  _minWindowSec = 0.2,
): TimingWindow[] {
  const windows: TimingWindow[] = []

  // Pauses are the highest-quality transition points
  for (const pause of pauses) {
    const score =
      pause.type === 'paragraph' ? 1.0
      : pause.type === 'sentence' ? 0.85
      : pause.type === 'dramatic' ? 0.9
      : 0.6

    windows.push({
      start: pause.startTime,
      end: pause.endTime,
      score,
      reason: pause.type === 'sentence' || pause.type === 'paragraph' ? 'sentence-end' : 'pause',
    })
  }

  // Strong beats (downbeats) as secondary transition points
  for (const beat of beats) {
    if (beat.isDownbeat && beat.strength >= 0.8) {
      // Check that we don't overlap with an existing window
      const overlaps = windows.some(
        (w) => beat.time >= w.start - 0.1 && beat.time <= w.end + 0.1,
      )
      if (!overlaps) {
        windows.push({
          start: beat.time - 0.05,
          end: beat.time + 0.15,
          score: 0.5,
          reason: 'beat',
        })
      }
    }
  }

  // Emotion changes as transition opportunities
  for (let i = 0; i < emotionCues.length - 1; i++) {
    const current = emotionCues[i]
    const next = emotionCues[i + 1]
    if (current.emotion !== next.emotion) {
      const midPoint = (current.time + next.time) / 2
      windows.push({
        start: midPoint - 0.1,
        end: midPoint + 0.2,
        score: 0.7,
        reason: 'emotion-change',
      })
    }
  }

  // Sort by time and deduplicate overlapping windows
  windows.sort((a, b) => a.start - b.start)
  return mergeOverlappingWindows(windows)
}

function mergeOverlappingWindows(windows: TimingWindow[]): TimingWindow[] {
  if (windows.length < 2) return windows
  const merged: TimingWindow[] = [windows[0]]

  for (let i = 1; i < windows.length; i++) {
    const prev = merged[merged.length - 1]
    const curr = windows[i]

    if (curr.start <= prev.end + 0.1) {
      // Merge: extend end, take higher score
      prev.end = Math.max(prev.end, curr.end)
      if (curr.score > prev.score) {
        prev.score = curr.score
        prev.reason = curr.reason
      }
    } else {
      merged.push(curr)
    }
  }

  return merged
}

/**
 * Given a list of timing windows, distribute N motion graphic transitions
 * across the timeline at optimal points.
 */
export function distributeTransitions(
  windows: TimingWindow[],
  count: number,
  totalDurationSec: number,
): number[] {
  if (count <= 0) return []
  if (windows.length === 0) {
    // Fallback: evenly distribute
    return Array.from({ length: count }, (_, i) => ((i + 1) / (count + 1)) * totalDurationSec)
  }

  // Score each window by quality and temporal spacing
  const idealSpacing = totalDurationSec / (count + 1)
  const scored = windows.map((w) => ({
    window: w,
    midpoint: (w.start + w.end) / 2,
    quality: w.score,
  }))

  // Greedy selection: pick highest-quality windows with good spacing
  const selected: number[] = []
  const sortedByQuality = [...scored].sort((a, b) => b.quality - a.quality)

  for (const candidate of sortedByQuality) {
    if (selected.length >= count) break

    // Check spacing from existing selections
    const tooClose = selected.some(
      (t) => Math.abs(t - candidate.midpoint) < idealSpacing * 0.5,
    )
    if (!tooClose) {
      selected.push(candidate.midpoint)
    }
  }

  // If we don't have enough, fill with evenly spaced fallbacks
  while (selected.length < count) {
    const idealTime = ((selected.length + 1) / (count + 1)) * totalDurationSec
    selected.push(idealTime)
  }

  return selected.sort((a, b) => a - b)
}

/**
 * Convert a time in seconds to a frame-aligned time.
 */
export function snapToFrame(timeSec: number, fps: number): number {
  return Math.round(timeSec * fps) / fps
}

/**
 * Snap motion design start/end frames to the nearest timing window.
 * Helps align motion graphics with dialogue naturally.
 */
export function alignToTimingWindows(
  startFrame: number,
  endFrame: number,
  fps: number,
  windows: TimingWindow[],
  snapThresholdSec = 0.3,
): { startFrame: number; endFrame: number } {
  const startSec = startFrame / fps
  const endSec = endFrame / fps

  let bestStart = startFrame
  let bestEnd = endFrame

  // Try to align start to a nearby window start
  for (const w of windows) {
    if (Math.abs(w.start - startSec) < snapThresholdSec) {
      bestStart = Math.round(w.start * fps)
      break
    }
  }

  // Try to align end to a nearby window end
  for (const w of windows) {
    if (Math.abs(w.end - endSec) < snapThresholdSec) {
      bestEnd = Math.round(w.end * fps)
      break
    }
  }

  return { startFrame: bestStart, endFrame: Math.max(bestEnd, bestStart + 1) }
}
