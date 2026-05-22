/**
 * Offline Status Bar
 *
 * A persistent banner that shows when the user is offline,
 * with sync status and available feature indicators.
 */

import { useEffect } from 'react'
import { useOfflineStore } from '@/stores/useOfflineStore'

export function OfflineStatusBar() {
  const {
    networkStatus,
    syncStatus,
    config,
    bannerDismissed,
    serviceWorkerActive,
    initialize,
    dismissBanner,
    forceSync,
  } = useOfflineStore()

  // Initialize offline support on mount
  useEffect(() => {
    if (config.enabled) {
      initialize().catch(console.error)
    }
  }, [config.enabled, initialize])

  // Don't show if online and no pending syncs, or banner dismissed
  if (networkStatus === 'online' && syncStatus.pendingCount === 0) return null
  if (!config.showStatusIndicator) return null
  if (bannerDismissed && networkStatus === 'online') return null

  const isOffline = networkStatus === 'offline'
  const hasPending = syncStatus.pendingCount > 0

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[10000] flex items-center justify-between px-4 py-1.5 text-xs transition-colors ${
        isOffline
          ? 'bg-yellow-600/90 text-yellow-50'
          : hasPending
            ? 'bg-blue-600/90 text-blue-50'
            : 'bg-green-600/90 text-green-50'
      }`}
    >
      <div className="flex items-center gap-2">
        {/* Status icon */}
        <div
          className={`w-2 h-2 rounded-full ${
            isOffline ? 'bg-yellow-300' : hasPending ? 'bg-blue-300 animate-pulse' : 'bg-green-300'
          }`}
        />

        {/* Status text */}
        {isOffline ? (
          <span>
            You are offline. Editing is available with cached assets.
            {serviceWorkerActive && ' Changes will sync when you reconnect.'}
          </span>
        ) : hasPending ? (
          <span>
            {syncStatus.isSyncing
              ? `Syncing ${syncStatus.pendingCount} pending changes...`
              : `${syncStatus.pendingCount} changes waiting to sync.`}
          </span>
        ) : (
          <span>All changes synced.</span>
        )}

        {/* Failed count */}
        {syncStatus.failedCount > 0 && (
          <span className="text-red-200">
            ({syncStatus.failedCount} failed)
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Force sync button */}
        {hasPending && !syncStatus.isSyncing && networkStatus === 'online' && (
          <button
            onClick={() => forceSync()}
            className="px-2 py-0.5 bg-white/20 hover:bg-white/30 rounded text-xs transition-colors"
          >
            Sync Now
          </button>
        )}

        {/* Dismiss button */}
        {!isOffline && (
          <button
            onClick={dismissBanner}
            className="px-1.5 py-0.5 hover:bg-white/20 rounded text-xs transition-colors"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  )
}
