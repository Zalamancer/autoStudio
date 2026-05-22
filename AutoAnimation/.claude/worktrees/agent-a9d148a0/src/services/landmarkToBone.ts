/**
 * Landmark to Bone Mapper
 *
 * Converts MediaPipe pose landmarks (33 body points) to 2D rig bone transforms
 * compatible with ProAnimate's BonePose system. Also provides facial expression
 * to emotion head mapping and mouth openness to viseme approximation.
 *
 * The key challenge is translating MediaPipe's 3D world coordinates into 2D bone
 * rotations relative to each bone's parent in the rig skeleton hierarchy.
 */

import type { FaceTrackingData } from '@/types/motionTracking'
import type { BonePose, BoneJoint, BoneSkeleton, BoneCategory } from '@/types/rig'
import type { Landmark3D } from '@/services/motionCapture'
import { MP_LANDMARKS } from '@/services/motionCapture'
import type { EmotionCategory, EmotionLevel } from '@/types/emotionHeads'

// ── Viseme Approximation from Face Data ────────────────────────────────

/** The 8-viseme system used by ProAnimate */
export type VisemeName = 'Rest' | 'Aa' | 'E' | 'O' | 'U' | 'Mbp' | 'Fv' | 'Th'

/**
 * Approximate viseme from jaw openness, mouth smile, and lip positions.
 * This is a simplified heuristic -- real lip sync should use audio-based detection.
 */
export function faceDataToViseme(face: FaceTrackingData): VisemeName {
  const jawOpen = face.jawOpen
  const smile = face.mouthSmile

  if (jawOpen < 0.08) return 'Rest'

  // Lips pressed = M/B/P
  if (jawOpen < 0.12 && smile < 0.1) return 'Mbp'

  // Wide smile + some opening = E (ee)
  if (smile > 0.4 && jawOpen > 0.1) return 'E'

  // Wide open = Aa (ah)
  if (jawOpen > 0.5) return 'Aa'

  // Medium open, no smile = O
  if (jawOpen > 0.25 && Math.abs(smile) < 0.2) return 'O'

  // Pursed/rounded = U (oo)
  if (jawOpen > 0.12 && jawOpen < 0.3 && smile < -0.1) return 'U'

  // Low-medium open = could be F/V or Th based on position
  if (jawOpen > 0.1 && jawOpen < 0.25) return 'Fv'

  return 'Rest'
}

// ── Emotion Detection from Face Data ───────────────────────────────────

export interface DetectedEmotion {
  category: EmotionCategory
  level: EmotionLevel
  confidence: number
}

/**
 * Detect the dominant emotion from face tracking blendshape data.
 * Maps eyebrow position, mouth smile/frown, eye openness, and jaw
 * to the 6-emotion x 4-intensity grid.
 */
export function faceDataToEmotion(face: FaceTrackingData): DetectedEmotion {
  const smile = face.mouthSmile
  const browRaise = face.browInnerUp
  const browOuter = (face.browOuterUpLeft + face.browOuterUpRight) / 2
  const blink = (face.eyeBlinkLeft + face.eyeBlinkRight) / 2
  const jawOpen = face.jawOpen

  // Score each emotion category
  const scores: Array<{ category: EmotionCategory; score: number }> = [
    { category: 'Joy', score: Math.max(0, smile) * 2 },
    { category: 'Anger', score: Math.max(0, -smile * 0.5) + Math.max(0, 0.3 - browOuter) },
    { category: 'Disgust', score: Math.max(0, -smile) * 0.8 },
    { category: 'Fear', score: browRaise * 1.5 + Math.max(0, jawOpen - 0.3) * 0.5 },
    { category: 'Sadness', score: Math.max(0, -smile) * 0.6 + blink * 0.3 },
    { category: 'Surprise', score: browRaise + browOuter + jawOpen * 0.5 },
  ]

  // Find dominant emotion
  scores.sort((a, b) => b.score - a.score)
  const best = scores[0]

  // Map score intensity to 4 levels
  let level: EmotionLevel
  if (best.score < 0.2) level = 1
  else if (best.score < 0.5) level = 2
  else if (best.score < 0.8) level = 3
  else level = 4

  return {
    category: best.category,
    level,
    confidence: Math.min(1, best.score),
  }
}

// ── Pose Landmarks to 2D Rig Bones ─────────────────────────────────────

/**
 * Mapping from MediaPipe landmark pairs to 2D rig bone categories.
 * Each entry defines which landmarks form the bone direction vector
 * and which BoneCategory it maps to.
 */
