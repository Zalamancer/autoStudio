/**
 * Beat Sync Service — Align visual elements to detected beat timestamps.
 * Creates bounce/pulse keyframes on text, shapes, and media at beat positions.
 */

import type { BeatAnalysis } from './beatDetection'
import type { KeyframableObjectType, EasingType, BeatSyncEffect } from '@/types/keyframes'
import type { ClipSourceType } from '@/types/unifiedTimeline'

export interface BeatSyncOptions {
  /** Snap text overlay start/end frames to nearest beats */
  snapText: boolean
  /** Snap shape start/end frames to nearest beats */
  snapShapes: boolean
  /** Add scale pulse keyframes on beats */
  addPulseKeyframes: boolean
  /** Pulse intensity (0-1, default 0.3) */
  pulseIntensity: number
  /** Pulse duration in frames */
  pulseDurationFrames: number
}

export interface BeatKeyframe {
  frame: number
  scaleX: number
  scaleY: number
  opacity: number
}

const DEFAULT_OPTIONS: BeatSyncOptions = {
  snapText: true,
  snapShapes: true,
  addPulseKeyframes: true,
  pulseIntensity: 0.05,
  pulseDurationFrames: 4,
}

/**
 * Snap a frame number to the nearest beat frame.
 */
export function snapToNearestBeat(
  frame: number,
  beatFrames: number[],
  maxDistance: number = 10,
): number {
  let nearest = frame
  let minDist = Infinity
  for (const bf of beatFrames) {
    const dist = Math.abs(frame - bf)
    if (dist < minDist && dist <= maxDistance) {
      minDist = dist
      nearest = bf
    }
  }
  return nearest
}

/**
 * Generate pulse keyframes at each beat position for a given object.
 */
export function generatePulseKeyframes(
  beatFrames: number[],
  objectStartFrame: number,
  objectEndFrame: number,
  options: Partial<BeatSyncOptions> = {},
): BeatKeyframe[] {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const keyframes: BeatKeyframe[] = []

  for (const beatFrame of beatFrames) {
    if (beatFrame < objectStartFrame || beatFrame > objectEndFrame) continue

    // Pre-beat (normal)
    keyframes.push({
      frame: beatFrame,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
    })

    // Peak (slightly scaled up)
    const peakFrame = beatFrame + 1
    if (peakFrame <= objectEndFrame) {
      keyframes.push({
        frame: peakFrame,
        scaleX: 1 + opts.pulseIntensity,
        scaleY: 1 + opts.pulseIntensity,
        opacity: 1,
      })
    }

    // Return to normal
    const returnFrame = beatFrame + opts.pulseDurationFrames
    if (returnFrame <= objectEndFrame) {
      keyframes.push({
        frame: returnFrame,
        scaleX: 1,
        scaleY: 1,
        opacity: 1,
      })
    }
  }

  return keyframes
}

/**
 * Convert beat analysis timestamps to frame numbers.
 */
export function beatsToFrames(
  analysis: BeatAnalysis,
  fps: number,
): number[] {
  return analysis.beats.map((t) => Math.round(t * fps))
}

/**
 * Apply beat sync to current composition stores.
 * This is the main entry point called from the BeatSyncPanel.
 */
