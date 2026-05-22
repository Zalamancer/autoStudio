/**
 * Animation State Machine node-graph editor.
 * States are rendered as boxes, transitions as arrows.
 * Click state to configure, drag between states to create transitions.
 */
import { useState, useRef, useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PanelSlider } from '@/components/ui/panel-controls'
import { useAnimStateMachineStore } from '@/stores/useAnimStateMachineStore'
import type { AnimState, AnimTransition } from '@/types/animStateMachine'

const NODE_WIDTH = 140
const NODE_HEIGHT = 50

export function AnimStateMachineEditor() {
  const machine = useAnimStateMachineStore((s) => s.getActiveMachine())
  const addState = useAnimStateMachineStore((s) => s.addState)
  const updateState = useAnimStateMachineStore((s) => s.updateState)
  const removeState = useAnimStateMachineStore((s) => s.removeState)
  const addTransition = useAnimStateMachineStore((s) => s.addTransition)
  const removeTransition = useAnimStateMachineStore((s) => s.removeTransition)
  const updateTransition = useAnimStateMachineStore((s) => s.updateTransition)

  const [selectedStateId, setSelectedStateId] = useState<string | null>(null)
  const [selectedTransitionId, setSelectedTransitionId] = useState<string | null>(null)
  const [draggingFrom, setDraggingFrom] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [dragOffset, setDragOffset] = useState<{ stateId: string; dx: number; dy: number } | null>(null)
  const canvasRef = useRef<SVGSVGElement>(null)

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos({ x, y })

    // Handle state node dragging
    if (dragOffset && machine) {
      const newX = x - dragOffset.dx
      const newY = y - dragOffset.dy
      updateState(machine.id, dragOffset.stateId, { position: { x: newX, y: newY } })
    }
  }, [dragOffset, machine, updateState])

  const handleCanvasMouseUp = useCallback(() => {
    if (draggingFrom && machine) {
      // Check if mouse is over a state
      const targetState = machine.states.find((s) => {
        const sx = s.position.x
        const sy = s.position.y
        return (
          mousePos.x >= sx &&
          mousePos.x <= sx + NODE_WIDTH &&
          mousePos.y >= sy &&
          mousePos.y <= sy + NODE_HEIGHT &&
          s.id !== draggingFrom
        )
      })
      if (targetState) {
        addTransition(machine.id, draggingFrom, targetState.id)
      }
    }
    setDraggingFrom(null)
    setDragOffset(null)
  }, [draggingFrom, machine, mousePos, addTransition])

  if (!machine) {
    return (
      <div className="p-4 text-center text-xs text-zinc-600">
        No state machine active. Create one from the rig editor.
      </div>
    )
  }

  const handleAddState = () => {
    if (!machine) return
    addState(machine.id, {
      position: { x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 },
    })
  }

  const selectedState = machine.states.find((s) => s.id === selectedStateId)
  const selectedTransition = machine.transitions.find((t) => t.id === selectedTransitionId)

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
        <span className="text-xs text-zinc-300 font-medium flex-1 truncate">{machine.name}</span>
        <button
          onClick={handleAddState}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors"
        >
          <Plus size={12} />
          State
        </button>
      </div>

      {/* Canvas */}
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
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Transition arrows */}
          {machine.transitions.map((t) => (
            <TransitionArrow
              key={t.id}
              transition={t}
              states={machine.states}
              isSelected={t.id === selectedTransitionId}
              onClick={() => {
                setSelectedTransitionId(t.id)
                setSelectedStateId(null)
              }}
            />
          ))}

          {/* Drag line preview */}
          {draggingFrom && (() => {
            const fromState = machine.states.find((s) => s.id === draggingFrom)
            if (!fromState) return null
            return (
              <line
                x1={fromState.position.x + NODE_WIDTH / 2}
                y1={fromState.position.y + NODE_HEIGHT / 2}
                x2={mousePos.x}
                y2={mousePos.y}
                stroke="#22c55e"
                strokeWidth={2}
                strokeDasharray="5,5"
                opacity={0.6}
              />
            )
          })()}

          {/* State nodes */}
          {machine.states.map((state) => (
            <StateNode
              key={state.id}
              state={state}
              isSelected={state.id === selectedStateId}
              isDefault={state.id === machine.defaultStateId}
              isCurrent={state.id === machine.currentStateId}
              onClick={() => {
                setSelectedStateId(state.id)
                setSelectedTransitionId(null)
              }}
              onConnectStart={() => setDraggingFrom(state.id)}
              onDragStart={(dx, dy) => setDragOffset({ stateId: state.id, dx, dy })}
            />
          ))}
        </svg>
      </div>

      {/* Properties panel */}
      {selectedState && (
        <div className="border-t border-zinc-800 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-300 font-medium">{selectedState.name}</span>
            <button
              onClick={() => {
                removeState(machine.id, selectedState.id)
                setSelectedStateId(null)
              }}
              className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="text-zinc-500">Name</label>
            <input
              value={selectedState.name}
              onChange={(e) => updateState(machine.id, selectedState.id, { name: e.target.value })}
              className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-xs focus:outline-none focus:border-green-500"
            />
            <div className="col-span-2">
              <PanelSlider
                label="Speed"
                value={selectedState.speed}
                onChange={(v) => updateState(machine.id, selectedState.id, { speed: v })}
                min={0}
                max={5}
                step={0.1}
                precision={1}
                compact
                suffix="x"
              />
            </div>
            <label className="text-zinc-500">Loop</label>
            <input
              type="checkbox"
              checked={selectedState.loop}
              onChange={(e) => updateState(machine.id, selectedState.id, { loop: e.target.checked })}
              className="accent-green-500"
            />
          </div>
        </div>
      )}

      {selectedTransition && (
        <div className="border-t border-zinc-800 p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-300 font-medium">Transition</span>
            <button
              onClick={() => {
                removeTransition(machine.id, selectedTransition.id)
                setSelectedTransitionId(null)
              }}
              className="p-1 rounded-lg hover:bg-red-500/20 text-zinc-500 hover:text-red-400"
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="col-span-2">
              <PanelSlider
                label="Duration"
                value={selectedTransition.duration}
                onChange={(v) => updateTransition(machine.id, selectedTransition.id, { duration: v })}
                min={0}
                max={5}
                step={0.1}
                precision={1}
                compact
                suffix="s"
              />
            </div>
            <label className="text-zinc-500">Condition</label>
            <input
              value={selectedTransition.condition}
              onChange={(e) => updateTransition(machine.id, selectedTransition.id, { condition: e.target.value })}
              placeholder="e.g. speed > 0.5"
              className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-300 text-xs focus:outline-none focus:border-green-500"
            />
            <label className="text-zinc-500">Has Exit Time</label>
            <input
              type="checkbox"
              checked={selectedTransition.hasExitTime}
              onChange={(e) => updateTransition(machine.id, selectedTransition.id, { hasExitTime: e.target.checked })}
              className="accent-green-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── State Node ─────────────────────────────────────────────────────────────

function StateNode({
  state,
  isSelected,
  isDefault,
  isCurrent,
  onClick,
  onConnectStart,
  onDragStart,
}: {
  state: AnimState
  isSelected: boolean
  isDefault: boolean
  isCurrent: boolean
  onClick: () => void
  onConnectStart: () => void
  onDragStart: (dx: number, dy: number) => void
}) {
  const borderColor = isSelected
    ? '#22c55e'
    : isCurrent
      ? '#22c55e'
      : isDefault
        ? '#f59e0b'
        : '#3f3f46'

  return (
    <g>
      <rect
        x={state.position.x}
        y={state.position.y}
        width={NODE_WIDTH}
        height={NODE_HEIGHT}
        rx={6}
        fill="#27272a"
        stroke={borderColor}
        strokeWidth={isSelected ? 2 : 1}
        style={{ cursor: 'pointer' }}
        onClick={onClick}
        onMouseDown={(e) => {
          if (e.shiftKey) {
            onConnectStart()
          } else {
            onDragStart(e.clientX - state.position.x, e.clientY - state.position.y)
          }
        }}
      />
      <text
        x={state.position.x + NODE_WIDTH / 2}
        y={state.position.y + NODE_HEIGHT / 2 - 4}
        textAnchor="middle"
        fill="#d4d4d8"
        fontSize={11}
        style={{ pointerEvents: 'none' }}
      >
        {state.name}
      </text>
      <text
        x={state.position.x + NODE_WIDTH / 2}
        y={state.position.y + NODE_HEIGHT / 2 + 10}
        textAnchor="middle"
        fill="#71717a"
        fontSize={8}
        style={{ pointerEvents: 'none' }}
      >
        {state.clipId ? 'clip' : state.poseTrackId ? 'pose' : 'empty'}
        {' · '}
        {state.speed}x
        {state.loop ? ' ↻' : ''}
      </text>
      {/* Default indicator */}
      {isDefault && (
        <circle
          cx={state.position.x + 8}
          cy={state.position.y + 8}
          r={3}
          fill="#f59e0b"
        />
      )}
      {/* Current indicator */}
      {isCurrent && (
        <circle
          cx={state.position.x + NODE_WIDTH - 8}
          cy={state.position.y + 8}
          r={3}
          fill="#22c55e"
        />
      )}
    </g>
  )
}

// ─── Transition Arrow ───────────────────────────────────────────────────────

function TransitionArrow({
  transition,
  states,
  isSelected,
  onClick,
}: {
  transition: AnimTransition
  states: AnimState[]
  isSelected: boolean
  onClick: () => void
}) {
  const fromState = states.find((s) => s.id === transition.fromStateId)
  const toState = states.find((s) => s.id === transition.toStateId)
  if (!fromState || !toState) return null

  const x1 = fromState.position.x + NODE_WIDTH / 2
  const y1 = fromState.position.y + NODE_HEIGHT / 2
  const x2 = toState.position.x + NODE_WIDTH / 2
  const y2 = toState.position.y + NODE_HEIGHT / 2

  // Offset line so bidirectional transitions don't overlap
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
        markerEnd="url(#arrowhead)"
      />
      {/* Arrowhead */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 8 3, 0 6" fill={isSelected ? '#22c55e' : '#555'} />
        </marker>
      </defs>
      {/* Label */}
      {transition.condition && (
        <text
          x={(x1 + x2) / 2 + offsetX}
          y={(y1 + y2) / 2 + offsetY - 6}
          textAnchor="middle"
          fill="#71717a"
          fontSize={8}
        >
          {transition.condition}
        </text>
      )}
    </g>
  )
}
