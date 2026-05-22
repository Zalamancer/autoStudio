// ── Interactive Runtime Export Types ──

/** A scene in the interactive composition */
export interface InteractiveScene {
  /** Unique scene identifier */
  id: string
  /** Scene display name */
  name: string
  /** Start frame in the original timeline */
  startFrame: number
  /** End frame in the original timeline */
  endFrame: number
  /** Layers in this scene */
  layers: InteractiveLayer[]
  /** Background color or gradient */
  background: string
  /** Audio tracks for this scene */
  audio?: InteractiveAudio[]
}

/** A layer within an interactive scene */
export interface InteractiveLayer {
  /** Layer identifier */
  id: string
  /** Layer type */
  type: InteractiveLayerType
  /** Layer data (varies by type) */
  data: Record<string, unknown>
  /** Transform (position, scale, rotation) */
  transform: InteractiveTransform
  /** Opacity (0-1) */
  opacity: number
  /** Z-index for draw order */
  zIndex: number
  /** Keyframe animations */
  keyframes?: InteractiveKeyframe[]
  /** Interactive triggers attached to this layer */
  triggers?: InteractiveTrigger[]
}

export type InteractiveLayerType =
  | 'image'
  | 'text'
  | 'shape'
  | 'svg'
  | 'sprite-sequence'
  | 'video'

/** Transform properties for a layer */
export interface InteractiveTransform {
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scaleX: number
  scaleY: number
  anchorX: number
  anchorY: number
}

/** A keyframe in the interactive animation */
export interface InteractiveKeyframe {
  /** Time in seconds from scene start */
  time: number
  /** Properties to animate */
  properties: Partial<InteractiveTransform & { opacity: number }>
  /** Easing function name */
  easing: string
}

/** An interactive trigger that responds to user input */
export interface InteractiveTrigger {
  /** Trigger type */
  type: InteractiveTriggerType
  /** Target scene or action ID */
  target: string
  /** Action to perform */
  action: InteractiveAction
  /** Optional delay in ms before executing */
  delay?: number
  /** Trigger-specific configuration */
  config?: Record<string, unknown>
}

export type InteractiveTriggerType =
  | 'click'
  | 'hover'
  | 'scroll'
  | 'timer'
  | 'keypress'
  | 'visibility'

export type InteractiveAction =
  | 'goto-scene'
  | 'play'
  | 'pause'
  | 'toggle-play'
  | 'seek'
  | 'set-variable'
  | 'open-url'
  | 'show-layer'
  | 'hide-layer'

/** Audio track in the interactive composition */
export interface InteractiveAudio {
  /** Audio source file path (relative to export bundle) */
  src: string
  /** Volume (0-1) */
  volume: number
  /** Whether to loop */
  loop: boolean
  /** Start time offset in seconds */
  offset: number
}

/** The complete interactive manifest */
export interface InteractiveManifest {
  /** ProAnimate version that generated this manifest */
  version: string
  /** Project metadata */
  metadata: {
    name: string
    description?: string
    author?: string
    exportedAt: string
  }
  /** Canvas dimensions */
  canvas: {
    width: number
    height: number
    fps: number
    backgroundColor: string
  }
  /** Scene definitions */
  scenes: InteractiveScene[]
  /** Initial scene ID */
  initialScene: string
  /** Global variables */
  variables: Record<string, string | number | boolean>
  /** Asset manifest (filename -> asset type) */
  assets: Record<string, InteractiveAssetType>
}

export type InteractiveAssetType = 'image' | 'audio' | 'video' | 'svg' | 'font'

/** Export configuration */
export interface InteractiveExportConfig {
  /** Output format */
  format: 'html-bundle' | 'json-manifest'
  /** Whether to inline assets as data URLs */
  inlineAssets: boolean
  /** Whether to include the player runtime */
  includePlayer: boolean
  /** Whether to minify the output */
  minify: boolean
  /** Player theme */
  playerTheme: 'dark' | 'light' | 'transparent'
  /** Whether to show playback controls */
  showControls: boolean
  /** Whether to autoplay on load */
  autoplay: boolean
  /** Whether to loop the animation */
  loop: boolean
  /** Maximum bundle size in MB (0 = unlimited) */
  maxBundleSize: number
}
