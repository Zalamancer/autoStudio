/**
 * Motion Tracker Service
 *
 * Core tracking engine that manages webcam capture and MediaPipe FaceLandmarker.
 * Runs a requestAnimationFrame loop to extract blendshapes + head rotation at ~30fps,
 * applies exponential moving average smoothing, and pushes processed FaceTrackingData
 * to the store via direct getState() calls (no React re-renders).
 *
 * MediaPipe FaceLandmarker requires WebGL and must run on the main thread.
 */

import type { FaceTrackingData, CalibrationData, MotionTrackingSettings } from '@/types/motionTracking'
import { createEmptyFaceData } from '@/types/motionTracking'

// MediaPipe types (imported dynamically)
type FaceLandmarker = import('@mediapipe/tasks-vision').FaceLandmarker

const CALIBRATION_FRAMES = 30
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'

/** Callback type for pushing face data to the store */
type FaceDataCallback = (data: FaceTrackingData) => void
type CalibrationCallback = (calibration: CalibrationData) => void
type ErrorCallback = (error: string) => void

class MotionTracker {
  private faceLandmarker: FaceLandmarker | null = null
  private videoElement: HTMLVideoElement | null = null
  private stream: MediaStream | null = null
  private rafId: number = 0
  private isRunning = false

  // Smoothed values
  private smoothed: FaceTrackingData = createEmptyFaceData()

  // Calibration accumulator
  private calibrationAccumulator: FaceTrackingData = createEmptyFaceData()
  private calibrationFrameCount = 0
  private isCalibrating = false
  private restPose: FaceTrackingData | null = null

  // Callbacks
  private onFaceData: FaceDataCallback | null = null
  private onCalibration: CalibrationCallback | null = null
  private onError: ErrorCallback | null = null

  // Settings reference (read each frame)
  private getSettings: (() => MotionTrackingSettings) | null = null

