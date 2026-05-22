/**
 * Tracks which marketplace listing IDs have been used in the current session/project.
 * Syncs to the server via POST /api/marketplace/usage on demand.
 */

import { create } from 'zustand'
import { recordUsage } from '@/services/marketplaceService'

interface MarketplaceUsageState {
  /** Set of marketplace listing IDs used in the current clip/project */
  usedListingIds: Set<string>

  /** Record a single marketplace listing as used */
  recordUsage: (listingId: string) => void

  /** Record multiple marketplace listings as used */
  recordUsageBatch: (ids: string[]) => void

  /** Clear all tracked usage (e.g. on project reset) */
  clearUsage: () => void

  /** Sync recorded usage to the server for a given project */
  syncToServer: (projectId: string) => Promise<void>
}

export const useMarketplaceUsageStore = create<MarketplaceUsageState>((set, get) => ({
  usedListingIds: new Set(),

  recordUsage: (listingId) =>
    set((state) => {
      if (state.usedListingIds.has(listingId)) return state
      const next = new Set(state.usedListingIds)
      next.add(listingId)
      return { usedListingIds: next }
    }),

  recordUsageBatch: (ids) =>
    set((state) => {
      const next = new Set(state.usedListingIds)
      let changed = false
      for (const id of ids) {
        if (!next.has(id)) {
          next.add(id)
          changed = true
        }
      }
      return changed ? { usedListingIds: next } : state
    }),

  clearUsage: () => set({ usedListingIds: new Set() }),

  syncToServer: async (projectId) => {
    const { usedListingIds } = get()
    if (usedListingIds.size === 0) return

    try {
      await recordUsage(projectId, Array.from(usedListingIds))
      console.log(`[MarketplaceUsage] Synced ${usedListingIds.size} listing(s) to project ${projectId}`)
    } catch (err) {
      console.warn('[MarketplaceUsage] Failed to sync usage to server:', err)
    }
  },
}))
