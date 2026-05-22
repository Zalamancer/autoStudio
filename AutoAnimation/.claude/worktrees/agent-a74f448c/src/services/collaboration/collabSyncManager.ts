/**
 * Collaboration Sync Manager
 *
 * Bridges the CollabClient WebSocket layer with Zustand stores.
 * Listens for remote operations and applies them to local stores,
 * and intercepts local store changes to broadcast to peers.
 *
 * Uses JSON Merge Patches (RFC 7396) for incremental state updates.
 */

import { CollabClient } from './collabClient'
import type {
  CollabConfig,
  CollabConnectionStatus,
  CollabPresence,
  CollabPeerId,
  AnyCollabMessage,
  CollabOperationMessage,
  CollabStateSyncMessage,
} from '@/types/collaboration'

/** Stores that are synced in collab mode (add more as needed) */
export const SYNCED_STORES = [
  'textOverlayStore',
  'shapeStore',
  'timelineStore',
  'canvasStore',
  'mediaStore',
  'svgObjectStore',
  'keyframeStore',
] as const

export type SyncedStoreName = (typeof SYNCED_STORES)[number]

type StoreGetter = () => Record<string, unknown>
type StorePatcher = (patch: Record<string, unknown>) => void

interface StoreBinding {
  getName: () => SyncedStoreName
  getState: StoreGetter
  applyPatch: StorePatcher
  unsubscribe?: () => void
}

export class CollabSyncManager {
  private client: CollabClient
  private bindings: Map<SyncedStoreName, StoreBinding> = new Map()
  private isApplyingRemote = false
  private statusListeners: Array<(status: CollabConnectionStatus) => void> = []
  private presenceListeners: Array<(peers: Map<CollabPeerId, CollabPresence>) => void> = []

  constructor(config: CollabConfig) {
    this.client = new CollabClient(config)

    // Wire up client events
    this.client.onMessage((msg) => this._handleRemoteMessage(msg))
    this.client.onStatusChange((status) => {
      for (const listener of this.statusListeners) {
        listener(status)
      }
    })
    this.client.onPresenceChange((peers) => {
      for (const listener of this.presenceListeners) {
        listener(peers)
      }
    })
  }

  get status(): CollabConnectionStatus {
    return this.client.status
  }

  get localPeerId(): CollabPeerId {
    return this.client.localPeerId
  }

  get connectedPeers(): Map<CollabPeerId, CollabPresence> {
    return this.client.connectedPeers
  }

  // ── Lifecycle ──

  /**
   * Start a collaboration session. Connects WebSocket and begins syncing.
   */
  startSession(sessionId: string): void {
    this.client.connect(sessionId)
  }

  /**
   * End the collaboration session. Disconnects and stops syncing.
   */
  endSession(): void {
    // Unsubscribe from all store listeners
    for (const binding of this.bindings.values()) {
      binding.unsubscribe?.()
    }
    this.client.disconnect()
  }

  // ── Store binding ──

  /**
   * Register a Zustand store for bidirectional sync.
   *
   * @param name     - Unique store name used in collab protocol
   * @param getState - Function returning the store's current state (serializable subset)
   * @param applyPatch - Function that applies a JSON merge patch to the store
   * @param subscribe - Function that subscribes to store changes, returns unsubscribe
   */
  bindStore(
    name: SyncedStoreName,
    getState: StoreGetter,
    applyPatch: StorePatcher,
    subscribe: (listener: () => void) => () => void,
  ): void {
    // Subscribe to local changes
    let previousState = JSON.stringify(getState())

    const unsub = subscribe(() => {
      // Skip broadcasting if we're applying a remote patch
      if (this.isApplyingRemote) return

      const currentState = JSON.stringify(getState())
      if (currentState === previousState) return

      const current = getState()
      const prev = JSON.parse(previousState) as Record<string, unknown>
      const patch = computeMergePatch(prev, current)

      if (patch && Object.keys(patch).length > 0) {
        this.client.sendOperation(name, patch)
      }

      previousState = currentState
    })

    const binding: StoreBinding = {
      getName: () => name,
      getState,
      applyPatch,
      unsubscribe: unsub,
    }

    this.bindings.set(name, binding)
  }

