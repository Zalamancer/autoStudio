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
 * Each entry defines which landmarks form the bone direction vector,
 * which BoneCategory it maps to, and which mapping is its FK parent
 * (for computing relative/local rotations instead of absolute ones).
 *
 * In FK, each joint's rotation is LOCAL (relative to parent orientation).
 * We compute: local_rotation = (detected_angle - parent_detected_angle) - (rest_angle - parent_rest_angle)
 */
interface BoneMapping {
  category: BoneCategory
  parentLandmark: number
  childLandmark: number
  /** Index into this array of the FK parent mapping (null = root-level) */
  parentMapping: number | null
}

const POSE_TO_BONE_CATEGORY: BoneMapping[] = [
  // 0: Torso: hip midpoint to shoulder midpoint (computed separately)
  {
    category: 'torso',
    parentLandmark: MP_LANDMARKS.LEFT_HIP,
    childLandmark: MP_LANDMARKS.LEFT_SHOULDER,
    parentMapping: null,
  },

  // 1: Head: nose direction (child of torso)
  { category: 'head', parentLandmark: MP_LANDMARKS.NOSE, childLandmark: MP_LANDMARKS.LEFT_EYE, parentMapping: 0 },

  // 2: Left upper arm (child of torso)
  {
    category: 'arm-left',
    parentLandmark: MP_LANDMARKS.LEFT_SHOULDER,
    childLandmark: MP_LANDMARKS.LEFT_ELBOW,
    parentMapping: 0,
  },
  // 3: Left forearm (child of left upper arm)
  {
    category: 'hand-left',
    parentLandmark: MP_LANDMARKS.LEFT_ELBOW,
    childLandmark: MP_LANDMARKS.LEFT_WRIST,
    parentMapping: 2,
  },

  // 4: Right upper arm (child of torso)
  {
    category: 'arm-right',
    parentLandmark: MP_LANDMARKS.RIGHT_SHOULDER,
    childLandmark: MP_LANDMARKS.RIGHT_ELBOW,
    parentMapping: 0,
  },
  // 5: Right forearm (child of right upper arm)
  {
    category: 'hand-right',
    parentLandmark: MP_LANDMARKS.RIGHT_ELBOW,
    childLandmark: MP_LANDMARKS.RIGHT_WRIST,
    parentMapping: 4,
  },

  // 6: Left upper leg (child of torso)
  {
    category: 'leg-left',
    parentLandmark: MP_LANDMARKS.LEFT_HIP,
    childLandmark: MP_LANDMARKS.LEFT_KNEE,
    parentMapping: 0,
  },

  // 7: Right upper leg (child of torso)
  {
    category: 'leg-right',
    parentLandmark: MP_LANDMARKS.RIGHT_HIP,
    childLandmark: MP_LANDMARKS.RIGHT_KNEE,
    parentMapping: 0,
  },
]

/**
 * Compute the 2D angle (in degrees) from a parent landmark to a child landmark.
 * MediaPipe coordinates: x right, y down, z toward camera.
 * We project to 2D (x, y) and compute the angle relative to the vertical (y-down).
 */
