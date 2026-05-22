/**
 * State management for saved 3D character templates (library).
 * Parallel to useSavedCharactersStore but for 3D GLTF/GLB models.
 *
 * GLB blobs are stored in IndexedDB (character3dDB.ts).
 * This store holds metadata + thumbnail data URLs.
 * Blob URLs are regenerated on page reload from IndexedDB.
 * Cloud sync via Supabase Storage for cross-device persistence.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Saved3DCharacter } from '@/types/character3d'
import { get3DBlob, delete3DBlob, blobToUrl, save3DBlob } from '@/services/character3dDB'
import {
  fetchCloud3DCharacters,
  download3DCharacterMeta,
  download3DCharacterGlb,
  upload3DCharacterToCloud,
  deleteCloud3DCharacter,
  type Cloud3DCharacterMeta,
} from '@/services/characters3dCloud'
import { publishCharacterToMarketplace } from '@/services/characterMarketplace'

interface Saved3DCharactersState {
  characters: Saved3DCharacter[]
  selectedCharacterId: string | null
  /** Runtime blob URL cache (not persisted) */
  blobUrls: Record<string, string>
  isLoading: boolean
  _cloudSynced: boolean

  // Actions
  addCharacter: (character: Saved3DCharacter) => void
  removeCharacter: (id: string) => void
  updateCharacter: (id: string, updates: Partial<Saved3DCharacter>) => void
  selectCharacter: (id: string | null) => void
  getSelectedCharacter: () => Saved3DCharacter | null

  // Blob URL management
  setBlobUrl: (glbBlobId: string, url: string) => void
  getBlobUrl: (glbBlobId: string) => string | null
  hydrateAllBlobUrls: () => Promise<void>

  // Cloud sync
  syncFromCloud: () => Promise<void>
  pushToCloud: (id: string) => Promise<void>
}