  // ── Presence ──

  updateCursor(x: number, y: number): void {
    this.client.updatePresence({ cursor: { x, y } })
  }

  clearCursor(): void {
    this.client.updatePresence({ cursor: null })
  }

  updateSelection(objectId: string | null): void {
    this.client.updatePresence({ selectedObjectId: objectId })
  }

  // ── Event subscriptions ──

  onStatusChange(handler: (status: CollabConnectionStatus) => void): () => void {
    this.statusListeners.push(handler)
    return () => {
      this.statusListeners = this.statusListeners.filter((h) => h !== handler)
    }
  }

  onPresenceChange(handler: (peers: Map<CollabPeerId, CollabPresence>) => void): () => void {
    this.presenceListeners.push(handler)
    return () => {
      this.presenceListeners = this.presenceListeners.filter((h) => h !== handler)
    }
  }

  // ── Internal ──

  private _handleRemoteMessage(msg: AnyCollabMessage): void {
    switch (msg.type) {
      case 'operation':
        this._applyRemoteOperation(msg as CollabOperationMessage)
        break

      case 'state-sync':
        this._applyStateSync(msg as CollabStateSyncMessage)
        break

      case 'request-state':
        this._sendFullState()
        break
    }
  }

  private _applyRemoteOperation(msg: CollabOperationMessage): void {
    if (msg.peerId === this.localPeerId) return

    const { storeName, patch } = msg.operation
    const binding = this.bindings.get(storeName as SyncedStoreName)

    if (!binding) {
      console.warn(`[CollabSync] No binding for store: ${storeName}`)
      return
    }

    // Apply patch while suppressing local broadcast
    this.isApplyingRemote = true
    try {
      binding.applyPatch(patch)
    } finally {
      this.isApplyingRemote = false
    }
  }

  private _applyStateSync(msg: CollabStateSyncMessage): void {
    if (msg.peerId === this.localPeerId) return

    this.isApplyingRemote = true
    try {
      for (const [storeName, state] of Object.entries(msg.stateSnapshot)) {
        const binding = this.bindings.get(storeName as SyncedStoreName)
        if (binding && state && typeof state === 'object') {
          binding.applyPatch(state as Record<string, unknown>)
        }
      }
    } finally {
      this.isApplyingRemote = false
    }
  }

  private _sendFullState(): void {
    const snapshot: Record<string, unknown> = {}
    for (const [name, binding] of this.bindings) {
      snapshot[name] = binding.getState()
    }
    this.client.sendStateSync(snapshot)
  }
}

/**
 * Compute a JSON Merge Patch (RFC 7396) between two objects.
 * Returns null if there are no differences.
 */
function computeMergePatch(
  prev: Record<string, unknown>,
  current: Record<string, unknown>,
): Record<string, unknown> | null {
  const patch: Record<string, unknown> = {}
  let hasDiff = false

  // Keys in current that are new or changed
  for (const key of Object.keys(current)) {
    const prevVal = prev[key]
    const curVal = current[key]

    if (prevVal === curVal) continue

    if (
      typeof prevVal === 'object' && prevVal !== null &&
      typeof curVal === 'object' && curVal !== null &&
      !Array.isArray(prevVal) && !Array.isArray(curVal)
    ) {
      const nestedPatch = computeMergePatch(
        prevVal as Record<string, unknown>,
        curVal as Record<string, unknown>,
      )
      if (nestedPatch) {
        patch[key] = nestedPatch
        hasDiff = true
      }
    } else {
      patch[key] = curVal
      hasDiff = true
    }
  }

  // Keys in prev that are removed
  for (const key of Object.keys(prev)) {
    if (!(key in current)) {
      patch[key] = null
      hasDiff = true
    }
  }

  return hasDiff ? patch : null
}
