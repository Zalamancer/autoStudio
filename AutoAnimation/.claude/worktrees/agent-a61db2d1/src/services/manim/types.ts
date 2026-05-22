// ─── Manim Video Generation Pipeline Types ──────────────────────────────────

// ─── Agent 1: Script Planner ─────────────────────────────────────────────────

export interface ConceptNode {
  id: string
  name: string
  definition: string
  formula?: string
  prerequisites: string[] // IDs of prerequisite concepts
  relatedConcepts: string[] // IDs of related concepts
}

export interface TopicSection {
  id: string
  title: string
  narrationText: string
  conceptIds: string[] // ConceptNode IDs active in this section
  durationHintSeconds: number
  visualIntent: string // Natural language description of what to animate
}

export interface TopicScript {
  topic: string
  targetDurationSeconds: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  sections: TopicSection[]
  knowledgeGraph: ConceptNode[]
  summary: string
}

// ─── Agent 2: Scene Decomposer ───────────────────────────────────────────────

/** 6x6 spatial anchor grid position (row 0-5, col 0-5) */
export interface SpatialAnchor {
  row: number // 0-5
  col: number // 0-5
  label: string // e.g. "top-left", "center", "bottom-right"
}

export interface ElementPlacement {
  elementId: string
  type: 'text' | 'formula' | 'shape' | 'graph' | 'arrow' | 'image' | 'numberline' | 'axes' | 'group'
  anchor: SpatialAnchor
  description: string
}

export interface ElementContinuity {
  elementId: string
  fromSceneIndex: number
  transform: 'persist' | 'morph' | 'fadeOut' | 'moveToCorner'
}

export interface ExplanationContext {
  /** Concepts currently visible/active at this point */
  activeConceptIds: string[]
  /** Formulas visible on screen */
  visibleFormulas: string[]
  /** What the narrator just said */
  precedingNarration: string
  /** What comes next */
  followingNarration: string
  /** AI-generated suggested questions for this moment */
  suggestedQuestions: string[]
  /** Natural language summary of what's on screen */
  screenSummary: string
}

export interface SceneSpec {
  index: number
  title: string
  durationSeconds: number
  /** Natural language description of the Manim animation to create */
  animationIntent: string
  /** Narration text for this scene */
  narrationText: string
  /** Element placements using 6x6 spatial grid */
  elements: ElementPlacement[]
  /** Elements continuing from previous scenes */
  elementContinuity: ElementContinuity[]
  /** Context metadata for pause-and-explain (sampled every 0.5s) */
  explanationContexts: ExplanationContext[]
  /** Section ID from TopicScript this scene belongs to */
  sectionId: string
}

// ─── Agent 3: Manim Code Generator ──────────────────────────────────────────

export interface ManimCodeResult {
  sceneIndex: number
  pythonCode: string
  className: string
  retryCount: number
  errors: string[]
  /** Whether the visual critic approved the render */
  visualApproved: boolean
}

export interface CodeFeedback {
  sceneIndex: number
  code: string
  error?: string
  screenshotBase64?: string
  feedbackText: string
}

// ─── Agent 4: Renderer ──────────────────────────────────────────────────────

export interface RenderJob {
  jobId: string
  sceneIndex: number
  status: 'queued' | 'rendering' | 'completed' | 'failed'
  videoUrl?: string
  thumbnailUrl?: string
  durationSeconds?: number
  error?: string
}

// ─── Agent 5: Narrator ──────────────────────────────────────────────────────

export interface NarrationResult {
  sceneIndex: number
  audioUrl: string
  durationSeconds: number
  phonemeAlignment?: PhonemeTimestamp[]
}

export interface PhonemeTimestamp {
  phoneme: string
  startTime: number
  endTime: number
}

// ─── Pipeline State ─────────────────────────────────────────────────────────

export type ManimPipelineStep =
  | 'idle'
  | 'planning-script'
  | 'decomposing-scenes'
  | 'generating-code'
  | 'rendering'
  | 'narrating'
  | 'assembling'
  | 'completed'
  | 'error'

