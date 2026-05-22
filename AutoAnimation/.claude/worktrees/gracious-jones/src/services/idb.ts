/**
 * Generic IndexedDB store factory.
 *
 * Eliminates the duplicated open/get/put/delete boilerplate across
 * characterDB, character3dDB, mediaDB, and recordingsDB.
 *
 * Usage:
 *   const store = createIDBStore<Blob>({ dbName: 'my-db', storeName: 'blobs' })
 *   await store.save('key', blob)
 *   const blob = await store.get('key')
 */

interface IDBStoreConfig {
  dbName: string
  version?: number
  storeNames: string[]
}

interface IDBStoreOps<T> {
  save: (id: string, data: T) => Promise<void>
  get: (id: string) => Promise<T | null>
  delete: (id: string) => Promise<void>
  getAllKeys: () => Promise<string[]>
  clear: () => Promise<void>
}

/** Cache of open IDB connections keyed by "dbName:version" */
const dbCache = new Map<string, Promise<IDBDatabase>>()

function openDB(config: IDBStoreConfig): Promise<IDBDatabase> {
  const cacheKey = `${config.dbName}:${config.version ?? 1}`
  const cached = dbCache.get(cacheKey)
  if (cached) return cached

  const promise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(config.dbName, config.version ?? 1)

    request.onupgradeneeded = () => {
      const db = request.result
      for (const name of config.storeNames) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name)
        }
      }
    }

    request.onsuccess = () => {
      const db = request.result
      // If the connection is unexpectedly closed, remove from cache
      db.onclose = () => { dbCache.delete(cacheKey) }
      db.onversionchange = () => {
        db.close()
        dbCache.delete(cacheKey)
      }
      resolve(db)
    }
    request.onerror = () => {
      dbCache.delete(cacheKey)
      reject(request.error)
    }
  })

  dbCache.set(cacheKey, promise)
  return promise
}

/**
 * Create a typed IndexedDB store with standard CRUD operations.
 * For databases with a single object store, pass the store name directly.
 */
export function createIDBStore<T>(
  dbName: string,
  storeName: string,
  version = 1,
): IDBStoreOps<T> {
  const config: IDBStoreConfig = { dbName, version, storeNames: [storeName] }

  return {
    async save(id: string, data: T): Promise<void> {
      const db = await openDB(config)
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        tx.objectStore(storeName).put(data, id)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    },

    async get(id: string): Promise<T | null> {
      const db = await openDB(config)
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly')
        const request = tx.objectStore(storeName).get(id)
        request.onsuccess = () => resolve(request.result ?? null)
        request.onerror = () => reject(request.error)
      })
    },

    async delete(id: string): Promise<void> {
      const db = await openDB(config)
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        tx.objectStore(storeName).delete(id)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    },

    async getAllKeys(): Promise<string[]> {
      const db = await openDB(config)
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly')
        const request = tx.objectStore(storeName).getAllKeys()
        request.onsuccess = () => resolve(request.result as string[])
        request.onerror = () => reject(request.error)
      })
    },

    async clear(): Promise<void> {
      const db = await openDB(config)
      return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readwrite')
        tx.objectStore(storeName).clear()
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    },
  }
}

/**
 * Create multiple typed stores within a single IndexedDB database.
 * Useful for recordingsDB which has both 'videos' and 'thumbnails' stores.
 */
export function createMultiIDBStore(
  dbName: string,
  storeNames: string[],
  version = 1,
) {
  const config: IDBStoreConfig = { dbName, version, storeNames }

  function storeOps<T>(storeName: string): IDBStoreOps<T> {
    return {
      async save(id: string, data: T): Promise<void> {
        const db = await openDB(config)
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite')
          tx.objectStore(storeName).put(data, id)
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        })
      },

      async get(id: string): Promise<T | null> {
        const db = await openDB(config)
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readonly')
          const request = tx.objectStore(storeName).get(id)
          request.onsuccess = () => resolve(request.result ?? null)
          request.onerror = () => reject(request.error)
        })
      },

      async delete(id: string): Promise<void> {
        const db = await openDB(config)
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite')
          tx.objectStore(storeName).delete(id)
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        })
      },

      async getAllKeys(): Promise<string[]> {
        const db = await openDB(config)
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readonly')
          const request = tx.objectStore(storeName).getAllKeys()
          request.onsuccess = () => resolve(request.result as string[])
          request.onerror = () => reject(request.error)
        })
      },

      async clear(): Promise<void> {
        const db = await openDB(config)
        return new Promise((resolve, reject) => {
          const tx = db.transaction(storeName, 'readwrite')
          tx.objectStore(storeName).clear()
          tx.oncomplete = () => resolve()
          tx.onerror = () => reject(tx.error)
        })
      },
    }
  }

  return { storeOps }
}
