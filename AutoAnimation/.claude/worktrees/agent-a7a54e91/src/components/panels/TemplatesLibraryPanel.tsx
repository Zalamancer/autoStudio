import { useState, useCallback, useRef, useMemo } from 'react'
import {
  ShoppingBag,
  Search,
  Code,
  FolderOpen,
  Wand2,
  Plus,
  Trash2,
  FileCode,
  Upload,
  Clipboard,
  Eye,
  Save,
  Loader2,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Info,
  Tag,
  Wrench,
  BookMarked,
  Maximize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { useMarketplaceStore, type MarketplaceItem } from '@/stores/useMarketplaceStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { generateHTMLThumbnail } from '@/services/htmlRenderer'
import { useEditorStore } from '@/stores'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { parseTemplateConfig, type TemplateConfigProperty, type ConfigPropertyType } from '@/services/templateConfigParser'
import { injectMessageBridge } from '@/services/templateBridge'
import { getTemplateAnalysis } from '@/services/templateAnalyzer'
import type { AITemplateAnalysis, AIFieldType } from '@/types/templateAnalysis'
import { getTemplateContent, BUILTIN_TEMPLATES, type BuiltinTemplate } from '@/data/builtinTemplates'
import { resolveTemplateType, getMotionGraphic } from '@/motionGraphics'
import { useMotionGraphicStore } from '@/stores/useMotionGraphicStore'

// ── AI field → static config property merging ────────────────────────

function aiFieldTypeToConfigType(ft: AIFieldType): ConfigPropertyType {
  switch (ft) {
    case 'color': case 'gradient': return 'color'
    case 'number': return 'number'
    case 'boolean': return 'boolean'
    case 'text-array': return 'text-array'
    case 'object-array': return 'object-array'
    default: return 'text'
  }
}

function aiGroupToConfigGroup(g: string): string {
  switch (g) {
    case 'Content': case 'Typography': case 'Media': return 'Text'
    case 'Colors': return 'Colors'
    case 'Animation': return 'Animation'
    case 'Data': return 'Data'
    case 'Layout': return 'Numbers'
    default: return 'Text'
  }
}

/** Merge AI-discovered fields into existing static config, adding any new fields */
function mergeAIFieldsIntoConfig(
  staticConfig: TemplateConfigProperty[],
  analysis: AITemplateAnalysis,
): TemplateConfigProperty[] {
  const existingKeys = new Set(staticConfig.map((p) => p.key))
  const merged = [...staticConfig]

  for (const field of analysis.fields) {
    if (existingKeys.has(field.key)) continue
    merged.push({
      key: field.key,
      label: field.label,
      type: aiFieldTypeToConfigType(field.fieldType),
      value: field.defaultValue,
      group: aiGroupToConfigGroup(field.group),
    })
  }

  return merged
}

// ── Category filters ─────────────────────────────────────────────────
type FilterTab = 'all' | 'html-templates' | 'captions' | 'collages' | 'projects' | 'ai-animations'

const filterTabs: { id: FilterTab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'all', label: 'All', icon: ShoppingBag },
  { id: 'html-templates', label: 'HTML', icon: Code },
  { id: 'captions', label: 'Captions', icon: FileCode },
  { id: 'collages', label: 'Collages', icon: LayoutGrid },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'ai-animations', label: 'AI', icon: Wand2 },
]

const CATEGORY_META: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; color: string; badgeBg: string }> = {
  'html-templates': { label: 'HTML Templates', icon: Code, color: 'text-blue-400', badgeBg: 'bg-blue-600/80' },
  captions: { label: 'Captions', icon: FileCode, color: 'text-amber-400', badgeBg: 'bg-amber-600/80' },
  collages: { label: 'Collages', icon: LayoutGrid, color: 'text-pink-400', badgeBg: 'bg-pink-600/80' },
  projects: { label: 'Saved Projects', icon: FolderOpen, color: 'text-emerald-400', badgeBg: 'bg-emerald-600/80' },
  'ai-animations': { label: 'AI Animations', icon: Wand2, color: 'text-[#4a7eff]', badgeBg: 'bg-[#4a7eff]/80' },
}

// ── Inline upload section ────────────────────────────────────────────
type UploadMode = 'file' | 'paste'

