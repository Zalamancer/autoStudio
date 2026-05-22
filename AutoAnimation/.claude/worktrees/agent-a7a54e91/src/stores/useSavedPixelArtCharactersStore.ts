/**
 * State management for saved pixel art character templates (library).
 * Parallel to useSaved3DCharactersStore but for PixelLab pixel art characters.
 *
 * Sprite blobs are stored in IndexedDB (pixelArtDB.ts).
 * This store holds metadata + thumbnail data URLs.
 * Blob URLs are regenerated on page reload from IndexedDB.
 * Cloud sync via Supabase Storage for cross-device persistence.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SavedPixelArtCharacter } from '@/types/pixelLab'
import { getPixelArtBlob, deletePixelArtBlob, blobToUrl, savePixelArtBlob, blobToDataUrl } from '@/services/pixelArtDB'
import {
  fetchCloudPixelArtCharacters,
  downloadPixelArtData,
  uploadPixelArtToCloud,
  deleteCloudPixelArtCharacter,
  type PixelArtCharacterMeta,
  type PixelArtCloudData,
} from '@/services/pixelArtCloud'
import { publishCharacterToMarketplace } from '@/services/characterMarketplace'

interface SavedPixelArtCharactersState {
  characters: SavedPixelArtCharacter[]
  selectedCharacterId: string | null
  /** Runtime blob URL cache (not persisted) */
  blobUrls: Record<string, string>
  isLoading: boolean
  _cloudSynced: boolean

  // Actions
  addCharacter: (character: SavedPixelArtCharacter) => void
  removeCharacter: (id: string) => void
  updateCharacter: (id: string, updates: Partial<SavedPixelArtCharacter>) => void
  selectCharacter: (id: string | null) => void
  getSelectedCharacter: () => SavedPixelArtCharacter | null

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

