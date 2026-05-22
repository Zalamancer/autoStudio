/**
 * Motion Transfer Service
 *
 * Extracts body poses from a reference video using MediaPipe Pose (33 landmarks),
 * smooths the extracted data, and writes the result as keyframes to 2D or 3D rig stores.
 *
 * Pipeline:
 * 1. Load reference video into a hidden <video> element
 * 2. Step through frames at the configured extraction FPS
 * 3. Run MediaPipe Pose on each frame to extract 33 body landmarks
 * 4. Apply temporal smoothing to reduce jitter
 * 5. Retarget poses to the character's bone structure
 * 6. Write as keyframes to the rig store
 */

import type {
  BodyPoseFrame,
  BodyLandmark,
  MotionTransferSettings,
  MotionTransferProgress,
  MotionTransferResult,
  PoseToBoneMapping,
} from '@/types/motionTransfer'
import { DEFAULT_POSE_TO_BONE_MAP, DEFAULT_MOTION_TRANSFER_SETTINGS } from '@/types/motionTransfer'

// Lazy-loaded MediaPipe Pose reference
type PoseLandmarker = import('@mediapipe/tasks-vision').PoseLandmarker

let poseLandmarkerInstance: PoseLandmarker | null = null

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task'

/**
 * Lazily initialize the MediaPipe PoseLandmarker.
 */
async function getPoseLandmarker(): Promise<PoseLandmarker> {
  if (poseLandmarkerInstance) return poseLandmarkerInstance

  const { PoseLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
  const vision = await FilesetResolver.forVisionTasks(WASM_URL)
  poseLandmarkerInstance = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: POSE_MODEL_URL,
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    numPoses: 1,
  })
  return poseLandmarkerInstance
}

/**
 * Load a video file and return metadata + a hidden video element.
 */
function loadVideoElement(file: File): Promise<{ video: HTMLVideoElement; duration: number; fps: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'

    const url = URL.createObjectURL(file)
    video.src = url

    video.onloadedmetadata = () => {
      // Estimate FPS (default to 30 if not determinable)
      const fps = 30
      resolve({ video, duration: video.duration, fps })
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load video file'))
    }
  })
}

/**
 * Seek the video to a specific timestamp and wait for the frame to be ready.
 */
function seekToTime(video: HTMLVideoElement, timeSeconds: number): Promise<void> {
  return new Promise((resolve) => {
    if (Math.abs(video.currentTime - timeSeconds) < 0.001) {
      resolve()
      return
    }
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      resolve()
    }
    video.addEventListener('seeked', onSeeked)
    video.currentTime = timeSeconds
  })
}

/**
 * Apply exponential moving average smoothing to a sequence of pose frames.
 */
function smoothPoseFrames(frames: BodyPoseFrame[], factor: number): BodyPoseFrame[] {
  if (frames.length <= 1 || factor <= 0) return frames

  const smoothed: BodyPoseFrame[] = [frames[0]]

  for (let i = 1; i < frames.length; i++) {
    const prev = smoothed[i - 1]
    const curr = frames[i]
    const smoothedLandmarks: BodyLandmark[] = []
    const smoothedWorldLandmarks: BodyLandmark[] = []

    for (let j = 0; j < curr.landmarks.length; j++) {
      const prevLm = prev.landmarks[j] || { x: 0, y: 0, z: 0, visibility: 0 }
      const currLm = curr.landmarks[j]
      smoothedLandmarks.push({
        x: prevLm.x * factor + currLm.x * (1 - factor),
        y: prevLm.y * factor + currLm.y * (1 - factor),
        z: prevLm.z * factor + currLm.z * (1 - factor),
        visibility: currLm.visibility,
      })
    }

    for (let j = 0; j < curr.worldLandmarks.length; j++) {
      const prevWlm = prev.worldLandmarks[j] || { x: 0, y: 0, z: 0, visibility: 0 }
      const currWlm = curr.worldLandmarks[j]
      smoothedWorldLandmarks.push({
        x: prevWlm.x * factor + currWlm.x * (1 - factor),
        y: prevWlm.y * factor + currWlm.y * (1 - factor),
        z: prevWlm.z * factor + currWlm.z * (1 - factor),
        visibility: currWlm.visibility,
      })
    }

    smoothed.push({
      frameIndex: curr.frameIndex,
      timestamp: curr.timestamp,
      landmarks: smoothedLandmarks,
      worldLandmarks: smoothedWorldLandmarks,
    })
  }

  return smoothed
}

