/**
 * Motion Transfer Store
 *
 * Manages state for extracting poses from reference video and
 * retargeting them to character rigs.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  MotionTransferSettings,
  MotionTransferProgress,
  MotionTransferResult,
  MotionTransferStatus,
} from '@/types/motionTransfer'
import { DEFAULT_MOTION_TRANSFER_SETTINGS } from '@/types/motionTransfer'

interface MotionTransferState {
  /** Current settings */
  settings: MotionTransferSettings
  /** Pipeline status */
  status: MotionTransferStatus
  /** Pipeline progress */
  progress: MotionTransferProgress
  /** Extraction result (stored after successful extraction) */
  result: MotionTransferResult | null
  /** Source video file name */
  sourceFileName: string | null
  /** Source video duration in seconds */
  sourceDuration: number | null
  /** Source video preview URL (blob URL) */
  previewUrl: string | null
  /** Abort controller for cancelling extraction */
  abortController: AbortController | null
  /** Target rig type */
  targetRigType: '2d' | '3d'
  /** Target rig ID */
  targetRigId: string | null
  /** Error message */
  error: string | null

  // Actions
  updateSettings: (partial: Partial<MotionTransferSettings>) => void
  setStatus: (status: MotionTransferStatus) => void
  setProgress: (progress: MotionTransferProgress) => void
  setResult: (result: MotionTransferResult | null) => void
  setSourceFile: (fileName: string, duration: number, previewUrl: string) => void
  setAbortController: (controller: AbortController | null) => void
  setTargetRig: (type: '2d' | '3d', rigId: string | null) => void
  setError: (error: string | null) => void
  cancelExtraction: () => void
  reset: () => void
}

export const useMotionTransferStore = create<MotionTransferState>()(
  immer((set, get) => ({
    settings: { ...DEFAULT_MOTION_TRANSFER_SETTINGS },
    status: 'idle',
    progress: {
      status: 'idle',
      currentFrame: 0,
      totalFrames: 0,
      percentage: 0,
    },
    result: null,
    sourceFileName: null,
    sourceDuration: null,
    previewUrl: null,
    abortController: null,
    targetRigType: '2d',
    targetRigId: null,
    error: null,

    updateSettings: (partial) => {
      set((s) => {
        Object.assign(s.settings, partial)
      })
    },

    setStatus: (status) => {
      set((s) => {
        s.status = status
      })
    },

    setProgress: (progress) => {
      set((s) => {
        s.progress = progress
        s.status = progress.status
        if (progress.error) {
          s.error = progress.error
        }
      })
    },

    setResult: (result) => {
      set((s) => {
        s.result = result
        if (result) {
          s.status = 'complete'
        }
      })
    },

    setSourceFile: (fileName, duration, previewUrl) => {
      set((s) => {
        // Revoke old preview URL if exists
        if (s.previewUrl) {
          URL.revokeObjectURL(s.previewUrl)
        }
        s.sourceFileName = fileName
        s.sourceDuration = duration
        s.previewUrl = previewUrl
        s.result = null
        s.status = 'idle'
        s.error = null
      })
    },

    setAbortController: (controller) => {
      set((s) => {
        s.abortController = controller as AbortController | null
      })
    },

    setTargetRig: (type, rigId) => {
      set((s) => {
        s.targetRigType = type
        s.targetRigId = rigId
      })
    },

    setError: (error) => {
      set((s) => {
        s.error = error
        if (error) s.status = 'error'
      })
    },

    cancelExtraction: () => {
      const { abortController } = get()
      if (abortController) {
        abortController.abort()
      }
      set((s) => {
        s.status = 'idle'
        s.abortController = null
        s.progress = {
          status: 'idle',
          currentFrame: 0,
          totalFrames: 0,
          percentage: 0,
        }
      })
    },

    reset: () => {
      const { abortController, previewUrl } = get()
      if (abortController) abortController.abort()
      if (previewUrl) URL.revokeObjectURL(previewUrl)

      set((s) => {
        s.settings = { ...DEFAULT_MOTION_TRANSFER_SETTINGS }
        s.status = 'idle'
        s.progress = {
          status: 'idle',
          currentFrame: 0,
          totalFrames: 0,
          percentage: 0,
        }
        s.result = null
        s.sourceFileName = null
        s.sourceDuration = null
        s.previewUrl = null
        s.abortController = null
        s.error = null
      })
    },
  })),
)
