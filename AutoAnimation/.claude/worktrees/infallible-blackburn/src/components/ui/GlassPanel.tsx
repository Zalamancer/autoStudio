import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassPanelProps {
  children: ReactNode
  className?: string
  blur?: 'sm' | 'md' | 'lg' | 'xl'
}

const blurStyles = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
  xl: 'backdrop-blur-xl',
}

export function GlassPanel({
  children,
  className,
  blur = 'lg',
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'bg-zinc-800/80 border border-zinc-700/50 rounded-xl',
        blurStyles[blur],
        className
      )}
    >
      {children}
    </div>
  )
}
