/**
 * Webcam Capture Service
 *
 * Unified real-time webcam motion capture using MediaPipe Tasks Vision.
 * Combines face mesh (blendshapes + head rotation), hand tracking, and
 * pose detection into a single capture session.
 *
 * Runs entirely client-side via WebAssembly. Each detector is loaded
 * lazily from the CDN and runs in VIDEO mode within a shared RAF loop.
 */

import type { FaceTrackingData } from '@/types/motionTracking'
import { createEmptyFaceData } from '@/types/motionTracking'
import type { FrameLandmarks } from '@/services/motionCapture'

// ── Types ──────────────────────────────────────────────────────────────

/** Hand landmark (21 landmarks per hand) */
export interface HandLandmarkData {
  landmarks: Array<{ x: number; y: number; z: number }>
  handedness: 'Left' | 'Right'
}

/** Complete frame of all capture data */
export interface WebcamCaptureFrame {
  /** Face tracking data (blendshapes + head rotation) */
  face: FaceTrackingData | null
  /** Full body pose landmarks (33 points) */
  pose: FrameLandmarks | null
  /** Visibility of each pose landmark (0-1) */
  poseVisibility: number[] | null
  /** Hand landmarks (up to 2 hands) */
  hands: HandLandmarkData[]
  /** Timestamp in ms */
  timestamp: number
}

export type CaptureFrameCallback = (frame: WebcamCaptureFrame) => void
export type CaptureErrorCallback = (error: string) => void
export type CaptureReadyCallback = () => void

export interface WebcamCaptureConfig {
  /** Enable face mesh detection (blendshapes + head pose) */
  enableFace: boolean
  /** Enable pose detection (33 body landmarks) */
  enablePose: boolean
  /** Enable hand tracking (21 landmarks per hand) */
  enableHands: boolean
  /** Smoothing factor for EMA filter (0 = no smoothing, 1 = max) */
  smoothingFactor: number
}

export const DEFAULT_CAPTURE_CONFIG: WebcamCaptureConfig = {
  enableFace: true,
  enablePose: true,
  enableHands: false,
  smoothingFactor: 0.4,
}

// ── CDN URLs ───────────────────────────────────────────────────────────

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
const FACE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task'
const HAND_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task'

// ── MediaPipe dynamic types ────────────────────────────────────────────

type FaceLandmarker = import('@mediapipe/tasks-vision').FaceLandmarker
type PoseLandmarker = import('@mediapipe/tasks-vision').PoseLandmarker
type HandLandmarker = import('@mediapipe/tasks-vision').HandLandmarker

// ── Webcam Capture Engine ──────────────────────────────────────────────

class WebcamCaptureEngine {
  private faceLandmarker: FaceLandmarker | null = null
  private poseLandmarker: PoseLandmarker | null = null
  private handLandmarker: HandLandmarker | null = null
  private videoElement: HTMLVideoElement | null = null
  private stream: MediaStream | null = null
  private rafId = 0
  private isRunning = false
  private config: WebcamCaptureConfig = { ...DEFAULT_CAPTURE_CONFIG }

  // Smoothed face data
  private smoothedFace: FaceTrackingData = createEmptyFaceData()

  // Callbacks
  private onFrame: CaptureFrameCallback | null = null
  private onError: CaptureErrorCallback | null = null
  private onReady: CaptureReadyCallback | null = null

