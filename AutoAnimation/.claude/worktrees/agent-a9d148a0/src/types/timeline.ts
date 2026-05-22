export type TrackType = 'video' | 'audio' | 'sprite' | 'text' | 'effect'

export interface Track {
  id: string
  type: TrackType
  name: string
  clips: Clip[]
  locked: boolean
  muted: boolean
  visible: boolean
  height: number
}

export interface ClipTransition {
  type: import('./transitions').TransitionType
  duration: number // seconds
  easing: import('./transitions').EasingType
  cubicBezierValues?: [number, number, number, number]
}

export interface Clip {
  id: string
  trackId: string
  startFrame: number
  endFrame: number
  sourceId: string
  sourceInPoint: number
  sourceOutPoint: number
  color: string
  name: string
  transitionIn?: ClipTransition
  transitionOut?: ClipTransition
}

export interface TimelineState {
  fps: number
  totalFrames: number
  currentFrame: number
  isPlaying: boolean
  zoom: number
  tracks: Track[]
  selectedClipIds: string[]
  selectedKeyframeIds: string[]
}

export interface Keyframe<T = number> {
  frame: number
  value: T
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bezier'
  bezierHandles?: {
    in: { x: number; y: number }
    out: { x: number; y: number }
  }
}

export interface KeyframeTrack<T = number> {
  id: string
  property: string
  keyframes: Keyframe<T>[]
}
