/**
 * Attention / Idle animations for static elements.
 *
 * These are looping, subtle animations applied to elements
 * that are otherwise stationary — floating, pulsing, breathing,
 * bobbing, wiggling, etc.
 *
 * Returns a transform delta to apply on top of the element's
 * base transform each frame.
 */

// ── Types ─────────────────────────────────────────────────────────────

export interface AttentionTransform {
  translateX: number
  translateY: number
  scale: number
  rotation: number
  opacity: number
}

export type AttentionType =
  | 'float'
  | 'pulse'
  | 'breathe'
  | 'bob'
  | 'wiggle'
  | 'sway'
  | 'heartbeat'
  | 'glow'
  | 'shake'
  | 'rock'
  | 'bounce-idle'
  | 'pendulum'

export interface AttentionConfig {
  type: AttentionType
  /** Intensity multiplier (0.1 = very subtle, 1.0 = standard, 2.0 = exaggerated) */
  intensity?: number
  /** Speed multiplier (0.5 = half speed, 2.0 = double speed) */
  speed?: number
  /** Phase offset in radians (for desynchronizing multiple elements) */
  phase?: number
}

// ── Constants ─────────────────────────────────────────────────────────

const PI = Math.PI
const TAU = 2 * PI
const IDENTITY: AttentionTransform = {
  translateX: 0,
  translateY: 0,
  scale: 1,
  rotation: 0,
  opacity: 1,
}

// ── Core ──────────────────────────────────────────────────────────────

/**
 * Calculate attention animation transform at a given time.
 *
 * @param time - Current time in seconds (frame / fps)
 * @param config - Attention animation configuration
 * @returns Transform delta to apply on top of base transform
 */
export function getAttentionTransform(
  time: number,
  config: AttentionConfig,
): AttentionTransform {
  const intensity = config.intensity ?? 1.0
  const speed = config.speed ?? 1.0
  const phase = config.phase ?? 0
  const t = time * speed + phase

  switch (config.type) {
    case 'float':
      return float(t, intensity)
    case 'pulse':
      return pulse(t, intensity)
    case 'breathe':
      return breathe(t, intensity)
    case 'bob':
      return bob(t, intensity)
    case 'wiggle':
      return wiggle(t, intensity)
    case 'sway':
      return sway(t, intensity)
    case 'heartbeat':
      return heartbeat(t, intensity)
    case 'glow':
      return glow(t, intensity)
    case 'shake':
      return shake(t, intensity)
    case 'rock':
      return rock(t, intensity)
    case 'bounce-idle':
      return bounceIdle(t, intensity)
    case 'pendulum':
      return pendulum(t, intensity)
    default:
      return { ...IDENTITY }
  }
}

/**
 * Get attention transform at a specific frame.
 */
export function getAttentionTransformAtFrame(
  frame: number,
  fps: number,
  config: AttentionConfig,
): AttentionTransform {
  return getAttentionTransform(frame / fps, config)
}

// ── Animation Implementations ─────────────────────────────────────────

/** Gentle floating up and down with slight X drift */
function float(t: number, intensity: number): AttentionTransform {
  return {
    ...IDENTITY,
    translateX: Math.sin(t * 0.7) * 3 * intensity,
    translateY: Math.sin(t * 1.2) * 5 * intensity,
    rotation: Math.sin(t * 0.5) * 0.5 * intensity,
  }
}

/** Scale pulse — rhythmic size change */
function pulse(t: number, intensity: number): AttentionTransform {
  const s = 1 + Math.sin(t * TAU * 0.5) * 0.04 * intensity
  return { ...IDENTITY, scale: s }
}

/** Breathing — asymmetric scale (inhale slow, exhale quick) */
function breathe(t: number, intensity: number): AttentionTransform {
  // Asymmetric sine: slower rise, faster fall
  const cycle = t * 0.8
  const raw = Math.sin(cycle * TAU)
  const shaped = raw > 0 ? Math.pow(raw, 0.7) : -Math.pow(-raw, 1.3)
  const s = 1 + shaped * 0.03 * intensity
  return {
    ...IDENTITY,
    scale: s,
    translateY: shaped * -2 * intensity,
  }
}