export const useSavedPixelArtCharactersStore = create<SavedPixelArtCharactersState>()(
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
          console.warn(`[PixelArt] Cloud push failed for ${character.id}:`, err)
        })
      },

      removeCharacter: (id) => {
        const state = get()
        const char = state.characters.find((c) => c.id === id)
        if (char) {
          // Clean up all IndexedDB blobs for this character
          const allBlobIds = [
            ...Object.values(char.directionBlobIds).filter(Boolean) as string[],
            ...Object.values(char.animationBlobIds).flatMap((dirs) =>
              dirs.flatMap((d) => d.frameBlobIds)
            ),
          ]
          for (const blobId of allBlobIds) {
            deletePixelArtBlob(blobId).catch(() => {})
            const blobUrl = state.blobUrls[blobId]
            if (blobUrl) URL.revokeObjectURL(blobUrl)
          }
        }

        // Delete from cloud
        deleteCloudPixelArtCharacter(id).catch((err) => {
          console.warn(`[PixelArt] Cloud delete failed for ${id}:`, err)
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
          // Hydrate direction sprites
          for (const blobId of Object.values(char.directionBlobIds)) {
            if (!blobId) continue
            try {
              const blob = await getPixelArtBlob(blobId)
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

          // Hydrate animation frame sprites
          for (const animDirs of Object.values(char.animationBlobIds)) {
            for (const animDir of animDirs) {
              for (const blobId of animDir.frameBlobIds) {
                try {
                  const blob = await getPixelArtBlob(blobId)
                  if (blob) {
                    const url = blobToUrl(blob)
                    set((state) => ({
                      blobUrls: { ...state.blobUrls, [blobId]: url },
                    }))
                  }
                } catch {
                  // Silently handle
                }
              }
            }
          }
        }

        set({ isLoading: false })
      },

      // ── Cloud sync ─────────────────────────────────────────────

      pushToCloud: async (id: string) => {
        const character = get().characters.find((c) => c.id === id)
        if (!character) return

        const meta: PixelArtCharacterMeta = {
          id: character.id,
          name: character.name,
          description: character.description,
          size: character.size,
          n_directions: character.n_directions,
          thumbnailDataUrl: character.thumbnailDataUrl?.slice(0, 200) || '',
          createdAt: character.createdAt,
        }

        // Collect all blob data as base64 data URLs
        const directionBlobs: Record<string, string> = {}
        for (const [direction, blobId] of Object.entries(character.directionBlobIds)) {
          if (!blobId) continue
          try {
            const blob = await getPixelArtBlob(blobId)
            if (blob) {
              directionBlobs[direction] = await blobToDataUrl(blob)
            }
          } catch {
            // Skip missing blobs
          }
        }

        const animationBlobs: Record<string, { direction: string; frameDataUrls: string[] }[]> = {}
        for (const [animName, animDirs] of Object.entries(character.animationBlobIds)) {
          animationBlobs[animName] = []
          for (const animDir of animDirs) {
            const frameDataUrls: string[] = []
            for (const blobId of animDir.frameBlobIds) {
              try {
                const blob = await getPixelArtBlob(blobId)
                if (blob) {
                  frameDataUrls.push(await blobToDataUrl(blob))
                }
              } catch {
                frameDataUrls.push('')
              }
            }
            animationBlobs[animName].push({
              direction: animDir.direction,
              frameDataUrls,
            })
          }
        }

        const blobs: PixelArtCloudData = { directionBlobs, animationBlobs }

        try {
          await uploadPixelArtToCloud(meta, character, blobs)
          console.log(`[PixelArt] Uploaded ${id} to cloud`)

          // Auto-publish to marketplace
          publishCharacterToMarketplace({
            characterId: character.id,
            characterType: '1d',
            name: character.name,
            description: character.description,
            thumbnailDataUrl: character.thumbnailDataUrl,
            metadata: { size: character.size, n_directions: character.n_directions },
          }).catch(() => {})
        } catch (err) {
          console.warn(`[PixelArt] Cloud upload failed for ${id}:`, err)
        }
      },

      syncFromCloud: async () => {
        try {
          const allChars = get().characters
          console.log(`[PixelArt] syncFromCloud: ${allChars.length} local characters`)

          const cloudChars = await fetchCloudPixelArtCharacters()
          console.log(`[PixelArt] syncFromCloud: ${cloudChars.length} cloud characters`)

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
                const cloudData = await downloadPixelArtData(cloudMeta.id)
                if (!cloudData) continue

                const { character, blobs } = cloudData

                // Save blobs to IndexedDB and create blob URLs
                for (const [direction, dataUrl] of Object.entries(blobs.directionBlobs || {})) {
                  const blobId = character.directionBlobIds[direction as keyof typeof character.directionBlobIds]
                  if (blobId && dataUrl) {
                    const blob = dataUrlToBlob(dataUrl)
                    await savePixelArtBlob(blobId, blob)
                    const url = blobToUrl(blob)
                    set((state) => ({
                      blobUrls: { ...state.blobUrls, [blobId]: url },
                    }))
                  }
                }

                for (const [animName, animDirs] of Object.entries(blobs.animationBlobs || {})) {
                  const localAnimDirs = character.animationBlobIds[animName] || []
                  for (let i = 0; i < animDirs.length && i < localAnimDirs.length; i++) {
                    const { frameDataUrls } = animDirs[i]
                    const localAnimDir = localAnimDirs[i]
                    for (let j = 0; j < frameDataUrls.length && j < localAnimDir.frameBlobIds.length; j++) {
                      if (frameDataUrls[j]) {
                        const blobId = localAnimDir.frameBlobIds[j]
                        const blob = dataUrlToBlob(frameDataUrls[j])
                        await savePixelArtBlob(blobId, blob)
                        const url = blobToUrl(blob)
                        set((state) => ({
                          blobUrls: { ...state.blobUrls, [blobId]: url },
                        }))
                      }
                    }
                  }
                }

                // Add character to store
                set((state) => ({
                  characters: [...state.characters, character],
                }))

                console.log(`[PixelArt] Downloaded ${cloudMeta.id} from cloud`)
              } catch (err) {
                console.warn(`[PixelArt] Failed to download ${cloudMeta.id}:`, err)
              }
            }
          }

          // Push any local-only characters to cloud
          const cloudIds = new Set(cloudChars.map((c) => c.id))
          const localOnly = get().characters.filter((c) => !cloudIds.has(c.id))
          console.log(`[PixelArt] Pushing ${localOnly.length} local-only character(s) to cloud`)
          for (const local of localOnly) {
            await get().pushToCloud(local.id)
          }

          set({ _cloudSynced: true })
        } catch (err) {
          console.warn('[PixelArt] Cloud sync failed:', err)
          set({ _cloudSynced: true })
        }
      },
    }),
    {
      name: 'saved-pixelart-characters-storage',
      partialize: (state) => ({
        characters: state.characters,
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
