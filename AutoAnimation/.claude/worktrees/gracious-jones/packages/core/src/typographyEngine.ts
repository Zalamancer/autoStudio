/**
 * Professional typography animation engine.
 * Provides advanced text animation effects beyond simple CSS transitions:
 * - Per-character/word/line staggered reveals
 * - Weight animation (variable font weight interpolation)
 * - Tracking (letter-spacing) animation
 * - Typewriter with cursor
 * - Split text with independent transforms
 * - Kinetic typography presets
 */

import { Easing } from './easing'

// ── Types ──

export type TextAnimationType =
  | 'fade-in'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale-up'
  | 'scale-down'
  | 'typewriter'
  | 'blur-in'
  | 'rotate-in'
  | 'elastic-pop'
  | 'wave'
  | 'cascade'
  | 'weight-morph'
  | 'tracking-expand'
  | 'glitch-reveal'
  | 'mask-wipe'

export type TextSplitMode = 'none' | 'character' | 'word' | 'line'

export interface TypographyAnimationConfig {
  type: TextAnimationType
  splitMode: TextSplitMode
  /** Stagger delay between split units (0-1 fraction of enter duration) */
  stagger: number
  /** Easing function name */
  easing: 'cubicOut' | 'elasticOut' | 'backOut' | 'bounceOut' | 'linear'
  /** Duration of the reveal as fraction of total progress (0.1-0.5) */
  enterDuration: number
  /** Duration of exit animation (0.05-0.3) */
  exitDuration: number
}

export interface TypographyStyle {
  text: string
  fontSize: string
  fontWeight: number
  fontFamily: string
  color: string
  letterSpacing: string
  lineHeight: number
  textTransform?: 'uppercase' | 'lowercase' | 'capitalize' | 'none'
  textAlign?: 'left' | 'center' | 'right'
}

export interface ComputedCharStyle {
  opacity: number
  x: number
  y: number
  scale: number
  rotation: number
  blur: number
  fontWeight: number
  letterSpacing: number
  /** For typewriter cursor */
  showCursor: boolean
}

// ── Easing lookup ──

const EASING_FNS: Record<string, (t: number) => number> = {
  cubicOut: Easing.cubicOut,
  elasticOut: Easing.elasticOut,
  backOut: Easing.backOut,
  bounceOut: Easing.bounceOut,
  linear: Easing.linear,
}

// ── Split text ──

export function splitText(text: string, mode: TextSplitMode): string[] {
  switch (mode) {
    case 'character':
      return text.split('')
    case 'word':
      return text.split(/(\s+)/).filter(Boolean)
    case 'line':
      return text.split('\n')
    case 'none':
    default:
      return [text]
  }
}

// ── Compute per-unit animation ──

export function computeUnitStyle(
  unitIndex: number,
  totalUnits: number,
  progress: number,
  config: TypographyAnimationConfig,
): ComputedCharStyle {
  const easing = EASING_FNS[config.easing] ?? Easing.cubicOut

  // Calculate stagger offset for this unit
  const staggerOffset = totalUnits > 1
    ? (unitIndex / (totalUnits - 1)) * config.stagger
    : 0

  // Enter phase
  const enterStart = staggerOffset * config.enterDuration
  const enterEnd = config.enterDuration
  let enterT = 0
  if (progress >= enterEnd) {
    enterT = 1
  } else if (progress > enterStart) {
    const range = enterEnd - enterStart
    enterT = range > 0 ? easing((progress - enterStart) / range) : 1
  }

  // Exit phase
  const exitStart = 1 - config.exitDuration
  let exitT = 0
  if (progress >= exitStart) {
    const exitStaggerOffset = totalUnits > 1
      ? ((totalUnits - 1 - unitIndex) / (totalUnits - 1)) * config.stagger * 0.5
      : 0
    const effectiveExitStart = exitStart + exitStaggerOffset * config.exitDuration
    if (progress >= effectiveExitStart) {
      exitT = Math.min(1, (progress - effectiveExitStart) / (1 - effectiveExitStart))
      exitT = Easing.cubicIn(exitT)
    }
  }

  // Default style
  const result: ComputedCharStyle = {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    blur: 0,
    fontWeight: 400,
    letterSpacing: 0,
    showCursor: false,
  }

  // Apply animation type
  switch (config.type) {
    case 'fade-in':
      result.opacity = enterT * (1 - exitT)
      break

    case 'slide-up':
      result.y = (1 - enterT) * 40 + exitT * -30
      result.opacity = enterT * (1 - exitT)
      break

    case 'slide-down':
      result.y = (1 - enterT) * -40 + exitT * 30
      result.opacity = enterT * (1 - exitT)
      break

    case 'slide-left':
      result.x = (1 - enterT) * 50 + exitT * -40
      result.opacity = enterT * (1 - exitT)
      break

    case 'slide-right':
      result.x = (1 - enterT) * -50 + exitT * 40
      result.opacity = enterT * (1 - exitT)
      break

    case 'scale-up':
      result.scale = enterT * (1 - exitT * 0.5)
      result.opacity = enterT * (1 - exitT)
      break

    case 'scale-down':
      result.scale = 2 - enterT + exitT * 0.5
      result.opacity = enterT * (1 - exitT)
      break

    case 'typewriter': {
      // Binary reveal with cursor
      const revealProgress = progress / Math.max(0.01, config.enterDuration)
      const revealIndex = Math.floor(revealProgress * totalUnits)
      result.opacity = unitIndex <= revealIndex ? 1 - exitT : 0
      result.showCursor = unitIndex === revealIndex && exitT === 0
      break
    }

    case 'blur-in':
      result.blur = (1 - enterT) * 12
      result.opacity = enterT * (1 - exitT)
      break

    case 'rotate-in':
      result.rotation = (1 - enterT) * 90 - exitT * 45
      result.opacity = enterT * (1 - exitT)
      result.scale = 0.5 + enterT * 0.5
      break

    case 'elastic-pop':
      result.scale = enterT * (1 - exitT * 0.8)
      result.opacity = Math.min(1, enterT * 3) * (1 - exitT)
      break

    case 'wave': {
      const wavePhase = progress * Math.PI * 4 - unitIndex * 0.5
      result.y = Math.sin(wavePhase) * 8 * (1 - exitT)
      result.opacity = enterT * (1 - exitT)
      break
    }

    case 'cascade':
      result.y = (1 - enterT) * 60
      result.x = (1 - enterT) * -20
      result.rotation = (1 - enterT) * -15
      result.opacity = enterT * (1 - exitT)
      break

    case 'weight-morph':
      result.fontWeight = 100 + enterT * 700
      result.opacity = Math.min(1, enterT * 2) * (1 - exitT)
      break

    case 'tracking-expand':
      result.letterSpacing = (1 - enterT) * 20 - exitT * 10
      result.opacity = enterT * (1 - exitT)
      break

    case 'glitch-reveal': {
      const glitchPhase = enterT < 1 ? enterT : 1
      const glitchActive = glitchPhase > 0 && glitchPhase < 0.9
      result.opacity = enterT > 0.1 ? 1 - exitT : 0
      if (glitchActive) {
        const jitter = Math.sin(progress * 200 + unitIndex * 50)
        result.x = jitter * 3 * (1 - enterT)
        result.y = Math.cos(progress * 150 + unitIndex * 30) * 2 * (1 - enterT)
      }
      break
    }

    case 'mask-wipe':
      result.opacity = enterT > 0 ? 1 - exitT : 0
      // Simulated clip by using x-offset pushing from left
      result.x = (1 - enterT) * -10
      break
  }

  return result
}

