import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { MixedMediaPreset, MixedMediaCategory } from '@/types/faceSwap'

interface MixedMediaState {
  activePreset: MixedMediaPreset | null
  categoryFilter: MixedMediaCategory | null
  customPresets: MixedMediaPreset[]
  overlayOpacity: number
  isEnabled: boolean
  setActivePreset: (preset: MixedMediaPreset | null) => void
  setCategoryFilter: (category: MixedMediaCategory | null) => void
  addCustomPreset: (preset: MixedMediaPreset) => void
  removeCustomPreset: (id: string) => void
  setOverlayOpacity: (opacity: number) => void
  setEnabled: (enabled: boolean) => void
}

export const useMixedMediaStore = create<MixedMediaState>()(
  immer((set) => ({
    activePreset: null,
    categoryFilter: null,
    customPresets: [],
    overlayOpacity: 1,
    isEnabled: true,

    setActivePreset: (preset) => set((s) => { s.activePreset = preset }),

    setCategoryFilter: (category) => set((s) => { s.categoryFilter = category }),

    addCustomPreset: (preset) => set((s) => { s.customPresets.push(preset) }),

    removeCustomPreset: (id) => set((s) => {
      s.customPresets = s.customPresets.filter((p) => p.id !== id)
    }),

    setOverlayOpacity: (opacity) => set((s) => { s.overlayOpacity = opacity }),

    setEnabled: (enabled) => set((s) => { s.isEnabled = enabled }),
  }))
)
