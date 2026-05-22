import { Link } from 'react-router-dom'

interface GlowButtonProps {
  children: React.ReactNode
  to?: string
  href?: string
  variant?: 'solid' | 'ghost'
  className?: string
  onClick?: () => void
}

export function GlowButton({ children, to, href, variant = 'solid', className = '', onClick }: GlowButtonProps) {
  const base = 'inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 cursor-pointer'
  const solid =
    'bg-accent text-black hover:bg-accent-hover shadow-glow hover:shadow-glow-lg'
  const ghost =
    'border border-white/20 text-white hover:border-white/40 hover:bg-white/5'

  const cls = `${base} ${variant === 'solid' ? solid : ghost} ${className}`

  if (to) return <Link to={to} className={cls}>{children}</Link>
  if (href) return <a href={href} className={cls}>{children}</a>
  return <button onClick={onClick} className={cls}>{children}</button>
}
