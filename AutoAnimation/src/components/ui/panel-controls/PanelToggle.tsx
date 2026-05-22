import { cn } from '@/lib/utils'

interface PanelToggleProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  description?: string
  className?: string
}

export function PanelToggle({ label, checked, onChange, description, className }: PanelToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      role="switch"
      aria-checked={checked}
      className={cn(
        'w-full flex items-center gap-3 mb-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded',
        className,
      )}
    >
      <div className="flex-1 min-w-0 text-left">
        <span className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">{label}</span>
        {description && <span className="text-gray-600 text-xs ml-1.5">{description}</span>}
      </div>
      <div
        className={cn(
          'relative w-10 h-6 rounded-full shrink-0 transition-colors',
          checked ? 'bg-accent' : 'bg-panel-surface-hover',
        )}
      >
        <span
          className={cn(
            'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform',
            checked && 'translate-x-4',
          )}
        />
      </div>
    </button>
  )
}
