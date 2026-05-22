/**
 * Webcam Capture Store
 *
 * Manages the unified webcam motion capture session state:
 * - Webcam stream lifecycle
 * - Live landmark data from face, pose, and hands
 * - Recording mode (capture landmarks over time as keyframes)
 * - Target selection (which character/bone to drive)
 * - Sensitivity and smoothing controls
 *
 * The store is designed to be read from RAF loops via getState() for
 * high-frequency data (landmarks), and via React subscriptions for
 * low-frequency UI state (isActive, settings, etc.).
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  webcamCapture,
  DEFAULT_CAPTURE_CONFIG,
  type WebcamCaptureFrame,
  type WebcamCaptureConfig,
} from '@/services/webcamCapture'
import type { FaceTrackingData } from '@/types/motionTracking'
import type { Landmark3D } from '@/services/motionCapture'
import type { HandLandmarkData } from '@/services/webcamCapture'
import type { BonePose } from '@/types/rig'
import {
  poseLandmarksToBonePose,
  faceDataToHeadPose,
  faceDataToViseme,
  faceDataToEmotion,
  smoothBonePose,
  mergeBonePoses,
  type VisemeName,
  type DetectedEmotion,
} from '@/services/landmarkToBone'
import { useRigStore } from '@/stores/useRigStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import { useTimelineStore } from '@/stores'

// ── Types ──────────────────────────────────────────────────────────────

export type CaptureTarget = 'sprite' | '2d-rig' | '3d-character'

export interface RecordedCaptureFrame {
  frame: number
  timestamp: number
  face: FaceTrackingData | null
  pose: Landmark3D[] | null
  bonePose: BonePose | null
  viseme: VisemeName
  emotion: DetectedEmotion | null
}

export interface CaptureRecording {
  id: string
  name: string
  startFrame: number
  frames: RecordedCaptureFrame[]
  createdAt: number
}

interface WebcamCaptureState {
  // ── Session State ──────────────────────────────────────────────────
  /** Whether capture is active (webcam on, detection running) */
  isActive: boolean
  /** Whether models are still loading */
  isLoading: boolean
  /** Active webcam MediaStream */
  videoStream: MediaStream | null
  /** Error message */
  error: string | null

  // ── Detection Config ───────────────────────────────────────────────
  config: WebcamCaptureConfig

  // ── Live Data (updated at ~30fps) ──────────────────────────────────
  /** Latest face tracking data */
  faceData: FaceTrackingData | null
  /** Latest pose landmarks (33 body points) */
  poseLandmarks: Landmark3D[] | null
  /** Latest hand landmarks */
  handLandmarks: HandLandmarkData[]
  /** Current computed bone pose (for 2D rig) */
  currentBonePose: BonePose | null
  /** Current detected viseme */
  currentViseme: VisemeName
  /** Current detected emotion */
  currentEmotion: DetectedEmotion | null

  // ── Target & Sensitivity ───────────────────────────────────────────
  /** What the webcam drives */
  target: CaptureTarget
  /** Rotation sensitivity multiplier */
  sensitivity: number
  /** Smoothing factor for bone pose EMA */
  smoothing: number
  /** Mirror webcam input */
  mirror: boolean
  /** Minimum landmark visibility to trust */
  visibilityThreshold: number
  /** Enable driving the character's head from face data */
  driveHead: boolean
  /** Enable driving viseme from face data */
  driveViseme: boolean
  /** Enable driving emotion from face data */
  driveEmotion: boolean
  /** Enable driving body from pose data */
  driveBody: boolean

  // ── Recording ──────────────────────────────────────────────────────
  isRecording: boolean
  recordings: CaptureRecording[]
  currentRecordingId: string | null

  // ── Playback Preview ──────────────────────────────────────────────
  isPreviewPlaying: boolean
  previewRecordingId: string | null

  // ── Actions ────────────────────────────────────────────────────────
  startCapture: () => Promise<void>
  stopCapture: () => void
  updateConfig: (partial: Partial<WebcamCaptureConfig>) => void
  setTarget: (target: CaptureTarget) => void
  setSensitivity: (value: number) => void
  setSmoothing: (value: number) => void
  setMirror: (value: boolean) => void
  setVisibilityThreshold: (value: number) => void
  setDriveHead: (value: boolean) => void
  setDriveViseme: (value: boolean) => void
  setDriveEmotion: (value: boolean) => void
  setDriveBody: (value: boolean) => void
  startRecording: () => void
  stopRecording: () => void
  deleteRecording: (id: string) => void
  renameRecording: (id: string, name: string) => void
  applyRecordingToTimeline: (id: string) => void
  previewRecording: (id: string) => void
  stopPreview: () => void
}

