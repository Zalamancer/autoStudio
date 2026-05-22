/**
 * Real-Time Collaboration Client
 *
 * WebSocket-based CRDT client that syncs Zustand store state across
 * multiple connected peers. Uses a vector clock for causal ordering
 * and JSON Merge Patches for incremental updates.
 */

import type {
  CollabConfig,
  CollabConnectionStatus,
  CollabPresence,
  CollabOperation,
  CollabPeerId,
  CollabSessionId,
  AnyCollabMessage,
  CollabJoinMessage,
  CollabPresenceMessage,
  CollabOperationMessage,
  CollabStateSyncMessage,
} from '@/types/collaboration'

// Deterministic peer colors for up to 12 users
const PEER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
  '#f43f5e', '#14b8a6', '#a855f7', '#6366f1',
]

type MessageHandler = (msg: AnyCollabMessage) => void
type StatusHandler = (status: CollabConnectionStatus) => void
type PresenceHandler = (peers: Map<CollabPeerId, CollabPresence>) => void

export class CollabClient {
  private ws: WebSocket | null = null
  private config: CollabConfig
  private peerId: CollabPeerId
  private sessionId: CollabSessionId = ''
  private vectorClock: Record<string, number> = {}
  private peers: Map<CollabPeerId, CollabPresence> = new Map()
  private pendingOps: Map<string, CollabOperation> = new Map()
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null

  // Event handlers
  private onMessageHandlers: MessageHandler[] = []
  private onStatusHandlers: StatusHandler[] = []
  private onPresenceHandlers: PresenceHandler[] = []

  private _status: CollabConnectionStatus = 'disconnected'

  constructor(config: CollabConfig) {
    this.config = config
    this.peerId = `peer_${config.user.id}_${Date.now().toString(36)}`
    this.vectorClock[this.peerId] = 0
  }

  get status(): CollabConnectionStatus {
    return this._status
  }

  get connectedPeers(): Map<CollabPeerId, CollabPresence> {
    return new Map(this.peers)
  }

  get localPeerId(): CollabPeerId {
    return this.peerId
  }

  // ── Connection management ──

