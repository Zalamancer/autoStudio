/**
 * Collaboration Service — WebSocket client for real-time collaborative editing.
 *
 * Connects to the Express server's WebSocket endpoint and handles:
 *  - Presence (who's online, cursor positions)
 *  - State patches (last-write-wins broadcast of Zustand store diffs)
 *  - Room/session management (one room per project)
 */

// ── Types ────────────────────────────────────────────────────────────────

export interface CollaborationUser {
  id: string
  name: string
  color: string
  cursorX: number
  cursorY: number
  lastSeen: number
}

export type CollaborationMessageType =
  | 'join'
  | 'leave'
  | 'cursor'
  | 'state-patch'
  | 'presence'
  | 'room-info'
  | 'error'

export interface CollaborationMessage {
  type: CollaborationMessageType
  roomId?: string
  userId?: string
  payload?: unknown
  timestamp: number
}

export interface StatePatch {
  store: string // e.g. 'timeline', 'canvas', 'textOverlay'
  action: string // e.g. 'seekToFrame', 'addTextOverlay'
  args: unknown[]
  userId: string
  timestamp: number
}

export interface CursorUpdate {
  userId: string
  x: number
  y: number
  // Normalized 0-1 coordinates relative to canvas
  canvasX: number
  canvasY: number
}

export interface RoomInfo {
  roomId: string
  users: CollaborationUser[]
}

// ── User Colors ──────────────────────────────────────────────────────────

const USER_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f59e0b', // amber
]

function getRandomColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
}

