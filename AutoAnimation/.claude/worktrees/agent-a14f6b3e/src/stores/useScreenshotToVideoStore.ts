/**
 * useScreenshotToVideoStore — State management for Screenshot-to-Video feature.
 *
 * Manages the workflow of uploading screenshots, running AI analysis,
 * generating narration, and converting to a video composition.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  ScreenshotAsset,
  ScreenshotAnalysis,
  ScreenshotToVideoConfig,
} from '@/types/screenshotToVideo'
import { DEFAULT_S2V_CONFIG } from '@/types/screenshotToVideo'

export type S2VPhase = 'upload' | 'analyzing' | 'review' | 'generating' | 'done' | 'error'

interface ScreenshotToVideoState {
  // ── Phase ──
  phase: S2VPhase
  error: string | null
  progress: number // 0-100

  // ── Screenshots ──
  screenshots: ScreenshotAsset[]
  selectedScreenshotId: string | null

  // ── Analysis ──
  analyses: Record<string, ScreenshotAnalysis>

  // ── Config ──
  config: Omit<ScreenshotToVideoConfig, 'screenshots' | 'analyses'>

  // ── Combined narration script ──
  fullScript: string

  // ── Actions ──
  setPhase: (phase: S2VPhase) => void
  setError: (error: string | null) => void
  setProgress: (progress: number) => void

  // Screenshot management
  addScreenshot: (screenshot: Omit<ScreenshotAsset, 'id' | 'order'>) => string
  removeScreenshot: (id: string) => void
  reorderScreenshots: (fromIndex: number, toIndex: number) => void
  setSelectedScreenshotId: (id: string | null) => void
  clearScreenshots: () => void

  // Analysis
  setAnalysis: (screenshotId: string, analysis: ScreenshotAnalysis) => void
  updateAnalysis: (screenshotId: string, updates: Partial<ScreenshotAnalysis>) => void

  // Config
  updateConfig: (updates: Partial<ScreenshotToVideoConfig>) => void

  // Script
  setFullScript: (script: string) => void
  updateScreenshotScript: (screenshotId: string, script: string) => void

  // Reset
  reset: () => void
}

export const useScreenshotToVideoStore = create<ScreenshotToVideoState>()(
  immer((set, _get) => ({
    phase: 'upload',
    error: null,
    progress: 0,
    screenshots: [],
    selectedScreenshotId: null,
    analyses: {},
    config: { ...DEFAULT_S2V_CONFIG },
    fullScript: '',

    setPhase: (phase) =>
      set((state) => {
        state.phase = phase
      }),

    setError: (error) =>
      set((state) => {
        state.error = error
        if (error) state.phase = 'error'
      }),

    setProgress: (progress) =>
      set((state) => {
        state.progress = Math.min(100, Math.max(0, progress))
      }),

    // ── Screenshot management ──

    addScreenshot: (screenshot) => {
      const id = `ss-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      set((state) => {
        const order = state.screenshots.length
        state.screenshots.push({ ...screenshot, id, order })
        if (!state.selectedScreenshotId) {
          state.selectedScreenshotId = id
        }
      })
      return id
    },

    removeScreenshot: (id) =>
      set((state) => {
        state.screenshots = state.screenshots.filter((s) => s.id !== id)
        // Recompute order
        state.screenshots.forEach((s, i) => {
          s.order = i
        })
        delete state.analyses[id]
        if (state.selectedScreenshotId === id) {
          state.selectedScreenshotId = state.screenshots[0]?.id || null
        }
      }),

    reorderScreenshots: (fromIndex, toIndex) =>
      set((state) => {
        const [moved] = state.screenshots.splice(fromIndex, 1)
        if (moved) {
          state.screenshots.splice(toIndex, 0, moved)
          state.screenshots.forEach((s, i) => {
            s.order = i
          })
        }
      }),

    setSelectedScreenshotId: (id) =>
      set((state) => {
        state.selectedScreenshotId = id
      }),

    clearScreenshots: () =>
      set((state) => {
        state.screenshots = []
        state.selectedScreenshotId = null
        state.analyses = {}
        state.fullScript = ''
      }),

    // ── Analysis ──

    setAnalysis: (screenshotId, analysis) =>
      set((state) => {
        state.analyses[screenshotId] = analysis
      }),

    updateAnalysis: (screenshotId, updates) =>
      set((state) => {
        const existing = state.analyses[screenshotId]
        if (existing) {
          Object.assign(existing, updates)
        }
      }),

    // ── Config ──

    updateConfig: (updates) =>
      set((state) => {
        Object.assign(state.config, updates)
      }),

    // ── Script ──

    setFullScript: (script) =>
      set((state) => {
        state.fullScript = script
      }),

    updateScreenshotScript: (screenshotId, script) =>
      set((state) => {
        const analysis = state.analyses[screenshotId]
        if (analysis) {
          analysis.narrationScript = script
        }
      }),

    // ── Reset ──

    reset: () =>
      set((state) => {
        state.phase = 'upload'
        state.error = null
        state.progress = 0
        state.screenshots = []
        state.selectedScreenshotId = null
        state.analyses = {}
        state.config = { ...DEFAULT_S2V_CONFIG }
        state.fullScript = ''
      }),
  }))
)
