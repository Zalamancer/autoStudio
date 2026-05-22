import { useNodeCanvasStore } from '@/stores/useNodeCanvasStore'
import { GROUP_COLORS, CARD_W, CARD_H } from './NodeCard'
import type { TabGroupId } from '@/types'

function getPortPosition(
  pos: { x: number; y: number },
  side: 'left' | 'right',
  zoom: number
) {
  const scale = 1 / zoom
  const w = CARD_W * scale
  const h = CARD_H * scale
  return {
    x: side === 'left' ? pos.x : pos.x + w,
    y: pos.y + h / 2,
  }
}

function CubicBezierPath({
  x1, y1, x2, y2, color1, color2, id,
}: {
  x1: number; y1: number; x2: number; y2: number
  color1: string; color2: string; id: string
}) {
  const dx = Math.abs(x2 - x1) * 0.5
  const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`

  return (
    <>
      <defs>
        <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={color1} stopOpacity={0.6} />
          <stop offset="100%" stopColor={color2} stopOpacity={0.6} />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={`url(#grad-${id})`}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </>
  )
}

interface NodeConnectionLayerProps {
  /** Called when user completes a drag-to-connect from source → target */
  onConnect?: (fromId: string, toId: string) => void
  /** Currently dragging connection state from parent */
  draggingConnection: {
    fromNodeId: string
    currentPos: { x: number; y: number }
  } | null
}

export function NodeConnectionLayer({ draggingConnection }: NodeConnectionLayerProps) {
  const nodes = useNodeCanvasStore((s) => s.nodes)
  const connections = useNodeCanvasStore((s) => s.connections)
  const zoom = useNodeCanvasStore((s) => s.zoom)
  const removeConnection = useNodeCanvasStore((s) => s.removeConnection)

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
      {/* Existing connections */}
      {connections.map((conn) => {
        const fromNode = nodes.find((n) => n.id === conn.fromNodeId)
        const toNode = nodes.find((n) => n.id === conn.toNodeId)
        if (!fromNode || !toNode) return null

        const from = getPortPosition(fromNode.position, 'right', zoom)
        const to = getPortPosition(toNode.position, 'left', zoom)
        const color1 = GROUP_COLORS[fromNode.groupId as TabGroupId] ?? '#64748b'
        const color2 = GROUP_COLORS[toNode.groupId as TabGroupId] ?? '#64748b'

        return (
          <g key={conn.id}>
            <CubicBezierPath
              x1={from.x} y1={from.y}
              x2={to.x} y2={to.y}
              color1={color1} color2={color2}
              id={conn.id}
            />
            {/* Invisible hit area for deletion */}
            <path
              d={`M ${from.x} ${from.y} C ${from.x + Math.abs(to.x - from.x) * 0.5} ${from.y}, ${to.x - Math.abs(to.x - from.x) * 0.5} ${to.y}, ${to.x} ${to.y}`}
              fill="none"
              stroke="transparent"
              strokeWidth={12}
              className="pointer-events-auto cursor-pointer"
              onDoubleClick={() => removeConnection(conn.id)}
            />
          </g>
        )
      })}

      {/* Dragging preview line */}
      {draggingConnection && (() => {
        const fromNode = nodes.find((n) => n.id === draggingConnection.fromNodeId)
        if (!fromNode) return null
        const from = getPortPosition(fromNode.position, 'right', zoom)
        const to = draggingConnection.currentPos
        const color = GROUP_COLORS[fromNode.groupId as TabGroupId] ?? '#64748b'
        return (
          <CubicBezierPath
            x1={from.x} y1={from.y}
            x2={to.x} y2={to.y}
            color1={color} color2={color}
            id="dragging"
          />
        )
      })()}
    </svg>
  )
}
