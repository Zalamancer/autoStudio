import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist, createJSONStorage } from 'zustand/middleware'
import { getMediaBlob, deleteMediaBlob } from '@/services/mediaDB'
import type { MarketplaceListing } from '@/types/marketplace'
import { fetchListings, createListing, fetchMyListings, fetchEarnings } from '@/services/marketplaceService'
import type { MarketplaceListingCategory, CreatorEarnings } from '@/types/marketplace'

/** Set of built-in template IDs — populated by seedBuiltinTemplates() */
export const builtinTemplateIds = new Set<string>()

export type MarketplaceCategory = 'all' | 'characters' | 'animations' | 'audio' | 'text' | 'transitions' | 'ai-animations' | 'html-templates' | 'captions' | 'collages' | 'memes' | 'projects' | '3d-characters' | '3d-animations'

export interface MarketplaceItem {
  id: string
  title: string
  description: string
  category: MarketplaceCategory
  // AI animation specific fields
  videoUrl?: string
  prompt?: string
  durationSeconds?: number
  fps?: number
  width?: number
  height?: number
  // HTML template fields
  htmlContent?: string
  thumbnailUrl?: string
  // Project snapshot fields
  projectSnapshot?: string
  // 3D character/animation fields
  glbBlobId?: string
  skeletonType?: string
  polyCount?: number
  animationDuration?: number
  // Server-backed marketplace fields
  listingId?: string
  creatorId?: string
  creatorName?: string
  useCount?: number
  // Publish state: undefined/false = dev-only, true = visible in user-facing library
  published?: boolean
  // Metadata
  createdAt: number
}

interface MarketplaceState {
  items: MarketplaceItem[]
  activeCategory: MarketplaceCategory
  searchQuery: string

  // Dev toggle — shows all templates including unpublished built-ins
  showDevTemplates: boolean

  // Permanently deleted built-in template IDs
  deletedBuiltinIds: string[]

  // Server-backed community listings
  serverListings: MarketplaceListing[]
  isLoadingServer: boolean
  myListings: MarketplaceListing[]
  earnings: CreatorEarnings | null

  addItem: (item: MarketplaceItem) => void
  removeItem: (id: string) => void
  setActiveCategory: (category: MarketplaceCategory) => void
  setSearchQuery: (query: string) => void
  setShowDevTemplates: (v: boolean) => void
  togglePublished: (id: string) => void
  deleteBuiltinForever: (id: string) => void

