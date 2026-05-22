import type { Viseme, VisemeEvent, WordEvent } from '@/types/voice'
import type { EmotionEvent } from '@/services/emotionTimeline'
import type { VisemeFaceMapping, FaceExpressionMapping } from '@/types/character3d'
import type { PathConfig } from '@/engine/path'
import type { EasingType } from '@/types/keyframes'
import type { GradientFill } from '@/types/gradient'


export interface CharacterSpriteData {
  savedImages: {
    viseme: string[]
    eye: string[]
    eyebrow: string[]
    hair: string[]
    body: string[]
    head: string[]
    shirt: string[]
    pants: string[]
    shoes: string[]
  }
  transforms: {
    group: PartTransformData
    viseme: PartTransformData
    eye: PartTransformData
    eyebrow: PartTransformData
    hair: PartTransformData
    body: PartTransformData
    head: PartTransformData
    shirt: PartTransformData
    pants: PartTransformData
    shoes: PartTransformData
  }
  selectedSprites: {
    viseme: number | null
    eye: number | null
    eyebrow: number | null
    hair: number | null
    body: number | null
    head: number | null
    shirt: number | null
    pants: number | null
    shoes: number | null
  }
  visemeMapping: Record<Viseme, number | null>
  useCurvedVisemes: boolean
  curvedVisemes: Record<string, string | null>
  visemeSpriteMap?: Record<string, string | null>
  eyeVariantSprites?: Record<string, string | null>
  eyebrowVariantSprites?: Record<string, string | null>
}

export interface PartTransformData {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  visible: boolean
}

export interface AnimationData {
  id: string
  url: string
  category: 'background' | 'overlay'
  position: { x: number; y: number }
  scale: number
  opacity: number
  zIndex: number
  loop: boolean
  speed: number
  animationData?: object // inline Lottie JSON (takes priority over url)
  svgHtml?: string // SVG+CSS animation HTML (takes priority over url and animationData)
  blendMode?: string
  blur?: number
  blurType?: string
  motionBlurAngle?: number
}

export interface CaptionData {
  style: 'word-by-word' | 'sentence' | 'karaoke'
  fontSize: number
  position: 'top' | 'center' | 'bottom'
  color?: string
  bgOpacity?: number
  wordTimeline: WordEvent[]
  sentenceTimeline: Array<{
    sentence: string
    startFrame: number
    endFrame: number
    words: WordEvent[]
  }>
  presetId?: string
}

export interface DialogueCharacterData {
  id: string
  name: string
  position: { x: number; y: number }
  scale: number
  zIndex: number
  visible: boolean
  savedCharacter: CharacterSpriteData
  dialogueLines: Array<{
    id: string
    startFrame: number
    endFrame: number
    visemeTimeline: VisemeEvent[]
    emotionTimeline: EmotionEvent[]
    audioUrl: string | null
  }>
  /** When set to 'rigged', use RemotionRiggedCharacter instead of sprite renderer */
  renderMode?: 'sprite' | 'rigged'
  /** Rig export data for rigged mode */
  rigExportData?: RigExportData
  /**
   * Unscaled bounding box size as measured on the live canvas (computedBounds).
   * All renderers use this to correctly center the character at position.x/y.
   * Falls back to BASE_CHARACTER_SIZE (200) when not set.
   */
  boundsWidth?: number
  boundsHeight?: number
  /** Procedural animation identifier (e.g. 'idle', 'bounce') */
  proceduralAnim?: string
  /** Active style effect for per-character visual filters (woodcut, cel-shade, neon, etc.) */
  activeStyleEffect?: import('@/types/styleEffects').ActiveStyleEffect
}

export interface VideoLayerData {
  id: string
  sourceUrl: string
  position: { x: number; y: number }
  scale: number
  rotation: number
  opacity: number
  zIndex: number
  visible: boolean
  loop: boolean
  durationSeconds: number
  width: number
  height: number
  startFrame?: number
  endFrame?: number
}

