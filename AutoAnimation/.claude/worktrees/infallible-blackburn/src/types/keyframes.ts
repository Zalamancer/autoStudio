// ---------------------------------------------------------------------------
// Easing
// ---------------------------------------------------------------------------

export type EasingType =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'cubic-bezier'
  // Extended easing types
  | 'spring-light'
  | 'spring-medium'
  | 'spring-heavy'
  | 'elastic-out'
  | 'elastic-in-out'
  | 'bounce-out'
  | 'bounce-in'
  | 'back-out'
  | 'back-in'
  | 'expo-out'
  | 'expo-in'
  | 'circ-out'
  | 'circ-in'
  | 'sine-out'
  | 'sine-in'
  | 'snappy'
  | 'material'

export interface CubicBezierParams {
  x1: number
  y1: number
  x2: number
  y2: number
}

// ---------------------------------------------------------------------------
// Canvas Object Reference
// ---------------------------------------------------------------------------

export type KeyframableObjectType =
  | 'text'
  | 'media'
  | 'lottie'
  | 'video'
  | 'character'
  | 'dialogueCharacter'
  | 'shape'
  | 'character3d'
  | 'riggedCharacter'
  | 'pixelArtCharacter'
  | 'avatarCharacter'
  | 'mask'
  | 'audio-reactive'
  | 'html-template'

/** Uniquely identifies a canvas object */
export interface CanvasObjectRef {
  objectType: KeyframableObjectType
  objectId: string
}

// ---------------------------------------------------------------------------
// Property Keyframe
// ---------------------------------------------------------------------------

/** A single keyframe for one property at a specific frame */
export interface PropertyKeyframe {
  id: string
  frame: number
  value: number
  easing: EasingType
  bezierParams?: CubicBezierParams
  /** Optional tag for grouped operations (e.g. beat-sync keyframes) */
  tag?: string
}

// ---------------------------------------------------------------------------
// Beat Sync
// ---------------------------------------------------------------------------

export type BeatSyncEffect = 'scale-pulse' | 'opacity-flash' | 'bounce'

export interface ObjectBeatSyncConfig {
  objectRef: CanvasObjectRef
  effect: BeatSyncEffect
  subdivision: 1 | 2 | 4
  offset: number
  intensity: number
}

/** A track of keyframes for one property of one object */
export interface ObjectPropertyTrack {
  id: string
  objectRef: CanvasObjectRef
  property: string // e.g. 'position.x', 'opacity', 'rotation', 'scale'
  keyframes: PropertyKeyframe[]
}

// ---------------------------------------------------------------------------
// Animatable Property Definition
// ---------------------------------------------------------------------------

export interface AnimatableProperty {
  key: string       // property path (e.g. 'freeX', 'position.x')
  label: string     // human-readable
  type: 'number' | 'angle'
  min?: number
  max?: number
}
