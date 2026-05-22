/**
 * Collab Cursors Overlay
 *
 * Renders remote peer cursors on the canvas with name labels and
 * selection highlight rings. Positioned absolutely over the VideoCanvas.
 */

import { useCollaborationStore, type CollabPeer } from '@/stores/useCollaborationStore'

export function CollabCursors() {
  const peers = useCollaborationStore((s) => s.peers)
  const localPeerId = useCollaborationStore((s) => s.localUserId)
  const connectionStatus = useCollaborationStore((s) => s.connectionStatus)

  if (connectionStatus !== 'connected') return null

  const remotePeers = (Object.values(peers) as CollabPeer[]).filter(
    (p) => p.peerId !== localPeerId && p.cursor !== null,
  )

  if (remotePeers.length === 0) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-[9999] overflow-hidden">
      {remotePeers.map((peer) => {
        if (!peer.cursor) return null

        return (
          <div
            key={peer.peerId}
            className="absolute transition-all duration-75 ease-out"
            style={{
              left: peer.cursor.x,
              top: peer.cursor.y,
              transform: 'translate(-2px, -2px)',
            }}
          >
            {/* Cursor arrow SVG */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={peer.color}
              stroke="white"
              strokeWidth="1.5"
              className="drop-shadow-md"
            >
              <path d="M5 3l14 8-6 2-3 7z" />
            </svg>

            {/* Name label */}
            <div
              className="absolute left-4 top-4 px-1.5 py-0.5 rounded text-[10px] font-medium text-white whitespace-nowrap shadow-md"
              style={{ backgroundColor: peer.color }}
            >
              {peer.displayName}
            </div>
          </div>
        )
      })}
    </div>
  )
}
