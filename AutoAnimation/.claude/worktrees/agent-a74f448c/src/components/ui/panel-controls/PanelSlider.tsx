import { useState, useRef, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface PanelSliderProps {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step: number
  precision?: number
  className?: string
  /** Use compact layout without fixed label width */
  compact?: boolean
  /** Show label as inline prefix inside the pill instead of outside */
  inline?: boolean
  /** Suffix shown after the value (e.g. "px", "%") */
  suffix?: string
  /** Custom value formatter */
  formatValue?: (v: number) => string
}

export function PanelSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  precision = 0,
  className,
  compact,
  inline,
  suffix,
  formatValue,
}: PanelSliderProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const dragAccum = useRef(0)
  const dragStartValue = useRef(0)
  const onLockedMove = useRef<((e: MouseEvent) => void) | null>(null)
  const onLockedUp = useRef<(() => void) | null>(null)
  const pointerLocked = useRef(false)

  const clamp = useCallback((val: number) => Math.min(Math.max(val, min), max), [min, max])

  const formatDisplay = (v: number) => {
    if (formatValue) return formatValue(v)
    return precision > 0 ? v.toFixed(precision) : String(Math.round(v))
  }

  // Clean up pointer lock listeners
  const cleanupLock = useCallback(() => {
    if (onLockedMove.current) document.removeEventListener('mousemove', onLockedMove.current)
    if (onLockedUp.current) document.removeEventListener('mouseup', onLockedUp.current)
    onLockedMove.current = null
    onLockedUp.current = null
  }, [])

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
      if (isEditing || e.button !== 0) return
      e.preventDefault()

      dragAccum.current = 0
      dragStartValue.current = value
      setIsDragging(true)

      const el = e.currentTarget as HTMLElement
      const lockPromise = el.requestPointerLock?.()

      const moveHandler = (ev: MouseEvent) => {
        const sens = ev.shiftKey ? 0.1 : 1
        dragAccum.current += ev.movementX * step * sens
        const nv = dragStartValue.current + dragAccum.current
        onChange(clamp(Number(nv.toFixed(Math.max(precision, 2)))))
      }
      const upHandler = () => {
        if (document.pointerLockElement) document.exitPointerLock()
        pointerLocked.current = false
        setIsDragging(false)
        cleanupLock()
      }

      onLockedMove.current = moveHandler
      onLockedUp.current = upHandler
      document.addEventListener('mousemove', moveHandler)
      document.addEventListener('mouseup', upHandler)

      if (lockPromise && typeof lockPromise.then === 'function') {
        lockPromise.then(() => { pointerLocked.current = true }).catch(() => {})
      }
    },
    [isEditing, value, step, precision, onChange, clamp, cleanupLock],
  )

  const handleDoubleClick = () => {
    const raw = precision > 0 ? value.toFixed(precision) : String(Math.round(value))
    setEditValue(raw)
    setIsEditing(true)
  }

  const handleInputBlur = () => {
    setIsEditing(false)
    const parsed = parseFloat(editValue)
    if (!isNaN(parsed)) onChange(clamp(parsed))
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleInputBlur()
    else if (e.key === 'Escape') setIsEditing(false)
  }

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (isEditing) return
      const direction = e.deltaY > 0 ? -1 : 1
      const sens = e.shiftKey ? 0.1 : 1
      onChange(clamp(value + direction * step * sens))
    },
    [isEditing, value, step, onChange, clamp],
  )

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const pillContent = (
    <>
      {!isEditing && suffix && !formatValue && <span className="text-xs text-gray-500 pr-2 select-none shrink-0">{suffix}</span>}
      {isEditing ? (
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
        <span className="text-sm text-white whitespace-nowrap flex-1">
          {formatDisplay(value)}
        </span>
      )}
    </>
  )

  const pillClass = cn(
    'flex items-center px-3 py-2 rounded-lg transition-all',
    'bg-[#2a2a2a]',
    isDragging ? 'ring-1 ring-[#4a7eff]' : 'hover:bg-[#333]',
    !isEditing && 'cursor-ew-resize select-none',
  )

  const pillHandlers = {
    onPointerDown: handlePointerDown,
    onDoubleClick: handleDoubleClick,
    onWheel: handleWheel,
  }

  if (inline) {
    return (
      <div className={cn(pillClass, className)} {...pillHandlers}>
        {!isEditing && <span className="text-xs text-gray-500 pr-2 select-none shrink-0">{label}</span>}
        {pillContent}
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-3 mb-3', className)}>
      <span className={cn('text-gray-400 text-sm shrink-0', compact ? 'w-auto' : 'w-20')}>
        {label}
      </span>
      <div className="flex-1">
        <div className={cn(pillClass)} {...pillHandlers}>
          {pillContent}
        </div>
      </div>
    </div>
  )
}