  // Server actions
  fetchServerListings: (category?: MarketplaceListingCategory | 'all', search?: string) => Promise<void>
  publishToMarketplace: (item: MarketplaceItem, assetUrl: string, thumbnailUrl?: string) => Promise<MarketplaceListing | null>
  fetchMyListings: () => Promise<void>
  fetchEarnings: () => Promise<void>
  deleteServerListing: (id: string) => Promise<void>
}

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    immer((set) => ({
      items: [],
      activeCategory: 'all',
      searchQuery: '',
      showDevTemplates: false,
      deletedBuiltinIds: [],
      serverListings: [],
      isLoadingServer: false,
      myListings: [],
      earnings: null,

      addItem: (item) =>
        set((state) => {
          const exists = state.items.some((i) => i.id === item.id)
          if (!exists) {
            state.items.unshift(item)
          }
        }),

      removeItem: (id) =>
        set((state) => {
          state.items = state.items.filter((i) => i.id !== id)
          // Also clean up IndexedDB blob
          deleteMediaBlob(id).catch(() => {})
        }),

      setActiveCategory: (category) =>
        set((state) => {
          state.activeCategory = category
        }),

      setSearchQuery: (query) =>
        set((state) => {
          state.searchQuery = query
        }),

      setShowDevTemplates: (v) =>
        set((state) => {
          state.showDevTemplates = v
        }),

      togglePublished: (id) =>
        set((state) => {
          const item = state.items.find((i) => i.id === id)
          if (item) {
            item.published = !item.published
          }
        }),

      deleteBuiltinForever: (id) =>
        set((state) => {
          if (!state.deletedBuiltinIds.includes(id)) {
            state.deletedBuiltinIds.push(id)
          }
          state.items = state.items.filter((i) => i.id !== id)
        }),

      fetchServerListings: async (category, search) => {
        set((state) => { state.isLoadingServer = true })
        try {
          const { listings } = await fetchListings({ category: category as MarketplaceListingCategory, search })
          set((state) => {
            state.serverListings = listings as any
            state.isLoadingServer = false
          })
        } catch (err) {
          console.warn('[Marketplace] Failed to fetch server listings:', err)
          set((state) => { state.isLoadingServer = false })
        }
      },

      publishToMarketplace: async (item, assetUrl, thumbnailUrl) => {
        try {
          const { listing } = await createListing({
            title: item.title,
            description: item.description,
            category: item.category === 'all' ? 'characters' : item.category as MarketplaceListingCategory,
            asset_url: assetUrl,
            thumbnail_url: thumbnailUrl,
            metadata: {
              prompt: item.prompt,
              durationSeconds: item.durationSeconds,
              fps: item.fps,
              width: item.width,
              height: item.height,
            },
          })
          // Update local item with server listing ID
          set((state) => {
            const idx = state.items.findIndex((i) => i.id === item.id)
            if (idx !== -1) {
              state.items[idx].listingId = listing.id
              state.items[idx].creatorId = listing.creator_id
            }
          })
          return listing as any
        } catch (err) {
          console.error('[Marketplace] Publish failed:', err)
          return null
        }
      },

      fetchMyListings: async () => {
        try {
          const { listings } = await fetchMyListings()
          set((state) => { state.myListings = listings as any })
        } catch (err) {
          console.warn('[Marketplace] Failed to fetch my listings:', err)
        }
      },

      fetchEarnings: async () => {
        try {
          const earnings = await fetchEarnings()
          set((state) => { state.earnings = earnings as any })
        } catch (err) {
          console.warn('[Marketplace] Failed to fetch earnings:', err)
        }
      },

      deleteServerListing: async (id) => {
        try {
          const { deleteListing } = await import('@/services/marketplaceService')
          await deleteListing(id)
          set((state) => {
            state.myListings = state.myListings.filter((l) => l.id !== id)
            state.serverListings = state.serverListings.filter((l) => l.id !== id)
          })
        } catch (err) {
          console.error('[Marketplace] Delete server listing failed:', err)
        }
      },
    })),
    {
      name: 'proanimate-marketplace',
      storage: createJSONStorage(() => ({
        getItem: (name: string) => localStorage.getItem(name),
        setItem: (name: string, value: string) => {
          try {
            localStorage.setItem(name, value)
          } catch {
            // QuotaExceededError — silently skip this write.
            // Data will be re-seeded from Vite imports on next load.
            console.warn('[marketplace] localStorage quota exceeded, skipping persist')
          }
        },
        removeItem: (name: string) => localStorage.removeItem(name),
      })),
      partialize: (state) => ({
        // Strip htmlContent from built-in templates to avoid exceeding
        // the ~5 MB localStorage quota.  Built-in content is rehydrated
        // on startup from the Vite raw imports.
        // Exclude server-backed state — it's fetched fresh each session.
        items: state.items.map((item) =>
          builtinTemplateIds.has(item.id)
            ? { ...item, htmlContent: undefined }
            : item
        ),
        deletedBuiltinIds: state.deletedBuiltinIds,
      }),
      onRehydrateStorage: () => {
        // Called after state is rehydrated from localStorage.
        // Blob URLs don't survive page reload, so regenerate them from IndexedDB.
        return (state) => {
          if (!state) return
          hydrateVideoUrls(state)
        }
      },
    }
  )
)

/**
 * After page reload, blob URLs stored in localStorage are dead.
 * This regenerates them from the persisted IndexedDB blobs.
 */
async function hydrateVideoUrls(state: MarketplaceState) {
  const items = state.items
  const aiItems = items.filter((item) => item.category === 'ai-animations' && item.videoUrl)
  // HTML templates and projects don't need blob rehydration — they store data URLs or inline JSON

  for (const item of aiItems) {
    try {
      const blob = await getMediaBlob(item.id)
      if (blob) {
        const blobUrl = URL.createObjectURL(blob)
        // Update the item's videoUrl with a fresh blob URL
        useMarketplaceStore.setState((s) => ({
          items: s.items.map((i) =>
            i.id === item.id ? { ...i, videoUrl: blobUrl } : i
          ),
        }))
      } else {
        // Blob missing from IndexedDB — clear the dead URL
        useMarketplaceStore.setState((s) => ({
          items: s.items.map((i) =>
            i.id === item.id ? { ...i, videoUrl: undefined } : i
          ),
        }))
      }
    } catch {
      // Silently handle errors — the thumbnail will just show placeholder
    }
  }
}
