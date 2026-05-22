// ── Sketch-to-Animation Types ──

/** Result of AI analysis of a hand-drawn sketch */
export interface SketchAnalysis {
  /** Overall scene description */
  sceneDescription: string
  /** Detected characters with descriptions */
  characters: SketchCharacter[]
  /** Detected text labels/annotations */
  textLabels: SketchTextLabel[]
  /** Detected arrows/motion paths */
  motionPaths: SketchMotionPath[]
  /** Detected background elements */
  backgroundDescription: string
  /** Detected objects/props */
  objects: SketchObject[]
  /** Suggested animation style */
  suggestedStyle: 'cartoon' | 'realistic' | 'minimal' | 'sketch'
  /** Suggested mood/tone */
  suggestedMood: string
  /** Whether this appears to be a storyboard (multiple panels) */
  isStoryboard: boolean
  /** Individual panels if storyboard */
  panels?: SketchPanel[]
}

/** A character detected in the sketch */
export interface SketchCharacter {
  /** AI-generated name/label */
  name: string
  /** Visual description for character generation */
  description: string
  /** Approximate position in the sketch (0-100 percentage) */
  position: { x: number; y: number }
  /** Approximate size relative to the canvas */
  relativeSize: number
  /** Detected expression/emotion */
  expression?: string
  /** Speech bubble text if any */
  speechText?: string
}

/** A text label or annotation in the sketch */
export interface SketchTextLabel {
  /** The text content */
  text: string
  /** Position in the sketch */
  position: { x: number; y: number }
  /** Text role */
  role: 'title' | 'subtitle' | 'dialogue' | 'annotation' | 'label'
  /** Font size hint */
  sizeHint: 'small' | 'medium' | 'large'
}

/** An arrow or motion path in the sketch */
export interface SketchMotionPath {
  /** Description of the motion */
  description: string
  /** Start position */
  from: { x: number; y: number }
  /** End position */
  to: { x: number; y: number }
  /** Associated object/character name */
  associatedWith?: string
  /** Motion type */
  type: 'linear' | 'arc' | 'zigzag' | 'loop'
}

/** An object/prop detected in the sketch */
export interface SketchObject {
  /** Object name */
  name: string
  /** Visual description for SVG generation */
  description: string
  /** Position in the sketch */
  position: { x: number; y: number }
  /** Approximate size */
  relativeSize: number
}

/** A single panel in a storyboard sketch */
export interface SketchPanel {
  /** Panel number (1-indexed) */
  index: number
  /** Panel description */
  description: string
  /** Duration in seconds for this panel */
  suggestedDuration: number
  /** Characters in this panel */
  characters: SketchCharacter[]
  /** Text in this panel */
  textLabels: SketchTextLabel[]
}

/** Status of the sketch-to-animation pipeline */
export type SketchPipelineStatus =
  | 'idle'
  | 'uploading'
  | 'analyzing'
  | 'generating-plan'
  | 'vectorizing'
  | 'generating-characters'
  | 'building-scene'
  | 'complete'
  | 'error'

/** Configuration for sketch-to-animation processing */
export interface SketchToAnimationConfig {
  /** Whether to vectorize the sketch into clean SVG */
  vectorize: boolean
  /** Whether to generate characters from detected figures */
  generateCharacters: boolean
  /** Whether to generate background from the scene */
  generateBackground: boolean
  /** Whether to add dialogue from detected speech bubbles */
  generateDialogue: boolean
  /** Whether to add motion animations from detected arrows */
  generateMotion: boolean
  /** Target animation duration in seconds */
  targetDuration: number
  /** Animation style override */
  styleOverride?: 'cartoon' | 'realistic' | 'minimal' | 'sketch'
}
