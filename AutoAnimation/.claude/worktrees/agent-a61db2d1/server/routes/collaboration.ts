/**
 * Collaboration WebSocket Server
 *
 * Provides room-based real-time collaboration for ProAnimate projects.
 * Uses the `ws` package to upgrade HTTP connections to WebSocket.
 *
 * Features:
 *  - Room-based sessions (one room per project ID)
 *  - Presence tracking (connected users with names/colors)
 *  - Cursor position broadcasting
 *  - State patch relay (last-write-wins)
 *  - Automatic cleanup on disconnect
 */

import { WebSocketServer, WebSocket } from 'ws'
import type { Server as HttpServer } from 'http'
import type { IncomingMessage } from 'http'

// ── Types ────────────────────────────────────────────────────────────────

interface CollaborationUser {
  id: string
  name: string
  color: string
  cursorX: number
  cursorY: number
  lastSeen: number
}

interface CollaborationMessage {
  type: string
  roomId?: string
  userId?: string
  payload?: unknown
  timestamp: number
}

interface RoomClient {
  ws: WebSocket
  user: CollaborationUser
  roomId: string
}

// ── Room Management ──────────────────────────────────────────────────────

const rooms = new Map<string, Map<string, RoomClient>>() // roomId -> (userId -> client)

function getOrCreateRoom(roomId: string): Map<string, RoomClient> {
  let room = rooms.get(roomId)
  if (!room) {
    room = new Map()
    rooms.set(roomId, room)
    console.log(`[Collab] Room created: ${roomId}`)
  }
  return room
}

function removeFromRoom(roomId: string, userId: string): void {
  const room = rooms.get(roomId)
  if (!room) return

  room.delete(userId)
  console.log(`[Collab] User ${userId} left room ${roomId} (${room.size} remaining)`)

  // Broadcast updated presence to remaining clients
  broadcastPresence(roomId)

  // Clean up empty rooms
  if (room.size === 0) {
    rooms.delete(roomId)
    console.log(`[Collab] Room deleted (empty): ${roomId}`)
  }
}

function broadcastPresence(roomId: string): void {
  const room = rooms.get(roomId)
  if (!room) return

  const users: CollaborationUser[] = []
  for (const client of room.values()) {
    users.push({ ...client.user })
  }

  const msg: CollaborationMessage = {
    type: 'presence',
    roomId,
    payload: { roomId, users },
    timestamp: Date.now(),
  }

  const data = JSON.stringify(msg)
  for (const client of room.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data)
    }
  }
}

function broadcastToRoom(roomId: string, msg: CollaborationMessage, excludeUserId?: string): void {
  const room = rooms.get(roomId)
  if (!room) return

  const data = JSON.stringify(msg)
  for (const client of room.values()) {
    if (excludeUserId && client.user.id === excludeUserId) continue
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(data)
    }
  }
}

// ── WebSocket Server Setup ───────────────────────────────────────────────

