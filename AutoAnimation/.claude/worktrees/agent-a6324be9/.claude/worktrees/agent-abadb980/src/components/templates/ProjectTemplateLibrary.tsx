import { useEffect, useState, useCallback } from 'react'
import { Search, RefreshCw, FolderOpen } from 'lucide-react'
import { useProjectTemplateStore } from '@/stores/useProjectTemplateStore'
import { ProjectTemplateCard } from './ProjectTemplateCard'
import { ProjectTemplatePreview } from './ProjectTemplatePreview'
import { TEMPLATE_CATEGORIES, type ProjectTemplate } from '@/types/projectTemplate'

interface ProjectTemplateLibraryProps {
  /** When true, show user's own templates with delete option */
  showMyTemplates?: boolean
}

export function ProjectTemplateLibrary({ showMyTemplates }: ProjectTemplateLibraryProps) {
  const templates = useProjectTemplateStore((s) => s.templates)
  const myTemplates = useProjectTemplateStore((s) => s.myTemplates)
  const isLoading = useProjectTemplateStore((s) => s.isLoading)
  const error = useProjectTemplateStore((s) => s.error)
  const searchQuery = useProjectTemplateStore((s) => s.searchQuery)
  const categoryFilter = useProjectTemplateStore((s) => s.categoryFilter)
  const {
    fetchPublished,
    fetchMyTemplates,
    setSearch,
    setCategory,
    deleteTemplate,
    clearError,
  } = useProjectTemplateStore()

  const [previewTemplate, setPreviewTemplate] = useState<ProjectTemplate | null>(null)

  // Fetch on mount
  useEffect(() => {
    if (showMyTemplates) {
      fetchMyTemplates()
    } else {
      fetchPublished()
    }
  }, [showMyTemplates, fetchPublished, fetchMyTemplates])

  // Re-fetch when filters change
  useEffect(() => {
    if (!showMyTemplates) {
      fetchPublished()
    }
  }, [searchQuery, categoryFilter, showMyTemplates, fetchPublished])

  const handleRefresh = useCallback(() => {
    if (showMyTemplates) {
      fetchMyTemplates()
    } else {
      fetchPublished()
    }
  }, [showMyTemplates, fetchPublished, fetchMyTemplates])

  const displayTemplates = showMyTemplates ? myTemplates : templates

  // Filter my templates locally (published uses server-side filtering)
  const filteredTemplates = showMyTemplates
    ? displayTemplates.filter((t) => {
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false
        if (searchQuery) {
          const q = searchQuery.toLowerCase()
          return (
            t.name.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tags.some((tag) => tag.toLowerCase().includes(q))
          )
        }
        return true
      })
    : displayTemplates

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-3 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search
              size={14}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="w-full pl-8 pr-3 py-1.5 text-sm bg-[#2a2a2a] border border-[#3a3a3a] rounded-md text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-md hover:bg-[#2a2a2a] text-gray-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-1">
          <CategoryPill
            label="All"
            active={categoryFilter === 'all'}
            onClick={() => setCategory('all')}
          />
          {TEMPLATE_CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat.value}
              label={cat.label}
              active={categoryFilter === cat.value}
              onClick={() => setCategory(cat.value)}
            />
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-300 hover:text-white text-xs ml-2">
            Dismiss
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-3 pb-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 text-gray-500 text-sm">
            Loading templates...
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-2">
            <FolderOpen size={32} />
            <p className="text-sm">
              {searchQuery || categoryFilter !== 'all'
                ? 'No templates match your filters'
                : showMyTemplates
                  ? 'You haven\'t created any templates yet'
                  : 'No published templates available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredTemplates.map((template) => (
              <ProjectTemplateCard
                key={template.id}
                template={template}
                onClick={() => setPreviewTemplate(template)}
                onDelete={showMyTemplates ? () => deleteTemplate(template.id) : undefined}
                showDelete={showMyTemplates}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview modal */}
      {previewTemplate && (
        <ProjectTemplatePreview
          template={previewTemplate}
          onClose={() => setPreviewTemplate(null)}
        />
      )}
    </div>
  )
}

function CategoryPill({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 text-[11px] rounded-full transition-colors ${
        active
          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          : 'bg-[#2a2a2a] text-gray-500 hover:text-gray-300 border border-transparent'
      }`}
    >
      {label}
    </button>
  )
}
