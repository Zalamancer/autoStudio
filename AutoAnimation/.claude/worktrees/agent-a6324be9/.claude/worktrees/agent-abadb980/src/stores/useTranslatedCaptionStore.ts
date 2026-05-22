/**
 * Translated Caption Store — Multi-language caption state.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { translateCaptions, type TranslatedCaption } from '@/services/captionTranslation'
import type { SentenceEvent } from '@/services/captions'
import type { WordEvent } from '@/types/voice'
import { usePlaybackStore } from '@/stores/usePlaybackStore'

interface TranslatedCaptionState {
  /** Available translated captions */
  translations: TranslatedCaption[]
  /** Currently active language for display (null = original) */
  activeLanguage: string | null
  /** Whether translation is in progress */
  isTranslating: boolean
  /** Error message */
  error: string | null

  // Actions
  translateTo: (
    sentenceTimeline: SentenceEvent[],
    wordTimeline: WordEvent[],
    targetLangCode: string,
  ) => Promise<void>
  setActiveLanguage: (lang: string | null) => void
  removeTranslation: (lang: string) => void
  clearAll: () => void
  reset: () => void

  /** Get the active caption timelines (original if no translation selected) */
  getActiveCaptions: (
    originalSentences: SentenceEvent[],
    originalWords: WordEvent[],
  ) => { sentenceTimeline: SentenceEvent[]; wordTimeline: WordEvent[] }
}

export const useTranslatedCaptionStore = create<TranslatedCaptionState>()(
  immer((set, get) => ({
    translations: [],
    activeLanguage: null,
    isTranslating: false,
    error: null,

    translateTo: async (sentenceTimeline, wordTimeline, targetLangCode) => {
      // Check if already translated
      if (get().translations.some((t) => t.language === targetLangCode)) {
        set((s) => { s.activeLanguage = targetLangCode })
        return
      }

      set((s) => {
        s.isTranslating = true
        s.error = null
      })

      try {
                const fps = usePlaybackStore.getState().fps || 30
        const result = await translateCaptions(
          sentenceTimeline,
          wordTimeline,
          targetLangCode,
          geminiKey,
          fps,
        )

        set((s) => {
          s.translations.push(result)
          s.activeLanguage = targetLangCode
          s.isTranslating = false
        })
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : 'Translation failed'
          s.isTranslating = false
        })
      }
    },

    setActiveLanguage: (lang) =>
      set((s) => {
        s.activeLanguage = lang
      }),

    removeTranslation: (lang) =>
      set((s) => {
        s.translations = s.translations.filter((t) => t.language !== lang)
        if (s.activeLanguage === lang) s.activeLanguage = null
      }),

    clearAll: () =>
      set((s) => {
        s.translations = []
        s.activeLanguage = null
      }),

    reset: () =>
      set((s) => {
        s.translations = []
        s.activeLanguage = null
        s.isTranslating = false
        s.error = null
      }),

    getActiveCaptions: (originalSentences, originalWords) => {
      const { activeLanguage, translations } = get()
      if (!activeLanguage) {
        return { sentenceTimeline: originalSentences, wordTimeline: originalWords }
      }
      const translation = translations.find((t) => t.language === activeLanguage)
      if (!translation) {
        return { sentenceTimeline: originalSentences, wordTimeline: originalWords }
      }
      return {
        sentenceTimeline: translation.sentenceTimeline,
        wordTimeline: translation.wordTimeline,
      }
    },
  }))
)
