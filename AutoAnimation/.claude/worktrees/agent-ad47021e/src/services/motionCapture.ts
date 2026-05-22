/**
 * Motion Capture Service — extracts 3D skeleton poses from video using MediaPipe Pose.
 *
 * Runs entirely client-side via WebAssembly. Extracts 33 3D landmarks per frame,
 * converts them to bone rotations compatible with BonePose3D, and produces
 * a THREE.AnimationClip that can be retargeted onto any ProAnimate 3D character.
 */
import * as THREE from 'three'
import type { BoneMapping, StandardBoneName } from '@/types/character3d'
import type { Vec3, Quat } from '@/types/rig3d'

// ── MediaPipe Landmark Indices ─────────────────────────────────────────────

/** MediaPipe Pose landmark indices (33 landmarks) */
export const MP_LANDMARKS = {
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

/** A single 3D landmark from MediaPipe */
export interface Landmark3D {
  x: number
  y: number
  z: number
  visibility: number
}

/** All 33 landmarks for a single frame */
export type FrameLandmarks = Landmark3D[]

/** Progress callback during extraction */
export type ProgressCallback = (progress: number, message: string) => void

// ── MediaPipe Bone → StandardBoneName Mapping ─────────────────────────────

/**
 * Maps MediaPipe landmark pairs to ProAnimate's StandardBoneName.
 * Each entry: [parentLandmark, childLandmark] → StandardBoneName
 * The rotation is computed from the direction vector between parent→child.
 */
export const MEDIAPIPE_BONE_MAPPING: Record<StandardBoneName, [number, number]> = {
  Pelvis: [MP_LANDMARKS.LEFT_HIP, MP_LANDMARKS.RIGHT_HIP],
  Spine1: [MP_LANDMARKS.LEFT_HIP, MP_LANDMARKS.LEFT_SHOULDER], // hip midpoint → shoulder midpoint
  Spine2: [MP_LANDMARKS.LEFT_HIP, MP_LANDMARKS.LEFT_SHOULDER],
  Spine3: [MP_LANDMARKS.LEFT_SHOULDER, MP_LANDMARKS.RIGHT_SHOULDER],
  Neck: [MP_LANDMARKS.LEFT_SHOULDER, MP_LANDMARKS.NOSE],
  Head: [MP_LANDMARKS.NOSE, MP_LANDMARKS.LEFT_EYE],
  L_Collar: [MP_LANDMARKS.LEFT_SHOULDER, MP_LANDMARKS.LEFT_SHOULDER],
  L_Shoulder: [MP_LANDMARKS.LEFT_SHOULDER, MP_LANDMARKS.LEFT_ELBOW],
  L_Elbow: [MP_LANDMARKS.LEFT_ELBOW, MP_LANDMARKS.LEFT_WRIST],
  L_Wrist: [MP_LANDMARKS.LEFT_WRIST, MP_LANDMARKS.LEFT_INDEX],
  R_Collar: [MP_LANDMARKS.RIGHT_SHOULDER, MP_LANDMARKS.RIGHT_SHOULDER],
  R_Shoulder: [MP_LANDMARKS.RIGHT_SHOULDER, MP_LANDMARKS.RIGHT_ELBOW],
  R_Elbow: [MP_LANDMARKS.RIGHT_ELBOW, MP_LANDMARKS.RIGHT_WRIST],
  R_Wrist: [MP_LANDMARKS.RIGHT_WRIST, MP_LANDMARKS.RIGHT_INDEX],
  L_Hip: [MP_LANDMARKS.LEFT_HIP, MP_LANDMARKS.LEFT_KNEE],
  L_Knee: [MP_LANDMARKS.LEFT_KNEE, MP_LANDMARKS.LEFT_ANKLE],
  L_Ankle: [MP_LANDMARKS.LEFT_ANKLE, MP_LANDMARKS.LEFT_FOOT_INDEX],
  R_Hip: [MP_LANDMARKS.RIGHT_HIP, MP_LANDMARKS.RIGHT_KNEE],
  R_Knee: [MP_LANDMARKS.RIGHT_KNEE, MP_LANDMARKS.RIGHT_ANKLE],
  R_Ankle: [MP_LANDMARKS.RIGHT_ANKLE, MP_LANDMARKS.RIGHT_FOOT_INDEX],
}

// ── Vector Math Helpers ───────────────────────────────────────────────────

function midpoint(a: Landmark3D, b: Landmark3D): THREE.Vector3 {
  return new THREE.Vector3((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2)
}

function landmarkToVec3(l: Landmark3D): THREE.Vector3 {
  return new THREE.Vector3(l.x, l.y, l.z)
}

/**
 * Compute the rotation quaternion that aligns the Y-axis with the direction
 * from `from` to `to`. Returns identity if the vectors are too close.
 */
function directionToQuaternion(from: THREE.Vector3, to: THREE.Vector3): THREE.Quaternion {
  const dir = to.clone().sub(from).normalize()
  if (dir.lengthSq() < 0.001) return new THREE.Quaternion()

  const up = new THREE.Vector3(0, 1, 0)
  const quat = new THREE.Quaternion()
  const mat = new THREE.Matrix4()
  mat.lookAt(new THREE.Vector3(), dir, up)
  quat.setFromRotationMatrix(mat)
  return quat
}

// ── Core Landmark Processing ──────────────────────────────────────────────

/**
 * Convert a single frame of MediaPipe landmarks to bone rotations.
 * Returns a map of StandardBoneName → quaternion rotation.
 */
export function landmarksToBoneRotations(
  landmarks: FrameLandmarks
): Record<string, { position: Vec3; quaternion: Quat }> {
  const result: Record<string, { position: Vec3; quaternion: Quat }> = {}

  // Compute hip center as the root position
  const hipCenter = midpoint(landmarks[MP_LANDMARKS.LEFT_HIP], landmarks[MP_LANDMARKS.RIGHT_HIP])
  const shoulderCenter = midpoint(
    landmarks[MP_LANDMARKS.LEFT_SHOULDER],
    landmarks[MP_LANDMARKS.RIGHT_SHOULDER]
  )

  // MediaPipe uses a coordinate system where Y increases downward and Z comes toward camera.
  // We flip Y to match Three.js convention (Y-up).
  const flipY = (v: THREE.Vector3) => new THREE.Vector3(v.x, -v.y, -v.z)

  // Pelvis: rotation from hip-to-hip direction (determines body twist)
  const leftHip = flipY(landmarkToVec3(landmarks[MP_LANDMARKS.LEFT_HIP]))
  const rightHip = flipY(landmarkToVec3(landmarks[MP_LANDMARKS.RIGHT_HIP]))
  const pelvisRight = rightHip.clone().sub(leftHip).normalize()
  const pelvisUp = flipY(shoulderCenter).sub(flipY(hipCenter)).normalize()
  const pelvisForward = new THREE.Vector3().crossVectors(pelvisRight, pelvisUp).normalize()
  const pelvisMat = new THREE.Matrix4().makeBasis(pelvisRight, pelvisUp, pelvisForward)
  const pelvisQuat = new THREE.Quaternion().setFromRotationMatrix(pelvisMat)

  result['Pelvis'] = {
    position: { x: flipY(hipCenter).x, y: flipY(hipCenter).y, z: flipY(hipCenter).z },
    quaternion: { x: pelvisQuat.x, y: pelvisQuat.y, z: pelvisQuat.z, w: pelvisQuat.w },
  }

  // Spine: hip center → shoulder center
  const spineQuat = directionToQuaternion(flipY(hipCenter), flipY(shoulderCenter))
  result['Spine1'] = {
    position: { x: 0, y: 0, z: 0 },
    quaternion: { x: spineQuat.x, y: spineQuat.y, z: spineQuat.z, w: spineQuat.w },
  }

  // Neck: shoulder center → nose
  const neckQuat = directionToQuaternion(
    flipY(shoulderCenter),
    flipY(landmarkToVec3(landmarks[MP_LANDMARKS.NOSE]))
  )
  result['Neck'] = {
    position: { x: 0, y: 0, z: 0 },
    quaternion: { x: neckQuat.x, y: neckQuat.y, z: neckQuat.z, w: neckQuat.w },
  }

  // Head: nose → midpoint of eyes
  const eyeCenter = midpoint(landmarks[MP_LANDMARKS.LEFT_EYE], landmarks[MP_LANDMARKS.RIGHT_EYE])
  const headQuat = directionToQuaternion(
    flipY(landmarkToVec3(landmarks[MP_LANDMARKS.NOSE])),
    flipY(eyeCenter)
  )
  result['Head'] = {
    position: { x: 0, y: 0, z: 0 },
    quaternion: { x: headQuat.x, y: headQuat.y, z: headQuat.z, w: headQuat.w },
  }

  // Arms
  const armBones: Array<{
    name: StandardBoneName
    from: number
    to: number
  }> = [
    { name: 'L_Shoulder', from: MP_LANDMARKS.LEFT_SHOULDER, to: MP_LANDMARKS.LEFT_ELBOW },
    { name: 'L_Elbow', from: MP_LANDMARKS.LEFT_ELBOW, to: MP_LANDMARKS.LEFT_WRIST },
    { name: 'L_Wrist', from: MP_LANDMARKS.LEFT_WRIST, to: MP_LANDMARKS.LEFT_INDEX },
    { name: 'R_Shoulder', from: MP_LANDMARKS.RIGHT_SHOULDER, to: MP_LANDMARKS.RIGHT_ELBOW },
    { name: 'R_Elbow', from: MP_LANDMARKS.RIGHT_ELBOW, to: MP_LANDMARKS.RIGHT_WRIST },
    { name: 'R_Wrist', from: MP_LANDMARKS.RIGHT_WRIST, to: MP_LANDMARKS.RIGHT_INDEX },
  ]

  for (const { name, from, to } of armBones) {
    const fromVec = flipY(landmarkToVec3(landmarks[from]))
    const toVec = flipY(landmarkToVec3(landmarks[to]))
    const q = directionToQuaternion(fromVec, toVec)
    result[name] = {
      position: { x: 0, y: 0, z: 0 },
      quaternion: { x: q.x, y: q.y, z: q.z, w: q.w },
    }
  }

  // Legs
  const legBones: Array<{
    name: StandardBoneName
    from: number
    to: number
  }> = [
    { name: 'L_Hip', from: MP_LANDMARKS.LEFT_HIP, to: MP_LANDMARKS.LEFT_KNEE },
    { name: 'L_Knee', from: MP_LANDMARKS.LEFT_KNEE, to: MP_LANDMARKS.LEFT_ANKLE },
    { name: 'L_Ankle', from: MP_LANDMARKS.LEFT_ANKLE, to: MP_LANDMARKS.LEFT_FOOT_INDEX },
    { name: 'R_Hip', from: MP_LANDMARKS.RIGHT_HIP, to: MP_LANDMARKS.RIGHT_KNEE },
    { name: 'R_Knee', from: MP_LANDMARKS.RIGHT_KNEE, to: MP_LANDMARKS.RIGHT_ANKLE },
    { name: 'R_Ankle', from: MP_LANDMARKS.RIGHT_ANKLE, to: MP_LANDMARKS.RIGHT_FOOT_INDEX },
  ]

  for (const { name, from, to } of legBones) {
    const fromVec = flipY(landmarkToVec3(landmarks[from]))
    const toVec = flipY(landmarkToVec3(landmarks[to]))
    const q = directionToQuaternion(fromVec, toVec)
    result[name] = {
      position: { x: 0, y: 0, z: 0 },
      quaternion: { x: q.x, y: q.y, z: q.z, w: q.w },
    }
  }

  return result
}

// ── Video Frame Extraction ───────────────────────────────────────────────

/**
 * Extract frames from a video at the specified FPS using an offscreen canvas.
 * Returns an array of ImageData objects.
 */
export async function extractVideoFrames(
  videoBlob: Blob,
  fps: number,
  onProgress?: ProgressCallback
): Promise<HTMLCanvasElement[]> {
  const videoUrl = URL.createObjectURL(videoBlob)

  try {
    const video = document.createElement('video')
    video.src = videoUrl
    video.muted = true
    video.playsInline = true

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = () => reject(new Error('Failed to load video'))
    })

    const duration = video.duration
    const totalFrames = Math.ceil(duration * fps)
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')!

    const frames: HTMLCanvasElement[] = []
    const frameInterval = 1 / fps

    for (let i = 0; i < totalFrames; i++) {
      const time = i * frameInterval
      if (time > duration) break

      video.currentTime = time
      await new Promise<void>((resolve) => {
        video.onseeked = () => resolve()
      })

      ctx.drawImage(video, 0, 0)

      // Create a snapshot canvas for this frame
      const frameCanvas = document.createElement('canvas')
      frameCanvas.width = canvas.width
      frameCanvas.height = canvas.height
      const frameCtx = frameCanvas.getContext('2d')!
      frameCtx.drawImage(canvas, 0, 0)
      frames.push(frameCanvas)

      onProgress?.(Math.round((i / totalFrames) * 50), `Extracting frame ${i + 1}/${totalFrames}`)
    }

    return frames
  } finally {
    URL.revokeObjectURL(videoUrl)
  }
}

