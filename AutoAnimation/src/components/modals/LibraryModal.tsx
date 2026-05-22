import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Search,
  ShoppingBag,
  Wand2,
  Code,
  FolderOpen,
  Users,
  Sparkles,
  Music,
  Type,
  Layers,
  Upload,
  Plus,
  Trash2,
  Save,
  FileCode,
  Clipboard,
  Eye,
  Loader2,
  Star,
  ShoppingCart,
  Package,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelActionButton } from '@/components/ui/panel-controls'
import { useEditorStore } from '@/stores'
import { useMarketplaceStore, type MarketplaceCategory, type MarketplaceItem } from '@/stores/useMarketplaceStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { renderHTMLToImage, generateHTMLThumbnail } from '@/services/htmlRenderer'
import { getTemplateContent, BUILTIN_TEMPLATES } from '@/data/builtinTemplates'
// mediaDB import available if needed for large snapshots

// ── Category config ──────────────────────────────────────────────────

interface CategoryDef {
  id: MarketplaceCategory
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const categories: CategoryDef[] = [
  { id: 'all', label: 'All', icon: ShoppingBag },
  { id: 'ai-animations', label: 'AI Animations', icon: Wand2 },
  { id: 'html-templates', label: 'HTML Templates', icon: Code },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'characters', label: 'Characters', icon: Users },
  { id: 'animations', label: 'Animations', icon: Sparkles },
  { id: 'audio', label: 'Audio', icon: Music },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'transitions', label: 'Transitions', icon: Layers },
]

// ── Static "coming soon" items ───────────────────────────────────────

interface StaticItem {
  id: string
  title: string
  description: string
  price: string
  rating: number
  reviews: number
  category: MarketplaceCategory
  icon: React.ComponentType<{ size?: number; className?: string }>
  gradientFrom: string
  gradientTo: string
}

const staticItems: StaticItem[] = [
  {
    id: 's1',
    title: 'Character Pack',
    description: '10 unique characters',
    price: '$9.99',
    rating: 4.8,
    reviews: 124,
    category: 'characters',
    icon: Users,
    gradientFrom: 'from-violet-600',
    gradientTo: 'to-purple-500',
  },
  {
    id: 's2',
    title: 'Lottie BG Bundle',
    description: '25 animations',
    price: '$14.99',
    rating: 4.9,
    reviews: 89,
    category: 'animations',
    icon: Sparkles,
    gradientFrom: 'from-indigo-600',
    gradientTo: 'to-blue-500',
  },
  {
    id: 's3',
    title: 'Sound Effects Pack',
    description: '50 SFX clips',
    price: '$4.99',
    rating: 4.5,
    reviews: 203,
    category: 'audio',
    icon: Music,
    gradientFrom: 'from-fuchsia-600',
    gradientTo: 'to-pink-500',
  },
  {
    id: 's4',
    title: 'Text Animation Presets',
    description: '15 presets',
    price: '$7.99',
    rating: 4.7,
    reviews: 67,
    category: 'text',
    icon: Type,
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-indigo-500',
  },
  {
    id: 's5',
    title: 'Holiday Character Pack',
    description: '8 characters',
    price: '$12.99',
    rating: 4.6,
    reviews: 45,
    category: 'characters',
    icon: Package,
    gradientFrom: 'from-rose-600',
    gradientTo: 'to-orange-500',
  },
  {
    id: 's6',
    title: 'Transition Effects Pack',
    description: '20 transitions',
    price: '$6.99',
    rating: 4.4,
    reviews: 156,
    category: 'transitions',
    icon: Layers,
    gradientFrom: 'from-cyan-600',
    gradientTo: 'to-teal-500',
  },
]

// ── Sub-components ───────────────────────────────────────────────────

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={10}
            className={cn(
              i < Math.floor(rating)
                ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_2px_rgba(251,191,36,0.5)]'
                : i < rating
                  ? 'text-amber-400 fill-amber-400/50'
                  : 'text-zinc-700',
            )}
          />
        ))}
      </div>
      <span className="text-[9px] font-bold text-zinc-500 tracking-wider">({reviews})</span>
    </div>
  )
}

