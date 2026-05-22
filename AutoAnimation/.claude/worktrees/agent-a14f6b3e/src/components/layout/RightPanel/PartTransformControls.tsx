import { useState, useRef, useCallback } from 'react'
import { ChevronDown, ChevronRight, Eye, EyeOff, GripVertical, Link, Unlink } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface PartTransform {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  visible: boolean
}

interface PartTransformControlsProps {
  label: string
  transform: PartTransform
  onChange: (transform: Partial<PartTransform>) => void
  color?: string
  defaultExpanded?: boolean
  onRecordProperty?: (key: string, newValue: number, previousValue: number) => void
  zIndex?: number
  onZIndexChange?: (value: number) => void
  draggable?: boolean
  isDragOver?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
}

/** Compact number input with prefix label inside (e.g. "x:" shown inside the input) */
function InlineInput({
  prefix,
  value,
  onChange,
  step = 1,
  min = -9999,
  max = 9999,
  suffix,
}: {
  prefix: string
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  suffix?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  const displayValue = step < 1 ? value.toFixed(1) : Math.round(value).toString()

  const handleDoubleClick = () => {
    setEditing(true)
    setEditValue(displayValue)
    requestAnimationFrame(() => inputRef.current?.select())
  }

  const commit = useCallback(() => {
    setEditing(false)
    const parsed = parseFloat(editValue)
    if (!isNaN(parsed)) {
      onChange(Math.max(min, Math.min(max, parsed)))
    }
  }, [editValue, onChange, min, max])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commit()
    if (e.key === 'Escape') setEditing(false)
  }

  // Drag to scrub value
  const handlePointerDown = (e: React.PointerEvent) => {
    if (editing) return
    e.preventDefault()
    const startX = e.clientX
    const startValue = value
    const sensitivity = step < 1 ? 0.1 : 1

    const handleMove = (me: PointerEvent) => {
      const delta = (me.clientX - startX) * sensitivity
      const newVal = Math.max(min, Math.min(max, startValue + delta))
      onChange(step < 1 ? Math.round(newVal * 10) / 10 : Math.round(newVal))
    }
    const handleUp = () => {
      document.removeEventListener('pointermove', handleMove)
      document.removeEventListener('pointerup', handleUp)
    }
    document.addEventListener('pointermove', handleMove)
    document.addEventListener('pointerup', handleUp)
  }

  return (
    <div
      className="flex items-center bg-[#1e1e1e] rounded px-2 py-1 min-w-0 flex-1 cursor-ew-resize select-none"
      onPointerDown={handlePointerDown}
      onDoubleClick={handleDoubleClick}
    >
      <span className="text-[10px] text-zinc-500 font-mono mr-1 flex-shrink-0">{prefix}</span>
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-xs text-white outline-none font-mono cursor-text"
          autoFocus
        />
      ) : (
        <span className="text-xs text-zinc-200 font-mono truncate">
          {displayValue}{suffix || ''}
        </span>
      )}
    </div>
  )
}