/**
 * Extract body poses from a video file using MediaPipe Pose.
 *
 * @param file - The video file to process
 * @param settings - Extraction settings
 * @param onProgress - Progress callback
 * @param abortSignal - Optional abort signal to cancel processing
 */
export async function extractPosesFromVideo(
  file: File,
  settings: MotionTransferSettings = DEFAULT_MOTION_TRANSFER_SETTINGS,
  onProgress?: (progress: MotionTransferProgress) => void,
  abortSignal?: AbortSignal,
): Promise<MotionTransferResult> {
  onProgress?.({
    status: 'loading-video',
    currentFrame: 0,
    totalFrames: 0,
    percentage: 0,
  })

  const { video, duration } = await loadVideoElement(file)
  const extractionFps = settings.extractionFps
  const totalFrames = Math.ceil(duration * extractionFps)
  const frameInterval = 1 / extractionFps

  onProgress?.({
    status: 'extracting',
    currentFrame: 0,
    totalFrames,
    percentage: 0,
  })

  const landmarker = await getPoseLandmarker()
  const poseFrames: BodyPoseFrame[] = []

  for (let i = 0; i < totalFrames; i++) {
    if (abortSignal?.aborted) {
      throw new Error('Motion transfer cancelled')
    }

    const timestamp = i * frameInterval
    await seekToTime(video, timestamp)

    const result = landmarker.detectForVideo(video, timestamp * 1000)

    const landmarks: BodyLandmark[] = []
    const worldLandmarks: BodyLandmark[] = []

    if (result.landmarks && result.landmarks.length > 0) {
      for (const lm of result.landmarks[0]) {
        landmarks.push({
          x: lm.x,
          y: lm.y,
          z: lm.z,
          visibility: lm.visibility ?? 0,
        })
      }
    }

    if (result.worldLandmarks && result.worldLandmarks.length > 0) {
      for (const wlm of result.worldLandmarks[0]) {
        worldLandmarks.push({
          x: wlm.x,
          y: wlm.y,
          z: wlm.z,
          visibility: wlm.visibility ?? 0,
        })
      }
    }

    poseFrames.push({
      frameIndex: i,
      timestamp,
      landmarks,
      worldLandmarks,
    })

    onProgress?.({
      status: 'extracting',
      currentFrame: i + 1,
      totalFrames,
      percentage: Math.round(((i + 1) / totalFrames) * 100),
    })
  }

  // Clean up video element
  const videoSrc = video.src
  video.src = ''
  URL.revokeObjectURL(videoSrc)

  // Apply smoothing
  onProgress?.({
    status: 'smoothing',
    currentFrame: totalFrames,
    totalFrames,
    percentage: 100,
  })

  const smoothedFrames = smoothPoseFrames(poseFrames, settings.smoothing)

  return {
    poseFrames: smoothedFrames,
    sourceFps: extractionFps,
    sourceDuration: duration,
    totalFrames: smoothedFrames.length,
  }
}

/**
 * Convert extracted body pose landmarks to 2D rig bone positions.
 * Maps MediaPipe 33-landmark body to 2D rig joint positions.
 *
 * @param poseFrame - A single extracted pose frame
 * @param boneMapping - Mapping from bone names to landmark pairs
 * @param imageWidth - Canvas/image width for denormalization
 * @param imageHeight - Canvas/image height for denormalization
 */
export function poseFrameToJointPositions(
  poseFrame: BodyPoseFrame,
  boneMapping: PoseToBoneMapping = DEFAULT_POSE_TO_BONE_MAP,
  imageWidth: number = 512,
  imageHeight: number = 512,
): Record<string, { x: number; y: number; rotation: number }> {
  const joints: Record<string, { x: number; y: number; rotation: number }> = {}

  for (const [boneName, mapping] of Object.entries(boneMapping)) {
    const parent = poseFrame.landmarks[mapping.parentLandmark]
    const child = poseFrame.landmarks[mapping.childLandmark]

    if (!parent || !child) continue

    // Compute midpoint position (denormalized)
    const midX = ((parent.x + child.x) / 2) * imageWidth
    const midY = ((parent.y + child.y) / 2) * imageHeight

    // Compute rotation from parent to child
    const dx = child.x - parent.x
    const dy = child.y - parent.y
    const rotation = Math.atan2(dy, dx) * (180 / Math.PI)

    joints[boneName] = { x: midX, y: midY, rotation }
  }

  return joints
}