function InlineUpload({
  onSave,
  onClose,
}: {
  onSave: (htmlContent: string, title: string, description: string) => Promise<void>
  onClose: () => void
}) {
  const [mode, setMode] = useState<UploadMode>('paste')
  const [htmlCode, setHtmlCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const content = ev.target?.result as string
        setHtmlCode(content)
        if (!title) setTitle(file.name.replace(/\.(html?|htm)$/i, ''))
        setMode('paste')
      }
      reader.readAsText(file)
    }
  }, [title])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const content = ev.target?.result as string
        setHtmlCode(content)
        if (!title) setTitle(file.name.replace(/\.(html?|htm)$/i, ''))
        setMode('paste')
      }
      reader.readAsText(file)
    }
  }, [title])

  const handleSave = useCallback(async () => {
    if (!htmlCode.trim() || !title.trim()) return
    setSaving(true)
    try {
      await onSave(htmlCode, title.trim(), description.trim())
      setHtmlCode('')
      setTitle('')
      setDescription('')
      onClose()
    } finally {
      setSaving(false)
    }
  }, [htmlCode, title, description, onSave, onClose])

  return (
    <div className="border border-white/5 rounded-lg bg-[#2a2a2a]/80 overflow-hidden mb-3">
      {/* Tabs */}
      <div className="flex items-center border-b border-white/5">
        <button
          onClick={() => setMode('file')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
            mode === 'file' ? 'text-blue-400 bg-blue-500/10 border-b border-blue-400' : 'text-gray-500 hover:text-gray-400'
          )}
        >
          <Upload size={10} /> File
        </button>
        <button
          onClick={() => setMode('paste')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1 py-2 text-[10px] font-medium transition-colors',
            mode === 'paste' ? 'text-blue-400 bg-blue-500/10 border-b border-blue-400' : 'text-gray-500 hover:text-gray-400'
          )}
        >
          <Clipboard size={10} /> Paste
        </button>
        <button onClick={onClose} className="px-2 py-2 text-gray-500 hover:text-gray-300">
          <X size={12} />
        </button>
      </div>

      <div className="p-2.5 space-y-2">
        {mode === 'file' ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border border-dashed rounded-lg py-5 flex flex-col items-center gap-1.5 cursor-pointer transition-colors',
              isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-[#3a3a3a] hover:border-gray-500 bg-[#1e1e1e]/50'
            )}
          >
            <Upload size={18} className={isDragging ? 'text-blue-400' : 'text-gray-500'} />
            <p className="text-[10px] text-gray-400">Drop .html file or click</p>
            <input ref={fileInputRef} type="file" accept=".html,.htm" onChange={handleFileSelect} className="hidden" />
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              placeholder="Paste HTML code..."
              className="w-full h-28 bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg p-2 text-[10px] text-white font-mono resize-none focus:border-blue-500 focus:outline-none placeholder:text-gray-600"
              spellCheck={false}
            />
            {htmlCode.trim() && (
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-[9px] text-gray-500 font-medium">
                  <Eye size={9} /> Preview
                </div>
                <div className="border border-[#3a3a3a] rounded overflow-hidden bg-white">
                  <iframe srcDoc={htmlCode} sandbox="allow-scripts" className="w-full h-24 pointer-events-none" title="Preview" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Template name"
          className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:border-blue-500 focus:outline-none placeholder:text-gray-600"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:border-blue-500 focus:outline-none placeholder:text-gray-600"
        />

        <button
          onClick={handleSave}
          disabled={!htmlCode.trim() || !title.trim() || saving}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-semibold transition-colors',
            htmlCode.trim() && title.trim() && !saving
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-[#3a3a3a] text-gray-500 cursor-not-allowed'
          )}
        >
          {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
          {saving ? 'Saving...' : 'Save Template'}
        </button>
      </div>
    </div>
  )
}

// ── Horizontal scrollable row ────────────────────────────────────────
function HorizontalRow({ children }: { children: React.ReactNode }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'left' ? -180 : 180, behavior: 'smooth' })
  }, [])

  return (
    <div className="relative group/row">
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#2a2a2a]/90 border border-[#3a3a3a] flex items-center justify-center text-gray-300 hover:bg-[#3a3a3a] shadow-lg opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronLeft size={14} />
        </button>
      )}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        onMouseEnter={checkScroll}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {children}
      </div>
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#2a2a2a]/90 border border-[#3a3a3a] flex items-center justify-center text-gray-300 hover:bg-[#3a3a3a] shadow-lg opacity-0 group-hover/row:opacity-100 transition-opacity"
        >
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────

