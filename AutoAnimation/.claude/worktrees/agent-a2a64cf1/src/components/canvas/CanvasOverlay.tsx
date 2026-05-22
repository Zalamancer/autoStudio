import type { ReactNode } from 'react'
import { X, RotateCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface CanvasOverlayProps {
  title: string
  icon?: LucideIcon
  onClose: () => void
  onRetry?: () => void
  retryDisabled?: boolean
  children: ReactNode
}

export function CanvasOverlay({ title, icon: Icon, onClose, onRetry, retryDisabled, children }: CanvasOverlayProps) {
  return (
    <div
      className="fixed inset-0 md:absolute md:inset-3 z-50 bg-zinc-800/95 backdrop-blur-sm md:border border-zinc-700/50 md:rounded-xl shadow-2xl flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Title bar */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-white/5">
        {Icon && <Icon size={16} className="text-green-400" />}
        <span className="text-sm font-medium text-zinc-200">{title}</span>
        <div className="flex-1" />
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={retryDisabled}
            className="flex items-center justify-center w-6 h-6 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Retry"
          >
            <RotateCw size={14} />
          </button>
        )}
        <button
          onClick={onClose}
          className="flex items-center justify-center w-6 h-6 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-700/50 transition-colors"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
