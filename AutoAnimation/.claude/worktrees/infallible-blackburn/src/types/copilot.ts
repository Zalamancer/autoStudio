export type CopilotActionType =
  // Navigation
  | 'navigate-panel'
  | 'open-overlay'
  | 'close-overlay'
  // Playback
  | 'play'
  | 'pause'
  | 'seek'
  | 'set-fps'
  // Canvas
  | 'set-aspect-ratio'
  | 'set-zoom'
  | 'set-duration'
  // Text
  | 'add-text'
  | 'update-text'
  | 'remove-text'
  // Shapes
  | 'add-shape'
  | 'update-shape'
  | 'remove-shape'
  // Characters
  | 'add-character'
  | 'update-character'
  | 'remove-character'
  | 'update-character-part'
  // Dialogue
  | 'add-dialogue'
  | 'update-dialogue'
  | 'remove-dialogue'
  // Voice
  | 'generate-voice'
  | 'generate-all-voices'
  // Templates
  | 'add-template'
  | 'update-template-config'
  | 'remove-template'
  // SVG generation
  | 'generate-svg'
  // Stock media (Pixabay)
  | 'search-stock-image'
  | 'search-stock-video'
  | 'update-media'
  | 'remove-media'
  // Lottie animations
  | 'add-lottie-animation'
  | 'remove-lottie-animation'
  // SVG objects
  | 'remove-svg-object'
  | 'update-svg-object'
  // AI video
  | 'generate-ai-video'
  | 'remove-video'
  // Schema
  | 'set-schema-variable'
  | 'set-schema-variable-batch'
  // Undo
  | 'undo'
  | 'redo'
  // Batch
  | 'batch'

export type CopilotActionSafety = 'auto' | 'confirm' | 'dangerous'
export type CopilotActionStatus = 'pending' | 'confirmed' | 'executed' | 'rejected' | 'error'

export interface CopilotAction {
  type: CopilotActionType
  params: Record<string, unknown>
}

export interface CopilotChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
  actions?: CopilotMessageAction[]
}

export interface CopilotMessageAction {
  action: CopilotAction
  safety: CopilotActionSafety
  description: string
  status: CopilotActionStatus
  error?: string
}

export interface CopilotGeminiResponse {
  message: string
  actions: CopilotAction[]
  needsClarification?: boolean
}

export type CopilotPhase = 'idle' | 'thinking' | 'confirming' | 'executing'

export interface CopilotContext {
  canvas: {
    aspectRatio: string
    width: number
    height: number
    fps: number
    totalFrames: number
    currentFrame: number
    isPlaying: boolean
  }
  characters: Array<{
    id: string
    name: string
    voiceId: string | null
    dialogueLineCount: number
  }>
  characterParts: {
    parts: Array<{ part: string; visible: boolean }>
    layerOrder: string[]
  }
  textOverlays: Array<{
    id: string
    content: string
    preset: string
    color: string
    fontSize: number
  }>
  shapes: Array<{
    id: string
    type: string
    fill: string
  }>
  dialogueLines: Array<{
    id: string
    characterName: string
    script: string
    hasVoice: boolean
  }>
  templates: Array<{
    id: string
    name: string
    configKeys: string[]
  }>
  schema: Array<{
    key: string
    type: string
    label: string
    value: unknown
  }>
  lottieAnimations: Array<{
    id: string
    name: string
    category: string
  }>
  svgObjects: Array<{
    id: string
    name: string
  }>
  mediaItems: Array<{
    id: string
    name: string
    type: string
  }>
  selection: {
    type: string | null
    id: string | null
  }
  capabilities: string[]
}

export interface CopilotSuggestion {
  label: string
  prompt: string
}
