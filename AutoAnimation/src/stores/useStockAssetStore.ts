/**
 * Stock Asset Store — manages AI-generated stock assets (raster + vector).
 *
 * Handles generation progress, browsing, and placing assets on canvas.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  StockAsset,
  StockAssetCategory,
  StockAssetStyle,
  StockAssetProgress,
  StockAssetGenerateRequest,
} from '@/types/stockAssets'
import {
  generateStockAssets,
  browseStockAssets,
  searchStockAssets,
  deleteStockAsset,
} from '@/services/stockAssetService'

interface StockAssetState {
  /** Browsed/searched assets from marketplace */
  assets: StockAsset[]
  /** Whether a generation is in progress */
  generating: boolean
  /** Current generation progress */
  progress: StockAssetProgress | null
  /** Error from last operation */
  error: string | null
  /** Whether assets have been loaded */
  loaded: boolean
  /** Active filters */
  filters: {
    category?: StockAssetCategory
    style?: StockAssetStyle
    search?: string
  }

  // ── Actions ──

  /** Generate a batch of stock assets */
  generate: (request: StockAssetGenerateRequest) => Promise<StockAsset[]>

  /** Browse stock assets with optional filters */
  browse: (opts?: {
    category?: StockAssetCategory
    style?: StockAssetStyle
    limit?: number
    offset?: number
  }) => Promise<void>

  /** Search stock assets by text */
  search: (query: string) => Promise<StockAsset[]>

  /** Delete a stock asset */
  remove: (id: string) => Promise<void>

  /** Set active filters */
  setFilters: (filters: Partial<StockAssetState['filters']>) => void

  /** Clear error */
  clearError: () => void
}

export const useStockAssetStore = create<StockAssetState>()(
  immer((set) => ({
    assets: [],
    generating: false,
    progress: null,
    error: null,
    loaded: false,
    filters: {},

    generate: async (request) => {
      set((s) => {
        s.generating = true
        s.error = null
        s.progress = {
          step: 'generating',
          current: 0,
          total: request.items.length,
          message: `Generating ${request.items.length} assets...`,
        }
      })

      try {
        const response = await generateStockAssets(request)

        set((s) => {
          s.generating = false
          s.progress = null
          // Prepend new assets to the list
          s.assets = [...response.assets, ...s.assets]
        })

        return response.assets
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Generation failed'
        set((s) => {
          s.generating = false
          s.progress = null
          s.error = message
        })
        throw err
      }
    },

    browse: async (opts) => {
      try {
        const result = await browseStockAssets(opts)
        set((s) => {
          s.assets = result.assets
          s.loaded = true
          s.error = null
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load assets'
        set((s) => {
          s.error = message
        })
      }
    },

    search: async (query) => {
      try {
        const result = await searchStockAssets(query)
        set((s) => {
          s.assets = result.assets
          s.error = null
        })
        return result.assets
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed'
        set((s) => {
          s.error = message
        })
        return []
      }
    },

    remove: async (id) => {
      try {
        await deleteStockAsset(id)
        set((s) => {
          s.assets = s.assets.filter((a) => a.id !== id)
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Delete failed'
        set((s) => {
          s.error = message
        })
      }
    },

    setFilters: (filters) => {
      set((s) => {
        s.filters = { ...s.filters, ...filters }
      })
    },

    clearError: () => {
      set((s) => {
        s.error = null
      })
    },
  })),
)
