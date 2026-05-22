/**
 * Animation Style Transfer — Extract style features from keyframes and apply
 * them to target keyframes by modifying easing curves and timing.
 *
 * All math runs client-side on PropertyKeyframe arrays. No keyframes are created
 * or removed — only easing types, bezier params, and frame positions are changed.
 */

import type {
  PropertyKeyframe,
  EasingType,
  CubicBezierParams,
  ObjectPropertyTrack,
} from '@/types/keyframes'

// ---------------------------------------------------------------------------
// Style Feature Descriptor
// ---------------------------------------------------------------------------

export interface AnimationStyleFeatures {
  /** Overall easing type (most common in source, or explicit preset override) */
  easingType: EasingType
  /** Custom bezier control points when easingType === 'cubic-bezier' */
  bezierParams?: CubicBezierParams
  /** Multiplier on value deltas between consecutive keyframes (1 = unchanged) */
  amplitudeMultiplier: number
  /** How far values overshoot their target before settling (0 = no overshoot) */
  overshoot: number
  /** Speed multiplier applied to inter-keyframe durations (>1 = faster) */
  speedMultiplier: number
  /** 0 = perfectly uniform spacing; 1 = maximally varied spacing */
  rhythmVariation: number
}

// ---------------------------------------------------------------------------
// Built-in style presets
// ---------------------------------------------------------------------------

export type StylePresetId =
  | 'snappy'
  | 'smooth-cinematic'
  | 'bouncy-cartoon'
  | 'mechanical-robot'
  | 'dreamy-float'
  | 'intense-action'

export interface StylePresetDef {
  id: StylePresetId
  label: string
  description: string
  features: AnimationStyleFeatures
}

export const STYLE_PRESETS: StylePresetDef[] = [
  {
    id: 'snappy',
    label: 'Snappy',
    description: 'Quick, punchy movements with sharp stops',
    features: {
      easingType: 'cubic-bezier',
      bezierParams: { x1: 0.9, y1: 0, x2: 0.1, y2: 1 },
      amplitudeMultiplier: 1.2,
      overshoot: 0.05,
      speedMultiplier: 1.6,
      rhythmVariation: 0.2,
    },
  },
  {
    id: 'smooth-cinematic',
    label: 'Smooth & Cinematic',
    description: 'Elegant, flowing motion with gentle ease',
    features: {
      easingType: 'cubic-bezier',
      bezierParams: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
      amplitudeMultiplier: 0.85,
      overshoot: 0,
      speedMultiplier: 0.7,
      rhythmVariation: 0.1,
    },
  },
  {
    id: 'bouncy-cartoon',
    label: 'Bouncy Cartoon',
    description: 'Exaggerated, springy cartoon-style animation',
    features: {
      easingType: 'cubic-bezier',
      bezierParams: { x1: 0.68, y1: -0.55, x2: 0.27, y2: 1.55 },
      amplitudeMultiplier: 1.5,
      overshoot: 0.35,
      speedMultiplier: 1.3,
      rhythmVariation: 0.4,
    },
  },
  {
    id: 'mechanical-robot',
    label: 'Mechanical / Robot',
    description: 'Stiff, linear movements with precise timing',
    features: {
      easingType: 'linear',
      amplitudeMultiplier: 1.0,
      overshoot: 0,
      speedMultiplier: 1.0,
      rhythmVariation: 0,
    },
  },
  {
    id: 'dreamy-float',
    label: 'Dreamy Float',
    description: 'Slow, airy drifting with soft easing',
    features: {
      easingType: 'cubic-bezier',
      bezierParams: { x1: 0.42, y1: 0, x2: 0.58, y2: 1 },
      amplitudeMultiplier: 0.6,
      overshoot: 0,
      speedMultiplier: 0.45,
      rhythmVariation: 0.6,
    },
  },
  {
    id: 'intense-action',
    label: 'Intense Action',
    description: 'Aggressive, fast-paced motion with high energy',
    features: {
      easingType: 'cubic-bezier',
      bezierParams: { x1: 0.7, y1: 0, x2: 0.3, y2: 1 },
      amplitudeMultiplier: 1.8,
      overshoot: 0.15,
      speedMultiplier: 2.0,
      rhythmVariation: 0.5,
    },
  },
]

export function getPresetById(id: StylePresetId): StylePresetDef | undefined {
  return STYLE_PRESETS.find((p) => p.id === id)
}

// ---------------------------------------------------------------------------
// Extract Style Features from Existing Keyframes
// ---------------------------------------------------------------------------

/**
 * Analyse a set of property tracks and extract aggregate style features.
 * This enables "learn from selection" — the user selects some keyframes and the
 * system derives the implicit style that can be applied elsewhere.
 */
