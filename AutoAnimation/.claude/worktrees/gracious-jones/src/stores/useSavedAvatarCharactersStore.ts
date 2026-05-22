/**
 * State management for saved avatar character templates (library).
 * Parallel to useSavedPixelArtCharactersStore but for avatar characters.
 *
 * Image blobs are stored in IndexedDB (avatarDB.ts).
 * This store holds metadata + thumbnail data URLs.
 * Blob URLs are regenerated on page reload from IndexedDB.
 * Cloud sync via Supabase Storage for cross-device persistence.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SavedAvatarCharacter } from '@/types/avatar'
import { getAvatarBlob, deleteAvatarBlob, blobToUrl, saveAvatarBlob, blobToDataUrl } from '@/services/avatarDB'
import {
  fetchCloudAvatarCharacters,
  downloadAvatarData,
  uploadAvatarToCloud,
  deleteCloudAvatarCharacter,
  type AvatarCharacterMeta,
} from '@/services/avatarCloud'
import { publishCharacterToMarketplace } from '@/services/characterMarketplace'

interface SavedAvatarCharactersState {
  characters: SavedAvatarCharacter[]
  selectedCharacterId: string | null
  /** Runtime blob URL cache (not persisted) */
  blobUrls: Record<string, string>
  isLoading: boolean
  _cloudSynced: boolean

  // Actions
  addCharacter: (character: SavedAvatarCharacter) => void
  removeCharacter: (id: string) => void
  updateCharacter: (id: string, updates: Partial<SavedAvatarCharacter>) => void
  selectCharacter: (id: string | null) => void
  getSelectedCharacter: () => SavedAvatarCharacter | null

  // Blob URL management
  setBlobUrl: (blobId: string, url: string) => void
  getBlobUrl: (blobId: string) => string | null
  hydrateAllBlobUrls: () => Promise<void>

  // Cloud sync
  syncFromCloud: () => Promise<void>
  pushToCloud: (id: string) => Promise<void>
}

/** Convert a data URL to a Blob */
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)?.[1] || 'image/png'
  const binary = atob(base64)
  const array = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
  return new Blob([array], { type: mime })
}

export const useSavedAvatarCharactersStore = create<SavedAvatarCharactersState>()(
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
          console.warn(`[Avatar] Cloud push failed for ${character.id}:`, err)
        })
      },

      removeCharacter: (id) => {
        const state = get()
        const char = state.characters.find((c) => c.id === id)
        if (char) {
          // Clean up IndexedDB blob
          deleteAvatarBlob(char.baseBlobId).catch(() => {})
          const blobUrl = state.blobUrls[char.baseBlobId]
          if (blobUrl) URL.revokeObjectURL(blobUrl)
        }

        // Delete from cloud
        deleteCloudAvatarCharacter(id).catch((err) => {
          console.warn(`[Avatar] Cloud delete failed for ${id}:`, err)
        })

        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
          selectedCharacterId:
            state.selectedCharacterId === id ? null : state.selectedCharacterId,
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

      setBlobUrl: (blobId, url) =>
        set((state) => ({
          blobUrls: { ...state.blobUrls, [blobId]: url },
        })),

      getBlobUrl: (blobId) => {
        return get().blobUrls[blobId] || null
      },

      hydrateAllBlobUrls: async () => {
        const { characters } = get()
        set({ isLoading: true })

        for (const char of characters) {
          const blobId = char.baseBlobId
          if (!blobId) continue
          try {
            const blob = await getAvatarBlob(blobId)
            if (blob) {
              const url = blobToUrl(blob)
              set((state) => ({
                blobUrls: { ...state.blobUrls, [blobId]: url },
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

        const meta: AvatarCharacterMeta = {
          id: character.id,
          name: character.name,
          description: character.description,
          style: character.style,
          thumbnailDataUrl: character.thumbnailDataUrl?.slice(0, 200) || '',
          createdAt: character.createdAt,
        }

        // Get the base image blob from IndexedDB and convert to data URL
        let blobDataUrl = ''
        try {
          const blob = await getAvatarBlob(character.baseBlobId)
          if (blob) {
            blobDataUrl = await blobToDataUrl(blob)
          }
        } catch {
          // Skip if blob not found
        }

        try {
          await uploadAvatarToCloud(meta, character, blobDataUrl)
          console.log(`[Avatar] Uploaded ${id} to cloud`)

          // Auto-publish to marketplace
          publishCharacterToMarketplace({
            characterId: character.id,
            characterType: 'avatar',
            name: character.name,
            description: character.description,
            thumbnailDataUrl: character.thumbnailDataUrl,
            metadata: { style: character.style, source: character.source },
          }).catch(() => {})
        } catch (err) {
          console.warn(`[Avatar] Cloud upload failed for ${id}:`, err)
        }
      },

      syncFromCloud: async () => {
        try {
          const allChars = get().characters
          console.log(`[Avatar] syncFromCloud: ${allChars.length} local characters`)

          const cloudChars = await fetchCloudAvatarCharacters()
          console.log(`[Avatar] syncFromCloud: ${cloudChars.length} cloud characters`)

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
                const cloudData = await downloadAvatarData(cloudMeta.id)
                if (!cloudData) continue

                const { character, blob: blobDataUrl } = cloudData

                // Save blob to IndexedDB and create blob URL
                if (blobDataUrl && character.baseBlobId) {
                  const blobObj = dataUrlToBlob(blobDataUrl)
                  await saveAvatarBlob(character.baseBlobId, blobObj)
                  const url = blobToUrl(blobObj)
                  set((state) => ({
                    blobUrls: { ...state.blobUrls, [character.baseBlobId]: url },
                  }))
                }

                // Add character to store
                set((state) => ({
                  characters: [...state.characters, character],
                }))

                console.log(`[Avatar] Downloaded ${cloudMeta.id} from cloud`)
              } catch (err) {
                console.warn(`[Avatar] Failed to download ${cloudMeta.id}:`, err)
              }
            }
          }

          // Push any local-only characters to cloud
          const cloudIds = new Set(cloudChars.map((c) => c.id))
          const localOnly = get().characters.filter((c) => !cloudIds.has(c.id))
          console.log(`[Avatar] Pushing ${localOnly.length} local-only character(s) to cloud`)
          for (const local of localOnly) {
            await get().pushToCloud(local.id)
          }

          set({ _cloudSynced: true })
        } catch (err) {
          console.warn('[Avatar] Cloud sync failed:', err)
          set({ _cloudSynced: true })
        }
      },
    }),
    {
      name: 'saved-avatar-characters-storage',
      partialize: (state) => ({
        // Only persist small metadata — all images live in IndexedDB, thumbnails regenerated on hydration
        characters: state.characters.map((c) => ({
          id: c.id,
          name: c.name,
          description: c.description,
          style: c.style,
          baseBlobId: c.baseBlobId,
          source: c.source,
          createdAt: c.createdAt,
          thumbnailDataUrl: '',
        })),
        selectedCharacterId: state.selectedCharacterId,
      }),
      onRehydrateStorage: () => {
        return (state) => {
          if (!state) return
          state.hydrateAllBlobUrls()
          // Cloud sync is triggered by AuthGuard after auth is confirmed
        }
      },
    }
  )
)