function StaticItemCard({ item }: { item: StaticItem }) {
  const Icon = item.icon
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-purple-500/30 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] group flex flex-col h-full">
      <div
        className={cn(
          'aspect-[4/3] bg-gradient-to-br flex items-center justify-center relative overflow-hidden',
          item.gradientFrom,
          item.gradientTo,
        )}
      >
        <Icon
          size={32}
          className="text-white drop-shadow-md group-hover:scale-110 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
      </div>
      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate drop-shadow-sm">{item.title}</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">{item.description}</p>
            </div>
            <span className="text-xs font-black text-purple-400 whitespace-nowrap drop-shadow-sm">{item.price}</span>
          </div>
          <StarRating rating={item.rating} reviews={item.reviews} />
        </div>

        <PanelActionButton
          variant="secondary"
          disabled
          icon={ShoppingCart}
          onClick={() => {}}
          className="w-full text-[10px] py-2 border-purple-500/20 text-purple-300/60 font-bold uppercase tracking-widest bg-purple-500/5"
        >
          Coming Soon
        </PanelActionButton>
      </div>
    </div>
  )
}

function AIAnimationCard({
  item,
  onImport,
  onDelete,
}: {
  item: MarketplaceItem
  onImport: () => void
  onDelete: () => void
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] group flex flex-col h-full">
      <div className="aspect-[4/3] bg-black/50 relative overflow-hidden">
        {item.videoUrl ? (
          <video
            src={item.videoUrl}
            muted
            loop
            playsInline
            preload="metadata"
            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
            onMouseEnter={(e) => (e.target as HTMLVideoElement).play().catch(() => {})}
            onMouseLeave={(e) => {
              const v = e.target as HTMLVideoElement
              v.pause()
              v.currentTime = 0
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Wand2 size={28} className="text-violet-400/30" />
          </div>
        )}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-violet-600/90 backdrop-blur-sm text-[9px] font-black text-white flex items-center gap-1 uppercase tracking-widest shadow-lg border border-white/10">
          <Wand2 size={10} />
          AI Generated
        </div>
      </div>
      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate drop-shadow-sm">{item.title}</h4>
            <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5" title={item.description}>
              {item.description}
            </p>
          </div>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <PanelActionButton
            variant="primary"
            onClick={onImport}
            icon={Plus}
            className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_10px_rgba(139,92,246,0.3)] border-transparent"
          >
            Import
          </PanelActionButton>
          <PanelActionButton
            variant="secondary"
            onClick={onDelete}
            icon={Trash2}
            className="px-3 py-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
          >
            <></>
          </PanelActionButton>
        </div>
      </div>
    </div>
  )
}

/** Resolve htmlContent — fall back to Vite raw import for built-in templates */
function resolveHtmlContent(item: MarketplaceItem): string | undefined {
  if (item.htmlContent) return item.htmlContent
  const builtin = BUILTIN_TEMPLATES.find((t) => t.id === item.id)
  if (builtin) return getTemplateContent(builtin.filename) ?? undefined
  return undefined
}

/** Check whether an item is a built-in template */
const isBuiltinItem = (id: string) => BUILTIN_TEMPLATES.some((t) => t.id === id)

function idToGradient(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  const h1 = (hash >>> 0) % 360
  const h2 = (h1 + 40) % 360
  return `linear-gradient(135deg, hsl(${h1},50%,18%), hsl(${h2},60%,12%))`
}

