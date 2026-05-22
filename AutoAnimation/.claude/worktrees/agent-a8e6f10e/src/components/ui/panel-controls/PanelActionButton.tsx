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
}

const VARIANTS = {
  primary: 'bg-[#4a7eff] text-white hover:bg-[#3a6aee]',
  secondary: 'bg-[#2a2a2a] text-white hover:bg-[#3a3a3a]',
  destructive: 'bg-red-600/10 text-red-400 hover:bg-red-600/20',
  accent: 'bg-[#4a7eff]/10 text-[#4a7eff] border border-[#4a7eff]/30 hover:bg-[#4a7eff]/20',
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
}: PanelActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'flex items-center justify-center gap-1.5 rounded-lg text-sm font-medium transition-colors',
        size === 'sm' ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2',
        fullWidth && 'w-full',
        VARIANTS[variant],
        (disabled || loading) && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : Icon ? (
        <Icon size={14} />
      ) : null}
      {children}
    </button>
  )
}
