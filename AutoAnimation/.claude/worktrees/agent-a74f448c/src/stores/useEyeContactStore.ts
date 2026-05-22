/**
 * Eye Contact Correction Store
 *
 * Manages state for AI-based gaze redirection on character sprites.
 * Uses MediaPipe Face Mesh for eye detection and canvas warping for correction.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  EyeContactSettings,
  EyeDetectionResult,
  EyeCorrectedSprite,
  EyeCorrectionBatchStatus,
  GazeTarget,
} from '@/types/eyeContact'
import { DEFAULT_EYE_CONTACT_SETTINGS } from '@/types/eyeContact'

interface EyeContactState {
  /** Current settings */
  settings: EyeContactSettings
  /** Detection result for the currently selected sprite */
  currentDetection: EyeDetectionResult | null
  /** Corrected sprites cache (original src -> corrected sprite) */
  correctedSprites: Record<string, EyeCorrectedSprite>
  /** Batch processing status */
  batchStatus: EyeCorrectionBatchStatus
  /** Whether the detection model is loaded */
  isModelLoaded: boolean
  /** Whether detection is currently running */
  isDetecting: boolean
  /** Error message */
  error: string | null

  // Actions
  updateSettings: (partial: Partial<EyeContactSettings>) => void
  setTarget: (target: GazeTarget) => void
  setStrength: (strength: number) => void
  setDetection: (detection: EyeDetectionResult | null) => void
  setCorrectedSprite: (originalSrc: string, corrected: EyeCorrectedSprite) => void
  clearCorrectedSprites: () => void
  setBatchStatus: (status: Partial<EyeCorrectionBatchStatus>) => void
  setModelLoaded: (loaded: boolean) => void
  setDetecting: (detecting: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useEyeContactStore = create<EyeContactState>()(
  immer((set) => ({
    settings: { ...DEFAULT_EYE_CONTACT_SETTINGS },
    currentDetection: null,
    correctedSprites: {},
    batchStatus: {
      total: 0,
      processed: 0,
      failed: 0,
      results: [],
      isProcessing: false,
      error: null,
    },
    isModelLoaded: false,
    isDetecting: false,
    error: null,

    updateSettings: (partial) => {
      set((s) => {
        Object.assign(s.settings, partial)
      })
    },

    setTarget: (target) => {
      set((s) => {
        s.settings.target = target
      })
    },

    setStrength: (strength) => {
      set((s) => {
        s.settings.strength = Math.max(0, Math.min(1, strength))
      })
    },

    setDetection: (detection) => {
      set((s) => {
        s.currentDetection = detection
      })
    },

    setCorrectedSprite: (originalSrc, corrected) => {
      set((s) => {
        s.correctedSprites[originalSrc] = corrected
      })
    },

    clearCorrectedSprites: () => {
      set((s) => {
        s.correctedSprites = {}
      })
    },

    setBatchStatus: (status) => {
      set((s) => {
        Object.assign(s.batchStatus, status)
      })
    },

    setModelLoaded: (loaded) => {
      set((s) => {
        s.isModelLoaded = loaded
      })
    },

    setDetecting: (detecting) => {
      set((s) => {
        s.isDetecting = detecting
      })
    },

    setError: (error) => {
      set((s) => {
        s.error = error
      })
    },

    reset: () => {
      set((s) => {
        s.settings = { ...DEFAULT_EYE_CONTACT_SETTINGS }
        s.currentDetection = null
        s.correctedSprites = {}
        s.batchStatus = {
          total: 0,
          processed: 0,
          failed: 0,
          results: [],
          isProcessing: false,
          error: null,
        }
        s.isDetecting = false
        s.error = null
      })
    },
  })),
)
