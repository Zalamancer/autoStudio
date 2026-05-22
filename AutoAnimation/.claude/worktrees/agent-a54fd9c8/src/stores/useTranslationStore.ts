/**
 * Translation Store — manages AI video translation state.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  TranslatedDialogueLine,
  TranslatedProject,
  TranslationProgress,
  TranslationLineProgress,
  TranslationConfig,
} from '@/types/translation'

interface TranslationState {
  /** Target language code (e.g., 'es', 'fr') */
  targetLanguage: string | null
  /** Per-line progress tracking */
  translationProgress: TranslationProgress | null
  /** Translation results */
  translatedLines: TranslatedDialogueLine[]
  /** Full translated project data */
  translatedProject: TranslatedProject | null
  /** Whether a translation is in progress */
  isTranslating: boolean
  /** Error message */
  error: string | null
  /** Translation configuration */
  config: TranslationConfig

  // Actions
  setTargetLanguage: (language: string) => void
  startTranslation: () => void
  updateLineProgress: (lineId: string, progress: Partial<TranslationLineProgress>) => void
  setTranslatedLines: (lines: TranslatedDialogueLine[]) => void
  setTranslatedProject: (project: TranslatedProject) => void
  completeTranslation: () => void
  failTranslation: (error: string) => void
  cancelTranslation: () => void
  clearTranslation: () => void
  setConfig: (config: Partial<TranslationConfig>) => void
}

export const useTranslationStore = create<TranslationState>()(
  immer((set) => ({
    targetLanguage: null,
    translationProgress: null,
    translatedLines: [],
    translatedProject: null,
    isTranslating: false,
    error: null,
    config: {
      targetLanguage: '',
      minSpeed: 0.85,
      maxSpeed: 1.2,
      maxOverlapSeconds: 0.3,
    },

    setTargetLanguage: (language) =>
      set((state) => {
        state.targetLanguage = language
        state.config.targetLanguage = language
      }),

    startTranslation: () =>
      set((state) => {
        state.isTranslating = true
        state.error = null
        state.translatedLines = []
        state.translatedProject = null
        state.translationProgress = { lines: [], overallPercent: 0 }
      }),

    updateLineProgress: (lineId, progress) =>
      set((state) => {
        if (!state.translationProgress) return

        const existing = state.translationProgress.lines.find((l) => l.lineId === lineId)
        if (existing) {
          Object.assign(existing, progress)
        } else {
          state.translationProgress.lines.push({
            lineId,
            status: 'pending',
            ...progress,
          })
        }

        // Recalculate overall percent
        const lines = state.translationProgress.lines
        const completed = lines.filter((l) => l.status === 'complete').length
        state.translationProgress.overallPercent =
          lines.length > 0 ? Math.round((completed / lines.length) * 100) : 0
      }),

    setTranslatedLines: (lines) =>
      set((state) => {
        state.translatedLines = lines
      }),

    setTranslatedProject: (project) =>
      set((state) => {
        state.translatedProject = project
      }),

    completeTranslation: () =>
      set((state) => {
        state.isTranslating = false
        if (state.translationProgress) {
          state.translationProgress.overallPercent = 100
        }
      }),

    failTranslation: (error) =>
      set((state) => {
        state.isTranslating = false
        state.error = error
      }),

    cancelTranslation: () =>
      set((state) => {
        state.isTranslating = false
        state.error = null
      }),

    clearTranslation: () =>
      set((state) => {
        state.targetLanguage = null
        state.translationProgress = null
        state.translatedLines = []
        state.translatedProject = null
        state.isTranslating = false
        state.error = null
      }),

    setConfig: (config) =>
      set((state) => {
        Object.assign(state.config, config)
      }),
  }))
)
