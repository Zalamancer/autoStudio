/**
 * Collaboration Panel
 *
 * UI for managing real-time collaboration sessions: start/join sessions,
 * view connected peers with their cursors and selections, share invite links.
 */

import { useState } from 'react'
import { useCollaborationStore, type CollabPeer } from '@/stores/useCollaborationStore'
import type { CollabConnectionStatus } from '@/types/collaboration'

const STATUS_LABELS: Record<CollabConnectionStatus, string> = {
  disconnected: 'Disconnected',
  connecting: 'Connecting...',
  connected: 'Connected',
  reconnecting: 'Reconnecting...',
  error: 'Connection Error',
}

const STATUS_COLORS: Record<CollabConnectionStatus, string> = {
  disconnected: 'bg-gray-500',
  connecting: 'bg-yellow-500',
  connected: 'bg-green-500',
  reconnecting: 'bg-yellow-500',
  error: 'bg-red-500',
}

export function CollaborationPanel() {
  const {
    connectionStatus,
    sessionId,
    peers,
    inviteLink,
    error,
    startSession,
    endSession,
    generateInviteLink,
  } = useCollaborationStore()

  const [joinCode, setJoinCode] = useState('')
  const [copied, setCopied] = useState(false)

  const peerList = Object.values(peers) as CollabPeer[]
  const isConnected = (connectionStatus as CollabConnectionStatus) === 'connected'

  const handleStartSession = () => {
    const newSessionId = generateInviteLink()
    startSession(
      {
        serverUrl: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/collab`,
        projectId: 'current-project',
        user: {
          id: `user_${Date.now()}`,
          displayName: 'You',
        },
        conflictStrategy: 'last-write-wins',
      },
      newSessionId,
    )
  }

  const handleJoinSession = () => {
    if (!joinCode.trim()) return

    // Extract session ID from URL or use directly
    const match = joinCode.match(/collab=([^&]+)/)
    const sid = match ? match[1] : joinCode.trim()

    startSession(
      {
        serverUrl: `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/collab`,
        projectId: 'current-project',
        user: {
          id: `user_${Date.now()}`,
          displayName: 'Guest',
        },
        conflictStrategy: 'last-write-wins',
      },
      sid,
    )
  }

  const handleCopyLink = async () => {
    if (!inviteLink) return
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-white">Real-Time Collaboration</h2>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[connectionStatus as CollabConnectionStatus]}`} />
          <span className="text-xs text-gray-400">{STATUS_LABELS[connectionStatus as CollabConnectionStatus]}</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 rounded px-2 py-1.5">
          {error}
        </div>
      )}

      {/* Not connected state */}
      {!sessionId && (
        <div className="flex flex-col gap-3">
          <button
            onClick={handleStartSession}
            className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
          >
            Start Session
          </button>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-gray-700" />
            <span className="text-xs text-gray-500">or</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinSession()}
              placeholder="Paste invite link or code..."
              className="flex-1 px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleJoinSession}
              disabled={!joinCode.trim()}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-sm rounded transition-colors"
            >
              Join
            </button>
          </div>
        </div>
      )}

      {/* Connected state */}
      {sessionId && (
        <>
          {/* Invite link */}
          {inviteLink && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-gray-400">Invite Link</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 truncate"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-xs text-white rounded transition-colors whitespace-nowrap"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Connected peers */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Collaborators ({peerList.length})
            </h3>

            {peerList.length === 0 && (
              <p className="text-xs text-gray-500">
                Waiting for others to join...
              </p>
            )}

            <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
              {peerList.map((peer) => (
                <div
                  key={peer.peerId}
                  className="flex items-center gap-2 px-2 py-1.5 bg-gray-800/50 rounded"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: peer.color }}
                  />
                  <span className="text-xs text-gray-300 truncate flex-1">
                    {peer.displayName}
                  </span>
                  {peer.cursor && (
                    <span className="text-[10px] text-gray-500">
                      ({Math.round(peer.cursor.x)}, {Math.round(peer.cursor.y)})
                    </span>
                  )}
                  {peer.selectedObjectId && (
                    <span className="text-[10px] text-blue-400">Editing</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Disconnect button */}
          <button
            onClick={endSession}
            className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm rounded transition-colors mt-auto"
          >
            {isConnected ? 'Leave Session' : 'Disconnect'}
          </button>
        </>
      )}
    </div>
  )
}
