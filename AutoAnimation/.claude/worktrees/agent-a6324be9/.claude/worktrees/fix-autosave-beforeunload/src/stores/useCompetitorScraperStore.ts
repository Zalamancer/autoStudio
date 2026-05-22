/**
 * Competitor Scraper Store — State management for the competitor video scraper.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  CompetitorVideo,
  CompetitorAnalysis,
  CompetitorTranscript,
  ScraperPlatform,
  ScraperJobType,
} from '@/types/competitorScraper'
import {
  scrapeUrl,
  scrapeUsername,
  scrapeKeyword,
  transcribeVideo,
  analyzeVideo,
} from '@/services/competitorScraperService'
import { toast } from '@/stores/useToastStore'

interface CompetitorScraperState {
  // Data
  scrapedVideos: CompetitorVideo[]
  selectedVideoId: string | null
  analysisCache: Record<string, CompetitorAnalysis>
  transcriptCache: Record<string, CompetitorTranscript>
  searchHistory: Array<{ query: string; type: ScraperJobType; platform?: ScraperPlatform; timestamp: number }>

  // UI state
  inputMode: ScraperJobType
  isLoading: boolean
  error: string | null

  // Actions
  setInputMode: (mode: ScraperJobType) => void
  setSelectedVideoId: (id: string | null) => void
  clearResults: () => void

  // Async actions
  doScrapeUrl: (url: string) => Promise<void>
  doScrapeUsername: (username: string, platform: ScraperPlatform) => Promise<void>
  doScrapeKeyword: (keyword: string, platforms: ScraperPlatform[]) => Promise<void>
  doTranscribe: (videoId: string, url: string) => Promise<void>
  doAnalyze: (videoId: string) => Promise<void>
}

export const useCompetitorScraperStore = create<CompetitorScraperState>()(
  immer((set, get) => ({
    scrapedVideos: [],
    selectedVideoId: null,
    analysisCache: {},
    transcriptCache: {},
    searchHistory: [],
    inputMode: 'url',
    isLoading: false,
    error: null,

    setInputMode: (mode) =>
      set((s) => {
        s.inputMode = mode
      }),

    setSelectedVideoId: (id) =>
      set((s) => {
        s.selectedVideoId = id
      }),

    clearResults: () =>
      set((s) => {
        s.scrapedVideos = []
        s.selectedVideoId = null
        s.error = null
      }),

    doScrapeUrl: async (url) => {
      set((s) => {
        s.isLoading = true
        s.error = null
      })
      try {
        const video = await scrapeUrl(url)
        set((s) => {
          // Add to front, avoid duplicates
          s.scrapedVideos = [video, ...s.scrapedVideos.filter((v) => v.id !== video.id)]
          s.selectedVideoId = video.id
          s.isLoading = false
          s.searchHistory.unshift({ query: url, type: 'url', timestamp: Date.now() })
          if (s.searchHistory.length > 50) s.searchHistory.length = 50
        })
        if (video.transcript) {
          set((s) => {
            s.transcriptCache[video.id] = video.transcript!
          })
        }
        toast.success('Video scraped successfully')
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Scrape failed'
        set((s) => {
          s.isLoading = false
          s.error = msg
        })
        toast.error(msg)
      }
    },

    doScrapeUsername: async (username, platform) => {
      set((s) => {
        s.isLoading = true
        s.error = null
      })
      try {
        const { videos } = await scrapeUsername(username, platform)
        set((s) => {
          const existingIds = new Set(s.scrapedVideos.map((v) => v.id))
          const newVideos = videos.filter((v) => !existingIds.has(v.id))
          s.scrapedVideos = [...newVideos, ...s.scrapedVideos]
          s.isLoading = false
          s.searchHistory.unshift({ query: username, type: 'username', platform, timestamp: Date.now() })
          if (s.searchHistory.length > 50) s.searchHistory.length = 50
        })
        toast.success(`Found ${videos.length} videos from @${username}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Username scrape failed'
        set((s) => {
          s.isLoading = false
          s.error = msg
        })
        toast.error(msg)
      }
    },

    doScrapeKeyword: async (keyword, platforms) => {
      set((s) => {
        s.isLoading = true
        s.error = null
      })
      try {
        const { videos } = await scrapeKeyword(keyword, platforms)
        set((s) => {
          const existingIds = new Set(s.scrapedVideos.map((v) => v.id))
          const newVideos = videos.filter((v) => !existingIds.has(v.id))
          s.scrapedVideos = [...newVideos, ...s.scrapedVideos]
          s.isLoading = false
          s.searchHistory.unshift({ query: keyword, type: 'keyword', timestamp: Date.now() })
          if (s.searchHistory.length > 50) s.searchHistory.length = 50
        })
        toast.success(`Found ${videos.length} videos for "${keyword}"`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Keyword search failed'
        set((s) => {
          s.isLoading = false
          s.error = msg
        })
        toast.error(msg)
      }
    },

    doTranscribe: async (videoId, url) => {
      try {
        const transcript = await transcribeVideo(url)
        set((s) => {
          s.transcriptCache[videoId] = transcript
          const video = s.scrapedVideos.find((v) => v.id === videoId)
          if (video) video.transcript = transcript
        })
        toast.success('Transcript extracted')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Transcription failed')
      }
    },

    doAnalyze: async (videoId) => {
      const state = get()
      const video = state.scrapedVideos.find((v) => v.id === videoId)
      if (!video) return

      try {
        const analysis = await analyzeVideo({
          title: video.title,
          description: video.description,
          transcript: video.transcript?.text || state.transcriptCache[videoId]?.text,
          stats: { views: video.stats.views, likes: video.stats.likes, comments: video.stats.comments },
        })
        set((s) => {
          s.analysisCache[videoId] = analysis
          const v = s.scrapedVideos.find((v) => v.id === videoId)
          if (v) v.analysis = analysis
        })
        toast.success('Analysis complete')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Analysis failed')
      }
    },
  })),
)