export interface MediaLayerData {
  id: string
  imageUrl: string
  position: { x: number; y: number }
  scale: number
  opacity: number
  zIndex: number
  rotation: number
  visible: boolean
  startFrame: number
  endFrame: number
  blendMode?: string
  blur?: number
  blurType?: string
  motionBlurAngle?: number
  maskId?: string
  pathId?: string
  pathAutoRotate?: boolean
}

export interface TextOverlayData {
  id: string
  content: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  color: string
  align: string
  verticalAlign: string
  position: string
  freeX: number
  freeY: number
  lineHeight: number
  letterSpacing: number
  textCase: string
  shadow: boolean
  background: boolean
  backgroundOpacity: number
  backgroundColor?: string
  backgroundBorderRadius?: number
  backgroundPaddingX?: number
  backgroundPaddingY?: number
  backgroundBorder?: string
  textShadow?: string
  webkitTextStroke?: string
  opacity: number
  zIndex: number
  rotation: number
  width: number | null
  height: number | null
  startFrame: number
  endFrame: number
  animationPreset?: string
  blendMode?: string
  blur?: number
  blurType?: string
  motionBlurAngle?: number
  maskId?: string
  gradientFill?: GradientFill
}

export interface KeyframeExportTrack {
  objectType: string
  objectId: string
  property: string
  keyframes: Array<{
    frame: number
    value: number
    easing: string
    bezierParams?: { x1: number; y1: number; x2: number; y2: number }
  }>
}

export interface KeyframeExportData {
  tracks: KeyframeExportTrack[]
}

export interface ShapeLayerData {
  id: string
  type: 'rectangle' | 'circle' | 'triangle' | 'star'
  name: string
  position: { x: number; y: number }
  width: number
  height: number
  rotation: number
  fill: string | GradientFill
  stroke: string
  strokeWidth: number
  opacity: number
  zIndex: number
  visible: boolean
  startFrame: number
  endFrame: number
  borderRadius?: number
  points?: number
  innerRadius?: number
  blendMode?: string
  blur?: number
  blurType?: string
  motionBlurAngle?: number
  maskId?: string
  gradientFill?: GradientFill
  pathId?: string
  pathAutoRotate?: boolean
  /** ID of another shape to morph into (shape morphing target) */
  morphTargetId?: string
  /** Custom SVG path `d` string (overrides the type-based shape) */
  svgPath?: string
}

export interface Character3DExportData {
  id: string
  name: string
  /** GLB model as base64 for embedding in final export */
  glbBase64?: string
  /** GLB model as direct blob URL for preview (faster than base64) */
  glbUrl?: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: number
  visible: boolean
  /** Animation GLB as base64 (if character has an active animation) */
  activeAnimationGlbBase64?: string
  /** Animation GLB as direct blob URL for preview */
  activeAnimationGlbUrl?: string
  /** Frame where animation starts in the timeline */
  animationStartFrame: number
  animationSpeed: number
  /** Bone mapping (standard → actual bone names) for animation retargeting */
  boneMapping?: Record<string, string>
  /** Viseme face mapping config for 3D lip sync */
  visemeFaceMapping?: VisemeFaceMapping
  /** Pre-resolved viseme sprite map (curvature_viseme → data URL) */
  visemeSpriteMap?: Record<string, string | null>
  /** Viseme timeline for this character's dialogue */
  visemeTimeline?: VisemeEvent[]
  /** Emotion timeline for curvature selection */
  emotionTimeline?: EmotionEvent[]
  /** Face expression mapping config for 3D eye/eyebrow overlays */
  faceExpressionMapping?: FaceExpressionMapping
  /** Pre-resolved eye variant sprite map (variant → data URL) */
  eyeVariantSpriteMap?: Record<string, string | null>
  /** Pre-resolved eyebrow variant sprite map (variant → data URL) */
  eyebrowVariantSpriteMap?: Record<string, string | null>
  /** Spring bone chain definitions for physics simulation */
  springChains?: unknown[]
  /** Bone names that should have squash & stretch applied */
  squashStretchBones?: string[]
}

