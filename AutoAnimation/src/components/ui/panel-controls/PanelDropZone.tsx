import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface PanelDropZoneProps {
  icon: LucideIcon
  label: string
  sublabel?: string
  isDragging: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onClick?: () => void
  className?: string
}

export function PanelDropZone({
  icon: Icon,
  label,
  sublabel,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  className,
}: PanelDropZoneProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed transition-colors cursor-pointer',
        isDragging
          ? 'border-accent bg-accent/10'
          : 'border-panel-border bg-panel-surface hover:border-gray-500',
        className,
      )}
    >
      <Icon size={24} className={cn('mb-2', isDragging ? 'text-accent' : 'text-gray-500')} />
      <p className={cn('text-sm', isDragging ? 'text-accent' : 'text-gray-400')}>{label}</p>
      {sublabel && <p className="text-xs text-gray-600 mt-1">{sublabel}</p>}
    </div>
  )
}
