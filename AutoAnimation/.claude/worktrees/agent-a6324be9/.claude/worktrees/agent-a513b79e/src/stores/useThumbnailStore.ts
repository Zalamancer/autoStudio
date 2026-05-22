/**
 * Thumbnail Store — manages generated thumbnail variants.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ThumbnailVariant } from '@/services/thumbnailGenerator'

interface ThumbnailState {
  variants: ThumbnailVariant[]
  selectedVariantId: string | null
  isGenerating: boolean

  setVariants: (variants: ThumbnailVariant[]) => void
  selectVariant: (id: string) => void
  setIsGenerating: (v: boolean) => void
  getSelectedVariant: () => ThumbnailVariant | null
  reset: () => void
}

export const useThumbnailStore = create<ThumbnailState>()(
  immer((set, get) => ({
    variants: [],
    selectedVariantId: null,
    isGenerating: false,

    setVariants: (variants) =>
      set((state) => {
        state.variants = variants
        // Auto-select the highest-scored variant
        state.selectedVariantId = variants.length > 0 ? variants[0].id : null
      }),

    selectVariant: (id) =>
      set((state) => {
        state.selectedVariantId = id
      }),

    setIsGenerating: (v) =>
      set((state) => {
        state.isGenerating = v
      }),

    getSelectedVariant: () => {
      const { variants, selectedVariantId } = get()
      return variants.find((v) => v.id === selectedVariantId) ?? null
    },

    reset: () =>
      set((state) => {
        state.variants = []
        state.selectedVariantId = null
        state.isGenerating = false
      }),
  })),
)
