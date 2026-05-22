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
}

const variantStyles: Record<IconButtonVariant, Record<IconButtonState, string>> = {
  solid: {
    default: 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-300',
    active: 'bg-green-500 text-white hover:bg-green-600',
    disabled: 'bg-zinc-900 text-zinc-600 cursor-not-allowed',
  },
  ghost: {
    default: 'bg-transparent text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300',
    active: 'bg-green-500/20 text-green-500',
    disabled: 'text-zinc-600 cursor-not-allowed',
  },
  outline: {
    default: 'border border-zinc-700 text-zinc-400 hover:border-green-500 hover:text-green-500 bg-transparent',
    active: 'border-green-500 text-green-500 bg-green-500/10',
    disabled: 'border-zinc-800 text-zinc-600 cursor-not-allowed bg-transparent',
  },
}

const sizeStyles: Record<IconButtonSize, { button: string; icon: number }> = {
  sm: { button: 'h-8 w-8', icon: 16 },
  md: { button: 'h-10 w-10', icon: 20 },
  lg: { button: 'h-12 w-12', icon: 24 },
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon: Icon,
      variant = 'solid',
      state = 'default',
      size = 'md',
      tooltip,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const effectiveState = disabled ? 'disabled' : state

    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled || state === 'disabled'}
        title={tooltip}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:ring-offset-2 focus:ring-offset-zinc-900',
          variantStyles[variant][effectiveState],
          sizeStyles[size].button,
          className
        )}
        {...props}
      >
        <Icon size={sizeStyles[size].icon} />
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'