export interface HTMLTemplateExportData {
  id: string
  htmlContent: string
  name: string
  position: { x: number; y: number }
  scale: number
  opacity: number
  zIndex: number
  rotation: number
  visible: boolean
  width: number
  height: number
  startFrame: number
  endFrame: number
  /** Custom config values to send to the template */
  customConfig: Array<{ key: string; value: unknown }>
  /** Whether the template needs per-frame FRAME_UPDATE messages */
  frameSync: boolean
  /** Template's native aspect ratio (e.g. '16:9') */
  templateAspectRatio?: string
}

export interface MotionGraphicExportData {
  id: string
  templateId: string
  config: Record<string, unknown>
  position: { x: number; y: number }
  scale: number
  opacity: number
  zIndex: number
  rotation: number
  visible: boolean
  startFrame: number
  endFrame: number
}

export interface BackgroundAudioData {
  id: string
  url: string
  startFrame: number
  endFrame: number
  volume?: number
}

export interface RigExportData {
  id: string
  sourceImageUrl: string
  imageWidth: number
  imageHeight: number
  skeleton: {
    joints: Array<{
      id: string
      name: string
      parentId: string | null
      restPosition: { x: number; y: number }
      category: string
    }>
    rootJointId: string
  }
  meshGridSpacing: number
  restPose: Record<string, { dx: number; dy: number; rotation: number }>
  poseTracks: Array<{
    characterId: string
    keyframes: Array<{
      frame: number
      pose: Record<string, { dx: number; dy: number; rotation: number }>
      easing: string
    }>
  }>
  /** If authored in bonerigging, JSON-stringified SerializedRigData for full-fidelity playback */
  boneriggingSerializedData?: string
}

export interface RetentionHookData {
  type: 'progress-bar' | 'countdown' | 'chapter-marker' | 'wait-for-it' | 'step-counter'
  style: 'minimal' | 'neon' | 'gradient' | 'branded'
  position: 'top' | 'bottom'
  color?: string
  countdownFrom?: number
  chapters?: string[]
  triggerFrame?: number
  text?: string
  totalSteps?: number
  stepBoundaries?: number[]
}

export interface SVGCompositionExportData {
  width: number
  height: number
  background: string
  objects: Array<{
    id: string
    name: string
    zIndex: number
    visible: boolean
    colors: Record<string, string>
    svgMarkup: string
    keyframes: Array<{
      time: number
      x?: number
      y?: number
      rotation?: number
      scaleX?: number
      scaleY?: number
      opacity?: number
      easing?: string
    }>
    startFrame: number
    endFrame: number
    opacity: number
  }>
}

export interface WardrobeLayerData {
  id: string
  name: string
  spriteUrl: string
  position: { x: number; y: number }
  rotation: number
  scale: { x: number; y: number }
  visible: boolean
  zOrder: number
}

export interface AnnotationExportData {
  id: string
  type: 'arrow' | 'circle' | 'rectangle' | 'highlight' | 'text' | 'blur' | 'freehand'
  points: Array<{ x: number; y: number }>
  color: string
  thickness: number
  opacity: number
  startFrame: number
  endFrame: number
  animation: 'none' | 'fadeIn' | 'draw'
  visible: boolean
  textContent?: string
  blurRadius?: number
}

export interface CrowdMemberExportData {
  x: number
  y: number
  scale: number
  skinColor: string
  outfitColor: string
  swayPhase: number
  swaySpeed: number
  bobPhase: number
  bobSpeed: number
  opacity: number
  heightRatio: number
}

export interface CrowdExportData {
  id: string
  name: string
  visible: boolean
  startFrame: number
  endFrame: number
  members: CrowdMemberExportData[]
}

export interface PathAnimationData {
  id: string
  pathConfig: PathConfig
  objectRef: { objectType: string; objectId: string }
  startFrame: number
  endFrame: number
  autoRotate: boolean
  easing: EasingType
  loop: boolean
  constantSpeed: boolean
}

export interface MaskData {
  id: string
  name: string
  type: 'rectangle' | 'ellipse' | 'path' | 'layer'
  position: { x: number; y: number }
  width: number
  height: number
  rotation: number
  pathConfig?: PathConfig
  sourceLayerRef?: { objectType: string; objectId: string }
  inverted: boolean
  feather: number
  expansion: number
  opacity: number
}

