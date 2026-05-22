import { useAutoSave, type AutoSaveStatus } from '@/hooks/useAutoSave'
import { useProjectStore } from '@/stores/useProjectStore'
import { Save, Check, Loader2, AlertCircle, Circle } from 'lucide-react'

function formatLastSaved(date: Date | null): string {
  if (!date) return ''

  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)

  if (diffSeconds < 10) return 'just now'
  if (diffSeconds < 60) return `${diffSeconds}s ago`
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString()
}

function StatusIcon({ status }: { status: AutoSaveStatus }) {
  switch (status) {
    case 'saving':
      return <Loader2 size={12} className="animate-spin text-blue-400" />
    case 'saved':
      return <Check size={12} className="text-green-400" />
    case 'dirty':
      return <Circle size={8} className="text-yellow-400 fill-yellow-400" />
    case 'error':
      return <AlertCircle size={12} className="text-red-400" />
    case 'idle':
    default:
      return null
  }
}

function statusLabel(status: AutoSaveStatus, lastSaved: Date | null): string {
  switch (status) {
    case 'saving':
      return 'Saving...'
    case 'saved':
      return `Saved ${formatLastSaved(lastSaved)}`
    case 'dirty':
      return 'Unsaved changes'
    case 'error':
      return 'Save failed'
    case 'idle':
    default:
      return ''
  }
}

export function AutoSaveIndicator() {
  const { status, lastSaved, saveNow, isSaving, error } = useAutoSave(5000)
  const currentProjectId = useProjectStore((s) => s.currentProjectId)
  const currentProjectName = useProjectStore((s) => s.currentProjectName)

  // Don't show anything if no project is loaded
  if (!currentProjectId) return null

  const label = statusLabel(status, lastSaved)

  return (
    <div className="flex items-center justify-between h-8 px-3 bg-zinc-800/80 border-b border-zinc-700/50 shrink-0">
      {/* Left side: project name */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs text-zinc-400 truncate max-w-[200px]">
          {currentProjectName}
        </span>
      </div>

      {/* Right side: save status + manual save button */}
      <div className="flex items-center gap-2">
        {/* Status indicator */}
        {label && (
          <div
            className="flex items-center gap-1.5"
            title={error || label}
          >
            <StatusIcon status={status} />
            <span className={`text-xs ${
              status === 'error' ? 'text-red-400' :
              status === 'dirty' ? 'text-yellow-400' :
              status === 'saving' ? 'text-blue-400' :
              'text-zinc-500'
            }`}>
              {label}
            </span>
          </div>
        )}

        {/* Manual save button */}
        <button
          onClick={() => saveNow()}
          disabled={isSaving}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs text-zinc-400
                     hover:text-zinc-200 hover:bg-zinc-700/50 disabled:opacity-40
                     disabled:cursor-not-allowed transition-colors"
          title="Save project (Ctrl+S)"
        >
          <Save size={12} />
          <span>Save</span>
        </button>
      </div>
    </div>
  )
}