/**
 * Convert extracted body pose landmarks to 3D bone quaternion rotations.
 * Uses world-space landmarks for proper 3D rotation computation.
 */
export function poseFrameTo3DBoneRotations(
  poseFrame: BodyPoseFrame,
  boneMapping: PoseToBoneMapping = DEFAULT_POSE_TO_BONE_MAP,
): Record<string, { x: number; y: number; z: number; w: number }> {
  const rotations: Record<string, { x: number; y: number; z: number; w: number }> = {}

  for (const [boneName, mapping] of Object.entries(boneMapping)) {
    const parent = poseFrame.worldLandmarks[mapping.parentLandmark]
    const child = poseFrame.worldLandmarks[mapping.childLandmark]

    if (!parent || !child) continue

    // Compute direction vector
    const dirX = child.x - parent.x
    const dirY = child.y - parent.y
    const dirZ = child.z - parent.z

    // Normalize
    const len = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ)
    if (len < 0.001) {
      rotations[boneName] = { x: 0, y: 0, z: 0, w: 1 }
      continue
    }

    const nx = dirX / len
    const ny = dirY / len
    const nz = dirZ / len

    // Convert direction to quaternion (rotation from Y-up reference)
    // Using simplified quaternion from direction vector
    const refY = { x: 0, y: 1, z: 0 }
    const dot = refY.x * nx + refY.y * ny + refY.z * nz
    const crossX = refY.y * nz - refY.z * ny
    const crossY = refY.z * nx - refY.x * nz
    const crossZ = refY.x * ny - refY.y * nx
    const crossLen = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ)

    if (crossLen < 0.001) {
      // Parallel or anti-parallel
      rotations[boneName] = dot > 0
        ? { x: 0, y: 0, z: 0, w: 1 }
        : { x: 1, y: 0, z: 0, w: 0 }
    } else {
      // Half-angle quaternion construction
      const w = 1 + dot
      const scale = 1 / Math.sqrt(w * 2)
      rotations[boneName] = {
        x: crossX * scale,
        y: crossY * scale,
        z: crossZ * scale,
        w: w * scale,
      }
    }
  }

  return rotations
}

/**
 * Apply extracted motion data to a 2D rig by writing pose keyframes.
 *
 * Converts each extracted pose frame to 2D joint positions (using
 * poseFrameToJointPositions) and writes them as pose keyframes to
 * the rig store. Matches extracted bone names to the rig's actual
 * joint names using a flexible name-matching strategy.
 *
 * @param result - The MotionTransferResult from extractPosesFromVideo
 * @param characterId - The character ID to write keyframes for
 * @param settings - Motion transfer settings (for retargetScale)
 * @param boneMapping - Pose-to-bone mapping override
 * @param onProgress - Progress callback for keyframe writing phase
 */