export async function applyBeatSync(
  analysis: BeatAnalysis,
  fps: number,
  options: Partial<BeatSyncOptions> = {},
): Promise<{ snappedItems: number; keyframesAdded: number }> {
  const opts = { ...DEFAULT_OPTIONS, ...options }
  const beatFrames = beatsToFrames(analysis, fps)
  let snappedItems = 0
  let keyframesAdded = 0

  // Snap text overlays
  if (opts.snapText) {
    const { useTextOverlayStore } = await import('@/stores/useTextOverlayStore')
    const store = useTextOverlayStore.getState()
    for (const overlay of store.overlays) {
      const newStart = snapToNearestBeat(overlay.startFrame ?? 0, beatFrames)
      const newEnd = snapToNearestBeat(overlay.endFrame ?? 0, beatFrames)
      if (newStart !== (overlay.startFrame ?? 0) || newEnd !== (overlay.endFrame ?? 0)) {
        store.updateOverlay(overlay.id, {
          startFrame: newStart,
          endFrame: newEnd,
        })
        snappedItems++
      }
    }
  }

  // Snap shapes
  if (opts.snapShapes) {
    const { useShapeStore } = await import('@/stores/useShapeStore')
    const store = useShapeStore.getState()
    for (const shape of store.shapes) {
      const newStart = snapToNearestBeat(shape.startFrame, beatFrames)
      const newEnd = snapToNearestBeat(shape.endFrame, beatFrames)
      if (newStart !== shape.startFrame || newEnd !== shape.endFrame) {
        store.updateShape(shape.id, {
          startFrame: newStart,
          endFrame: newEnd,
        })
        snappedItems++
      }
    }
  }

  // Add pulse keyframes
  if (opts.addPulseKeyframes) {
    const { useKeyframeStore } = await import('@/stores/useKeyframeStore')
    const kfStore = useKeyframeStore.getState()

    // Add pulse keyframes to text overlays
    const { useTextOverlayStore } = await import('@/stores/useTextOverlayStore')
    for (const overlay of useTextOverlayStore.getState().overlays) {
      const pulses = generatePulseKeyframes(
        beatFrames,
        overlay.startFrame ?? 0,
        overlay.endFrame ?? 0,
        opts,
      )
      for (const pulse of pulses) {
        const ref = { objectType: 'text' as const, objectId: overlay.id }
        kfStore.setKeyframe(ref, 'scaleX', pulse.frame, pulse.scaleX)
        kfStore.setKeyframe(ref, 'scaleY', pulse.frame, pulse.scaleY)
        keyframesAdded += 2
      }
    }
  }

  return { snappedItems, keyframesAdded }
}

// ---------------------------------------------------------------------------
// Snap All to Beats
// ---------------------------------------------------------------------------

/**
 * Snap all text overlay and shape start/end frames to nearest beats in a single pass.
 * Uses existing stores for text overlays and shapes.
 */
export async function snapAllToBeats(
  beatFrames: number[],
  maxDistance: number = 10,
): Promise<number> {
  let snappedCount = 0

  // Snap text overlays
  const { useTextOverlayStore } = await import('@/stores/useTextOverlayStore')
  const textStore = useTextOverlayStore.getState()
  for (const overlay of textStore.overlays) {
    const newStart = snapToNearestBeat(overlay.startFrame ?? 0, beatFrames, maxDistance)
    const newEnd = snapToNearestBeat(overlay.endFrame ?? 0, beatFrames, maxDistance)
    if (newStart !== (overlay.startFrame ?? 0) || newEnd !== (overlay.endFrame ?? 0)) {
      textStore.updateOverlay(overlay.id, { startFrame: newStart, endFrame: newEnd })
      snappedCount++
    }
  }

  // Snap shapes
  const { useShapeStore } = await import('@/stores/useShapeStore')
  const shapeStore = useShapeStore.getState()
  for (const shape of shapeStore.shapes) {
    const newStart = snapToNearestBeat(shape.startFrame, beatFrames, maxDistance)
    const newEnd = snapToNearestBeat(shape.endFrame, beatFrames, maxDistance)
    if (newStart !== shape.startFrame || newEnd !== shape.endFrame) {
      shapeStore.updateShape(shape.id, { startFrame: newStart, endFrame: newEnd })
      snappedCount++
    }
  }

  return snappedCount
}

// ---------------------------------------------------------------------------
// Per-object beat sync
// ---------------------------------------------------------------------------

export interface ObjectBeatKeyframe {
  property: string
  frame: number
  value: number
  easing: EasingType
}

/**
 * Map ClipSourceType → KeyframableObjectType (null for non-keyframable types).
 */
export function clipSourceToKeyframableType(
  sourceType: ClipSourceType,
): KeyframableObjectType | null {
  const map: Partial<Record<ClipSourceType, KeyframableObjectType>> = {
    text: 'text',
    media: 'media',
    lottie: 'lottie',
    shape: 'shape',
    character3d: 'character3d',
    video: 'video',
  }
  return map[sourceType] ?? null
}

