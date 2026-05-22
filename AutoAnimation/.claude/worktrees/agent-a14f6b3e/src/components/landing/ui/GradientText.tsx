export function GradientText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`bg-gradient-to-r from-accent to-emerald-300 bg-clip-text text-transparent ${className}`}
    >
      {children}
    </span>
  )
}