export interface ManimGenerationSettings {
  topic: string
  targetDurationMinutes: number // 1-5
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  quality: 'low' | 'medium' | 'high' // Maps to Manim -ql/-qm/-qh
  voiceId?: string // ElevenLabs voice ID
  enableInteractiveAnnotations: boolean
  aspectRatio: '16:9' | '9:16' | '1:1'
}

export interface ManimPipelineState {
  /** Current pipeline step */
  step: ManimPipelineStep
  /** Generation settings */
  settings: ManimGenerationSettings | null
  /** Agent 1 output */
  topicScript: TopicScript | null
  /** Agent 2 output */
  sceneSpecs: SceneSpec[] | null
  /** Agent 3 output (per-scene code) */
  codeResults: ManimCodeResult[]
  /** Agent 4 output (per-scene render) */
  renderJobs: RenderJob[]
  /** Agent 5 output (per-scene narration) */
  narrationResults: NarrationResult[]
  /** Final assembled video URL */
  finalVideoUrl: string | null
  /** Full video metadata for pause-and-explain */
  videoMetadata: ManimVideoMetadata | null
  /** Error message if pipeline failed */
  error: string | null
  /** Progress within current step (0-100) */
  stepProgress: number
  /** Which scene is currently being processed */
  currentSceneIndex: number
}

// ─── Final Output ───────────────────────────────────────────────────────────

/** Dense annotation timeline: one entry per 0.5s window */
export interface TimelineAnnotation {
  /** Start time in seconds */
  startTime: number
  /** End time in seconds (startTime + 0.5) */
  endTime: number
  /** Explanation context for this window */
  context: ExplanationContext
  /** Scene index this window belongs to */
  sceneIndex: number
}

export interface ManimVideoMetadata {
  topic: string
  totalDurationSeconds: number
  sceneCount: number
  /** Knowledge graph for the entire video */
  knowledgeGraph: ConceptNode[]
  /** Dense annotations (every 0.5s) for pause-and-explain */
  timeline: TimelineAnnotation[]
  /** Scene boundaries (start time in seconds) */
  sceneBoundaries: number[]
}

// ─── Pause-and-Explain State ────────────────────────────────────────────────

export interface ExplainResponse {
  text: string
  /** Optional supplementary Manim clip URL */
  supplementaryVideoUrl?: string
  /** Whether a supplementary visualization is being generated */
  isGeneratingVisual: boolean
}

export interface ManimExplainState {
  /** Whether the explain overlay is visible */
  isExplainOpen: boolean
  /** Current annotation context at pause point */
  currentContext: ExplanationContext | null
  /** Current scene index at pause point */
  currentSceneIndex: number
  /** Chat history for current explain session */
  chatHistory: ExplainChatMessage[]
  /** Whether AI is generating a response */
  isLoading: boolean
  /** Knowledge graph for lookups */
  knowledgeGraph: ConceptNode[]
}

export interface ExplainChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  supplementaryVideoUrl?: string
  timestamp: number
}

// ─── Step Executor Types ────────────────────────────────────────────────────

export type ManimStepType =
  | 'plan-script'
  | 'decompose-scenes'
  | 'generate-code'
  | 'render-scenes'
  | 'narrate-scenes'
  | 'assemble-video'

export interface ManimStepDef {
  type: ManimStepType
  label: string
  description: string
}

export type ManimStepRunner = (
  settings: ManimGenerationSettings,
  context: ManimExecutionContext,
) => Promise<void>

export interface ManimExecutionContext {
  topicScript: TopicScript | null
  sceneSpecs: SceneSpec[] | null
  codeResults: ManimCodeResult[]
  renderJobs: RenderJob[]
  narrationResults: NarrationResult[]
  finalVideoUrl: string | null
  videoMetadata: ManimVideoMetadata | null
  /** Callback to update pipeline state in the store */
  updateState: (partial: Partial<ManimPipelineState>) => void
}