// ── MediaPipe Pose Extraction ────────────────────────────────────────────

/**
 * Process video frames through MediaPipe Pose Landmarker.
 * Uses the @mediapipe/tasks-vision package (client-side WASM).
 */
export async function extractPoseLandmarks(
  frames: HTMLCanvasElement[],
  onProgress?: ProgressCallback
): Promise<FrameLandmarks[]> {
  // Dynamically import MediaPipe tasks-vision to keep bundle size small
  const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')

  onProgress?.(50, 'Loading MediaPipe model...')

  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  )

  const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task',
      delegate: 'GPU',
    },
    runningMode: 'IMAGE',
    numPoses: 1,
  })

  const allLandmarks: FrameLandmarks[] = []

  for (let i = 0; i < frames.length; i++) {
    const result = poseLandmarker.detect(frames[i])

    if (result.worldLandmarks && result.worldLandmarks.length > 0) {
      // Use world landmarks (3D in meters, camera-relative)
      allLandmarks.push(
        result.worldLandmarks[0].map((l) => ({
          x: l.x,
          y: l.y,
          z: l.z,
          visibility: l.visibility ?? 1,
        }))
      )
    } else {
      // No pose detected — use last known or zero
      allLandmarks.push(
        allLandmarks.length > 0
          ? allLandmarks[allLandmarks.length - 1]
          : Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, visibility: 0 }))
      )
    }

    onProgress?.(
      50 + Math.round((i / frames.length) * 40),
      `Processing pose ${i + 1}/${frames.length}`
    )
  }

  poseLandmarker.close()
  return allLandmarks
}

