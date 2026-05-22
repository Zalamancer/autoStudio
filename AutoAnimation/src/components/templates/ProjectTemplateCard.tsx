import { Clock, Copy, Eye, Trash2 } from 'lucide-react'
import type { ProjectTemplate } from '@/types/projectTemplate'

interface ProjectTemplateCardProps {
  template: ProjectTemplate
  onClick: () => void
  onDelete?: () => void
  showDelete?: boolean
}

export function ProjectTemplateCard({
  template,
  onClick,
  onDelete,
  showDelete,
}: ProjectTemplateCardProps) {
  const timeAgo = getTimeAgo(template.updatedAt)

  return (
    <div
      className="group relative rounded-lg border border-panel-border bg-panel-bg hover:border-[#555] transition-colors cursor-pointer overflow-hidden"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-video bg-panel-surface relative overflow-hidden">
        {template.thumbnailUrl ? (
          <img
            src={template.thumbnailUrl}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            <Copy size={32} />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-lg text-white text-sm font-medium backdrop-blur-sm">
            <Eye size={14} />
            Preview
          </span>
        </div>

        {/* Category badge */}
        <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-medium rounded bg-black/60 text-gray-300 backdrop-blur-sm capitalize">
          {template.category.replace('-', ' ')}
        </span>
      </div>

      {/* Info */}
      <div className="p-3 space-y-1.5">
        <h3 className="text-sm font-medium text-white truncate">{template.name}</h3>
        {template.description && (
          <p className="text-xs text-gray-500 line-clamp-2">{template.description}</p>
        )}
        <div className="flex items-center justify-between text-[11px] text-gray-600">
          <span className="flex items-center gap-1">
            <Clock size={10} />
            {timeAgo}
          </span>
          <span className="flex items-center gap-1">
            <Copy size={10} />
            {template.useCount} uses
          </span>
        </div>
        {template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {template.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-[10px] rounded bg-panel-surface text-gray-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Delete button */}
      {showDelete && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="absolute top-2 right-2 p-1.5 rounded-md bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  const diffHrs = Math.floor(diffMins / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 30) return `${diffDays}d ago`
  return date.toLocaleDateString()
}
