import { useState, useRef, useCallback, useEffect, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'
import { FormulaInput } from '@/components/ui/FormulaInput'
import { useFormulaContext } from '@/hooks/useFormulaContext'

interface DraggableNumberInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  precision?: number
  className?: string
  /** Show label as inline prefix inside the input instead of above it */
  inline?: boolean
  /** Enable formula mode toggle (fx button) */
  formulaMode?: boolean
  /** Current formula string (null = raw number) */
  formula?: string | null
  /** Called when formula changes */
  onFormulaChange?: (formula: string | null) => void
}

export function DraggableNumberInput({
  label,
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  step = 1,
  unit = '',
  precision = 2,
  className,
  inline = false,
  formulaMode = false,
  formula = null,
  onFormulaChange,
}: DraggableNumberInputProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [editValue, setEditValue] = useState(value.toFixed(precision))
  const [isFormulaActive, setIsFormulaActive] = useState(!!formula)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragAccum = useRef(0)
  const dragStartValue = useRef(0)
  const pointerLocked = useRef(false)

  const formulaContext = useFormulaContext()

  const clamp = (val: number) => Math.min(Math.max(val, min), max)

  // Smart display: drop decimals for large numbers to prevent overflow
  const formatDisplay = (v: number) => {
    const abs = Math.abs(v)
    if (abs >= 100) return Math.round(v).toString()
    if (abs >= 10) return v.toFixed(Math.min(precision, 1))
    return v.toFixed(precision)
  }

  // Document-level mousemove while pointer is locked (cursor hidden, stays in place)
  const onLockedMove = useRef<((e: MouseEvent) => void) | null>(null)
  const onLockedUp = useRef<(() => void) | null>(null)

  // Clean up pointer lock listeners
  const cleanupLock = useCallback(() => {
    if (onLockedMove.current) document.removeEventListener('mousemove', onLockedMove.current)
    if (onLockedUp.current) document.removeEventListener('mouseup', onLockedUp.current)
    onLockedMove.current = null
    onLockedUp.current = null
  }, [])

  // Listen for pointer lock exit (Esc key or programmatic)
  useEffect(() => {
    const onLockChange = () => {
      if (!document.pointerLockElement && pointerLocked.current) {
        pointerLocked.current = false
        setIsDragging(false)
        cleanupLock()
      }
    }
    document.addEventListener('pointerlockchange', onLockChange)
    return () => {
      document.removeEventListener('pointerlockchange', onLockChange)
      cleanupLock()
    }
  }, [cleanupLock])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isEditing || isFormulaActive || e.button !== 0) return
      e.preventDefault()

      dragAccum.current = 0
      dragStartValue.current = value
      setIsDragging(true)

      const el = e.currentTarget as HTMLElement

      // Try pointer lock first (hides cursor, infinite drag)
      const lockPromise = el.requestPointerLock?.()

      // Set up document-level listeners for locked mode
      const moveHandler = (ev: MouseEvent) => {
        const sens = ev.shiftKey ? 0.1 : 1
        dragAccum.current += ev.movementX * step * sens
        const nv = dragStartValue.current + dragAccum.current
        onChange(clamp(Number(nv.toFixed(precision))))
      }
      const upHandler = () => {
        if (document.pointerLockElement) {
          document.exitPointerLock()
        }
        pointerLocked.current = false
        setIsDragging(false)
        cleanupLock()
      }

      onLockedMove.current = moveHandler
      onLockedUp.current = upHandler
      document.addEventListener('mousemove', moveHandler)
      document.addEventListener('mouseup', upHandler)

      if (lockPromise && typeof lockPromise.then === 'function') {
        lockPromise.then(() => { pointerLocked.current = true }).catch(() => {
          // Pointer lock denied -- still works via movementX, cursor just stays visible
        })
      }
    },
    [isEditing, isFormulaActive, value, step, precision, onChange, clamp, cleanupLock]
  )

  const handleDoubleClick = () => {
    if (isFormulaActive) return
    setEditValue(value.toFixed(precision))
    setIsEditing(true)
  }

  const handleInputBlur = () => {
    setIsEditing(false)
    const parsed = parseFloat(editValue)
    if (!isNaN(parsed)) {
      onChange(clamp(parsed))
    }
  }

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputBlur()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
      setEditValue(value.toFixed(precision))
    }
  }

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (isEditing || isFormulaActive) return
      const direction = e.deltaY > 0 ? -1 : 1
      const sensitivity = e.shiftKey ? 0.1 : 1
      onChange(clamp(value + direction * step * sensitivity))
    },
    [isEditing, isFormulaActive, value, step, onChange, clamp]
  )

  const handleFormulaToggle = () => {
    const next = !isFormulaActive
    setIsFormulaActive(next)
    if (!next) {
      // Switching back to number mode: clear formula
      onFormulaChange?.(null)
    }
  }

  const handleFormulaChange = (newFormula: string) => {
    onFormulaChange?.(newFormula)
  }

  const handleFormulaEvaluated = (val: number, _formula?: string) => {
    const clamped = clamp(val)
    if (clamped !== value) onChange(clamped)
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value.toFixed(precision))
    }
  }, [value, precision, isEditing])

  // Sync formula active state with external prop
  useEffect(() => {
    setIsFormulaActive(!!formula)
  }, [formula])

  // Formula mode toggle button
  const fxButton = formulaMode ? (
    <button
      type="button"
      onClick={handleFormulaToggle}
      className={cn(
        'shrink-0 px-1 py-0.5 rounded text-[10px] font-mono transition-colors',
        isFormulaActive
          ? 'bg-blue-600/30 text-blue-400 hover:bg-blue-600/40'
          : 'bg-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-600/50'
      )}
      title={isFormulaActive ? 'Switch to number mode' : 'Switch to formula mode'}
    >
      fx
    </button>
  ) : null

  if (inline) {
    return (
      <div
        className={cn(
          'relative flex items-center px-3 py-2 rounded-lg transition-all',
          'bg-panel-surface',
          isDragging
            ? 'ring-1 ring-accent'
            : 'hover:bg-[#333]',
          !isEditing && !isFormulaActive && 'cursor-ew-resize select-none',
          className,
        )}
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      >
        {!isEditing && !isFormulaActive && <span className="text-xs text-gray-500 pr-2 select-none shrink-0">{label}</span>}
        {isFormulaActive ? (
          <div className="flex items-center gap-1 w-full">
            {fxButton}
            <FormulaInput
              formula={formula || ''}
              onFormulaChange={handleFormulaChange}
              onConfirm={handleFormulaEvaluated}
              context={formulaContext}
              className="flex-1"
            />
          </div>
        ) : isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-full bg-transparent text-sm text-white outline-none"
          />
        ) : (
          <div className="flex items-center gap-1 w-full">
            <span className="text-sm text-white whitespace-nowrap flex-1">
              {formatDisplay(value)}
              {unit && <span className="text-gray-500 ml-0.5">{unit}</span>}
            </span>
            {fxButton}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <span className="text-xs text-zinc-500 uppercase tracking-wide">{label}</span>
      <div
        className={cn(
          'relative flex items-center h-9 px-3 rounded-lg border transition-all',
          'bg-zinc-800',
          isDragging
            ? 'border-green-500 ring-2 ring-green-500/20'
            : 'border-zinc-700 hover:border-green-500',
          !isEditing && !isFormulaActive && 'cursor-ew-resize select-none'
        )}
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      >
        {isFormulaActive ? (
          <div className="flex items-center gap-1 w-full">
            {fxButton}
            <FormulaInput
              formula={formula || ''}
              onFormulaChange={handleFormulaChange}
              onConfirm={handleFormulaEvaluated}
              context={formulaContext}
              className="flex-1"
            />
          </div>
        ) : isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-full bg-transparent text-sm text-zinc-100 outline-none"
          />
        ) : (
          <div className="flex items-center gap-1 w-full">
            <span className="text-sm text-zinc-100 flex-1">
              {formatDisplay(value)}
              {unit && <span className="text-zinc-500 ml-1">{unit}</span>}
            </span>
            {fxButton}
          </div>
        )}
      </div>
    </div>
  )
}
