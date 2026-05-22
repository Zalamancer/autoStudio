// @proanimate/core — shared animation logic
export { Easing, getEasingByName } from './easing'
export { computeKineticPhase } from './timing'
export type { KineticPhaseResult } from './timing'
export { lerp, interpolateProps, interpolateConfig } from './interpolation'
export { computeHoldEffect } from './holdEffects'
export type { HoldEffectResult } from './holdEffects'
export {
  splitText,
  computeUnitStyle,
  suggestPreset,
  TYPOGRAPHY_PRESETS,
} from './typographyEngine'
export type {
  TextAnimationType,
  TextSplitMode,
  TypographyAnimationConfig,
  TypographyStyle,
  ComputedCharStyle,
} from './typographyEngine'
export * from './types'
