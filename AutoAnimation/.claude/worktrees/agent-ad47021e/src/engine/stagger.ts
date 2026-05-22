/**
 * Stagger animation system for grouped elements.
 *
 * Generates time-offset keyframes so multiple elements animate
 * in sequence with configurable delay, direction, and easing.
 */

import type { CanvasObjectRef, EasingType } from '@/types/keyframes'

// ── Types ─────────────────────────────────────────────────────────────

export type StaggerDirection =
  | 'normal'     // first → last
  | 'reverse'    // last → first
  | 'center'     // center → edges
  | 'edges'      // edges → center
  | 'random'     // random order

export interface StaggerConfig {
  /** Delay between each element in frames */
  delay: number
  /** Direction of stagger */
  direction?: StaggerDirection
  /** Total duration for each element's animation in frames */
  duration: number
  /** Easing applied to each element's animation */
  easing?: EasingType
  /** Overall easing applied to the stagger timing itself */
  staggerEasing?: (t: number) => number
}

export interface StaggerResult {
  /** Per-element start frame offset */
  offsets: number[]
  /** Total frames needed for the entire stagger sequence */
  totalDuration: number
}

// ── Core ──────────────────────────────────────────────────────────────

/**
 * Calculate stagger offsets for a group of elements.
 */
export function calculateStagger(
  count: number,
  config: StaggerConfig,
): StaggerResult {
  if (count <= 0) return { offsets: [], totalDuration: 0 }
  if (count === 1) return { offsets: [0], totalDuration: config.duration }

  const { delay, duration, direction = 'normal', staggerEasing } = config

  // Build order indices
  let indices: number[]
  switch (direction) {
    case 'reverse':
      indices = Array.from({ length: count }, (_, i) => count - 1 - i)
      break
    case 'center': {
      const mid = (count - 1) / 2
      indices = Array.from({ length: count }, (_, i) => Math.abs(i - mid))
      // Normalize to 0..count-1 range
      const maxDist = Math.max(...indices)
      if (maxDist > 0) indices = indices.map(d => (d / maxDist) * (count - 1))
      break
    }
    case 'edges': {
      const mid = (count - 1) / 2
      const dists = Array.from({ length: count }, (_, i) => Math.abs(i - mid))
      const maxDist = Math.max(...dists)
      if (maxDist > 0) {
        indices = dists.map(d => (1 - d / maxDist) * (count - 1))
      } else {
        indices = Array.from({ length: count }, () => 0)
      }
      break
    }
    case 'random': {
      indices = Array.from({ length: count }, (_, i) => i)
      // Fisher-Yates shuffle
      for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[indices[i], indices[j]] = [indices[j], indices[i]]
      }
      break
    }
    case 'normal':
    default:
      indices = Array.from({ length: count }, (_, i) => i)
      break
  }

  // Calculate raw offsets
  const offsets = indices.map((idx) => {
    const normalizedIdx = idx / (count - 1) // 0..1
    const easedIdx = staggerEasing ? staggerEasing(normalizedIdx) : normalizedIdx
    return Math.round(easedIdx * (count - 1) * delay)
  })

  const maxOffset = Math.max(...offsets)
  const totalDuration = maxOffset + duration

  return { offsets, totalDuration }
}

/**
 * Generate staggered keyframes for multiple elements.
 *
 * Returns an array of { objectRef, startFrame } pairs that the
 * keyframe system can use to create offset animations.
 */
export function generateStaggeredKeyframes(
  elements: CanvasObjectRef[],
  startFrame: number,
  config: StaggerConfig,
): Array<{ objectRef: CanvasObjectRef; startFrame: number; endFrame: number }> {
  const { offsets, totalDuration: _ } = calculateStagger(elements.length, config)

  return elements.map((objectRef, i) => ({
    objectRef,
    startFrame: startFrame + offsets[i],
    endFrame: startFrame + offsets[i] + config.duration,
  }))
}

// ── Preset Stagger Configs ────────────────────────────────────────────

export const StaggerPresets = {
  /** Quick cascade — elements pop in rapidly */
  cascade: (fps: number): StaggerConfig => ({
    delay: Math.round(fps * 0.05),   // 50ms between
    duration: Math.round(fps * 0.3),  // 300ms each
    easing: 'ease-out',
    direction: 'normal',
  }),

  /** Waterfall — slower, more deliberate reveal */
  waterfall: (fps: number): StaggerConfig => ({
    delay: Math.round(fps * 0.1),
    duration: Math.round(fps * 0.5),
    easing: 'ease-in-out',
    direction: 'normal',
  }),

  /** Explode from center */
  explode: (fps: number): StaggerConfig => ({
    delay: Math.round(fps * 0.04),
    duration: Math.round(fps * 0.4),
    easing: 'ease-out',
    direction: 'center',
  }),

  /** Implode to center */
  implode: (fps: number): StaggerConfig => ({
    delay: Math.round(fps * 0.04),
    duration: Math.round(fps * 0.4),
    easing: 'ease-in',
    direction: 'edges',
  }),

  /** Random pop-in */
  popcorn: (fps: number): StaggerConfig => ({
    delay: Math.round(fps * 0.06),
    duration: Math.round(fps * 0.25),
    easing: 'ease-out',
    direction: 'random',
  }),

  /** Typewriter — one-by-one, evenly spaced */
  typewriter: (fps: number): StaggerConfig => ({
    delay: Math.round(fps * 0.08),
    duration: Math.round(fps * 0.15),
    easing: 'linear',
    direction: 'normal',
  }),

  /** Dramatic reverse reveal */
  dramaticReverse: (fps: number): StaggerConfig => ({
    delay: Math.round(fps * 0.12),
    duration: Math.round(fps * 0.6),
    easing: 'ease-in-out',
    direction: 'reverse',
  }),
} as const
