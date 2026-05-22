import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { FreesoundHit } from '@/services/freesound'

export type SFXSource = 'search' | 'generate'

/** Ephemeral Audio element — kept outside Zustand to avoid non-serializable state */
let _previewAudio: HTMLAudioElement | null = null

interface SoundEffectState {
  // Search
  searchQuery: string
  source: SFXSource
  results: FreesoundHit[]
  isLoading: boolean
  error: string | null
  totalHits: number
  currentPage: number
  hasMore: boolean

  // Preview
  previewingId: number | null
  previewUrl: string | null

  // Generate
  generatePrompt: string
  isGenerating: boolean

  // Actions
  setSearchQuery: (query: string) => void
  setSource: (source: SFXSource) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setResults: (hits: FreesoundHit[], total: number, page: number) => void
  appendResults: (hits: FreesoundHit[], total: number, page: number) => void
  clearResults: () => void
  setPreviewingId: (id: number | null) => void
  setGeneratePrompt: (prompt: string) => void
  setGenerating: (generating: boolean) => void

  // High-level actions
  preview: (hit: FreesoundHit) => void
  stopPreview: () => void
}

export const useSoundEffectStore = create<SoundEffectState>()(
  immer((set, get) => ({
    searchQuery: '',
    source: 'search',
    results: [],
    isLoading: false,
    error: null,
    totalHits: 0,
    currentPage: 1,
    hasMore: false,
    previewingId: null,
    previewUrl: null,
    generatePrompt: '',
    isGenerating: false,

    setSearchQuery: (query) => set((s) => { s.searchQuery = query }),
    setSource: (source) => set((s) => {
      s.source = source
      s.results = []
      s.totalHits = 0
      s.currentPage = 1
      s.hasMore = false
      s.error = null
    }),
    setLoading: (loading) => set((s) => { s.isLoading = loading }),
    setError: (error) => set((s) => { s.error = error }),

    setResults: (hits, total, page) => set((s) => {
      s.results = hits
      s.totalHits = total
      s.currentPage = page
      s.hasMore = hits.length >= 20 && hits.length < total
    }),

    appendResults: (hits, total, page) => set((s) => {
      s.results.push(...hits)
      s.totalHits = total
      s.currentPage = page
      s.hasMore = s.results.length < total
    }),

    clearResults: () => set((s) => {
      s.results = []
      s.totalHits = 0
      s.currentPage = 1
      s.hasMore = false
      s.error = null
    }),

    setPreviewingId: (id) => set((s) => { s.previewingId = id }),
    setGeneratePrompt: (prompt) => set((s) => { s.generatePrompt = prompt }),
    setGenerating: (generating) => set((s) => { s.isGenerating = generating }),

    preview: (hit) => {
      const { previewingId } = get()

      // Stop current preview
      if (_previewAudio) {
        _previewAudio.pause()
        _previewAudio.src = ''
        _previewAudio = null
      }

      // Toggle off if same
      if (previewingId === hit.id) {
        set((s) => {
          s.previewingId = null
          s.previewUrl = null
        })
        return
      }

      const url = hit.previews['preview-hq-mp3']
      const audio = new Audio(url)
      _previewAudio = audio
      audio.onended = () => {
        _previewAudio = null
        set((s) => {
          s.previewingId = null
          s.previewUrl = null
        })
      }
      audio.play().catch(() => {
        _previewAudio = null
        set((s) => { s.error = 'Failed to play audio preview' })
      })

      set((s) => {
        s.previewingId = hit.id
        s.previewUrl = url
      })
    },

    stopPreview: () => {
      if (_previewAudio) {
        _previewAudio.pause()
        _previewAudio.src = ''
        _previewAudio = null
      }
      set((s) => {
        s.previewingId = null
        s.previewUrl = null
      })
    },
  }))
)
