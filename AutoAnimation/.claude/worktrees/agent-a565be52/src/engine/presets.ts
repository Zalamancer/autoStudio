/**
 * 50+ professional animation presets.
 *
 * Each preset describes a sequence of keyframe operations that can
 * be applied to any canvas element through the keyframe store.
 *
 * Presets are organized into categories:
 * - Entrances (element appearing)
 * - Exits (element disappearing)
 * - Emphasis (drawing attention)
 * - Transitions (movement between states)
 */

import type { EasingType, CanvasObjectRef } from '@/types/keyframes'

// ── Types ─────────────────────────────────────────────────────────────

export interface PresetKeyframe {
  /** Frame offset from animation start (0 = first frame) */
  frameOffset: number
  /** Property name matching keyframeProperties.ts keys */
  property: string
  /** Value at this keyframe */
  value: number
  /** Easing to next keyframe */
  easing: EasingType
}

export interface AnimationPreset {
  id: string
  name: string
  category: PresetCategory
  /** Duration in frames at 30fps — scales proportionally */
  durationFrames: number
  /** Keyframes to generate (frame offsets are relative to start) */
  keyframes: PresetKeyframe[]
  /** Description for UI */
  description: string
  /** Tags for search */
  tags: string[]
}

export type PresetCategory = 'entrance' | 'exit' | 'emphasis' | 'transition'

// ── Helper ────────────────────────────────────────────────────────────

function kf(frameOffset: number, property: string, value: number, easing: EasingType = 'ease-out'): PresetKeyframe {
  return { frameOffset, property, value, easing }
}

// ── Presets ────────────────────────────────────────────────────────────

