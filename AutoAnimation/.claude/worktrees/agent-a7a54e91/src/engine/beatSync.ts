/**
 * Beat sync system — analyze audio and generate animation keyframes
 * synchronized to beats.
 *
 * Provides:
 * - Beat detection from audio data (onset detection via energy analysis)
 * - Beat-to-keyframe mapping for various effects
 * - Subdivision and offset controls
 * - Musical timing utilities
 */

import type { CanvasObjectRef, EasingType, BeatSyncEffect } from '@/types/keyframes'

// ── Types ─────────────────────────────────────────────────────────────

export interface Beat {
  /** Time in seconds */
  time: number
  /** Strength 0..1 */
  strength: number
  /** Whether this is a downbeat (strong beat) */
  isDownbeat: boolean
}

export interface BeatSyncConfig {
  /** Effect to apply on beats */
  effect: BeatSyncEffect
  /** Beat subdivision: 1 = every beat, 2 = every other, 4 = every 4th */
  subdivision: 1 | 2 | 4
  /** Time offset in seconds */
  offset: number
  /** Effect intensity 0..1 */
  intensity: number
}

export interface BeatKeyframe {
  objectRef: CanvasObjectRef
  property: string
  frame: number
  value: number
  easing: EasingType
  tag: string
}

// ── Beat Detection ────────────────────────────────────────────────────

/**
 * Simple beat detection from an AudioBuffer.
 *
 * Uses energy-based onset detection: compares short-term energy
 * to a running average to find significant increases (beats).
 */
export function detectBeats(
  audioBuffer: AudioBuffer,
  options?: {
    sensitivity?: number  // 0..1, default 0.5
    minInterval?: number  // minimum seconds between beats, default 0.2
  },
): Beat[] {
  const sensitivity = options?.sensitivity ?? 0.5
  const minInterval = options?.minInterval ?? 0.2
  const sampleRate = audioBuffer.sampleRate
  const data = audioBuffer.getChannelData(0)

  // Analysis window sizes
  const windowSize = Math.round(sampleRate * 0.02) // 20ms windows
  const avgWindowCount = 43 // ~860ms of history for running average
  const threshold = 1.3 + (1 - sensitivity) * 0.7 // higher threshold = less sensitive

  const energies: number[] = []
  for (let i = 0; i < data.length; i += windowSize) {
    let energy = 0
    const end = Math.min(i + windowSize, data.length)
    for (let j = i; j < end; j++) {
      energy += data[j] * data[j]
    }
    energies.push(energy / windowSize)
  }

  const beats: Beat[] = []
  let lastBeatTime = -Infinity

  for (let i = avgWindowCount; i < energies.length; i++) {
    // Running average of recent energy
    let avgEnergy = 0
    for (let j = i - avgWindowCount; j < i; j++) {
      avgEnergy += energies[j]
    }
    avgEnergy /= avgWindowCount

    const time = (i * windowSize) / sampleRate
    const currentEnergy = energies[i]

    // Beat detected when current energy exceeds threshold * average
    if (currentEnergy > threshold * avgEnergy && time - lastBeatTime >= minInterval) {
      const strength = Math.min(1, currentEnergy / (avgEnergy * threshold * 2))
      beats.push({
        time,
        strength,
        isDownbeat: false,
      })
      lastBeatTime = time
    }
  }

  // Mark downbeats (every 4th beat, estimated)
  if (beats.length >= 4) {
    const avgInterval = (beats[beats.length - 1].time - beats[0].time) / (beats.length - 1)
    const beatsPerMeasure = 4
    for (let i = 0; i < beats.length; i++) {
      // Use first beat as reference for measure alignment
      const measurePosition = Math.round((beats[i].time - beats[0].time) / avgInterval) % beatsPerMeasure
      beats[i].isDownbeat = measurePosition === 0
    }
  }

  return beats
}

/**
 * Estimate BPM from detected beats.
 */
export function estimateBPM(beats: Beat[]): number {
  if (beats.length < 2) return 120 // default

  const intervals: number[] = []
  for (let i = 1; i < beats.length; i++) {
    intervals.push(beats[i].time - beats[i - 1].time)
  }

  // Use median interval (more robust than mean)
  intervals.sort((a, b) => a - b)
  const medianInterval = intervals[Math.floor(intervals.length / 2)]

  const bpm = 60 / medianInterval
  // Clamp to reasonable range and round
  return Math.round(Math.max(60, Math.min(200, bpm)))
}

/**
 * Generate beats from a known BPM (when beat detection isn't available).
 */
