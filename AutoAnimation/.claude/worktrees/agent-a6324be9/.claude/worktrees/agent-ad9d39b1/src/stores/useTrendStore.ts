/**
 * Trend Store — Trending topics state and refresh management.
 *
 * Caches results per niche for 1 hour. If the cache is still fresh
 * and the niche has not changed, `refresh()` is a no-op and returns
 * the previously fetched trends instantly.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { fetchTrends, type TrendItem } from '@/services/trendSpotter'
import { toast } from '@/stores/useToastStore'

/** Cache duration: 1 hour in milliseconds */
const CACHE_TTL_MS = 60 * 60 * 1000

interface NicheCache {
  trends: TrendItem[]
  fetchedAt: number
}

interface TrendState {
  trends: TrendItem[]
  niche: string
  isLoading: boolean
  error: string | null
  lastFetchedAt: number | null
  /** Per-niche cache so switching niches does not discard previous results */
  _nicheCache: Record<string, NicheCache>

  // Actions
  setNiche: (niche: string) => void
  refresh: (forceRefresh?: boolean) => Promise<void>
  clearTrends: () => void
}

export const useTrendStore = create<TrendState>()(
  immer((set, get) => ({
    trends: [],
    niche: 'general',
    isLoading: false,
    error: null,
    lastFetchedAt: null,
    _nicheCache: {},

    setNiche: (niche: string) =>
      set((s) => {
        s.niche = niche
      }),

    refresh: async (forceRefresh = false) => {
      const { niche, _nicheCache } = get()

      // Check per-niche cache before making an API call
      if (!forceRefresh) {
        const cached = _nicheCache[niche]
        if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
          set((s) => {
            s.trends = cached.trends
            s.lastFetchedAt = cached.fetchedAt
          })
          toast.success(`${cached.trends.length} cached trends (refresh in ${Math.ceil((CACHE_TTL_MS - (Date.now() - cached.fetchedAt)) / 60000)}m)`)
          return
        }
      }

      set((s) => {
        s.isLoading = true
        s.error = null
      })

      try {
        const results = await fetchTrends(niche)
        set((s) => {
          s.trends = results.trends
          s.lastFetchedAt = results.fetchedAt
          s.isLoading = false
          // Store in per-niche cache
          s._nicheCache[niche] = {
            trends: results.trends,
            fetchedAt: results.fetchedAt,
          }
        })
        toast.success(`Found ${results.trends.length} trending topics`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to fetch trends'
        set((s) => {
          s.isLoading = false
          s.error = msg
        })
        toast.error(msg)
      }
    },

    clearTrends: () =>
      set((s) => {
        s.trends = []
        s.lastFetchedAt = null
        s._nicheCache = {}
      }),
  })),
)
