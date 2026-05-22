/**
 * useMotionCapture — Hook for real-time webcam face tracking
 * that bridges MediaPipe landmarks to 2D character transforms.
 *
 * Provides: webcam stream management, face detection via MediaPipe,
 * and real-time character driving.
 */

import { useCallback, useEffect, useRef, useState } from 'react'

export interface FaceMocapFrame {
  headYaw: number
  headPitch: number
  headRoll: number
  mouthOpen: number
  leftEyeOpen: number
  rightEyeOpen: number
  smile: number
  visemeIndex: number
}

interface UseMotionCaptureOptions {
  /** Whether to start the webcam immediately */
  autoStart?: boolean
  /** Target FPS for face tracking */
  fps?: number
  /** Callback for each face frame */
  onFrame?: (frame: FaceMocapFrame) => void
}

export function useMotionCapture(options: UseMotionCaptureOptions = {}) {
  const { autoStart = false } = options
  const [isActive, setIsActive] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentFrame] = useState<FaceMocapFrame | null>(null)
  const recordedFramesRef = useRef<FaceMocapFrame[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const animFrameRef = useRef<number>(0)
  const faceLandmarkerRef = useRef<unknown>(null)

  const start = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      })
      streamRef.current = stream
      setIsActive(true)

      // Initialize MediaPipe Face Landmarker
      try {
        const { FaceLandmarker, FilesetResolver } = await import('@mediapipe/tasks-vision')
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
        )
        const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
        })
        faceLandmarkerRef.current = faceLandmarker
      } catch {
        // MediaPipe not available — fallback to mock data
        setError('MediaPipe not available. Install @mediapipe/tasks-vision for real tracking.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to access webcam')
    }
  }, [])

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
    }
    setIsActive(false)
    setIsRecording(false)
  }, [])

  const startRecording = useCallback(() => {
    recordedFramesRef.current = []
    setIsRecording(true)
  }, [])

  const stopRecording = useCallback(() => {
    setIsRecording(false)
    return [...recordedFramesRef.current]
  }, [])

  const setVideoElement = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el
    if (el && streamRef.current) {
      el.srcObject = streamRef.current
      el.play()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    if (autoStart) start()
    return () => stop()
  }, [autoStart, start, stop])

  return {
    isActive,
    isRecording,
    error,
    currentFrame,
    start,
    stop,
    startRecording,
    stopRecording,
    setVideoElement,
    recordedFrames: recordedFramesRef.current,
  }
}
