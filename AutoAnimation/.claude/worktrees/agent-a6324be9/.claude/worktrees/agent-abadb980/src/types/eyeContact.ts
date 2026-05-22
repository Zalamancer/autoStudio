/**
 * AI Eye Contact Correction Type Definitions
 *
 * Types for ML-based gaze redirection using MediaPipe Face Mesh + canvas warping.
 * Detects eye regions in character sprites and warps the gaze direction to face
 * the camera or a specified target point.
 */

/** Bounding box for an eye region within a sprite */
export interface EyeRegionBox {
  /** Normalized coordinates (0-1) relative to image dimensions */
  x: number
  y: number
  width: number
  height: number
}

/** Detected eye regions in a character sprite */
export interface EyeDetectionResult {
  leftEye: EyeRegionBox | null
  rightEye: EyeRegionBox | null
  /** Estimated gaze direction (normalized -1 to 1) */
  gazeDirection: { x: number; y: number }
  /** Confidence score 0-1 */
  confidence: number
}

/** Target for gaze redirection */
export type GazeTarget =
  | { type: 'camera' }
  | { type: 'point'; x: number; y: number }
  | { type: 'character'; characterId: string }

/** Settings for eye contact correction */
export interface EyeContactSettings {
  /** Whether eye contact correction is enabled */
  enabled: boolean
  /** Gaze target */
  target: GazeTarget
  /** Strength of the correction 0-1 (0 = no change, 1 = full redirect) */
  strength: number
  /** Whether to apply to all emotion head variants */
  applyToAllVariants: boolean
  /** Smoothing factor for animated gaze transitions */
  transitionSmoothing: number
}

/** Result of processing a sprite with eye contact correction */
export interface EyeCorrectedSprite {
  /** Original sprite data URL */
  originalSrc: string
  /** Corrected sprite data URL */
  correctedSrc: string
  /** Detection result used */
  detection: EyeDetectionResult
  /** Target used for correction */
  target: GazeTarget
}

/** Processing status for batch eye correction */
export interface EyeCorrectionBatchStatus {
  total: number
  processed: number
  failed: number
  results: EyeCorrectedSprite[]
  isProcessing: boolean
  error: string | null
}

/** Default eye contact settings */
export const DEFAULT_EYE_CONTACT_SETTINGS: EyeContactSettings = {
  enabled: false,
  target: { type: 'camera' },
  strength: 0.8,
  applyToAllVariants: true,
  transitionSmoothing: 0.3,
}