export function applyMotionTo2DRig(
  result: MotionTransferResult,
  characterId: string,
  settings: MotionTransferSettings = DEFAULT_MOTION_TRANSFER_SETTINGS,
  boneMapping: PoseToBoneMapping = DEFAULT_POSE_TO_BONE_MAP,
  onProgress?: (progress: MotionTransferProgress) => void,
): void {
  const { useRigStore } = require('@/stores/useRigStore') as {
    useRigStore: { getState: () => {
      activeRigId: string | null
      rigs: Record<string, { imageWidth: number; imageHeight: number; skeleton: { joints: Array<{ id: string; name: string }> } }>
      addPoseKeyframe: (characterId: string, frame: number, pose: Record<string, { dx: number; dy: number; rotation: number }>) => void
    }}
  }
  const { usePlaybackStore } = require('@/stores/usePlaybackStore') as {
    usePlaybackStore: { getState: () => { fps: number } }
  }

  const rigState = useRigStore.getState()
  const { fps: projectFps } = usePlaybackStore.getState()
  const activeRig = rigState.activeRigId ? rigState.rigs[rigState.activeRigId] : null

  if (!activeRig) {
    throw new Error('No active 2D rig. Please create or select a rig first.')
  }

  const imageWidth = activeRig.imageWidth
  const imageHeight = activeRig.imageHeight
  const rigJoints = activeRig.skeleton.joints

  // Build a flexible name lookup for rig joints: lowercase + stripped
  const rigJointByNormalizedName: Record<string, string> = {}
  for (const joint of rigJoints) {
    const normalized = joint.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    rigJointByNormalizedName[normalized] = joint.id
    // Also store original name mapping
    rigJointByNormalizedName[joint.id.toLowerCase().replace(/[^a-z0-9]/g, '')] = joint.id
  }

  // Standard alias map from extracted bone names to common rig joint names
  const BONE_ALIASES: Record<string, string[]> = {
    pelvis: ['pelvis', 'hips', 'hip', 'root'],
    spine1: ['spine', 'spine1', 'torso', 'chest', 'body'],
    neck: ['neck'],
    head: ['head'],
    l_shoulder: ['leftshoulder', 'lshoulder', 'shoulderleft', 'shoulderl', 'leftarm', 'lupperarm'],
    l_elbow: ['leftelbow', 'lelbow', 'elbowleft', 'elbowl', 'leftforearm', 'llowerarm'],
    r_shoulder: ['rightshoulder', 'rshoulder', 'shoulderright', 'shoulderr', 'rightarm', 'rupperarm'],
    r_elbow: ['rightelbow', 'relbow', 'elbowright', 'elbowr', 'rightforearm', 'rlowerarm'],
    l_hip: ['lefthip', 'lhip', 'hipleft', 'hipl', 'leftupleg', 'lupperleg', 'leftthigh', 'lthigh'],
    l_knee: ['leftknee', 'lknee', 'kneeleft', 'kneel', 'leftleg', 'llowerleg', 'leftshin', 'lshin'],
    r_hip: ['righthip', 'rhip', 'hipright', 'hipr', 'rightupleg', 'rupperleg', 'rightthigh', 'rthigh'],
    r_knee: ['rightknee', 'rknee', 'kneeright', 'kneer', 'rightleg', 'rlowerleg', 'rightshin', 'rshin'],
  }

  // Resolve each bone name to the rig's actual joint ID
  function resolveJointId(extractedBoneName: string): string | null {
    const normalizedExtracted = extractedBoneName.toLowerCase().replace(/[^a-z0-9]/g, '')

    // Direct match
    if (rigJointByNormalizedName[normalizedExtracted]) {
      return rigJointByNormalizedName[normalizedExtracted]
    }

    // Try aliases
    const aliases = BONE_ALIASES[normalizedExtracted]
    if (aliases) {
      for (const alias of aliases) {
        if (rigJointByNormalizedName[alias]) {
          return rigJointByNormalizedName[alias]
        }
      }
    }

    // Reverse search: check if any alias set contains the extracted name
    for (const [, aliasList] of Object.entries(BONE_ALIASES)) {
      if (aliasList.includes(normalizedExtracted)) {
        for (const alias of aliasList) {
          if (rigJointByNormalizedName[alias]) {
            return rigJointByNormalizedName[alias]
          }
        }
      }
    }

    return null
  }

  // Compute the first frame's joint positions to use as a reference (rest) offset
  const firstFrame = result.poseFrames[0]
  const firstJoints = poseFrameToJointPositions(firstFrame, boneMapping, imageWidth, imageHeight)

  // Build reference positions for computing deltas
  const refPositions: Record<string, { x: number; y: number; rotation: number }> = {}
  for (const [boneName, pos] of Object.entries(firstJoints)) {
    const jointId = resolveJointId(boneName)
    if (jointId) {
      refPositions[boneName] = pos
    }
  }

  const totalFrames = result.poseFrames.length
  const scale = settings.retargetScale

  for (let i = 0; i < totalFrames; i++) {
    const poseFrame = result.poseFrames[i]
    const joints = poseFrameToJointPositions(poseFrame, boneMapping, imageWidth, imageHeight)

    // Convert to BonePose (deltas from first frame)
    const bonePose: Record<string, { dx: number; dy: number; rotation: number }> = {}

    for (const [boneName, pos] of Object.entries(joints)) {
      const jointId = resolveJointId(boneName)
      if (!jointId) continue

      const ref = refPositions[boneName]
      if (!ref) continue

      bonePose[jointId] = {
        dx: (pos.x - ref.x) * scale,
        dy: (pos.y - ref.y) * scale,
        rotation: (pos.rotation - ref.rotation),
      }
    }

    // Convert source frame index to project frame number
    const timeSeconds = poseFrame.timestamp
    const projectFrame = Math.round(timeSeconds * projectFps)

    rigState.addPoseKeyframe(characterId, projectFrame, bonePose)

    onProgress?.({
      status: 'writing-keyframes',
      currentFrame: i + 1,
      totalFrames,
      percentage: Math.round(((i + 1) / totalFrames) * 100),
    })
  }
}