/** Vertical bobbing */
function bob(t: number, intensity: number): AttentionTransform {
  return {
    ...IDENTITY,
    translateY: Math.sin(t * TAU * 0.6) * 4 * intensity,
  }
}

/** Quick rotational wiggle */
function wiggle(t: number, intensity: number): AttentionTransform {
  const wiggleFreq = 3
  return {
    ...IDENTITY,
    rotation: Math.sin(t * TAU * wiggleFreq) * 3 * intensity,
  }
}

/** Pendulum-like swaying */
function sway(t: number, intensity: number): AttentionTransform {
  return {
    ...IDENTITY,
    rotation: Math.sin(t * TAU * 0.4) * 5 * intensity,
    translateX: Math.sin(t * TAU * 0.4) * 3 * intensity,
  }
}

/** Heartbeat — double-pulse scale pattern */
function heartbeat(t: number, intensity: number): AttentionTransform {
  const cycle = (t * 1.2) % 1
  let s = 1
  if (cycle < 0.1) {
    s = 1 + Math.sin(cycle / 0.1 * PI) * 0.08 * intensity
  } else if (cycle < 0.25) {
    s = 1 + Math.sin((cycle - 0.15) / 0.1 * PI) * 0.12 * intensity
  }
  return { ...IDENTITY, scale: s }
}

/** Opacity pulsing (glow effect) */
function glow(t: number, intensity: number): AttentionTransform {
  return {
    ...IDENTITY,
    opacity: 1 - Math.sin(t * TAU * 0.5) * 0.15 * intensity,
  }
}

/** Random micro-tremor (jittery, nervous) */
function shake(t: number, intensity: number): AttentionTransform {
  // Use sine at different frequencies for pseudo-random look
  const x = (Math.sin(t * 47.3) + Math.sin(t * 31.7)) * 1.5 * intensity
  const y = (Math.sin(t * 53.1) + Math.sin(t * 37.9)) * 1.5 * intensity
  return {
    ...IDENTITY,
    translateX: x,
    translateY: y,
  }
}

/** Rocking — rotation oscillation around bottom pivot */
function rock(t: number, intensity: number): AttentionTransform {
  return {
    ...IDENTITY,
    rotation: Math.sin(t * TAU * 0.3) * 8 * intensity,
  }
}

/** Idle bouncing — squash and stretch with position */
function bounceIdle(t: number, intensity: number): AttentionTransform {
  const cycle = t * 1.5
  const bounce = Math.abs(Math.sin(cycle * PI))
  const squash = 1 + (1 - bounce) * 0.05 * intensity
  return {
    ...IDENTITY,
    translateY: -bounce * 8 * intensity,
    scale: 1 / squash, // horizontal squash when grounded
  }
}

/** Pendulum swing */
function pendulum(t: number, intensity: number): AttentionTransform {
  const angle = Math.sin(t * TAU * 0.35) * 15 * intensity
  return {
    ...IDENTITY,
    rotation: angle,
  }
}

// ── Presets ────────────────────────────────────────────────────────────

export const AttentionPresets: Record<string, AttentionConfig> = {
  'subtle-float': { type: 'float', intensity: 0.5, speed: 0.8 },
  'gentle-pulse': { type: 'pulse', intensity: 0.6, speed: 0.7 },
  'calm-breathe': { type: 'breathe', intensity: 0.8, speed: 0.6 },
  'soft-bob': { type: 'bob', intensity: 0.4, speed: 0.5 },
  'nervous-wiggle': { type: 'wiggle', intensity: 0.3, speed: 2.0 },
  'lazy-sway': { type: 'sway', intensity: 0.5, speed: 0.4 },
  'alive-heartbeat': { type: 'heartbeat', intensity: 1.0, speed: 1.0 },
  'soft-glow': { type: 'glow', intensity: 0.5, speed: 0.6 },
  'nervous-shake': { type: 'shake', intensity: 0.3, speed: 1.5 },
  'gentle-rock': { type: 'rock', intensity: 0.4, speed: 0.5 },
  'idle-bounce': { type: 'bounce-idle', intensity: 0.5, speed: 0.8 },
  'clock-pendulum': { type: 'pendulum', intensity: 0.6, speed: 0.4 },
}
