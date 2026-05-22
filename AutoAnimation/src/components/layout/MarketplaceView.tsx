import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  Search,
  X,
  ShoppingBag,
  Wand2,
  Code,
  FolderOpen,
  Users,
  Sparkles,
  Music,
  Type,
  Layers,
  Star,
  ShoppingCart,
  Package,
  Eye,
  Trash2,
  Upload,
  Globe,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelActionButton } from '@/components/ui/panel-controls'
import { useMarketplaceStore, type MarketplaceCategory, type MarketplaceItem } from '@/stores/useMarketplaceStore'
import { useEditorStore } from '@/stores'
import { TAB_GROUPS } from '@/constants/tabGroups'
import type { MarketplaceListing } from '@/types/marketplace'
import type { MotionGraphicRegistration } from '@/types/motionGraphic'
import { ensureTemplatesLoaded, getAllMotionGraphics } from '@/motionGraphics'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useSavedPixelArtCharactersStore } from '@/stores/useSavedPixelArtCharactersStore'
import { useSavedAvatarCharactersStore } from '@/stores/useSavedAvatarCharactersStore'
import { useBundleStore, type CharacterBundle } from '@/stores/useBundleStore'
import { useMotionGraphicStore } from '@/stores/useMotionGraphicStore'
import { useTemplateRatingStore } from '@/stores/useTemplateRatingStore'
import { PanelSelect } from '@/components/ui/panel-controls'
import templateRounds from '@/motionGraphics/templateRounds.json'
import { Filter } from 'lucide-react'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import { useTimelineStore } from '@/stores'
import { useCharacterConfigStore } from '@/stores'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'

/** Add motion graphic to canvas and exit marketplace */
function useAddMotionGraphic() {
  const addInstance = useMotionGraphicStore((s) => s.addInstance)
  const setSelectedInstanceId = useMotionGraphicStore((s) => s.setSelectedInstanceId)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const setLeftPanelGroup = useEditorStore((s) => s.setLeftPanelGroup)
  const fps = usePlaybackStore((s) => s.fps)
  const currentFrame = useTimelineStore((s) => s.currentFrame)

  return useCallback(
    (mg: MotionGraphicRegistration) => {
      const id = `mg-${mg.id}-${Date.now()}`
      addInstance({
        id,
        templateId: mg.id,
        name: mg.title,
        config: { ...mg.defaultConfig },
        position: { x: 0, y: 0 },
        scale: 1,
        opacity: 1,
        zIndex: 10,
        rotation: 0,
        visible: true,
        startFrame: currentFrame,
        endFrame: currentFrame + fps * 5,
      })
      setSelectedInstanceId(id)
      setRightPanelTab('motion-graphic-properties')
      setLeftPanelGroup('design')
    },
    [addInstance, setSelectedInstanceId, setRightPanelTab, setLeftPanelGroup, currentFrame, fps],
  )
}

/** Select a character and exit marketplace */
function useSelectCharacter() {
  const setLeftPanelGroup = useEditorStore((s) => s.setLeftPanelGroup)
  const setLeftPanelActiveTab = useEditorStore((s) => s.setLeftPanelActiveTab)
  const selectCharacter = useSavedCharactersStore((s) => s.selectCharacter)
  const select3D = useSaved3DCharactersStore((s) => s.selectCharacter)

  return useCallback(
    (char: UnifiedChar) => {
      if (char.type === '2d') selectCharacter(char.id)
      else if (char.type === '3d') select3D(char.id)
      setLeftPanelActiveTab('character')
      setLeftPanelGroup('character')
    },
    [selectCharacter, select3D, setLeftPanelActiveTab, setLeftPanelGroup],
  )
}

/** Select a bundle and exit marketplace */
function useSelectBundle() {
  const setLeftPanelGroup = useEditorStore((s) => s.setLeftPanelGroup)
  const setLeftPanelActiveTab = useEditorStore((s) => s.setLeftPanelActiveTab)
  const selectBundle = useBundleStore((s) => s.selectBundle)

  return useCallback(
    (bundle: CharacterBundle) => {
      selectBundle(bundle.id)
      setLeftPanelActiveTab('character')
      setLeftPanelGroup('character')
    },
    [selectBundle, setLeftPanelActiveTab, setLeftPanelGroup],
  )
}

/* ── Category config ────────────────────────────────────────────────── */

import { LayoutGrid, Film } from 'lucide-react'

type BrowseCategory = MarketplaceCategory | 'motion-graphics' | 'bundles'

interface CategoryDef {
  id: BrowseCategory
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const categories: CategoryDef[] = [
  { id: 'all', label: 'All', icon: ShoppingBag },
  { id: 'motion-graphics', label: 'Motion Graphics', icon: Film },
  { id: 'characters', label: 'Characters', icon: Users },
  { id: 'bundles', label: 'Bundles', icon: LayoutGrid },
  { id: 'html-templates', label: 'HTML Templates', icon: Code },
  { id: 'ai-animations', label: 'AI Animations', icon: Wand2 },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'animations', label: 'Animations', icon: Sparkles },
  { id: 'audio', label: 'Audio', icon: Music },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'transitions', label: 'Transitions', icon: Layers },
]

/* ── Motion graphic style classification ──────────────────────────── */

const STYLE_FAMILIES = [
  { id: 'all', label: 'All Styles' },
  { id: 'clean', label: 'Clean' },
  { id: 'bold', label: 'Bold' },
  { id: 'glitchy', label: 'Glitchy' },
  { id: 'retro', label: 'Retro' },
  { id: 'artsy', label: 'Artsy' },
  { id: 'trippy', label: 'Trippy' },
  { id: 'cinematic', label: 'Cinematic' },
]