function HTMLTemplateCard({
  item,
  onUse,
  onEdit,
  onDelete,
}: {
  item: MarketplaceItem
  onUse: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  // Only render live iframe for user-created templates (not built-in)
  const isBuiltin = isBuiltinItem(item.id)
  const showLivePreview = !isBuiltin && item.htmlContent
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-blue-500/40 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] group flex flex-col h-full">
      <div className="aspect-[4/3] bg-black/50 relative overflow-hidden">
        {showLivePreview ? (
          <iframe
            srcDoc={item.htmlContent}
            sandbox="allow-scripts"
            className="w-full h-full pointer-events-none border-0 transition-transform duration-700 group-hover:scale-105"
            style={{ transform: 'scale(0.25)', transformOrigin: 'top left', width: '400%', height: '400%' }}
            title={item.title}
          />
        ) : item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center p-3 transition-transform duration-700 group-hover:scale-105"
            style={{ background: idToGradient(item.id) }}
          >
            <span className="text-[10px] text-white/50 font-semibold text-center leading-tight line-clamp-3">
              {item.title}
            </span>
          </div>
        )}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-blue-600/90 backdrop-blur-sm text-[9px] font-black text-white flex items-center gap-1 uppercase tracking-widest shadow-lg border border-white/10">
          <Code size={10} />
          HTML
        </div>
      </div>
      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate drop-shadow-sm">{item.title}</h4>
            <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5" title={item.description}>
              {item.description}
            </p>
          </div>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <PanelActionButton
            variant="primary"
            onClick={onUse}
            icon={Plus}
            className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.3)] border-transparent"
          >
            Use
          </PanelActionButton>
          <PanelActionButton
            variant="secondary"
            onClick={onEdit}
            icon={FileCode}
            className="px-3 py-2 text-zinc-500 hover:text-white hover:bg-white/10 transition-all border-white/5"
          >
            <></>
          </PanelActionButton>
          <PanelActionButton
            variant="secondary"
            onClick={onDelete}
            icon={Trash2}
            className="px-3 py-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all border-white/5"
          >
            <></>
          </PanelActionButton>
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ item, onLoad, onDelete }: { item: MarketplaceItem; onLoad: () => void; onDelete: () => void }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-black/20 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-emerald-500/40 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] group flex flex-col h-full">
      <div className="aspect-[4/3] bg-black/50 relative overflow-hidden">
        {item.thumbnailUrl ? (
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FolderOpen
              size={32}
              className="text-emerald-400/30 group-hover:scale-110 transition-transform duration-500"
            />
          </div>
        )}
        <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-emerald-600/90 backdrop-blur-sm text-[9px] font-black text-white flex items-center gap-1 uppercase tracking-widest shadow-lg border border-white/10">
          <FolderOpen size={10} />
          Project
        </div>
      </div>
      <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate drop-shadow-sm">{item.title}</h4>
            <p className="text-[10px] text-zinc-400 line-clamp-2 mt-0.5">{item.description}</p>
          </div>
          <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">
            {new Date(item.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <PanelActionButton
            variant="primary"
            onClick={onLoad}
            icon={FolderOpen}
            className="flex-1 py-2 text-[10px] font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)] border-transparent"
          >
            Load
          </PanelActionButton>
          <PanelActionButton
            variant="secondary"
            onClick={onDelete}
            icon={Trash2}
            className="px-3 py-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all border-white/5"
          >
            <></>
          </PanelActionButton>
        </div>
      </div>
    </div>
  )
}

// ── Upload Section ───────────────────────────────────────────────────

type UploadTab = 'file' | 'paste'

