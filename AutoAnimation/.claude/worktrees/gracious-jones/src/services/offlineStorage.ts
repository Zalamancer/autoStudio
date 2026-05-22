/**
 * Offline Storage Service
 *
 * IndexedDB-based storage for offline project data, queued API requests,
 * and cached assets. Provides the persistence layer for offline editing.
 */

import type { OfflineProject, OfflineQueueItem } from '@/types/offline'

const DB_NAME = 'proanimate-offline'
const DB_VERSION = 1
const PROJECTS_STORE = 'offline-projects'
const QUEUE_STORE = 'sync-queue'
const CACHE_STORE = 'asset-cache'

// ── DB Setup ──

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const queueStore = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' })
        queueStore.createIndex('priority', 'priority', { unique: false })
        queueStore.createIndex('queuedAt', 'queuedAt', { unique: false })
      }

      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE)
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

// ── Offline Projects ──

/** Save a project for offline access */
export async function saveOfflineProject(project: OfflineProject): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECTS_STORE, 'readwrite')
    tx.objectStore(PROJECTS_STORE).put(project)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Load an offline project by ID */
export async function getOfflineProject(id: string): Promise<OfflineProject | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECTS_STORE, 'readonly')
    const request = tx.objectStore(PROJECTS_STORE).get(id)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

/** List all offline projects */
export async function listOfflineProjects(): Promise<OfflineProject[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECTS_STORE, 'readonly')
    const request = tx.objectStore(PROJECTS_STORE).getAll()
    request.onsuccess = () => resolve(request.result ?? [])
    request.onerror = () => reject(request.error)
  })
}

/** Delete an offline project */
export async function deleteOfflineProject(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECTS_STORE, 'readwrite')
    tx.objectStore(PROJECTS_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Get all dirty (unsynced) projects */
export async function getDirtyProjects(): Promise<OfflineProject[]> {
  const projects = await listOfflineProjects()
  return projects.filter((p) => p.isDirty)
}

// ── Sync Queue ──

/** Add a request to the sync queue */
export async function enqueueRequest(item: OfflineQueueItem): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    tx.objectStore(QUEUE_STORE).put(item)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Get all queued requests, ordered by priority then time */
export async function getQueuedRequests(): Promise<OfflineQueueItem[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readonly')
    const index = tx.objectStore(QUEUE_STORE).index('priority')
    const request = index.getAll()
    request.onsuccess = () => {
      const items = (request.result ?? []) as OfflineQueueItem[]
      // Sort by priority first, then by queuedAt
      items.sort((a, b) => a.priority - b.priority || a.queuedAt - b.queuedAt)
      resolve(items)
    }
    request.onerror = () => reject(request.error)
  })
}

/** Remove a request from the queue */
export async function dequeueRequest(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    tx.objectStore(QUEUE_STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Get the count of pending requests */
export async function getQueueCount(): Promise<number> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readonly')
    const request = tx.objectStore(QUEUE_STORE).count()
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/** Clear the entire sync queue */
export async function clearQueue(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    tx.objectStore(QUEUE_STORE).clear()
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

// ── Asset Cache ──

/** Cache an asset blob */
export async function cacheAsset(key: string, blob: Blob): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE, 'readwrite')
    tx.objectStore(CACHE_STORE).put(blob, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Get a cached asset */
export async function getCachedAsset(key: string): Promise<Blob | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE, 'readonly')
    const request = tx.objectStore(CACHE_STORE).get(key)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

/** Delete a cached asset */
export async function deleteCachedAsset(key: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(CACHE_STORE, 'readwrite')
    tx.objectStore(CACHE_STORE).delete(key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Get the total storage used by all offline stores (approximate, in bytes) */
export async function getOfflineStorageUsage(): Promise<number> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate()
    return estimate.usage ?? 0
  }
  return 0
}