/** Lookup table from item id → BuiltinTemplate (for tags etc.) */
const builtinById = new Map<string, BuiltinTemplate>(
  BUILTIN_TEMPLATES.map((t) => [t.id, t])
)

/** Get tags for a marketplace item */
function getItemTags(item: MarketplaceItem): string[] {
  return builtinById.get(item.id)?.tags ?? []
}

/** Collect unique tags from a list of items, sorted by frequency */
function collectTags(items: MarketplaceItem[]): string[] {
  const freq = new Map<string, number>()
  for (const item of items) {
    for (const tag of getItemTags(item)) {
      freq.set(tag, (freq.get(tag) ?? 0) + 1)
    }
  }
  return [...freq.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag)
}

// ── Card components ──────────────────────────────────────────────────

/** Resolve htmlContent — fall back to Vite raw import for built-in templates */
function resolveHtmlContent(item: MarketplaceItem): string | undefined {
  if (item.htmlContent) return item.htmlContent
  const builtin = BUILTIN_TEMPLATES.find((t) => t.id === item.id)
  if (builtin) return getTemplateContent(builtin.filename) ?? undefined
  return undefined
}

/** Check whether an item is a built-in template (as opposed to user-created) */
const isBuiltinItem = (id: string) => BUILTIN_TEMPLATES.some((t) => t.id === id)

/**
 * Stable colour derived from the template id so each card gets a unique
 * but consistent gradient.  Only used for built-in template placeholders.
 */
function idToGradient(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  const h1 = ((hash >>> 0) % 360)
  const h2 = (h1 + 40) % 360
  return `linear-gradient(135deg, hsl(${h1},50%,18%), hsl(${h2},60%,12%))`
}

// ── Autoplay preview thumbnail ──────────────────────────────────────
// Shows a static gradient placeholder by default.  On hover, lazily loads
// a live iframe so the animation plays as a preview. Only one iframe at
// a time (the hovered card), so performance stays fine even with 200+ cards.

function AutoplayThumbnail({ item }: { item: MarketplaceItem }) {
  const [hovered, setHovered] = useState(false)
  const htmlContent = useRef<string | null | undefined>(undefined) // undefined = not resolved yet
  const isHTMLCategory = item.category === 'html-templates' || item.category === 'captions' || item.category === 'collages'

  // Resolve HTML only on first hover
  if (hovered && htmlContent.current === undefined && isHTMLCategory) {
    htmlContent.current = resolveHtmlContent(item) ?? null
  }

  // User-created templates always show live preview
  const isBuiltin = isBuiltinItem(item.id)
  const alwaysLive = !isBuiltin && item.htmlContent && isHTMLCategory

  if (alwaysLive) {
    return (
      <div
        className="w-full h-full"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <iframe
          srcDoc={item.htmlContent}
          sandbox="allow-scripts"
          className="w-full h-full pointer-events-none border-0"
          style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: '400%', height: '400%' }}
          title={item.title}
        />
      </div>
    )
  }

  if (item.category === 'ai-animations' && item.videoUrl) {
    return (
      <video
        src={item.videoUrl}
        muted
        loop
        playsInline
        preload="metadata"
        className="w-full h-full object-contain"
        onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
        onMouseLeave={(e) => { const v = e.target as HTMLVideoElement; v.pause(); v.currentTime = 0 }}
      />
    )
  }

  if (item.thumbnailUrl && !isHTMLCategory) {
    return <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
  }

  // HTML template: gradient placeholder + live iframe on hover
  if (isHTMLCategory) {
    return (
      <div
        className="w-full h-full relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Gradient placeholder (always visible underneath) */}
        <div
          className="absolute inset-0 flex items-center justify-center p-2"
          style={{ background: idToGradient(item.id) }}
        >
          <span className="text-[9px] text-white/50 font-semibold text-center leading-tight line-clamp-3">
            {item.title}
          </span>
        </div>
        {/* Live iframe on hover */}
        {hovered && htmlContent.current && (
          <iframe
            srcDoc={htmlContent.current}
            sandbox="allow-scripts"
            className="absolute inset-0 w-full h-full pointer-events-none border-0 z-[1]"
            style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: '400%', height: '400%' }}
            title={item.title}
          />
        )}
      </div>
    )
  }

  // Fallback icon
  const meta = CATEGORY_META[item.category]
  const Icon = meta?.icon || Code
  return (
    <div className="w-full h-full flex items-center justify-center">
      <Icon size={20} className="text-gray-600" />
    </div>
  )
}