export const ANIMATION_PRESETS: AnimationPreset[] = [
  // ═══════════════════════════════════════════════════════════════════
  // ENTRANCES (20)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'fade-in',
    name: 'Fade In',
    category: 'entrance',
    durationFrames: 15,
    description: 'Simple opacity fade from invisible to visible',
    tags: ['fade', 'simple', 'subtle'],
    keyframes: [
      kf(0, 'opacity', 0, 'ease-out'),
      kf(15, 'opacity', 1, 'linear'),
    ],
  },
  {
    id: 'fade-in-up',
    name: 'Fade In Up',
    category: 'entrance',
    durationFrames: 20,
    description: 'Fade in while sliding up from below',
    tags: ['fade', 'slide', 'up'],
    keyframes: [
      kf(0, 'opacity', 0, 'ease-out'),
      kf(0, 'freeY', 40, 'ease-out'),
      kf(20, 'opacity', 1, 'linear'),
      kf(20, 'freeY', 0, 'linear'),
    ],
  },
  {
    id: 'fade-in-down',
    name: 'Fade In Down',
    category: 'entrance',
    durationFrames: 20,
    description: 'Fade in while sliding down from above',
    tags: ['fade', 'slide', 'down'],
    keyframes: [
      kf(0, 'opacity', 0, 'ease-out'),
      kf(0, 'freeY', -40, 'ease-out'),
      kf(20, 'opacity', 1, 'linear'),
      kf(20, 'freeY', 0, 'linear'),
    ],
  },
  {
    id: 'fade-in-left',
    name: 'Fade In Left',
    category: 'entrance',
    durationFrames: 20,
    description: 'Fade in while sliding from the left',
    tags: ['fade', 'slide', 'left'],
    keyframes: [
      kf(0, 'opacity', 0, 'ease-out'),
      kf(0, 'freeX', -60, 'ease-out'),
      kf(20, 'opacity', 1, 'linear'),
      kf(20, 'freeX', 0, 'linear'),
    ],
  },
  {
    id: 'fade-in-right',
    name: 'Fade In Right',
    category: 'entrance',
    durationFrames: 20,
    description: 'Fade in while sliding from the right',
    tags: ['fade', 'slide', 'right'],
    keyframes: [
      kf(0, 'opacity', 0, 'ease-out'),
      kf(0, 'freeX', 60, 'ease-out'),
      kf(20, 'opacity', 1, 'linear'),
      kf(20, 'freeX', 0, 'linear'),
    ],
  },
  {
    id: 'pop-in',
    name: 'Pop In',
    category: 'entrance',
    durationFrames: 12,
    description: 'Scale from 0 with overshoot bounce',
    tags: ['pop', 'scale', 'bounce', 'playful'],
    keyframes: [
      kf(0, 'scale', 0, 'ease-out'),
      kf(0, 'opacity', 0, 'ease-out'),
      kf(8, 'scale', 1.15, 'ease-in-out'),
      kf(8, 'opacity', 1, 'linear'),
      kf(12, 'scale', 1, 'linear'),
    ],
  },
  {
    id: 'elastic-in',
    name: 'Elastic In',
    category: 'entrance',
    durationFrames: 24,
    description: 'Spring-like scale entrance with bounce',
    tags: ['elastic', 'spring', 'bounce', 'scale'],
    keyframes: [
      kf(0, 'scale', 0, 'ease-out'),
      kf(0, 'opacity', 0, 'ease-out'),
      kf(10, 'scale', 1.2, 'ease-in-out'),
      kf(10, 'opacity', 1, 'linear'),
      kf(16, 'scale', 0.9, 'ease-in-out'),
      kf(20, 'scale', 1.05, 'ease-in-out'),
      kf(24, 'scale', 1, 'linear'),
    ],
  },
  {
    id: 'bounce-in',
    name: 'Bounce In',
    category: 'entrance',
    durationFrames: 24,
    description: 'Drop in from above with realistic bounce',
    tags: ['bounce', 'drop', 'physics'],
    keyframes: [
      kf(0, 'freeY', -200, 'ease-in'),
      kf(0, 'opacity', 0, 'ease-out'),
      kf(8, 'freeY', 0, 'ease-out'),
      kf(8, 'opacity', 1, 'linear'),
      kf(12, 'freeY', -30, 'ease-in-out'),
      kf(16, 'freeY', 0, 'ease-in-out'),
      kf(19, 'freeY', -10, 'ease-in-out'),
      kf(22, 'freeY', 0, 'ease-in-out'),
      kf(24, 'freeY', 0, 'linear'),
    ],
  },
  {
    id: 'slide-in-up',
    name: 'Slide In Up',
    category: 'entrance',
    durationFrames: 18,
    description: 'Slide up from below the canvas',
    tags: ['slide', 'up', 'motion'],
    keyframes: [
      kf(0, 'freeY', 300, 'ease-out'),
      kf(18, 'freeY', 0, 'linear'),
    ],
  },
  {
    id: 'slide-in-down',
    name: 'Slide In Down',
    category: 'entrance',
    durationFrames: 18,
    description: 'Slide down from above the canvas',
    tags: ['slide', 'down', 'motion'],
    keyframes: [
      kf(0, 'freeY', -300, 'ease-out'),
      kf(18, 'freeY', 0, 'linear'),
    ],
  },
  {
    id: 'zoom-in',
    name: 'Zoom In',
    category: 'entrance',
    durationFrames: 15,
    description: 'Scale from small to full size',
    tags: ['zoom', 'scale', 'grow'],
    keyframes: [
      kf(0, 'scale', 0.3, 'ease-out'),
      kf(0, 'opacity', 0, 'ease-out'),
      kf(15, 'scale', 1, 'linear'),
      kf(15, 'opacity', 1, 'linear'),
    ],
  },
  {
    id: 'zoom-in-rotate',
    name: 'Zoom In Rotate',
    category: 'entrance',
    durationFrames: 20,
    description: 'Scale up while rotating',
    tags: ['zoom', 'rotate', 'spin'],
    keyframes: [
      kf(0, 'scale', 0, 'ease-out'),
      kf(0, 'rotation', -180, 'ease-out'),
      kf(0, 'opacity', 0, 'ease-out'),
      kf(20, 'scale', 1, 'linear'),
      kf(20, 'rotation', 0, 'linear'),
      kf(20, 'opacity', 1, 'linear'),
    ],
  },
  {
    id: 'flip-in-x',
    name: 'Flip In X',
    category: 'entrance',
    durationFrames: 18,
    description: 'Horizontal flip entrance (scale X animation)',
    tags: ['flip', 'rotate', '3d'],
    keyframes: [
      kf(0, 'scaleX', 0, 'ease-out'),
      kf(0, 'opacity', 0, 'ease-out'),
      kf(12, 'scaleX', 1.1, 'ease-in-out'),
      kf(12, 'opacity', 1, 'linear'),
      kf(18, 'scaleX', 1, 'linear'),
    ],
  },
  {
    id: 'flip-in-y',
    name: 'Flip In Y',
    category: 'entrance',
    durationFrames: 18,
    description: 'Vertical flip entrance (scale Y animation)',
    tags: ['flip', 'rotate', '3d'],
    keyframes: [
      kf(0, 'scaleY', 0, 'ease-out'),
      kf(0, 'opacity', 0, 'ease-out'),
      kf(12, 'scaleY', 1.1, 'ease-in-out'),
      kf(12, 'opacity', 1, 'linear'),
      kf(18, 'scaleY', 1, 'linear'),
    ],
  },
  {
    id: 'swing-in',
    name: 'Swing In',
    category: 'entrance',
    durationFrames: 22,
    description: 'Swing in from a rotation pivot point',
    tags: ['swing', 'rotate', 'pendulum'],
    keyframes: [
      kf(0, 'rotation', -80, 'ease-out'),
      kf(0, 'opacity', 0, 'ease-out'),
      kf(8, 'rotation', 20, 'ease-in-out'),
      kf(8, 'opacity', 1, 'linear'),
      kf(14, 'rotation', -10, 'ease-in-out'),
      kf(18, 'rotation', 5, 'ease-in-out'),
      kf(22, 'rotation', 0, 'linear'),
    ],
  },
  {
    id: 'grow-from-center',
    name: 'Grow From Center',
    category: 'entrance',
    durationFrames: 16,
    description: 'Smooth scale-up from center point',
    tags: ['grow', 'scale', 'expand'],
    keyframes: [
      kf(0, 'scale', 0, 'ease-in-out'),
      kf(0, 'opacity', 0, 'ease-out'),
      kf(4, 'opacity', 1, 'linear'),
      kf(16, 'scale', 1, 'linear'),
    ],
  },
  {
    id: 'typewriter-in',
    name: 'Typewriter In',
    category: 'entrance',
    durationFrames: 8,
    description: 'Quick reveal from left (text-like)',
    tags: ['typewriter', 'text', 'reveal'],
    keyframes: [
      kf(0, 'opacity', 0, 'linear'),
      kf(0, 'freeX', -20, 'ease-out'),
      kf(4, 'opacity', 1, 'linear'),
      kf(8, 'freeX', 0, 'linear'),
    ],
  },
  {
    id: 'blur-in',
    name: 'Blur In',
    category: 'entrance',
    durationFrames: 15,
    description: 'Fade in with scale (simulated blur effect)',
    tags: ['blur', 'fade', 'soft'],
    keyframes: [
      kf(0, 'opacity', 0, 'ease-out'),
      kf(0, 'scale', 1.15, 'ease-out'),
      kf(15, 'opacity', 1, 'linear'),
      kf(15, 'scale', 1, 'linear'),
    ],
  },
  {
    id: 'wipe-in-left',
    name: 'Wipe In Left',
    category: 'entrance',
    durationFrames: 15,
    description: 'Reveal from left edge',
    tags: ['wipe', 'reveal', 'left'],
    keyframes: [
      kf(0, 'freeX', -100, 'ease-in-out'),
      kf(0, 'opacity', 0, 'linear'),
      kf(3, 'opacity', 1, 'linear'),
      kf(15, 'freeX', 0, 'linear'),
    ],
  },
  {
    id: 'rise-in',
    name: 'Rise In',
    category: 'entrance',
    durationFrames: 20,
    description: 'Float up gently with fade',
    tags: ['rise', 'float', 'gentle', 'elegant'],
    keyframes: [
      kf(0, 'opacity', 0, 'ease-out'),
      kf(0, 'freeY', 30, 'ease-out'),
      kf(0, 'scale', 0.95, 'ease-out'),
      kf(20, 'opacity', 1, 'linear'),
      kf(20, 'freeY', 0, 'linear'),
      kf(20, 'scale', 1, 'linear'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // EXITS (15)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'fade-out',
    name: 'Fade Out',
    category: 'exit',
    durationFrames: 15,
    description: 'Simple opacity fade to invisible',
    tags: ['fade', 'simple', 'subtle'],
    keyframes: [
      kf(0, 'opacity', 1, 'ease-in'),
      kf(15, 'opacity', 0, 'linear'),
    ],
  },
  {
    id: 'fade-out-up',
    name: 'Fade Out Up',
    category: 'exit',
    durationFrames: 18,
    description: 'Fade out while rising upward',
    tags: ['fade', 'slide', 'up'],
    keyframes: [
      kf(0, 'opacity', 1, 'ease-in'),
      kf(0, 'freeY', 0, 'ease-in'),
      kf(18, 'opacity', 0, 'linear'),
      kf(18, 'freeY', -40, 'linear'),
    ],
  },
  {
    id: 'fade-out-down',
    name: 'Fade Out Down',
    category: 'exit',
    durationFrames: 18,
    description: 'Fade out while sinking down',
    tags: ['fade', 'slide', 'down'],
    keyframes: [
      kf(0, 'opacity', 1, 'ease-in'),
      kf(0, 'freeY', 0, 'ease-in'),
      kf(18, 'opacity', 0, 'linear'),
      kf(18, 'freeY', 40, 'linear'),
    ],
  },
  {
    id: 'pop-out',
    name: 'Pop Out',
    category: 'exit',
    durationFrames: 10,
    description: 'Quick scale down to nothing',
    tags: ['pop', 'scale', 'shrink'],
    keyframes: [
      kf(0, 'scale', 1, 'ease-in'),
      kf(4, 'scale', 1.1, 'ease-in'),
      kf(10, 'scale', 0, 'linear'),
      kf(10, 'opacity', 0, 'linear'),
    ],
  },
  {
    id: 'zoom-out',
    name: 'Zoom Out',
    category: 'exit',
    durationFrames: 15,
    description: 'Scale up and fade out (zoom away)',
    tags: ['zoom', 'scale', 'expand'],
    keyframes: [
      kf(0, 'scale', 1, 'ease-in'),
      kf(0, 'opacity', 1, 'ease-in'),
      kf(15, 'scale', 1.5, 'linear'),
      kf(15, 'opacity', 0, 'linear'),
    ],
  },
  {
    id: 'shrink-out',
    name: 'Shrink Out',
    category: 'exit',
    durationFrames: 15,
    description: 'Scale down to nothing and fade',
    tags: ['shrink', 'scale', 'minimize'],
    keyframes: [
      kf(0, 'scale', 1, 'ease-in'),
      kf(0, 'opacity', 1, 'ease-in'),
      kf(15, 'scale', 0.3, 'linear'),
      kf(15, 'opacity', 0, 'linear'),
    ],
  },
  {
    id: 'slide-out-right',
    name: 'Slide Out Right',
    category: 'exit',
    durationFrames: 15,
    description: 'Slide off to the right',
    tags: ['slide', 'right', 'exit'],
    keyframes: [
      kf(0, 'freeX', 0, 'ease-in'),
      kf(15, 'freeX', 300, 'linear'),
      kf(15, 'opacity', 0, 'linear'),
    ],
  },
  {
    id: 'slide-out-left',
    name: 'Slide Out Left',
    category: 'exit',
    durationFrames: 15,
    description: 'Slide off to the left',
    tags: ['slide', 'left', 'exit'],
    keyframes: [
      kf(0, 'freeX', 0, 'ease-in'),
      kf(15, 'freeX', -300, 'linear'),
      kf(15, 'opacity', 0, 'linear'),
    ],
  },
  {
    id: 'spin-out',
    name: 'Spin Out',
    category: 'exit',
    durationFrames: 18,
    description: 'Rotate and scale down to nothing',
    tags: ['spin', 'rotate', 'shrink'],
    keyframes: [
      kf(0, 'scale', 1, 'ease-in'),
      kf(0, 'rotation', 0, 'ease-in'),
      kf(0, 'opacity', 1, 'ease-in'),
      kf(18, 'scale', 0, 'linear'),
      kf(18, 'rotation', 180, 'linear'),
      kf(18, 'opacity', 0, 'linear'),
    ],
  },
  {
    id: 'collapse',
    name: 'Collapse',
    category: 'exit',
    durationFrames: 12,
    description: 'Squash vertically to nothing',
    tags: ['collapse', 'squash', 'vertical'],
    keyframes: [
      kf(0, 'scaleY', 1, 'ease-in'),
      kf(0, 'opacity', 1, 'linear'),
      kf(12, 'scaleY', 0, 'linear'),
      kf(12, 'opacity', 0, 'linear'),
    ],
  },
  {
    id: 'fall-away',
    name: 'Fall Away',
    category: 'exit',
    durationFrames: 20,
    description: 'Drop and fall off screen with rotation',
    tags: ['fall', 'drop', 'gravity', 'rotate'],
    keyframes: [
      kf(0, 'freeY', 0, 'ease-in'),
      kf(0, 'rotation', 0, 'ease-in'),
      kf(0, 'opacity', 1, 'linear'),
      kf(15, 'freeY', 300, 'linear'),
      kf(15, 'rotation', 30, 'linear'),
      kf(20, 'opacity', 0, 'linear'),
    ],
  },
  {
    id: 'dissolve',
    name: 'Dissolve',
    category: 'exit',
    durationFrames: 25,
    description: 'Slow gentle fade with slight scale',
    tags: ['dissolve', 'fade', 'slow', 'gentle'],
    keyframes: [
      kf(0, 'opacity', 1, 'ease-in-out'),
      kf(0, 'scale', 1, 'ease-in-out'),
      kf(25, 'opacity', 0, 'linear'),
      kf(25, 'scale', 1.03, 'linear'),
    ],
  },
  {
    id: 'fly-out-up',
    name: 'Fly Out Up',
    category: 'exit',
    durationFrames: 12,
    description: 'Quick fly up and disappear',
    tags: ['fly', 'up', 'fast'],
    keyframes: [
      kf(0, 'freeY', 0, 'ease-in'),
      kf(0, 'scale', 1, 'ease-in'),
      kf(12, 'freeY', -400, 'linear'),
      kf(12, 'scale', 0.5, 'linear'),
      kf(12, 'opacity', 0, 'linear'),
    ],
  },
  {
    id: 'poof',
    name: 'Poof',
    category: 'exit',
    durationFrames: 10,
    description: 'Quick burst/scale-up and vanish',
    tags: ['poof', 'burst', 'vanish', 'fun'],
    keyframes: [
      kf(0, 'scale', 1, 'ease-out'),
      kf(0, 'opacity', 1, 'linear'),
      kf(6, 'scale', 1.4, 'ease-out'),
      kf(10, 'scale', 1.8, 'linear'),
      kf(10, 'opacity', 0, 'linear'),
    ],
  },
  {
    id: 'sink-out',
    name: 'Sink Out',
    category: 'exit',
    durationFrames: 20,
    description: 'Slow sink downward and fade',
    tags: ['sink', 'down', 'slow', 'elegant'],
    keyframes: [
      kf(0, 'freeY', 0, 'ease-in-out'),
      kf(0, 'opacity', 1, 'ease-in'),
      kf(0, 'scale', 1, 'ease-in'),
      kf(20, 'freeY', 50, 'linear'),
      kf(20, 'opacity', 0, 'linear'),
      kf(20, 'scale', 0.9, 'linear'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // EMPHASIS (12)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'pulse',
    name: 'Pulse',
    category: 'emphasis',
    durationFrames: 20,
    description: 'Scale up then back to normal',
    tags: ['pulse', 'scale', 'attention'],
    keyframes: [
      kf(0, 'scale', 1, 'ease-in-out'),
      kf(10, 'scale', 1.15, 'ease-in-out'),
      kf(20, 'scale', 1, 'linear'),
    ],
  },
  {
    id: 'shake',
    name: 'Shake',
    category: 'emphasis',
    durationFrames: 18,
    description: 'Quick horizontal shake',
    tags: ['shake', 'horizontal', 'error', 'no'],
    keyframes: [
      kf(0, 'freeX', 0, 'linear'),
      kf(3, 'freeX', -10, 'linear'),
      kf(6, 'freeX', 10, 'linear'),
      kf(9, 'freeX', -8, 'linear'),
      kf(12, 'freeX', 8, 'linear'),
      kf(15, 'freeX', -4, 'linear'),
      kf(18, 'freeX', 0, 'linear'),
    ],
  },
  {
    id: 'wobble',
    name: 'Wobble',
    category: 'emphasis',
    durationFrames: 24,
    description: 'Rotational wobble back and forth',
    tags: ['wobble', 'rotate', 'playful'],
    keyframes: [
      kf(0, 'rotation', 0, 'ease-in-out'),
      kf(4, 'rotation', -15, 'ease-in-out'),
      kf(8, 'rotation', 12, 'ease-in-out'),
      kf(12, 'rotation', -8, 'ease-in-out'),
      kf(16, 'rotation', 5, 'ease-in-out'),
      kf(20, 'rotation', -2, 'ease-in-out'),
      kf(24, 'rotation', 0, 'linear'),
    ],
  },
  {
    id: 'jello',
    name: 'Jello',
    category: 'emphasis',
    durationFrames: 28,
    description: 'Springy rotation wiggle like jello',
    tags: ['jello', 'spring', 'fun', 'rotate'],
    keyframes: [
      kf(0, 'rotation', 0, 'ease-in-out'),
      kf(4, 'rotation', -12, 'ease-in-out'),
      kf(8, 'rotation', 7, 'ease-in-out'),
      kf(12, 'rotation', -5, 'ease-in-out'),
      kf(16, 'rotation', 3, 'ease-in-out'),
      kf(20, 'rotation', -2, 'ease-in-out'),
      kf(24, 'rotation', 1, 'ease-in-out'),
      kf(28, 'rotation', 0, 'linear'),
    ],
  },
  {
    id: 'rubber-band',
    name: 'Rubber Band',
    category: 'emphasis',
    durationFrames: 20,
    description: 'Stretch and snap back',
    tags: ['rubber', 'stretch', 'snap', 'elastic'],
    keyframes: [
      kf(0, 'scaleX', 1, 'ease-out'),
      kf(0, 'scaleY', 1, 'ease-out'),
      kf(6, 'scaleX', 1.25, 'ease-in-out'),
      kf(6, 'scaleY', 0.75, 'ease-in-out'),
      kf(10, 'scaleX', 0.85, 'ease-in-out'),
      kf(10, 'scaleY', 1.15, 'ease-in-out'),
      kf(14, 'scaleX', 1.1, 'ease-in-out'),
      kf(14, 'scaleY', 0.9, 'ease-in-out'),
      kf(20, 'scaleX', 1, 'linear'),
      kf(20, 'scaleY', 1, 'linear'),
    ],
  },
  {
    id: 'flash',
    name: 'Flash',
    category: 'emphasis',
    durationFrames: 18,
    description: 'Quick opacity flash (blink twice)',
    tags: ['flash', 'blink', 'attention'],
    keyframes: [
      kf(0, 'opacity', 1, 'linear'),
      kf(4, 'opacity', 0.2, 'linear'),
      kf(8, 'opacity', 1, 'linear'),
      kf(12, 'opacity', 0.2, 'linear'),
      kf(18, 'opacity', 1, 'linear'),
    ],
  },
  {
    id: 'tada',
    name: 'Tada',
    category: 'emphasis',
    durationFrames: 22,
    description: 'Scale up with rotation wiggle — celebration!',
    tags: ['tada', 'celebrate', 'fun', 'attention'],
    keyframes: [
      kf(0, 'scale', 1, 'ease-out'),
      kf(0, 'rotation', 0, 'ease-out'),
      kf(4, 'scale', 0.95, 'ease-in-out'),
      kf(4, 'rotation', -3, 'ease-in-out'),
      kf(8, 'scale', 1.1, 'ease-in-out'),
      kf(8, 'rotation', 3, 'ease-in-out'),
      kf(11, 'rotation', -3, 'ease-in-out'),
      kf(14, 'rotation', 3, 'ease-in-out'),
      kf(17, 'rotation', -2, 'ease-in-out'),
      kf(22, 'scale', 1, 'linear'),
      kf(22, 'rotation', 0, 'linear'),
    ],
  },
  {
    id: 'heartbeat',
    name: 'Heartbeat',
    category: 'emphasis',
    durationFrames: 24,
    description: 'Double-pulse scale like a heartbeat',
    tags: ['heartbeat', 'pulse', 'medical', 'alive'],
    keyframes: [
      kf(0, 'scale', 1, 'ease-out'),
      kf(4, 'scale', 1.15, 'ease-in'),
      kf(8, 'scale', 1, 'ease-out'),
      kf(12, 'scale', 1.25, 'ease-in'),
      kf(18, 'scale', 1, 'ease-out'),
      kf(24, 'scale', 1, 'linear'),
    ],
  },
  {
    id: 'bounce',
    name: 'Bounce',
    category: 'emphasis',
    durationFrames: 16,
    description: 'Quick vertical bounce',
    tags: ['bounce', 'jump', 'vertical'],
    keyframes: [
      kf(0, 'freeY', 0, 'ease-in'),
      kf(5, 'freeY', -25, 'ease-out'),
      kf(10, 'freeY', 0, 'ease-in'),
      kf(13, 'freeY', -8, 'ease-out'),
      kf(16, 'freeY', 0, 'linear'),
    ],
  },
  {
    id: 'head-shake',
    name: 'Head Shake',
    category: 'emphasis',
    durationFrames: 20,
    description: 'Subtle horizontal shake with rotation — disagreement',
    tags: ['shake', 'no', 'disagree', 'subtle'],
    keyframes: [
      kf(0, 'freeX', 0, 'ease-in-out'),
      kf(0, 'rotation', 0, 'ease-in-out'),
      kf(5, 'freeX', -6, 'ease-in-out'),
      kf(5, 'rotation', -5, 'ease-in-out'),
      kf(10, 'freeX', 5, 'ease-in-out'),
      kf(10, 'rotation', 4, 'ease-in-out'),
      kf(15, 'freeX', -3, 'ease-in-out'),
      kf(15, 'rotation', -2, 'ease-in-out'),
      kf(20, 'freeX', 0, 'linear'),
      kf(20, 'rotation', 0, 'linear'),
    ],
  },
  {
    id: 'squeeze',
    name: 'Squeeze',
    category: 'emphasis',
    durationFrames: 14,
    description: 'Quick squash and stretch',
    tags: ['squash', 'stretch', 'squeeze'],
    keyframes: [
      kf(0, 'scaleX', 1, 'ease-in'),
      kf(0, 'scaleY', 1, 'ease-in'),
      kf(5, 'scaleX', 1.2, 'ease-out'),
      kf(5, 'scaleY', 0.8, 'ease-out'),
      kf(10, 'scaleX', 0.9, 'ease-in-out'),
      kf(10, 'scaleY', 1.1, 'ease-in-out'),
      kf(14, 'scaleX', 1, 'linear'),
      kf(14, 'scaleY', 1, 'linear'),
    ],
  },
  {
    id: 'nod',
    name: 'Nod',
    category: 'emphasis',
    durationFrames: 16,
    description: 'Vertical nod motion — agreement',
    tags: ['nod', 'yes', 'agree', 'vertical'],
    keyframes: [
      kf(0, 'freeY', 0, 'ease-in-out'),
      kf(4, 'freeY', 8, 'ease-in-out'),
      kf(8, 'freeY', 0, 'ease-in-out'),
      kf(11, 'freeY', 5, 'ease-in-out'),
      kf(16, 'freeY', 0, 'linear'),
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  // TRANSITIONS (8)
  // ═══════════════════════════════════════════════════════════════════

  {
    id: 'move-left',
    name: 'Move Left',
    category: 'transition',
    durationFrames: 20,
    description: 'Smooth move to the left',
    tags: ['move', 'left', 'slide'],
    keyframes: [
      kf(0, 'freeX', 0, 'ease-in-out'),
      kf(20, 'freeX', -100, 'linear'),
    ],
  },
  {
    id: 'move-right',
    name: 'Move Right',
    category: 'transition',
    durationFrames: 20,
    description: 'Smooth move to the right',
    tags: ['move', 'right', 'slide'],
    keyframes: [
      kf(0, 'freeX', 0, 'ease-in-out'),
      kf(20, 'freeX', 100, 'linear'),
    ],
  },
  {
    id: 'scale-up',
    name: 'Scale Up',
    category: 'transition',
    durationFrames: 18,
    description: 'Smooth scale increase',
    tags: ['scale', 'grow', 'bigger'],
    keyframes: [
      kf(0, 'scale', 1, 'ease-in-out'),
      kf(18, 'scale', 1.5, 'linear'),
    ],
  },
  {
    id: 'scale-down',
    name: 'Scale Down',
    category: 'transition',
    durationFrames: 18,
    description: 'Smooth scale decrease',
    tags: ['scale', 'shrink', 'smaller'],
    keyframes: [
      kf(0, 'scale', 1, 'ease-in-out'),
      kf(18, 'scale', 0.7, 'linear'),
    ],
  },
  {
    id: 'rotate-90',
    name: 'Rotate 90',
    category: 'transition',
    durationFrames: 15,
    description: 'Quarter turn rotation',
    tags: ['rotate', 'turn', 'quarter'],
    keyframes: [
      kf(0, 'rotation', 0, 'ease-in-out'),
      kf(15, 'rotation', 90, 'linear'),
    ],
  },
  {
    id: 'rotate-360',
    name: 'Full Spin',
    category: 'transition',
    durationFrames: 24,
    description: 'Complete 360 degree rotation',
    tags: ['rotate', 'spin', 'full'],
    keyframes: [
      kf(0, 'rotation', 0, 'ease-in-out'),
      kf(24, 'rotation', 360, 'linear'),
    ],
  },
  {
    id: 'float-up',
    name: 'Float Up',
    category: 'transition',
    durationFrames: 30,
    description: 'Gentle drift upward',
    tags: ['float', 'up', 'drift', 'gentle'],
    keyframes: [
      kf(0, 'freeY', 0, 'ease-in-out'),
      kf(0, 'opacity', 1, 'ease-in-out'),
      kf(24, 'freeY', -60, 'linear'),
      kf(24, 'opacity', 1, 'linear'),
      kf(30, 'freeY', -80, 'linear'),
      kf(30, 'opacity', 0.7, 'linear'),
    ],
  },
  {
    id: 'pendulum-swing',
    name: 'Pendulum Swing',
    category: 'transition',
    durationFrames: 30,
    description: 'Pendulum-like rotation back and forth',
    tags: ['pendulum', 'swing', 'rotate', 'oscillate'],
    keyframes: [
      kf(0, 'rotation', 0, 'ease-in-out'),
      kf(8, 'rotation', 25, 'ease-in-out'),
      kf(15, 'rotation', 0, 'ease-in-out'),
      kf(22, 'rotation', -20, 'ease-in-out'),
      kf(30, 'rotation', 0, 'linear'),
    ],
  },
]

// ── Lookup Helpers ────────────────────────────────────────────────────

/** Get presets by category */
export function getPresetsByCategory(category: PresetCategory): AnimationPreset[] {
  return ANIMATION_PRESETS.filter((p) => p.category === category)
}

/** Get preset by ID */
export function getPresetById(id: string): AnimationPreset | undefined {
  return ANIMATION_PRESETS.find((p) => p.id === id)
}

/** Search presets by tags or name */
export function searchPresets(query: string): AnimationPreset[] {
  const q = query.toLowerCase()
  return ANIMATION_PRESETS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.tags.some((tag) => tag.includes(q)) ||
      p.description.toLowerCase().includes(q)
  )
}

/**
 * Apply a preset to an object at a given start frame.
 * Returns the keyframe data ready to be fed into the keyframe store.
 *
 * @param preset - Animation preset to apply
 * @param objectRef - Target canvas object
 * @param startFrame - Frame to begin the animation
 * @param fps - Current FPS (preset durations scale from 30fps base)
 * @param baseValues - Current property values of the object (for relative presets)
 */
export function applyPreset(
  preset: AnimationPreset,
  objectRef: CanvasObjectRef,
  startFrame: number,
  fps = 30,
  baseValues?: Record<string, number>,
): Array<{
  objectRef: CanvasObjectRef
  property: string
  frame: number
  value: number
  easing: EasingType
}> {
  const fpsScale = fps / 30
  const result: Array<{
    objectRef: CanvasObjectRef
    property: string
    frame: number
    value: number
    easing: EasingType
  }> = []

  for (const kf of preset.keyframes) {
    const scaledFrame = startFrame + Math.round(kf.frameOffset * fpsScale)
    let value = kf.value

    // For position-based presets, add base values if provided
    if (baseValues && (kf.property === 'freeX' || kf.property === 'freeY' ||
        kf.property === 'position.x' || kf.property === 'position.y')) {
      const base = baseValues[kf.property]
      if (base !== undefined) {
        value += base
      }
    }

    result.push({
      objectRef,
      property: kf.property,
      frame: scaledFrame,
      value,
      easing: kf.easing,
    })
  }

  return result
}
