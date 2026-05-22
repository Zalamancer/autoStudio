/**
 * Visual flow system for motion graphics.
 * Manages how motion graphic elements sequence, transition, and complement each other.
 *
 * Core concepts:
 * - FlowSequence: ordered list of motion elements that play in sequence
 * - FlowTransition: how one element hands off to the next
 * - FlowComposition: spatial layout rules for concurrent elements
 */

import type { MotionDesignDescription } from '@/types/motionDesign'
import type { ColorPalette } from './colorHarmony'
import type { TypographyAnimationConfig } from './typographyEngine'

// ── Types ──

export type FlowTransitionType =
  | 'cut'              // Hard cut between elements
  | 'crossfade'        // Overlap fade
  | 'push-left'        // Current pushes left, next enters from right
  | 'push-up'          // Current pushes up, next enters from bottom
  | 'zoom-through'     // Current zooms in, next reveals behind
  | 'wipe-horizontal'  // Horizontal wipe
  | 'wipe-vertical'    // Vertical wipe
  | 'morph'            // Shared elements morph between states
  | 'dissolve'         // Particle-style dissolve

export type FlowRole =
  | 'hook'             // Opening attention-grabber
  | 'title'            // Main title/heading
  | 'subtitle'         // Supporting text
  | 'lower-third'      // Name/title overlay
  | 'stat'             // Data/statistic display
  | 'cta'              // Call to action
  | 'quote'            // Quote card
  | 'list'             // List/bullet points
  | 'transition'       // Visual transition element
  | 'end-screen'       // Closing card
  | 'accent'           // Decorative accent element

export interface FlowElement {
  id: string
  role: FlowRole
  /** Start time as fraction of total duration (0-1) */
  startTime: number
  /** End time as fraction of total duration (0-1) */
  endTime: number
  /** The motion design description for this element */
  description: MotionDesignDescription
  /** Typography animation to use (if text-heavy) */
  typography?: TypographyAnimationConfig
  /** Z-index layer */
  layer: number
}

export interface FlowTransition {
  fromId: string
  toId: string
  type: FlowTransitionType
  /** Overlap duration in fraction of total (0-0.15) */
  overlapDuration: number
}

export interface FlowSequence {
  elements: FlowElement[]
  transitions: FlowTransition[]
  palette: ColorPalette
  totalDurationSec: number
}

// ── Flow templates ──

/**
 * Standard flow patterns for common video types.
 * Each pattern defines role sequence and timing.
 */

export interface FlowPattern {
  name: string
  roles: { role: FlowRole; fraction: number }[]
  transitions: FlowTransitionType[]
}

export const FLOW_PATTERNS: Record<string, FlowPattern> = {
  'hook-explain-cta': {
    name: 'Hook → Explain → CTA',
    roles: [
      { role: 'hook', fraction: 0.15 },
      { role: 'title', fraction: 0.1 },
      { role: 'list', fraction: 0.45 },
      { role: 'stat', fraction: 0.15 },
      { role: 'cta', fraction: 0.1 },
      { role: 'end-screen', fraction: 0.05 },
    ],
    transitions: ['push-up', 'crossfade', 'cut', 'push-left', 'crossfade'],
  },
  'story-arc': {
    name: 'Story Arc',
    roles: [
      { role: 'hook', fraction: 0.12 },
      { role: 'title', fraction: 0.08 },
      { role: 'quote', fraction: 0.25 },
      { role: 'stat', fraction: 0.2 },
      { role: 'list', fraction: 0.2 },
      { role: 'cta', fraction: 0.1 },
      { role: 'end-screen', fraction: 0.05 },
    ],
    transitions: ['zoom-through', 'crossfade', 'push-up', 'cut', 'wipe-horizontal', 'crossfade'],
  },
  'stat-showcase': {
    name: 'Stat Showcase',
    roles: [
      { role: 'hook', fraction: 0.1 },
      { role: 'stat', fraction: 0.25 },
      { role: 'stat', fraction: 0.25 },
      { role: 'stat', fraction: 0.25 },
      { role: 'cta', fraction: 0.1 },
      { role: 'end-screen', fraction: 0.05 },
    ],
    transitions: ['push-left', 'push-left', 'push-left', 'crossfade', 'crossfade'],
  },
  'title-lower-third': {
    name: 'Title + Lower Third',
    roles: [
      { role: 'title', fraction: 0.25 },
      { role: 'lower-third', fraction: 0.5 },
      { role: 'end-screen', fraction: 0.25 },
    ],
    transitions: ['crossfade', 'crossfade'],
  },
  'quick-list': {
    name: 'Quick List',
    roles: [
      { role: 'hook', fraction: 0.15 },
      { role: 'list', fraction: 0.6 },
      { role: 'cta', fraction: 0.15 },
      { role: 'end-screen', fraction: 0.1 },
    ],
    transitions: ['push-up', 'cut', 'crossfade'],
  },
}

