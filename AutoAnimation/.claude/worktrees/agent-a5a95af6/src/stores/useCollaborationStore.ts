import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  collaborationService,
  type CollaborationUser,
  type CollaborationMessage,
  type StatePatch,
  type CursorUpdate,
  type RoomInfo,
} from '@/services/collaborationService'
import { useTimelineStore } from './useTimelineStore'
import { useCanvasStore } from './useCanvasStore'
import { useTextOverlayStore } from './useTextOverlayStore'

// ── Types ────────────────────────────────────────────────────────────────

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error'

/** Peer representation used by collaboration UI */
export interface CollabPeer {
  peerId: string
  displayName: string
  color: string
  cursor: { x: number; y: number } | null
  selectedObjectId: string | null
}

interface CollaborationState {
  // Connection
  status: ConnectionStatus
  roomId: string | null
  errorMessage: string | null

  // Aliases used by CollaborationPanel / CollabCursors
  connectionStatus: ConnectionStatus
  sessionId: string | null
  peers: Record<string, CollabPeer>
  inviteLink: string | null
  error: string | null
  startSession: (config: unknown, sessionId?: string) => void
  endSession: () => void
  generateInviteLink: () => string

  // Local user
  localUserId: string
  localUserName: string
  localUserColor: string

  // Remote users
  users: CollaborationUser[]

  // Remote cursors (keyed by userId)
  remoteCursors: Record<string, CursorUpdate>

  // Suppress flag — when true, incoming patches should not be applied
  // (to avoid echo loops when we apply our own outgoing patches)
  suppressIncoming: boolean

  // Actions
  joinRoom: (roomId: string) => void
  leaveRoom: () => void
  setUserName: (name: string) => void
  setUserColor: (color: string) => void
  updateCursor: (x: number, y: number, canvasX: number, canvasY: number) => void
  broadcastStatePatch: (store: string, action: string, args: unknown[]) => void

  // Internal — called by message handler
  _handleMessage: (msg: CollaborationMessage) => void
  _cleanup: () => void
}

// ── Store ────────────────────────────────────────────────────────────────

let messageUnsubscribe: (() => void) | null = null

