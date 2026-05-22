import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: number
  className?: string
  label?: string
}

/** Consistent loading spinner used throughout the app. */
export function LoadingSpinner({ size = 16, className, label }: LoadingSpinnerProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <Loader2 size={size} className="animate-spin shrink-0" />
      {label && <span className="text-sm text-zinc-400">{label}</span>}
    </span>
  )
}

interface LoadingOverlayProps {
  label?: string
}

/** Full-area centered loading overlay for panels/sections. */
export function LoadingOverlay({ label = 'Loading...' }: LoadingOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-zinc-400">
      <Loader2 size={24} className="animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
