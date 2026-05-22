import { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PanelSelectProps {
  label?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  className?: string
  /** Full width without label */
  fullWidth?: boolean
  /** Placeholder when no value selected */
  placeholder?: string
}

export function PanelSelect({ label, value, onChange, options, className, fullWidth, placeholder }: PanelSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const rowRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const activeOptionRef = useRef<HTMLButtonElement>(null)
  const [focusIdx, setFocusIdx] = useState(-1)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder ?? 'Select...'

  // Position the portal dropdown relative to the full row (label + select)
  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return
    const rowEl = rowRef.current ?? buttonRef.current
    const rowRect = rowEl.getBoundingClientRect()
    const btnRect = buttonRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - btnRect.bottom
    const dropUp = spaceBelow < 260 && btnRect.top > spaceBelow

    const right = window.innerWidth - rowRect.right
    setDropdownStyle({
      position: 'fixed',
      right,
      width: 'max-content',
      minWidth: rowRect.width,
      maxWidth: `calc(100vw - ${right}px - 8px)`,
      ...(dropUp ? { bottom: window.innerHeight - btnRect.top + 4 } : { top: btnRect.bottom + 4 }),
    })
  }, [open])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target)) return
      if (listRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Reposition dropdown on ancestor scroll so it stays anchored
  useEffect(() => {
    if (!open || !buttonRef.current) return
    const handler = (e: Event) => {
      // Ignore scroll inside the dropdown list itself
      if (listRef.current?.contains(e.target as Node)) return
      const rowEl = rowRef.current ?? buttonRef.current!
      const rowRect = rowEl.getBoundingClientRect()
      const btnRect = buttonRef.current!.getBoundingClientRect()
      const spaceBelow = window.innerHeight - btnRect.bottom
      const dropUp = spaceBelow < 260 && btnRect.top > spaceBelow
      const right = window.innerWidth - rowRect.right
      setDropdownStyle({
        position: 'fixed',
        right,
        width: 'max-content',
        minWidth: rowRect.width,
        maxWidth: `calc(100vw - ${right}px - 8px)`,
        ...(dropUp
          ? { bottom: window.innerHeight - btnRect.top + 4, top: undefined }
          : { top: btnRect.bottom + 4, bottom: undefined }),
      })
    }
    window.addEventListener('scroll', handler, true)
    return () => window.removeEventListener('scroll', handler, true)
  }, [open])

  // Scroll focused item into view
  useEffect(() => {
    if (!open || focusIdx < 0 || !listRef.current) return
    const items = listRef.current.children
    if (items[focusIdx]) {
      ;(items[focusIdx] as HTMLElement).scrollIntoView({ block: 'nearest' })
    }
  }, [focusIdx, open])

  // Center the active/selected option when dropdown opens
  useEffect(() => {
    if (open && activeOptionRef.current) {
      activeOptionRef.current.scrollIntoView({ block: 'center' })
    }
  }, [open])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          setOpen(true)
          setFocusIdx(options.findIndex((o) => o.value === value))
        }
        return
      }
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusIdx((i) => Math.min(i + 1, options.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusIdx((i) => Math.max(i - 1, 0))
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (focusIdx >= 0 && focusIdx < options.length) {
            onChange(options[focusIdx].value)
          }
          setOpen(false)
          break
        case 'Escape':
          e.preventDefault()
          setOpen(false)
          break
      }
    },
    [open, focusIdx, options, onChange, value],
  )

  const dropdownList = open
    ? createPortal(
        <div
          ref={listRef}
          style={dropdownStyle}
          className="z-[9999] max-h-60 overflow-y-auto bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg shadow-xl py-1"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value
            const isFocused = i === focusIdx
            return (
              <button
                key={opt.value}
                ref={isSelected ? activeOptionRef : undefined}
                type="button"
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                onMouseEnter={() => setFocusIdx(i)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
                  isFocused ? 'bg-[#4a7eff] text-white' : 'text-gray-300 hover:bg-[#2a2a2a]',
                  isSelected && !isFocused && 'text-white',
                )}
              >
                <span className="w-4 shrink-0">{isSelected && <Check size={12} />}</span>
                <span className="whitespace-nowrap">{opt.label}</span>
              </button>
            )
          })}
        </div>,
        document.body,
      )
    : null

  const select = (
    <div ref={ref} className={cn('relative', fullWidth ? 'w-full' : 'flex-1', className)}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          setOpen(!open)
          if (!open) setFocusIdx(options.findIndex((o) => o.value === value))
        }}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full flex items-center justify-between gap-2 bg-[#2a2a2a] text-sm px-3 py-2 rounded-lg cursor-pointer transition-colors',
          'focus:outline-none focus:ring-1 focus:ring-[#4a7eff]',
          open ? 'ring-1 ring-[#4a7eff]' : '',
          value ? 'text-white' : 'text-gray-500',
        )}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown size={14} className={cn('shrink-0 text-gray-500 transition-transform', open && 'rotate-180')} />
      </button>
      {dropdownList}
    </div>
  )

  if (!label)
    return (
      <div ref={rowRef} className="mb-3">
        {select}
      </div>
    )

  return (
    <div ref={rowRef} className="flex items-center gap-3 mb-3 min-w-0">
      <span className="text-gray-400 text-sm w-20 shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{select}</div>
    </div>
  )
}
