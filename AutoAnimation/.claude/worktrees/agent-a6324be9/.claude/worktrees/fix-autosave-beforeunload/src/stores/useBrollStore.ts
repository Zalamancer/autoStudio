/**
 * B-Roll Store -- manages interactive B-roll suggestion state for manual editing.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { PixabayImageHit } from '@/services/pixabay'
import type { MediaTransitionType } from './useMediaStore'

export interface BrollSearchResult {
  type: 'image' | 'video'
  thumbnailUrl: string
  previewUrl: string
  downloadUrl: string
  width: number
  height: number
  score: number
  pixabayId: number
}

export interface BrollSuggestion {
  id: string
  /** Gap start frame */
  startFrame: number
  /** Gap end frame */
  endFrame: number
  /** Visual concept search query */
  query: string
  /** Search results for this gap */
  results: BrollSearchResult[]
  /** Selected result index */
  selectedIndex: number
  /** Status of this suggestion */
  status: 'pending' | 'accepted' | 'rejected'
  /** Transition type for the inserted media */
  transition: MediaTransitionType
  /** Dialogue context before the gap */
  contextBefore?: string
  /** Dialogue context after the gap */
  contextAfter?: string
  /** Whether results are currently loading */
  isSearching: boolean
}

interface BrollState {
  suggestions: BrollSuggestion[]
  isAnalyzing: boolean
  selectedSuggestionId: string | null

  // Actions
  analyzeTranscript: () => Promise<void>
  acceptSuggestion: (id: string) => Promise<void>
  rejectSuggestion: (id: string) => void
  swapSuggestion: (id: string, newIndex: number) => void
  refreshSuggestion: (id: string, newQuery?: string) => Promise<void>
  setSelectedSuggestion: (id: string | null) => void
  setSuggestionTransition: (id: string, transition: MediaTransitionType) => void
  reset: () => void
}

/** Rate limiter: minimum 500ms between Pixabay requests */
let lastSearchTime = 0
const MIN_SEARCH_INTERVAL = 500
const MAX_CONCURRENT = 2
let activeSearches = 0

async function rateLimitedSearch<T>(searchFn: () => Promise<T>): Promise<T> {
  // Wait for concurrent slot
  while (activeSearches >= MAX_CONCURRENT) {
    await new Promise((r) => setTimeout(r, 100))
  }

  // Enforce minimum interval
  const now = Date.now()
  const wait = Math.max(0, MIN_SEARCH_INTERVAL - (now - lastSearchTime))
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))

  activeSearches++
  lastSearchTime = Date.now()
  try {
    return await searchFn()
  } finally {
    activeSearches--
  }
}

