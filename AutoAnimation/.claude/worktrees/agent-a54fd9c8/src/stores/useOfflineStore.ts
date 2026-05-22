/**
 * Offline Support Store
 *
 * Zustand store managing offline state: network status, sync queue,
 * cached projects, and feature availability.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import type {
  NetworkStatus,
  SyncQueueStatus,
  OfflineProject,
  OfflineConfig,
} from '@/types/offline'
import { OFFLINE_FEATURE_MAP } from '@/types/offline'
import { getOfflineSyncManager } from '@/services/offlineSyncManager'
import {
  listOfflineProjects,
  saveOfflineProject,
  deleteOfflineProject,
  getOfflineStorageUsage,
} from '@/services/offlineStorage'

interface OfflineState {
  /** Current network status */
  networkStatus: NetworkStatus

  /** Sync queue status */
  syncStatus: SyncQueueStatus

  /** Projects available offline */
  offlineProjects: OfflineProject[]

  /** Storage usage in bytes */
  storageUsageBytes: number

  /** Offline configuration */
  config: OfflineConfig

  /** Whether the service worker is registered */
  serviceWorkerActive: boolean

  /** Whether the offline status banner is dismissed */
  bannerDismissed: boolean
}

interface OfflineActions {
  /** Initialize offline support (register SW, start sync) */
  initialize: () => Promise<void>

  /** Save the current project for offline access */
  saveProjectOffline: (project: OfflineProject) => Promise<void>

  /** Remove a project from offline storage */
  removeProjectOffline: (id: string) => Promise<void>

  /** Refresh the list of offline projects */
  refreshOfflineProjects: () => Promise<void>

  /** Force a sync now */
  forceSync: () => Promise<void>

  /** Check if a feature is available in the current network state */
  isFeatureAvailable: (feature: string) => boolean

  /** Update offline configuration */
  updateConfig: (updates: Partial<OfflineConfig>) => void

  /** Dismiss the offline banner */
  dismissBanner: () => void

  /** Reset store */
  reset: () => void
}

const DEFAULT_CONFIG: OfflineConfig = {
  enabled: true,
  maxStorageMB: 500,
  aggressiveCache: false,
  syncRetryInterval: 30000,
  showStatusIndicator: true,
}

export const useOfflineStore = create<OfflineState & OfflineActions>()(
  persist(
    immer((set, get) => ({
      // Initial state
      networkStatus: (typeof navigator !== 'undefined' && navigator.onLine) ? 'online' : 'offline',
      syncStatus: {
        pendingCount: 0,
        isSyncing: false,
        lastSyncAt: null,
        failedCount: 0,
      },
      offlineProjects: [],
      storageUsageBytes: 0,
      config: DEFAULT_CONFIG,
      serviceWorkerActive: false,
      bannerDismissed: false,

      initialize: async () => {
        const syncManager = getOfflineSyncManager()

        // Listen for network status changes
        syncManager.onNetworkStatus((status) => {
          set((state) => {
            state.networkStatus = status
            state.bannerDismissed = false // Show banner on status change
          })
        })

        // Listen for sync status changes
        syncManager.onSyncStatus((status) => {
          set((state) => {
            state.syncStatus = status
          })
        })

        // Start background sync
        const { config } = get()
        if (config.enabled) {
          syncManager.start(config.syncRetryInterval)
        }

        // Register service worker
        if ('serviceWorker' in navigator && config.enabled) {
          try {
            const registration = await navigator.serviceWorker.register('/sw.js')
            set((state) => {
              state.serviceWorkerActive = true
            })
            console.log('[Offline] Service worker registered:', registration.scope)
          } catch (err) {
            console.warn('[Offline] Service worker registration failed:', err)
          }
        }

        // Load offline projects
        await get().refreshOfflineProjects()

        // Check storage usage
        try {
          const usage = await getOfflineStorageUsage()
          set((state) => {
            state.storageUsageBytes = usage
          })
        } catch {
          // Storage estimate not available
        }
      },

      saveProjectOffline: async (project: OfflineProject) => {
        await saveOfflineProject(project)
        await get().refreshOfflineProjects()
      },

      removeProjectOffline: async (id: string) => {
        await deleteOfflineProject(id)
        await get().refreshOfflineProjects()
      },

      refreshOfflineProjects: async () => {
        try {
          const projects = await listOfflineProjects()
          set((state) => {
            state.offlineProjects = projects
          })
        } catch (err) {
          console.error('[Offline] Failed to list offline projects:', err)
        }
      },

      forceSync: async () => {
        const syncManager = getOfflineSyncManager()
        await syncManager.syncAll()
      },

      isFeatureAvailable: (feature: string): boolean => {
        const { networkStatus } = get()
        if (networkStatus === 'online') return true

        return OFFLINE_FEATURE_MAP[feature] ?? false
      },

      updateConfig: (updates: Partial<OfflineConfig>) => {
        set((state) => {
          Object.assign(state.config, updates)
        })

        // Restart sync manager with new settings if needed
        const syncManager = getOfflineSyncManager()
        const { config } = get()
        syncManager.stop()
        if (config.enabled) {
          syncManager.start(config.syncRetryInterval)
        }
      },

      dismissBanner: () => {
        set((state) => {
          state.bannerDismissed = true
        })
      },

      reset: () => {
        const syncManager = getOfflineSyncManager()
        syncManager.stop()

        set((state) => {
          state.networkStatus = navigator.onLine ? 'online' : 'offline'
          state.syncStatus = {
            pendingCount: 0,
            isSyncing: false,
            lastSyncAt: null,
            failedCount: 0,
          }
          state.offlineProjects = []
          state.storageUsageBytes = 0
          state.config = DEFAULT_CONFIG
          state.serviceWorkerActive = false
          state.bannerDismissed = false
        })
      },
    })),
    {
      name: 'proanimate-offline-config',
      partialize: (state) => ({
        config: state.config,
      }),
    },
  )
)