export function setupCollaborationWebSocket(server: HttpServer): void {
  const wss = new WebSocketServer({ noServer: true })

  // Handle upgrade requests for /ws/collab path
  server.on('upgrade', (request: IncomingMessage, socket, head) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host}`)

    if (url.pathname === '/ws/collab') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request)
      })
    } else {
      // Not a collaboration WebSocket — destroy the socket
      socket.destroy()
    }
  })

  wss.on('connection', (ws: WebSocket, _request: IncomingMessage) => {
    let clientInfo: { roomId: string; userId: string } | null = null

    ws.on('message', (raw: Buffer) => {
      let msg: CollaborationMessage
      try {
        msg = JSON.parse(raw.toString())
      } catch {
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid JSON' },
          timestamp: Date.now(),
        }))
        return
      }

      switch (msg.type) {
        case 'join': {
          const roomId = msg.roomId
          const userId = msg.userId
          const payload = msg.payload as { name?: string; color?: string } | undefined

          if (!roomId || !userId) {
            ws.send(JSON.stringify({
              type: 'error',
              payload: { message: 'Missing roomId or userId in join message' },
              timestamp: Date.now(),
            }))
            return
          }

          // If already in a different room, leave it
          if (clientInfo && clientInfo.roomId !== roomId) {
            removeFromRoom(clientInfo.roomId, clientInfo.userId)
          }

          const room = getOrCreateRoom(roomId)

          const user: CollaborationUser = {
            id: userId,
            name: payload?.name ?? `User ${userId.slice(-4)}`,
            color: payload?.color ?? '#3b82f6',
            cursorX: 0,
            cursorY: 0,
            lastSeen: Date.now(),
          }

          // Update or add client
          const existingClient = room.get(userId)
          if (existingClient) {
            // Update existing — keep cursor position, update name/color
            existingClient.user.name = user.name
            existingClient.user.color = user.color
            existingClient.user.lastSeen = Date.now()
            existingClient.ws = ws
          } else {
            room.set(userId, { ws, user, roomId })
          }

          clientInfo = { roomId, userId }

          console.log(`[Collab] User ${user.name} (${userId}) joined room ${roomId} (${room.size} users)`)

          // Broadcast presence to all in room
          broadcastPresence(roomId)
          break
        }

        case 'leave': {
          if (clientInfo) {
            removeFromRoom(clientInfo.roomId, clientInfo.userId)

            // Broadcast leave event
            broadcastToRoom(clientInfo.roomId, {
              type: 'leave',
              roomId: clientInfo.roomId,
              userId: clientInfo.userId,
              timestamp: Date.now(),
            })

            clientInfo = null
          }
          break
        }

        case 'cursor': {
          if (!clientInfo) return
          const cursorPayload = msg.payload as {
            userId: string
            x: number
            y: number
            canvasX: number
            canvasY: number
          } | undefined

          if (!cursorPayload) return

          // Update stored cursor position
          const cursorRoom = rooms.get(clientInfo.roomId)
          const cursorClient = cursorRoom?.get(clientInfo.userId)
          if (cursorClient) {
            cursorClient.user.cursorX = cursorPayload.canvasX ?? 0
            cursorClient.user.cursorY = cursorPayload.canvasY ?? 0
            cursorClient.user.lastSeen = Date.now()
          }

          // Broadcast cursor to others in the room
          broadcastToRoom(clientInfo.roomId, msg, clientInfo.userId)
          break
        }

        case 'state-patch': {
          if (!clientInfo) return

          // Relay the state patch to all other clients in the room
          broadcastToRoom(clientInfo.roomId, msg, clientInfo.userId)
          break
        }

        default: {
          console.warn(`[Collab] Unknown message type: ${msg.type}`)
        }
      }
    })

    ws.on('close', () => {
      if (clientInfo) {
        // Broadcast leave to room before removing
        broadcastToRoom(clientInfo.roomId, {
          type: 'leave',
          roomId: clientInfo.roomId,
          userId: clientInfo.userId,
          timestamp: Date.now(),
        })
        removeFromRoom(clientInfo.roomId, clientInfo.userId)
        clientInfo = null
      }
    })

    ws.on('error', (err) => {
      console.error('[Collab] WebSocket error:', err.message)
    })
  })

  // Periodic cleanup: remove stale users (no message in 5 minutes)
  setInterval(() => {
    const staleThreshold = Date.now() - 5 * 60 * 1000
    for (const [roomId, room] of rooms) {
      for (const [userId, client] of room) {
        if (client.user.lastSeen < staleThreshold) {
          console.log(`[Collab] Removing stale user ${userId} from room ${roomId}`)
          if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.close(1000, 'Stale connection')
          }
          room.delete(userId)
        }
      }
      if (room.size === 0) {
        rooms.delete(roomId)
      }
    }
  }, 60_000)

  console.log('[Collab] WebSocket server initialized on /ws/collab')
}

/** Get current stats for health check */
export function getCollabStats(): { rooms: number; clients: number } {
  let clients = 0
  for (const room of rooms.values()) {
    clients += room.size
  }
  return { rooms: rooms.size, clients }
}
