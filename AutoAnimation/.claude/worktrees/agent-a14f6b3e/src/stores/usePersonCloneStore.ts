/**
 * AI Person Clone Store
 *
 * Manages state for analyzing photos/videos to create character clones
 * that preserve a person's likeness, gesture patterns, and movement style.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  PersonCloneProfile,
  PersonCloneProgress,
  PersonCloneStatus,
  PersonCloneStyle,
} from '@/types/personClone'

interface PersonCloneState {
  /** Saved clone profiles */
  profiles: PersonCloneProfile[]
  /** Currently active/editing profile ID */
  activeProfileId: string | null
  /** Pipeline status */
  status: PersonCloneStatus
  /** Pipeline progress */
  progress: PersonCloneProgress
  /** Source photo data URL (before profile creation) */
  sourcePhoto: string | null
  /** Selected art style */
  artStyle: PersonCloneStyle
  /** Likeness strength 0-100 */
  likenessStrength: number
  /** Error message */
  error: string | null

  // Actions
  addProfile: (profile: PersonCloneProfile) => void
  removeProfile: (id: string) => void
  updateProfile: (id: string, partial: Partial<PersonCloneProfile>) => void
  setActiveProfile: (id: string | null) => void
  getActiveProfile: () => PersonCloneProfile | null
  setStatus: (status: PersonCloneStatus) => void
  setProgress: (progress: PersonCloneProgress) => void
  setSourcePhoto: (photo: string | null) => void
  setArtStyle: (style: PersonCloneStyle) => void
  setLikenessStrength: (strength: number) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const usePersonCloneStore = create<PersonCloneState>()(
  immer((set, get) => ({
    profiles: [],
    activeProfileId: null,
    status: 'idle',
    progress: {
      status: 'idle',
      message: '',
      percentage: 0,
    },
    sourcePhoto: null,
    artStyle: 'cartoon',
    likenessStrength: 75,
    error: null,

    addProfile: (profile) => {
      set((s) => {
        s.profiles.push(profile)
        s.activeProfileId = profile.id
      })
    },

    removeProfile: (id) => {
      set((s) => {
        s.profiles = s.profiles.filter((p) => p.id !== id)
        if (s.activeProfileId === id) {
          s.activeProfileId = null
        }
      })
    },

    updateProfile: (id, partial) => {
      set((s) => {
        const profile = s.profiles.find((p) => p.id === id)
        if (profile) {
          Object.assign(profile, partial)
        }
      })
    },

    setActiveProfile: (id) => {
      set((s) => {
        s.activeProfileId = id
      })
    },

    getActiveProfile: () => {
      const state = get()
      return state.profiles.find((p) => p.id === state.activeProfileId) ?? null
    },

    setStatus: (status) => {
      set((s) => {
        s.status = status
      })
    },

    setProgress: (progress) => {
      set((s) => {
        s.progress = progress
        s.status = progress.status
        if (progress.error) {
          s.error = progress.error
        }
      })
    },

    setSourcePhoto: (photo) => {
      set((s) => {
        s.sourcePhoto = photo
      })
    },

    setArtStyle: (style) => {
      set((s) => {
        s.artStyle = style
      })
    },

    setLikenessStrength: (strength) => {
      set((s) => {
        s.likenessStrength = Math.max(0, Math.min(100, strength))
      })
    },

    setError: (error) => {
      set((s) => {
        s.error = error
        if (error) s.status = 'error'
      })
    },

    reset: () => {
      set((s) => {
        s.activeProfileId = null
        s.status = 'idle'
        s.progress = { status: 'idle', message: '', percentage: 0 }
        s.sourcePhoto = null
        s.error = null
      })
    },
  })),
)