function generateUserId(): string {
  return `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function generateUserName(): string {
  const adjectives = ['Swift', 'Bold', 'Clever', 'Bright', 'Calm', 'Deft', 'Eager', 'Fair', 'Keen', 'Vivid']
  const nouns = ['Fox', 'Owl', 'Bear', 'Hawk', 'Wolf', 'Lynx', 'Raven', 'Crane', 'Otter', 'Finch']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  return `${adj} ${noun}`
}

// ── Collaboration Service ────────────────────────────────────────────────

type MessageHandler = (msg: CollaborationMessage) => void

class CollaborationService {
  private ws: WebSocket | null = null
  private roomId: string | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private baseReconnectDelay = 1000
  private handlers: Set<MessageHandler> = new Set()
  private cursorThrottleTimer: ReturnType<typeof setTimeout> | null = null
  private pendingCursor: CursorUpdate | null = null

  // Local user identity
  userId: string
  userName: string
  userColor: string

  constructor() {
    this.userId = generateUserId()
    this.userName = generateUserName()
    this.userColor = getRandomColor()
  }

  /** Subscribe to incoming messages */
  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  private emit(msg: CollaborationMessage) {
    for (const handler of this.handlers) {
      try {
        handler(msg)
      } catch (e) {
        console.error('[Collab] Handler error:', e)
      }
    }
  }

  /** Derive WebSocket URL from current page location */
  private getWsUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    // In development, the Vite proxy forwards /api to localhost:3001
    // We connect directly to the backend for WebSocket
    const isDev = import.meta.env.DEV
    const host = isDev ? 'localhost:3001' : window.location.host
    return `${protocol}//${host}/ws/collab`
  }

  /** Connect to a collaboration room (one room per project) */
  connect(roomId: string): void {
    if (this.ws && this.roomId === roomId) return // Already connected to this room

    this.disconnect() // Clean up any existing connection
    this.roomId = roomId
    this.reconnectAttempts = 0

    this.doConnect()
  }

  private doConnect(): void {
    if (!this.roomId) return

    try {
      const url = this.getWsUrl()
      this.ws = new WebSocket(url)

      this.ws.onopen = () => {
        console.log(`[Collab] Connected to room: ${this.roomId}`)
        this.reconnectAttempts = 0

        // Send join message
        this.send({
          type: 'join',
          roomId: this.roomId!,
          userId: this.userId,
          payload: {
            name: this.userName,
            color: this.userColor,
          },
          timestamp: Date.now(),
        })

        this.emit({
          type: 'room-info',
          roomId: this.roomId!,
          payload: { status: 'connected' },
          timestamp: Date.now(),
        })
      }

      this.ws.onmessage = (event) => {
        try {
          const msg: CollaborationMessage = JSON.parse(event.data as string)
          this.emit(msg)
        } catch (e) {
          console.error('[Collab] Failed to parse message:', e)
        }
      }

      this.ws.onclose = (event) => {
        console.log(`[Collab] Disconnected (code: ${event.code})`)
        this.ws = null

        this.emit({
          type: 'room-info',
          payload: { status: 'disconnected' },
          timestamp: Date.now(),
        })

        // Attempt reconnection if not intentionally closed
        if (event.code !== 1000 && this.roomId) {
          this.scheduleReconnect()
        }
      }

      this.ws.onerror = (error) => {
        console.error('[Collab] WebSocket error:', error)
      }
    } catch (e) {
      console.error('[Collab] Connection failed:', e)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[Collab] Max reconnect attempts reached')
      this.emit({
        type: 'error',
        payload: { message: 'Unable to reconnect. Please try again later.' },
        timestamp: Date.now(),
      })
      return
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts)
    this.reconnectAttempts++

    console.log(`[Collab] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`)
    this.reconnectTimer = setTimeout(() => this.doConnect(), delay)
  }

  /** Disconnect from the current room */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      // Send leave before closing
      if (this.ws.readyState === WebSocket.OPEN) {
        this.send({
          type: 'leave',
          roomId: this.roomId ?? undefined,
          userId: this.userId,
          timestamp: Date.now(),
        })
      }
      this.ws.close(1000, 'User disconnected')
      this.ws = null
    }

    this.roomId = null
  }

  /** Send a message over the WebSocket */
  private send(msg: CollaborationMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg))
    }
  }

  /** Broadcast a cursor position update (throttled to ~30fps) */
  sendCursorUpdate(x: number, y: number, canvasX: number, canvasY: number): void {
    this.pendingCursor = { userId: this.userId, x, y, canvasX, canvasY }

    if (!this.cursorThrottleTimer) {
      this.cursorThrottleTimer = setTimeout(() => {
        if (this.pendingCursor) {
          this.send({
            type: 'cursor',
            roomId: this.roomId ?? undefined,
            userId: this.userId,
            payload: this.pendingCursor,
            timestamp: Date.now(),
          })
          this.pendingCursor = null
        }
        this.cursorThrottleTimer = null
      }, 33) // ~30fps
    }
  }

  /** Broadcast a state patch (store mutation) to all collaborators */
  sendStatePatch(patch: Omit<StatePatch, 'userId' | 'timestamp'>): void {
    this.send({
      type: 'state-patch',
      roomId: this.roomId ?? undefined,
      userId: this.userId,
      payload: {
        ...patch,
        userId: this.userId,
        timestamp: Date.now(),
      } satisfies StatePatch,
      timestamp: Date.now(),
    })
  }

  /** Update local user profile */
  setUserName(name: string): void {
    this.userName = name
    // Broadcast updated profile
    if (this.ws?.readyState === WebSocket.OPEN && this.roomId) {
      this.send({
        type: 'join',
        roomId: this.roomId,
        userId: this.userId,
        payload: {
          name: this.userName,
          color: this.userColor,
        },
        timestamp: Date.now(),
      })
    }
  }

  setUserColor(color: string): void {
    this.userColor = color
    if (this.ws?.readyState === WebSocket.OPEN && this.roomId) {
      this.send({
        type: 'join',
        roomId: this.roomId,
        userId: this.userId,
        payload: {
          name: this.userName,
          color: this.userColor,
        },
        timestamp: Date.now(),
      })
    }
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  get currentRoomId(): string | null {
    return this.roomId
  }
}

// ── Singleton ────────────────────────────────────────────────────────────

export const collaborationService = new CollaborationService()