// ── Smoothed bone pose (outside store to avoid immer overhead) ────────

let prevSmoothedPose: BonePose = {}

// ── Store ──────────────────────────────────────────────────────────────

export const useWebcamCaptureStore = create<WebcamCaptureState>()(
  immer((set, get) => ({
    // Session state
    isActive: false,
    isLoading: false,
    videoStream: null,
    error: null,

    // Config
    config: { ...DEFAULT_CAPTURE_CONFIG },

    // Live data
    faceData: null,
    poseLandmarks: null,
    handLandmarks: [],
    currentBonePose: null,
    currentViseme: 'Rest',
    currentEmotion: null,

    // Target & sensitivity
    target: 'sprite',
    sensitivity: 1.0,
    smoothing: 0.4,
    mirror: true,
    visibilityThreshold: 0.5,
    driveHead: true,
    driveViseme: true,
    driveEmotion: true,
    driveBody: true,

    // Recording
    isRecording: false,
    recordings: [],
    currentRecordingId: null,

    // Playback preview
    isPreviewPlaying: false,
    previewRecordingId: null,

    // ── Actions ──────────────────────────────────────────────────────

    startCapture: async () => {
      const state = get()
      if (state.isActive) return

      set((s) => {
        s.isLoading = true
        s.error = null
      })

      try {
        const stream = await webcamCapture.init(
          state.config,
          // onFrame callback
          (frame: WebcamCaptureFrame) => {
            processFrame(frame, get, set)
          },
          // onError callback
          (error: string) => {
            set((s) => {
              s.error = error
            })
          },
          // onReady callback
          () => {
            set((s) => {
              s.isLoading = false
            })
          },
        )

        webcamCapture.start()
        prevSmoothedPose = {}

        set((s) => {
          s.isActive = true
          s.isLoading = false
          s.videoStream = stream
        })
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : 'Failed to start webcam capture'
          s.isActive = false
          s.isLoading = false
        })
      }
    },

    stopCapture: () => {
      webcamCapture.destroy()
      prevSmoothedPose = {}

      set((s) => {
        s.isActive = false
        s.isLoading = false
        s.isRecording = false
        s.currentRecordingId = null
        s.faceData = null
        s.poseLandmarks = null
        s.handLandmarks = []
        s.currentBonePose = null
        s.currentViseme = 'Rest'
        s.currentEmotion = null
        s.videoStream = null
      })
    },

    updateConfig: (partial) => {
      set((s) => {
        Object.assign(s.config, partial)
      })
      webcamCapture.updateConfig(get().config)
    },

    setTarget: (target) =>
      set((s) => {
        s.target = target
      }),
    setSensitivity: (value) =>
      set((s) => {
        s.sensitivity = Math.max(0.1, Math.min(3.0, value))
      }),
    setSmoothing: (value) =>
      set((s) => {
        s.smoothing = Math.max(0, Math.min(0.95, value))
      }),
    setMirror: (value) =>
      set((s) => {
        s.mirror = value
      }),
    setVisibilityThreshold: (value) =>
      set((s) => {
        s.visibilityThreshold = Math.max(0, Math.min(1, value))
      }),
    setDriveHead: (value) =>
      set((s) => {
        s.driveHead = value
      }),
    setDriveViseme: (value) =>
      set((s) => {
        s.driveViseme = value
      }),
    setDriveEmotion: (value) =>
      set((s) => {
        s.driveEmotion = value
      }),
    setDriveBody: (value) =>
      set((s) => {
        s.driveBody = value
      }),

    startRecording: () => {
      const frame = useTimelineStore.getState().currentFrame
      const id = `wcap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const recording: CaptureRecording = {
        id,
        name: `Capture ${get().recordings.length + 1}`,
        startFrame: frame,
        frames: [],
        createdAt: Date.now(),
      }
      set((s) => {
        s.recordings.push(recording)
        s.currentRecordingId = id
        s.isRecording = true
      })
    },

    stopRecording: () => {
      const recordingId = get().currentRecordingId
      set((s) => {
        s.isRecording = false
        s.currentRecordingId = null
      })
      // Auto-preview the recording after it stops
      if (recordingId) {
        get().previewRecording(recordingId)
      }
    },

    deleteRecording: (id) => {
      set((s) => {
        s.recordings = s.recordings.filter((r) => r.id !== id)
      })
    },

    renameRecording: (id, name) => {
      set((s) => {
        const rec = s.recordings.find((r) => r.id === id)
        if (rec) rec.name = name
      })
    },

    applyRecordingToTimeline: (id) => {
      const state = get()
      const recording = state.recordings.find((r) => r.id === id)
      if (!recording || recording.frames.length === 0) return

      // Apply bone poses as keyframes to the active rig
      const rigState = useRigStore.getState()
      const activeRigId = rigState.activeRigId
      if (!activeRigId) return

      const rig = rigState.rigs[activeRigId]
      if (!rig) return

      // For each recorded frame that has a bone pose, set it as a keyframe
      for (const frame of recording.frames) {
        if (frame.bonePose) {
          // Set as a pose keyframe at this frame
          for (const [jointId, jointPose] of Object.entries(frame.bonePose)) {
            if (Math.abs(jointPose.rotation) > 0.1) {
              rigState.setJointPose(jointId, jointPose)
            }
          }
        }
      }
    },

    previewRecording: (id) => {
      const state = get()
      const recording = state.recordings.find((r) => r.id === id)
      if (!recording || recording.frames.length === 0) return

      const rigState = useRigStore.getState()
      if (!rigState.activeRigId) return

      set((s) => {
        s.isPreviewPlaying = true
        s.previewRecordingId = id
      })

      const frames = recording.frames.filter((f) => f.bonePose)
      if (frames.length === 0) {
        set((s) => {
          s.isPreviewPlaying = false
          s.previewRecordingId = null
        })
        return
      }

      let frameIdx = 0
      const intervalMs = 1000 / 30 // 30fps playback

      const tick = () => {
        const s = get()
        if (!s.isPreviewPlaying || s.previewRecordingId !== id) return

        const frame = frames[frameIdx]
        if (frame?.bonePose) {
          useRigStore.getState().setCurrentPose(frame.bonePose)
        }

        frameIdx++
        if (frameIdx >= frames.length) {
          // Loop back to start
          frameIdx = 0
        }
        previewTimerRef = window.setTimeout(tick, intervalMs)
      }

      tick()
    },

    stopPreview: () => {
      set((s) => {
        s.isPreviewPlaying = false
        s.previewRecordingId = null
      })
      if (previewTimerRef) {
        clearTimeout(previewTimerRef)
        previewTimerRef = null
      }
    },
  })),
)

// Preview playback timer (outside store to avoid immer overhead)
let previewTimerRef: ReturnType<typeof setTimeout> | null = null

// ── Frame Processing (called at ~30fps from RAF) ─────────────────────

function processFrame(
  frame: WebcamCaptureFrame,
  get: () => WebcamCaptureState,

  set: (fn: (s: WebcamCaptureState) => void) => void,
): void {
  const state = get()

  // Update live data
  set((s) => {
    s.faceData = frame.face
    s.poseLandmarks = frame.pose ?? null
    s.handLandmarks = frame.hands
  })

  // Compute derived values
  let viseme: VisemeName = 'Rest'
  let emotion: DetectedEmotion | null = null

  if (frame.face) {
    viseme = faceDataToViseme(frame.face)
    emotion = faceDataToEmotion(frame.face)

    set((s) => {
      s.currentViseme = viseme
      s.currentEmotion = emotion
    })
  }

  // Drive character based on target type
  if (state.target === 'sprite') {
    driveSpriteCharacter(frame, state)
  } else if (state.target === '2d-rig') {
    drive2DRigCharacter(frame, state, set)
  }

  // Record frame if recording
  if (state.isRecording && state.currentRecordingId) {
    const currentFrame = useTimelineStore.getState().currentFrame
    set((s) => {
      const rec = s.recordings.find((r) => r.id === s.currentRecordingId)
      if (rec) {
        rec.frames.push({
          frame: currentFrame,
          timestamp: frame.timestamp,
          face: frame.face ? { ...frame.face } : null,
          pose: frame.pose ? [...frame.pose] : null,
          bonePose: s.currentBonePose ? { ...s.currentBonePose } : null,
          viseme,
          emotion,
        })
      }
    })
  }
}

// ── Sprite Character Driver ──────────────────────────────────────────

const HEAD_OFFSET_SCALE = 80
const BODY_SWAY_FACTOR = 0.15

function driveSpriteCharacter(frame: WebcamCaptureFrame, state: WebcamCaptureState): void {
  if (!frame.face) return

  const partsStore = useCharacterPartsStore.getState()
  const configStore = useCharacterConfigStore.getState()
  const yawSign = state.mirror ? -1 : 1
  const face = frame.face

  // Head rotation -> position offset
  if (state.driveHead) {
    const yawOffset = face.headRotation.yaw * HEAD_OFFSET_SCALE * state.sensitivity * yawSign
    const pitchOffset = face.headRotation.pitch * HEAD_OFFSET_SCALE * state.sensitivity
    const rollDeg = face.headRotation.roll * (180 / Math.PI) * state.sensitivity * yawSign

    const headTransform = { x: yawOffset, y: pitchOffset, rotation: rollDeg }
    partsStore.updateTransform('eye', headTransform)
    partsStore.updateTransform('eyebrow', headTransform)
    partsStore.updateTransform('viseme', { x: yawOffset, y: pitchOffset })
    partsStore.updateTransform('hair', {
      x: yawOffset * 1.1,
      y: pitchOffset * 1.1,
      rotation: rollDeg * 1.05,
    })
    partsStore.updateTransform('body', {
      x: yawOffset * BODY_SWAY_FACTOR,
      y: pitchOffset * BODY_SWAY_FACTOR * 0.5,
    })
  }

  // Viseme -> sprite selection
  if (state.driveViseme) {
    const viseme = faceDataToViseme(face)
    const visemeKey =
      viseme === 'Aa' ? 'Aa' : viseme === 'Mbp' ? 'Mbp' : viseme === 'Fv' ? 'Fv' : viseme === 'Th' ? 'Th' : viseme
    const spriteIndex = configStore.visemeMapping[visemeKey as keyof typeof configStore.visemeMapping]
    if (spriteIndex !== null && spriteIndex !== undefined) {
      partsStore.setSelectedSprite('viseme', spriteIndex)
    }
  }
}

// ── 2D Rig Character Driver ─────────────────────────────────────────

function drive2DRigCharacter(
  frame: WebcamCaptureFrame,
  state: WebcamCaptureState,
  set: (fn: (s: WebcamCaptureState) => void) => void,
): void {
  const rigState = useRigStore.getState()
  const activeRigId = rigState.activeRigId
  if (!activeRigId) return

  const rig = rigState.rigs[activeRigId]
  if (!rig) return

  let combinedPose: BonePose = {}

  // Body pose from pose landmarks
  if (state.driveBody && frame.pose) {
    const bodyPose = poseLandmarksToBonePose(frame.pose, rig.skeleton, {
      sensitivity: state.sensitivity,
      mirror: state.mirror,
      visibilityThreshold: state.visibilityThreshold,
      screenLandmarks: frame.poseScreen,
    })
    combinedPose = mergeBonePoses(combinedPose, bodyPose)
  }

  // Head rotation from face data
  if (state.driveHead && frame.face) {
    const headPose = faceDataToHeadPose(frame.face, rig.skeleton, {
      sensitivity: state.sensitivity,
      mirror: state.mirror,
    })
    combinedPose = mergeBonePoses(combinedPose, headPose)
  }

  // Apply smoothing
  const smoothed = smoothBonePose(prevSmoothedPose, combinedPose, state.smoothing)
  prevSmoothedPose = smoothed

  // Set the pose in the rig store
  rigState.setCurrentPose(smoothed)

  // Update store with the computed bone pose
  set((s) => {
    s.currentBonePose = smoothed
  })
}