/**
 * Apply extracted motion data to a 3D rig by writing pose keyframes.
 *
 * Converts each extracted pose frame to 3D bone quaternion rotations
 * (using poseFrameTo3DBoneRotations) and writes them as pose keyframes
 * to the 3D rig store. Handles bone name mapping between MediaPipe
 * standard names and the target skeleton's bone names via BoneMapping.
 *
 * @param result - The MotionTransferResult from extractPosesFromVideo
 * @param characterId - The 3D character ID to write keyframes for
 * @param settings - Motion transfer settings
 * @param boneMapping - Pose-to-bone mapping override
 * @param onProgress - Progress callback for keyframe writing phase
 */
export function applyMotionTo3DRig(
  result: MotionTransferResult,
  characterId: string,
  _settings: MotionTransferSettings = DEFAULT_MOTION_TRANSFER_SETTINGS,
  boneMapping: PoseToBoneMapping = DEFAULT_POSE_TO_BONE_MAP,
  onProgress?: (progress: MotionTransferProgress) => void,
): void {
  const { use3DRigStore } = require('@/stores/use3DRigStore') as {
    use3DRigStore: { getState: () => {
      activeRigId: string | null
      rigs: Record<string, {
        skeletonTree: { bones: Array<{ name: string }> }
        characterId: string
      }>
      addPoseKeyframe: (
        characterId: string,
        frame: number,
        pose: Record<string, { position: { x: number; y: number; z: number }; quaternion: { x: number; y: number; z: number; w: number }; scale: { x: number; y: number; z: number } }>,
        easing?: string,
      ) => void
    }}
  }
  const { usePlaybackStore } = require('@/stores/usePlaybackStore') as {
    usePlaybackStore: { getState: () => { fps: number } }
  }

  const rigState = use3DRigStore.getState()
  const { fps: projectFps } = usePlaybackStore.getState()
  const activeRig = rigState.activeRigId ? rigState.rigs[rigState.activeRigId] : null

  if (!activeRig) {
    throw new Error('No active 3D rig. Please create or select a rig first.')
  }

  const rigBones = activeRig.skeletonTree.bones
  const rigCharacterId = activeRig.characterId

  // Build bone name lookup (normalized)
  const rigBoneByNormalizedName: Record<string, string> = {}
  for (const bone of rigBones) {
    const normalized = bone.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    rigBoneByNormalizedName[normalized] = bone.name
  }

  // 3D bone name aliases (Mixamo/RPM/SMPL conventions)
  const BONE_3D_ALIASES: Record<string, string[]> = {
    pelvis: ['pelvis', 'hips', 'hip', 'root', 'mixamorigthips'],
    spine1: ['spine', 'spine1', 'spine2', 'torso', 'chest', 'mixamorigspine', 'mixamorigspine1'],
    neck: ['neck', 'mixamorigneck'],
    head: ['head', 'mixamorighead'],
    l_shoulder: ['leftshoulder', 'lshoulder', 'leftarm', 'leftupperarm', 'mixamorigleftarm'],
    l_elbow: ['leftelbow', 'lelbow', 'leftforearm', 'leftlowerarm', 'mixamorigleftforearm'],
    r_shoulder: ['rightshoulder', 'rshoulder', 'rightarm', 'rightupperarm', 'mixamorigrightarm'],
    r_elbow: ['rightelbow', 'relbow', 'rightforearm', 'rightlowerarm', 'mixamorigrightforearm'],
    l_hip: ['lefthip', 'lhip', 'leftupleg', 'leftupperleg', 'leftthigh', 'mixamorigleftupleg'],
    l_knee: ['leftknee', 'lknee', 'leftleg', 'leftlowerleg', 'leftshin', 'mixamorigleftleg'],
    r_hip: ['righthip', 'rhip', 'rightupleg', 'rightupperleg', 'rightthigh', 'mixamorigrightupleg'],
    r_knee: ['rightknee', 'rknee', 'rightleg', 'rightlowerleg', 'rightshin', 'mixamorigrightleg'],
  }

  function resolve3DBoneName(extractedBoneName: string): string | null {
    const normalizedExtracted = extractedBoneName.toLowerCase().replace(/[^a-z0-9]/g, '')

    // Direct match
    if (rigBoneByNormalizedName[normalizedExtracted]) {
      return rigBoneByNormalizedName[normalizedExtracted]
    }

    // Try aliases
    const aliases = BONE_3D_ALIASES[normalizedExtracted]
    if (aliases) {
      for (const alias of aliases) {
        if (rigBoneByNormalizedName[alias]) {
          return rigBoneByNormalizedName[alias]
        }
      }
    }

    // Reverse search
    for (const [, aliasList] of Object.entries(BONE_3D_ALIASES)) {
      if (aliasList.includes(normalizedExtracted)) {
        for (const alias of aliasList) {
          if (rigBoneByNormalizedName[alias]) {
            return rigBoneByNormalizedName[alias]
          }
        }
      }
    }

    return null
  }

  // Compute first-frame rotations as reference to compute deltas
  const firstFrame = result.poseFrames[0]
  const firstRotations = poseFrameTo3DBoneRotations(firstFrame, boneMapping)

  const totalFrames = result.poseFrames.length

  for (let i = 0; i < totalFrames; i++) {
    const poseFrame = result.poseFrames[i]
    const rotations = poseFrameTo3DBoneRotations(poseFrame, boneMapping)

    // Build BonePose3D
    const bonePose: Record<string, {
      position: { x: number; y: number; z: number }
      quaternion: { x: number; y: number; z: number; w: number }
      scale: { x: number; y: number; z: number }
    }> = {}

    for (const [boneName, rot] of Object.entries(rotations)) {
      const rigBoneName = resolve3DBoneName(boneName)
      if (!rigBoneName) continue

      // Compute delta quaternion: delta = current * inverse(rest)
      // inverse(q) = { -x, -y, -z, w } for unit quaternion
      const rest = firstRotations[boneName] || { x: 0, y: 0, z: 0, w: 1 }
      const restInv = { x: -rest.x, y: -rest.y, z: -rest.z, w: rest.w }

      // Hamilton product: delta = rot * restInv
      const delta = quaternionMultiply(rot, restInv)

      bonePose[rigBoneName] = {
        position: { x: 0, y: 0, z: 0 },
        quaternion: delta,
        scale: { x: 1, y: 1, z: 1 },
      }
    }

    // Convert source timestamp to project frame
    const timeSeconds = poseFrame.timestamp
    const projectFrame = Math.round(timeSeconds * projectFps)

    rigState.addPoseKeyframe(rigCharacterId || characterId, projectFrame, bonePose)

    onProgress?.({
      status: 'writing-keyframes',
      currentFrame: i + 1,
      totalFrames,
      percentage: Math.round(((i + 1) / totalFrames) * 100),
    })
  }
}

