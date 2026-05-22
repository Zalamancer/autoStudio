export {
  CompositionProvider,
  useFrame,
  useComposition,
  type CompositionContextValue,
} from './CompositionContext'

export {
  CompositionPlayer,
  type CompositionPlayerRef,
} from './CompositionPlayer'

export { Fill, Clip, AudioTrack, VideoTrack } from './primitives'

export { interpolate, type InterpolateOptions } from './interpolate'

export { spring, measureSpring, type SpringConfig } from './spring'

export { Easing, getEasingByName } from './easing'

export { loop, pingPong } from './loop'

// ── Animation Engine Extensions ─────────────────────────────────────

export {
  calculateStagger,
  generateStaggeredKeyframes,
  StaggerPresets,
  type StaggerConfig,
  type StaggerDirection,
  type StaggerResult,
} from './stagger'

export {
  getAttentionTransform,
  getAttentionTransformAtFrame,
  AttentionPresets,
  type AttentionConfig,
  type AttentionType,
  type AttentionTransform,
} from './attention'

export {
  createParticleSystem,
  updateParticleSystem,
  renderParticles,
  burstEffect,
  type ParticleSystem,
  type ParticleConfig,
  type ParticleEffectType,
  type Particle,
  type ParticleEmitter,
} from './particles'

export {
  evaluatePath,
  evaluatePathAtFrame,
  PathPresets,
  type PathConfig,
  type PathResult,
  type PathType,
  type Point2D,
} from './path'

export {
  ANIMATION_PRESETS,
  getPresetsByCategory,
  getPresetById,
  searchPresets,
  applyPreset,
  type AnimationPreset,
  type PresetCategory,
} from './presets'

export {
  detectBeats,
  estimateBPM,
  generateBeatsFromBPM,
  generateBeatKeyframes,
  beatsToFrames,
  snapToBeat,
  getBeatFramesInRange,
  type Beat,
  type BeatSyncConfig,
  type BeatKeyframe,
} from './beatSync'

export {
  autoAnimateElement,
  autoAnimateElements,
  type AutoAnimateOptions,
  type AutoAnimateResult,
  type ElementRole,
  type ElementToAnimate,
} from './autoAnimate'
