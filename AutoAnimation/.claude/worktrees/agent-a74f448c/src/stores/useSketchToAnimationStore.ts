/**
 * Sketch-to-Animation Store
 *
 * Manages the state for the sketch-to-animation pipeline:
 * sketch upload, analysis results, configuration, and pipeline status.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  SketchAnalysis,
  SketchToAnimationConfig,
  SketchPipelineStatus,
} from '@/types/sketchToAnimation'
import type { ClipPlan } from '@/types/orchestrator'
import { processSketchToAnimation } from '@/services/sketchToAnimation'

interface SketchToAnimationState {
  /** Uploaded sketch image as data URL */
  sketchImage: string | null

  /** Analysis result from Gemini vision */
  analysis: SketchAnalysis | null

  /** Generated ClipPlan from the analysis */
  clipPlan: ClipPlan | null

  /** Vectorized SVG output */
  vectorSvg: string | null

  /** Current pipeline status */
  pipelineStatus: SketchPipelineStatus

  /** Status detail message */
  statusDetail: string

  /** Error message */
  error: string | null

  /** Processing configuration */
  config: SketchToAnimationConfig
}

interface SketchToAnimationActions {
  /** Upload a sketch image */
  setSketchImage: (dataUrl: string) => void

  /** Process the uploaded sketch through the full pipeline */
  processSketch: () => Promise<void>

  /** Update configuration */
  updateConfig: (updates: Partial<SketchToAnimationConfig>) => void

  /** Clear all state */
  reset: () => void
}

const DEFAULT_CONFIG: SketchToAnimationConfig = {
  vectorize: true,
  generateCharacters: true,
  generateBackground: true,
  generateDialogue: true,
  generateMotion: true,
  targetDuration: 15,
}

export const useSketchToAnimationStore = create<SketchToAnimationState & SketchToAnimationActions>()(
  immer((set, get) => ({
    // Initial state
    sketchImage: null,
    analysis: null,
    clipPlan: null,
    vectorSvg: null,
    pipelineStatus: 'idle',
    statusDetail: '',
    error: null,
    config: DEFAULT_CONFIG,

    setSketchImage: (dataUrl: string) => {
      set((state) => {
        state.sketchImage = dataUrl
        state.analysis = null
        state.clipPlan = null
        state.vectorSvg = null
        state.pipelineStatus = 'idle'
        state.error = null
      })
    },

    processSketch: async () => {
      const { sketchImage, config } = get()
      if (!sketchImage) {
        set((state) => {
          state.error = 'No sketch image uploaded'
        })
        return
      }

      set((state) => {
        state.error = null
        state.pipelineStatus = 'analyzing'
      })

      try {
        const result = await processSketchToAnimation(
          sketchImage,
          config,
          (status, detail) => {
            set((state) => {
              state.pipelineStatus = status
              state.statusDetail = detail || ''
            })
          },
        )

        set((state) => {
          state.analysis = result.analysis
          state.clipPlan = result.plan
          state.vectorSvg = result.vectorSvg ?? null
          state.pipelineStatus = 'complete'
        })
      } catch (err) {
        set((state) => {
          state.pipelineStatus = 'error'
          state.error = err instanceof Error ? err.message : 'Failed to process sketch'
        })
      }
    },

    updateConfig: (updates: Partial<SketchToAnimationConfig>) => {
      set((state) => {
        Object.assign(state.config, updates)
      })
    },

    reset: () => {
      set((state) => {
        state.sketchImage = null
        state.analysis = null
        state.clipPlan = null
        state.vectorSvg = null
        state.pipelineStatus = 'idle'
        state.statusDetail = ''
        state.error = null
        state.config = DEFAULT_CONFIG
      })
    },
  }))
)