const SUB_STYLES: Record<string, { id: string; label: string }[]> = {
  clean: [
    { id: 'all', label: 'All' },
    { id: 'fade', label: 'Fade' },
    { id: 'slide', label: 'Slide' },
    { id: 'reveal', label: 'Reveal' },
    { id: 'type-on', label: 'Type-On' },
    { id: 'motion', label: 'Motion' },
  ],
  bold: [
    { id: 'all', label: 'All' },
    { id: 'slam', label: 'Slam' },
    { id: 'bounce', label: 'Bounce' },
    { id: 'shake', label: 'Shake' },
    { id: 'pop', label: 'Pop' },
    { id: 'zoom', label: 'Zoom' },
  ],
  glitchy: [
    { id: 'all', label: 'All' },
    { id: 'digital', label: 'Digital' },
    { id: 'vhs', label: 'VHS/CRT' },
    { id: 'broken', label: 'Broken' },
    { id: 'corrupt', label: 'Corrupt' },
    { id: 'buffer', label: 'Buffer' },
  ],
  retro: [
    { id: 'all', label: 'All' },
    { id: 'film', label: 'Film' },
    { id: 'computer', label: '90s PC' },
    { id: 'arcade', label: 'Arcade' },
    { id: 'vintage', label: 'Vintage' },
    { id: 'print', label: 'Print' },
  ],
  artsy: [
    { id: 'all', label: 'All' },
    { id: 'paint', label: 'Paint/Ink' },
    { id: 'craft', label: 'Craft' },
    { id: 'sketch', label: 'Sketch' },
    { id: 'textile', label: 'Textile' },
    { id: 'paper', label: 'Paper' },
  ],
  trippy: [
    { id: 'all', label: 'All' },
    { id: 'glow', label: 'Glow/Neon' },
    { id: 'liquid', label: 'Liquid' },
    { id: 'morph', label: 'Morph' },
    { id: 'warp', label: 'Warp' },
    { id: 'psychedelic', label: 'Psychedelic' },
  ],
  cinematic: [
    { id: 'all', label: 'All' },
    { id: 'title', label: 'Title' },
    { id: 'dramatic', label: 'Dramatic' },
    { id: 'camera', label: 'Camera' },
    { id: 'letterbox', label: 'Letterbox' },
    { id: 'grade', label: 'Grade' },
  ],
}

const TAG_MAP: Record<string, { family: string; sub?: string }> = {
  minimal: { family: 'clean' },
  fade: { family: 'clean', sub: 'fade' },
  slide: { family: 'clean', sub: 'slide' },
  reveal: { family: 'clean', sub: 'reveal' },
  mask: { family: 'clean', sub: 'reveal' },
  typewriter: { family: 'clean', sub: 'type-on' },
  typography: { family: 'clean', sub: 'motion' },
  impact: { family: 'bold', sub: 'slam' },
  slam: { family: 'bold', sub: 'slam' },
  bounce: { family: 'bold', sub: 'bounce' },
  elastic: { family: 'bold', sub: 'bounce' },
  spring: { family: 'bold', sub: 'bounce' },
  shake: { family: 'bold', sub: 'shake' },
  pop: { family: 'bold', sub: 'pop' },
  burst: { family: 'bold', sub: 'pop' },
  zoom: { family: 'bold', sub: 'zoom' },
  scale: { family: 'bold', sub: 'zoom' },
  glitch: { family: 'glitchy', sub: 'digital' },
  digital: { family: 'glitchy', sub: 'digital' },
  vhs: { family: 'glitchy', sub: 'vhs' },
  crt: { family: 'glitchy', sub: 'vhs' },
  corrupt: { family: 'glitchy', sub: 'corrupt' },
  error: { family: 'glitchy', sub: 'broken' },
  signal: { family: 'glitchy', sub: 'buffer' },
  buffer: { family: 'glitchy', sub: 'buffer' },
  film: { family: 'retro', sub: 'film' },
  cinema: { family: 'retro', sub: 'film' },
  retro: { family: 'retro' },
  arcade: { family: 'retro', sub: 'arcade' },
  vintage: { family: 'retro', sub: 'vintage' },
  terminal: { family: 'retro', sub: 'computer' },
  ink: { family: 'artsy', sub: 'paint' },
  paint: { family: 'artsy', sub: 'paint' },
  chalk: { family: 'artsy', sub: 'sketch' },
  pencil: { family: 'artsy', sub: 'sketch' },
  stitch: { family: 'artsy', sub: 'textile' },
  fabric: { family: 'artsy', sub: 'textile' },
  craft: { family: 'artsy', sub: 'craft' },
  origami: { family: 'artsy', sub: 'paper' },
  paper: { family: 'artsy', sub: 'paper' },
  neon: { family: 'trippy', sub: 'glow' },
  glow: { family: 'trippy', sub: 'glow' },
  hologram: { family: 'trippy', sub: 'glow' },
  liquid: { family: 'trippy', sub: 'liquid' },
  morph: { family: 'trippy', sub: 'morph' },
  warp: { family: 'trippy', sub: 'warp' },
  prism: { family: 'trippy', sub: 'psychedelic' },
  chromatic: { family: 'trippy', sub: 'psychedelic' },
  rainbow: { family: 'trippy', sub: 'psychedelic' },
  vaporwave: { family: 'trippy', sub: 'psychedelic' },
  trailer: { family: 'cinematic', sub: 'title' },
  dramatic: { family: 'cinematic', sub: 'dramatic' },
  spotlight: { family: 'cinematic', sub: 'dramatic' },
  camera: { family: 'cinematic', sub: 'camera' },
  letterbox: { family: 'cinematic', sub: 'letterbox' },
  widescreen: { family: 'cinematic', sub: 'letterbox' },
}

