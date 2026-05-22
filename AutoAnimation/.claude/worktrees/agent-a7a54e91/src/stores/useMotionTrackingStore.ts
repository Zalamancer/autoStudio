/**
 * Motion Tracking Store
 *
 * Zustand store for real-time webcam face tracking state.
 * The faceData field is updated at 30fps via direct getState().setFaceData()
 * calls from the tracker service — components should read it via
 * getState() in RAF loops, not via React subscriptions.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  FaceTrackingData,
  CalibrationData,
  MotionTrackingSettings,
  MotionRecordingTake,
} from '@/types/motionTracking'
import { DEFAULT_TRACKING_SETTINGS } from '@/types/motionTracking'
import { motionTracker } from '@/services/motionTracker'
import { useTimelineStore } from '@/stores'

interface MotionTrackingState {
  /** Whether tracking is currently active (webcam on, detection running) */
  isActive: boolean
  /** Whether the rest pose calibration is complete */
  isCalibrated: boolean
  /** Whether a recording take is in progress */
  isRecording: boolean
  /** Latest face tracking data (updated at 30fps — read via getState(), not hooks) */
  faceData: FaceTrackingData | null
  /** Calibration state */
  calibration: CalibrationData | null
  /** User-configurable settings */
  settings: MotionTrackingSettings
  /** Recorded motion takes */
  takes: MotionRecordingTake[]
  /** ID of the take currently being recorded */
  currentTakeId: string | null
  /** Active webcam MediaStream (for <video> preview) */
  videoStream: MediaStream | null
  /** Error message from tracker or webcam */
  error: string | null

  // Actions
  startTracking: () => Promise<void>
  stopTracking: () => void
  calibrate: () => void
  setFaceData: (data: FaceTrackingData) => void
  startRecording: (startFrame: number) => void
  stopRecording: () => void
  recordFrame: (frame: number, data: FaceTrackingData) => void
  updateSettings: (partial: Partial<MotionTrackingSettings>) => void
  deleteTake: (id: string) => void
  renameTake: (id: string, name: string) => void
  setError: (error: string | null) => void
}

export const useMotionTrackingStore = create<MotionTrackingState>()(
  immer((set, get) => ({
    isActive: false,
    isCalibrated: false,
    isRecording: false,
    faceData: null,
    calibration: null,
    settings: { ...DEFAULT_TRACKING_SETTINGS },
    takes: [],
    currentTakeId: null,
    videoStream: null,
    error: null,

    startTracking: async () => {
      try {
        set((s) => {
          s.error = null
        })

        const stream = await motionTracker.init(
          // onFaceData — called at 30fps from RAF loop
          (data) => {
            const state = get()
            // Update face data without triggering React re-renders
            // (immer set is fine here since it's batched by RAF)
            set((s) => {
              s.faceData = data
            })

            // Record frame if recording
            if (state.isRecording && state.currentTakeId) {
              const frame = useTimelineStore.getState().currentFrame
              get().recordFrame(frame, data)
            }
          },
          // onCalibration
          (calibration) => {
            set((s) => {
              s.calibration = calibration
              s.isCalibrated = calibration.isCalibrated
            })
          },
          // onError
          (error) => {
            set((s) => {
              s.error = error
            })
          },
          // getSettings
          () => get().settings,
        )

        motionTracker.start()

        set((s) => {
          s.isActive = true
          s.videoStream = stream
        })
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : 'Failed to start tracking'
          s.isActive = false
        })
      }
    },

    stopTracking: () => {
      motionTracker.destroy()
      set((s) => {
        s.isActive = false
        s.isRecording = false
        s.currentTakeId = null
        s.faceData = null
        s.videoStream = null
      })
    },

    calibrate: () => {
      motionTracker.calibrate()
      set((s) => {
        s.isCalibrated = false
      })
    },

    setFaceData: (data) => {
      set((s) => {
        s.faceData = data
      })
    },

    startRecording: (startFrame) => {
      const id = `take_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const take: MotionRecordingTake = {
        id,
        name: `Take ${get().takes.length + 1}`,
        startFrame,
        frames: [],
        createdAt: Date.now(),
      }
      set((s) => {
        s.takes.push(take)
        s.currentTakeId = id
        s.isRecording = true
      })
    },

    stopRecording: () => {
      set((s) => {
        s.isRecording = false
        s.currentTakeId = null
      })
    },

    recordFrame: (frame, data) => {
      set((s) => {
        const take = s.takes.find((t) => t.id === s.currentTakeId)
        if (take) {
          take.frames.push({ frame, data: { ...data } })
        }
      })
    },

    updateSettings: (partial) => {
      set((s) => {
        Object.assign(s.settings, partial)
      })
    },

    deleteTake: (id) => {
      set((s) => {
        s.takes = s.takes.filter((t) => t.id !== id)
      })
    },

    renameTake: (id, name) => {
      set((s) => {
        const take = s.takes.find((t) => t.id === id)
        if (take) take.name = name
      })
    },

    setError: (error) => {
      set((s) => {
        s.error = error
      })
    },
  })),
)
