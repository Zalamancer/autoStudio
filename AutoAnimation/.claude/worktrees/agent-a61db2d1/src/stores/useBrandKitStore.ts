import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { BrandKit } from '@/types/brandKit'
import { logger } from '@/utils/logger'
import { safeLocalStorageSet } from '@/utils/storage'
import {
  fetchUserBrandKits,
  upsertBrandKit as apiUpsertBrandKit,
  deleteBrandKit as apiDeleteBrandKit,
  uploadBrandAsset,
} from '@/services/brandKitService'
import { useAuthStore } from '@/stores/useAuthStore'

interface BrandKitState {
  brandKits: BrandKit[]
  activeBrandKitId: string | null
  isLoading: boolean

  fetchBrandKits: () => Promise<void>
  createBrandKit: (kit: Omit<BrandKit, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateBrandKit: (id: string, updates: Partial<BrandKit>) => void
  deleteBrandKit: (id: string) => void
  setActiveBrandKit: (id: string | null) => void
  getActiveBrandKit: () => BrandKit | null
  saveBrandKit: (kit: BrandKit) => Promise<void>
  uploadLogo: (kitId: string, file: File) => Promise<string>
  uploadWatermark: (kitId: string, file: File) => Promise<string>
  applyToOrchestrator: (settings: Record<string, unknown>) => Record<string, unknown>
  createFromBrandDirector: (profile: {
    businessName: string
    industry: string
    tone: string
    primaryColors: string[]
    tagline?: string
  }) => string // returns new kit id
}

export const useBrandKitStore = create<BrandKitState>()(
  immer((set, get) => ({
    brandKits: [],
    activeBrandKitId: null,
    isLoading: false,

    fetchBrandKits: async () => {
      set((state) => {
        state.isLoading = true
      })
      try {
        // Try Supabase first
        const user = useAuthStore.getState().user
        if (user?.id) {
          const kits = await fetchUserBrandKits(user.id)
          if (kits.length > 0) {
            set((state) => {
              state.brandKits = kits
              state.isLoading = false
            })
            // Update localStorage cache
            safeLocalStorageSet('proanimate-brand-kits', JSON.stringify(kits))
            const activeId = localStorage.getItem('proanimate-active-brand-kit')
            if (activeId) {
              set((state) => {
                state.activeBrandKitId = activeId
              })
            }
            return
          }
        }

        // Fallback to localStorage
        const stored = localStorage.getItem('proanimate-brand-kits')
        if (stored) {
          const kits = JSON.parse(stored) as BrandKit[]
          set((state) => {
            state.brandKits = kits
            state.isLoading = false
          })
        } else {
          set((state) => {
            state.isLoading = false
          })
        }
        const activeId = localStorage.getItem('proanimate-active-brand-kit')
        if (activeId) {
          set((state) => {
            state.activeBrandKitId = activeId
          })
        }
      } catch (err) {
        logger.error('[BrandKit] Failed to load:', err)
        set((state) => {
          state.isLoading = false
        })
      }
    },

    createBrandKit: (kit) => {
      const now = new Date().toISOString()
      const user = useAuthStore.getState().user
      const newKit: BrandKit = {
        ...kit,
        id: `bk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: user?.id,
        createdAt: now,
        updatedAt: now,
      }
      set((state) => {
        state.brandKits.push(newKit)
      })
      // Persist to both localStorage and Supabase
      const kits = get().brandKits
      safeLocalStorageSet('proanimate-brand-kits', JSON.stringify(kits))
      apiUpsertBrandKit(newKit).catch((err) => logger.error('[BrandKit] Supabase save failed:', err))
    },

    updateBrandKit: (id, updates) => {
      set((state) => {
        const kit = state.brandKits.find((k) => k.id === id)
        if (kit) {
          Object.assign(kit, updates, { updatedAt: new Date().toISOString() })
        }
      })
      const kits = get().brandKits
      safeLocalStorageSet('proanimate-brand-kits', JSON.stringify(kits))
      // Async sync to Supabase
      const kit = kits.find((k) => k.id === id)
      if (kit) {
        apiUpsertBrandKit(kit).catch((err) => logger.error('[BrandKit] Supabase update failed:', err))
      }
    },

    deleteBrandKit: (id) => {
      set((state) => {
        state.brandKits = state.brandKits.filter((k) => k.id !== id)
        if (state.activeBrandKitId === id) {
          state.activeBrandKitId = null
          localStorage.removeItem('proanimate-active-brand-kit')
        }
      })
      safeLocalStorageSet('proanimate-brand-kits', JSON.stringify(get().brandKits))
      apiDeleteBrandKit(id).catch((err) => logger.error('[BrandKit] Supabase delete failed:', err))
    },

    setActiveBrandKit: (id) => {
      set((state) => {
        state.activeBrandKitId = id
      })
      if (id) {
        safeLocalStorageSet('proanimate-active-brand-kit', id)
      } else {
        localStorage.removeItem('proanimate-active-brand-kit')
      }
    },

    getActiveBrandKit: () => {
      const { brandKits, activeBrandKitId } = get()
      if (!activeBrandKitId) return null
      return brandKits.find((k) => k.id === activeBrandKitId) ?? null
    },

    saveBrandKit: async (kit) => {
      try {
        await apiUpsertBrandKit(kit)
        safeLocalStorageSet('proanimate-brand-kits', JSON.stringify(get().brandKits))
      } catch (err) {
        logger.error('[BrandKit] Save failed:', err)
      }
    },

    uploadLogo: async (kitId, file) => {
      const url = await uploadBrandAsset(file, kitId, 'logo')
      get().updateBrandKit(kitId, { logoUrl: url })
      return url
    },

    uploadWatermark: async (kitId, file) => {
      const url = await uploadBrandAsset(file, kitId, 'watermark')
      get().updateBrandKit(kitId, { watermarkUrl: url })
      return url
    },

    applyToOrchestrator: (settings) => {
      const kit = get().getActiveBrandKit()
      if (!kit) return settings

      return {
        ...settings,
        brandKit: {
          primaryColor: kit.primaryColor,
          secondaryColor: kit.secondaryColor,
          accentColor: kit.accentColor,
          bgColor: kit.bgColor,
          headingFont: kit.headingFont,
          bodyFont: kit.bodyFont,
          tone: kit.tone,
          defaultVoiceId: kit.defaultVoiceId,
          musicMood: kit.musicMood,
        },
      }
    },

    createFromBrandDirector: (profile) => {
      const now = new Date().toISOString()
      const user = useAuthStore.getState().user
      const id = `bk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const newKit: BrandKit = {
        id,
        userId: user?.id,
        name: profile.businessName,
        primaryColor: profile.primaryColors[0] || '#6366f1',
        secondaryColor: profile.primaryColors[1] || '#8b5cf6',
        accentColor: profile.primaryColors[2] || '#a855f7',
        headingFont: 'Montserrat',
        bodyFont: 'Inter',
        tone: profile.tone || 'professional',
        createdAt: now,
        updatedAt: now,
      }
      set((state) => {
        state.brandKits.push(newKit)
        state.activeBrandKitId = id
      })
      safeLocalStorageSet('proanimate-brand-kits', JSON.stringify(get().brandKits))
      safeLocalStorageSet('proanimate-active-brand-kit', id)
      apiUpsertBrandKit(newKit).catch((err) => logger.error('[BrandKit] Supabase save failed:', err))
      return id
    },
  }))
)