export function generateBeatsFromBPM(
  bpm: number,
  durationSeconds: number,
  offset = 0,
): Beat[] {
  const interval = 60 / bpm
  const beats: Beat[] = []
  let beatIndex = 0

  for (let time = offset; time < durationSeconds; time += interval) {
    beats.push({
      time,
      strength: beatIndex % 4 === 0 ? 1 : 0.6,
      isDownbeat: beatIndex % 4 === 0,
    })
    beatIndex++
  }

  return beats
}

// ── Beat-to-Keyframe Mapping ──────────────────────────────────────────

/**
 * Generate keyframes from beats for a specific effect.
 */
export function generateBeatKeyframes(
  beats: Beat[],
  objectRef: CanvasObjectRef,
  config: BeatSyncConfig,
  fps: number,
): BeatKeyframe[] {
  const { effect, subdivision, offset, intensity } = config
  const tag = `beat-sync-${effect}`

  // Filter beats by subdivision
  const filteredBeats = beats.filter((_, i) => i % subdivision === 0)

  const keyframes: BeatKeyframe[] = []

  for (const beat of filteredBeats) {
    const beatTime = beat.time + offset
    if (beatTime < 0) continue

    const beatFrame = Math.round(beatTime * fps)
    const beatStrength = beat.strength * intensity

    const effectKfs = generateEffectKeyframes(
      effect,
      objectRef,
      beatFrame,
      beatStrength,
      fps,
      tag,
    )

    keyframes.push(...effectKfs)
  }

  return keyframes
}

/**
 * Generate keyframes for a single beat event.
 */
function generateEffectKeyframes(
  effect: BeatSyncEffect,
  objectRef: CanvasObjectRef,
  beatFrame: number,
  strength: number,
  fps: number,
  tag: string,
): BeatKeyframe[] {
  const holdFrames = Math.max(1, Math.round(fps * 0.05))
  const returnFrames = Math.round(fps * 0.2)

  switch (effect) {
    case 'scale-pulse': {
      const pulseAmount = 1 + 0.15 * strength
      return [
        { objectRef, property: 'scale', frame: beatFrame, value: pulseAmount, easing: 'ease-out', tag },
        { objectRef, property: 'scale', frame: beatFrame + holdFrames + returnFrames, value: 1, easing: 'ease-in-out', tag },
      ]
    }
    case 'opacity-flash': {
      const flashMin = Math.max(0.3, 1 - 0.5 * strength)
      return [
        { objectRef, property: 'opacity', frame: beatFrame, value: flashMin, easing: 'ease-out', tag },
        { objectRef, property: 'opacity', frame: beatFrame + holdFrames + returnFrames, value: 1, easing: 'ease-in-out', tag },
      ]
    }
    case 'bounce': {
      const bounceY = -15 * strength
      return [
        { objectRef, property: 'freeY', frame: beatFrame, value: bounceY, easing: 'ease-out', tag },
        { objectRef, property: 'freeY', frame: beatFrame + holdFrames + returnFrames, value: 0, easing: 'ease-in-out', tag },
      ]
    }
    default:
      return []
  }
}

// ── Musical Time Utilities ────────────────────────────────────────────

/**
 * Convert musical time notation to frames.
 *
 * @param beats - Number of beats (1 = quarter note at given BPM)
 * @param bpm - Tempo
 * @param fps - Frame rate
 * @returns Number of frames
 */
export function beatsToFrames(beats: number, bpm: number, fps: number): number {
  return Math.round((beats * 60 * fps) / bpm)
}

/**
 * Snap a frame to the nearest beat.
 */
export function snapToBeat(frame: number, bpm: number, fps: number, offset = 0): number {
  const beatInterval = (60 * fps) / bpm
  const offsetFrames = offset * fps
  const beatIndex = Math.round((frame - offsetFrames) / beatInterval)
  return Math.round(beatIndex * beatInterval + offsetFrames)
}

/**
 * Get all beat frames within a range.
 */
export function getBeatFramesInRange(
  startFrame: number,
  endFrame: number,
  bpm: number,
  fps: number,
  subdivision: 1 | 2 | 4 = 1,
  offset = 0,
): number[] {
  const beatInterval = (60 * fps) / (bpm * subdivision)
  const offsetFrames = offset * fps
  const frames: number[] = []

  const firstBeat = Math.ceil((startFrame - offsetFrames) / beatInterval) * beatInterval + offsetFrames
  for (let f = firstBeat; f <= endFrame; f += beatInterval) {
    frames.push(Math.round(f))
  }

  return frames
}
