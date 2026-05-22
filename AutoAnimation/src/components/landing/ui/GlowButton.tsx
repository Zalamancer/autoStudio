import { Link } from 'react-router-dom'

interface GlowButtonProps {
  children: React.ReactNode
  to?: string
  href?: string
  variant?: 'solid' | 'ghost'
  className?: string
  onClick?: () => void
  disabled?: boolean
  'aria-label'?: string
}

export function GlowButton({
  children,
  to,
  href,
  variant = 'solid',
  className = '',
  onClick,
  disabled,
  'aria-label': ariaLabel,
}: GlowButtonProps) {
  const base =
    'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent'
  const solid = 'bg-accent text-black hover:bg-accent-hover shadow-glow hover:shadow-glow-lg'
  const ghost = 'border border-white/20 text-white hover:border-white/40 hover:bg-white/5'
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''

  const cls = `${base} ${variant === 'solid' ? solid : ghost} ${disabledStyles} ${className}`

  if (to)
    return (
      <Link to={to} className={cls} aria-label={ariaLabel}>
        {children}
      </Link>
    )
  if (href)
    return (
      <a href={href} className={cls} aria-label={ariaLabel}>
        {children}
      </a>
    )
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={cls}>
      {children}
    </button>
  )
}
