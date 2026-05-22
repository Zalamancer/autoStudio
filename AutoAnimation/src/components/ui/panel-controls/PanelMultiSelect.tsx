import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiSelectOption {
  value: string
  label: string
  image?: string
}

interface PanelMultiSelectProps {
  label?: string
  options: MultiSelectOption[]
  value: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
  emptyMessage?: string
  className?: string
}

export function PanelMultiSelect({
  label,
  options,
  value,
  onChange,
  placeholder = 'None',
  emptyMessage = 'No items available',
  className,
}: PanelMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const toggle = (id: string) => {
    const next = value.includes(id) ? value.filter((v) => v !== id) : [...value, id]
    onChange(next)
  }

  const display =
    value.length === 0
      ? placeholder
      : value.length === 1
        ? (options.find((o) => o.value === value[0])?.label ?? '1 selected')
        : `${value.length} selected`

  const selectButton = (
    <div className="flex-1">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full flex items-center gap-2 bg-panel-surface text-sm px-3 py-2 rounded-lg',
          'hover:bg-panel-surface-hover transition-colors',
          value.length > 0 ? 'text-white' : 'text-gray-500',
        )}
      >
        <span className="flex-1 text-left truncate">{display}</span>
        <ChevronDown size={14} className={cn('text-gray-500 shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
    </div>
  )

  const dropdown = open ? (
    <div className="absolute z-dropdown top-full mt-1 left-0 right-0 bg-panel-bg border border-white/10 rounded-lg shadow-xl max-h-48 overflow-y-auto">
      {options.length === 0 ? (
        <div className="px-3 py-2 text-sm text-gray-600">{emptyMessage}</div>
      ) : (
        options.map((opt) => {
          const checked = value.includes(opt.value)
          return (
            <button
              key={opt.value}
              onClick={() => toggle(opt.value)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-panel-surface transition-colors group"
            >
              <div
                className={cn(
                  'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 transition-colors',
                  checked
                    ? 'bg-accent border-accent'
                    : 'bg-panel-surface border-panel-border group-hover:border-gray-500',
                )}
              >
                {checked && (
                  <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5L4 7L8 3"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              {opt.image && (
                <img src={opt.image} alt="" className="w-5 h-5 rounded object-cover shrink-0 bg-panel-surface-hover" />
              )}
              <span className={cn('text-sm truncate', checked ? 'text-white' : 'text-gray-400')}>{opt.label}</span>
            </button>
          )
        })
      )}
    </div>
  ) : null

  if (!label)
    return (
      <div ref={ref} className={cn('relative mb-3', className)}>
        {selectButton}
        {dropdown}
      </div>
    )

  return (
    <div ref={ref} className={cn('relative flex items-center gap-3 mb-3', className)}>
      <span className="text-gray-400 text-sm w-20 shrink-0">{label}</span>
      {selectButton}
      {dropdown}
    </div>
  )
}