  connect(sessionId: CollabSessionId): void {
    this.sessionId = sessionId
    this._setStatus('connecting')

    try {
      this.ws = new WebSocket(this.config.serverUrl)

      this.ws.onopen = () => {
        this._setStatus('connected')
        this.reconnectAttempts = 0
        this._sendJoin()
        this._startHeartbeat()
      }

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data as string) as AnyCollabMessage
          this._handleMessage(msg)
        } catch (err) {
          console.error('[CollabClient] Failed to parse message:', err)
        }
      }

      this.ws.onclose = () => {
        this._stopHeartbeat()
        if (this._status !== 'disconnected') {
          this._attemptReconnect()
        }
      }

      this.ws.onerror = (err) => {
        console.error('[CollabClient] WebSocket error:', err)
        this._setStatus('error')
      }
    } catch (err) {
      console.error('[CollabClient] Failed to connect:', err)
      this._setStatus('error')
    }
  }

  disconnect(): void {
    this._setStatus('disconnected')
    this._stopHeartbeat()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this._send({
        type: 'leave',
        sessionId: this.sessionId,
        peerId: this.peerId,
        timestamp: Date.now(),
      })
      this.ws.close()
      this.ws = null
    }

    this.peers.clear()
    this._notifyPresence()
  }

  // ── Sending operations ──

  sendOperation(storeName: string, patch: Record<string, unknown>): void {
    this.vectorClock[this.peerId] = (this.vectorClock[this.peerId] || 0) + 1

    const operation: CollabOperation = {
      id: `op_${this.peerId}_${this.vectorClock[this.peerId]}`,
      peerId: this.peerId,
      timestamp: Date.now(),
      storeName,
      patch,
    }

    this.pendingOps.set(operation.id, operation)

    const msg: CollabOperationMessage = {
      type: 'operation',
      sessionId: this.sessionId,
      peerId: this.peerId,
      timestamp: Date.now(),
      operation,
      vectorClock: { ...this.vectorClock },
    }

    this._send(msg)
  }

  updatePresence(update: Partial<CollabPresence>): void {
    const msg: CollabPresenceMessage = {
      type: 'presence-update',
      sessionId: this.sessionId,
      peerId: this.peerId,
      timestamp: Date.now(),
      presence: update,
    }

    this._send(msg)
  }

  sendStateSync(stateSnapshot: Record<string, unknown>): void {
    const msg: CollabStateSyncMessage = {
      type: 'state-sync',
      sessionId: this.sessionId,
      peerId: this.peerId,
      timestamp: Date.now(),
      stateSnapshot,
      vectorClock: { ...this.vectorClock },
    }

    this._send(msg)
  }

  // ── Event subscription ──

  onMessage(handler: MessageHandler): () => void {
    this.onMessageHandlers.push(handler)
    return () => {
      this.onMessageHandlers = this.onMessageHandlers.filter((h) => h !== handler)
    }
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.onStatusHandlers.push(handler)
    return () => {
      this.onStatusHandlers = this.onStatusHandlers.filter((h) => h !== handler)
    }
  }

  onPresenceChange(handler: PresenceHandler): () => void {
    this.onPresenceHandlers.push(handler)
    return () => {
      this.onPresenceHandlers = this.onPresenceHandlers.filter((h) => h !== handler)
    }
  }

  // ── Internal methods ──

  private _send(msg: AnyCollabMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  private _sendJoin(): void {
    const colorIndex = Math.abs(hashString(this.peerId)) % PEER_COLORS.length
    const presence: CollabPresence = {
      peerId: this.peerId,
      userId: this.config.user.id,
      displayName: this.config.user.displayName,
      avatarUrl: this.config.user.avatarUrl,
      color: PEER_COLORS[colorIndex],
      cursor: null,
      selectedObjectId: null,
      lastActive: Date.now(),
    }

    const msg: CollabJoinMessage = {
      type: 'join',
      sessionId: this.sessionId,
      peerId: this.peerId,
      timestamp: Date.now(),
      projectId: this.config.projectId,
      presence,
    }

    this._send(msg)
  }

  private _handleMessage(msg: AnyCollabMessage): void {
    switch (msg.type) {
      case 'join':
        this.peers.set(msg.peerId, (msg as CollabJoinMessage).presence)
        this._notifyPresence()
        break

      case 'leave':
        this.peers.delete(msg.peerId)
        this._notifyPresence()
        break

      case 'presence-update': {
        const existing = this.peers.get(msg.peerId)
        if (existing) {
          const presenceMsg = msg as CollabPresenceMessage
          Object.assign(existing, presenceMsg.presence, { lastActive: Date.now() })
          this._notifyPresence()
        }
        break
      }

      case 'state-sync': {
        const syncMsg = msg as CollabStateSyncMessage
        this._mergeVectorClock(syncMsg.vectorClock)
        break
      }

      case 'operation': {
        const opMsg = msg as CollabOperationMessage
        if (opMsg.peerId !== this.peerId) {
          this._mergeVectorClock(opMsg.vectorClock)
        }
        break
      }

      case 'ack': {
        const ackMsg = msg as { operationId: string }
        this.pendingOps.delete(ackMsg.operationId)
        break
      }

      case 'error':
        console.error('[CollabClient] Server error:', (msg as { message: string }).message)
        break
    }

    // Broadcast to all message handlers
    for (const handler of this.onMessageHandlers) {
      try {
        handler(msg)
      } catch (err) {
        console.error('[CollabClient] Message handler error:', err)
      }
    }
  }

  private _mergeVectorClock(remote: Record<string, number>): void {
    for (const [peer, clock] of Object.entries(remote)) {
      this.vectorClock[peer] = Math.max(this.vectorClock[peer] || 0, clock)
    }
  }

  private _setStatus(status: CollabConnectionStatus): void {
    this._status = status
    for (const handler of this.onStatusHandlers) {
      try {
        handler(status)
      } catch (err) {
        console.error('[CollabClient] Status handler error:', err)
      }
    }
  }

  private _notifyPresence(): void {
    for (const handler of this.onPresenceHandlers) {
      try {
        handler(new Map(this.peers))
      } catch (err) {
        console.error('[CollabClient] Presence handler error:', err)
      }
    }
  }

  private _attemptReconnect(): void {
    const maxAttempts = this.config.maxReconnectAttempts ?? 5
    const delay = this.config.reconnectDelay ?? 2000

    if (this.reconnectAttempts >= maxAttempts) {
      this._setStatus('error')
      return
    }

    this._setStatus('reconnecting')
    this.reconnectAttempts++

    const backoff = delay * Math.pow(1.5, this.reconnectAttempts - 1)
    this.reconnectTimer = setTimeout(() => {
      this.connect(this.sessionId)
    }, backoff)
  }

  private _startHeartbeat(): void {
    const interval = this.config.heartbeatInterval ?? 5000
    this.heartbeatTimer = setInterval(() => {
      this.updatePresence({ lastActive: Date.now() })
    }, interval)
  }

  private _stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }
}

/** Simple string hash for deterministic color assignment */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash
}
