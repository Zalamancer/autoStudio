/**
 * Type definitions for 3D character system.
 * Supports rigged GLTF/GLB humanoid models, animations from HunyuanMotion,
 * and AI-generated characters from Meshy API.
 */

// ─── Skeleton Types ─────────────────────────────────────────────────────────

/** Recognized skeleton naming conventions */
export type SkeletonType = 'mixamo' | 'readyplayerme' | 'smpl' | 'hunyuan' | 'biped' | 'custom'

/** Standard bone names for retargeting (Biped/HunyuanMotion convention) */
export type StandardBoneName =
  | 'Pelvis'
  | 'Spine1'
  | 'Spine2'
  | 'Spine3'
  | 'Neck'
  | 'Head'
  | 'L_Collar'
  | 'L_Shoulder'
  | 'L_Elbow'
  | 'L_Wrist'
  | 'R_Collar'
  | 'R_Shoulder'
  | 'R_Elbow'
  | 'R_Wrist'
  | 'L_Hip'
  | 'L_Knee'
  | 'L_Ankle'
  | 'R_Hip'
  | 'R_Knee'
  | 'R_Ankle'

/** Maps standard bone names to actual bone names in a specific skeleton */
export type BoneMapping = Partial<Record<StandardBoneName, string>>

// ─── Viseme Face Mapping (3D Lip Sync) ──────────────────────────────────────

/** Configuration for projecting 2D viseme sprites onto a 3D character's face */
export interface VisemeFaceMapping {
  enabled: boolean
  /** Local-space offset from the Head bone */
  offset: { x: number; y: number; z: number }
  /** Width/height of the mouth plane in model units */
  scale: { x: number; y: number }
  /** Euler rotation to align the plane with the face surface */
  rotation: { x: number; y: number; z: number }
  /** Opacity of the viseme overlay (0–1) */
  opacity: number
  /** Cross-fade duration between viseme sprites (ms) */
  transitionMs: number
  /** Source of viseme sprites */
  visemeSource:
    | { type: 'character-config' }
    | { type: 'saved-2d-character'; characterId: string }
    | { type: 'custom'; sprites: Record<string, string> }
  /** ID of the dialogue character whose viseme timeline drives this 3D character */
  dialogueCharacterId?: string
}

/**
 * Starter defaults — immediately overridden by auto-fit in VisemeFacePlane3D
 * once the Head bone is located. These are just fallback values.
 */
/**
 * Starter defaults in WORLD units (the scene where the model is ~1.8 units tall).
 * Auto-fit in Character3DRenderer recalculates these based on the actual model.
 * - offset.z = 0.12 → ~12cm forward from head bone (toward face)
 * - offset.y = 0.04 → ~4cm above head bone origin (mouth area)
 * - scale 0.15 × 0.10 → ~15cm × 10cm mouth plane
 */
export const DEFAULT_VISEME_FACE_MAPPING: VisemeFaceMapping = {
  enabled: true,
  offset: { x: 0, y: 0.04, z: 0.12 },
  scale: { x: 0.15, y: 0.10 },
  rotation: { x: 0, y: 0, z: 0 },
  opacity: 1,
  transitionMs: 60,
  visemeSource: { type: 'character-config' },
}

// ─── Face Expression Mapping (3D Eye/Eyebrow Overlays) ──────────────────────

/** Configuration for projecting 2D eye + eyebrow sprites onto a 3D character's face */
export interface FaceExpressionMapping {
  enabled: boolean
  /** Eye overlay config */
  eye: {
    enabled: boolean
    offset: { x: number; y: number; z: number }
    scale: { x: number; y: number }
    rotation: { x: number; y: number; z: number }
    opacity: number
  }
  /** Eyebrow overlay config */
  eyebrow: {
    enabled: boolean
    offset: { x: number; y: number; z: number }
    scale: { x: number; y: number }
    rotation: { x: number; y: number; z: number }
    opacity: number
  }
  /** Use DecalGeometry for surface wrapping (vs curved plane fallback) */
  useDecalProjection: boolean
  /** Sprite source (mirrors visemeSource pattern) */
  expressionSource:
    | { type: 'character-config' }
    | { type: 'saved-2d-character'; characterId: string }
    | { type: 'custom'; eyeSprites: Record<string, string>; eyebrowSprites: Record<string, string> }
  /** Dialogue character whose emotion timeline drives expressions */
  dialogueCharacterId?: string
}

/**
 * Starter defaults in WORLD units (model ~1.8 units tall after autoScale).
 * - eye offset.y = 0.06 → ~6cm above head bone (eye area)
 * - eyebrow offset.y = 0.08 → ~8cm above head bone (forehead)
 * - scale tuned for humanoid proportions
 */
export const DEFAULT_FACE_EXPRESSION_MAPPING: FaceExpressionMapping = {
  enabled: true,
  eye: {
    enabled: true,
    offset: { x: 0, y: 0.06, z: 0.02 },
    scale: { x: 0.18, y: 0.06 },
    rotation: { x: 0, y: 0, z: 0 },
    opacity: 1,
  },
  eyebrow: {
    enabled: true,
    offset: { x: 0, y: 0.08, z: 0.02 },
    scale: { x: 0.20, y: 0.04 },
    rotation: { x: 0, y: 0, z: 0 },
    opacity: 1,
  },
  useDecalProjection: false,
  expressionSource: { type: 'character-config' },
}

