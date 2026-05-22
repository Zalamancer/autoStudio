import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CurvedVisemeSprites } from '@/types/nanoBanana'
import { createEmptySpriteSet } from '@/types/nanoBanana'
import type { EyeVariantSprites, EyebrowVariantSprites } from '@/types/emotionHeads'
import type { VisemeSpriteMap } from '@/services/visemeMapper'
import {
  saveCharacterImages,
  loadCharacterImages,
  deleteCharacterImages,
  type CharacterImageData,
} from '@/services/characterDB'
import {
  fetchCloudCharacters,
  downloadCharacterImages,
  uploadCharacterToCloud,
  deleteCloudCharacter,
  type CloudCharacterMeta,
} from '@/services/charactersCloud'
import { publishCharacterToMarketplace } from '@/services/characterMarketplace'

export type CharacterPartTab = 'viseme' | 'eye' | 'eyebrow' | 'hair' | 'body' | 'head' | 'shirt' | 'pants' | 'shoes'

export interface SavedPartTransform {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  visible: boolean
}

export interface SavedCharacter {
  id: string
  name: string
  referenceImage: string
  stylePrompt: string
  curvedVisemes: CurvedVisemeSprites
  eyeVariants?: EyeVariantSprites
  eyebrowVariants?: EyebrowVariantSprites
  createdAt: number
  /** Per-part sprite images (body, eye, eyebrow, viseme, hair, shirt, pants, shoes) */
  bodyParts?: Record<CharacterPartTab, string[]>
  /** Per-part transforms for composite positioning */
  partTransforms?: Record<string, SavedPartTransform>
  /** Which sprite is selected per part */
  selectedSprites?: Record<CharacterPartTab, number | null>
  /** Per-part sprite labels/names */
  spriteLabels?: Record<CharacterPartTab, Record<number, string>>
  /** Pre-computed viseme sprite map for flexible name matching */
  visemeSpriteMap?: VisemeSpriteMap
  /** Uploaded sprite sheets per part (data URLs) */
  uploadedSheets?: Record<CharacterPartTab, string | null>
  /** Whether the character's image data has been loaded from IndexedDB */
  _hydrated?: boolean
  /** Whether the character has been synced to cloud */
  _cloudSynced?: boolean
  /** Small thumbnail (~2KB) that survives localStorage for preview when IndexedDB is empty */
  _thumbnail?: string
}

interface SavedCharactersState {
  characters: SavedCharacter[]
  selectedCharacterId: string | null

  // Actions
  addCharacter: (character: SavedCharacter) => void
  removeCharacter: (id: string) => void
  updateCharacter: (id: string, updates: Partial<SavedCharacter>) => void
  selectCharacter: (id: string | null) => void
  getSelectedCharacter: () => SavedCharacter | null

  // IndexedDB persistence
  persistImages: (id: string) => Promise<void>
  hydrateCharacter: (id: string) => Promise<void>
  hydrateAll: () => Promise<void>

  // Cloud sync
  syncFromCloud: () => Promise<void>
  pushToCloud: (id: string) => Promise<void>
}

/** Create a tiny placeholder for curvedVisemes so the type stays valid */
const createEmptyVisemes = createEmptySpriteSet

/** Generate a small (~2KB) JPEG thumbnail from a data URL for localStorage persistence */
async function generateThumbnail(src: string, size = 48): Promise<string | null> {
  if (!src || src.length < 100) return null
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error('Image load failed'))
      img.src = src
    })
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    // Draw image centered/cover
    const scale = Math.max(size / img.width, size / img.height)
    const w = img.width * scale
    const h = img.height * scale
    ctx.drawImage(img, (size - w) / 2, (size - h) / 2, w, h)
    return canvas.toDataURL('image/jpeg', 0.6)
  } catch {
    return null
  }
}

function buildImageData(character: SavedCharacter): CharacterImageData {
  return {
    referenceImage: character.referenceImage || '',
    bodyParts: character.bodyParts,
    curvedVisemes: character.curvedVisemes as Record<string, string | null>,
    eyeVariants: character.eyeVariants as Record<string, string | null> | undefined,
    eyebrowVariants: character.eyebrowVariants as Record<string, string | null> | undefined,
    partTransforms: character.partTransforms,
    selectedSprites: character.selectedSprites,
    spriteLabels: character.spriteLabels,
    visemeSpriteMap: character.visemeSpriteMap as Record<string, string | null> | undefined,
    uploadedSheets: character.uploadedSheets,
  }
}

