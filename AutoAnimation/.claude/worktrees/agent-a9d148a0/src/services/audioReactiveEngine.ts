/**
 * AudioReactiveEngine — Core engine for audio-reactive visuals.
 *
 * Manages audio reactive mappings and computes property values
 * from audio frequency/amplitude data.
 */

import {
  extractBandEnergy,
  type FrequencyBand,
} from './frequencyBands'
import type { FrequencyBandData } from './beatDetection'

// ── Types ──────────────────────────────────────────────────────────

export interface AudioReactiveMapping {
  id: string
  audioSource: 'music' | 'dialogue' | 'sfx'
  frequencyBand: FrequencyBand
  targetObjectRef: { objectType: string; objectId: string }
  targetProperty: string
  sensitivity: number   // 0-1
  smoothing: number     // 0-200 ms
  minValue: number
  maxValue: number
  invert: boolean
}

// ── Engine Class ──────────────────────────────────────────────────

export class AudioReactiveEngine {
  private mappings: AudioReactiveMapping[] = []
  private smoothedValues: Map<string, number> = new Map()
  private preBakedData: FrequencyBandData | null = null
  private preBakedFps: number = 30
  /** Cached result from the last getValuesFromRealtime() call */
  private _lastRealtimeValues: Map<string, Map<string, number>> = new Map()

  /**
   * Add or update a mapping.
   */
  addMapping(mapping: AudioReactiveMapping): void {
    const existing = this.mappings.findIndex((m) => m.id === mapping.id)
    if (existing >= 0) {
      this.mappings[existing] = mapping
    } else {
      this.mappings.push(mapping)
    }
  }

  /**
   * Remove a mapping by ID.
   */
  removeMapping(id: string): void {
    this.mappings = this.mappings.filter((m) => m.id !== id)
    this.smoothedValues.delete(id)
  }

  /**
   * Get all current mappings.
   */
  getMappings(): AudioReactiveMapping[] {
    return [...this.mappings]
  }

  /**
   * Set pre-baked frequency band data for offline/export rendering.
   */
  setPreBakedData(data: FrequencyBandData, fps: number): void {
    this.preBakedData = data
    this.preBakedFps = fps
  }

  /**
   * Clear pre-baked data.
   */
  clearPreBakedData(): void {
    this.preBakedData = null
  }

  /**
   * Get reactive values from real-time frequency data.
   *
   * Returns a nested map: objectRef key -> property -> additive value
   */
  getValuesFromRealtime(
    frequencyData: Uint8Array,
    sampleRate: number,
    fftSize: number,
    fps: number,
  ): Map<string, Map<string, number>> {
    const result = new Map<string, Map<string, number>>()

    for (const mapping of this.mappings) {
      const rawEnergy = extractBandEnergy(frequencyData, mapping.frequencyBand, sampleRate, fftSize)
      const value = this.processMapping(mapping, rawEnergy, fps)

      const objKey = `${mapping.targetObjectRef.objectType}:${mapping.targetObjectRef.objectId}`
      if (!result.has(objKey)) {
        result.set(objKey, new Map())
      }
      result.get(objKey)!.set(mapping.targetProperty, value)
    }

    this._lastRealtimeValues = result
    return result
  }

  /**
   * Return the values from the most recent getValuesFromRealtime() call
   * without requiring new frequency data. This allows separate consumers
   * (e.g. the canvas preview loop) to read values computed by the audio
   * analysis loop on the same frame.
   */
  getLastRealtimeValues(): Map<string, Map<string, number>> {
    return this._lastRealtimeValues
  }

  /**
   * Get reactive values from pre-baked data at a specific frame.
   *
   * Returns a nested map: objectRef key -> property -> additive value
   */
  getValuesAtFrame(frame: number): Map<string, Map<string, number>> {
    const result = new Map<string, Map<string, number>>()

    if (!this.preBakedData) return result

    for (const mapping of this.mappings) {
      const bandData = this.preBakedData[mapping.frequencyBand]
      if (!bandData) continue

      const frameIndex = Math.min(frame, bandData.length - 1)
      const rawEnergy = bandData[Math.max(0, frameIndex)] ?? 0
      const value = this.processMapping(mapping, rawEnergy, this.preBakedFps)

      const objKey = `${mapping.targetObjectRef.objectType}:${mapping.targetObjectRef.objectId}`
      if (!result.has(objKey)) {
        result.set(objKey, new Map())
      }
      result.get(objKey)!.set(mapping.targetProperty, value)
    }

    return result
  }

  /**
   * Process a single mapping: apply sensitivity, smoothing, range mapping, and invert.
   */
  private processMapping(mapping: AudioReactiveMapping, rawEnergy: number, fps: number): number {
    // Apply sensitivity
    const scaled = rawEnergy * mapping.sensitivity

    // Apply smoothing (exponential moving average)
    const prevSmoothed = this.smoothedValues.get(mapping.id) ?? scaled
    const smoothingMs = mapping.smoothing
    const alpha = smoothingMs > 0
      ? Math.exp(-1 / (smoothingMs * fps / 1000))
      : 0
    const smoothed = prevSmoothed * alpha + scaled * (1 - alpha)
    this.smoothedValues.set(mapping.id, smoothed)

    // Clamp to 0-1
    const clamped = Math.max(0, Math.min(1, smoothed))

    // Invert if needed
    const directed = mapping.invert ? 1 - clamped : clamped

    // Map to output range
    const range = mapping.maxValue - mapping.minValue
    return mapping.minValue + directed * range
  }

  /**
   * Reset all smoothed values (useful when seeking or re-baking).
   */
  resetSmoothing(): void {
    this.smoothedValues.clear()
  }
}

// ── Singleton ──────────────────────────────────────────────────────

let engineInstance: AudioReactiveEngine | null = null

export function getAudioReactiveEngine(): AudioReactiveEngine {
  if (!engineInstance) {
    engineInstance = new AudioReactiveEngine()
  }
  return engineInstance
}