function classifyTemplate(reg: MotionGraphicRegistration): { family: string; sub: string } {
  for (const tag of reg.tags) {
    const m = TAG_MAP[tag.toLowerCase()]
    if (m) return { family: m.family, sub: m.sub || 'all' }
  }
  const text = `${reg.title} ${reg.description}`.toLowerCase()
  for (const [kw, m] of Object.entries(TAG_MAP)) {
    if (text.includes(kw)) return { family: m.family, sub: m.sub || 'all' }
  }
  return { family: 'all', sub: 'all' }
}

/* ── Static "coming soon" items ─────────────────────────────────────── */

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

/* ── Helpers ─────────────────────────────────────────────────────────── */

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

/** Character type for unified display */
interface UnifiedChar {
  id: string
  name: string
  type: '2d' | '3d' | '1d' | 'avatar'
  thumbnail?: string
  createdAt: number
}

/** Unified type for anything displayable in the grid */
type GridItem =
  | { kind: 'local'; item: MarketplaceItem }
  | { kind: 'server'; listing: MarketplaceListing }
  | { kind: 'static'; item: StaticItem }
  | { kind: 'motion-graphic'; mg: MotionGraphicRegistration }
  | { kind: 'character'; char: UnifiedChar }
  | { kind: 'bundle'; bundle: CharacterBundle }

/* ── Left panel: Categories ───────────────────────────���─────────────── */

