import type { CanvasShape } from './shapes'
import type { SVGObjectComposition } from './svgObjects'
import type { CanvasHTMLTemplate } from '@/stores/useHTMLTemplateLayerStore'
import type { CanvasVideo } from '@/stores/useVideoLayerStore'
import type { MediaAsset, CanvasMediaItem } from '@/stores/useMediaStore'
import type { TextOverlay } from '@/stores/useTextOverlayStore'
import type { ObjectPropertyTrack } from './keyframes'
import type { RigData, BonePoseTrack } from './rig'

// ============================================
// Template Variable System
// ============================================

export type TemplateVariableType =
  | 'text'
  | 'text-multiline'
  | 'number'
  | 'color'
  | 'boolean'
  | 'image'
  | 'character'
  | 'voice'
  | 'select'
  | 'font'

export interface TemplateVariableValidation {
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  required?: boolean
}

export interface TemplateVariable {
  key: string
  label: string
  type: TemplateVariableType
  defaultValue: string | number | boolean
  description?: string
  group?: string
  order?: number
  validation?: TemplateVariableValidation
  /** For 'select' type: available options */
  options?: { label: string; value: string }[]
}

// ============================================
// Template Bindings
// ============================================

export type BindingTransform =
  | 'direct'
  | 'character-swap'
  | 'voice-regenerate'
  | 'image-upload'

export interface TemplateBinding {
  variableKey: string
  /** Dot-notation path into snapshot, e.g. "dialogueLines.0.script" */
  snapshotPath: string
  transform: BindingTransform
}

// ============================================
// Project Template Snapshot
// ============================================

export interface SnapshotCanvas {
  aspectRatio: string
  fps: number
  canvasWidth: number
  canvasHeight: number
  totalFrames: number
}

export interface SnapshotDialogueCharacter {
  id: string
  name: string
  voiceId: string
  voiceName: string
  savedCharacterId?: string
  color: string
}

export interface SnapshotDialogueLine {
  id: string
  characterId: string
  script: string
  emotion?: string
  order: number
}

export interface SnapshotGeneratedVoice {
  id: string
  script: string
  voiceId: string
  voiceName: string
  audioUrl: string
  audioDuration: number
  alignment: Record<string, unknown> | null
  visemeTimeline: Record<string, unknown>[]
  wordTimeline: Record<string, unknown>[]
}

export interface SnapshotCharacterSprites {
  savedImages: Record<string, string[]>
  uploadedImages: Record<string, string | null>
  spriteLabels: Record<string, Record<number, string>>
  visemeMapping: Record<string, number>
  partTransforms: Record<string, {
    position: { x: number; y: number }
    rotation: number
    scale: { x: number; y: number }
    visible: boolean
    selectedSpriteIndex: number
  }>
  curvedVisemes?: Record<string, string | null>
  eyeVariants?: Record<string, string | null>
  eyebrowVariants?: Record<string, string | null>
  useCurvedVisemes?: boolean
  visemeTransitionMs?: number
}

export interface SnapshotActiveAnimation {
  id: string
  animationId: string
  url: string
  name: string
  category: 'background' | 'overlay'
  position: { x: number; y: number }
  scale: number
  opacity: number
  zIndex: number
  loop: boolean
  speed: number
  startFrame?: number
  endFrame?: number
}

export interface SnapshotTimeline {
  fps: number
  totalFrames: number
  tracks: Array<{
    id: string
    type: 'video' | 'audio' | 'sprite'
    name?: string
    locked: boolean
    muted: boolean
    visible: boolean
    height: number
    clips: Array<{
      id: string
      startFrame: number
      endFrame: number
      sourceId?: string
      sourceInPoint: number
      sourceOutPoint: number
      color?: string
      name?: string
    }>
  }>
}

export interface SnapshotCaptionSettings {
  style: string
  position: string
  fontSize: number
  fontFamily: string
  textColor: string
  backgroundColor: string
  backgroundOpacity: number
}

export interface ProjectTemplateSnapshot {
  canvas: SnapshotCanvas
  characterSprites: SnapshotCharacterSprites
  dialogueCharacters: SnapshotDialogueCharacter[]
  dialogueLines: SnapshotDialogueLine[]
  generatedVoices: SnapshotGeneratedVoice[]
  textOverlays: TextOverlay[]
  shapes: CanvasShape[]
  htmlTemplates: CanvasHTMLTemplate[]
  svgComposition: SVGObjectComposition | null
  mediaAssets: MediaAsset[]
  mediaItems: CanvasMediaItem[]
  activeAnimations: SnapshotActiveAnimation[]
  videos: CanvasVideo[]
  keyframeTracks: ObjectPropertyTrack[]
  rigs: Record<string, RigData>
  poseTracks: BonePoseTrack[]
  timeline: SnapshotTimeline
  captionSettings: SnapshotCaptionSettings | null
}

// ============================================
// Project Template (top-level)
// ============================================

export type TemplateCategory =
  | 'educational'
  | 'explainer'
  | 'social-media'
  | 'marketing'
  | 'entertainment'
  | 'news'
  | 'tutorial'
  | 'storytelling'
  | 'product-demo'
  | 'meme'
  | 'other'

export const TEMPLATE_CATEGORIES: { value: TemplateCategory; label: string }[] = [
  { value: 'educational', label: 'Educational' },
  { value: 'explainer', label: 'Explainer' },
  { value: 'social-media', label: 'Social Media' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'news', label: 'News' },
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'storytelling', label: 'Storytelling' },
  { value: 'product-demo', label: 'Product Demo' },
  { value: 'meme', label: 'Meme' },
  { value: 'other', label: 'Other' },
]

export interface ProjectTemplate {
  id: string
  creatorUserId: string
  name: string
  description: string
  category: TemplateCategory
  tags: string[]
  thumbnailUrl: string | null
  previewVideoUrl: string | null
  snapshot: ProjectTemplateSnapshot
  variables: TemplateVariable[]
  bindings: TemplateBinding[]
  isPublished: boolean
  version: number
  useCount: number
  createdAt: string
  updatedAt: string
}

// ============================================
// Regeneration Tasks (post-instantiation)
// ============================================

export interface RegenerationTask {
  type: 'voice-regenerate' | 'character-swap' | 'image-upload'
  /** Which variable triggered this */
  variableKey: string
  /** Context data for the task */
  data: Record<string, unknown>
}