export const useBrollStore = create<BrollState>()(
  immer((set, get) => ({
    suggestions: [],
    isAnalyzing: false,
    selectedSuggestionId: null,

    analyzeTranscript: async () => {
      set((state) => {
        state.isAnalyzing = true
        state.suggestions = []
      })

      try {
        const { findDialogueGaps, extractVisualConcepts } = await import(
          '@/services/brollIntelligence'
        )
        const { useTimelineStore } = await import('@/stores/useTimelineStore')

        const fps = useTimelineStore.getState().fps || 30
        const totalFrames = useTimelineStore.getState().totalFrames

        // Find gaps in dialogue
        const gaps = findDialogueGaps(fps, totalFrames)
        if (gaps.length === 0) {
          set((state) => { state.isAnalyzing = false })
          return
        }

        // Extract visual concepts for gap contexts
        const contexts = gaps.map((g) => {
          const parts: string[] = []
          if (g.contextBefore) parts.push(g.contextBefore)
          if (g.contextAfter) parts.push(g.contextAfter)
          return parts.join(' ... ') || 'general footage'
        })
        const queries = await extractVisualConcepts(contexts)

        // Create suggestion entries
        const newSuggestions: BrollSuggestion[] = gaps.map((gap, i) => ({
          id: `broll_${Date.now()}_${i}`,
          startFrame: gap.startFrame,
          endFrame: gap.endFrame,
          query: queries[i] || 'stock footage',
          results: [],
          selectedIndex: 0,
          status: 'pending' as const,
          transition: 'ken-burns' as MediaTransitionType,
          contextBefore: gap.contextBefore,
          contextAfter: gap.contextAfter,
          isSearching: false,
        }))

        set((state) => {
          state.suggestions = newSuggestions
          state.isAnalyzing = false
        })

        // Search Pixabay for each suggestion (one at a time to respect rate limits)
        for (const suggestion of newSuggestions) {
          set((state) => {
            const s = state.suggestions.find((x) => x.id === suggestion.id)
            if (s) s.isSearching = true
          })

          try {
            const results = await rateLimitedSearch(async () => {
              const { getPixabayService } = await import('@/services/pixabay')
              const resp = await getPixabayService().searchImages({ q: suggestion.query, per_page: 5, orientation: 'horizontal' })
              return (resp.hits || []).map((hit: PixabayImageHit) => ({
                type: 'image' as const,
                thumbnailUrl: hit.previewURL,
                previewUrl: hit.webformatURL,
                downloadUrl: hit.largeImageURL,
                width: hit.imageWidth,
                height: hit.imageHeight,
                score: (hit.likes || 0) + (hit.views || 0) / 100,
                pixabayId: hit.id,
              }))
            })

            set((state) => {
              const s = state.suggestions.find((x) => x.id === suggestion.id)
              if (s) {
                s.results = results.sort((a: BrollSearchResult, b: BrollSearchResult) => b.score - a.score).slice(0, 5)
                s.isSearching = false
              }
            })
          } catch {
            set((state) => {
              const s = state.suggestions.find((x) => x.id === suggestion.id)
              if (s) s.isSearching = false
            })
          }
        }
      } catch (err) {
        console.warn('[BrollStore] Transcript analysis failed:', err)
        set((state) => { state.isAnalyzing = false })
      }
    },

    acceptSuggestion: async (id) => {
      const suggestion = get().suggestions.find((s) => s.id === id)
      if (!suggestion || suggestion.status !== 'pending') return
      if (suggestion.results.length === 0) return

      const selected = suggestion.results[suggestion.selectedIndex]
      if (!selected) return

      set((state) => {
        const s = state.suggestions.find((x) => x.id === id)
        if (s) s.status = 'accepted'
      })

      try {
        // Download the image as blob
        const resp = await fetch(selected.downloadUrl)
        const blob = await resp.blob()

        // Add to media store
        const { useMediaStore } = await import('@/stores/useMediaStore')
        const store = useMediaStore.getState()

        const assetId = `broll_asset_${Date.now()}`
        const url = URL.createObjectURL(blob)

        store.addAsset({
          id: assetId,
          name: `B-Roll: ${suggestion.query}`,
          type: blob.type,
          size: blob.size,
          category: 'images',
          url,
          width: selected.width,
          height: selected.height,
          addedAt: Date.now(),
        }, blob)

        store.addToCanvas(assetId)

        // Position at the gap's frame range
        const canvasItem = store.canvasItems.find((c) => c.assetId === assetId)
        if (canvasItem) {
          store.updateCanvasItem(canvasItem.id, {
            startFrame: suggestion.startFrame,
            endFrame: suggestion.endFrame,
            enterTransition: suggestion.transition,
            exitTransition: 'fade',
          })
        }
      } catch (err) {
        console.warn('[BrollStore] Accept suggestion failed:', err)
        // Revert status
        set((state) => {
          const s = state.suggestions.find((x) => x.id === id)
          if (s) s.status = 'pending'
        })
      }
    },

    rejectSuggestion: (id) =>
      set((state) => {
        const s = state.suggestions.find((x) => x.id === id)
        if (s) s.status = 'rejected'
      }),

    swapSuggestion: (id, newIndex) =>
      set((state) => {
        const s = state.suggestions.find((x) => x.id === id)
        if (s && newIndex >= 0 && newIndex < s.results.length) {
          s.selectedIndex = newIndex
        }
      }),

    refreshSuggestion: async (id, newQuery) => {
      const suggestion = get().suggestions.find((s) => s.id === id)
      if (!suggestion) return

      const query = newQuery || suggestion.query

      set((state) => {
        const s = state.suggestions.find((x) => x.id === id)
        if (s) {
          s.query = query
          s.isSearching = true
          s.selectedIndex = 0
        }
      })

      try {
        const results = await rateLimitedSearch(async () => {
          const { getPixabayService } = await import('@/services/pixabay')
          const resp = await getPixabayService().searchImages({ q: query, per_page: 5, orientation: 'horizontal' })
          return (resp.hits || []).map((hit: PixabayImageHit) => ({
            type: 'image' as const,
            thumbnailUrl: hit.previewURL,
            previewUrl: hit.webformatURL,
            downloadUrl: hit.largeImageURL,
            width: hit.imageWidth,
            height: hit.imageHeight,
            score: (hit.likes || 0) + (hit.views || 0) / 100,
            pixabayId: hit.id,
          }))
        })

        set((state) => {
          const s = state.suggestions.find((x) => x.id === id)
          if (s) {
            s.results = results.sort((a: BrollSearchResult, b: BrollSearchResult) => b.score - a.score).slice(0, 5)
            s.isSearching = false
          }
        })
      } catch {
        set((state) => {
          const s = state.suggestions.find((x) => x.id === id)
          if (s) s.isSearching = false
        })
      }
    },

    setSelectedSuggestion: (id) =>
      set((state) => { state.selectedSuggestionId = id }),

    setSuggestionTransition: (id, transition) =>
      set((state) => {
        const s = state.suggestions.find((x) => x.id === id)
        if (s) s.transition = transition
      }),

    reset: () =>
      set((state) => {
        state.suggestions = []
        state.isAnalyzing = false
        state.selectedSuggestionId = null
      }),
  }))
)
