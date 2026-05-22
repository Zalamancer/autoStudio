/**
 * Dubbing Store — Multi-language dubbing job management.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  createDubbingJob,
  waitForDubbing,
  downloadDubbedAudio,
  processDubbedAudio,
  type DubbedLanguageResult,
} from '@/services/dubbing'

interface DubbingState {
  /** Active dubbing job ID */
  dubbingId: string | null
  /** Source language code */
  sourceLanguage: string
  /** Target language codes */
  targetLanguages: string[]
  /** Processing state */
  isProcessing: boolean
  /** Current status text */
  statusText: string
  /** Error message */
  error: string | null
  /** Results per language */
  results: DubbedLanguageResult[]
  /** Progress (0-1) */
  progress: number
  /** Batch dubbing results keyed by clip ID */
  batchResults: Record<string, DubbedLanguageResult[]>
  /** Batch dubbing progress keyed by clip ID (0-1) */
  batchProgress: Record<string, number>

  // Actions
  setSourceLanguage: (lang: string) => void
  setTargetLanguages: (langs: string[]) => void
  toggleTargetLanguage: (lang: string) => void
  startDubbing: (audioBlob: Blob, fps: number) => Promise<void>
  startDubbingBatch: (clips: { id: string; blob: Blob }[], fps: number) => Promise<void>
  clearResults: () => void
  reset: () => void
}

export const useDubbingStore = create<DubbingState>()(
  immer((set, get) => ({
    dubbingId: null,
    sourceLanguage: 'en',
    targetLanguages: [],
    isProcessing: false,
    statusText: '',
    error: null,
    results: [],
    progress: 0,
    batchResults: {},
    batchProgress: {},

    setSourceLanguage: (lang) =>
      set((s) => {
        s.sourceLanguage = lang
      }),

    setTargetLanguages: (langs) =>
      set((s) => {
        s.targetLanguages = langs
      }),

    toggleTargetLanguage: (lang) =>
      set((s) => {
        const idx = s.targetLanguages.indexOf(lang)
        if (idx >= 0) {
          s.targetLanguages.splice(idx, 1)
        } else {
          s.targetLanguages.push(lang)
        }
      }),

    startDubbing: async (audioBlob, fps) => {
      const { sourceLanguage, targetLanguages } = get()
      if (targetLanguages.length === 0) {
        set((s) => { s.error = 'Select at least one target language' })
        return
      }

      set((s) => {
        s.isProcessing = true
        s.error = null
        s.results = []
        s.progress = 0
        s.statusText = 'Creating dubbing job...'
      })

      try {
        // 1. Create dubbing job
        const dubbingId = await createDubbingJob(audioBlob, sourceLanguage, targetLanguages)
        set((s) => {
          s.dubbingId = dubbingId
          s.statusText = 'Dubbing in progress...'
          s.progress = 0.1
        })

        // 2. Wait for completion
        await waitForDubbing(dubbingId, (status) => {
          set((s) => {
            s.statusText = `Status: ${status}`
            s.progress = 0.3
          })
        })

        set((s) => {
          s.statusText = 'Downloading dubbed audio...'
          s.progress = 0.5
        })

        // 3. Download audio for each target language
        const results: DubbedLanguageResult[] = []
        for (let i = 0; i < targetLanguages.length; i++) {
          const lang = targetLanguages[i]
          set((s) => {
            s.statusText = `Downloading ${lang} audio...`
            s.progress = 0.5 + (i / targetLanguages.length) * 0.4
          })

          const audioBlob = await downloadDubbedAudio(dubbingId, lang)
          const result = processDubbedAudio(audioBlob, lang, fps)
          results.push(result)
        }

        set((s) => {
          s.results = results
          s.isProcessing = false
          s.statusText = 'Dubbing complete!'
          s.progress = 1
        })
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : 'Dubbing failed'
          s.isProcessing = false
          s.progress = 0
        })
      }
    },

    startDubbingBatch: async (clips, fps) => {
      const { sourceLanguage, targetLanguages } = get()
      if (targetLanguages.length === 0) {
        set((s) => { s.error = 'Select at least one target language' })
        return
      }
      if (clips.length === 0) {
        set((s) => { s.error = 'No audio clips to dub' })
        return
      }

      set((s) => {
        s.isProcessing = true
        s.error = null
        s.batchResults = {}
        s.batchProgress = {}
        s.progress = 0
        s.statusText = `Dubbing ${clips.length} clip${clips.length !== 1 ? 's' : ''} in parallel...`
      })

      try {
        await Promise.all(
          clips.map(async (clip) => {
            try {
              set((s) => { s.batchProgress[clip.id] = 0.1 })

              const dubbingId = await createDubbingJob(clip.blob, sourceLanguage, targetLanguages)
              set((s) => { s.batchProgress[clip.id] = 0.2 })

              await waitForDubbing(dubbingId, () => {
                set((s) => { s.batchProgress[clip.id] = 0.4 })
              })

              const results: DubbedLanguageResult[] = []
              for (let i = 0; i < targetLanguages.length; i++) {
                const lang = targetLanguages[i]
                const audioBlob = await downloadDubbedAudio(dubbingId, lang)
                const result = processDubbedAudio(audioBlob, lang, fps)
                results.push(result)
                set((s) => {
                  s.batchProgress[clip.id] = 0.5 + (i / targetLanguages.length) * 0.5
                })
              }

              set((s) => {
                s.batchResults[clip.id] = results
                s.batchProgress[clip.id] = 1
                // Update aggregate progress
                const progValues = Object.values(s.batchProgress)
                s.progress = progValues.reduce((a, b) => a + b, 0) / clips.length
              })
            } catch (err) {
              set((s) => {
                s.batchProgress[clip.id] = -1
              })
              throw err
            }
          }),
        )

        set((s) => {
          s.isProcessing = false
          s.progress = 1
          s.statusText = `Batch dubbing complete! ${clips.length} clips dubbed.`
        })
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : 'Batch dubbing failed'
          s.isProcessing = false
        })
      }
    },

    clearResults: () =>
      set((s) => {
        // Revoke blob URLs
        for (const r of s.results) {
          URL.revokeObjectURL(r.audioUrl)
        }
        for (const clipResults of Object.values(s.batchResults)) {
          for (const r of clipResults) {
            URL.revokeObjectURL(r.audioUrl)
          }
        }
        s.results = []
        s.batchResults = {}
        s.batchProgress = {}
        s.dubbingId = null
        s.progress = 0
        s.statusText = ''
      }),

    reset: () =>
      set((s) => {
        for (const r of s.results) {
          URL.revokeObjectURL(r.audioUrl)
        }
        for (const clipResults of Object.values(s.batchResults)) {
          for (const r of clipResults) {
            URL.revokeObjectURL(r.audioUrl)
          }
        }
        s.dubbingId = null
        s.sourceLanguage = 'en'
        s.targetLanguages = []
        s.isProcessing = false
        s.statusText = ''
        s.error = null
        s.results = []
        s.batchResults = {}
        s.batchProgress = {}
        s.progress = 0
      }),
  }))
)