export const useSavedCharactersStore = create<SavedCharactersState>()(
  persist(
    (set, get) => ({
      characters: [],
      selectedCharacterId: null,

      addCharacter: (character) => {
        set((state) => ({
          characters: [...state.characters, character],
        }))

        // Upload to cloud in background after persisting locally
        const store = get()
        store.persistImages(character.id).then(() => {
          store.pushToCloud(character.id)
        })
      },

      removeCharacter: (id) => {
        // Clean up IndexedDB
        deleteCharacterImages(id).catch(() => {})
        // Delete from cloud
        deleteCloudCharacter(id).catch((err) => {
          console.warn(`[Characters] Cloud delete failed for ${id}:`, err)
        })
        set((state) => ({
          characters: state.characters.filter((c) => c.id !== id),
          selectedCharacterId: state.selectedCharacterId === id ? null : state.selectedCharacterId,
        }))
      },

      updateCharacter: (id, updates) =>
        set((state) => ({
          characters: state.characters.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      selectCharacter: (id) =>
        set(() => ({
          selectedCharacterId: id,
        })),

      getSelectedCharacter: () => {
        const state = get()
        return state.characters.find((c) => c.id === state.selectedCharacterId) || null
      },

      // ── IndexedDB persistence ──────────────────────────────────

      persistImages: async (id: string) => {
        const character = get().characters.find((c) => c.id === id)
        if (!character) return

        try {
          await saveCharacterImages(id, buildImageData(character))
        } catch (err) {
          console.warn(`[useSavedCharactersStore] Failed to persist images for ${id}:`, err)
        }

        // Generate a small thumbnail for localStorage so previews survive IndexedDB loss
        if (!character._thumbnail) {
          const thumbSrc =
            character.referenceImage ||
            character.bodyParts?.body?.[0] ||
            character.bodyParts?.eye?.[0] ||
            character.bodyParts?.hair?.[0]
          if (thumbSrc) {
            const thumb = await generateThumbnail(thumbSrc)
            if (thumb) {
              set((state) => ({
                characters: state.characters.map((c) => (c.id === id ? { ...c, _thumbnail: thumb } : c)),
              }))
            }
          }
        }
      },

      hydrateCharacter: async (id: string) => {
        try {
          const data = await loadCharacterImages(id)
          if (!data) return

          set((state) => ({
            characters: state.characters.map((c) => {
              if (c.id !== id) return c
              return {
                ...c,
                referenceImage: data.referenceImage || c.referenceImage,
                bodyParts: data.bodyParts || c.bodyParts,
                curvedVisemes: (data.curvedVisemes as CurvedVisemeSprites) || c.curvedVisemes,
                eyeVariants: (data.eyeVariants as EyeVariantSprites | undefined) || c.eyeVariants,
                eyebrowVariants: (data.eyebrowVariants as EyebrowVariantSprites | undefined) || c.eyebrowVariants,
                partTransforms: data.partTransforms || c.partTransforms,
                selectedSprites: data.selectedSprites || c.selectedSprites,
                spriteLabels: data.spriteLabels || c.spriteLabels,
                visemeSpriteMap: (data.visemeSpriteMap as VisemeSpriteMap | undefined) || c.visemeSpriteMap,
                uploadedSheets: data.uploadedSheets || c.uploadedSheets,
                _hydrated: true,
              }
            }),
          }))

          // Generate thumbnail for localStorage if missing
          const char = get().characters.find((c) => c.id === id)
          if (char && !char._thumbnail) {
            const thumbSrc = data.referenceImage || data.bodyParts?.body?.[0] || data.bodyParts?.eye?.[0]
            if (thumbSrc) {
              const thumb = await generateThumbnail(thumbSrc)
              if (thumb) {
                set((state) => ({
                  characters: state.characters.map((c) => (c.id === id ? { ...c, _thumbnail: thumb } : c)),
                }))
              }
            }
          }
        } catch (err) {
          console.warn(`[useSavedCharactersStore] Failed to hydrate ${id}:`, err)
        }
      },

      hydrateAll: async () => {
        const ids = get().characters.map((c) => c.id)
        await Promise.all(ids.map((id) => get().hydrateCharacter(id)))
      },

      // ── Cloud sync ─────────────────────────────────────────────

      pushToCloud: async (id: string) => {
        const character = get().characters.find((c) => c.id === id)
        if (!character) return

        const meta: CloudCharacterMeta = {
          id: character.id,
          name: character.name,
          stylePrompt: character.stylePrompt,
          createdAt: character.createdAt,
          referenceImagePreview: character.referenceImage?.slice(0, 200),
        }

        try {
          await uploadCharacterToCloud(meta, buildImageData(character))
          set((state) => ({
            characters: state.characters.map((c) => (c.id === id ? { ...c, _cloudSynced: true } : c)),
          }))
          console.log(`[Characters] Uploaded ${id} to cloud`)

          // Auto-publish to marketplace
          publishCharacterToMarketplace({
            characterId: character.id,
            characterType: '2d',
            name: character.name,
            description: character.stylePrompt || 'A 2D character',
            thumbnailDataUrl: character.referenceImage?.slice(0, 50_000),
            metadata: { stylePrompt: character.stylePrompt },
          }).catch(() => {})
        } catch (err) {
          console.warn(`[Characters] Cloud upload failed for ${id}:`, err)
        }
      },

      syncFromCloud: async () => {
        try {
          const allChars = get().characters
          console.log(
            `[Characters] syncFromCloud: ${allChars.length} local characters (${allChars.filter((c) => c._hydrated).length} hydrated, ${allChars.filter((c) => c._cloudSynced).length} cloud-synced)`,
          )

          const cloudChars = await fetchCloudCharacters()
          console.log(`[Characters] syncFromCloud: ${cloudChars.length} cloud characters`)

          if (!cloudChars || cloudChars.length === 0) {
            // No cloud characters — push any unsynced local ones to cloud
            const locals = get().characters.filter((c) => !c._cloudSynced && c._hydrated)
            console.log(`[Characters] Pushing ${locals.length} local-only character(s) to cloud`)
            for (const local of locals) {
              await get().pushToCloud(local.id)
            }
            return
          }

          // Download characters from cloud: new ones + local ones missing images (lost IndexedDB)
          for (const cloudMeta of cloudChars) {
            const localChar = get().characters.find((c) => c.id === cloudMeta.id)
            const isNew = !localChar
            const needsRedownload = localChar && !localChar._hydrated

            if (isNew || needsRedownload) {
              try {
                const imageData = await downloadCharacterImages(cloudMeta.id)
                if (!imageData) continue

                if (isNew) {
                  const character: SavedCharacter = {
                    id: cloudMeta.id,
                    name: cloudMeta.name,
                    stylePrompt: cloudMeta.stylePrompt,
                    createdAt: cloudMeta.createdAt,
                    referenceImage: imageData.referenceImage || '',
                    curvedVisemes: (imageData.curvedVisemes as CurvedVisemeSprites) || createEmptyVisemes(),
                    eyeVariants: imageData.eyeVariants as EyeVariantSprites | undefined,
                    eyebrowVariants: imageData.eyebrowVariants as EyebrowVariantSprites | undefined,
                    bodyParts: imageData.bodyParts as Record<CharacterPartTab, string[]> | undefined,
                    partTransforms: imageData.partTransforms,
                    selectedSprites: imageData.selectedSprites as Record<CharacterPartTab, number | null> | undefined,
                    spriteLabels: imageData.spriteLabels as
                      | Record<CharacterPartTab, Record<number, string>>
                      | undefined,
                    visemeSpriteMap: imageData.visemeSpriteMap as VisemeSpriteMap | undefined,
                    uploadedSheets: imageData.uploadedSheets as Record<CharacterPartTab, string | null> | undefined,
                    _hydrated: true,
                    _cloudSynced: true,
                  }

                  set((state) => ({
                    characters: [...state.characters, character],
                  }))
                } else {
                  // Re-hydrate existing local character with cloud images
                  set((state) => ({
                    characters: state.characters.map((c) => {
                      if (c.id !== cloudMeta.id) return c
                      return {
                        ...c,
                        referenceImage: imageData.referenceImage || c.referenceImage,
                        curvedVisemes: (imageData.curvedVisemes as CurvedVisemeSprites) || c.curvedVisemes,
                        eyeVariants: (imageData.eyeVariants as EyeVariantSprites | undefined) || c.eyeVariants,
                        eyebrowVariants:
                          (imageData.eyebrowVariants as EyebrowVariantSprites | undefined) || c.eyebrowVariants,
                        bodyParts:
                          (imageData.bodyParts as Record<CharacterPartTab, string[]> | undefined) || c.bodyParts,
                        partTransforms: imageData.partTransforms || c.partTransforms,
                        selectedSprites:
                          (imageData.selectedSprites as Record<CharacterPartTab, number | null> | undefined) ||
                          c.selectedSprites,
                        spriteLabels:
                          (imageData.spriteLabels as Record<CharacterPartTab, Record<number, string>> | undefined) ||
                          c.spriteLabels,
                        visemeSpriteMap:
                          (imageData.visemeSpriteMap as VisemeSpriteMap | undefined) || c.visemeSpriteMap,
                        uploadedSheets:
                          (imageData.uploadedSheets as Record<CharacterPartTab, string | null> | undefined) ||
                          c.uploadedSheets,
                        _hydrated: true,
                        _cloudSynced: true,
                      }
                    }),
                  }))
                  console.log(`[Characters] Re-downloaded images for ${cloudMeta.id} from cloud (IndexedDB was empty)`)
                }

                // Save to local IndexedDB cache
                saveCharacterImages(cloudMeta.id, imageData).catch(() => {})

                // Generate localStorage thumbnail from cloud images
                const thumbSrc = imageData.referenceImage || imageData.bodyParts?.body?.[0]
                if (thumbSrc) {
                  generateThumbnail(thumbSrc as string)
                    .then((thumb) => {
                      if (thumb) {
                        set((state) => ({
                          characters: state.characters.map((c) =>
                            c.id === cloudMeta.id ? { ...c, _thumbnail: thumb } : c,
                          ),
                        }))
                      }
                    })
                    .catch(() => {})
                }

                console.log(`[Characters] Downloaded ${cloudMeta.id} from cloud`)
              } catch (err) {
                console.warn(`[Characters] Failed to download ${cloudMeta.id}:`, err)
              }
            }
          }

          // Push any local-only characters (not in cloud) to cloud
          const cloudIds = new Set(cloudChars.map((c) => c.id))
          const locals = get().characters.filter((c) => !cloudIds.has(c.id) && c._hydrated)
          console.log(`[Characters] Pushing ${locals.length} local-only character(s) to cloud`)
          for (const local of locals) {
            await get().pushToCloud(local.id)
          }
        } catch (err) {
          console.warn('[Characters] Cloud sync failed:', err)
        }
      },
    }),
    {
      name: 'saved-characters-storage',
      storage: createJSONStorage(() => ({
        getItem: (name: string) => localStorage.getItem(name),
        setItem: (name: string, value: string) => {
          try {
            localStorage.setItem(name, value)
          } catch {
            // QuotaExceededError — silently skip, data is in IndexedDB/cloud
            console.warn('[useSavedCharactersStore] localStorage quota exceeded, skipping persist')
          }
        },
        removeItem: (name: string) => localStorage.removeItem(name),
      })),
      partialize: (state) => ({
        // Minimal data only — images, transforms, spriteLabels restored from IndexedDB
        characters: state.characters.map((c) => ({
          id: c.id,
          name: c.name,
          referenceImage: '',
          stylePrompt: c.stylePrompt,
          createdAt: c.createdAt,
          curvedVisemes: createEmptyVisemes(),
          eyeVariants: undefined as EyeVariantSprites | undefined,
          eyebrowVariants: undefined as EyebrowVariantSprites | undefined,
          bodyParts: undefined as Record<CharacterPartTab, string[]> | undefined,
          partTransforms: undefined as Record<string, SavedPartTransform> | undefined,
          selectedSprites: undefined as Record<CharacterPartTab, number | null> | undefined,
          spriteLabels: undefined as Record<CharacterPartTab, Record<number, string>> | undefined,
          visemeSpriteMap: undefined as VisemeSpriteMap | undefined,
          uploadedSheets: undefined as Record<CharacterPartTab, string | null> | undefined,
          _cloudSynced: c._cloudSynced,
          _thumbnail: c._thumbnail,
        })),
        // selectedCharacterId intentionally NOT persisted — canvas should be empty on fresh load
      }),
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (error) {
            console.warn('[useSavedCharactersStore] Persist rehydration error:', error)
            return
          }
          queueMicrotask(() => {
            useSavedCharactersStore
              .getState()
              .hydrateAll()
              .catch((err) => {
                console.warn('[useSavedCharactersStore] Failed to hydrate from IndexedDB:', err)
              })
            // Cloud sync is triggered by AuthGuard after auth is confirmed
          })
        }
      },
    },
  ),
)