function landmarkAngle2D(parent: Landmark3D, child: Landmark3D, mirror: boolean): number {
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
/**
 * Check if a landmark is within the camera frame using normalized screen coords.
 * MediaPipe estimates positions for off-screen body parts (e.g. legs when
 * only upper body visible). Screen-space coordinates below 0.02 or above 0.98
 * indicate the landmark is at the frame edge → likely estimated, not detected.
 */
function isInFrame(lm: Landmark3D): boolean {
  return lm.x > 0.02 && lm.x < 0.98 && lm.y > 0.02 && lm.y < 0.98
}

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
    /** Normalized screen-space landmarks (0-1) for frame-boundary checks */
    screenLandmarks?: Landmark3D[] | null
  } = {},
): BonePose {
  const { sensitivity = 1.0, mirror = true, visibilityThreshold = 0.5, screenLandmarks } = options
  const pose: BonePose = {}

  // Initialize all joints with zero pose
  for (const joint of skeleton.joints) {
    pose[joint.id] = { dx: 0, dy: 0, rotation: 0 }
  }

  if (landmarks.length < 33) return pose

  // Build a map of jointId -> absolute rest angle
  const restAngles = computeRestAngles(skeleton)

  // First pass: compute absolute detected angles for each mapping
  const detectedAngles: (number | null)[] = new Array(POSE_TO_BONE_CATEGORY.length).fill(null)

  for (let i = 0; i < POSE_TO_BONE_CATEGORY.length; i++) {
    const mapping = POSE_TO_BONE_CATEGORY[i]
    const parentLM = landmarks[mapping.parentLandmark]
    const childLM = landmarks[mapping.childLandmark]

    if (parentLM.visibility < visibilityThreshold || childLM.visibility < visibilityThreshold) continue

    // Use screen-space landmarks for frame-boundary check (world landmarks are in meters, not 0-1)
    if (screenLandmarks && screenLandmarks.length >= 33) {
      const parentScreen = screenLandmarks[mapping.parentLandmark]
      const childScreen = screenLandmarks[mapping.childLandmark]
      if (!isInFrame(parentScreen) || !isInFrame(childScreen)) continue
    }

    if (mapping.category === 'torso') {
      const hipMid = midpoint2D(landmarks[MP_LANDMARKS.LEFT_HIP], landmarks[MP_LANDMARKS.RIGHT_HIP])
      const shoulderMid = midpoint2D(landmarks[MP_LANDMARKS.LEFT_SHOULDER], landmarks[MP_LANDMARKS.RIGHT_SHOULDER])
      detectedAngles[i] = landmarkAngle2D(hipMid, shoulderMid, mirror)
    } else {
      detectedAngles[i] = landmarkAngle2D(parentLM, childLM, mirror)
    }
  }

  // Second pass: compute LOCAL rotations (relative to FK parent bone)
  // In FK, rotating a parent already moves children. So each joint's rotation
  // must be relative to its parent's orientation, not absolute.
  for (let i = 0; i < POSE_TO_BONE_CATEGORY.length; i++) {
    const mapping = POSE_TO_BONE_CATEGORY[i]
    if (detectedAngles[i] === null) continue

    const detectedAbs = detectedAngles[i]!
    const parentIdx = mapping.parentMapping
    const parentDetectedAbs = parentIdx !== null && detectedAngles[parentIdx] !== null ? detectedAngles[parentIdx]! : 0

    // Local detected angle = bone angle relative to parent bone
    const detectedLocal = detectedAbs - parentDetectedAbs

    // Find the correct joint(s) to rotate for this mapping.
    //
    // In FK, the joint at the START of a body segment controls that segment's
    // direction. For example, elbow→wrist direction is controlled by the elbow
    // joint, not the wrist.
    //
    // The auto-rig assigns categories like:
    //   shoulder(arm-left) → elbow(arm-left) → wrist(hand-left) → fingers(hand-left)
    //
    // For a child mapping (e.g. hand-left with parentMapping arm-left):
    //   The forearm rotation should drive the ELBOW (last arm-left joint),
    //   not the wrist (first hand-left joint).
    //
    // Strategy:
    //   - If this mapping has a parentMapping, find the CHILD joints of the
    //     parent category chain (joints whose parent has the same category).
    //     These are the "elbow" joints that control the child segment.
    //   - Otherwise, find the ROOT joints of this category chain (no parent
    //     with same category). These are the "shoulder" joints.

    let targetJoints: BoneJoint[]

    if (mapping.parentMapping !== null) {
      // Child mapping (e.g. hand-left, leg-left): rotate the last joint(s)
      // of the PARENT category chain — the joint that bends this segment
      const parentCategory = POSE_TO_BONE_CATEGORY[mapping.parentMapping].category
      targetJoints = skeleton.joints.filter((j) => {
        if (j.category !== parentCategory) return false
        // Must have a parent with the SAME category (i.e., it's a child in the chain)
        if (!j.parentId) return false
        const parent = skeleton.joints.find((p) => p.id === j.parentId)
        return parent?.category === parentCategory
      })

      // Fallback: if no child joints found in parent chain (single-joint category),
      // use the root joints of THIS mapping's category instead
      if (targetJoints.length === 0) {
        targetJoints = findJointsByCategory(skeleton, mapping.category).filter((j) => {
          if (!j.parentId) return true
          const parent = skeleton.joints.find((p) => p.id === j.parentId)
          return parent?.category !== mapping.category
        })
      }
    } else {
      // Root mapping (e.g. arm-left, torso): rotate the first joint(s) of this category
      targetJoints = findJointsByCategory(skeleton, mapping.category).filter((j) => {
        if (!j.parentId) return true
        const parent = skeleton.joints.find((p) => p.id === j.parentId)
        return parent?.category !== mapping.category
      })
    }

    for (const joint of targetJoints) {
      const restAbs = restAngles.get(joint.id) ?? 0
      const restParentAbs = joint.parentId ? (restAngles.get(joint.parentId) ?? 0) : 0
      const restLocal = restAbs - restParentAbs

      const rotation = (detectedLocal - restLocal) * sensitivity

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
export function smoothBonePose(prev: BonePose, curr: BonePose, factor: number): BonePose {
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
