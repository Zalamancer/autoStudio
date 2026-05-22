import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}

export function CustomSelect({ value, onChange, options }: CustomSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-panel-surface text-white text-sm px-3 py-2 rounded-lg cursor-pointer hover:bg-[#333] transition-colors"
      >
        <span className="truncate">{selected?.label ?? value}</span>
        <ChevronDown
          size={14}
          className={cn('text-gray-500 shrink-0 ml-2 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && (
        <div className="absolute z-dropdown mt-1 right-0 min-w-full w-max bg-panel-surface rounded-lg border border-white/10 shadow-xl max-h-48 overflow-y-auto py-1">
          {options.map((opt) => (
            <div
              key={opt.value}
              onClick={() => {
                onChange(opt.value)
                setOpen(false)
              }}
              className={cn(
                'px-3 py-1.5 text-sm cursor-pointer transition-colors',
                opt.value === value
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white',
              )}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