const POSE_TO_BONE_CATEGORY: Array<{
  category: BoneCategory
  parentLandmark: number
  childLandmark: number
  /** Optional secondary landmarks for better angle computation */
  referenceLandmark?: number
}> = [
  // Torso: hip midpoint to shoulder midpoint (computed separately)
  { category: 'torso', parentLandmark: MP_LANDMARKS.LEFT_HIP, childLandmark: MP_LANDMARKS.LEFT_SHOULDER },

  // Head: nose direction
  { category: 'head', parentLandmark: MP_LANDMARKS.NOSE, childLandmark: MP_LANDMARKS.LEFT_EYE },

  // Left arm
  { category: 'arm-left', parentLandmark: MP_LANDMARKS.LEFT_SHOULDER, childLandmark: MP_LANDMARKS.LEFT_ELBOW },
  { category: 'hand-left', parentLandmark: MP_LANDMARKS.LEFT_ELBOW, childLandmark: MP_LANDMARKS.LEFT_WRIST },

  // Right arm
  { category: 'arm-right', parentLandmark: MP_LANDMARKS.RIGHT_SHOULDER, childLandmark: MP_LANDMARKS.RIGHT_ELBOW },
  { category: 'hand-right', parentLandmark: MP_LANDMARKS.RIGHT_ELBOW, childLandmark: MP_LANDMARKS.RIGHT_WRIST },

  // Left leg
  { category: 'leg-left', parentLandmark: MP_LANDMARKS.LEFT_HIP, childLandmark: MP_LANDMARKS.LEFT_KNEE },

  // Right leg
  { category: 'leg-right', parentLandmark: MP_LANDMARKS.RIGHT_HIP, childLandmark: MP_LANDMARKS.RIGHT_KNEE },
]

/**
 * Compute the 2D angle (in degrees) from a parent landmark to a child landmark.
 * MediaPipe coordinates: x right, y down, z toward camera.
 * We project to 2D (x, y) and compute the angle relative to the vertical (y-down).
 */
function landmarkAngle2D(
  parent: Landmark3D,
  child: Landmark3D,
  mirror: boolean,
): number {
  const dx = (child.x - parent.x) * (mirror ? -1 : 1)
  const dy = child.y - parent.y
  // Angle from vertical (y-down), clockwise positive
  return Math.atan2(dx, dy) * (180 / Math.PI)
}

/**
 * Compute a midpoint between two landmarks in 2D (x,y).
 */
function midpoint2D(a: Landmark3D, b: Landmark3D): Landmark3D {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
    visibility: Math.min(a.visibility, b.visibility),
  }
}

/**
 * Find joints in the skeleton that match a given bone category.
 * Returns all joints with the matching category.
 */
function findJointsByCategory(skeleton: BoneSkeleton, category: BoneCategory): BoneJoint[] {
  return skeleton.joints.filter((j) => j.category === category)
}

/**
 * Convert MediaPipe pose landmarks to a 2D BonePose for a given skeleton.
 *
 * Strategy:
 * 1. For each bone category in the rig, find the corresponding MediaPipe landmark pair
 * 2. Compute the 2D angle of the landmark direction vector
 * 3. Compute the rig bone's rest angle (from parent joint to child joint)
 * 4. The bone rotation = detected angle - rest angle
 * 5. Apply sensitivity scaling
 *
 * This produces rotation-only poses (no translation) since 2D rigs deform via
 * skinned mesh rotation rather than position offsets.
 */
export function poseLandmarksToBonePose(
  landmarks: Landmark3D[],
  skeleton: BoneSkeleton,
  options: {
    /** Sensitivity multiplier for rotations (default 1.0) */
    sensitivity?: number
    /** Mirror the input (webcam is typically mirrored) */
    mirror?: boolean
    /** Minimum landmark visibility to trust the data (0-1) */
    visibilityThreshold?: number
  } = {},
): BonePose {
  const { sensitivity = 1.0, mirror = true, visibilityThreshold = 0.5 } = options
  const pose: BonePose = {}

  // Initialize all joints with zero pose
  for (const joint of skeleton.joints) {
    pose[joint.id] = { dx: 0, dy: 0, rotation: 0 }
  }

  if (landmarks.length < 33) return pose

  // Build a map of category -> rest angle for joints
  const restAngles = computeRestAngles(skeleton)

  for (const mapping of POSE_TO_BONE_CATEGORY) {
    const parentLM = landmarks[mapping.parentLandmark]
    const childLM = landmarks[mapping.childLandmark]

    // Skip if landmarks are not visible enough
    if (parentLM.visibility < visibilityThreshold || childLM.visibility < visibilityThreshold) {
      continue
    }

    // Special handling for torso: use midpoints
    let detectedAngle: number
    if (mapping.category === 'torso') {
      const hipMid = midpoint2D(landmarks[MP_LANDMARKS.LEFT_HIP], landmarks[MP_LANDMARKS.RIGHT_HIP])
      const shoulderMid = midpoint2D(
        landmarks[MP_LANDMARKS.LEFT_SHOULDER],
        landmarks[MP_LANDMARKS.RIGHT_SHOULDER],
      )
      detectedAngle = landmarkAngle2D(hipMid, shoulderMid, mirror)
    } else {
      detectedAngle = landmarkAngle2D(parentLM, childLM, mirror)
    }

    // Find matching joints in the skeleton
    const joints = findJointsByCategory(skeleton, mapping.category)

    for (const joint of joints) {
      const restAngle = restAngles.get(joint.id) ?? 0
      const rotation = (detectedAngle - restAngle) * sensitivity

      pose[joint.id] = {
        dx: 0,
        dy: 0,
        rotation: clampAngle(rotation),
      }
    }
  }

  return pose
}

