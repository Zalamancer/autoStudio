import { useState, useCallback } from 'react'
import { X, Copy, Loader2 } from 'lucide-react'
import type { ProjectTemplate } from '@/types/projectTemplate'
import { instantiateTemplate } from '@/services/templateService'
import { TemplateVariableForm } from './TemplateVariableForm'
import { useNavigate } from 'react-router-dom'

interface ProjectTemplatePreviewProps {
  template: ProjectTemplate
  onClose: () => void
}

export function ProjectTemplatePreview({
  template,
  onClose,
}: ProjectTemplatePreviewProps) {
  const navigate = useNavigate()
  const [values, setValues] = useState<Record<string, string | number | boolean>>(() => {
    const defaults: Record<string, string | number | boolean> = {}
    for (const v of template.variables) {
      defaults[v.key] = v.defaultValue
    }
    return defaults
  })
  const [projectName, setProjectName] = useState(`${template.name}`)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = useCallback((key: string, value: string | number | boolean) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleCreate = useCallback(async () => {
    setIsCreating(true)
    setError(null)
    try {
      await instantiateTemplate(template.id, values, projectName)
      onClose()
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create from template')
    } finally {
      setIsCreating(false)
    }
  }, [template.id, values, projectName, onClose, navigate])

  const hasVariables = template.variables.length > 0
  const canvasInfo = template.snapshot.canvas

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#1e1e1e] rounded-xl border border-[#3a3a3a] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <div>
            <h2 className="text-lg font-semibold text-white">{template.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {canvasInfo.aspectRatio} &middot; {canvasInfo.fps}fps &middot; {Math.round(canvasInfo.totalFrames / canvasInfo.fps)}s
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Thumbnail */}
          {template.thumbnailUrl && (
            <div className="aspect-video rounded-lg overflow-hidden bg-[#2a2a2a]">
              <img
                src={template.thumbnailUrl}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Description */}
          {template.description && (
            <p className="text-sm text-gray-400">{template.description}</p>
          )}

          {/* Tags */}
          {template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full bg-[#2a2a2a] text-gray-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Project name */}
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full px-3 py-1.5 text-sm bg-[#2a2a2a] border border-[#3a3a3a] rounded-md text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Variable form */}
          {hasVariables && (
            <div>
              <h3 className="text-sm font-medium text-white mb-3">Customize</h3>
              <TemplateVariableForm
                variables={template.variables}
                values={values}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Template info */}
          <div className="text-xs text-gray-600 space-y-1">
            <p>Category: {template.category.replace('-', ' ')}</p>
            <p>Used {template.useCount} times</p>
            <p>Version {template.version}</p>
          </div>

          {error && (
            <div className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#2a2a2a]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Copy size={14} />
                Create from Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
