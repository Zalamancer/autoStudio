/**
 * DeepMotion Store — manages the cloud motion capture workflow state.
 */
import { create } from 'zustand'

type DeepMotionStatus = 'idle' | 'uploading' | 'processing' | 'downloading' | 'done' | 'error'

interface DeepMotionState {
  /** Current workflow status */
  status: DeepMotionStatus
  /** DeepMotion request ID for polling */
  rid: string | null
  /** Progress percentage (0-100) */
  progress: number
  /** Human-readable status message */
  statusMessage: string | null
  /** Error message */
  error: string | null
  /** Object URL for the resulting GLB file */
  resultGlbUrl: string | null
  /** Target FPS for motion capture */
  fps: number
  /** Whether to enable face tracking */
  faceTracking: boolean
  /** Whether to enable hand tracking */
  handTracking: boolean

  // Actions
  setStatus: (status: DeepMotionStatus) => void
  setRid: (rid: string | null) => void
  setProgress: (progress: number, message?: string) => void
  setError: (error: string | null) => void
  setResultGlbUrl: (url: string | null) => void
  setFps: (fps: number) => void
  setFaceTracking: (enabled: boolean) => void
  setHandTracking: (enabled: boolean) => void
  reset: () => void
}

export const useDeepMotionStore = create<DeepMotionState>((set) => ({
  status: 'idle',
  rid: null,
  progress: 0,
  statusMessage: null,
  error: null,
  resultGlbUrl: null,
  fps: 30,
  faceTracking: false,
  handTracking: false,

  setStatus: (status) => set({ status }),
  setRid: (rid) => set({ rid }),
  setProgress: (progress, message) => set({ progress, statusMessage: message || null }),
  setError: (error) => set({ error, status: 'error' }),
  setResultGlbUrl: (url) => {
    const oldUrl = useDeepMotionStore.getState().resultGlbUrl
    if (oldUrl) URL.revokeObjectURL(oldUrl)
    set({ resultGlbUrl: url })
  },
  setFps: (fps) => set({ fps: Math.max(1, Math.min(120, fps)) }),
  setFaceTracking: (faceTracking) => set({ faceTracking }),
  setHandTracking: (handTracking) => set({ handTracking }),

  reset: () => {
    const oldUrl = useDeepMotionStore.getState().resultGlbUrl
    if (oldUrl) URL.revokeObjectURL(oldUrl)
    set({
      status: 'idle',
      rid: null,
      progress: 0,
      statusMessage: null,
      error: null,
      resultGlbUrl: null,
      fps: 30,
      faceTracking: false,
      handTracking: false,
    })
  },
}))