// ─── Saved 3D Character (Library) ───────────────────────────────────────────

export interface Saved3DCharacter {
  id: string
  name: string
  /** Key in IndexedDB (character3dDB) for the GLB blob */
  glbBlobId: string
  /** Rendered preview image (data URL) */
  thumbnailDataUrl: string
  /** Detected skeleton naming convention */
  skeletonType: SkeletonType
  /** Mapping from standard bone names to actual bone names */
  boneMapping: BoneMapping
  /** Approximate polygon count for display */
  polyCount: number
  /** Meshy task ID if this was AI-generated */
  meshyTaskId?: string
  /** Source prompt for AI-generated characters */
  sourcePrompt?: string
  /** Source image URL/data for image-to-3D generation */
  sourceImageUrl?: string
  /** Timestamp */
  createdAt: number
  /** Default viseme face mapping (saved as template for new canvas instances) */
  defaultVisemeFaceMapping?: VisemeFaceMapping
}

// ─── 3D Character on Canvas ─────────────────────────────────────────────────

export interface Character3D {
  id: string
  name: string
  /** Reference to useSaved3DCharactersStore character ID */
  saved3DCharacterId: string | null
  /** 3D position on canvas */
  position: { x: number; y: number; z: number }
  /** 3D rotation (Euler angles in radians) */
  rotation: { x: number; y: number; z: number }
  /** Uniform scale multiplier */
  scale: number
  /** Layer order */
  zIndex: number
  visible: boolean
  locked: boolean
  /** Currently playing animation clip ID (from use3DAnimationStore) */
  activeAnimationId: string | null
  /** Animation playback speed multiplier */
  animationSpeed: number
  /** ElevenLabs voice ID for dialogue */
  voiceId: string | null
  /** Display color for UI identification */
  color: string
  /** Timeline start frame (inclusive) — when this character becomes visible */
  startFrame?: number
  /** Timeline end frame (exclusive) — when this character becomes hidden */
  endFrame?: number
  /** Viseme face mapping for 3D lip sync (sprite plane on Head bone) */
  visemeFaceMapping?: VisemeFaceMapping
  /** Face expression mapping for 3D eye/eyebrow overlays */
  faceExpressionMapping?: FaceExpressionMapping
}

// ─── 3D Animation Clip ──────────────────────────────────────────────────────

export interface Animation3D {
  id: string
  name: string
  /** Key in IndexedDB for GLB with skeleton animation */
  glbBlobId: string
  /** Duration in seconds */
  durationSeconds: number
  /** Frames per second */
  fps: number
  /** HunyuanMotion text prompt used to generate */
  sourcePrompt?: string
  /** Origin of this animation */
  source?: 'hunyuan-motion' | 'imported' | 'model-embedded' | 'retargeted'
  /** Searchable tags */
  tags?: string[]
  /** Timestamp */
  createdAt: number
}

// ─── API Types ──────────────────────────────────────────────────────────────

/** Meshy text-to-3D generation request */
export interface MeshyTextTo3DRequest {
  prompt: string
  style?: 'realistic' | 'cartoon' | 'anime'
}

/** Meshy image-to-3D generation request */
export interface MeshyImageTo3DRequest {
  imageBase64: string
}

/** Meshy task status response */
export interface MeshyTaskStatus {
  status: 'pending' | 'processing' | 'complete' | 'failed'
  progress: number
  modelUrl?: string
  thumbnailUrl?: string
  error?: string
}

/** Meshy auto-rig request */
export interface MeshyAutoRigRequest {
  modelUrl: string
}

/** Meshy auto-rig status response */
export interface MeshyRigStatus {
  status: 'pending' | 'processing' | 'complete' | 'failed'
  riggedModelUrl?: string
  error?: string
}

/** Meshy remesh request */
export interface MeshyRemeshRequest {
  modelUrl: string
  targetPolycount?: number
}

/** Meshy remesh status response */
export interface MeshyRemeshStatus {
  status: 'pending' | 'processing' | 'complete' | 'failed'
  progress: number
  modelUrl?: string
  error?: string
}

/** HunyuanMotion generation request */
export interface MotionGenerateRequest {
  prompt: string
  duration: number // seconds (1-10)
  fps: number
}

/** HunyuanMotion task status response */
export interface MotionTaskStatus {
  status: 'pending' | 'processing' | 'complete' | 'failed'
  progress: number
  glbUrl?: string
  /** File format returned by the Space ('fbx' | 'glb'). Client converts FBX→GLB if needed. */
  fileFormat?: 'fbx' | 'glb'
  error?: string
}

// ─── Export Types (Remotion) ────────────────────────────────────────────────

export interface Character3DExportData {
  id: string
  name: string
  /** GLB model as base64 for embedding in Remotion */
  glbBase64: string
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: number
  visible: boolean
  /** Animation GLB as base64 */
  activeAnimationGlbBase64?: string
  /** Frame where animation starts in the timeline */
  animationStartFrame: number
  animationSpeed: number
}
