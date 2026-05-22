/**
 * Character Identity Store -- persists named character bindings that link
 * saved characters to voices, emotions, and visual styles for series consistency.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { CharacterIdentity } from '@/types/characterIdentity'

interface CharacterIdentityState {
  identities: CharacterIdentity[]
  selectedIdentityId: string | null

  // Actions
  createIdentity: (
    name: string,
    savedCharacterId?: string | null,
    voiceId?: string | null,
    opts?: {
      saved3DCharacterId?: string | null
      description?: string
      defaultEmotion?: string
      visualStyle?: string
      thumbnailUrl?: string | null
    }
  ) => string
  updateIdentity: (id: string, updates: Partial<CharacterIdentity>) => void
  deleteIdentity: (id: string) => void
  selectIdentity: (id: string | null) => void
  getIdentityByName: (name: string) => CharacterIdentity | undefined
  getIdentityForSavedChar: (savedCharId: string) => CharacterIdentity | undefined
  syncToCloud: () => Promise<void>
}

export const useCharacterIdentityStore = create<CharacterIdentityState>()(
  persist(
    immer((set, get) => ({
      identities: [],
      selectedIdentityId: null,

      createIdentity: (name, savedCharacterId, voiceId, opts) => {
        const id = `ident_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        const now = new Date().toISOString()

        const identity: CharacterIdentity = {
          id,
          name,
          description: opts?.description || '',
          savedCharacterId: savedCharacterId || null,
          saved3DCharacterId: opts?.saved3DCharacterId || null,
          voiceId: voiceId || null,
          defaultEmotion: opts?.defaultEmotion || 'Neutral',
          visualStyle: opts?.visualStyle || '',
          thumbnailUrl: opts?.thumbnailUrl || null,
          createdAt: now,
          updatedAt: now,
        }

        set((state) => {
          state.identities.push(identity)
        })

        // Fire-and-forget cloud sync
        get().syncToCloud().catch(() => {})

        return id
      },

      updateIdentity: (id, updates) => {
        set((state) => {
          const identity = state.identities.find((i) => i.id === id)
          if (identity) {
            Object.assign(identity, updates, { updatedAt: new Date().toISOString() })
          }
        })
        get().syncToCloud().catch(() => {})
      },

      deleteIdentity: (id) => {
        set((state) => {
          state.identities = state.identities.filter((i) => i.id !== id)
          if (state.selectedIdentityId === id) {
            state.selectedIdentityId = null
          }
        })
        get().syncToCloud().catch(() => {})
      },

      selectIdentity: (id) => set((state) => { state.selectedIdentityId = id }),

      getIdentityByName: (name) => {
        return get().identities.find(
          (i) => i.name.toLowerCase() === name.toLowerCase()
        )
      },

      getIdentityForSavedChar: (savedCharId) => {
        return get().identities.find(
          (i) => i.savedCharacterId === savedCharId
        )
      },

      syncToCloud: async () => {
        // Best-effort sync to Supabase
        try {
          const { supabase } = await import('@/services/supabase')
          if (!supabase) return

          const { data: { user } } = await supabase.auth.getUser()
          if (!user) return

          const identities = get().identities

          // Upsert all identities
          for (const identity of identities) {
            await supabase
              .from('character_identities')
              .upsert({
                id: identity.id,
                user_id: user.id,
                name: identity.name,
                description: identity.description,
                saved_character_id: identity.savedCharacterId,
                saved_3d_character_id: identity.saved3DCharacterId,
                voice_id: identity.voiceId,
                default_emotion: identity.defaultEmotion,
                visual_style: identity.visualStyle,
                thumbnail_url: identity.thumbnailUrl,
                created_at: identity.createdAt,
                updated_at: identity.updatedAt,
              }, { onConflict: 'id' })
          }
        } catch {
          // Silently ignore cloud sync failures -- local persist is the source of truth
        }
      },
    })),
    {
      name: 'character-identities',
      partialize: (state) => ({
        identities: state.identities,
        selectedIdentityId: state.selectedIdentityId,
      }),
    }
  )
)