  /**
   * Initialize the webcam stream and load the requested MediaPipe models.
   * Returns the MediaStream for rendering in a <video> element.
   */
  async init(
    config: WebcamCaptureConfig,
    onFrame: CaptureFrameCallback,
    onError: CaptureErrorCallback,
    onReady?: CaptureReadyCallback,
  ): Promise<MediaStream> {
    this.config = { ...config }
    this.onFrame = onFrame
    this.onError = onError
    this.onReady = onReady ?? null

    try {
      // Request webcam
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480, frameRate: 30 },
        audio: false,
      })

      // Create video element
      this.videoElement = document.createElement('video')
      this.videoElement.srcObject = this.stream
      this.videoElement.autoplay = true
      this.videoElement.playsInline = true
      this.videoElement.muted = true
      await this.videoElement.play()

      // Load MediaPipe models in parallel
      const { FaceLandmarker, PoseLandmarker, HandLandmarker, FilesetResolver } =
        await import('@mediapipe/tasks-vision')

      const vision = await FilesetResolver.forVisionTasks(WASM_URL)

      const loadPromises: Promise<void>[] = []

      if (config.enableFace) {
        loadPromises.push(
          FaceLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: FACE_MODEL_URL, delegate: 'GPU' },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: 'VIDEO',
            numFaces: 1,
          }).then((fl) => {
            this.faceLandmarker = fl
          }),
        )
      }

      if (config.enablePose) {
        loadPromises.push(
          PoseLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numPoses: 1,
          }).then((pl) => {
            this.poseLandmarker = pl
          }),
        )
      }

      if (config.enableHands) {
        loadPromises.push(
          HandLandmarker.createFromOptions(vision, {
            baseOptions: { modelAssetPath: HAND_MODEL_URL, delegate: 'GPU' },
            runningMode: 'VIDEO',
            numHands: 2,
          }).then((hl) => {
            this.handLandmarker = hl
          }),
        )
      }

      await Promise.all(loadPromises)

      this.onReady?.()
      return this.stream
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize webcam capture'
      this.onError?.(msg)
      throw err
    }
  }

  /** Start the detection loop */
  start(): void {
    if (this.isRunning) return
    if (!this.videoElement) {
      this.onError?.('Not initialized. Call init() first.')
      return
    }
    this.isRunning = true
    this.smoothedFace = createEmptyFaceData()
    this.tick()
  }

  /** Stop the detection loop (does not release resources) */
  stop(): void {
    this.isRunning = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
  }

  /** Update configuration without reinitializing */
  updateConfig(partial: Partial<WebcamCaptureConfig>): void {
    Object.assign(this.config, partial)
  }

  /** Release all resources */
  destroy(): void {
    this.stop()

    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop())
      this.stream = null
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null
      this.videoElement = null
    }

    if (this.faceLandmarker) {
      this.faceLandmarker.close()
      this.faceLandmarker = null
    }

    if (this.poseLandmarker) {
      this.poseLandmarker.close()
      this.poseLandmarker = null
    }

    if (this.handLandmarker) {
      this.handLandmarker.close()
      this.handLandmarker = null
    }

    this.onFrame = null
    this.onError = null
    this.onReady = null
  }

  /** Get the MediaStream for external <video> rendering */
  getStream(): MediaStream | null {
    return this.stream
  }

  // ── Internal tick loop ─────────────────────────────────────────────

  private tick = (): void => {
    if (!this.isRunning) return

    if (this.videoElement && this.videoElement.readyState >= 2) {
      const now = performance.now()
      const frame: WebcamCaptureFrame = {
        face: null,
        pose: null,
        poseVisibility: null,
        hands: [],
        timestamp: now,
      }

      // Face detection
      if (this.config.enableFace && this.faceLandmarker) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const faceResult = this.faceLandmarker.detectForVideo(this.videoElement, now) as any
          if (faceResult.faceBlendshapes && faceResult.faceBlendshapes.length > 0) {
            const raw = this.extractFaceData(faceResult)
            this.smoothedFace = this.applySmoothing(this.smoothedFace, raw, this.config.smoothingFactor)
            frame.face = { ...this.smoothedFace }
          }
        } catch {
          // Silently skip face detection errors on individual frames
        }
      }

      // Pose detection
      if (this.config.enablePose && this.poseLandmarker) {
        try {
          const poseResult = this.poseLandmarker.detectForVideo(this.videoElement, now)
          if (poseResult.worldLandmarks && poseResult.worldLandmarks.length > 0) {
            frame.pose = poseResult.worldLandmarks[0].map((l) => ({
              x: l.x,
              y: l.y,
              z: l.z,
              visibility: l.visibility ?? 1,
            }))
            frame.poseVisibility = frame.pose.map((l) => l.visibility)
          }
        } catch {
          // Silently skip pose detection errors
        }
      }

      // Hand detection
      if (this.config.enableHands && this.handLandmarker) {
        try {
          const handResult = this.handLandmarker.detectForVideo(this.videoElement, now)
          if (handResult.landmarks && handResult.landmarks.length > 0) {
            for (let i = 0; i < handResult.landmarks.length; i++) {
              const lm = handResult.landmarks[i]
              const handedness =
                handResult.handednesses?.[i]?.[0]?.categoryName === 'Left' ? 'Left' : 'Right'
              frame.hands.push({
                landmarks: lm.map((l) => ({ x: l.x, y: l.y, z: l.z })),
                handedness,
              })
            }
          }
        } catch {
          // Silently skip hand detection errors
        }
      }

      this.onFrame?.(frame)
    }

    this.rafId = requestAnimationFrame(this.tick)
  }

  // ── Face data extraction ───────────────────────────────────────────

  private extractFaceData(result: {
    faceBlendshapes?: Array<{ categories: Array<{ categoryName: string; score: number }> }>
    facialTransformationMatrixes?: Array<{ data: Float32Array }>
  }): FaceTrackingData {
    const blendshapes = result.faceBlendshapes?.[0]?.categories ?? []
    const matrix = result.facialTransformationMatrixes?.[0]?.data

    const bs: Record<string, number> = {}
    for (const b of blendshapes) {
      bs[b.categoryName] = b.score
    }

    const headRotation = matrix
      ? this.decomposeRotation(matrix)
      : { pitch: 0, yaw: 0, roll: 0 }

    const smileLeft = bs['mouthSmileLeft'] ?? 0
    const smileRight = bs['mouthSmileRight'] ?? 0
    const frownLeft = bs['mouthFrownLeft'] ?? 0
    const frownRight = bs['mouthFrownRight'] ?? 0
    const mouthSmile = (smileLeft + smileRight) / 2 - (frownLeft + frownRight) / 2

    const gazeX =
      ((bs['eyeLookOutRight'] ?? 0) + (bs['eyeLookInLeft'] ?? 0) -
        (bs['eyeLookOutLeft'] ?? 0) - (bs['eyeLookInRight'] ?? 0)) / 2
    const gazeY =
      ((bs['eyeLookUpLeft'] ?? 0) + (bs['eyeLookUpRight'] ?? 0) -
        (bs['eyeLookDownLeft'] ?? 0) - (bs['eyeLookDownRight'] ?? 0)) / 2

    return {
      headRotation,
      jawOpen: bs['jawOpen'] ?? 0,
      mouthSmile: Math.max(-1, Math.min(1, mouthSmile)),
      eyeBlinkLeft: bs['eyeBlinkLeft'] ?? 0,
      eyeBlinkRight: bs['eyeBlinkRight'] ?? 0,
      browInnerUp: bs['browInnerUp'] ?? 0,
      browOuterUpLeft: bs['browOuterUpLeft'] ?? 0,
      browOuterUpRight: bs['browOuterUpRight'] ?? 0,
      gazeX: Math.max(-1, Math.min(1, gazeX)),
      gazeY: Math.max(-1, Math.min(1, gazeY)),
    }
  }

  private decomposeRotation(m: Float32Array): { pitch: number; yaw: number; roll: number } {
    const sy = Math.sqrt(m[0] * m[0] + m[1] * m[1])
    const singular = sy < 1e-6

    let pitch: number, yaw: number, roll: number
    if (!singular) {
      pitch = Math.atan2(m[6], m[10])
      yaw = Math.atan2(-m[2], sy)
      roll = Math.atan2(m[1], m[0])
    } else {
      pitch = Math.atan2(-m[9], m[5])
      yaw = Math.atan2(-m[2], sy)
      roll = 0
    }
    return { pitch, yaw, roll }
  }

  private applySmoothing(
    prev: FaceTrackingData,
    curr: FaceTrackingData,
    factor: number,
  ): FaceTrackingData {
    const lerp = (a: number, b: number) => a * factor + b * (1 - factor)
    return {
      headRotation: {
        pitch: lerp(prev.headRotation.pitch, curr.headRotation.pitch),
        yaw: lerp(prev.headRotation.yaw, curr.headRotation.yaw),
        roll: lerp(prev.headRotation.roll, curr.headRotation.roll),
      },
      jawOpen: lerp(prev.jawOpen, curr.jawOpen),
      mouthSmile: lerp(prev.mouthSmile, curr.mouthSmile),
      eyeBlinkLeft: lerp(prev.eyeBlinkLeft, curr.eyeBlinkLeft),
      eyeBlinkRight: lerp(prev.eyeBlinkRight, curr.eyeBlinkRight),
      browInnerUp: lerp(prev.browInnerUp, curr.browInnerUp),
      browOuterUpLeft: lerp(prev.browOuterUpLeft, curr.browOuterUpLeft),
      browOuterUpRight: lerp(prev.browOuterUpRight, curr.browOuterUpRight),
      gazeX: lerp(prev.gazeX, curr.gazeX),
      gazeY: lerp(prev.gazeY, curr.gazeY),
    }
  }
}

// Singleton instance
export const webcamCapture = new WebcamCaptureEngine()