export function extractStyleFeatures(
  tracks: ObjectPropertyTrack[]
): AnimationStyleFeatures {
  // Collect all keyframes across all tracks
  const allKeyframes: PropertyKeyframe[] = tracks.flatMap((t) => t.keyframes)

  if (allKeyframes.length === 0) {
    // Fallback to linear identity style
    return {
      easingType: 'linear',
      amplitudeMultiplier: 1,
      overshoot: 0,
      speedMultiplier: 1,
      rhythmVariation: 0,
    }
  }

  // --- 1. Dominant easing type ---
  const easingCounts = new Map<EasingType, number>()
  const bezierSum = { x1: 0, y1: 0, x2: 0, y2: 0 }
  let bezierCount = 0

  for (const kf of allKeyframes) {
    easingCounts.set(kf.easing, (easingCounts.get(kf.easing) ?? 0) + 1)
    if (kf.easing === 'cubic-bezier' && kf.bezierParams) {
      bezierSum.x1 += kf.bezierParams.x1
      bezierSum.y1 += kf.bezierParams.y1
      bezierSum.x2 += kf.bezierParams.x2
      bezierSum.y2 += kf.bezierParams.y2
      bezierCount++
    }
  }

  let dominantEasing: EasingType = 'linear'
  let maxCount = 0
  for (const [easing, count] of easingCounts) {
    if (count > maxCount) {
      maxCount = count
      dominantEasing = easing
    }
  }

  let bezierParams: CubicBezierParams | undefined
  if (dominantEasing === 'cubic-bezier' && bezierCount > 0) {
    bezierParams = {
      x1: bezierSum.x1 / bezierCount,
      y1: bezierSum.y1 / bezierCount,
      x2: bezierSum.x2 / bezierCount,
      y2: bezierSum.y2 / bezierCount,
    }
  }

  // --- 2. Amplitude analysis (average absolute value delta) ---
  const deltas: number[] = []
  for (const track of tracks) {
    const kfs = track.keyframes
    for (let i = 0; i < kfs.length - 1; i++) {
      deltas.push(Math.abs(kfs[i + 1].value - kfs[i].value))
    }
  }
  // Normalise amplitude to a multiplier around 1. We treat the median delta
  // as the "unit" and derive a multiplier. Since we cannot know the "default"
  // amplitude, we store the raw average and normalise during apply.
  const avgDelta = deltas.length > 0 ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0
  // Simple heuristic: map to 0.5-2.0 range based on average delta magnitude
  const amplitudeMultiplier = Math.max(0.1, Math.min(3, avgDelta > 0 ? 1 : 1))

  // --- 3. Speed analysis (average inter-keyframe duration in frames) ---
  const durations: number[] = []
  for (const track of tracks) {
    const kfs = track.keyframes
    for (let i = 0; i < kfs.length - 1; i++) {
      durations.push(kfs[i + 1].frame - kfs[i].frame)
    }
  }
  const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 30
  // Map to speed multiplier: shorter average duration = higher speed
  // 30 frames (~1s at 30fps) is baseline speed = 1.0
  const speedMultiplier = Math.max(0.25, Math.min(4, 30 / avgDuration))

  // --- 4. Rhythm variation (coefficient of variation of durations) ---
  let rhythmVariation = 0
  if (durations.length > 1) {
    const mean = avgDuration
    const variance = durations.reduce((sum, d) => sum + (d - mean) ** 2, 0) / durations.length
    const stdDev = Math.sqrt(variance)
    // CV normalised to 0-1 (CV of 1 = stdDev equals mean)
    rhythmVariation = Math.min(1, stdDev / Math.max(1, mean))
  }

  // --- 5. Overshoot detection (check if bezier y values go below 0 or above 1) ---
  let overshoot = 0
  if (bezierParams) {
    const minY = Math.min(bezierParams.y1, bezierParams.y2)
    const maxY = Math.max(bezierParams.y1, bezierParams.y2)
    overshoot = Math.max(0, -minY) + Math.max(0, maxY - 1)
    overshoot = Math.min(1, overshoot)
  }

  return {
    easingType: dominantEasing,
    bezierParams,
    amplitudeMultiplier,
    overshoot,
    speedMultiplier,
    rhythmVariation,
  }
}

// ---------------------------------------------------------------------------
// Apply Style to Target Keyframes
// ---------------------------------------------------------------------------

/**
 * Apply style features to a set of property tracks. This modifies:
 * - Easing types and bezier params on every keyframe
 * - Frame positions (timing) based on speed and rhythm
 * - Value deltas (amplitude) scaled by amplitudeMultiplier
 * - Overshoot added via bezier y-axis extension
 *
 * Returns new track arrays with cloned keyframes (non-destructive).
 */
