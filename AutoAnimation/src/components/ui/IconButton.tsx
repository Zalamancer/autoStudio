import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type IconButtonVariant = 'solid' | 'ghost' | 'outline'
export type IconButtonState = 'default' | 'active' | 'disabled'
export type IconButtonSize = 'sm' | 'md' | 'lg'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  variant?: IconButtonVariant
  state?: IconButtonState
  size?: IconButtonSize
  tooltip?: string
  'aria-label'?: string
}

const variantStyles: Record<IconButtonVariant, Record<IconButtonState, string>> = {
  solid: {
    default: 'bg-panel-surface text-zinc-400 hover:bg-panel-surface-hover hover:text-zinc-300',
    active: 'bg-accent text-white hover:bg-accent-hover',
    disabled: 'bg-panel-surface text-zinc-600 cursor-not-allowed',
  },
  ghost: {
    default: 'bg-transparent text-zinc-400 hover:bg-panel-surface hover:text-zinc-300',
    active: 'bg-accent/20 text-accent',
    disabled: 'text-zinc-600 cursor-not-allowed',
  },
  outline: {
    default: 'border border-panel-border text-zinc-400 hover:border-accent hover:text-accent bg-transparent',
    active: 'border-accent text-accent bg-accent/10',
    disabled: 'border-panel-surface text-zinc-600 cursor-not-allowed bg-transparent',
  },
}

const sizeStyles: Record<IconButtonSize, { button: string; icon: number }> = {
  sm: { button: 'h-8 w-8', icon: 16 },
  md: { button: 'h-10 w-10', icon: 20 },
  lg: { button: 'h-12 w-12', icon: 24 },
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, variant = 'solid', state = 'default', size = 'md', tooltip, className, disabled, ...props }, ref) => {
    const effectiveState = disabled ? 'disabled' : state

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || state === 'disabled'}
        title={tooltip}
        aria-label={props['aria-label'] ?? tooltip}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          variantStyles[variant][effectiveState],
          sizeStyles[size].button,
          className,
        )}
        {...props}
      >
        <Icon size={sizeStyles[size].icon} />
      </button>
    )
  },
)

IconButton.displayName = 'IconButton'
