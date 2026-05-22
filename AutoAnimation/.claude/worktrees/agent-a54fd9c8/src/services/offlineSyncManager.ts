/**
 * Offline Sync Manager
 *
 * Manages the background synchronization of queued requests when
 * connectivity resumes. Handles retry logic, conflict detection,
 * and status reporting.
 */

import type { OfflineQueueItem, NetworkStatus, SyncQueueStatus } from '@/types/offline'
import {
  getQueuedRequests,
  dequeueRequest,
  enqueueRequest,
  getQueueCount,
  getDirtyProjects,
  saveOfflineProject,
} from './offlineStorage'

type SyncStatusListener = (status: SyncQueueStatus) => void
type NetworkStatusListener = (status: NetworkStatus) => void

export class OfflineSyncManager {
  private isSyncing = false
  private syncTimer: ReturnType<typeof setInterval> | null = null
  private networkStatus: NetworkStatus = 'online'
  private syncListeners: SyncStatusListener[] = []
  private networkListeners: NetworkStatusListener[] = []
  private lastSyncAt: number | null = null
  private failedCount = 0

  constructor() {
    // Monitor online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this._setNetworkStatus('online'))
      window.addEventListener('offline', () => this._setNetworkStatus('offline'))

      // Check initial status
      this.networkStatus = navigator.onLine ? 'online' : 'offline'
    }
  }

  get isOnline(): boolean {
    return this.networkStatus === 'online'
  }

  get currentNetworkStatus(): NetworkStatus {
    return this.networkStatus
  }

  // ── Lifecycle ──

  /**
   * Start the background sync loop.
   * @param intervalMs - Check interval in milliseconds (default 30s)
   */
  start(intervalMs = 30000): void {
    if (this.syncTimer) return

    this.syncTimer = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncAll().catch(console.error)
      }
    }, intervalMs)

    // Sync immediately if online
    if (this.isOnline) {
      this.syncAll().catch(console.error)
    }
  }

  /** Stop the background sync loop. */
  stop(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer)
      this.syncTimer = null
    }
  }

  // ── Queue management ──

  /**
   * Add a request to the offline queue.
   */
  async queueRequest(
    method: OfflineQueueItem['method'],
    url: string,
    options?: {
      body?: unknown
      headers?: Record<string, string>
      description?: string
      projectId?: string
      priority?: number
      maxRetries?: number
    },
  ): Promise<void> {
    const item: OfflineQueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      method,
      url,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      headers: options?.headers,
      queuedAt: Date.now(),
      retryCount: 0,
      maxRetries: options?.maxRetries ?? 5,
      priority: options?.priority ?? 5,
      description: options?.description ?? `${method} ${url}`,
      projectId: options?.projectId,
    }

    await enqueueRequest(item)
    this._notifySyncStatus()
  }

  /**
   * Process all queued requests.
   */
  async syncAll(): Promise<void> {
    if (this.isSyncing || !this.isOnline) return

    this.isSyncing = true
    this.failedCount = 0
    this._notifySyncStatus()

    try {
      const items = await getQueuedRequests()

      for (const item of items) {
        try {
          await this._processQueueItem(item)
          await dequeueRequest(item.id)
        } catch (err) {
          console.error(`[OfflineSync] Failed to sync item ${item.id}:`, err)

          // Increment retry count
          item.retryCount++

          if (item.retryCount >= item.maxRetries) {
            // Drop the item after max retries
            await dequeueRequest(item.id)
            this.failedCount++
          } else {
            // Update with incremented retry count
            await enqueueRequest(item)
          }
        }
      }

      // Sync dirty projects
      await this._syncDirtyProjects()

      this.lastSyncAt = Date.now()
    } finally {
      this.isSyncing = false
      this._notifySyncStatus()
    }
  }

  // ── Status ──

  async getStatus(): Promise<SyncQueueStatus> {
    const pendingCount = await getQueueCount()
    return {
      pendingCount,
      isSyncing: this.isSyncing,
      lastSyncAt: this.lastSyncAt,
      failedCount: this.failedCount,
    }
  }

  // ── Event subscriptions ──

  onSyncStatus(listener: SyncStatusListener): () => void {
    this.syncListeners.push(listener)
    return () => {
      this.syncListeners = this.syncListeners.filter((l) => l !== listener)
    }
  }

  onNetworkStatus(listener: NetworkStatusListener): () => void {
    this.networkListeners.push(listener)
    return () => {
      this.networkListeners = this.networkListeners.filter((l) => l !== listener)
    }
  }

  // ── Internal ──

  private async _processQueueItem(item: OfflineQueueItem): Promise<void> {
    const fetchOptions: RequestInit = {
      method: item.method,
      headers: {
        'Content-Type': 'application/json',
        ...item.headers,
      },
    }

    if (item.body && item.method !== 'GET') {
      fetchOptions.body = item.body
    }

    const response = await fetch(item.url, fetchOptions)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
  }

  private async _syncDirtyProjects(): Promise<void> {
    try {
      const dirtyProjects = await getDirtyProjects()

      for (const project of dirtyProjects) {
        try {
          // Attempt to save to the server
          const response = await fetch(`/api/projects/${project.id}/state`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: project.state,
          })

          if (response.ok) {
            // Mark as synced
            project.isDirty = false
            project.lastSyncedAt = Date.now()
            await saveOfflineProject(project)
          }
        } catch {
          // Will retry on next sync cycle
        }
      }
    } catch (err) {
      console.error('[OfflineSync] Failed to sync dirty projects:', err)
    }
  }

  private _setNetworkStatus(status: NetworkStatus): void {
    const previousStatus = this.networkStatus
    this.networkStatus = status

    for (const listener of this.networkListeners) {
      try {
        listener(status)
      } catch (err) {
        console.error('[OfflineSync] Network listener error:', err)
      }
    }

    // Auto-sync when coming back online
    if (previousStatus === 'offline' && status === 'online') {
      this.syncAll().catch(console.error)
    }
  }

  private async _notifySyncStatus(): Promise<void> {
    const status = await this.getStatus()
    for (const listener of this.syncListeners) {
      try {
        listener(status)
      } catch (err) {
        console.error('[OfflineSync] Sync listener error:', err)
      }
    }
  }
}

/** Singleton instance */
let _syncManagerInstance: OfflineSyncManager | null = null

export function getOfflineSyncManager(): OfflineSyncManager {
  if (!_syncManagerInstance) {
    _syncManagerInstance = new OfflineSyncManager()
  }
  return _syncManagerInstance
}
