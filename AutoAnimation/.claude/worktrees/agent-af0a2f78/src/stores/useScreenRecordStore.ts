/**
 * Screen Record Store — Recording state and video blob management.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  startScreenCapture,
  stopScreenCapture,
  type CaptureMode,
  type ScreenRecording,
} from '@/services/screenRecorder'
import { toast } from '@/stores/useToastStore'
import { logger } from '@/utils/logger'

interface ScreenRecordState {
  isRecording: boolean
  captureMode: CaptureMode
  stream: MediaStream | null
  recording: ScreenRecording | null
  duration: number // live timer (seconds)
  timerInterval: ReturnType<typeof setInterval> | null

  // Actions
  setCaptureMode: (mode: CaptureMode) => void
  startRecording: () => Promise<void>
  stopRecording: () => Promise<void>
  clearRecording: () => void
}

export const useScreenRecordStore = create<ScreenRecordState>()(
  immer((set, get) => ({
    isRecording: false,
    captureMode: 'screen',
    stream: null,
    recording: null,
    duration: 0,
    timerInterval: null,

    setCaptureMode: (mode: CaptureMode) =>
      set((s) => {
        s.captureMode = mode
      }),

    startRecording: async () => {
      try {
        const stream = await startScreenCapture(get().captureMode)

        // Start live timer
        const interval = setInterval(() => {
          set((s) => {
            s.duration += 1
          })
        }, 1000)

        set((s) => {
          s.isRecording = true
          s.stream = stream
          s.duration = 0
          s.timerInterval = interval
          s.recording = null
        })

        // Handle stream ending (user clicked "Stop sharing")
        stream.getVideoTracks()[0]?.addEventListener('ended', () => {
          get().stopRecording()
        })
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to start recording'
        toast.error(msg)
        logger.error('[ScreenRecord]', err)
      }
    },

    stopRecording: async () => {
      const { timerInterval } = get()
      if (timerInterval) clearInterval(timerInterval)

      try {
        const recording = await stopScreenCapture()
        set((s) => {
          s.isRecording = false
          s.stream = null
          s.recording = recording
          s.timerInterval = null
        })
        toast.success(`Recorded ${recording.duration.toFixed(1)}s`)
      } catch {
        set((s) => {
          s.isRecording = false
          s.stream = null
          s.timerInterval = null
        })
      }
    },

    clearRecording: () => {
      const { recording } = get()
      if (recording?.url) URL.revokeObjectURL(recording.url)
      set((s) => {
        s.recording = null
        s.duration = 0
      })
    },
  })),
)