export const useSaved3DCharactersStore = create<Saved3DCharactersState>()(
  persist(
    (set, get) => ({
      characters: [],
      selectedCharacterId: null,
      blobUrls: {},
      isLoading: false,
      _cloudSynced: false,

      addCharacter: (character) => {
        set((state) => ({
          characters: [...state.characters, character],
        }))

        // Push to cloud in background
        get().pushToCloud(character.id).catch((err) => {
          console.warn(`[3DChars] Cloud push failed for ${character.id}:`, err)
        })
      },

      removeCharacter: (id) => {
        const state = get()
        const char = state.characters.find((c) => c.id === id)
        if (char) {
          // Clean up IndexedDB blob
          delete3DBlob(char.glbBlobId).catch(() => {})
          // Revoke blob URL
          const blobUrl = state.blobUrls[char.glbBlobId]
          if (blobUrl) {
            URL.revokeObjectURL(blobUrl)
          }
        }

        // Delete from cloud
        deleteCloud3DCharacter(id).catch((err) => {
          console.warn(`[3DChars] Cloud delete failed for ${id}:`, err)
        })

        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
          selectedCharacterId:
            state.selectedCharacterId === id ? null : state.selectedCharacterId,
          blobUrls: char
            ? Object.fromEntries(
                Object.entries(state.blobUrls).filter(([k]) => k !== char.glbBlobId)
              )
            : state.blobUrls,
        }))
      },

      updateCharacter: (id, updates) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),

      selectCharacter: (id) =>
        set(() => ({
          selectedCharacterId: id,
        })),

      getSelectedCharacter: () => {
        const state = get()
        return (
          state.characters.find((c) => c.id === state.selectedCharacterId) || null
        )
      },

      setBlobUrl: (glbBlobId, url) =>
        set((state) => ({
          blobUrls: { ...state.blobUrls, [glbBlobId]: url },
        })),

      getBlobUrl: (glbBlobId) => {
        return get().blobUrls[glbBlobId] || null
      },

      hydrateAllBlobUrls: async () => {
        const { characters } = get()
        set({ isLoading: true })

        for (const char of characters) {
          try {
            const blob = await get3DBlob(char.glbBlobId)
            if (blob) {
              const url = blobToUrl(blob)
              set((state) => ({
                blobUrls: { ...state.blobUrls, [char.glbBlobId]: url },
              }))
            }
          } catch {
            // Silently handle — character will show placeholder
          }
        }

        set({ isLoading: false })
      },

      // ── Cloud sync ─────────────────────────────────────────────

      pushToCloud: async (id: string) => {
        const character = get().characters.find((c) => c.id === id)
        if (!character) return

        // Get GLB blob from IndexedDB
        const glbBlob = await get3DBlob(character.glbBlobId)
        if (!glbBlob) {
          console.warn(`[3DChars] No GLB blob found for ${id}, skipping cloud push`)
          return
        }

        const meta: Cloud3DCharacterMeta = {
          id: character.id,
          name: character.name,
          thumbnailDataUrl: character.thumbnailDataUrl?.slice(0, 200) || '',
          skeletonType: character.skeletonType,
          polyCount: character.polyCount,
          createdAt: character.createdAt,
          sourcePrompt: character.sourcePrompt,
        }

        try {
          await upload3DCharacterToCloud(meta, character, glbBlob)
          console.log(`[3DChars] Uploaded ${id} to cloud (${(glbBlob.size / 1024 / 1024).toFixed(1)}MB)`)

          // Auto-publish to marketplace
          publishCharacterToMarketplace({
            characterId: character.id,
            characterType: '3d',
            name: character.name,
            description: character.sourcePrompt || 'A 3D character',
            thumbnailDataUrl: character.thumbnailDataUrl,
            metadata: { skeletonType: character.skeletonType, polyCount: character.polyCount },
          }).catch(() => {})
        } catch (err) {
          console.warn(`[3DChars] Cloud upload failed for ${id}:`, err)
        }
      },

      syncFromCloud: async () => {
        try {
          const allChars = get().characters
          console.log(`[3DChars] syncFromCloud: ${allChars.length} local characters`)

          const cloudChars = await fetchCloud3DCharacters()
          console.log(`[3DChars] syncFromCloud: ${cloudChars.length} cloud characters`)

          if (!cloudChars || cloudChars.length === 0) {
            // No cloud characters — push all local ones
            for (const local of allChars) {
              await get().pushToCloud(local.id)
            }
            set({ _cloudSynced: true })
            return
          }

          const localIds = new Set(allChars.map((c) => c.id))

          // Download characters that exist in cloud but not locally
          for (const cloudMeta of cloudChars) {
            if (!localIds.has(cloudMeta.id)) {
              try {
                // Download metadata and GLB in parallel
                const [charMeta, glbBlob] = await Promise.all([
                  download3DCharacterMeta(cloudMeta.id),
                  download3DCharacterGlb(cloudMeta.id),
                ])

                if (!charMeta || !glbBlob) {
                  console.warn(`[3DChars] Incomplete cloud data for ${cloudMeta.id}`)
                  continue
                }

                // Save GLB blob to IndexedDB
                await save3DBlob(charMeta.glbBlobId, glbBlob)
                const url = blobToUrl(glbBlob)
                set((state) => ({
                  blobUrls: { ...state.blobUrls, [charMeta.glbBlobId]: url },
                }))

                // Add character to store
                set((state) => ({
                  characters: [...state.characters, charMeta],
                }))

                console.log(`[3DChars] Downloaded ${cloudMeta.id} from cloud (${(glbBlob.size / 1024 / 1024).toFixed(1)}MB)`)
              } catch (err) {
                console.warn(`[3DChars] Failed to download ${cloudMeta.id}:`, err)
              }
            }
          }

          // Push any local-only characters to cloud
          const cloudIds = new Set(cloudChars.map((c) => c.id))
          const localOnly = get().characters.filter((c) => !cloudIds.has(c.id))
          console.log(`[3DChars] Pushing ${localOnly.length} local-only character(s) to cloud`)
          for (const local of localOnly) {
            await get().pushToCloud(local.id)
          }

          set({ _cloudSynced: true })
        } catch (err) {
          console.warn('[3DChars] Cloud sync failed:', err)
          set({ _cloudSynced: true })
        }
      },
    }),
    {
      name: 'saved-3d-characters-storage',
      partialize: (state) => ({
        characters: state.characters,
        selectedCharacterId: state.selectedCharacterId,
        // blobUrls and isLoading are runtime-only, not persisted
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (!state) return
          // After rehydration, regenerate blob URLs from IndexedDB
          state.hydrateAllBlobUrls()
          // Cloud sync is triggered by AuthGuard after auth is confirmed
        }
      },
    }
  )
)
