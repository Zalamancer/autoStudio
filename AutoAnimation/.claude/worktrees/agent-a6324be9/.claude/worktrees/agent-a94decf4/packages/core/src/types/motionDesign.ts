/**
 * Types for AI-generated motion design descriptions.
 * Gemini outputs this JSON structure; DynamicMotionDesignRenderer interprets it.
 */

import type { FieldDescriptor } from './motionGraphic'

export type EasingName =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'cubicIn'
  | 'cubicOut'
  | 'cubicInOut'
  | 'elasticIn'
  | 'elasticOut'
  | 'bounceIn'
  | 'bounceOut'
  | 'backIn'
  | 'backOut'
  | 'backInOut'

export interface AnimatableProps {
  opacity?: number
  x?: number
  y?: number
  scale?: number
  scaleX?: number
  scaleY?: number
  rotation?: number
  blur?: number
}

export interface MotionElementAnimation {
  /** Stagger offset 0-1 within the enter phase */
  enterDelay?: number
  enter?: {
    from: Partial<AnimatableProps>
    easing?: EasingName
  }
  hold?: {
    effect?: 'pulse' | 'glow' | 'float' | 'breathe'
    amplitude?: number
    speed?: number
  }
  exit?: {
    to: Partial<AnimatableProps>
    easing?: EasingName
  }
}

export interface MotionElement {
  id: string
  type: 'text' | 'rect' | 'circle' | 'group' | 'line' | 'counter' | 'bar' | 'arc' | 'icon'
  /** Text content — supports {{configKey}} interpolation */
  text?: string
  /** Typography animation preset name (e.g. 'elegant-fade', 'character-pop') */
  typographyPreset?: string
  /** Target number for counter type */
  counterTarget?: number
  /** Suffix for counter display, e.g. "%", "K" */
  counterSuffix?: string
  /** Fill percentage 0-100 for bar type */
  barPercent?: number
  /** Arc sweep angle 0-360 for arc type */
  arcAngle?: number
  /** CSS styles */
  style?: Record<string, string | number>
  /** Layout mode for group containers */
  layout?: 'flex-row' | 'flex-column' | 'grid' | 'absolute'
  gap?: string | number
  gridColumns?: string
  /** Nested elements */
  children?: MotionElement[]
  animation?: MotionElementAnimation
}

export interface MotionDesignDescription {
  name: string
  description: string
  /** CSS background value — supports {{configKey}} interpolation */
  background: string
  configSchema: FieldDescriptor[]
  defaultConfig: Record<string, unknown>
  /** Fraction of total progress for enter phase (e.g. 0.2 = first 20%) */
  enterDuration: number
  /** Fraction of total progress for exit phase (e.g. 0.2 = last 20%) */
  exitDuration: number
  elements: MotionElement[]
  /** Optional color palette for cohesive theming */
  palette?: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
  /** Flow role for visual sequencing */
  flowRole?: string
  /** Typography preset to apply to all text elements by default */
  defaultTypographyPreset?: string
}
