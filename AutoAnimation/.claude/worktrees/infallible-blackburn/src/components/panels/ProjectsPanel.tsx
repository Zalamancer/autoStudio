import { useEffect, useState } from 'react'
import {
  FolderOpen,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  Clock,
  AlertCircle,
  Check,
  Loader2,
  Cloud,
  CloudOff,
} from 'lucide-react'
import { useProjectStore } from '@/stores'
import { projectService } from '@/services/projectService'
import type { ProjectListItem } from '@/types/database'

export function ProjectsPanel() {
  const {
    currentProjectId,
    currentProjectName,
    projects,
    isSaving,
    isLoading,
    lastSaved,
    error,
    createProject,
    loadProject,
    saveProject,
    deleteProject,
    listProjects,
    renameProject,
    clearError,
  } = useProjectStore()

  const [isConfigured, setIsConfigured] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(currentProjectName)

  // Check if Supabase is configured
  useEffect(() => {
    setIsConfigured(projectService.isAvailable())
    if (projectService.isAvailable()) {
      listProjects()
    }
  }, [listProjects])

  // Update edit name when current project name changes
  useEffect(() => {
    setEditName(currentProjectName)
  }, [currentProjectName])

  const handleCreateProject = async () => {
    try {
      await createProject()
    } catch {
      // Error is already set in store
    }
  }

  const handleSaveProject = async () => {
    try {
      await saveProject()
    } catch {
      // Error is already set in store
    }
  }

  const handleLoadProject = async (project: ProjectListItem) => {
    try {
      await loadProject(project.id)
    } catch {
      // Error is already set in store
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteProject(id)
      setShowDeleteConfirm(null)
    } catch {
      // Error is already set in store
    }
  }

  const handleRename = () => {
    if (editName.trim() && editName !== currentProjectName) {
      renameProject(editName.trim())
    }
    setIsEditing(false)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Not configured state
  if (!isConfigured) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-zinc-400">
          <CloudOff size={20} />
          <h4 className="text-sm font-medium">Cloud Storage</h4>
        </div>

        <div className="bg-zinc-900/40 backdrop-blur-md rounded-xl border border-white/5 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-yellow-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-zinc-400 space-y-2">
              <p>Supabase is not configured. To save projects to the cloud:</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Create a Supabase project at supabase.com</li>
                <li>
                  Add these to your <code className="bg-zinc-800 px-1 rounded">.env</code> file:
                </li>
              </ol>
              <pre className="bg-zinc-800 p-2 rounded text-xs overflow-x-auto mt-2">
                {`VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...`}
              </pre>
              <p className="text-zinc-500 text-xs mt-2">
                Restart the dev server after adding the environment variables.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-300">
          <Cloud size={20} className="text-green-500" />
          <h4 className="text-sm font-medium">Projects</h4>
        </div>
        <button
          onClick={() => listProjects()}
          className="p-1.5 rounded hover:bg-zinc-700/50 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Refresh projects"
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-sm text-red-300">{error}</div>
          <button onClick={clearError} className="text-red-400 hover:text-red-300">
            <span className="sr-only">Dismiss</span>
            &times;
          </button>
        </div>
      )}

      {/* Current project */}
      <div className="bg-zinc-900/40 backdrop-blur-md rounded-xl border border-white/5 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-zinc-500 uppercase tracking-wide">Current Project</span>
          {lastSaved && (
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <Check size={12} className="text-green-500" />
              Saved {formatDate(lastSaved.toISOString())}
            </span>
          )}
        </div>

        {/* Project name */}
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename()
              if (e.key === 'Escape') {
                setEditName(currentProjectName)
                setIsEditing(false)
              }
            }}
            className="w-full bg-zinc-800 border border-zinc-600 rounded px-2 py-1 text-sm text-zinc-200 focus:outline-none focus:border-green-500"
            autoFocus
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="text-sm text-zinc-200 cursor-pointer hover:text-green-400 transition-colors"
          >
            {currentProjectName}
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSaveProject}
          disabled={isSaving}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-600/50 rounded-lg text-white text-sm font-medium transition-colors"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save Project
            </>
          )}
        </button>
      </div>

      {/* New project button */}
      <button
        onClick={handleCreateProject}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-zinc-600 hover:border-green-500 rounded-lg text-zinc-400 hover:text-green-400 text-sm transition-colors"
      >
        <Plus size={16} />
        New Project
      </button>

      {/* Project list */}
      <div className="space-y-2">
        <div className="text-xs text-zinc-500 uppercase tracking-wide">Recent Projects</div>

        {isLoading && projects.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-zinc-500">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-sm text-zinc-500 text-center py-4">No saved projects yet</div>
        ) : (
          <div className="space-y-1 max-h-[300px] overflow-y-auto">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${project.id === currentProjectId
                    ? 'bg-green-500/10 border border-green-500/30 shadow-glow'
                    : 'border border-transparent hover:bg-zinc-800/50 hover:border-white/5'
                  }`}
                onClick={() => handleLoadProject(project)}
              >
                {/* Thumbnail or icon */}
                <div className="w-16 h-12 bg-zinc-700 rounded overflow-hidden flex items-center justify-center flex-shrink-0">
                  {project.thumbnail ? (
                    <img
                      src={project.thumbnail}
                      alt={project.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <FolderOpen size={20} className="text-zinc-500" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-zinc-200 truncate">{project.name}</div>
                  <div className="text-xs text-zinc-500 flex items-center gap-1">
                    <Clock size={10} />
                    {formatDate(project.updated_at)}
                  </div>
                </div>

                {/* Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  {showDeleteConfirm === project.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteProject(project.id)
                        }}
                        className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs"
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDeleteConfirm(null)
                        }}
                        className="p-1 rounded bg-zinc-700 text-zinc-400 hover:bg-zinc-600 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteConfirm(project.id)
                      }}
                      className="p-1.5 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