function UploadSection({
  onSave,
  initialCode,
  onClose,
}: {
  onSave: (htmlContent: string, title: string, description: string) => void
  initialCode?: string
  onClose: () => void
}) {
  const [uploadTab, setUploadTab] = useState<UploadTab>(initialCode ? 'paste' : 'file')
  const [htmlCode, setHtmlCode] = useState(initialCode || '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && (file.name.endsWith('.html') || file.name.endsWith('.htm'))) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const content = ev.target?.result as string
          setHtmlCode(content)
          if (!title) setTitle(file.name.replace(/\.(html?|htm)$/i, ''))
          setUploadTab('paste')
        }
        reader.readAsText(file)
      }
    },
    [title],
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const content = ev.target?.result as string
          setHtmlCode(content)
          if (!title) setTitle(file.name.replace(/\.(html?|htm)$/i, ''))
          setUploadTab('paste')
        }
        reader.readAsText(file)
      }
    },
    [title],
  )

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
    <div className="border border-zinc-700/50 rounded-xl bg-zinc-800/50 overflow-hidden">
      {/* Upload tabs */}
      <div className="flex items-center border-b border-zinc-700/50">
        <button
          onClick={() => setUploadTab('file')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
            uploadTab === 'file'
              ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-400'
              : 'text-zinc-400 hover:text-zinc-300',
          )}
        >
          <Upload size={13} />
          Upload File
        </button>
        <button
          onClick={() => setUploadTab('paste')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors',
            uploadTab === 'paste'
              ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-400'
              : 'text-zinc-400 hover:text-zinc-300',
          )}
        >
          <Clipboard size={13} />
          Paste Code
        </button>
        <button onClick={onClose} className="px-3 py-2.5 text-zinc-500 hover:text-zinc-300 transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {uploadTab === 'file' ? (
          /* File drop zone */
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-lg py-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors',
              isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-zinc-600 hover:border-zinc-500 bg-zinc-900/50',
            )}
          >
            <Upload size={24} className={isDragging ? 'text-blue-400' : 'text-zinc-500'} />
            <p className="text-xs text-zinc-400">
              {isDragging ? 'Drop HTML file here' : 'Drag & drop .html file or click to browse'}
            </p>
            <input ref={fileInputRef} type="file" accept=".html,.htm" onChange={handleFileSelect} className="hidden" />
          </div>
        ) : (
          /* Code paste area */
          <div className="space-y-3">
            <textarea
              value={htmlCode}
              onChange={(e) => setHtmlCode(e.target.value)}
              placeholder="Paste your HTML/React code here..."
              className="w-full h-48 bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs text-zinc-200 font-mono resize-none focus:border-blue-500 focus:outline-none placeholder:text-zinc-600"
              spellCheck={false}
            />

            {/* Live preview */}
            {htmlCode.trim() && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-medium">
                  <Eye size={10} />
                  Preview
                </div>
                <div className="border border-zinc-700 rounded-lg overflow-hidden bg-white">
                  <iframe
                    srcDoc={htmlCode}
                    sandbox="allow-scripts"
                    className="w-full h-40 pointer-events-none"
                    title="HTML Preview"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metadata inputs */}
        <div className="grid grid-cols-2 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Template name"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-blue-500 focus:outline-none placeholder:text-zinc-600"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-blue-500 focus:outline-none placeholder:text-zinc-600"
          />
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!htmlCode.trim() || !title.trim() || saving}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-colors',
            htmlCode.trim() && title.trim() && !saving
              ? 'bg-blue-600 hover:bg-blue-500 text-white'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed',
          )}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? 'Saving...' : 'Save to Library'}
        </button>
      </div>
    </div>
  )
}

// ── Save Project Section ─────────────────────────────────────────────

function SaveProjectSection({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const addItem = useMarketplaceStore((s) => s.addItem)

  const handleSave = useCallback(async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      // Gather snapshot from key stores
      const charConfig = useCharacterConfigStore.getState()
      const snapshot = {
        version: '1.0',
        canvas: {
          canvasWidth: useCanvasStore.getState().canvasWidth,
          canvasHeight: useCanvasStore.getState().canvasHeight,
        },
        character: {
          savedImages: charConfig.savedImages,
          spriteLabels: charConfig.spriteLabels,
          visemeMapping: charConfig.visemeMapping,
          curvedVisemes: charConfig.curvedVisemes,
          useCurvedVisemes: charConfig.useCurvedVisemes,
          eyeVariants: charConfig.eyeVariantSprites,
          eyebrowVariants: charConfig.eyebrowVariantSprites,
          visemeTransitionMs: charConfig.visemeTransitionMs,
        },
        parts: useCharacterPartsStore.getState(),
        multiCharacter: {
          characters: useMultiCharacterStore.getState().characters,
          dialogueLines: useMultiCharacterStore.getState().dialogueLines,
        },
        media: {
          assets: useMediaStore.getState().assets,
          canvasItems: useMediaStore.getState().canvasItems,
        },
        textOverlays: useTextOverlayStore.getState().overlays,
        shapes: useShapeStore.getState().shapes,
        animations: useAnimationStore.getState(),
        timeline: {
          fps: useTimelineStore.getState().fps,
          totalFrames: useTimelineStore.getState().totalFrames,
          tracks: useTimelineStore.getState().tracks,
        },
        voice: {
          selectedVoiceId: useVoiceStore.getState().selectedVoiceId,
          generatedVoices: useVoiceStore.getState().generatedVoices,
        },
        videos: useVideoLayerStore.getState().videos,
        keyframes: useKeyframeStore.getState(),
        aspectRatio: useEditorStore.getState().aspectRatio,
      }

      const projectSnapshot = JSON.stringify(snapshot)

      addItem({
        id: `project-${Date.now()}`,
        title: title.trim(),
        description: description.trim() || 'Project snapshot',
        category: 'projects',
        projectSnapshot,
        createdAt: Date.now(),
      })

      onClose()
    } finally {
      setSaving(false)
    }
  }, [title, description, addItem, onClose])

  return (
    <div className="border border-zinc-700/50 rounded-xl bg-zinc-800/50 overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-700/50 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
          <Save size={13} />
          Save Current Project to Library
        </div>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <X size={14} />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Project name"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none placeholder:text-zinc-600"
          />
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-emerald-500 focus:outline-none placeholder:text-zinc-600"
          />
        </div>
        <button
          onClick={handleSave}
          disabled={!title.trim() || saving}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-colors',
            title.trim() && !saving
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-zinc-700 text-zinc-500 cursor-not-allowed',
          )}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          {saving ? 'Saving...' : 'Save Project'}
        </button>
      </div>
    </div>
  )
}

