import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface PanelCheckboxProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
  icon?: LucideIcon
  className?: string
}

export function PanelCheckbox({ label, checked, onChange, icon: Icon, className }: PanelCheckboxProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn(
        'w-full flex items-center gap-2 py-1 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded',
        className,
      )}
    >
      <div
        className={cn(
          'w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors',
          checked ? 'bg-accent border-accent' : 'bg-panel-surface border-panel-border group-hover:border-gray-500',
        )}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M2 5L4 7L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      {Icon && <Icon size={12} className="text-gray-500 shrink-0" />}
      <span className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">{label}</span>
    </button>
  )
}
