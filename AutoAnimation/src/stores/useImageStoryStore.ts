import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  ImageStoryPlan,
  ImageStoryStyle,
  FreepikAsset,
} from '@/types/imageStory'

interface ImageStoryState {
  plan: ImageStoryPlan | null
  assets: Record<string, FreepikAsset[]>
  selectedAssets: Record<string, string>
  style: ImageStoryStyle
  isGenerating: boolean
  currentStep: string

  setPlan: (plan: ImageStoryPlan) => void
  setAssets: (searchTerm: string, results: FreepikAsset[]) => void
  selectAsset: (nounId: string, assetUrl: string) => void
  swapAsset: (nounId: string, newAssetUrl: string) => void
  setStyle: (style: ImageStoryStyle) => void
  setGenerating: (isGenerating: boolean, step?: string) => void
  reset: () => void
}

const initialState = {
  plan: null as ImageStoryPlan | null,
  assets: {} as Record<string, FreepikAsset[]>,
  selectedAssets: {} as Record<string, string>,
  style: 'Cartoon' as ImageStoryStyle,
  isGenerating: false,
  currentStep: '',
}

export const useImageStoryStore = create<ImageStoryState>()(
  immer((set) => ({
    ...initialState,

    setPlan: (plan) =>
      set((state) => {
        state.plan = plan
      }),

    setAssets: (searchTerm, results) =>
      set((state) => {
        state.assets[searchTerm] = results
      }),

    selectAsset: (nounId, assetUrl) =>
      set((state) => {
        state.selectedAssets[nounId] = assetUrl
      }),

    swapAsset: (nounId, newAssetUrl) =>
      set((state) => {
        state.selectedAssets[nounId] = newAssetUrl
      }),

    setStyle: (style) =>
      set((state) => {
        state.style = style
      }),

    setGenerating: (isGenerating, step = '') =>
      set((state) => {
        state.isGenerating = isGenerating
        state.currentStep = step
      }),

    reset: () => set(initialState),
  })),
)
