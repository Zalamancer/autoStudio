/**
 * Professional motion design system.
 * Provides color harmony, typography animation, visual flow,
 * timing intelligence, and AI generation integration.
 */

export {
  generatePalette,
  paletteFromMood,
  paletteGradient,
  hexToHsl,
  hslToHex,
  type ColorPalette,
  type HarmonyStrategy,
  type PaletteMood,
} from './colorHarmony'

export {
  splitText,
  computeUnitStyle,
  suggestPreset,
  TYPOGRAPHY_PRESETS,
  type TextAnimationType,
  type TextSplitMode,
  type TypographyAnimationConfig,
  type TypographyStyle,
  type ComputedCharStyle,
} from './typographyEngine'

export {
  computeFlowTiming,
  computeTransitionStyle,
  suggestFlowPattern,
  FLOW_PATTERNS,
  type FlowTransitionType,
  type FlowRole,
  type FlowElement,
  type FlowTransition,
  type FlowSequence,
  type FlowPattern,
} from './visualFlow'

export {
  extractPauses,
  extractEmotionCues,
  estimateBeats,
  findTimingWindows,
  distributeTransitions,
  snapToFrame,
  alignToTimingWindows,
  type AudioBeat,
  type DialoguePause,
  type EmotionCue,
  type TimingWindow,
} from './timingIntelligence'
