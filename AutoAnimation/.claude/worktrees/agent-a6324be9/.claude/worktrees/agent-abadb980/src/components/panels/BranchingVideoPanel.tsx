/**
 * Branching / Interactive Video panel.
 * Node-graph editor where each node represents a timeline segment
 * and edges represent viewer choices/transitions.
 * Reuses the SVG node-graph rendering pattern from AnimStateMachineEditor.
 */
import { useState, useRef, useCallback } from 'react'
import { Plus, Trash2, Play, Square, RotateCcw, GitBranch } from 'lucide-react'
import { PanelSlider } from '@/components/ui/panel-controls'
import { useBranchingVideoStore } from '@/stores/useBranchingVideoStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import type { BranchNode, BranchEdge } from '@/types/branchingVideo'

const NODE_WIDTH = 160
const NODE_HEIGHT = 60

export function BranchingVideoPanel() {
  const graph = useBranchingVideoStore((s) => s.getActiveGraph())
  const createGraph = useBranchingVideoStore((s) => s.createGraph)
  const addNode = useBranchingVideoStore((s) => s.addNode)
  const updateNode = useBranchingVideoStore((s) => s.updateNode)
  const removeNode = useBranchingVideoStore((s) => s.removeNode)
  const addEdge = useBranchingVideoStore((s) => s.addEdge)
  const removeEdge = useBranchingVideoStore((s) => s.removeEdge)
  const updateEdge = useBranchingVideoStore((s) => s.updateEdge)
  const setEntryNode = useBranchingVideoStore((s) => s.setEntryNode)
  const previewMode = useBranchingVideoStore((s) => s.previewMode)
  const startPlayback = useBranchingVideoStore((s) => s.startPlayback)
  const stopPlayback = useBranchingVideoStore((s) => s.stopPlayback)
  const playbackState = useBranchingVideoStore((s) => s.playback)
  const navigateToNode = useBranchingVideoStore((s) => s.navigateToNode)
  const getOutgoingEdges = useBranchingVideoStore((s) => s.getOutgoingEdges)

  const seek = usePlaybackStore((s) => s.seek)
  const fps = usePlaybackStore((s) => s.fps)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [draggingFrom, setDraggingFrom] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState<{ nodeId: string; dx: number; dy: number } | null>(null)
  const canvasRef = useRef<SVGSVGElement>(null)

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setMousePos({ x, y })

      if (dragOffset && graph) {
        const newX = x - dragOffset.dx
        const newY = y - dragOffset.dy
        updateNode(graph.id, dragOffset.nodeId, { position: { x: newX, y: newY } })
      }
    },
    [dragOffset, graph, updateNode]
  )

  const handleCanvasMouseUp = useCallback(() => {
    if (draggingFrom && graph) {
      const targetNode = graph.nodes.find((n) => {
        const nx = n.position.x
        const ny = n.position.y
        return (
          mousePos.x >= nx &&
          mousePos.x <= nx + NODE_WIDTH &&
          mousePos.y >= ny &&
          mousePos.y <= ny + NODE_HEIGHT &&
          n.id !== draggingFrom
        )
      })
      if (targetNode) {
        addEdge(graph.id, draggingFrom, targetNode.id)
      }
    }
    setDraggingFrom(null)
    setDragOffset(null)
  }, [draggingFrom, graph, mousePos, addEdge])

  // ─── No graph — show create button ──────────────────────────────────

  if (!graph) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-4 text-center">
        <GitBranch size={32} className="text-zinc-600" />
        <div>
          <p className="text-sm text-zinc-300 font-medium">Branching Video</p>
          <p className="text-xs text-zinc-500 mt-1">
            Create interactive, choose-your-own-adventure style videos with branching narrative paths.
          </p>
        </div>
        <button
          onClick={() => createGraph()}
          className="flex items-center gap-2 px-4 py-2 text-xs bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
        >
          <Plus size={14} />
          Create Branch Graph
        </button>
      </div>
    )
  }

  // ─── Preview mode — show choices ────────────────────────────────────

  if (previewMode && playbackState.activeNodeId) {
    const activeNode = graph.nodes.find((n) => n.id === playbackState.activeNodeId)
    const choices = getOutgoingEdges(playbackState.activeNodeId)

    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
          <Play size={12} className="text-green-400" />
          <span className="text-xs text-green-400 font-medium flex-1">Preview Mode</span>
          <button
            onClick={stopPlayback}
            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
          >
            <Square size={10} />
            Stop
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          {activeNode && (
            <div className="text-center">
              <p className="text-sm text-zinc-200 font-medium">{activeNode.label}</p>
              <p className="text-xs text-zinc-500 mt-1">
                Frames {activeNode.timelineSegment.startFrame} - {activeNode.timelineSegment.endFrame}
              </p>
            </div>
          )}

          {playbackState.atDecisionPoint && choices.length > 0 && (
            <div className="w-full space-y-2">
              <p className="text-xs text-zinc-400 text-center">Choose what happens next:</p>
              {choices.map((edge) => (
                <button
                  key={edge.id}
                  onClick={() => {
                    navigateToNode(edge.targetNodeId)
                    const targetNode = graph.nodes.find((n) => n.id === edge.targetNodeId)
                    if (targetNode) {
                      seek(targetNode.timelineSegment.startFrame / fps)
                    }
                  }}
                  className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-green-500/50 rounded-xl text-sm text-zinc-200 hover:text-white transition-all text-left"
                >
                  {edge.choiceLabel}
                </button>
              ))}
            </div>
          )}

          {playbackState.atDecisionPoint && choices.length === 0 && (
            <div className="text-center">
              <p className="text-xs text-zinc-500">End of branch. No further choices.</p>
              <button
                onClick={stopPlayback}
                className="mt-2 flex items-center gap-1 px-3 py-1.5 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors mx-auto"
              >
                <RotateCcw size={10} />
                Restart
              </button>
            </div>
          )}

          {!playbackState.atDecisionPoint && (
            <p className="text-xs text-zinc-500 animate-pulse">Playing segment...</p>
          )}
        </div>

        {/* Visit history */}
        <div className="shrink-0 border-t border-zinc-800 px-3 py-2">
          <p className="text-[10px] text-zinc-600 mb-1">Path taken:</p>
          <div className="flex items-center gap-1 flex-wrap">
            {playbackState.visitHistory.map((nodeId, i) => {
              const node = graph.nodes.find((n) => n.id === nodeId)
              return (
                <span key={`${nodeId}-${i}`} className="text-[10px] text-zinc-500">
                  {node?.label ?? '?'}
                  {i < playbackState.visitHistory.length - 1 && ' -> '}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ─── Graph editor ───────────────────────────────────────────────────

  const handleAddNode = () => {
    if (!graph) return
    addNode(graph.id, {
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
    })
  }

  const selectedNode = graph.nodes.find((n) => n.id === selectedNodeId)
  const selectedEdge = graph.edges.find((e) => e.id === selectedEdgeId)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
        <GitBranch size={12} className="text-green-400" />
        <span className="text-xs text-zinc-300 font-medium flex-1 truncate">{graph.name}</span>
        <button
          onClick={() => startPlayback()}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg transition-colors"
          title="Preview branching video"
        >
          <Play size={10} />
          Preview
        </button>
        <button
          onClick={handleAddNode}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors"
        >
          <Plus size={12} />
          Scene
        </button>
      </div>

      {/* Hint */}
      <div className="px-3 py-1.5 bg-zinc-900/50 border-b border-zinc-800/50">
        <p className="text-[10px] text-zinc-600">
          Drag nodes to reposition. Shift+drag from one node to another to connect. Click to select and edit.
        </p>
      </div>

      {/* SVG Canvas */}
      <div className="flex-1 overflow-auto bg-zinc-900/50">
        <svg
          ref={canvasRef}
          width="100%"
          height="100%"
          className="min-w-[600px] min-h-[400px]"
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        >
          {/* Grid */}
          <defs>
            <pattern id="branch-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
            </pattern>
            <marker
              id="branch-arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#555" />
            </marker>
            <marker
              id="branch-arrowhead-selected"
              markerWidth="8"
              markerHeight="6"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#22c55e" />
            </marker>
          </defs>
          <rect width="100%" height="100%" fill="url(#branch-grid)" />

          {/* Edge arrows */}
          {graph.edges.map((edge) => (
            <EdgeArrow
              key={edge.id}
              edge={edge}
              nodes={graph.nodes}
              isSelected={edge.id === selectedEdgeId}
              onClick={() => {
                setSelectedEdgeId(edge.id)
                setSelectedNodeId(null)
              }}
            />
          ))}

          {/* Drag line preview */}
          {draggingFrom &&
            (() => {
              const fromNode = graph.nodes.find((n) => n.id === draggingFrom)
              if (!fromNode) return null
              return (
                <line
                  x1={fromNode.position.x + NODE_WIDTH / 2}
                  y1={fromNode.position.y + NODE_HEIGHT / 2}
                  x2={mousePos.x}
                  y2={mousePos.y}
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  opacity={0.6}
                />
              )
            })()}

          {/* Scene nodes */}
          {graph.nodes.map((node) => (
            <SceneNode
              key={node.id}
              node={node}
              isSelected={node.id === selectedNodeId}
              isEntry={node.id === graph.entryNodeId}
              isActive={node.id === playbackState.activeNodeId}
              onClick={() => {
                setSelectedNodeId(node.id)
                setSelectedEdgeId(null)
                // Seek timeline to this node's start frame
                seek(node.timelineSegment.startFrame / fps)
              }}
              onConnectStart={() => setDraggingFrom(node.id)}
              onDragStart={(dx, dy) => setDragOffset({ nodeId: node.id, dx, dy })}
            />
          ))}
        </svg>
      </div>

      {/* ─── Properties panel (Node) ─────────────────────────────────── */}
      {selectedNode && (
        <div className="border-t border-zinc-800 p-3 flex flex-col gap-2 max-h-[250px] overflow-y-auto">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-300 font-medium">Scene: {selectedNode.label}</span>
            <div className="flex items-center gap-1">
              {selectedNode.id !== graph.entryNodeId && (
                <button
                  onClick={() => setEntryNode(graph.id, selectedNode.id)}
                  className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-colors"
                  title="Set as entry node"
                >
                  Set Entry
                </button>
              )}
              <button
                onClick={() => {
                  removeNode(graph.id, selectedNode.id)
                  setSelectedNodeId(null)
                }}
                className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="text-zinc-500">Label</label>
            <input
              value={selectedNode.label}
              onChange={(e) => updateNode(graph.id, selectedNode.id, { label: e.target.value })}
              className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-xs focus:outline-none focus:border-green-500"
            />
            <div className="col-span-2 grid grid-cols-2 gap-2">
              <PanelSlider
                label="Start"
                value={selectedNode.timelineSegment.startFrame}
                onChange={(v) =>
                  updateNode(graph.id, selectedNode.id, {
                    timelineSegment: {
                      ...selectedNode.timelineSegment,
                      startFrame: Math.round(v),
                    },
                  })
                }
                min={0}
                max={9999}
                step={1}
                inline
              />
              <PanelSlider
                label="End"
                value={selectedNode.timelineSegment.endFrame}
                onChange={(v) =>
                  updateNode(graph.id, selectedNode.id, {
                    timelineSegment: {
                      ...selectedNode.timelineSegment,
                      endFrame: Math.round(v),
                    },
                  })
                }
                min={0}
                max={9999}
                step={1}
                inline
              />
            </div>
            <label className="text-zinc-500">Duration</label>
            <span className="px-2 py-1 text-zinc-500 text-xs">
              {selectedNode.timelineSegment.endFrame - selectedNode.timelineSegment.startFrame} frames
              {' '}
              ({((selectedNode.timelineSegment.endFrame - selectedNode.timelineSegment.startFrame) / fps).toFixed(1)}s)
            </span>
          </div>
        </div>
      )}

      {/* ─── Properties panel (Edge) ──────────────────────────────────── */}
      {selectedEdge && (
        <div className="border-t border-zinc-800 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-300 font-medium">Choice</span>
            <button
              onClick={() => {
                removeEdge(graph.id, selectedEdge.id)
                setSelectedEdgeId(null)
              }}
              className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="text-zinc-500">Choice Label</label>
            <input
              value={selectedEdge.choiceLabel}
              onChange={(e) => updateEdge(graph.id, selectedEdge.id, { choiceLabel: e.target.value })}
              className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-xs focus:outline-none focus:border-green-500"
            />
            <label className="text-zinc-500">Condition</label>
            <input
              value={selectedEdge.condition ?? ''}
              onChange={(e) =>
                updateEdge(graph.id, selectedEdge.id, {
                  condition: e.target.value || undefined,
                })
              }
              placeholder="(optional)"
              className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-xs focus:outline-none focus:border-green-500"
            />
            <div className="col-span-2">
              <PanelSlider
                label="Sort Order"
                value={selectedEdge.sortOrder}
                onChange={(v) =>
                  updateEdge(graph.id, selectedEdge.id, {
                    sortOrder: Math.round(v),
                  })
                }
                min={0}
                max={99}
                step={1}
                compact
              />
            </div>
            <label className="text-zinc-500">From</label>
            <span className="px-2 py-1 text-zinc-500 text-xs truncate">
              {graph.nodes.find((n) => n.id === selectedEdge.fromNodeId)?.label ?? '?'}
            </span>
            <label className="text-zinc-500">To</label>
            <span className="px-2 py-1 text-zinc-500 text-xs truncate">
              {graph.nodes.find((n) => n.id === selectedEdge.targetNodeId)?.label ?? '?'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Scene Node (SVG) ──────────────────────────────────────────────────────

function SceneNode({
  node,
  isSelected,
  isEntry,
  isActive,
  onClick,
  onConnectStart,
  onDragStart,
}: {
  node: BranchNode
  isSelected: boolean
  isEntry: boolean
  isActive: boolean
  onClick: () => void
  onConnectStart: () => void
  onDragStart: (dx: number, dy: number) => void
}) {
  const borderColor = isSelected
    ? '#22c55e'
    : isActive
      ? '#3b82f6'
      : isEntry
        ? '#f59e0b'
        : '#3f3f46'

  const fillColor = node.color ?? '#27272a'
  const frames = node.timelineSegment.endFrame - node.timelineSegment.startFrame

  return (
    <g>
      <rect
        x={node.position.x}
        y={node.position.y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={8}
        fill={fillColor}
        stroke={borderColor}
        strokeWidth={isSelected || isActive ? 2 : 1}
        style={{ cursor: 'pointer' }}
        onClick={onClick}
        onMouseDown={(e) => {
          if (e.shiftKey) {
            onConnectStart()
          } else {
            const rect = (e.target as SVGRectElement).closest('svg')?.getBoundingClientRect()
            if (rect) {
              onDragStart(e.clientX - rect.left - node.position.x, e.clientY - rect.top - node.position.y)
            }
          }
        }}
      />
      {/* Label */}
      <text
        x={node.position.x + NODE_WIDTH / 2}
        y={node.position.y + NODE_HEIGHT / 2 - 6}
        textAnchor="middle"
        fill="#d4d4d8"
        fontSize={11}
        fontWeight={500}
        style={{ pointerEvents: 'none' }}
      >
        {node.label}
      </text>
      {/* Frame range */}
      <text
        x={node.position.x + NODE_WIDTH / 2}
        y={node.position.y + NODE_HEIGHT / 2 + 10}
        textAnchor="middle"
        fill="#71717a"
        fontSize={8}
        style={{ pointerEvents: 'none' }}
      >
        {node.timelineSegment.startFrame}-{node.timelineSegment.endFrame} ({frames}f)
      </text>
      {/* Entry indicator (amber dot) */}
      {isEntry && (
        <circle
          cx={node.position.x + 10}
          cy={node.position.y + 10}
          r={4}
          fill="#f59e0b"
        />
      )}
      {/* Active playback indicator (blue dot) */}
      {isActive && (
        <circle
          cx={node.position.x + NODE_WIDTH - 10}
          cy={node.position.y + 10}
          r={4}
          fill="#3b82f6"
        />
      )}
    </g>
  )
}

// ─── Edge Arrow (SVG) ──────────────────────────────────────────────────────

function EdgeArrow({
  edge,
  nodes,
  isSelected,
  onClick,
}: {
  edge: BranchEdge
  nodes: BranchNode[]
  isSelected: boolean
  onClick: () => void
}) {
  const fromNode = nodes.find((n) => n.id === edge.fromNodeId)
  const toNode = nodes.find((n) => n.id === edge.targetNodeId)
  if (!fromNode || !toNode) return null

  const x1 = fromNode.position.x + NODE_WIDTH / 2
  const y1 = fromNode.position.y + NODE_HEIGHT / 2
  const x2 = toNode.position.x + NODE_WIDTH / 2
  const y2 = toNode.position.y + NODE_HEIGHT / 2

  // Offset so bidirectional edges don't overlap
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const offsetX = (-dy / len) * 8
  const offsetY = (dx / len) * 8

  return (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
      <line
        x1={x1 + offsetX}
        y1={y1 + offsetY}
        x2={x2 + offsetX}
        y2={y2 + offsetY}
        stroke={isSelected ? '#22c55e' : '#555'}
        strokeWidth={isSelected ? 2 : 1.5}
        markerEnd={isSelected ? 'url(#branch-arrowhead-selected)' : 'url(#branch-arrowhead)'}
      />
      {/* Choice label */}
      <text
        x={(x1 + x2) / 2 + offsetX}
        y={(y1 + y2) / 2 + offsetY - 8}
        textAnchor="middle"
        fill={isSelected ? '#86efac' : '#71717a'}
        fontSize={9}
        fontWeight={isSelected ? 500 : 400}
      >
        {edge.choiceLabel}
      </text>
    </g>
  )
}