// ── Info preview modal ──────────────────────────────────────────────

function TemplatePreviewModal({
  item,
  onClose,
  onUse,
}: {
  item: MarketplaceItem
  onClose: () => void
  onUse: () => void
}) {
  const htmlContent = resolveHtmlContent(item)
  const tags = getItemTags(item)

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-[90vw] max-w-[640px] max-h-[85vh] bg-[#1e1e1e] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{item.title}</h3>
            {item.description && (
              <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Live preview */}
        <div className="flex-1 min-h-0 bg-black relative" style={{ aspectRatio: '16/9' }}>
          {htmlContent ? (
            <iframe
              srcDoc={htmlContent}
              sandbox="allow-scripts"
              className="w-full h-full border-0"
              style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
              title={item.title}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: idToGradient(item.id) }}>
              <span className="text-sm text-white/40">No preview available</span>
            </div>
          )}
        </div>

        {/* Tags + actions */}
        <div className="px-4 py-3 border-t border-white/5 space-y-2">
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] text-gray-400">
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => { onUse(); onClose() }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              <Plus size={12} /> Use Template
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-300 text-xs font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TemplateCard({
  item,
  onUse,
  onDelete,
  onInfo,
  onTogglePublish,
  loading,
  gridMode,
  showDevMode,
}: {
  item: MarketplaceItem
  onUse: () => void
  onDelete: () => void
  onInfo: () => void
  onTogglePublish?: () => void
  loading: boolean
  gridMode?: boolean
  showDevMode?: boolean
}) {
  const meta = CATEGORY_META[item.category]
  const Icon = meta?.icon || Code
  const badgeBg = meta?.badgeBg || 'bg-[#3a3a3a]/80'
  const badgeLabel = item.category === 'html-templates' ? 'HTML' : item.category === 'captions' ? 'Caption' : item.category === 'collages' ? 'Collage' : item.category === 'projects' ? 'Project' : 'AI'
  const isUnpublished = showDevMode && !item.published && isBuiltinItem(item.id)

  return (
    <div className={cn('rounded-lg border border-white/5 bg-[#2a2a2a]/80 overflow-hidden transition-all hover:border-gray-500/60 group', gridMode ? 'w-full' : 'flex-shrink-0 w-[140px]', isUnpublished && 'opacity-50')}>
      {/* Thumbnail with autoplay on hover */}
      <div className="aspect-[4/3] bg-[#1e1e1e] relative overflow-hidden">
        <AutoplayThumbnail item={item} />
        <div className={cn('absolute top-1 left-1 px-1.5 py-0.5 rounded text-[7px] font-bold text-white flex items-center gap-0.5 z-10', badgeBg)}>
          <Icon size={7} /> {badgeLabel}
        </div>
        {/* Info button */}
        <button
          onClick={(e) => { e.stopPropagation(); onInfo() }}
          className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-gray-300 hover:text-white transition-all opacity-0 group-hover:opacity-100"
          title="Preview"
        >
          <Info size={10} />
        </button>
      </div>

      {/* Info */}
      <div className="p-1.5 space-y-1">
        <h4 className="text-[10px] font-semibold text-white truncate">{item.title}</h4>
        {item.description && (
          <p className="text-[8px] text-gray-500 truncate">{item.description}</p>
        )}
        <div className="flex gap-1">
          <button
            onClick={onUse}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-0.5 py-1 rounded bg-[#3a3a3a] hover:bg-[#3a3a3a] disabled:opacity-50 text-gray-300 text-[9px] font-medium transition-colors"
          >
            {loading ? <Loader2 size={9} className="animate-spin" /> : <Plus size={9} />}
            Use
          </button>
          {showDevMode && onTogglePublish && isBuiltinItem(item.id) && (
            <button
              onClick={(e) => { e.stopPropagation(); onTogglePublish() }}
              className={cn(
                'px-1 py-1 rounded text-[9px] transition-colors',
                item.published
                  ? 'bg-emerald-600/30 text-emerald-400 hover:bg-emerald-600/50'
                  : 'bg-[#3a3a3a] text-gray-500 hover:bg-amber-600/30 hover:text-amber-400'
              )}
              title={item.published ? 'Unpublish from library' : 'Publish to library'}
            >
              <BookMarked size={9} />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="px-1 py-1 rounded bg-[#3a3a3a] hover:bg-red-600 text-gray-500 hover:text-white text-[9px] transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 size={9} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main panel ───────────────────────────────────────────────────────

export function TemplatesLibraryPanel() {
  const { items, searchQuery, setSearchQuery, removeItem, addItem, showDevTemplates, setShowDevTemplates, togglePublished } = useMarketplaceStore()
  const setLibraryModalOpen = useEditorStore((s) => s.setLibraryModalOpen)
  const canvasWidth = useCanvasStore((s) => s.canvasWidth)
  const canvasHeight = useCanvasStore((s) => s.canvasHeight)
  const addClip = useTimelineStore((s) => s.addClip)
  const timelineFps = useTimelineStore((s) => s.fps)
  const addVideo = useVideoLayerStore((s) => s.addVideo)

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [previewItem, setPreviewItem] = useState<MarketplaceItem | null>(null)

  // Filter items: show published + user-created by default, show ALL when dev mode is on
  const visibleItems = useMemo(() => {
    if (showDevTemplates) return items
    return items.filter((item) => item.published || !isBuiltinItem(item.id))
  }, [items, showDevTemplates])

  // Filter visible items by category
  const categoryFiltered = visibleItems.filter((item) => {
    const matchesFilter = activeFilter === 'all' || item.category === activeFilter
    const matchesSearch = searchQuery === '' ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  // Collect available tags from category-filtered items
  const availableTags = useMemo(() => collectTags(categoryFiltered), [categoryFiltered])

  // Further filter by tag
  const filteredItems = activeTag
    ? categoryFiltered.filter((item) => getItemTags(item).includes(activeTag))
    : categoryFiltered

  // Whether we're in "tag filtered" mode (show 2-col grid instead of carousel)
  const isTagFiltered = activeTag !== null

  // Group by category
  const grouped: Record<string, MarketplaceItem[]> = {}
  for (const item of filteredItems) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  }

  // Use HTML template → add as live iframe layer on canvas + timeline clip
  const handleUseHTMLTemplate = useCallback((item: MarketplaceItem) => {
    // Check if this template has a React motion graphic version
    if (resolveTemplateType(item.id) === 'react') {
      const registration = getMotionGraphic(item.id)
      if (registration) {
        const totalFrames = useTimelineStore.getState().totalFrames
        const mgId = `mg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        useMotionGraphicStore.getState().addInstance({
          id: mgId,
          templateId: item.id,
          name: item.title,
          config: { ...registration.defaultConfig },
          position: { x: 0, y: 0 },
          scale: 1,
          opacity: 1,
          zIndex: 1,
          rotation: 0,
          visible: true,
          startFrame: 0,
          endFrame: totalFrames,
        })
        return
      }
    }

    const html = resolveHtmlContent(item)
    if (!html) {
      console.warn('[TemplatesLibrary] No htmlContent for template:', item.id)
      return
    }

    const totalFrames = useTimelineStore.getState().totalFrames
    const templateId = `html-tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    // Parse editable config properties from the template HTML (static, instant)
    const staticConfig = parseTemplateConfig(html)

    // Inject postMessage bridge for live property updates
    const bridgedHtml = injectMessageBridge(html)

    // Add live iframe template to canvas with static config first
    useHTMLTemplateLayerStore.getState().addTemplate({
      id: templateId,
      htmlContent: bridgedHtml,
      name: item.title,
      position: { x: 0, y: 0 },
      scale: 1,
      opacity: 1,
      zIndex: 1,
      rotation: 0,
      visible: true,
      width: canvasWidth,
      height: canvasHeight,
      startFrame: 0,
      endFrame: totalFrames,
      customConfig: staticConfig,
    })

    // Analyze with AI, then merge discovered fields into the template's config
    getTemplateAnalysis(item.id, html)
      .then((analysis) => {
        if (analysis.fields.length > 0) {
          const merged = mergeAIFieldsIntoConfig(staticConfig, analysis)
          if (merged.length > staticConfig.length) {
            useHTMLTemplateLayerStore.getState().updateTemplate(templateId, { customConfig: merged })
            console.log(`[TemplatesLibrary] Merged ${merged.length - staticConfig.length} AI-discovered fields into template config`)
          }
        }
      })
      .catch((err) =>
        console.warn('[TemplatesLibrary] Template analysis failed:', err),
      )
  }, [canvasWidth, canvasHeight])

  // Import AI animation to timeline/canvas
  const handleImportAIAnimation = useCallback((item: MarketplaceItem) => {
    if (!item.videoUrl) return
    const totalFrames = Math.round((item.durationSeconds || 10) * timelineFps)
    const clipId = `mp-${item.id}-${Date.now()}`

    addClip('video-1', {
      id: clipId,
      trackId: 'video-1',
      startFrame: 0,
      endFrame: totalFrames,
      sourceId: item.videoUrl,
      sourceInPoint: 0,
      sourceOutPoint: totalFrames,
      name: item.title,
      color: '#8b5cf6',
    })

    addVideo({
      id: `canvas-${clipId}`,
      sourceUrl: item.videoUrl,
      name: item.title,
      prompt: item.prompt || '',
      position: { x: 0, y: 0 },
      scale: 1,
      opacity: 1,
      zIndex: 3,
      visible: true,
      loop: false,
      durationSeconds: item.durationSeconds || 10,
      fps: item.fps || 30,
      width: item.width || 1920,
      height: item.height || 1080,
    })
  }, [addClip, addVideo, timelineFps])

  // Handle use action per category
  const handleUse = useCallback((item: MarketplaceItem) => {
    setLoadingItemId(item.id)
    try {
      if (item.category === 'html-templates' || item.category === 'captions' || item.category === 'collages') {
        handleUseHTMLTemplate(item)
      } else if (item.category === 'ai-animations') {
        handleImportAIAnimation(item)
      } else if (item.category === 'projects') {
        setLibraryModalOpen(true)
      }
    } finally {
      // Clear loading after a short delay so the spinner is visible
      setTimeout(() => setLoadingItemId(null), 400)
    }
  }, [handleUseHTMLTemplate, handleImportAIAnimation, setLibraryModalOpen])

  // Save HTML template
  const handleSaveHTMLTemplate = useCallback(async (htmlContent: string, title: string, description: string) => {
    let thumbnailUrl: string | undefined
    try {
      thumbnailUrl = await generateHTMLThumbnail(htmlContent)
    } catch {
      // Thumbnail generation failed — save without it
    }

    const itemId = `html-${Date.now()}`

    addItem({
      id: itemId,
      title,
      description: description || 'HTML template',
      category: 'html-templates',
      htmlContent,
      thumbnailUrl,
      createdAt: Date.now(),
    })

    // Analyze template fields with AI so orchestrator knows its config schema
    getTemplateAnalysis(itemId, htmlContent).catch((err) =>
      console.warn('[TemplatesLibrary] Template analysis failed:', err),
    )
  }, [addItem])

  const categoryOrder = ['html-templates', 'captions', 'collages', 'projects', 'ai-animations'] as const

  return (
    <PanelLayout
      icon={ShoppingBag}
      title="Library"
      iconClassName="text-[#4a7eff]"
      trailing={
        <div className="flex items-center gap-1">
          {visibleItems.length > 0 && (
            <span className="text-xs text-gray-500">{visibleItems.length} items</span>
          )}
          <button
            onClick={() => setShowDevTemplates(!showDevTemplates)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              showDevTemplates ? 'text-amber-400 bg-amber-500/10' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
            )}
            title={showDevTemplates ? 'Hide dev templates' : 'Show all templates (dev)'}
          >
            <Wrench size={15} />
          </button>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              showUpload ? 'text-[#4a7eff] bg-[#4a7eff]/10' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
            )}
            title="Add HTML Template"
          >
            <Upload size={15} />
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            title="Search"
          >
            <Search size={15} />
          </button>
          <button
            onClick={() => useEditorStore.getState().openCanvasOverlay('template-browser')}
            className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-[#2a2a2a] transition-colors"
            title="Expand"
          >
            <Maximize2 size={15} />
          </button>
        </div>
      }
      searchBar={{
        isOpen: searchOpen,
        onToggle: () => { setSearchOpen(false); setSearchQuery('') },
        query: searchQuery,
        onQueryChange: setSearchQuery,
        placeholder: 'Search library...',
      }}
    >
      {/* Upload section */}
      {showUpload && (
        <div>
          <InlineUpload
            onSave={handleSaveHTMLTemplate}
            onClose={() => setShowUpload(false)}
          />
        </div>
      )}

      {/* ── Filter pills ── */}
      <div className="flex items-center gap-1 flex-wrap">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveFilter(tab.id); setActiveTag(null) }}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              activeFilter === tab.id
                ? 'bg-white text-black'
                : 'bg-transparent text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tag pills ── */}
      {availableTags.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap">
          <Tag size={10} className="text-gray-500 flex-shrink-0" />
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="flex items-center gap-0.5 px-2 py-1 rounded-full text-[10px] font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
            >
              <X size={8} /> Clear
            </button>
          )}
          {availableTags.slice(0, 20).map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={cn(
                'px-2 py-1 rounded-full text-[10px] font-medium transition-colors',
                activeTag === tag
                  ? 'bg-[#4a7eff] text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Dev mode banner */}
      {showDevTemplates && (
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <Wrench size={12} className="text-amber-400 shrink-0" />
          <span className="text-[10px] text-amber-300 flex-1">
            Dev mode — showing all {items.length} templates. Click <BookMarked size={9} className="inline" /> to publish individual templates to the library.
          </span>
          <button
            onClick={() => setShowDevTemplates(false)}
            className="text-[10px] text-amber-400 hover:text-amber-300 shrink-0"
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Content */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingBag size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-[11px]">
              {activeTag
                ? `No templates with tag "${activeTag}".`
                : activeFilter === 'html-templates'
                  ? 'No published templates. Click the wrench icon to browse and publish built-in templates.'
                  : activeFilter === 'projects'
                    ? 'No saved projects yet.'
                    : activeFilter === 'ai-animations'
                      ? 'No AI animations saved.'
                      : 'No published templates. Click the wrench icon to browse and publish built-in templates.'}
            </p>
          </div>
        ) : isTagFiltered ? (
          // Tag-filtered: 2-column grid
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Tag size={10} className="text-[#4a7eff]" />
              <span className="text-[11px] font-semibold text-gray-300">{activeTag}</span>
              <span className="text-[9px] text-gray-600">{filteredItems.length}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {filteredItems.map((item) => (
                <TemplateCard
                  key={item.id}
                  item={item}
                  onUse={() => handleUse(item)}
                  onDelete={() => removeItem(item.id)}
                  onInfo={() => setPreviewItem(item)}
                  onTogglePublish={() => togglePublished(item.id)}
                  loading={loadingItemId === item.id}
                  gridMode
                  showDevMode={showDevTemplates}
                />
              ))}
            </div>
          </div>
        ) : activeFilter === 'all' ? (
          // Grouped horizontal scroll rows
          categoryOrder.map((cat) => {
            const catItems = grouped[cat]
            if (!catItems || catItems.length === 0) return null
            const meta = CATEGORY_META[cat]
            const Icon = meta.icon
            return (
              <div key={cat}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon size={11} className={meta.color} />
                  <h3 className="text-[11px] font-semibold text-gray-300">{meta.label}</h3>
                  <span className="text-[9px] text-gray-600">{catItems.length}</span>
                </div>
                <HorizontalRow>
                  {catItems.map((item) => (
                    <TemplateCard
                      key={item.id}
                      item={item}
                      onUse={() => handleUse(item)}
                      onDelete={() => removeItem(item.id)}
                      onInfo={() => setPreviewItem(item)}
                      onTogglePublish={() => togglePublished(item.id)}
                      loading={loadingItemId === item.id}
                      showDevMode={showDevTemplates}
                    />
                  ))}
                </HorizontalRow>
              </div>
            )
          })
        ) : (
          // Single category — horizontal scroll
          <HorizontalRow>
            {filteredItems.map((item) => (
              <TemplateCard
                key={item.id}
                item={item}
                onUse={() => handleUse(item)}
                onDelete={() => removeItem(item.id)}
                onInfo={() => setPreviewItem(item)}
                onTogglePublish={() => togglePublished(item.id)}
                loading={loadingItemId === item.id}
                showDevMode={showDevTemplates}
              />
            ))}
          </HorizontalRow>
        )}
      </div>

      {/* Info preview modal */}
      {previewItem && (
        <TemplatePreviewModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onUse={() => handleUse(previewItem)}
        />
      )}
    </PanelLayout>
  )
}