/**
 * Hamilton product of two quaternions: a * b
 */
function quaternionMultiply(
  a: { x: number; y: number; z: number; w: number },
  b: { x: number; y: number; z: number; w: number },
): { x: number; y: number; z: number; w: number } {
  return {
    x: a.w * b.x + a.x * b.w + a.y * b.z - a.z * b.y,
    y: a.w * b.y - a.x * b.z + a.y * b.w + a.z * b.x,
    z: a.w * b.z + a.x * b.y - a.y * b.x + a.z * b.w,
    w: a.w * b.w - a.x * b.x - a.y * b.y - a.z * b.z,
  }
}

/**
 * High-level entry point: Apply motion to whichever rig type is selected.
 *
 * @param result - The MotionTransferResult from extractPosesFromVideo
 * @param targetRigType - '2d' or '3d'
 * @param characterId - The character ID to write keyframes for
 * @param settings - Motion transfer settings
 * @param boneMapping - Pose-to-bone mapping override
 * @param onProgress - Progress callback
 */
export function applyMotionToRig(
  result: MotionTransferResult,
  targetRigType: '2d' | '3d',
  characterId: string,
  settings: MotionTransferSettings = DEFAULT_MOTION_TRANSFER_SETTINGS,
  boneMapping: PoseToBoneMapping = DEFAULT_POSE_TO_BONE_MAP,
  onProgress?: (progress: MotionTransferProgress) => void,
): void {
  if (targetRigType === '2d') {
    applyMotionTo2DRig(result, characterId, settings, boneMapping, onProgress)
  } else {
    applyMotionTo3DRig(result, characterId, settings, boneMapping, onProgress)
  }
}

/**
 * Dispose the MediaPipe PoseLandmarker instance to free resources.
 */
export function disposePoseLandmarker(): void {
  if (poseLandmarkerInstance) {
    poseLandmarkerInstance.close()
    poseLandmarkerInstance = null
  }
}