/** Group navigation header — matches MainGroupHeader in LeftPanel */
function GroupNavHeader() {
  const setLeftPanelGroup = useEditorStore((s) => s.setLeftPanelGroup)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentIndex = TAB_GROUPS.findIndex((g) => g.id === 'marketplace')

  useEffect(() => {
    if (!dropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  const goPrev = () => {
    const prev = currentIndex <= 0 ? TAB_GROUPS.length - 1 : currentIndex - 1
    setLeftPanelGroup(TAB_GROUPS[prev].id)
  }
  const goNext = () => {
    const next = currentIndex >= TAB_GROUPS.length - 1 ? 0 : currentIndex + 1
    setLeftPanelGroup(TAB_GROUPS[next].id)
  }

  return (
    <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
      <button
        onClick={goPrev}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        title="Previous"
      >
        <ChevronLeft size={16} />
      </button>

      <div ref={dropdownRef} className="relative flex-1 min-w-0">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[13px] font-medium text-zinc-200 hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <ShoppingBag size={14} className="shrink-0 text-zinc-400" />
          <span className="truncate">Marketplace</span>
          <ChevronDown
            size={14}
            className={cn('shrink-0 text-zinc-500 transition-transform duration-200', dropdownOpen && 'rotate-180')}
          />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-zinc-800 border border-white/10 rounded-xl shadow-2xl py-1.5 max-h-[320px] overflow-y-auto">
            {TAB_GROUPS.map((group) => {
              const isActive = group.id === 'marketplace'
              const groupLabel = group.subTabs.length === 1 ? group.subTabs[0].label : group.label
              return (
                <button
                  key={group.id}
                  onClick={() => {
                    setLeftPanelGroup(group.id)
                    setDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3.5 py-2 text-left text-[13px] transition-colors',
                    isActive
                      ? 'bg-green-500/10 text-green-400'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]',
                  )}
                >
                  <span className="truncate">{groupLabel}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      <button
        onClick={goNext}
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
        title="Next"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}

function CategoriesPanel({
  active,
  onSelect,
  itemCounts,
}: {
  active: BrowseCategory
  onSelect: (id: BrowseCategory) => void
  itemCounts: Record<string, number>
}) {
  return (
    <aside className="w-[300px] flex-shrink-0 flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Group nav header — matches LeftPanel's MainGroupHeader */}
      <GroupNavHeader />

      {/* Category list */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {categories.map((cat) => {
          const Icon = cat.icon
          const isActive = active === cat.id
          const count = itemCounts[cat.id] ?? 0
          return (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors',
                isActive ? 'bg-green-500/10 text-green-400' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]',
              )}
            >
              <div
                className={cn(
                  'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                  isActive ? 'bg-green-500/15 text-green-400' : 'bg-white/[0.04] text-zinc-500',
                )}
              >
                <Icon size={16} />
              </div>
              <span className="flex-1 text-[13px] font-medium truncate">{cat.label}</span>
              {count > 0 && (
                <span
                  className={cn('text-[10px] font-bold tabular-nums', isActive ? 'text-green-500/70' : 'text-zinc-600')}
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </aside>
  )
}

/* ── Center: Item grid ──────────────────────────────────────────────── */

interface MgFilters {
  style: string
  subStyle: string
  rating: string
  round: string
}

function ItemGrid({
  items,
  selectedId,
  onSelect,
  search,
  onSearch,
  showMgFilters,
  mgFilters,
  onMgFiltersChange,
}: {
  items: GridItem[]
  selectedId: string | null
  onSelect: (item: GridItem) => void
  search: string
  onSearch: (q: string) => void
  showMgFilters?: boolean
  mgFilters?: MgFilters
  onMgFiltersChange?: (f: MgFilters) => void
}) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const hasActiveFilters =
    mgFilters && (mgFilters.style !== 'all' || mgFilters.rating !== 'all' || mgFilters.round !== 'all')
  const subStyles = mgFilters ? SUB_STYLES[mgFilters.style] : undefined

  const roundOptions = useMemo(() => {
    const rounds = new Set(Object.values(templateRounds as Record<string, string>))
    const sorted = [...rounds].sort((a, b) => {
      if (a === 'initial') return -1
      if (b === 'initial') return 1
      const aNum = a.startsWith('r') ? parseInt(a.slice(1)) : a.startsWith('gen-') ? 1000 + parseInt(a.slice(4)) : 0
      const bNum = b.startsWith('r') ? parseInt(b.slice(1)) : b.startsWith('gen-') ? 1000 + parseInt(b.slice(4)) : 0
      return aNum - bNum
    })
    return [
      { value: 'all', label: 'All Rounds' },
      ...sorted.map((r) => ({ value: r, label: r === 'initial' ? 'Initial' : r })),
    ]
  }, [])

  const ratingOptions = [
    { value: 'all', label: 'All Ratings' },
    { value: 'liked', label: 'Liked' },
    { value: 'disliked', label: 'Disliked' },
    { value: 'unrated', label: 'Unrated' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' },
  ]

  return (
    <div className="flex-1 flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
      {/* Search header */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <Search size={14} className="text-zinc-500 shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search items..."
          className="flex-1 min-w-0 bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => onSearch('')}
            className="p-1 rounded-md text-zinc-500 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        )}
        {showMgFilters && (
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              'p-1 rounded-md transition-colors',
              filtersOpen || hasActiveFilters ? 'text-green-400 bg-green-500/10' : 'text-zinc-500 hover:text-white',
            )}
            title="Filters"
          >
            <Filter size={14} />
          </button>
        )}
        <span className="text-[10px] font-bold text-zinc-600 tabular-nums shrink-0">{items.length}</span>
      </div>

      {/* Motion graphic filters */}
      {showMgFilters && filtersOpen && mgFilters && onMgFiltersChange && (
        <div className="shrink-0 px-3 py-2 border-b border-white/5 space-y-1">
          <PanelSelect
            label="Style"
            value={mgFilters.style}
            onChange={(v) => onMgFiltersChange({ ...mgFilters, style: v, subStyle: 'all' })}
            options={STYLE_FAMILIES.map((s) => ({ value: s.id, label: s.label }))}
          />
          {subStyles && (
            <PanelSelect
              label="Sub-style"
              value={mgFilters.subStyle}
              onChange={(v) => onMgFiltersChange({ ...mgFilters, subStyle: v })}
              options={subStyles.map((s) => ({ value: s.id, label: s.label }))}
            />
          )}
          <PanelSelect
            label="Rating"
            value={mgFilters.rating}
            onChange={(v) => onMgFiltersChange({ ...mgFilters, rating: v })}
            options={ratingOptions}
          />
          <PanelSelect
            label="Round"
            value={mgFilters.round}
            onChange={(v) => onMgFiltersChange({ ...mgFilters, round: v })}
            options={roundOptions}
          />
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <ShoppingBag size={28} className="text-zinc-700" />
            <span className="text-sm text-zinc-500">No items found</span>
            {search && <span className="text-[11px] text-zinc-600">Try a different search term</span>}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {items.map((gi) => {
              const id =
                gi.kind === 'local'
                  ? gi.item.id
                  : gi.kind === 'server'
                    ? gi.listing.id
                    : gi.kind === 'motion-graphic'
                      ? gi.mg.id
                      : gi.kind === 'character'
                        ? gi.char.id
                        : gi.kind === 'bundle'
                          ? gi.bundle.id
                          : gi.item.id
              const isSelected = selectedId === id
              return (
                <button
                  key={`${gi.kind}-${id}`}
                  onClick={() => onSelect(gi)}
                  className={cn(
                    'rounded-xl overflow-hidden transition-all duration-200 text-left group relative aspect-video bg-black',
                    isSelected ? 'ring-1 ring-white/20' : 'ring-1 ring-white/[0.04] hover:ring-white/10',
                  )}
                >
                  {/* Full-card thumbnail */}
                  <div className="absolute inset-0">
                    <ItemThumbnail gi={gi} />
                  </div>
                  {/* Info overlay — bottom, hides on hover */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-5 transition-opacity duration-200 group-hover:opacity-0 pointer-events-none">
                    <ItemInfo gi={gi} />
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Motion graphic live preview ─────────────────────────────────────── */

import React from 'react'

class MotionPreviewErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidUpdate(prevProps: { children: React.ReactNode }) {
    if (prevProps.children !== this.props.children) this.setState({ hasError: false })
  }
  render() {
    if (this.state.hasError)
      return (
        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: 8,
            background: '#1a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: '#f87171',
            fontFamily: 'monospace',
          }}
        >
          preview error
        </div>
      )
    return this.props.children
  }
}

function MotionPreview({ registration, playing }: { registration: MotionGraphicRegistration; playing: boolean }) {
  const Component = registration.component as React.ComponentType<any>
  const [frame, setFrame] = useState(0)
  const rafRef = useRef<number>(0)
  const startRef = useRef(0)
  const fps = 30
  const dur = fps * 5

  useEffect(() => {
    if (!playing) {
      setFrame(0)
      return
    }
    startRef.current = performance.now()
    const tick = (now: number) => {
      setFrame(Math.floor(((now - startRef.current) / 1000) * fps) % dur)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, dur])

  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width
      setScale(w / 320)
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: '#0a0a0a',
      }}
    >
      <div
        style={{
          width: 320,
          height: 180,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          fontSize: '4px',
        }}
      >
        <Component
          config={registration.defaultConfig}
          frame={frame}
          durationInFrames={dur}
          fps={fps}
          width={320}
          height={180}
          progress={frame / dur}
        />
      </div>
    </div>
  )
}

/**
 * Card thumbnail — three states based on scroll position:
 * 1. Far from viewport → unmounted (black div)
 * 2. Near viewport (buffer zone) → mounted at frame 0 (static preview)
 * 3. In center row → animating (plays the loop)
 */
function MotionCardThumb({ reg }: { reg: MotionGraphicRegistration }) {
  const [nearViewport, setNearViewport] = useState(false)
  const [inCenter, setInCenter] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    // Wide observer: mount the component when within 5 rows
    const mountObs = new IntersectionObserver(([entry]) => setNearViewport(entry.isIntersecting), {
      rootMargin: '1000px 0px',
    })
    // Tight observer: only play when card is near center of the scroll container
    // Negative margins shrink the intersection box to a narrow center band
    const playObs = new IntersectionObserver(([entry]) => setInCenter(entry.isIntersecting), {
      rootMargin: '-40% 0px -40% 0px',
    })

    mountObs.observe(el)
    playObs.observe(el)
    return () => {
      mountObs.disconnect()
      playObs.disconnect()
    }
  }, [])

  return (
    <div ref={sentinelRef} className="w-full h-full relative overflow-hidden">
      {nearViewport ? (
        <MotionPreviewErrorBoundary>
          <MotionPreview registration={reg} playing={inCenter} />
        </MotionPreviewErrorBoundary>
      ) : (
        <div className="w-full h-full bg-black" />
      )}
    </div>
  )
}

function ItemThumbnail({ gi }: { gi: GridItem }) {
  if (gi.kind === 'static') {
    const Icon = gi.item.icon
    return (
      <div
        className={cn(
          'w-full h-full bg-gradient-to-br flex items-center justify-center relative overflow-hidden',
          gi.item.gradientFrom,
          gi.item.gradientTo,
        )}
      >
        <Icon
          size={28}
          className="text-white drop-shadow-md group-hover:scale-110 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
      </div>
    )
  }

  if (gi.kind === 'local' && gi.item.videoUrl) {
    return (
      <div className="w-full h-full bg-black relative overflow-hidden">
        <video
          src={gi.item.videoUrl}
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
      </div>
    )
  }

  if (gi.kind === 'local' && gi.item.thumbnailUrl) {
    return (
      <div className="w-full h-full bg-black">
        <img src={gi.item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
      </div>
    )
  }

  if (gi.kind === 'server' && gi.listing.thumbnail_url) {
    return (
      <div className="w-full h-full bg-black">
        <img src={gi.listing.thumbnail_url} alt="" className="w-full h-full object-cover" />
      </div>
    )
  }

  if (gi.kind === 'motion-graphic') return <MotionCardThumb reg={gi.mg} />

  if (gi.kind === 'character') {
    return gi.char.thumbnail ? (
      <div className="w-full h-full bg-black relative overflow-hidden">
        <img src={gi.char.thumbnail} alt="" className="w-full h-full object-contain" />
        <div className="absolute top-1 right-1.5">
          <span
            className={cn(
              'text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded',
              gi.char.type === '2d'
                ? 'bg-green-500/20 text-green-400'
                : gi.char.type === '3d'
                  ? 'bg-blue-500/20 text-blue-400'
                  : gi.char.type === '1d'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-orange-500/20 text-orange-400',
            )}
          >
            {gi.char.type}
          </span>
        </div>
      </div>
    ) : (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <Users size={20} className="text-zinc-700" />
      </div>
    )
  }

  if (gi.kind === 'bundle') {
    return gi.bundle.thumbnail ? (
      <div className="w-full h-full bg-black">
        <img src={gi.bundle.thumbnail} alt="" className="w-full h-full object-cover" />
      </div>
    ) : (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <LayoutGrid size={20} className="text-zinc-700" />
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <Package size={20} className="text-zinc-700" />
    </div>
  )
}

function ItemInfo({ gi }: { gi: GridItem }) {
  const title =
    gi.kind === 'local'
      ? gi.item.title
      : gi.kind === 'server'
        ? gi.listing.title
        : gi.kind === 'static'
          ? gi.item.title
          : gi.kind === 'motion-graphic'
            ? gi.mg.title
            : gi.kind === 'character'
              ? gi.char.name
              : gi.kind === 'bundle'
                ? gi.bundle.name
                : ''

  return (
    <div className="px-2.5 pb-2">
      <h4 className="text-[11px] font-medium text-white/90 truncate">{title}</h4>
    </div>
  )
}

/* ── Right panel: Detail ────────────────────────────────────────────── */

function DetailPanel({ selected }: { selected: GridItem | null }) {
  if (!selected) {
    return (
      <aside className="w-[280px] flex-shrink-0 flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
          <Eye size={15} className="text-zinc-400" />
          <h3 className="text-[13px] font-semibold text-white">Details</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <span className="text-sm text-zinc-600">Select an item to view details</span>
        </div>
      </aside>
    )
  }

  if (selected.kind === 'static') return <StaticDetail item={selected.item} />
  if (selected.kind === 'local') return <LocalDetail item={selected.item} />
  if (selected.kind === 'motion-graphic') return <MotionGraphicDetail mg={selected.mg} />
  if (selected.kind === 'character') return <CharacterDetail char={selected.char} />
  if (selected.kind === 'bundle') return <BundleDetail bundle={selected.bundle} />
  return <ServerDetail listing={selected.listing} />
}

function MotionGraphicDetail({ mg }: { mg: MotionGraphicRegistration }) {
  const addToCanvas = useAddMotionGraphic()
  return (
    <aside className="w-[280px] flex-shrink-0 flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
        <Film size={15} className="text-violet-400" />
        <h3 className="text-[13px] font-semibold text-white">Motion Graphic</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="rounded-xl overflow-hidden">
          <MotionPreviewErrorBoundary>
            <MotionPreview registration={mg} playing />
          </MotionPreviewErrorBoundary>
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">{mg.title}</h4>
          <p className="text-xs text-zinc-400 mt-1">{mg.description}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Category</span>
            <span className="text-zinc-300 capitalize">{mg.category}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Type</span>
            <span className="text-zinc-300">React Component</span>
          </div>
        </div>
        {mg.tags.length > 0 && (
          <div>
            <span className="text-[10px] text-zinc-500 block mb-1.5">Tags</span>
            <div className="flex flex-wrap gap-1">
              {mg.tags.map((tag) => (
                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="pt-2 border-t border-white/5">
          <PanelActionButton variant="primary" icon={Upload} onClick={() => addToCanvas(mg)} className="w-full">
            Add to Canvas
          </PanelActionButton>
        </div>
      </div>
    </aside>
  )
}

function CharacterDetail({ char }: { char: UnifiedChar }) {
  const selectChar = useSelectCharacter()
  const typeLabel =
    char.type === '2d'
      ? '2D Character'
      : char.type === '3d'
        ? '3D Character'
        : char.type === '1d'
          ? 'Pixel Art'
          : 'Avatar'
  const typeColor =
    char.type === '2d'
      ? 'text-green-400'
      : char.type === '3d'
        ? 'text-blue-400'
        : char.type === '1d'
          ? 'text-purple-400'
          : 'text-orange-400'

  return (
    <aside className="w-[280px] flex-shrink-0 flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
        <Users size={15} className={typeColor} />
        <h3 className="text-[13px] font-semibold text-white">{typeLabel}</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {char.thumbnail ? (
          <img src={char.thumbnail} alt="" className="w-full rounded-xl aspect-square object-contain bg-black/30" />
        ) : (
          <div className="aspect-square rounded-xl bg-gradient-to-br from-emerald-900/40 to-teal-900/30 flex items-center justify-center">
            <Users size={36} className="text-emerald-400/50" />
          </div>
        )}
        <div>
          <h4 className="text-sm font-bold text-white">{char.name}</h4>
          <span className={cn('text-xs font-bold uppercase tracking-wider', typeColor)}>{typeLabel}</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Created</span>
            <span className="text-zinc-300">{new Date(char.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="pt-2 border-t border-white/5">
          <PanelActionButton variant="primary" icon={Upload} onClick={() => selectChar(char)} className="w-full">
            Use Character
          </PanelActionButton>
        </div>
      </div>
    </aside>
  )
}

function BundleDetail({ bundle }: { bundle: CharacterBundle }) {
  const selectBdl = useSelectBundle()
  return (
    <aside className="w-[280px] flex-shrink-0 flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
        <LayoutGrid size={15} className="text-amber-400" />
        <h3 className="text-[13px] font-semibold text-white">Bundle</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {bundle.banner ? (
          <img src={bundle.banner} alt="" className="w-full rounded-xl aspect-video object-cover" />
        ) : bundle.thumbnail ? (
          <img src={bundle.thumbnail} alt="" className="w-full rounded-xl aspect-video object-cover" />
        ) : (
          <div className="aspect-video rounded-xl bg-gradient-to-br from-amber-900/40 to-orange-900/30 flex items-center justify-center">
            <LayoutGrid size={36} className="text-amber-400/50" />
          </div>
        )}
        <div>
          <h4 className="text-sm font-bold text-white">{bundle.name}</h4>
          <p className="text-xs text-zinc-400 mt-1">{bundle.description || 'No description'}</p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Characters</span>
            <span className="text-zinc-300">{bundle.characters.length}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Types</span>
            <div className="flex gap-1">
              {[...new Set(bundle.characters.map((c) => c.type))].map((t) => (
                <span
                  key={t}
                  className={cn(
                    'text-[9px] font-bold uppercase px-1 py-0.5 rounded',
                    t === '2d'
                      ? 'bg-green-500/15 text-green-400'
                      : t === '3d'
                        ? 'bg-blue-500/15 text-blue-400'
                        : t === '1d'
                          ? 'bg-purple-500/15 text-purple-400'
                          : 'bg-orange-500/15 text-orange-400',
                  )}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Created</span>
            <span className="text-zinc-300">{new Date(bundle.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="pt-2 border-t border-white/5">
          <PanelActionButton variant="primary" icon={Upload} onClick={() => selectBdl(bundle)} className="w-full">
            Use Bundle
          </PanelActionButton>
        </div>
      </div>
    </aside>
  )
}

function StaticDetail({ item }: { item: StaticItem }) {
  const Icon = item.icon
  return (
    <aside className="w-[280px] flex-shrink-0 flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
        <Eye size={15} className="text-zinc-400" />
        <h3 className="text-[13px] font-semibold text-white">Details</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Thumbnail */}
        <div
          className={cn(
            'aspect-video rounded-xl bg-gradient-to-br flex items-center justify-center overflow-hidden',
            item.gradientFrom,
            item.gradientTo,
          )}
        >
          <Icon size={36} className="text-white drop-shadow-lg" />
        </div>
        {/* Info */}
        <div>
          <h4 className="text-sm font-bold text-white">{item.title}</h4>
          <p className="text-xs text-zinc-400 mt-1">{item.description}</p>
        </div>
        <div className="flex items-center justify-between">
          <StarRating rating={item.rating} reviews={item.reviews} />
          <span className="text-sm font-black text-purple-400">{item.price}</span>
        </div>
        <PanelActionButton
          variant="secondary"
          disabled
          icon={ShoppingCart}
          onClick={() => {}}
          className="w-full text-[10px] py-2.5 border-purple-500/20 text-purple-300/60 font-bold uppercase tracking-widest bg-purple-500/5"
        >
          Coming Soon
        </PanelActionButton>
      </div>
    </aside>
  )
}

function LocalDetail({ item }: { item: MarketplaceItem }) {
  const removeItem = useMarketplaceStore((s) => s.removeItem)

  return (
    <aside className="w-[280px] flex-shrink-0 flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
        <Eye size={15} className="text-zinc-400" />
        <h3 className="text-[13px] font-semibold text-white">Details</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Thumbnail */}
        {item.videoUrl ? (
          <video
            src={item.videoUrl}
            muted
            loop
            playsInline
            autoPlay
            className="w-full rounded-xl aspect-video object-contain bg-black"
          />
        ) : item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt="" className="w-full rounded-xl aspect-video object-cover" />
        ) : (
          <div className="aspect-video rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <Package size={32} className="text-zinc-700" />
          </div>
        )}
        {/* Info */}
        <div>
          <h4 className="text-sm font-bold text-white">{item.title}</h4>
          <p className="text-xs text-zinc-400 mt-1">{item.description || 'No description'}</p>
        </div>
        {/* Metadata */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Category</span>
            <span className="text-zinc-300 capitalize">{item.category}</span>
          </div>
          {item.durationSeconds && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Duration</span>
              <span className="text-zinc-300">{item.durationSeconds}s</span>
            </div>
          )}
          {item.width && item.height && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Resolution</span>
              <span className="text-zinc-300">
                {item.width}x{item.height}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Created</span>
            <span className="text-zinc-300">{new Date(item.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        {/* Actions */}
        <div className="space-y-2 pt-2 border-t border-white/5">
          <PanelActionButton variant="primary" icon={Upload} onClick={() => {}} className="w-full">
            Import to Timeline
          </PanelActionButton>
          <PanelActionButton variant="destructive" icon={Trash2} onClick={() => removeItem(item.id)} className="w-full">
            Delete
          </PanelActionButton>
        </div>
      </div>
    </aside>
  )
}

function ServerDetail({ listing }: { listing: MarketplaceListing }) {
  return (
    <aside className="w-[280px] flex-shrink-0 flex flex-col bg-zinc-900/80 backdrop-blur-xl border border-white/[0.06] rounded-xl overflow-hidden">
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-white/5">
        <Globe size={15} className="text-zinc-400" />
        <h3 className="text-[13px] font-semibold text-white">Community Item</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Thumbnail */}
        {listing.thumbnail_url ? (
          <img src={listing.thumbnail_url} alt="" className="w-full rounded-xl aspect-video object-cover" />
        ) : (
          <div className="aspect-video rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
            <Globe size={32} className="text-zinc-700" />
          </div>
        )}
        {/* Info */}
        <div>
          <h4 className="text-sm font-bold text-white">{listing.title}</h4>
          <p className="text-xs text-zinc-400 mt-1">{listing.description || 'No description'}</p>
        </div>
        {/* Metadata */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Category</span>
            <span className="text-zinc-300 capitalize">{listing.category}</span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Uses</span>
            <span className="text-zinc-300">{listing.use_count}</span>
          </div>
          {listing.creator_email && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-zinc-500">Creator</span>
              <span className="text-zinc-300 truncate max-w-[140px]">{listing.creator_email}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-zinc-500">Published</span>
            <span className="text-zinc-300">{new Date(listing.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        {/* Actions */}
        <div className="pt-2 border-t border-white/5">
          <PanelActionButton variant="primary" icon={Upload} onClick={() => {}} className="w-full">
            Import to Timeline
          </PanelActionButton>
        </div>
      </div>
    </aside>
  )
}

/* ── Main MarketplaceView ───────────────────────────────────────────── */

export function MarketplaceView() {
  const [activeCategory, setActiveCategory] = useState<BrowseCategory>('all')
  const [search, setSearch] = useState('')
  const [selectedItem, setSelectedItem] = useState<GridItem | null>(null)
  const [mgFilters, setMgFilters] = useState<MgFilters>({ style: 'all', subStyle: 'all', rating: 'all', round: 'all' })
  const ratings = useTemplateRatingStore((s) => s.ratings)

  // Existing marketplace data
  const localItems = useMarketplaceStore((s) => s.items)
  const serverListings = useMarketplaceStore((s) => s.serverListings)
  const fetchServerListings = useMarketplaceStore((s) => s.fetchServerListings)

  // Motion graphics
  const [motionGraphics, setMotionGraphics] = useState<MotionGraphicRegistration[]>([])
  useEffect(() => {
    ensureTemplatesLoaded().then(() => setMotionGraphics(getAllMotionGraphics()))
  }, [])

  // Characters (all 4 types)
  const chars2D = useSavedCharactersStore((s) => s.characters)
  const chars3D = useSaved3DCharactersStore((s) => s.characters)
  const chars1D = useSavedPixelArtCharactersStore((s) => s.characters)
  const charsAvatar = useSavedAvatarCharactersStore((s) => s.characters)

  // Bundles
  const bundles = useBundleStore((s) => s.bundles)

  // Fetch server listings on mount and category change
  useEffect(() => {
    const cat =
      activeCategory === 'all' || activeCategory === 'motion-graphics' || activeCategory === 'bundles'
        ? 'all'
        : activeCategory
    fetchServerListings(cat as any, search || undefined)
  }, [activeCategory, search, fetchServerListings])

  // Unified characters
  const unifiedChars = useMemo<UnifiedChar[]>(() => {
    const out: UnifiedChar[] = []
    for (const c of chars2D)
      out.push({
        id: c.id,
        name: c.name,
        type: '2d',
        thumbnail: (c as any)._thumbnail ?? c.referenceImage,
        createdAt: c.createdAt,
      })
    for (const c of chars3D)
      out.push({ id: c.id, name: c.name, type: '3d', thumbnail: c.thumbnailDataUrl, createdAt: c.createdAt })
    for (const c of chars1D)
      out.push({ id: c.id, name: c.name, type: '1d', thumbnail: c.thumbnailDataUrl, createdAt: c.createdAt })
    for (const c of charsAvatar)
      out.push({ id: c.id, name: c.name, type: 'avatar', thumbnail: c.thumbnailDataUrl, createdAt: c.createdAt })
    return out
  }, [chars2D, chars3D, chars1D, charsAvatar])

  // Build unified grid items
  const gridItems = useMemo<GridItem[]>(() => {
    const lowerSearch = search.toLowerCase()
    const matchSearch = (text: string) => !lowerSearch || text.toLowerCase().includes(lowerSearch)
    const items: GridItem[] = []

    // Motion graphics (with style/rating/round filters)
    if (activeCategory === 'all' || activeCategory === 'motion-graphics') {
      const roundMap = templateRounds as Record<string, string>
      for (const mg of motionGraphics) {
        if (!matchSearch(mg.title) && !matchSearch(mg.description) && !mg.tags.some(matchSearch)) continue
        // Style filter
        if (mgFilters.style !== 'all') {
          const cls = classifyTemplate(mg)
          if (cls.family !== mgFilters.style) continue
          if (mgFilters.subStyle !== 'all' && cls.sub !== mgFilters.subStyle) continue
        }
        // Round filter
        if (mgFilters.round !== 'all') {
          if ((roundMap[mg.id] || 'initial') !== mgFilters.round) continue
        }
        // Rating filter
        if (mgFilters.rating !== 'all') {
          const r = ratings[mg.id]
          if (mgFilters.rating === 'unrated' && r) continue
          if (mgFilters.rating === 'liked' && r?.verdict !== 'liked') continue
          if (mgFilters.rating === 'disliked' && r?.verdict !== 'disliked') continue
          if (['1', '2', '3', '4'].includes(mgFilters.rating)) {
            const score = (r as any)?.scores?.quality ?? null
            if (score == null || Math.round(score) !== Number(mgFilters.rating)) continue
          }
        }
        items.push({ kind: 'motion-graphic', mg })
      }
    }

    // Characters
    if (activeCategory === 'all' || activeCategory === 'characters') {
      for (const char of unifiedChars) {
        if (matchSearch(char.name)) items.push({ kind: 'character', char })
      }
    }

    // Bundles
    if (activeCategory === 'all' || activeCategory === 'bundles') {
      for (const bundle of bundles) {
        if (matchSearch(bundle.name) || matchSearch(bundle.description)) items.push({ kind: 'bundle', bundle })
      }
    }

    // Local marketplace items (HTML templates, AI animations, projects, etc.)
    if (activeCategory !== 'motion-graphics' && activeCategory !== 'characters' && activeCategory !== 'bundles') {
      for (const item of localItems) {
        if (activeCategory !== 'all' && item.category !== activeCategory) continue
        if (matchSearch(item.title) || matchSearch(item.description)) items.push({ kind: 'local', item })
      }
    }

    // Server listings
    if (activeCategory !== 'motion-graphics' && activeCategory !== 'characters' && activeCategory !== 'bundles') {
      for (const listing of serverListings) {
        if (activeCategory !== 'all' && listing.category !== activeCategory) continue
        if (matchSearch(listing.title) || matchSearch(listing.description)) items.push({ kind: 'server', listing })
      }
    }

    // Static placeholders
    if (activeCategory !== 'motion-graphics' && activeCategory !== 'characters' && activeCategory !== 'bundles') {
      for (const item of staticItems) {
        if (activeCategory !== 'all' && item.category !== activeCategory) continue
        if (matchSearch(item.title) || matchSearch(item.description)) items.push({ kind: 'static', item })
      }
    }

    return items
  }, [localItems, serverListings, motionGraphics, unifiedChars, bundles, activeCategory, search, mgFilters, ratings])

  // Category counts (unfiltered by search)
  const itemCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    counts['motion-graphics'] = motionGraphics.length
    counts['characters'] = unifiedChars.length
    counts['bundles'] = bundles.length
    for (const item of localItems) counts[item.category] = (counts[item.category] ?? 0) + 1
    for (const listing of serverListings) counts[listing.category] = (counts[listing.category] ?? 0) + 1
    for (const item of staticItems) counts[item.category] = (counts[item.category] ?? 0) + 1
    counts['all'] = Object.values(counts).reduce((a, b) => a + b, 0)
    return counts
  }, [localItems, serverListings, motionGraphics, unifiedChars, bundles])

  const selectedId = useMemo(() => {
    if (!selectedItem) return null
    if (selectedItem.kind === 'local') return selectedItem.item.id
    if (selectedItem.kind === 'server') return selectedItem.listing.id
    if (selectedItem.kind === 'motion-graphic') return selectedItem.mg.id
    if (selectedItem.kind === 'character') return selectedItem.char.id
    if (selectedItem.kind === 'bundle') return selectedItem.bundle.id
    return selectedItem.item.id
  }, [selectedItem])

  return (
    <div className="flex-1 flex overflow-hidden gap-1.5">
      {/* Left: Categories */}
      <CategoriesPanel active={activeCategory} onSelect={setActiveCategory} itemCounts={itemCounts} />

      {/* Center: Grid */}
      <ItemGrid
        items={gridItems}
        selectedId={selectedId}
        onSelect={setSelectedItem}
        search={search}
        onSearch={setSearch}
        showMgFilters={activeCategory === 'motion-graphics' || activeCategory === 'all'}
        mgFilters={mgFilters}
        onMgFiltersChange={setMgFilters}
      />

      {/* Right: Detail */}
      <DetailPanel selected={selectedItem} />
    </div>
  )
}
