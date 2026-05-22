/**
 * Motion Transfer Type Definitions
 *
 * Types for extracting poses from reference video using MediaPipe Pose
 * and retargeting them to character rigs.
 */

/** A single body landmark from MediaPipe Pose (33 landmarks) */
export interface BodyLandmark {
  /** Normalized x position (0-1) */
  x: number
  /** Normalized y position (0-1) */
  y: number
  /** Normalized z position (depth, 0-1) */
  z: number
  /** Visibility score (0-1) */
  visibility: number
}

/** Full body pose at a single frame from MediaPipe Pose */
export interface BodyPoseFrame {
  /** Frame index in the source video */
  frameIndex: number
  /** Timestamp in seconds */
  timestamp: number
  /** 33 body landmarks from MediaPipe Pose */
  landmarks: BodyLandmark[]
  /** World-space landmarks (metric, centered at hip) */
  worldLandmarks: BodyLandmark[]
}

/** MediaPipe Pose landmark indices (for named access) */
export const POSE_LANDMARK = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
} as const

/** Mapping from MediaPipe Pose landmarks to standard bone names */
export interface PoseToBoneMapping {
  /** Maps pairs of landmark indices to a standard bone name for computing rotation */
  [boneName: string]: {
    /** Parent landmark index */
    parentLandmark: number
    /** Child landmark index */
    childLandmark: number
  }
}

/** Default mapping from MediaPipe Pose to standard bones */
export const DEFAULT_POSE_TO_BONE_MAP: PoseToBoneMapping = {
  Pelvis: { parentLandmark: POSE_LANDMARK.LEFT_HIP, childLandmark: POSE_LANDMARK.RIGHT_HIP },
  Spine1: { parentLandmark: POSE_LANDMARK.LEFT_HIP, childLandmark: POSE_LANDMARK.LEFT_SHOULDER },
  Neck: { parentLandmark: POSE_LANDMARK.LEFT_SHOULDER, childLandmark: POSE_LANDMARK.RIGHT_SHOULDER },
  Head: { parentLandmark: POSE_LANDMARK.NOSE, childLandmark: POSE_LANDMARK.LEFT_EAR },
  L_Shoulder: { parentLandmark: POSE_LANDMARK.LEFT_SHOULDER, childLandmark: POSE_LANDMARK.LEFT_ELBOW },
  L_Elbow: { parentLandmark: POSE_LANDMARK.LEFT_ELBOW, childLandmark: POSE_LANDMARK.LEFT_WRIST },
  R_Shoulder: { parentLandmark: POSE_LANDMARK.RIGHT_SHOULDER, childLandmark: POSE_LANDMARK.RIGHT_ELBOW },
  R_Elbow: { parentLandmark: POSE_LANDMARK.RIGHT_ELBOW, childLandmark: POSE_LANDMARK.RIGHT_WRIST },
  L_Hip: { parentLandmark: POSE_LANDMARK.LEFT_HIP, childLandmark: POSE_LANDMARK.LEFT_KNEE },
  L_Knee: { parentLandmark: POSE_LANDMARK.LEFT_KNEE, childLandmark: POSE_LANDMARK.LEFT_ANKLE },
  R_Hip: { parentLandmark: POSE_LANDMARK.RIGHT_HIP, childLandmark: POSE_LANDMARK.RIGHT_KNEE },
  R_Knee: { parentLandmark: POSE_LANDMARK.RIGHT_KNEE, childLandmark: POSE_LANDMARK.RIGHT_ANKLE },
}

/** Settings for motion transfer extraction */
export interface MotionTransferSettings {
  /** Source FPS to extract at (default: match source video) */
  extractionFps: number
  /** Smoothing factor (0 = no smoothing, 1 = max smoothing) */
  smoothing: number
  /** Whether to extract face landmarks along with body */
  includeFace: boolean
  /** Whether to extract hand landmarks */
  includeHands: boolean
  /** Minimum landmark visibility to consider valid */
  visibilityThreshold: number
  /** Scale factor for retargeting (1 = original proportions) */
  retargetScale: number
}

/** Default motion transfer settings */
export const DEFAULT_MOTION_TRANSFER_SETTINGS: MotionTransferSettings = {
  extractionFps: 30,
  smoothing: 0.3,
  includeFace: true,
  includeHands: false,
  visibilityThreshold: 0.5,
  retargetScale: 1.0,
}

/** Status of the motion transfer pipeline */
export type MotionTransferStatus =
  | 'idle'
  | 'loading-video'
  | 'extracting'
  | 'smoothing'
  | 'retargeting'
  | 'writing-keyframes'
  | 'complete'
  | 'error'

/** Progress info for the motion transfer pipeline */
export interface MotionTransferProgress {
  status: MotionTransferStatus
  currentFrame: number
  totalFrames: number
  percentage: number
  error?: string
}

/** Result of a completed motion transfer */
export interface MotionTransferResult {
  /** Extracted pose frames from the source video */
  poseFrames: BodyPoseFrame[]
  /** Source video FPS */
  sourceFps: number
  /** Source video duration in seconds */
  sourceDuration: number
  /** Total frames extracted */
  totalFrames: number
}
