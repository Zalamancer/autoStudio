/**
 * IndexedDB storage for saved character image data.
 *
 * Characters can have hundreds of KB–MB of base64 image data (sprites,
 * visemes, emotion heads, sprite sheets). Storing these in localStorage
 * quickly hits the 5-10 MB quota. We store them in IndexedDB instead
 * and keep only lightweight metadata in the Zustand persist store.
 *
 * Key schema:  `{characterId}` → CharacterImageData
 */

import { warnIfStorageLow } from '@/utils/storage'

const DB_NAME = 'proanimate-characters'
const DB_VERSION = 1
const STORE_NAME = 'character-images'

export type CharacterPartTab = 'viseme' | 'eye' | 'eyebrow' | 'hair' | 'body' | 'head' | 'shirt' | 'pants' | 'shoes'

/** All image data for a single saved character */
export interface CharacterImageData {
  /** Reference image / thumbnail (data URL) */
  referenceImage: string
  /** Per-part sprite images (data URLs) */
  bodyParts?: Record<CharacterPartTab, string[]>
  /** 36 curved viseme sprites (data URLs) */
  curvedVisemes: Record<string, string | null>
  /** Eye variant sprites (6 variants, data URLs) */
  eyeVariants?: Record<string, string | null>
  /** Eyebrow variant sprites (6 variants, data URLs) */
  eyebrowVariants?: Record<string, string | null>
  /** Uploaded sprite sheet per part (data URLs) — from useCharacterConfigStore.uploadedImages */
  uploadedSheets?: Record<CharacterPartTab, string | null>
  /** Per-part transforms for composite positioning */
  partTransforms?: Record<string, {
    x: number; y: number; rotation: number
    scaleX: number; scaleY: number; visible: boolean
  }>
  /** Which sprite index is selected per part */
  selectedSprites?: Record<CharacterPartTab, number | null>
  /** Per-part sprite labels/names */
  spriteLabels?: Record<CharacterPartTab, Record<number, string>>
  /** Pre-computed viseme sprite map for flexible name matching */
  visemeSpriteMap?: Record<string, string | null>
}

// ── DB helpers ──────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ── Public API ──────────────────────────────────────────────────────────

/** Save all image data for a character */
export async function saveCharacterImages(
  characterId: string,
  data: CharacterImageData,
): Promise<void> {
  await warnIfStorageLow()
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(data, characterId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Load all image data for a character. Returns null if not found. */
export async function loadCharacterImages(
  characterId: string,
): Promise<CharacterImageData | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(characterId)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

/** Delete image data for a character */
export async function deleteCharacterImages(
  characterId: string,
): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(characterId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Get all stored character IDs */
export async function getAllCharacterImageIds(): Promise<string[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAllKeys()
    request.onsuccess = () => resolve(request.result as string[])
    request.onerror = () => reject(request.error)
  })
}
