/**
 * IndexedDB helper for persisting 3D character and animation GLB blobs.
 * Follows the same pattern as mediaDB.ts but uses a separate database
 * to keep 3D assets isolated from media files.
 */

const DB_NAME = 'proanimate-3d'
const DB_VERSION = 1
const STORE_NAME = 'glb-files'

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

/** Store a GLB blob keyed by ID */
export async function save3DBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(blob, id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Retrieve a GLB blob by ID, returns null if not found */
export async function get3DBlob(id: string): Promise<Blob | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(id)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

/** Delete a GLB blob by ID */
export async function delete3DBlob(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Get all stored 3D asset IDs */
export async function getAll3DIds(): Promise<string[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAllKeys()
    request.onsuccess = () => resolve(request.result as string[])
    request.onerror = () => reject(request.error)
  })
}

/** Check if a blob contains valid GLB data (magic bytes: glTF) */
export async function isGlbBlob(blob: Blob): Promise<boolean> {
  if (blob.size < 4) return false
  const header = new Uint8Array(await blob.slice(0, 4).arrayBuffer())
  return (
    header[0] === 0x67 && // g
    header[1] === 0x6c && // l
    header[2] === 0x54 && // T
    header[3] === 0x46 // F
  )
}

/** Convert a GLB blob to a blob URL (for Three.js loading) */
export function blobToUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

/** Convert a GLB blob to a base64 string (for Remotion export embedding) */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      // Strip the data URL prefix (data:application/octet-stream;base64,)
      const base64 = result.split(',')[1] || result
      resolve(base64)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}
