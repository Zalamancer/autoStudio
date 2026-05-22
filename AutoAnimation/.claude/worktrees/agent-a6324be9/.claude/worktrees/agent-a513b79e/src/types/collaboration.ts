// ── Real-Time Collaboration Types ──

/** Unique identifier for a collaboration session */
export type CollabSessionId = string

/** Unique identifier for a connected peer */
export type CollabPeerId = string

/** User presence information broadcast to all peers */
export interface CollabPresence {
  peerId: CollabPeerId
  userId: string
  displayName: string
  avatarUrl?: string
  color: string
  /** Cursor position on the canvas (null when not hovering) */
  cursor: { x: number; y: number } | null
  /** Currently selected object ID (null when nothing selected) */
  selectedObjectId: string | null
  /** Currently active panel/tab */
  activePanel?: string
  /** Last activity timestamp */
  lastActive: number
}

/** A single operation in the CRDT change log */
export interface CollabOperation {
  id: string
  peerId: CollabPeerId
  timestamp: number
  /** The store that was modified */
  storeName: string
  /** JSON Merge Patch describing the change */
  patch: Record<string, unknown>
}

/** WebSocket message types */
export type CollabMessageType =
  | 'join'
  | 'leave'
  | 'presence-update'
  | 'state-sync'
  | 'operation'
  | 'ack'
  | 'error'
  | 'request-state'

/** Base WebSocket message */
export interface CollabMessage {
  type: CollabMessageType
  sessionId: CollabSessionId
  peerId: CollabPeerId
  timestamp: number
}

/** Join session message */
export interface CollabJoinMessage extends CollabMessage {
  type: 'join'
  projectId: string
  presence: CollabPresence
}

/** Leave session message */
export interface CollabLeaveMessage extends CollabMessage {
  type: 'leave'
}

/** Presence update (cursor, selection) */
export interface CollabPresenceMessage extends CollabMessage {
  type: 'presence-update'
  presence: Partial<CollabPresence>
}

/** Full state sync (sent to new joiners) */
export interface CollabStateSyncMessage extends CollabMessage {
  type: 'state-sync'
  stateSnapshot: Record<string, unknown>
  vectorClock: Record<string, number>
}

/** Incremental operation message */
export interface CollabOperationMessage extends CollabMessage {
  type: 'operation'
  operation: CollabOperation
  vectorClock: Record<string, number>
}

/** Acknowledgment message */
export interface CollabAckMessage extends CollabMessage {
  type: 'ack'
  operationId: string
}

/** Error message */
export interface CollabErrorMessage extends CollabMessage {
  type: 'error'
  code: string
  message: string
}

/** Request full state from host */
export interface CollabRequestStateMessage extends CollabMessage {
  type: 'request-state'
}

/** Union of all collab message types */
export type AnyCollabMessage =
  | CollabJoinMessage
  | CollabLeaveMessage
  | CollabPresenceMessage
  | CollabStateSyncMessage
  | CollabOperationMessage
  | CollabAckMessage
  | CollabErrorMessage
  | CollabRequestStateMessage

/** Collab connection status */
export type CollabConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

/** Conflict resolution strategy */
export type ConflictStrategy = 'last-write-wins' | 'merge' | 'manual'

/** Configuration for a collaboration session */
export interface CollabConfig {
  /** WebSocket server URL */
  serverUrl: string
  /** Project ID to collaborate on */
  projectId: string
  /** Current user info */
  user: {
    id: string
    displayName: string
    avatarUrl?: string
  }
  /** Conflict resolution strategy */
  conflictStrategy: ConflictStrategy
  /** Heartbeat interval in ms (default 5000) */
  heartbeatInterval?: number
  /** Reconnect delay in ms (default 2000) */
  reconnectDelay?: number
  /** Max reconnect attempts (default 5) */
  maxReconnectAttempts?: number
}
