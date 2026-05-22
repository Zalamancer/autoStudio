import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { PixabayImageHit, PixabayVideoHit } from '@/services/pixabay'

export type PixabayMediaType = 'images' | 'videos'

const PER_PAGE = 20

interface PixabayState {
  // Search
  query: string
  mediaType: PixabayMediaType
  isLoading: boolean
  error: string | null

  // Results
  imageResults: PixabayImageHit[]
  videoResults: PixabayVideoHit[]
  totalHits: number
  currentPage: number
  hasMore: boolean

  // Download tracking (array instead of Set for Immer compatibility)
  downloadingIds: number[]

  // Actions
  setQuery: (query: string) => void
  setMediaType: (type: PixabayMediaType) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  setImageResults: (hits: PixabayImageHit[], total: number, page: number) => void
  appendImageResults: (hits: PixabayImageHit[], total: number, page: number) => void
  setVideoResults: (hits: PixabayVideoHit[], total: number, page: number) => void
  appendVideoResults: (hits: PixabayVideoHit[], total: number, page: number) => void

  addDownloadingId: (id: number) => void
  removeDownloadingId: (id: number) => void

  clearResults: () => void
}

export const usePixabayStore = create<PixabayState>()(
  immer((set) => ({
    // Initial state
    query: '',
    mediaType: 'images',
    isLoading: false,
    error: null,
    imageResults: [],
    videoResults: [],
    totalHits: 0,
    currentPage: 1,
    hasMore: false,
    downloadingIds: [],

    // Actions
    setQuery: (query) =>
      set((s) => {
        s.query = query
      }),

    setMediaType: (type) =>
      set((s) => {
        s.mediaType = type
        // Clear results when switching type
        s.imageResults = []
        s.videoResults = []
        s.totalHits = 0
        s.currentPage = 1
        s.hasMore = false
        s.error = null
      }),

    setLoading: (loading) =>
      set((s) => {
        s.isLoading = loading
      }),

    setError: (error) =>
      set((s) => {
        s.error = error
      }),

    setImageResults: (hits, total, page) =>
      set((s) => {
        s.imageResults = hits
        s.totalHits = total
        s.currentPage = page
        s.hasMore = hits.length >= PER_PAGE && hits.length < total
      }),

    appendImageResults: (hits, total, page) =>
      set((s) => {
        s.imageResults.push(...hits)
        s.totalHits = total
        s.currentPage = page
        s.hasMore = s.imageResults.length < total
      }),

    setVideoResults: (hits, total, page) =>
      set((s) => {
        s.videoResults = hits
        s.totalHits = total
        s.currentPage = page
        s.hasMore = hits.length >= PER_PAGE && hits.length < total
      }),

    appendVideoResults: (hits, total, page) =>
      set((s) => {
        s.videoResults.push(...hits)
        s.totalHits = total
        s.currentPage = page
        s.hasMore = s.videoResults.length < total
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
        s.imageResults = []
        s.videoResults = []
        s.totalHits = 0
        s.currentPage = 1
        s.hasMore = false
        s.error = null
      }),
  }))
)
