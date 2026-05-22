/**
 * Motion Capture Store — manages the video-to-motion-capture workflow.
 */
import { create } from 'zustand'
import type { FrameLandmarks } from '@/services/motionCapture'
import type * as THREE from 'three'

interface MotionCaptureState {
  /** Source video blob URL */
  sourceVideoUrl: string | null
  /** Source video blob */
  sourceVideoBlob: Blob | null
  /** Target FPS for extraction */
  fps: number
  /** Whether capture is in progress */
  isProcessing: boolean
  /** Progress percentage (0-100) */
  progress: number
  /** Status message */
  statusMessage: string | null
  /** Error message */
  error: string | null
  /** Per-frame landmarks from MediaPipe */
  landmarks: FrameLandmarks[] | null
  /** Generated THREE.AnimationClip (not persisted) */
  resultClip: THREE.AnimationClip | null
  /** Duration of captured motion in seconds */
  durationSeconds: number | null
  /** Total frames processed */
  frameCount: number | null
  /** Whether skeleton preview is shown on video */
  showSkeletonPreview: boolean

  // Actions
  setSourceVideo: (blob: Blob) => void
  clearSourceVideo: () => void
  setFps: (fps: number) => void
  setProcessing: (processing: boolean) => void
  setProgress: (progress: number, message?: string) => void
  setError: (error: string | null) => void
  setResult: (
    clip: THREE.AnimationClip,
    landmarks: FrameLandmarks[],
    durationSeconds: number,
    frameCount: number
  ) => void
  setShowSkeletonPreview: (show: boolean) => void
  reset: () => void
}

export const useMotionCaptureStore = create<MotionCaptureState>((set) => ({
  sourceVideoUrl: null,
  sourceVideoBlob: null,
  fps: 24,
  isProcessing: false,
  progress: 0,
  statusMessage: null,
  error: null,
  landmarks: null,
  resultClip: null,
  durationSeconds: null,
  frameCount: null,
  showSkeletonPreview: true,

  setSourceVideo: (blob) => {
    const oldUrl = useMotionCaptureStore.getState().sourceVideoUrl
    if (oldUrl) URL.revokeObjectURL(oldUrl)
    const url = URL.createObjectURL(blob)
    set({
      sourceVideoUrl: url,
      sourceVideoBlob: blob,
      landmarks: null,
      resultClip: null,
      durationSeconds: null,
      frameCount: null,
      error: null,
    })
  },

  clearSourceVideo: () => {
    const oldUrl = useMotionCaptureStore.getState().sourceVideoUrl
    if (oldUrl) URL.revokeObjectURL(oldUrl)
    set({
      sourceVideoUrl: null,
      sourceVideoBlob: null,
      landmarks: null,
      resultClip: null,
      durationSeconds: null,
      frameCount: null,
      error: null,
    })
  },

  setFps: (fps) => set({ fps: Math.max(1, Math.min(60, fps)) }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setProgress: (progress, message) => set({ progress, statusMessage: message || null }),
  setError: (error) => set({ error, isProcessing: false }),

  setResult: (clip, landmarks, durationSeconds, frameCount) =>
    set({
      resultClip: clip,
      landmarks,
      durationSeconds,
      frameCount,
      isProcessing: false,
      progress: 100,
      statusMessage: 'Motion capture complete',
    }),

  setShowSkeletonPreview: (showSkeletonPreview) => set({ showSkeletonPreview }),

  reset: () => {
    const oldUrl = useMotionCaptureStore.getState().sourceVideoUrl
    if (oldUrl) URL.revokeObjectURL(oldUrl)
    set({
      sourceVideoUrl: null,
      sourceVideoBlob: null,
      fps: 24,
      isProcessing: false,
      progress: 0,
      statusMessage: null,
      error: null,
      landmarks: null,
      resultClip: null,
      durationSeconds: null,
      frameCount: null,
      showSkeletonPreview: true,
    })
  },
}))