// ── Animation Clip Generation ────────────────────────────────────────────

/**
 * Convert a sequence of per-frame landmarks into a THREE.AnimationClip.
 * The clip uses the ProAnimate StandardBoneName convention and can be
 * retargeted onto any character skeleton via autoRemapClip().
 */
export function landmarksToAnimationClip(
  allLandmarks: FrameLandmarks[],
  fps: number,
  targetBoneMapping?: BoneMapping
): THREE.AnimationClip {
  const duration = allLandmarks.length / fps
  const tracks: THREE.KeyframeTrack[] = []

  // Bones we generate tracks for
  const boneNames: StandardBoneName[] = [
    'Pelvis',
    'Spine1',
    'Neck',
    'Head',
    'L_Shoulder',
    'L_Elbow',
    'L_Wrist',
    'R_Shoulder',
    'R_Elbow',
    'R_Wrist',
    'L_Hip',
    'L_Knee',
    'L_Ankle',
    'R_Hip',
    'R_Knee',
    'R_Ankle',
  ]

  // Precompute all frames
  const allRotations = allLandmarks.map((landmarks) => landmarksToBoneRotations(landmarks))

  for (const boneName of boneNames) {
    // Map standard name to actual bone name if mapping provided
    const actualBoneName = targetBoneMapping?.[boneName] || boneName

    const times: number[] = []
    const quaternionValues: number[] = []
    const positionValues: number[] = []

    for (let i = 0; i < allRotations.length; i++) {
      const t = i / fps
      const boneData = allRotations[i][boneName]
      if (!boneData) continue

      times.push(t)
      quaternionValues.push(boneData.quaternion.x, boneData.quaternion.y, boneData.quaternion.z, boneData.quaternion.w)

      // Only add position track for root (Pelvis)
      if (boneName === 'Pelvis') {
        positionValues.push(boneData.position.x, boneData.position.y, boneData.position.z)
      }
    }

    if (times.length > 0) {
      tracks.push(
        new THREE.QuaternionKeyframeTrack(
          `${actualBoneName}.quaternion`,
          times,
          quaternionValues
        )
      )

      if (boneName === 'Pelvis' && positionValues.length > 0) {
        tracks.push(
          new THREE.VectorKeyframeTrack(
            `${actualBoneName}.position`,
            times,
            positionValues
          )
        )
      }
    }
  }

  return new THREE.AnimationClip('mocap', duration, tracks)
}

