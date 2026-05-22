import { cn } from '@/lib/utils'

interface PanelTextareaProps {
  label?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
  className?: string
  disabled?: boolean
  /** Show character count */
  showCount?: boolean
}

export function PanelTextarea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
  className,
  disabled,
  showCount,
}: PanelTextareaProps) {
  return (
    <div className="mb-3">
      {label && (
        <span className="text-gray-400 text-sm mb-1 block">{label}</span>
      )}
      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={cn(
            'w-full bg-panel-surface text-white text-sm px-3 py-2 rounded-lg resize-none',
            'focus:outline-none focus:ring-1 focus:ring-accent',
            'placeholder:text-gray-600',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            className,
          )}
        />
        {showCount && (
          <span className="absolute bottom-2 right-2 text-[10px] text-gray-600">
            {value.length}
          </span>
        )}
      </div>
    </div>
  )
}
