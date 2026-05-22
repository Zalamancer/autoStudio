/**
 * Shared transform UI primitives used by BonePropertiesEditor, RightPanel,
 * and Character3DPropertiesPanel.
 *
 * Extracted from BonePropertiesEditor.tsx so that consumers can import these
 * lightweight controls without pulling in Three.js (~500KB).
 */
import { useState, useRef } from 'react'

export type Axis = 'x' | 'y' | 'z'
type GroupKey = 'position' | 'rotation' | 'scale'

const AXIS_COLORS: Record<Axis, string> = { x: '#5b8ec9', y: '#7b9b5a', z: '#c9a05b' }
export const SENSITIVITIES: Record<GroupKey, number> = { position: 0.005, rotation: 0.5, scale: 0.005 }

// -- Drag-to-scrub field --

export interface DragFieldProps {
  axis: Axis
  value: number
  onChange: (v: number) => void
  sensitivity: number
  decimals?: number
}

export function DragField({ axis, value, onChange, sensitivity, decimals = 3 }: DragFieldProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const dragRef = useRef({ startX: 0, startVal: 0, hasMoved: false })
  const color = AXIS_COLORS[axis]

  const formatVal = (num: number) => {
    if (Number.isInteger(num)) return String(num)
    const s = num.toFixed(decimals)
    return s.replace(/0+$/, '').replace(/\.$/, '')
  }

  const startEdit = () => {
    setEditing(true)
    setEditValue(formatVal(value))
  }

  const commitEdit = () => {
    const num = parseFloat(editValue)
    if (!isNaN(num)) onChange(num)
    setEditing(false)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (editing) return
    e.preventDefault()
    dragRef.current = { startX: e.clientX, startVal: value, hasMoved: false }
    setIsDragging(true)

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - dragRef.current.startX
      if (Math.abs(dx) > 2) dragRef.current.hasMoved = true
      const newVal = Math.round((dragRef.current.startVal + dx * sensitivity) * 1000) / 1000
      onChange(newVal)
    }

    const onUp = () => {
      setIsDragging(false)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      if (!dragRef.current.hasMoved) startEdit()
    }

    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  return (
    <div
      onPointerDown={onPointerDown}
      className="flex items-center gap-1.5 flex-1 min-w-0 rounded-md px-2 py-1.5 transition-colors"
      style={{
        backgroundColor: isDragging ? '#33333a' : '#2a2a2f',
        cursor: editing ? 'text' : 'ew-resize',
        border: editing
          ? `1px solid ${color}55`
          : isDragging
            ? `1px solid ${color}33`
            : '1px solid transparent',
      }}
    >
      <span
        className="text-xs font-medium uppercase shrink-0 pointer-events-none select-none"
        style={{ color }}
      >
        {axis.toUpperCase()}
      </span>
      {editing ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit()
            if (e.key === 'Escape') setEditing(false)
          }}
          className="bg-transparent border-none outline-none text-sm text-zinc-200 w-full p-0 font-inherit"
        />
      ) : (
        <span className="text-sm text-zinc-300 pointer-events-none select-none truncate">
          {formatVal(value)}
        </span>
      )}
    </div>
  )
}

// -- Transform row layout --

export function TransformRow({
  label,
  extra,
  children,
}: {
  label: string
  extra?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-zinc-500 font-medium w-[52px] shrink-0">
        {label}
      </span>
      {extra ?? <div className="w-3 shrink-0" />}
      <div className="flex gap-1 flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