/**
 * Return only beats at the given subdivision and offset.
 * subdivision=1 → every beat, subdivision=2 → every other, subdivision=4 → every 4th.
 * offset selects which phase (0 to subdivision-1).
 */
export function filterBeatsBySubdivision(
  beatFrames: number[],
  subdivision: 1 | 2 | 4,
  offset: number,
): number[] {
  if (subdivision === 1) return beatFrames
  return beatFrames.filter((_, i) => i % subdivision === offset)
}

/**
 * Map effect + objectType → property names to keyframe.
 * Uses properties that exist in ANIMATABLE_PROPERTIES for each type.
 */
export function getEffectProperties(
  objectType: KeyframableObjectType,
  effect: BeatSyncEffect,
): string[] {
  switch (effect) {
    case 'scale-pulse':
      // text has fontSize, shapes have width/height, everything else has scale
      if (objectType === 'text') return ['fontSize']
      if (objectType === 'shape') return ['width', 'height']
      return ['scale']
    case 'opacity-flash':
      return ['opacity']
    case 'bounce':
      if (objectType === 'text') return ['freeY']
      if (objectType === 'shape') return ['y']
      return ['position.y']
    default:
      return ['scale']
  }
}

/**
 * Compute base and peak values for a beat effect.
 * baseValue is read from the actual object so the pulse is relative.
 */
function getEffectValues(
  effect: BeatSyncEffect,
  _property: string,
  intensity: number,
  baseValue: number,
): { base: number; peak: number } {
  switch (effect) {
    case 'scale-pulse': {
      // Multiplicative pulse: scale up by a fraction of the base
      const delta = baseValue * intensity * 0.3
      return { base: baseValue, peak: baseValue + delta }
    }
    case 'opacity-flash':
      return { base: baseValue, peak: baseValue * (1 - intensity * 0.6) }
    case 'bounce':
      return { base: baseValue, peak: baseValue - intensity * 30 }
    default:
      return { base: baseValue, peak: baseValue * (1 + intensity * 0.3) }
  }
}

/**
 * Generate keyframes for per-object beat sync.
 * Each beat produces 3 keyframes: base → peak (1 frame later) → return (~4 frames later).
 * baseValues maps property → current value so pulses are relative to the object's real state.
 */
export function generateObjectBeatKeyframes(
  beatFrames: number[],
  objectType: KeyframableObjectType,
  startFrame: number,
  endFrame: number,
  options: {
    effect: BeatSyncEffect
    subdivision: 1 | 2 | 4
    offset: number
    intensity: number
    baseValues?: Record<string, number>
  },
): ObjectBeatKeyframe[] {
  const filtered = filterBeatsBySubdivision(beatFrames, options.subdivision, options.offset)
  const properties = getEffectProperties(objectType, options.effect)
  const keyframes: ObjectBeatKeyframe[] = []
  const returnDuration = 4

  // Default base values per property when not provided
  const defaultBase: Record<string, number> = {
    scale: 1, opacity: 1, fontSize: 48,
    freeX: 0, freeY: 0, 'position.x': 0, 'position.y': 0,
    x: 0, y: 0, width: 100, height: 100,
  }

  for (const beat of filtered) {
    if (beat < startFrame || beat > endFrame) continue

    for (const prop of properties) {
      const baseValue = options.baseValues?.[prop] ?? defaultBase[prop] ?? 1
      const { base, peak } = getEffectValues(options.effect, prop, options.intensity, baseValue)

      // Base (at beat)
      keyframes.push({ property: prop, frame: beat, value: base, easing: 'ease-out' })

      // Peak (1 frame after)
      const peakFrame = beat + 1
      if (peakFrame <= endFrame) {
        keyframes.push({ property: prop, frame: peakFrame, value: peak, easing: 'ease-out' })
      }

      // Return to base
      const returnFrame = beat + returnDuration
      if (returnFrame <= endFrame) {
        keyframes.push({ property: prop, frame: returnFrame, value: base, easing: 'ease-in-out' })
      }
    }
  }

  return keyframes
}
