/**
 * Motion Tracking Type Definitions
 *
 * Types for the real-time webcam face tracking system ("Perform" mode).
 * Uses MediaPipe FaceLandmarker blendshapes + head pose matrix to drive
 * 2D sprite characters and 3D GLB characters.
 */

/** Processed face tracking data extracted from MediaPipe FaceLandmarker */
export interface FaceTrackingData {
  /** Head rotation (radians) decomposed from transformation matrix */
  headRotation: { pitch: number; yaw: number; roll: number }
  /** Jaw openness 0–1 */
  jawOpen: number
  /** Mouth smile/frown -1 to 1 (negative = frown, positive = smile) */
  mouthSmile: number
  /** Left eye blink 0–1 (1 = fully closed) */
  eyeBlinkLeft: number
  /** Right eye blink 0–1 (1 = fully closed) */
  eyeBlinkRight: number
  /** Inner eyebrow raise 0–1 */
  browInnerUp: number
  /** Outer left eyebrow raise 0–1 */
  browOuterUpLeft: number
  /** Outer right eyebrow raise 0–1 */
  browOuterUpRight: number
  /** Horizontal gaze -1 to 1 (left to right) */
  gazeX: number
  /** Vertical gaze -1 to 1 (down to up) */
  gazeY: number
}

/** Calibration state for establishing rest pose baseline */
export interface CalibrationData {
  /** Averaged rest pose from calibration frames */
  restPose: FaceTrackingData
  /** Whether calibration is complete */
  isCalibrated: boolean
  /** Number of frames accumulated during calibration */
  frameCount: number
}

/** User-configurable tracking settings */
export interface MotionTrackingSettings {
  /** Exponential moving average factor 0–1 (higher = smoother, more latency) */
  smoothingFactor: number
  /** Multiplier for head rotation values */
  headRotationScale: number
  /** Multiplier for facial expression values */
  expressionScale: number
  /** Mirror webcam horizontally (default true) */
  mirrorMode: boolean
  /** Enable head rotation tracking */
  enableHead: boolean
  /** Enable eye blink tracking */
  enableEyes: boolean
  /** Enable eyebrow tracking */
  enableEyebrows: boolean
  /** Enable mouth tracking (disabled when audio lip sync is active) */
  enableMouth: boolean
  /** Enable body tracking (shoulders, arms, hips, legs) */
  enableBody: boolean
}

/** Body landmark from MediaPipe PoseLandmarker (33 points) */
export interface BodyLandmark {
  x: number
  y: number
  z: number
  visibility: number
}

export interface HandLandmarkEntry {
  landmarks: Array<{ x: number; y: number; z: number }>
  handedness: 'Left' | 'Right'
}

/** Processed body tracking data — 33 landmarks + joint angles */
export interface BodyTrackingData {
  /** Raw 33 MediaPipe landmarks (normalized 0-1) */
  landmarks: BodyLandmark[]
  /** World-space 3D landmarks (meters) */
  worldLandmarks: BodyLandmark[]
  /** Hand landmarks (up to 2 hands, 21 points each) */
  handLandmarks?: HandLandmarkEntry[]
}

export function createEmptyBodyData(): BodyTrackingData {
  return { landmarks: [], worldLandmarks: [] }
}

/** A recorded take of facial + body motion data */
export interface MotionRecordingTake {
  id: string
  name: string
  startFrame: number
  frames: Array<{ frame: number; data: FaceTrackingData; bodyData?: BodyTrackingData }>
  createdAt: number
}

/** Default tracking settings */
export const DEFAULT_TRACKING_SETTINGS: MotionTrackingSettings = {
  smoothingFactor: 0.5,
  headRotationScale: 1.0,
  expressionScale: 1.0,
  mirrorMode: true,
  enableHead: true,
  enableEyes: true,
  enableEyebrows: true,
  enableMouth: true,
  enableBody: false,
}

/** Create a zeroed FaceTrackingData */
export function createEmptyFaceData(): FaceTrackingData {
  return {
    headRotation: { pitch: 0, yaw: 0, roll: 0 },
    jawOpen: 0,
    mouthSmile: 0,
    eyeBlinkLeft: 0,
    eyeBlinkRight: 0,
    browInnerUp: 0,
    browOuterUpLeft: 0,
    browOuterUpRight: 0,
    gazeX: 0,
    gazeY: 0,
  }
}