export const useCollaborationStore = create<CollaborationState>()(
  immer((set, get) => ({
    // Initial state
    status: 'disconnected',
    roomId: null,
    errorMessage: null,

    // Aliases for CollaborationPanel / CollabCursors
    connectionStatus: 'disconnected',
    sessionId: null,
    peers: {},
    inviteLink: null,
    error: null,
    startSession: (_config: unknown, _sessionId?: string) => {
      // Stub — delegates to joinRoom
    },
    endSession: () => {
      get().leaveRoom()
    },
    generateInviteLink: () => {
      const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      set((s) => {
        s.inviteLink = `${window.location.origin}?collab=${id}`
        s.sessionId = id
      })
      return id
    },

    localUserId: collaborationService.userId,
    localUserName: collaborationService.userName,
    localUserColor: collaborationService.userColor,

    users: [],
    remoteCursors: {},
    suppressIncoming: false,

    // ── Actions ────────────────────────────────────────────────────────

    joinRoom: (roomId: string) => {
      const state = get()
      if (state.roomId === roomId && state.status === 'connected') return

      // Clean up previous subscription
      if (messageUnsubscribe) {
        messageUnsubscribe()
        messageUnsubscribe = null
      }

      set((s) => {
        s.status = 'connecting'
        s.roomId = roomId
        s.errorMessage = null
        s.users = []
        s.remoteCursors = {}
      })

      // Subscribe to messages
      messageUnsubscribe = collaborationService.onMessage((msg) => {
        get()._handleMessage(msg)
      })

      // Connect
      collaborationService.connect(roomId)
    },

    leaveRoom: () => {
      if (messageUnsubscribe) {
        messageUnsubscribe()
        messageUnsubscribe = null
      }

      collaborationService.disconnect()

      set((s) => {
        s.status = 'disconnected'
        s.roomId = null
        s.users = []
        s.remoteCursors = {}
        s.errorMessage = null
      })
    },

    setUserName: (name: string) => {
      collaborationService.setUserName(name)
      set((s) => {
        s.localUserName = name
      })
    },

    setUserColor: (color: string) => {
      collaborationService.setUserColor(color)
      set((s) => {
        s.localUserColor = color
      })
    },

    updateCursor: (x: number, y: number, canvasX: number, canvasY: number) => {
      collaborationService.sendCursorUpdate(x, y, canvasX, canvasY)
    },

    broadcastStatePatch: (store: string, action: string, args: unknown[]) => {
      collaborationService.sendStatePatch({ store, action, args })
    },

    // ── Message Handler ──────────────────────────────────────────────

    _handleMessage: (msg: CollaborationMessage) => {
      switch (msg.type) {
        case 'presence': {
          const info = msg.payload as RoomInfo
          if (info?.users) {
            set((s) => {
              // Filter out local user from remote users list
              s.users = info.users.filter((u) => u.id !== collaborationService.userId)
            })
          }
          break
        }

        case 'room-info': {
          const info = msg.payload as { status?: string }
          if (info?.status === 'connected') {
            set((s) => {
              s.status = 'connected'
              s.errorMessage = null
            })
          } else if (info?.status === 'disconnected') {
            set((s) => {
              s.status = 'reconnecting'
            })
          }
          break
        }

        case 'join': {
          // A new user joined — update will come via presence broadcast
          break
        }

        case 'leave': {
          const userId = msg.userId
          if (userId) {
            set((s) => {
              s.users = s.users.filter((u) => u.id !== userId)
              delete s.remoteCursors[userId]
            })
          }
          break
        }

        case 'cursor': {
          const cursor = msg.payload as CursorUpdate
          if (cursor && cursor.userId !== collaborationService.userId) {
            set((s) => {
              s.remoteCursors[cursor.userId] = cursor
            })
          }
          break
        }

        case 'state-patch': {
          const patch = msg.payload as StatePatch
          if (!patch || patch.userId === collaborationService.userId) return

          // Apply the remote patch to local stores (last-write-wins)
          applyRemoteStatePatch(patch)
          break
        }

        case 'error': {
          const errPayload = msg.payload as { message?: string }
          set((s) => {
            s.status = 'error'
            s.errorMessage = errPayload?.message ?? 'Unknown collaboration error'
          })
          break
        }
      }
    },

    _cleanup: () => {
      if (messageUnsubscribe) {
        messageUnsubscribe()
        messageUnsubscribe = null
      }
      collaborationService.disconnect()
    },
  }))
)

// ── Remote Patch Application ─────────────────────────────────────────────
// Last-write-wins: we directly call the corresponding store action.
// Only a curated set of safe, non-destructive actions are forwarded.

const ALLOWED_PATCHES: Record<string, Set<string>> = {
  timeline: new Set([
    'seekToFrame',
    'setTotalFrames',
    'setFps',
    'setZoom',
    'addTrack',
    'removeTrack',
    'addClip',
    'removeClip',
    'updateClip',
  ]),
  canvas: new Set([
    'setCanvasDimensions',
    'setCanvasZoom',
    'setCanvasPan',
  ]),
  textOverlay: new Set([
    'addOverlay',
    'removeOverlay',
    'updateOverlay',
  ]),
}

function applyRemoteStatePatch(patch: StatePatch): void {
  const allowed = ALLOWED_PATCHES[patch.store]
  if (!allowed || !allowed.has(patch.action)) {
    console.warn(`[Collab] Ignoring disallowed patch: ${patch.store}.${patch.action}`)
    return
  }

  try {
    switch (patch.store) {
      case 'timeline': {
        const store = useTimelineStore.getState()
        const fn = (store as unknown as Record<string, unknown>)[patch.action]
        if (typeof fn === 'function') {
          ;(fn as (...a: unknown[]) => void)(...patch.args)
        }
        break
      }
      case 'canvas': {
        const store = useCanvasStore.getState()
        const fn = (store as unknown as Record<string, unknown>)[patch.action]
        if (typeof fn === 'function') {
          ;(fn as (...a: unknown[]) => void)(...patch.args)
        }
        break
      }
      case 'textOverlay': {
        const store = useTextOverlayStore.getState()
        const fn = (store as unknown as Record<string, unknown>)[patch.action]
        if (typeof fn === 'function') {
          ;(fn as (...a: unknown[]) => void)(...patch.args)
        }
        break
      }
    }
  } catch (e) {
    console.error(`[Collab] Failed to apply patch ${patch.store}.${patch.action}:`, e)
  }
}
