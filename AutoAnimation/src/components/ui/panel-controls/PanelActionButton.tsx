import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface PanelActionButtonProps {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'destructive' | 'accent'
  disabled?: boolean
  loading?: boolean
  icon?: LucideIcon
  fullWidth?: boolean
  size?: 'sm' | 'md'
  className?: string
  'aria-label'?: string
}

const VARIANTS = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'bg-panel-surface text-white hover:bg-panel-surface-hover',
  destructive: 'bg-red-600/10 text-red-400 hover:bg-red-600/20',
  accent: 'bg-accent/10 text-accent border border-accent/30 hover:bg-accent/20',
}

export function PanelActionButton({
  children,
  onClick,
  variant = 'secondary',
  disabled,
  loading,
  icon: Icon,
  fullWidth,
  size = 'md',
  className,
  'aria-label': ariaLabel,
}: PanelActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      className={cn(
        'flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2',
        fullWidth && 'w-full',
        VARIANTS[variant],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : Icon ? <Icon size={14} /> : null}
      {children}
    </button>
  )
}