// ── Main LibraryModal ────────────────────────────────────────────────

export function LibraryModal() {
  const open = useEditorStore((s) => s.libraryModalOpen)
  const closeModal = useEditorStore((s) => s.setLibraryModalOpen)
  const { items, activeCategory, searchQuery, setActiveCategory, setSearchQuery, removeItem, addItem } =
    useMarketplaceStore()
  const addClip = useTimelineStore((s) => s.addClip)
  const timelineFps = useTimelineStore((s) => s.fps)
  const addVideo = useVideoLayerStore((s) => s.addVideo)
  const canvasWidth = useCanvasStore((s) => s.canvasWidth)
  const canvasHeight = useCanvasStore((s) => s.canvasHeight)

  const [isVisible, setIsVisible] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [showSaveProject, setShowSaveProject] = useState(false)
  const [editingTemplateCode, setEditingTemplateCode] = useState<string | undefined>(undefined)
  const [_loadingItemId, setLoadingItemId] = useState<string | null>(null)
  const [confirmLoadItem, setConfirmLoadItem] = useState<MarketplaceItem | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)

  // Animate in
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setIsVisible(true))
    } else {
      setIsVisible(false)
    }
  }, [open])

  // Close handlers
  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmLoadItem) {
          setConfirmLoadItem(null)
        } else {
          closeModal(false)
        }
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open, closeModal, confirmLoadItem])

  // Import AI animation to timeline/canvas
  const handleImportAIAnimation = useCallback(
    (item: MarketplaceItem) => {
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
    },
    [addClip, addVideo, timelineFps],
  )

  // Use HTML template — render to image and add to media
  const handleUseHTMLTemplate = useCallback(
    async (item: MarketplaceItem) => {
      // Resolve htmlContent — fall back to Vite raw import for built-in templates
      let html = item.htmlContent
      if (!html) {
        const builtin = BUILTIN_TEMPLATES.find((t) => t.id === item.id)
        if (builtin) html = getTemplateContent(builtin.filename) ?? undefined
      }
      if (!html) {
        console.warn('[LibraryModal] No htmlContent for template:', item.id)
        return
      }
      setLoadingItemId(item.id)
      try {
        const dataUrl = await renderHTMLToImage(html, canvasWidth, canvasHeight)

        // Convert data URL to blob for media store
        const response = await fetch(dataUrl)
        const blob = await response.blob()

        const assetId = `html-asset-${Date.now()}`
        useMediaStore.getState().addAsset(
          {
            id: assetId,
            name: item.title,
            type: 'image/png',
            size: blob.size,
            category: 'images',
            url: dataUrl,
            width: canvasWidth,
            height: canvasHeight,
            addedAt: Date.now(),
          },
          blob,
        )
        useMediaStore.getState().addToCanvas(assetId)
      } catch (err) {
        console.error('Failed to render HTML template:', err)
      } finally {
        setLoadingItemId(null)
      }
    },
    [canvasWidth, canvasHeight],
  )

  // Save HTML template
  const handleSaveHTMLTemplate = useCallback(
    async (htmlContent: string, title: string, description: string) => {
      let thumbnailUrl: string | undefined
      try {
        thumbnailUrl = await generateHTMLThumbnail(htmlContent)
      } catch {
        // Thumbnail generation failed — save without it
      }

      addItem({
        id: `html-${Date.now()}`,
        title,
        description: description || 'HTML template',
        category: 'html-templates',
        htmlContent,
        thumbnailUrl,
        createdAt: Date.now(),
      })
    },
    [addItem],
  )

  // Load project from snapshot
  const handleLoadProject = useCallback(
    (item: MarketplaceItem) => {
      if (!item.projectSnapshot) return
      try {
        const snapshot = JSON.parse(item.projectSnapshot)

        // Restore canvas dimensions
        if (snapshot.canvas) {
          const cs = useCanvasStore.getState()
          useCanvasStore.setState({
            ...cs,
            canvasWidth: snapshot.canvas.canvasWidth ?? cs.canvasWidth,
            canvasHeight: snapshot.canvas.canvasHeight ?? cs.canvasHeight,
          })
        }

        // Restore character config
        if (snapshot.character) {
          const store = useCharacterConfigStore.getState()
          useCharacterConfigStore.setState({
            ...store,
            savedImages: snapshot.character.savedImages ?? store.savedImages,
            spriteLabels: snapshot.character.spriteLabels ?? store.spriteLabels,
            visemeMapping: snapshot.character.visemeMapping ?? store.visemeMapping,
            curvedVisemes: snapshot.character.curvedVisemes ?? store.curvedVisemes,
            useCurvedVisemes: snapshot.character.useCurvedVisemes ?? store.useCurvedVisemes,
            eyeVariantSprites: snapshot.character.eyeVariantSprites ?? store.eyeVariantSprites,
            eyebrowVariantSprites: snapshot.character.eyebrowVariantSprites ?? store.eyebrowVariantSprites,
            visemeTransitionMs: snapshot.character.visemeTransitionMs ?? store.visemeTransitionMs,
          })
        }

        // Restore character parts
        if (snapshot.parts) {
          useCharacterPartsStore.setState(snapshot.parts)
        }

        // Restore multi-character
        if (snapshot.multiCharacter) {
          const mcStore = useMultiCharacterStore.getState()
          useMultiCharacterStore.setState({
            ...mcStore,
            characters: snapshot.multiCharacter.characters ?? mcStore.characters,
            dialogueLines: snapshot.multiCharacter.dialogueLines ?? mcStore.dialogueLines,
          })
        }

        // Restore media
        if (snapshot.media) {
          const mediaStore = useMediaStore.getState()
          useMediaStore.setState({
            ...mediaStore,
            assets: snapshot.media.assets ?? mediaStore.assets,
            canvasItems: snapshot.media.canvasItems ?? mediaStore.canvasItems,
          })
        }

        // Restore text overlays
        if (snapshot.textOverlays) {
          const txtStore = useTextOverlayStore.getState()
          useTextOverlayStore.setState({
            ...txtStore,
            overlays: snapshot.textOverlays,
          })
        }

        // Restore shapes
        if (snapshot.shapes) {
          const shapeStore = useShapeStore.getState()
          useShapeStore.setState({
            ...shapeStore,
            shapes: snapshot.shapes,
          })
        }

        // Restore animations
        if (snapshot.animations) {
          useAnimationStore.setState(snapshot.animations)
        }

        // Restore timeline
        if (snapshot.timeline) {
          const tlStore = useTimelineStore.getState()
          useTimelineStore.setState({
            ...tlStore,
            fps: snapshot.timeline.fps ?? tlStore.fps,
            totalFrames: snapshot.timeline.totalFrames ?? tlStore.totalFrames,
            tracks: snapshot.timeline.tracks ?? tlStore.tracks,
          })
        }

        // Restore voice
        if (snapshot.voice) {
          const vStore = useVoiceStore.getState()
          useVoiceStore.setState({
            ...vStore,
            selectedVoiceId: snapshot.voice.selectedVoiceId ?? vStore.selectedVoiceId,
            generatedVoices: snapshot.voice.generatedVoices ?? vStore.generatedVoices,
          })
        }

        // Restore videos
        if (snapshot.videos) {
          useVideoLayerStore.setState({ videos: snapshot.videos })
        }

        // Restore keyframes
        if (snapshot.keyframes) {
          useKeyframeStore.setState(snapshot.keyframes)
        }

        // Restore aspect ratio
        if (snapshot.aspectRatio) {
          useEditorStore.getState().setAspectRatio(snapshot.aspectRatio)
        }

        // Reset playback
        usePlaybackStore.getState().seek(0)

        setConfirmLoadItem(null)
        closeModal(false)
      } catch (err) {
        console.error('Failed to load project snapshot:', err)
      }
    },
    [closeModal],
  )

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.prompt || '').toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [items, activeCategory, searchQuery])

  const filteredStaticItems = useMemo(() => {
    if (activeCategory === 'ai-animations' || activeCategory === 'html-templates' || activeCategory === 'projects')
      return []
    return staticItems.filter((item) => {
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory
      const matchesSearch =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [activeCategory, searchQuery])

  // Count items per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const item of items) {
      counts[item.category] = (counts[item.category] || 0) + 1
    }
    return counts
  }, [items])

  if (!open) return null

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/80 backdrop-blur-md z-50 transition-opacity duration-200',
          isVisible ? 'opacity-100' : 'opacity-0',
        )}
        onClick={() => closeModal(false)}
      />

      {/* Confirm load dialog */}
      {confirmLoadItem && (
        <div className="fixed inset-0 z-modal-raised flex items-center justify-center">
          <div className="bg-zinc-900/95 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-glass max-w-sm mx-4 space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100">Load Project?</h3>
            <p className="text-xs text-zinc-400">
              This will replace your current project with "{confirmLoadItem.title}". Unsaved changes will be lost.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleLoadProject(confirmLoadItem)}
                className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
              >
                Load Project
              </button>
              <button
                onClick={() => setConfirmLoadItem(null)}
                className="flex-1 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <div
        ref={modalRef}
        className={cn(
          'fixed inset-0 md:inset-8 lg:inset-12 bg-zinc-900/95 backdrop-blur-3xl md:rounded-3xl shadow-glass z-50 flex flex-col overflow-hidden md:border md:border-white/10 transition-all duration-200',
          isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]',
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-gradient-to-r from-purple-900/20 to-transparent">
          <div className="p-1.5 rounded-lg bg-purple-500/20">
            <ShoppingBag size={18} className="text-purple-400" />
          </div>
          <h2 className="text-base font-semibold text-white">Library</h2>
          {items.length > 0 && (
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest bg-black/20 px-2 py-1 rounded-md border border-white/5">
              {items.length} Saved
            </span>
          )}

          {/* Search */}
          <div className="flex-1 max-w-sm ml-4">
            <div className="relative group">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-purple-400 transition-colors"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search library..."
                className="w-full bg-black/20 border border-white/5 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:border-purple-500/50 focus:bg-black/40 focus:outline-none placeholder:text-zinc-600 transition-all font-medium"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => {
                setShowSaveProject(!showSaveProject)
                setShowUpload(false)
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border',
                showSaveProject
                  ? 'bg-emerald-500 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                  : 'bg-black/20 text-zinc-400 border-white/5 hover:text-white hover:bg-white/10',
              )}
            >
              <Save size={12} className={showSaveProject ? 'text-white' : 'text-zinc-500'} />
              Save Project
            </button>
            <button
              onClick={() => {
                setShowUpload(!showUpload)
                setShowSaveProject(false)
                setEditingTemplateCode(undefined)
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border',
                showUpload
                  ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(37,99,235,0.4)]'
                  : 'bg-black/20 text-zinc-400 border-white/5 hover:text-white hover:bg-white/10',
              )}
            >
              <Upload size={12} className={showUpload ? 'text-white' : 'text-zinc-500'} />
              Upload Template
            </button>
            <button
              onClick={() => closeModal(false)}
              className="p-1.5 ml-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-48 border-r border-zinc-700/50 flex flex-col py-3">
            <div className="flex-1 space-y-0.5 px-2">
              {categories.map((cat) => {
                const count = cat.id === 'all' ? items.length : categoryCounts[cat.id] || 0
                const Icon = cat.icon
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border',
                      activeCategory === cat.id
                        ? 'bg-purple-500/90 text-white border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                        : 'bg-transparent text-zinc-400 border-transparent hover:text-white hover:bg-white/5',
                    )}
                  >
                    <Icon size={14} className={activeCategory === cat.id ? 'text-white' : 'text-zinc-500'} />
                    <span className="flex-1 text-left">{cat.label}</span>
                    {count > 0 && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded-md text-[9px]',
                          activeCategory === cat.id ? 'bg-black/20 text-white' : 'bg-white/10 text-zinc-400',
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Upload section */}
            {showUpload && (
              <div className="mb-6">
                <UploadSection
                  onSave={handleSaveHTMLTemplate}
                  initialCode={editingTemplateCode}
                  onClose={() => {
                    setShowUpload(false)
                    setEditingTemplateCode(undefined)
                  }}
                />
              </div>
            )}

            {/* Save project section */}
            {showSaveProject && (
              <div className="mb-6">
                <SaveProjectSection onClose={() => setShowSaveProject(false)} />
              </div>
            )}

            {/* Items grid */}
            {filteredItems.length === 0 && filteredStaticItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-70">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                  <Search size={28} className="text-zinc-500" />
                </div>
                <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  {activeCategory === 'html-templates'
                    ? 'No HTML Templates Saved'
                    : activeCategory === 'projects'
                      ? 'No Projects Saved'
                      : activeCategory === 'ai-animations'
                        ? 'No AI Animations Saved'
                        : 'No Items Found'}
                </div>
                <p className="text-[10px] text-zinc-500 max-w-xs leading-relaxed">
                  {activeCategory === 'html-templates'
                    ? 'Upload an HTML template to inject it into your timeline logic.'
                    : activeCategory === 'projects'
                      ? 'Save your current canvas state as a project to find it here later.'
                      : activeCategory === 'ai-animations'
                        ? 'Head to the AI Animate tab to generate fresh AI clips directly to your library.'
                        : 'Explore the marketplace for custom assets.'}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* User items */}
                {filteredItems.length > 0 && (
                  <div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {filteredItems.map((item) => {
                        if (item.category === 'ai-animations') {
                          return (
                            <AIAnimationCard
                              key={item.id}
                              item={item}
                              onImport={() => handleImportAIAnimation(item)}
                              onDelete={() => removeItem(item.id)}
                            />
                          )
                        }
                        if (item.category === 'html-templates') {
                          return (
                            <HTMLTemplateCard
                              key={item.id}
                              item={item}
                              onUse={() => handleUseHTMLTemplate(item)}
                              onEdit={() => {
                                setEditingTemplateCode(resolveHtmlContent(item) || '')
                                setShowUpload(true)
                                setShowSaveProject(false)
                              }}
                              onDelete={() => removeItem(item.id)}
                            />
                          )
                        }
                        if (item.category === 'projects') {
                          return (
                            <ProjectCard
                              key={item.id}
                              item={item}
                              onLoad={() => setConfirmLoadItem(item)}
                              onDelete={() => removeItem(item.id)}
                            />
                          )
                        }
                        return null
                      })}
                    </div>
                  </div>
                )}

                {/* Static marketplace items */}
                {filteredStaticItems.length > 0 && (
                  <div>
                    {filteredItems.length > 0 && (
                      <h3 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-1.5 px-1.5 bg-purple-500/10 w-fit py-1.5 pr-4 rounded-md border border-purple-500/20 mb-4 mt-8 shadow-[0_0_15px_rgba(168,85,247,0.1)]">
                        <ShoppingBag size={12} />
                        Marketplace Store
                      </h3>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {filteredStaticItems.map((item) => (
                        <StaticItemCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body,
  )
}