export interface ClipTransitionExportData {
  /** Clip ID this transition belongs to */
  clipId: string
  /** Frame range of the clip */
  startFrame: number
  endFrame: number
  /** Transition-in config (applied at clip start) */
  transitionIn?: {
    type: string
    durationFrames: number
    easing: string
  }
  /** Transition-out config (applied at clip end) */
  transitionOut?: {
    type: string
    durationFrames: number
    easing: string
  }
}

export interface AudioReactiveExportData {
  id: string
  name: string
  type: 'bars' | 'waveform' | 'pulse' | 'circular' | 'spectrum'
  visible: boolean
  position: { x: number; y: number }
  width: number
  height: number
  rotation: number
  opacity: number
  zIndex: number
  startFrame: number
  endFrame: number
  audioSourceId: string | null
  barCount: number
  barWidth: number
  barGap: number
  barRadius: number
  color: string
  gradientColors: string[]
  useGradient: boolean
  mirrorX: boolean
  mirrorY: boolean
  sensitivity: number
  smoothing: number
  minFrequency: number
  maxFrequency: number
  minAmplitude: number
  maxAmplitude: number
  pulseScale: number
  pulseShape: 'circle' | 'ring' | 'square'
  lineWidth: number
  fillBelow: boolean
}

import type { ParticleEmitter } from '@/stores/useParticleStore'
export type ParticleEmitterExportData = ParticleEmitter

export interface VideoCompositionProps {
  fps: number
  durationInFrames: number
  width: number
  height: number
  character: CharacterSpriteData
  audioUrl: string | null
  visemeTimeline: VisemeEvent[]
  emotionTimeline: EmotionEvent[]
  captions: CaptionData
  animations: AnimationData[]
  dialogueCharacters?: DialogueCharacterData[]
  videos?: VideoLayerData[]
  mediaItems?: MediaLayerData[]
  textOverlays?: TextOverlayData[]
  shapes?: ShapeLayerData[]
  annotations?: AnnotationExportData[]
  artCurves?: import('@/types/artCurves').ArtCurveComposition[]
  keyframeData?: KeyframeExportData
  characters3D?: Character3DExportData[]
  htmlTemplates?: HTMLTemplateExportData[]
  /** React motion graphic instances */
  motionGraphics?: MotionGraphicExportData[]
  /** SVG object composition for animated SVG scenes */
  svgComposition?: SVGCompositionExportData
  /** Lottie animations (background / overlay) for reframing */
  lottieAnimations?: Array<{ scale?: number; [key: string]: unknown }>
  /** Background music / audio tracks from useMediaStore */
  backgroundAudio?: BackgroundAudioData[]
  /** 2D rigged character data for mesh deformation export */
  rigData?: RigExportData[]
  /** Pixel art characters for PixelLab 1D rendering */
  pixelArtCharacters?: import('./RemotionPixelArtCharacter').PixelArtCharacterExportData[]
  /** Avatar characters for AI video-based rendering */
  avatarCharacters?: import('./RemotionAvatarCharacter').AvatarCharacterExportData[]
  /** Path animation definitions */
  pathAnimations?: PathAnimationData[]
  /** Mask definitions */
  masks?: MaskData[]
  /** Retention hook widgets (progress bar, countdown, etc.) */
  retentionHooks?: RetentionHookData[]
  /** 3D camera position [x, y, z] — read from editor canvas store */
  cameraPosition?: [number, number, number]
  /** 3D camera field of view in degrees */
  cameraFov?: number
  /** 3D ambient light intensity */
  ambientIntensity?: number
  /** 3D key light intensity */
  keyLightIntensity?: number
  /** When set, use translated dialogue audio and viseme timelines for this language */
  translationLanguage?: string | null
  /** Outfit/accessory layers from wardrobe store */
  wardrobeLayers?: WardrobeLayerData[]
  /** Crowd / background character groups */
  crowdGroups?: CrowdExportData[]
  /** Clip transitions (transitionIn/transitionOut) from timeline clips */
  clipTransitions?: ClipTransitionExportData[]
  /** Particle emitter instances */
  particleEmitters?: ParticleEmitterExportData[]
  /** Audio-reactive visualizer instances */
  audioReactiveVisualizers?: AudioReactiveExportData[]
}
