/**
 * Procedural Animation Service
 *
 * Generates per-frame, per-part delta transforms using parametric sine/cosine
 * oscillations. Designed to add subtle life to sprite characters during
 * dialogue playback.
 */

import type {
  ProceduralPreset,
  ProceduralTransform,
  ProceduralPresetConfig,
  OscillationParams,
} from '@/types/proceduralAnimation'

// ── Preset Definitions ──────────────────────────────────────────────────

const ZERO_OSCILLATION: OscillationParams = {
  xAmplitude: 0, yAmplitude: 0, xFrequency: 0, yFrequency: 0,
  rotationAmplitude: 0, rotationFrequency: 0,
  scaleAmplitude: 0, scaleFrequency: 0,
  phaseOffset: 0,
}

export const PROCEDURAL_PRESETS: ProceduralPresetConfig[] = [
  {
    id: 'idle',
    label: 'Idle',
    description: 'Subtle breathing and gentle sway',
    body: {
      xAmplitude: 0, yAmplitude: 1.5, xFrequency: 0, yFrequency: 0.3,
      rotationAmplitude: 0.3, rotationFrequency: 0.15,
      scaleAmplitude: 0.005, scaleFrequency: 0.3,
      phaseOffset: 0,
    },
    head: {
      xAmplitude: 0.5, yAmplitude: 0.5, xFrequency: 0.2, yFrequency: 0.25,
      rotationAmplitude: 0.5, rotationFrequency: 0.18,
      scaleAmplitude: 0, scaleFrequency: 0,
      phaseOffset: 0.5,
    },
    hair: {
      xAmplitude: 0.8, yAmplitude: 0.3, xFrequency: 0.25, yFrequency: 0.2,
      rotationAmplitude: 0.8, rotationFrequency: 0.22,
      scaleAmplitude: 0, scaleFrequency: 0,
      phaseOffset: 1.2,
    },
    viseme: { ...ZERO_OSCILLATION },
  },
  {
    id: 'talking',
    label: 'Talking',
    description: 'Body lean and head nod during speech',
    body: {
      xAmplitude: 1.0, yAmplitude: 2.0, xFrequency: 0.4, yFrequency: 0.5,
      rotationAmplitude: 0.5, rotationFrequency: 0.35,
      scaleAmplitude: 0.008, scaleFrequency: 0.5,
      phaseOffset: 0,
    },
    head: {
      xAmplitude: 1.0, yAmplitude: 1.5, xFrequency: 0.6, yFrequency: 0.8,
      rotationAmplitude: 1.5, rotationFrequency: 0.7,
      scaleAmplitude: 0, scaleFrequency: 0,
      phaseOffset: 0.3,
    },
    hair: {
      xAmplitude: 1.2, yAmplitude: 0.8, xFrequency: 0.5, yFrequency: 0.45,
      rotationAmplitude: 1.0, rotationFrequency: 0.5,
      scaleAmplitude: 0, scaleFrequency: 0,
      phaseOffset: 0.8,
    },
    viseme: { ...ZERO_OSCILLATION },
  },
  {
    id: 'excited',
    label: 'Excited',
    description: 'Faster body bob with wider head tilt range',
    body: {
      xAmplitude: 1.5, yAmplitude: 3.0, xFrequency: 0.7, yFrequency: 0.9,
      rotationAmplitude: 0.8, rotationFrequency: 0.6,
      scaleAmplitude: 0.012, scaleFrequency: 0.9,
      phaseOffset: 0,
    },
    head: {
      xAmplitude: 1.5, yAmplitude: 2.0, xFrequency: 0.8, yFrequency: 1.0,
      rotationAmplitude: 2.5, rotationFrequency: 0.9,
      scaleAmplitude: 0.005, scaleFrequency: 1.0,
      phaseOffset: 0.4,
    },
    hair: {
      xAmplitude: 2.0, yAmplitude: 1.5, xFrequency: 0.9, yFrequency: 0.8,
      rotationAmplitude: 1.5, rotationFrequency: 0.7,
      scaleAmplitude: 0, scaleFrequency: 0,
      phaseOffset: 1.0,
    },
    viseme: { ...ZERO_OSCILLATION },
  },
  {
    id: 'nervous',
    label: 'Nervous',
    description: 'Small rapid jitter on all parts',
    body: {
      xAmplitude: 0.5, yAmplitude: 0.5, xFrequency: 3.0, yFrequency: 2.5,
      rotationAmplitude: 0.3, rotationFrequency: 2.0,
      scaleAmplitude: 0.003, scaleFrequency: 2.5,
      phaseOffset: 0,
    },
    head: {
      xAmplitude: 0.8, yAmplitude: 0.5, xFrequency: 3.5, yFrequency: 3.0,
      rotationAmplitude: 0.5, rotationFrequency: 2.8,
      scaleAmplitude: 0, scaleFrequency: 0,
      phaseOffset: 1.5,
    },
    hair: {
      xAmplitude: 0.3, yAmplitude: 0.3, xFrequency: 2.5, yFrequency: 2.0,
      rotationAmplitude: 0.4, rotationFrequency: 2.2,
      scaleAmplitude: 0, scaleFrequency: 0,
      phaseOffset: 2.0,
    },
    viseme: { ...ZERO_OSCILLATION },
  },
  {
    id: 'sad',
    label: 'Sad',
    description: 'Slow drooping motion with head tilted down',
    body: {
      xAmplitude: 0.3, yAmplitude: 1.0, xFrequency: 0.15, yFrequency: 0.12,
      rotationAmplitude: 0.2, rotationFrequency: 0.1,
      scaleAmplitude: 0.003, scaleFrequency: 0.15,
      phaseOffset: 0,
    },
    head: {
      xAmplitude: 0.3, yAmplitude: 1.5, xFrequency: 0.12, yFrequency: 0.1,
      rotationAmplitude: 1.5, rotationFrequency: 0.08,
      scaleAmplitude: 0, scaleFrequency: 0,
      phaseOffset: 0.8,
    },
    hair: {
      xAmplitude: 0.5, yAmplitude: 0.3, xFrequency: 0.18, yFrequency: 0.15,
      rotationAmplitude: 0.5, rotationFrequency: 0.12,
      scaleAmplitude: 0, scaleFrequency: 0,
      phaseOffset: 1.5,
    },
    viseme: { ...ZERO_OSCILLATION },
  },
  {
    id: 'dramatic',
    label: 'Dramatic',
    description: 'Exaggerated body lean with head snap movements',
    body: {
      xAmplitude: 2.5, yAmplitude: 3.5, xFrequency: 0.3, yFrequency: 0.4,
      rotationAmplitude: 1.5, rotationFrequency: 0.25,
      scaleAmplitude: 0.015, scaleFrequency: 0.4,
      phaseOffset: 0,
    },
    head: {
      xAmplitude: 2.0, yAmplitude: 2.5, xFrequency: 0.5, yFrequency: 0.6,
      rotationAmplitude: 4.0, rotationFrequency: 0.4,
      scaleAmplitude: 0.008, scaleFrequency: 0.5,
      phaseOffset: 0.2,
    },
    hair: {
      xAmplitude: 3.0, yAmplitude: 2.0, xFrequency: 0.4, yFrequency: 0.35,
      rotationAmplitude: 2.0, rotationFrequency: 0.3,
      scaleAmplitude: 0, scaleFrequency: 0,
      phaseOffset: 0.6,
    },
    viseme: { ...ZERO_OSCILLATION },
  },
]