  /**
   * Initialize the tracker: load MediaPipe model and request webcam access.
   * Returns the MediaStream for rendering in a <video> element.
   */
  async init(
    onFaceData: FaceDataCallback,
    onCalibration: CalibrationCallback,
    onError: ErrorCallback,
    getSettings: () => MotionTrackingSettings,
  ): Promise<MediaStream> {
    this.onFaceData = onFaceData
    this.onCalibration = onCalibration
    this.onError = onError
    this.getSettings = getSettings

    try {
      // Request webcam
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480, frameRate: 30 },
        audio: false,
      })

      // Create hidden video element for MediaPipe
      this.videoElement = document.createElement('video')
      this.videoElement.srcObject = this.stream
      this.videoElement.autoplay = true
      this.videoElement.playsInline = true
      this.videoElement.muted = true
      await this.videoElement.play()

      // Load MediaPipe FaceLandmarker
      const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(WASM_URL)
      this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: MODEL_URL,
          delegate: 'GPU',
        },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      })

      return this.stream
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to initialize motion tracker'
      this.onError?.(msg)
      throw err
    }
  }

  /** Start the tracking loop */
  start(): void {
    if (this.isRunning) return
    if (!this.faceLandmarker || !this.videoElement) {
      this.onError?.('Tracker not initialized. Call init() first.')
      return
    }
    this.isRunning = true
    this.smoothed = createEmptyFaceData()
    this.tick()
  }

  /** Stop the tracking loop (does not release resources) */
  stop(): void {
    this.isRunning = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
  }

  /** Begin calibration: accumulate CALIBRATION_FRAMES frames to establish rest pose */
  calibrate(): void {
    this.isCalibrating = true
    this.calibrationFrameCount = 0
    this.calibrationAccumulator = createEmptyFaceData()
    this.restPose = null
  }

  /** Release all resources: webcam stream, video element, MediaPipe model */
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

    this.onFaceData = null
    this.onCalibration = null
    this.onError = null
    this.getSettings = null
    this.restPose = null
  }

  /** Get the video element for rendering in a <video> preview */
  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement
  }

  /** Get the current MediaStream */
  getStream(): MediaStream | null {
    return this.stream
  }

  // ── Private ─────────────────────────────────────────────────────────

  private tick = (): void => {
    if (!this.isRunning) return

    if (this.videoElement && this.faceLandmarker && this.videoElement.readyState >= 2) {
      const startTimeMs = performance.now()
      const result = this.faceLandmarker.detectForVideo(this.videoElement, startTimeMs)

      if (result.faceBlendshapes && result.faceBlendshapes.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = this.extractFaceData(result as any)
        const settings = this.getSettings?.() ?? null

        if (this.isCalibrating) {
          this.accumulateCalibration(raw)
        } else {
          // Subtract rest pose if calibrated
          const adjusted = this.restPose ? this.subtractRestPose(raw, this.restPose) : raw

          // Apply smoothing
          const factor = settings?.smoothingFactor ?? 0.5
          this.smoothed = this.applySmoothing(this.smoothed, adjusted, factor)

          // Push to store
          this.onFaceData?.(this.smoothed)
        }
      }
    }

    this.rafId = requestAnimationFrame(this.tick)
  }

  /** Extract FaceTrackingData from MediaPipe result */
  private extractFaceData(result: {
    faceBlendshapes?: Array<{ categories: Array<{ categoryName: string; score: number }> }>
    facialTransformationMatrixes?: Array<{ data: Float32Array }>
  }): FaceTrackingData {
    const blendshapes = result.faceBlendshapes?.[0]?.categories ?? []
    const matrix = result.facialTransformationMatrixes?.[0]?.data

    // Build lookup map for blendshapes
    const bs: Record<string, number> = {}
    for (const b of blendshapes) {
      bs[b.categoryName] = b.score
    }

    // Extract head rotation from 4x4 transformation matrix
    const headRotation = matrix
      ? this.decomposeRotation(matrix)
      : { pitch: 0, yaw: 0, roll: 0 }

    // Average left/right smile for overall mouth smile
    const smileLeft = bs['mouthSmileLeft'] ?? 0
    const smileRight = bs['mouthSmileRight'] ?? 0
    const frownLeft = bs['mouthFrownLeft'] ?? 0
    const frownRight = bs['mouthFrownRight'] ?? 0
    const mouthSmile = (smileLeft + smileRight) / 2 - (frownLeft + frownRight) / 2

    // Estimate gaze from iris landmarks (simplified: use blendshapes)
    const lookOutLeft = bs['eyeLookOutLeft'] ?? 0
    const lookInLeft = bs['eyeLookInLeft'] ?? 0
    const lookOutRight = bs['eyeLookOutRight'] ?? 0
    const lookInRight = bs['eyeLookInRight'] ?? 0
    const lookUpLeft = bs['eyeLookUpLeft'] ?? 0
    const lookDownLeft = bs['eyeLookDownLeft'] ?? 0
    const lookUpRight = bs['eyeLookUpRight'] ?? 0
    const lookDownRight = bs['eyeLookDownRight'] ?? 0

    // Gaze X: positive = looking right, negative = looking left
    const gazeX = ((lookOutRight + lookInLeft) - (lookOutLeft + lookInRight)) / 2
    // Gaze Y: positive = looking up, negative = looking down
    const gazeY = ((lookUpLeft + lookUpRight) - (lookDownLeft + lookDownRight)) / 2

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

  /** Decompose rotation from a 4x4 column-major matrix → pitch/yaw/roll in radians */
  private decomposeRotation(m: Float32Array): { pitch: number; yaw: number; roll: number } {
    // Column-major 4x4 matrix:
    // m[0] m[4] m[8]  m[12]
    // m[1] m[5] m[9]  m[13]
    // m[2] m[6] m[10] m[14]
    // m[3] m[7] m[11] m[15]

    // Extract Euler angles (XYZ order)
    const sy = Math.sqrt(m[0] * m[0] + m[1] * m[1])
    const singular = sy < 1e-6

    let pitch: number, yaw: number, roll: number

    if (!singular) {
      pitch = Math.atan2(m[6], m[10]) // X rotation
      yaw = Math.atan2(-m[2], sy) // Y rotation
      roll = Math.atan2(m[1], m[0]) // Z rotation
    } else {
      pitch = Math.atan2(-m[9], m[5])
      yaw = Math.atan2(-m[2], sy)
      roll = 0
    }

    return { pitch, yaw, roll }
  }

  /** Exponential moving average smoothing */
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

  /** Subtract rest pose to get offset values */
  private subtractRestPose(raw: FaceTrackingData, rest: FaceTrackingData): FaceTrackingData {
    return {
      headRotation: {
        pitch: raw.headRotation.pitch - rest.headRotation.pitch,
        yaw: raw.headRotation.yaw - rest.headRotation.yaw,
        roll: raw.headRotation.roll - rest.headRotation.roll,
      },
      jawOpen: Math.max(0, raw.jawOpen - rest.jawOpen),
      mouthSmile: raw.mouthSmile - rest.mouthSmile,
      eyeBlinkLeft: Math.max(0, raw.eyeBlinkLeft - rest.eyeBlinkLeft),
      eyeBlinkRight: Math.max(0, raw.eyeBlinkRight - rest.eyeBlinkRight),
      browInnerUp: Math.max(0, raw.browInnerUp - rest.browInnerUp),
      browOuterUpLeft: Math.max(0, raw.browOuterUpLeft - rest.browOuterUpLeft),
      browOuterUpRight: Math.max(0, raw.browOuterUpRight - rest.browOuterUpRight),
      gazeX: raw.gazeX - rest.gazeX,
      gazeY: raw.gazeY - rest.gazeY,
    }
  }

  /** Accumulate calibration frames and compute rest pose when done */
  private accumulateCalibration(raw: FaceTrackingData): void {
    this.calibrationFrameCount++
    const n = this.calibrationFrameCount
    const acc = this.calibrationAccumulator

    // Running average
    const blend = (a: number, b: number) => a + (b - a) / n

    acc.headRotation.pitch = blend(acc.headRotation.pitch, raw.headRotation.pitch)
    acc.headRotation.yaw = blend(acc.headRotation.yaw, raw.headRotation.yaw)
    acc.headRotation.roll = blend(acc.headRotation.roll, raw.headRotation.roll)
    acc.jawOpen = blend(acc.jawOpen, raw.jawOpen)
    acc.mouthSmile = blend(acc.mouthSmile, raw.mouthSmile)
    acc.eyeBlinkLeft = blend(acc.eyeBlinkLeft, raw.eyeBlinkLeft)
    acc.eyeBlinkRight = blend(acc.eyeBlinkRight, raw.eyeBlinkRight)
    acc.browInnerUp = blend(acc.browInnerUp, raw.browInnerUp)
    acc.browOuterUpLeft = blend(acc.browOuterUpLeft, raw.browOuterUpLeft)
    acc.browOuterUpRight = blend(acc.browOuterUpRight, raw.browOuterUpRight)
    acc.gazeX = blend(acc.gazeX, raw.gazeX)
    acc.gazeY = blend(acc.gazeY, raw.gazeY)

    if (this.calibrationFrameCount >= CALIBRATION_FRAMES) {
      this.isCalibrating = false
      this.restPose = { ...acc }
      this.onCalibration?.({
        restPose: { ...acc },
        isCalibrated: true,
        frameCount: this.calibrationFrameCount,
      })
    }
  }
}

// Singleton instance
export const motionTracker = new MotionTracker()
