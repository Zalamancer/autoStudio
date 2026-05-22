import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface ButtonOption {
  /** Button identifier — use `value` or `id` */
  value?: string
  /** Alias for value */
  id?: string
  label?: string
  icon?: LucideIcon
  title?: string
  disabled?: boolean
}

interface PanelButtonGroupProps {
  label?: string
  options: ButtonOption[]
  value: string
  onChange: (v: string) => void
  className?: string
}

export function PanelButtonGroup({ label, options, value, onChange, className }: PanelButtonGroupProps) {
  const buttons = (
    <div className="flex gap-1 flex-wrap">
      {options.map((opt) => {
        const optValue = opt.value ?? opt.id ?? ''
        const isActive = optValue === value
        return (
          <button
            key={optValue}
            onClick={() => !opt.disabled && onChange(optValue)}
            disabled={opt.disabled}
            title={opt.title || opt.label}
            className={cn(
              'h-8 rounded-lg flex items-center justify-center transition-colors text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              opt.icon && !opt.label ? 'w-9' : 'px-3',
              opt.disabled
                ? 'bg-panel-surface text-gray-600 cursor-not-allowed'
                : isActive
                  ? 'bg-accent text-white'
                  : 'bg-panel-surface text-gray-400 hover:text-white',
            )}
          >
            {opt.icon && <opt.icon size={16} />}
            {opt.label && !opt.icon && opt.label}
          </button>
        )
      })}
    </div>
  )

  if (!label) return <div className={cn('mb-3', className)}>{buttons}</div>

  return (
    <div className={cn('flex items-center gap-3 mb-3', className)}>
      <span className="text-gray-400 text-sm w-20 shrink-0">{label}</span>
      {buttons}
    </div>
  )
}
