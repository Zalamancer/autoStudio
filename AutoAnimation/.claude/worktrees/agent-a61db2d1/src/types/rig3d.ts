/**
 * Type definitions for the 3D rig editor system.
 * Mirrors src/types/rig.ts patterns but uses quaternions, Vec3, and 3D-specific structures.
 */
import type { EasingType, CubicBezierParams } from './keyframes'
import type { StandardBoneName, BoneMapping, SkeletonType } from './character3d'

// ─── Vector / Quaternion Types ──────────────────────────────────────────────

export interface Vec3 {
  x: number
  y: number
  z: number
}

export interface Quat {
  x: number
  y: number
  z: number
  w: number
}

// ─── 3D Joint Pose State ────────────────────────────────────────────────────

/**
 * Per-joint state at a specific frame.
 * Unlike 2D (dx, dy, rotation in degrees), 3D uses quaternion + Vec3.
 * All values are OFFSETS from the rest pose (additive).
 */
export interface JointPoseState3D {
  /** Position offset from rest pose (local space) */
  position: Vec3
  /** Rotation offset as quaternion (XYZW) — slerp-safe */
  quaternion: Quat
  /** Scale multiplier (per-axis) */
  scale: Vec3
}

/** Complete 3D pose = state of all bones at one point in time */
export type BonePose3D = Record<string, JointPoseState3D>

// ─── Identity (zero-offset) values ──────────────────────────────────────────

export const IDENTITY_POSITION: Vec3 = { x: 0, y: 0, z: 0 }
export const IDENTITY_QUATERNION: Quat = { x: 0, y: 0, z: 0, w: 1 }
export const IDENTITY_SCALE: Vec3 = { x: 1, y: 1, z: 1 }

export const IDENTITY_JOINT_POSE: JointPoseState3D = {
  position: { ...IDENTITY_POSITION },
  quaternion: { ...IDENTITY_QUATERNION },
  scale: { ...IDENTITY_SCALE },
}

// ─── 3D Bone Pose Keyframe ─────────────────────────────────────────────────

export interface BonePoseKeyframe3D {
  id: string
  frame: number
  pose: BonePose3D
  easing: EasingType
  bezierParams?: CubicBezierParams
}

export interface BonePoseTrack3D {
  id: string
  /** Links to Character3D.id from use3DCharacterStore */
  characterId: string
  keyframes: BonePoseKeyframe3D[]
}

// ─── Skeleton Tree ──────────────────────────────────────────────────────────

export interface BoneNode {
  name: string
  /** Parent bone name (null for root) */
  parentName: string | null
  /** Children bone names */
  childrenNames: string[]
  /** Rest position in local space */
  restPosition: Vec3
  /** Rest rotation as quaternion */
  restQuaternion: Quat
  /** Rest scale */
  restScale: Vec3
  /** Which StandardBoneName this maps to (if humanoid) */
  standardName?: StandardBoneName
}

export interface SkeletonTree {
  bones: BoneNode[]
  rootBoneName: string
  skeletonType: SkeletonType
  boneMapping: BoneMapping
}

// ─── 3D Rig Data ───────────────────────────────────────────────────────────

export interface RigData3D {
  id: string
  /** Links to Character3D.id from use3DCharacterStore */
  characterId: string
  /** Extracted skeleton hierarchy */
  skeletonTree: SkeletonTree
  /** Rest pose captured at import time */
  restPose: BonePose3D
  /** Manual bone pose keyframe tracks */
  poseTracks: BonePoseTrack3D[]
  /** Active animation clip IDs (from use3DAnimationStore) layered underneath */
  activeClipIds: string[]
  /** Blend weights for each active clip (0-1) */
  clipBlendWeights: Record<string, number>
  /** Spring bone chains for secondary motion (hair, tails, etc.) */
  springChains: SpringChain3D[]
  /** Per-bone squash & stretch configuration */
  squashStretchBones: SquashStretchBone3D[]
  /** Per-property animation tracks (curve editor) — override full-pose keyframes for specific bone/property */
  bonePropertyTracks: import('./animCurves').BonePropertyTrack[]
  /** Timestamp */
  createdAt: string
}

// ─── Spring Bone Chain ──────────────────────────────────────────────────────

export interface SpringChain3D {
  id: string
  rootBoneName: string
  boneNames: string[]
  stiffness: number    // 0-1
  damping: number      // 0-1
  gravity: Vec3
}

// ─── Squash & Stretch Config ────────────────────────────────────────────────

export interface SquashStretchBone3D {
  boneName: string
  enabled: boolean
  intensity: number    // 0-1
  primaryAxis: 'x' | 'y' | 'z'
}

// ─── Editor State Types ────────────────────────────────────────────────────

export type ManipulationMode = 'translate' | 'rotate' | 'scale'
export type CoordinateSpace = 'local' | 'world'

// ─── Remotion Export ────────────────────────────────────────────────────────

export interface Rig3DExportData {
  characterId: string
  poseTracks: BonePoseTrack3D[]
  restPose: BonePose3D
}
