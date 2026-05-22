interface GlassCardProps {
  children: React.ReactNode
  className?: string
  hover?: boolean
}

export function GlassCard({ children, className = '', hover = false }: GlassCardProps) {
  return (
    <div
      className={`
        rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-xl
        ${hover ? 'hover:border-white/[0.12] hover:bg-white/[0.05] transition-all duration-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
