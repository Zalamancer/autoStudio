import { type ReactNode } from 'react'
import { Eye, EyeOff, GripVertical } from 'lucide-react'

export interface TrackShellProps {
  /** Color for the left indicator strip */
  color: string
  /** Track label displayed in header */
  label: string
  /** Whether the track is visible */
  isVisible?: boolean
  /** Toggle visibility callback — shows eye icon when provided */
  onToggleVisibility?: () => void
  /** Click handler for the row */
  onClick?: () => void
  /** Track height in px */
  height?: number
  /** Extra className on the outer wrapper */
  className?: string
  /** Optional custom header content — replaces the default strip + label */
  headerContent?: ReactNode
  /** Extra buttons appended after the label (e.g. lock, mute) */
  extraControls?: ReactNode
  /** Content area (clips, bars, diamonds, etc.) */
  children: ReactNode
}

/**
 * Shared outer shell for every timeline track row.
 * Provides the identical header (color strip, label, optional eye toggle)
 * and content area so all track types look consistent.
 */
export function TrackShell({
  color,
  label,
  isVisible = true,
  onToggleVisibility,
  onClick,
  height = 48,
  className = '',
  headerContent,
  extraControls,
  children,
}: TrackShellProps) {
  return (
    <div
      className={`flex border-b border-zinc-700/50 relative ${!isVisible ? 'opacity-50' : ''} ${className}`}
      style={{ height }}
      onClick={onClick}
    >
      {/* Track Header */}
      <div className="w-40 flex-shrink-0 flex items-center gap-1 px-1 bg-zinc-800 border-r border-zinc-700/50 sticky left-0 z-10">
        {headerContent ?? (
          <>
            {/* Drag hint */}
            <GripVertical size={12} className="text-zinc-600 flex-shrink-0" />
            {/* Color indicator strip */}
            <div className="w-1.5 h-full rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
            {/* Track Name */}
            <span className="flex-1 text-xs text-zinc-300 truncate select-none">{label}</span>
            {/* Visibility toggle */}
            {onToggleVisibility && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onToggleVisibility()
                }}
                className="p-0.5 text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
              >
                {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
              </button>
            )}
            {extraControls}
          </>
        )}
      </div>

      {/* Track Content */}
      <div className="flex-1 relative bg-zinc-900/50">{children}</div>
    </div>
  )
}
