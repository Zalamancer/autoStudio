import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import type { PublishedPost, AggregatedMetrics, PlatformMetrics } from '@/types/analytics'
import { fetchAllMetricsForRecording } from '@/services/analyticsService'

interface AnalyticsState {
  publishedPosts: PublishedPost[]
  isRefreshing: boolean
  lastRefreshedAt: string | null

  addPublishedPost: (post: PublishedPost) => void
  removePublishedPost: (id: string) => void
  updateMetrics: (postId: string, metrics: PlatformMetrics) => void
  refreshMetrics: (recordingId?: string) => Promise<void>
  getPostsForRecording: (recordingId: string) => PublishedPost[]
  getAggregatedMetrics: (recordingId: string) => AggregatedMetrics
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    immer((set, get) => ({
      publishedPosts: [],
      isRefreshing: false,
      lastRefreshedAt: null,

      addPublishedPost: (post) => {
        set((state) => {
          state.publishedPosts.unshift(post)
        })
      },

      removePublishedPost: (id) => {
        set((state) => {
          state.publishedPosts = state.publishedPosts.filter((p) => p.id !== id)
        })
      },

      updateMetrics: (postId, metrics) => {
        set((state) => {
          const post = state.publishedPosts.find((p) => p.id === postId)
          if (post) post.metrics = metrics
        })
      },

      refreshMetrics: async (recordingId) => {
        const { publishedPosts } = get()
        const posts = recordingId
          ? publishedPosts.filter((p) => p.recordingId === recordingId)
          : publishedPosts

        if (posts.length === 0) return

        // Clear existing metrics so UI shows loading state (removes stale/mock data)
        set((state) => {
          state.isRefreshing = true
          for (const post of posts) {
            const statePost = state.publishedPosts.find((p) => p.id === post.id)
            if (statePost) statePost.metrics = null
          }
        })

        try {
          const results = await fetchAllMetricsForRecording(posts)
          set((state) => {
            for (const { postId, metrics } of results) {
              const post = state.publishedPosts.find((p) => p.id === postId)
              if (post) post.metrics = metrics
            }
            state.isRefreshing = false
            state.lastRefreshedAt = new Date().toISOString()
          })
        } catch {
          set((state) => {
            state.isRefreshing = false
          })
        }
      },

      getPostsForRecording: (recordingId) => {
        return get().publishedPosts.filter((p) => p.recordingId === recordingId)
      },

      getAggregatedMetrics: (recordingId) => {
        const posts = get().publishedPosts.filter(
          (p) => p.recordingId === recordingId && p.metrics
        )

        if (posts.length === 0) {
          return {
            totalViews: 0,
            totalLikes: 0,
            totalComments: 0,
            totalShares: 0,
            totalSaves: 0,
            avgEngagementRate: 0,
            platforms: [],
          }
        }

        let totalViews = 0
        let totalLikes = 0
        let totalComments = 0
        let totalShares = 0
        let totalSaves = 0
        let weightedEngagement = 0

        const platforms: AggregatedMetrics['platforms'] = []

        for (const post of posts) {
          const m = post.metrics!
          totalViews += m.views
          totalLikes += m.likes
          totalComments += m.comments
          totalShares += m.shares
          totalSaves += m.saves
          weightedEngagement += m.engagementRate * m.views

          platforms.push({ platform: post.platform, metrics: m })
        }

        return {
          totalViews,
          totalLikes,
          totalComments,
          totalShares,
          totalSaves,
          avgEngagementRate: totalViews > 0 ? weightedEngagement / totalViews : 0,
          platforms,
        }
      },
    })),
    {
      name: 'proanimate-analytics',
    }
  )
)