// ── Flow computation ──

/**
 * Compute timing for a flow pattern.
 * Returns timed elements with start/end fractions.
 */
export function computeFlowTiming(
  pattern: FlowPattern,
  _durationSec: number,
  overlapFraction = 0.03,
): { timings: { role: FlowRole; start: number; end: number }[]; transitions: FlowTransition[] } {
  const timings: { role: FlowRole; start: number; end: number }[] = []
  const transitions: FlowTransition[] = []

  let cursor = 0
  for (let i = 0; i < pattern.roles.length; i++) {
    const { role, fraction } = pattern.roles[i]
    const start = Math.max(0, cursor - (i > 0 ? overlapFraction : 0))
    const end = cursor + fraction
    timings.push({ role, start, end: Math.min(1, end) })

    if (i > 0) {
      transitions.push({
        fromId: `flow-${i - 1}`,
        toId: `flow-${i}`,
        type: pattern.transitions[i - 1] ?? 'crossfade',
        overlapDuration: overlapFraction,
      })
    }

    cursor = end
  }

  return { timings, transitions }
}

/**
 * Compute transition animation properties for an element
 * based on its flow transition context.
 */
export function computeTransitionStyle(
  transitionType: FlowTransitionType,
  progress: number, // 0-1 within the transition overlap
  isExiting: boolean,
): { opacity: number; x: number; y: number; scale: number } {
  const t = Math.max(0, Math.min(1, progress))

  switch (transitionType) {
    case 'cut':
      return {
        opacity: isExiting ? (t > 0.5 ? 0 : 1) : (t > 0.5 ? 1 : 0),
        x: 0, y: 0, scale: 1,
      }

    case 'crossfade':
      return {
        opacity: isExiting ? 1 - t : t,
        x: 0, y: 0, scale: 1,
      }

    case 'push-left':
      return isExiting
        ? { opacity: 1, x: -t * 100, y: 0, scale: 1 }
        : { opacity: 1, x: (1 - t) * 100, y: 0, scale: 1 }

    case 'push-up':
      return isExiting
        ? { opacity: 1, x: 0, y: -t * 100, scale: 1 }
        : { opacity: 1, x: 0, y: (1 - t) * 100, scale: 1 }

    case 'zoom-through':
      return isExiting
        ? { opacity: 1 - t, x: 0, y: 0, scale: 1 + t * 0.5 }
        : { opacity: t, x: 0, y: 0, scale: 1.5 - t * 0.5 }

    case 'wipe-horizontal':
      // Simulated with opacity + x shift
      return isExiting
        ? { opacity: 1 - t, x: -t * 20, y: 0, scale: 1 }
        : { opacity: t, x: (1 - t) * 20, y: 0, scale: 1 }

    case 'wipe-vertical':
      return isExiting
        ? { opacity: 1 - t, x: 0, y: -t * 20, scale: 1 }
        : { opacity: t, x: 0, y: (1 - t) * 20, scale: 1 }

    case 'morph':
      return {
        opacity: isExiting ? 1 - t * 0.5 : 0.5 + t * 0.5,
        x: 0, y: 0, scale: isExiting ? 1 - t * 0.1 : 0.9 + t * 0.1,
      }

    case 'dissolve':
      return {
        opacity: isExiting ? 1 - t : t,
        x: 0, y: 0,
        scale: isExiting ? 1 + t * 0.05 : 1.05 - t * 0.05,
      }

    default:
      return { opacity: 1, x: 0, y: 0, scale: 1 }
  }
}

/**
 * Suggest the best flow pattern based on content analysis.
 */
export function suggestFlowPattern(
  contentDescription: string,
  elementCount: number,
): string {
  const desc = contentDescription.toLowerCase()

  if (desc.includes('stat') || desc.includes('data') || desc.includes('number')) {
    return 'stat-showcase'
  }
  if (desc.includes('list') || desc.includes('tip') || desc.includes('step') || desc.includes('point')) {
    return 'quick-list'
  }
  if (desc.includes('story') || desc.includes('narrative') || desc.includes('journey')) {
    return 'story-arc'
  }
  if (elementCount <= 3) {
    return 'title-lower-third'
  }
  return 'hook-explain-cta'
}