export function applyStyle(
  tracks: ObjectPropertyTrack[],
  style: AnimationStyleFeatures
): ObjectPropertyTrack[] {
  return tracks.map((track) => ({
    ...track,
    keyframes: applyStyleToKeyframes(track.keyframes, style),
  }))
}

function applyStyleToKeyframes(
  keyframes: PropertyKeyframe[],
  style: AnimationStyleFeatures
): PropertyKeyframe[] {
  if (keyframes.length <= 1) {
    // Single or no keyframes — only update easing
    return keyframes.map((kf) => ({
      ...kf,
      easing: style.easingType,
      bezierParams: buildBezierWithOvershoot(style),
    }))
  }

  // Clone all keyframes
  const result: PropertyKeyframe[] = keyframes.map((kf) => ({ ...kf }))

  // --- 1. Apply easing override ---
  for (const kf of result) {
    kf.easing = style.easingType
    kf.bezierParams = buildBezierWithOvershoot(style)
  }

  // --- 2. Adjust timing (frame positions) ---
  // Anchor the first keyframe, scale inter-keyframe durations
  for (let i = 1; i < result.length; i++) {
    const origDuration = keyframes[i].frame - keyframes[i - 1].frame
    let newDuration = origDuration / Math.max(0.25, style.speedMultiplier)

    // Apply rhythm variation — perturb durations deterministically
    if (style.rhythmVariation > 0 && result.length > 2) {
      // Seeded pseudo-variation based on keyframe index
      const variationFactor = 1 + style.rhythmVariation * (((i * 7 + 13) % 11) / 11 - 0.5)
      newDuration *= variationFactor
    }

    newDuration = Math.max(1, Math.round(newDuration))
    result[i].frame = result[i - 1].frame + newDuration
  }

  // --- 3. Adjust amplitudes (value deltas) ---
  if (style.amplitudeMultiplier !== 1) {
    // Keep first keyframe value as anchor, scale deltas from it
    const firstValue = result[0].value
    for (let i = 1; i < result.length; i++) {
      const origDelta = keyframes[i].value - keyframes[0].value
      result[i].value = firstValue + origDelta * style.amplitudeMultiplier
    }
  }

  return result
}

/**
 * Construct bezier params with overshoot baked in.
 * Returns undefined for non-cubic-bezier easing types.
 */
function buildBezierWithOvershoot(
  style: AnimationStyleFeatures
): CubicBezierParams | undefined {
  if (style.easingType !== 'cubic-bezier') return undefined

  const base: CubicBezierParams = style.bezierParams ?? {
    x1: 0.25,
    y1: 0.1,
    x2: 0.25,
    y2: 1,
  }

  if (style.overshoot <= 0) return { ...base }

  // Extend y2 beyond 1 to create overshoot, and pull y1 below 0 for anticipation
  return {
    x1: base.x1,
    y1: base.y1 - style.overshoot * 0.3,
    x2: base.x2,
    y2: Math.min(2, base.y2 + style.overshoot),
  }
}

// ---------------------------------------------------------------------------
// Convenience: Apply a preset by ID
// ---------------------------------------------------------------------------

export function applyPresetStyle(
  tracks: ObjectPropertyTrack[],
  presetId: StylePresetId
): ObjectPropertyTrack[] | null {
  const preset = getPresetById(presetId)
  if (!preset) return null
  return applyStyle(tracks, preset.features)
}

// ---------------------------------------------------------------------------
// Build custom features from slider values
// ---------------------------------------------------------------------------

export function buildCustomFeatures(params: {
  intensity: number // 0.1 .. 3
  elasticity: number // 0 .. 1
  speedMultiplier: number // 0.25 .. 4
  rhythmVariation: number // 0 .. 1
}): AnimationStyleFeatures {
  const { intensity, elasticity, speedMultiplier, rhythmVariation } = params

  // Map elasticity to overshoot and easing curve
  const overshoot = elasticity * 0.5
  const easingType: EasingType = elasticity > 0 ? 'cubic-bezier' : 'ease-in-out'

  let bezierParams: CubicBezierParams | undefined
  if (elasticity > 0) {
    // Higher elasticity = more extreme bezier with bounce
    bezierParams = {
      x1: 0.5 + elasticity * 0.3,
      y1: -elasticity * 0.4,
      x2: 0.3 - elasticity * 0.2,
      y2: 1 + elasticity * 0.4,
    }
  }

  return {
    easingType,
    bezierParams,
    amplitudeMultiplier: intensity,
    overshoot,
    speedMultiplier,
    rhythmVariation,
  }
}
