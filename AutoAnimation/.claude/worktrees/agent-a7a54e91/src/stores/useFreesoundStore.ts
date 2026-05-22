import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { FreesoundHit } from '@/services/freesound'

const PER_PAGE = 20

interface FreesoundState {
  // Search
  query: string
  isLoading: boolean
  error: string | null

  // Results
  results: FreesoundHit[]
  totalHits: number
  currentPage: number
  hasMore: boolean

  // Filters
  maxDuration: number // seconds, 0 = no filter

  // Download tracking (array instead of Set for Immer compatibility)
  downloadingIds: number[]

  // Actions
  setQuery: (query: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setMaxDuration: (maxDuration: number) => void

  setResults: (hits: FreesoundHit[], total: number, page: number) => void
  appendResults: (hits: FreesoundHit[], total: number, page: number) => void

  addDownloadingId: (id: number) => void
  removeDownloadingId: (id: number) => void

  clearResults: () => void
}

export const useFreesoundStore = create<FreesoundState>()(
  immer((set) => ({
    // Initial state
    query: '',
    isLoading: false,
    error: null,
    results: [],
    totalHits: 0,
    currentPage: 1,
    hasMore: false,
    maxDuration: 30,
    downloadingIds: [],

    // Actions
    setQuery: (query) =>
      set((s) => {
        s.query = query
      }),

    setLoading: (loading) =>
      set((s) => {
        s.isLoading = loading
      }),

    setError: (error) =>
      set((s) => {
        s.error = error
      }),

    setMaxDuration: (maxDuration) =>
      set((s) => {
        s.maxDuration = maxDuration
        // Clear results when changing filter
        s.results = []
        s.totalHits = 0
        s.currentPage = 1
        s.hasMore = false
        s.error = null
      }),

    setResults: (hits, total, page) =>
      set((s) => {
        s.results = hits
        s.totalHits = total
        s.currentPage = page
        s.hasMore = hits.length >= PER_PAGE && hits.length < total
      }),

    appendResults: (hits, total, page) =>
      set((s) => {
        s.results.push(...hits)
        s.totalHits = total
        s.currentPage = page
        s.hasMore = s.results.length < total
      }),

    addDownloadingId: (id) =>
      set((s) => {
        if (!s.downloadingIds.includes(id)) {
          s.downloadingIds.push(id)
        }
      }),

    removeDownloadingId: (id) =>
      set((s) => {
        s.downloadingIds = s.downloadingIds.filter((x) => x !== id)
      }),

    clearResults: () =>
      set((s) => {
        s.results = []
        s.totalHits = 0
        s.currentPage = 1
        s.hasMore = false
        s.error = null
      }),
  }))
)
