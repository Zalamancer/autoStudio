import type { EasingType } from './keyframes'

// ── Bone / Joint System ─────────────────────────────────────────────

export type BoneCategory =
  | 'root'
  | 'torso'
  | 'head'
  | 'arm-left'
  | 'arm-right'
  | 'hand-left'
  | 'hand-right'
  | 'leg-left'
  | 'leg-right'
  | 'tail'
  | 'other'

export interface BoneJoint {
  id: string
  name: string
  parentId: string | null
  /** Rest position in image-local pixels (origin = top-left of source image) */
  restPosition: { x: number; y: number }
  category: BoneCategory
  color?: string
}

export interface BoneSkeleton {
  joints: BoneJoint[]
  rootJointId: string
}

// ── Bone Pose (per-frame state) ─────────────────────────────────────

export interface JointPoseState {
  /** Position offset from rest position (pixels) */
  dx: number
  dy: number
  /** Rotation offset in degrees (relative to rest orientation) */
  rotation: number
}

/** Complete pose = state of all joints at one point in time */
export type BonePose = Record<string, JointPoseState>

// ── Mesh System ─────────────────────────────────────────────────────

export interface MeshVertex {
  /** Rest position in image-local pixels */
  restX: number
  restY: number
  /** UV coordinates (0..1) */
  u: number
  v: number
  /** Deformed position (computed per frame) */
  deformedX: number
  deformedY: number
}

export interface MeshTriangle {
  a: number
  b: number
  c: number
}

export interface MeshData {
  vertices: MeshVertex[]
  triangles: MeshTriangle[]
  imageWidth: number
  imageHeight: number
  gridSpacing: number
}

// ── Skinning Weights ────────────────────────────────────────────────

export interface SkinWeight {
  jointId: string
  weight: number // 0..1, normalized per vertex
}

/** Per-vertex skinning weights. Index matches MeshData.vertices index. */
export type VertexSkinning = SkinWeight[][]

// ── SVG Element Skinning (alternative to mesh-based VertexSkinning) ──

/** A single SVG element bound to one or more bones */
export interface SVGElementBinding {
  /** Unique ID of the element within the SVG DOM */
  elementId: string
  /** SVG tag name for display (e.g. 'path', 'g', 'rect') */
  tagName: string
  /** User-friendly label */
  label: string
  /** Bone weights for this element — reuses existing SkinWeight type */
  weights: SkinWeight[]
  /** Transform origin X in SVG user coordinates */
  pivotX: number
  /** Transform origin Y in SVG user coordinates */
  pivotY: number
}

/** Per-element skinning data for SVG rigs */
export type SVGElementSkinning = SVGElementBinding[]

// ── Complete Rig Data ───────────────────────────────────────────────

export interface RigData {
  id: string
  /** Optional user-defined name for this rig */
  name?: string
  sourceImageUrl: string
  imageWidth: number
  imageHeight: number
  skeleton: BoneSkeleton
  mesh: MeshData
  skinning: VertexSkinning
  meshGridSpacing: number
  restPose: BonePose
  createdAt: string

  // ── SVG-native rigging (optional, additive) ──
  /** Raw SVG XML string, parsed from the data:image/svg+xml;base64,... URL */
  svgSource?: string
  /** Per-SVG-element bone weights (replaces mesh+skinning for SVG rigs) */
  svgElementSkinning?: SVGElementSkinning

  // ── Advanced bonerigging data (optional) ──
  /** If this rig was authored in the bonerigging advanced editor, store the
   *  serialized data for full-fidelity playback (S&S, spring physics, etc.) */
  boneriggingSerializedData?: string // JSON-stringified SerializedRigData
}

// ── Bone Pose Keyframes (for timeline animation) ────────────────────

export interface BonePoseKeyframe {
  id: string
  frame: number
  pose: BonePose
  easing: EasingType
}

export interface BonePoseTrack {
  id: string
  characterId: string // dialogue character ID or 'primary'
  keyframes: BonePoseKeyframe[]
}
