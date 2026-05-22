// ── AI Storyboard Types ──

/** Camera angle/shot type for a storyboard scene */
export type CameraAngle =
  | 'wide-shot'
  | 'medium-shot'
  | 'close-up'
  | 'extreme-close-up'
  | 'over-the-shoulder'
  | 'bird-eye'
  | 'low-angle'
  | 'dutch-angle'
  | 'tracking'
  | 'static'

/** Character position reference within a scene */
export interface SceneCharacterPosition {
  /** Character name */
  name: string
  /** Horizontal position as percentage (0-100). 50 = center */
  x: number
  /** Vertical position as percentage (0-100). 50 = middle */
  y: number
  /** Scale multiplier (1 = default size) */
  scale: number
  /** Whether this character is the active speaker in this scene */
  isSpeaking: boolean
}

/** A single scene in the AI-generated storyboard */
export interface StoryboardSceneEntry {
  /** Unique scene identifier */
  id: string
  /** Scene number (1-indexed) */
  sceneNumber: number
  /** Short title for the scene (e.g. "Introduction", "The Reveal") */
  title: string
  /** Detailed description of what happens visually in this scene */
  description: string
  /** Camera angle/shot type */
  cameraAngle: CameraAngle
  /** Characters in this scene with their positions */
  characters: SceneCharacterPosition[]
  /** Dominant emotion for this scene */
  emotion: string
  /** Estimated duration in seconds */
  durationSeconds: number
  /** Visual notes: lighting, effects, transitions, color mood, etc. */
  visualNotes: string
  /** Background description */
  backgroundDescription: string
  /** Dialogue text for this scene (if any) */
  dialogueText?: string
  /** Speaker name for this scene (if any) */
  speakerName?: string
  /** Whether this scene has been converted to a timeline clip */
  appliedToTimeline: boolean
}

/** The complete storyboard containing all scenes */
export interface Storyboard {
  /** Unique storyboard identifier */
  id: string
  /** The original script text this storyboard was generated from */
  sourceScript: string
  /** Title/summary of the storyboard */
  title: string
  /** All scenes in order */
  scenes: StoryboardSceneEntry[]
  /** Total estimated duration in seconds */
  totalDurationSeconds: number
  /** Timestamp when the storyboard was generated */
  createdAt: number
}