// ── Core Function ────────────────────────────────────────────────────────

/**
 * Get procedural transform delta for a specific body part at a given frame.
 *
 * @param preset - Animation preset name
 * @param part - Body part ('body' | 'head' | 'hair' | 'viseme')
 * @param frame - Current frame number
 * @param fps - Frames per second
 * @param intensity - Overall intensity multiplier (0-1, default 1)
 * @param isSpeaking - Whether the character is currently speaking (amplifies motion)
 * @returns Delta transforms to add to the part's base transform
 */
export function getProceduralTransform(
  preset: ProceduralPreset,
  part: 'body' | 'head' | 'hair' | 'viseme',
  frame: number,
  fps: number,
  intensity: number = 1,
  isSpeaking: boolean = false,
): ProceduralTransform {
  if (preset === 'none' || intensity === 0) {
    return { dx: 0, dy: 0, dRotation: 0, dScaleX: 0, dScaleY: 0 }
  }

  const config = PROCEDURAL_PRESETS.find((p) => p.id === preset)
  if (!config) {
    return { dx: 0, dy: 0, dRotation: 0, dScaleX: 0, dScaleY: 0 }
  }

  const params = config[part]
  const t = frame / fps // time in seconds
  const phi = params.phaseOffset

  // Speaking amplifier: 30% more motion when actively speaking
  const speakMul = isSpeaking ? 1.3 : 1.0
  const mul = intensity * speakMul

  const dx = params.xAmplitude * Math.sin(2 * Math.PI * params.xFrequency * t + phi) * mul
  const dy = params.yAmplitude * Math.sin(2 * Math.PI * params.yFrequency * t + phi + 0.5) * mul
  const dRotation = params.rotationAmplitude * Math.sin(2 * Math.PI * params.rotationFrequency * t + phi + 1.0) * mul
  const scaleOsc = params.scaleAmplitude * Math.sin(2 * Math.PI * params.scaleFrequency * t + phi + 1.5) * mul
  const dScaleX = scaleOsc
  const dScaleY = scaleOsc * 0.7 // Slightly different X/Y for organic feel

  return { dx, dy, dRotation, dScaleX, dScaleY }
}

/**
 * Map an emotion string to a procedural preset.
 * Used by the orchestrator to auto-assign presets based on dialogue emotion cues.
 */
export function emotionToPreset(emotion?: string): ProceduralPreset {
  if (!emotion) return 'talking'

  const lower = emotion.toLowerCase()

  if (['joy', 'happy', 'amusement', 'laughter', 'excited', 'satisfaction'].some(e => lower.includes(e))) {
    return 'excited'
  }
  if (['anger', 'rage', 'indignation', 'sternness'].some(e => lower.includes(e))) {
    return 'dramatic'
  }
  if (['sadness', 'grief', 'melancholy', 'dejection'].some(e => lower.includes(e))) {
    return 'sad'
  }
  if (['fear', 'anxiety', 'terror', 'concern', 'nervous'].some(e => lower.includes(e))) {
    return 'nervous'
  }
  if (['surprise', 'shock', 'wonder', 'alertness'].some(e => lower.includes(e))) {
    return 'excited'
  }
  if (['disgust', 'revulsion', 'aversion', 'disdain'].some(e => lower.includes(e))) {
    return 'dramatic'
  }

  return 'talking'
}