// ── Preset configurations ──

export const TYPOGRAPHY_PRESETS: Record<string, TypographyAnimationConfig> = {
  'elegant-fade': {
    type: 'fade-in',
    splitMode: 'word',
    stagger: 0.4,
    easing: 'cubicOut',
    enterDuration: 0.25,
    exitDuration: 0.15,
  },
  'dynamic-slide': {
    type: 'slide-up',
    splitMode: 'word',
    stagger: 0.3,
    easing: 'backOut',
    enterDuration: 0.2,
    exitDuration: 0.1,
  },
  'character-pop': {
    type: 'elastic-pop',
    splitMode: 'character',
    stagger: 0.6,
    easing: 'elasticOut',
    enterDuration: 0.3,
    exitDuration: 0.15,
  },
  'typewriter-classic': {
    type: 'typewriter',
    splitMode: 'character',
    stagger: 0,
    easing: 'linear',
    enterDuration: 0.6,
    exitDuration: 0.1,
  },
  'kinetic-cascade': {
    type: 'cascade',
    splitMode: 'word',
    stagger: 0.5,
    easing: 'backOut',
    enterDuration: 0.25,
    exitDuration: 0.15,
  },
  'weight-morph': {
    type: 'weight-morph',
    splitMode: 'character',
    stagger: 0.3,
    easing: 'cubicOut',
    enterDuration: 0.3,
    exitDuration: 0.15,
  },
  'glitch-hack': {
    type: 'glitch-reveal',
    splitMode: 'character',
    stagger: 0.2,
    easing: 'linear',
    enterDuration: 0.2,
    exitDuration: 0.1,
  },
  'tracking-reveal': {
    type: 'tracking-expand',
    splitMode: 'none',
    stagger: 0,
    easing: 'cubicOut',
    enterDuration: 0.3,
    exitDuration: 0.15,
  },
  'blur-focus': {
    type: 'blur-in',
    splitMode: 'word',
    stagger: 0.3,
    easing: 'cubicOut',
    enterDuration: 0.25,
    exitDuration: 0.1,
  },
  'wave-playful': {
    type: 'wave',
    splitMode: 'character',
    stagger: 0.4,
    easing: 'cubicOut',
    enterDuration: 0.2,
    exitDuration: 0.15,
  },
}

/**
 * Pick the best typography preset based on content analysis.
 * Considers text length, emotion, and context.
 */
export function suggestPreset(
  text: string,
  context?: { emotion?: string; role?: string },
): string {
  const wordCount = text.split(/\s+/).length
  const emotion = context?.emotion?.toLowerCase() ?? ''
  const role = context?.role?.toLowerCase() ?? ''

  // Short titles - impactful animations
  if (wordCount <= 3) {
    if (emotion === 'joy' || emotion === 'excited') return 'character-pop'
    if (emotion === 'anger' || emotion === 'intense') return 'glitch-hack'
    if (role === 'title' || role === 'heading') return 'dynamic-slide'
    return 'tracking-reveal'
  }

  // Medium text - balanced animations
  if (wordCount <= 10) {
    if (role === 'subtitle' || role === 'lower-third') return 'elegant-fade'
    if (emotion === 'calm' || emotion === 'peaceful') return 'blur-focus'
    return 'kinetic-cascade'
  }

  // Long text - readable animations
  if (role === 'quote') return 'typewriter-classic'
  return 'elegant-fade'
}
