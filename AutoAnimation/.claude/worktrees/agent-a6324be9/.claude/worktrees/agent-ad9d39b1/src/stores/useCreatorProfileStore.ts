import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { CreatorProfile } from '@/types/promotions'
import {
  fetchMyProfile,
  updateMyProfile,
  suggestTags,
} from '@/services/creatorProfileService'

interface CreatorProfileState {
  profile: CreatorProfile | null
  isLoading: boolean
  isSuggestingTags: boolean
  suggestedTags: string[]

  fetchProfile: () => Promise<void>
  updateProfile: (updates: {
    opted_in?: boolean
    display_name?: string
    bio?: string
    niche_tags?: string[]
  }) => Promise<void>
  toggleOptIn: () => Promise<void>
  suggestTagsAction: () => Promise<void>
  clearSuggestedTags: () => void
}

export const useCreatorProfileStore = create<CreatorProfileState>()(
  immer((set, get) => ({
    profile: null,
    isLoading: false,
    isSuggestingTags: false,
    suggestedTags: [],

    fetchProfile: async () => {
      set((s) => { s.isLoading = true })
      try {
        const profile = await fetchMyProfile()
        set((s) => {
          s.profile = profile
          s.isLoading = false
        })
      } catch (err) {
        console.warn('[CreatorProfile] Failed to fetch profile:', err)
        set((s) => { s.isLoading = false })
      }
    },

    updateProfile: async (updates) => {
      try {
        const profile = await updateMyProfile(updates)
        set((s) => { s.profile = profile })
      } catch (err) {
        console.error('[CreatorProfile] Update failed:', err)
      }
    },

    toggleOptIn: async () => {
      const current = get().profile
      const newOptIn = !(current?.opted_in ?? false)
      try {
        const profile = await updateMyProfile({ opted_in: newOptIn })
        set((s) => { s.profile = profile })
      } catch (err) {
        console.error('[CreatorProfile] Toggle opt-in failed:', err)
      }
    },

    suggestTagsAction: async () => {
      set((s) => { s.isSuggestingTags = true })
      try {
        const tags = await suggestTags()
        set((s) => {
          s.suggestedTags = tags
          s.isSuggestingTags = false
        })
      } catch (err) {
        console.warn('[CreatorProfile] Tag suggestion failed:', err)
        set((s) => { s.isSuggestingTags = false })
      }
    },

    clearSuggestedTags: () => set((s) => { s.suggestedTags = [] }),
  }))
)
