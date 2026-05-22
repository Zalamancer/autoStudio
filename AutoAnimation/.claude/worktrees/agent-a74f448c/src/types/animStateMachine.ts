/**
 * Animation state machine types.
 * Defines states (animation clips or pose tracks), transitions between them,
 * and conditions that trigger transitions.
 */

export interface AnimState {
  id: string
  name: string
  /** Animation clip ID from use3DAnimationStore (null for empty/pose-only state) */
  clipId: string | null
  /** Manual bone pose track ID (null if using clip only) */
  poseTrackId: string | null
  /** Playback speed multiplier */
  speed: number
  /** Whether the animation loops */
  loop: boolean
  /** Position in the node-graph editor (for visual layout) */
  position: { x: number; y: number }
}

export interface AnimTransition {
  id: string
  fromStateId: string
  toStateId: string
  /** Blend/crossfade duration in seconds */
  duration: number
  /** Condition expression evaluated at runtime (e.g. 'speed > 0.5', 'trigger:jump') */
  condition: string
  /** Whether this transition has a fixed exit time (plays full animation before transitioning) */
  hasExitTime: boolean
  /** Exit time as fraction of source state duration (0-1), only used when hasExitTime=true */
  exitTime: number
}

export interface AnimStateMachine {
  id: string
  characterId: string
  name: string
  states: AnimState[]
  transitions: AnimTransition[]
  defaultStateId: string
  /** Runtime state — not persisted */
  currentStateId: string
  /** Runtime parameters for condition evaluation */
  parameters: Record<string, number | boolean | string>
}