export function PartTransformControls({
  label,
  transform,
  onChange,
  color = 'bg-[#4a7eff]',
  defaultExpanded = false,
  onRecordProperty,
  zIndex,
  onZIndexChange,
  draggable = false,
  isDragOver = false,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
}: PartTransformControlsProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [scaleLocked, setScaleLocked] = useState(true)

  const handleToggleVisibility = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange({ visible: !transform.visible })
  }

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-colors',
        isDragOver ? 'border-[#4a7eff]/60 bg-[#4a7eff]/5' : 'border-white/5'
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] transition-colors cursor-pointer select-none',
          !transform.visible && 'opacity-50'
        )}
      >
        {draggable && (
          <div
            draggable
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onClick={(e) => e.stopPropagation()}
            className="cursor-grab active:cursor-grabbing text-zinc-600 hover:text-zinc-400 transition-colors -ml-1 flex-shrink-0"
            title="Drag to reorder layers"
          >
            <GripVertical size={14} />
          </div>
        )}
        {isExpanded ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
        <div className={cn('w-2 h-2 rounded-full', color)} />
        <span className="flex-1 text-sm text-zinc-300 text-left">{label}</span>
        <button
          onClick={handleToggleVisibility}
          className={cn('p-1 rounded transition-colors', transform.visible ? 'text-zinc-400 hover:text-zinc-200' : 'text-zinc-600 hover:text-zinc-400')}
        >
          {transform.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className={cn('px-3 py-2.5 space-y-2', !transform.visible && 'opacity-50 pointer-events-none')}>
          {/* Position */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Position</span>
            <div className="flex gap-1.5">
              <InlineInput
                prefix="x:"
                value={transform.x}
                onChange={(v) => {
                  onChange({ x: v })
                  onRecordProperty?.('x', v, transform.x)
                }}
                suffix="px"
              />
              <InlineInput
                prefix="y:"
                value={transform.y}
                onChange={(v) => {
                  onChange({ y: v })
                  onRecordProperty?.('y', v, transform.y)
                }}
                suffix="px"
              />
            </div>
          </div>

          {/* Scale */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Scale</span>
            <div className="flex gap-1.5 items-center">
              <InlineInput
                prefix="w:"
                value={Math.round(transform.scaleX * 100)}
                onChange={(v) => {
                  const val = v / 100
                  if (scaleLocked) {
                    const ratio = transform.scaleX !== 0 ? val / transform.scaleX : 1
                    const newScaleY = Math.max(0.1, Math.min(5, transform.scaleY * ratio))
                    onChange({ scaleX: val, scaleY: newScaleY })
                    onRecordProperty?.('scaleX', val, transform.scaleX)
                    onRecordProperty?.('scaleY', newScaleY, transform.scaleY)
                  } else {
                    onChange({ scaleX: val })
                    onRecordProperty?.('scaleX', val, transform.scaleX)
                  }
                }}
                min={10}
                max={500}
                suffix="%"
              />
              <InlineInput
                prefix="h:"
                value={Math.round(transform.scaleY * 100)}
                onChange={(v) => {
                  const val = v / 100
                  if (scaleLocked) {
                    const ratio = transform.scaleY !== 0 ? val / transform.scaleY : 1
                    const newScaleX = Math.max(0.1, Math.min(5, transform.scaleX * ratio))
                    onChange({ scaleX: newScaleX, scaleY: val })
                    onRecordProperty?.('scaleX', newScaleX, transform.scaleX)
                    onRecordProperty?.('scaleY', val, transform.scaleY)
                  } else {
                    onChange({ scaleY: val })
                    onRecordProperty?.('scaleY', val, transform.scaleY)
                  }
                }}
                min={10}
                max={500}
                suffix="%"
              />
              <button
                onClick={() => setScaleLocked(!scaleLocked)}
                className={cn(
                  'p-1 rounded-full border transition-colors flex-shrink-0',
                  scaleLocked
                    ? 'text-[#4a7eff] bg-[#2a2a2a] border-[#4a7eff]/30'
                    : 'text-zinc-600 bg-[#2a2a2a] border-white/5 hover:text-zinc-400'
                )}
                title={scaleLocked ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
              >
                {scaleLocked ? <Link size={12} /> : <Unlink size={12} />}
              </button>
            </div>
          </div>

          {/* Rotation */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Rotation</span>
            <div className="flex gap-1.5">
              <InlineInput
                prefix="°"
                value={transform.rotation}
                onChange={(v) => {
                  onChange({ rotation: v })
                  onRecordProperty?.('rotation', v, transform.rotation)
                }}
                min={-180}
                max={180}
              />
            </div>
          </div>

          {/* Z-Index */}
          {zIndex !== undefined && onZIndexChange && (
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Z-Index</span>
              <div className="flex gap-1.5">
                <InlineInput
                  prefix="z:"
                  value={zIndex}
                  onChange={(v) => onZIndexChange(Math.round(v))}
                  min={0}
                  max={100}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
