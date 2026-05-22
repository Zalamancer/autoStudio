/**
 * IndexedDB helper for persisting exported video recording blobs.
 * Stores actual video data so blob URLs can be regenerated after page reload.
 * Follows the same pattern as mediaDB.ts.
 */

import { warnIfStorageLow } from '@/utils/storage'

const DB_NAME = 'proanimate-recordings'
const DB_VERSION = 1
const VIDEO_STORE = 'videos'
const THUMB_STORE = 'thumbnails'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(VIDEO_STORE)) {
        db.createObjectStore(VIDEO_STORE)
      }
      if (!db.objectStoreNames.contains(THUMB_STORE)) {
        db.createObjectStore(THUMB_STORE)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Store a video blob keyed by recording ID */
export async function saveRecordingBlob(id: string, blob: Blob): Promise<void> {
  await warnIfStorageLow()
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, 'readwrite')
    tx.objectStore(VIDEO_STORE).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Retrieve a video blob by recording ID */
export async function getRecordingBlob(id: string): Promise<Blob | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, 'readonly')
    const request = tx.objectStore(VIDEO_STORE).get(id)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

/** Delete a video blob by recording ID */
export async function deleteRecordingBlob(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, 'readwrite')
    tx.objectStore(VIDEO_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Store a thumbnail blob keyed by recording ID */
export async function saveRecordingThumbnail(id: string, blob: Blob): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(THUMB_STORE, 'readwrite')
    tx.objectStore(THUMB_STORE).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Retrieve a thumbnail blob by recording ID */
export async function getRecordingThumbnail(id: string): Promise<Blob | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(THUMB_STORE, 'readonly')
    const request = tx.objectStore(THUMB_STORE).get(id)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

/** Delete a thumbnail blob by recording ID */
export async function deleteRecordingThumbnail(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(THUMB_STORE, 'readwrite')
    tx.objectStore(THUMB_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