// ── Full Pipeline ────────────────────────────────────────────────────────

export interface MotionCaptureResult {
  /** The generated animation clip */
  clip: THREE.AnimationClip
  /** Per-frame landmarks (for skeleton preview overlay) */
  landmarks: FrameLandmarks[]
  /** Frames per second used */
  fps: number
  /** Duration in seconds */
  durationSeconds: number
  /** Number of frames processed */
  frameCount: number
}

/**
 * Full motion capture pipeline: video → frames → landmarks → animation clip.
 */
export async function captureMotionFromVideo(
  videoBlob: Blob,
  fps: number = 24,
  targetBoneMapping?: BoneMapping,
  onProgress?: ProgressCallback
): Promise<MotionCaptureResult> {
  onProgress?.(0, 'Starting motion capture...')

  // 1. Extract video frames
  const frames = await extractVideoFrames(videoBlob, fps, onProgress)
  if (frames.length === 0) throw new Error('No frames extracted from video')

  // 2. Run MediaPipe pose detection
  const landmarks = await extractPoseLandmarks(frames, onProgress)
  if (landmarks.length === 0) throw new Error('No poses detected in video')

  onProgress?.(90, 'Generating animation clip...')

  // 3. Convert to animation clip
  const clip = landmarksToAnimationClip(landmarks, fps, targetBoneMapping)

  onProgress?.(100, 'Motion capture complete')

  return {
    clip,
    landmarks,
    fps,
    durationSeconds: landmarks.length / fps,
    frameCount: landmarks.length,
  }
}