/**
 * Compute the rest angle of each joint in the skeleton.
 * The rest angle is the angle from the joint's parent to the joint,
 * measured in degrees from vertical (y-down).
 */
function computeRestAngles(skeleton: BoneSkeleton): Map<string, number> {
  const angles = new Map<string, number>()
  const jointMap = new Map<string, BoneJoint>()

  for (const joint of skeleton.joints) {
    jointMap.set(joint.id, joint)
  }

  for (const joint of skeleton.joints) {
    if (!joint.parentId) {
      angles.set(joint.id, 0)
      continue
    }

    const parent = jointMap.get(joint.parentId)
    if (!parent) {
      angles.set(joint.id, 0)
      continue
    }

    const dx = joint.restPosition.x - parent.restPosition.x
    const dy = joint.restPosition.y - parent.restPosition.y
    const angle = Math.atan2(dx, dy) * (180 / Math.PI)
    angles.set(joint.id, angle)
  }

  return angles
}

/**
 * Clamp an angle to [-180, 180] range.
 */
function clampAngle(deg: number): number {
  while (deg > 180) deg -= 360
  while (deg < -180) deg += 360
  return deg
}

// ── Head Rotation from Face Data ───────────────────────────────────────

/**
 * Convert face tracking head rotation to a BonePose entry for the head joint.
 * Returns rotation in degrees suitable for the 2D rig.
 */
export function faceDataToHeadPose(
  face: FaceTrackingData,
  skeleton: BoneSkeleton,
  options: {
    sensitivity?: number
    mirror?: boolean
  } = {},
): BonePose {
  const { sensitivity = 1.0, mirror = true } = options
  const pose: BonePose = {}

  // Initialize all joints
  for (const joint of skeleton.joints) {
    pose[joint.id] = { dx: 0, dy: 0, rotation: 0 }
  }

  // Find head joints
  const headJoints = findJointsByCategory(skeleton, 'head')
  const yawSign = mirror ? -1 : 1

  for (const joint of headJoints) {
    // Convert radians to degrees and apply sensitivity
    const rollDeg = face.headRotation.roll * (180 / Math.PI) * sensitivity * yawSign
    pose[joint.id] = {
      dx: 0,
      dy: 0,
      rotation: clampAngle(rollDeg),
    }
  }

  return pose
}

// ── Pose Smoothing ─────────────────────────────────────────────────────

/**
 * Apply exponential moving average smoothing to a bone pose.
 * Higher factor = smoother but more latency.
 */
export function smoothBonePose(
  prev: BonePose,
  curr: BonePose,
  factor: number,
): BonePose {
  const result: BonePose = {}
  const lerp = (a: number, b: number) => a * factor + b * (1 - factor)

  // Merge all joint IDs from both poses
  const allJointIds = new Set([...Object.keys(prev), ...Object.keys(curr)])

  for (const jointId of allJointIds) {
    const p = prev[jointId] ?? { dx: 0, dy: 0, rotation: 0 }
    const c = curr[jointId] ?? { dx: 0, dy: 0, rotation: 0 }

    result[jointId] = {
      dx: lerp(p.dx, c.dx),
      dy: lerp(p.dy, c.dy),
      rotation: lerp(p.rotation, c.rotation),
    }
  }

  return result
}

// ── Combined Pose Merge ────────────────────────────────────────────────

/**
 * Merge multiple bone poses together (e.g., body pose + head pose).
 * Later poses override earlier ones for the same joint.
 */
export function mergeBonePoses(...poses: BonePose[]): BonePose {
  const result: BonePose = {}

  for (const pose of poses) {
    for (const [jointId, state] of Object.entries(pose)) {
      const existing = result[jointId]
      if (existing) {
        // Additive merge for rotation, override for position
        result[jointId] = {
          dx: existing.dx + state.dx,
          dy: existing.dy + state.dy,
          rotation: existing.rotation + state.rotation,
        }
      } else {
        result[jointId] = { ...state }
      }
    }
  }

  return result
}
