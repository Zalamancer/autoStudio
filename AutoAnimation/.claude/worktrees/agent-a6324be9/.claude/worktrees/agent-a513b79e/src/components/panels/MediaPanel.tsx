import { useRef, useCallback, useState, useEffect, useMemo } from 'react'
import {
  Upload,
  Image,
  Film,
  Volume2,
  VolumeX,
  LayoutTemplate,
  Trash2,
  FileImage,
  Info,
  Plus,
  X,
  Eraser,
  Loader2,
  Check,
  Search,
  ExternalLink,
  Download,
  Clock,
  SlidersHorizontal,
  LayoutGrid,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMediaStore } from '@/stores/useMediaStore'
import { useBackgroundRemoval } from '@/hooks/useBackgroundRemoval'
import { usePixabayStore } from '@/stores/usePixabayStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { getPixabayService, hasPixabayService } from '@/services/pixabay'
import type {
  PixabayImageType,
  PixabayOrientation,
  PixabayCategory,
  PixabayColor,
  PixabayOrder,
  PixabayVideoType,
} from '@/services/pixabay'
import { useSoundEffectStore } from '@/stores/useSoundEffectStore'
import { getFreesoundService } from '@/services/freesound'
import { generateSoundEffect } from '@/services/elevenlabs'
import { saveMediaBlob } from '@/services/mediaDB'
import { useMarketplaceStore, type MarketplaceItem } from '@/stores/useMarketplaceStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { parseTemplateConfig } from '@/services/templateConfigParser'
import { injectMessageBridge } from '@/services/templateBridge'
import { getTemplateAnalysis } from '@/services/templateAnalyzer'
import { getTemplateContent, BUILTIN_TEMPLATES } from '@/data/builtinTemplates'
import { resolveTemplateType, getMotionGraphic } from '@/motionGraphics'
import { useMotionGraphicStore } from '@/stores/useMotionGraphicStore'
import type { PixabayImageHit, PixabayVideoHit } from '@/services/pixabay'
import type { FreesoundHit } from '@/services/freesound'
import type { MediaAsset, MediaCategory } from '@/stores/useMediaStore'
import type { AIFieldType } from '@/types/templateAnalysis'
import type { TemplateConfigProperty, ConfigPropertyType } from '@/services/templateConfigParser'
import type { AITemplateAnalysis } from '@/types/templateAnalysis'
import { useShallow } from 'zustand/react/shallow'

const ACCEPTED_TYPES: Record<string, MediaCategory> = {
  'image/png': 'images',
  'image/jpeg': 'images',
  'image/gif': 'images',
  'image/svg+xml': 'images',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/mp3': 'audio',
  'video/mp4': 'video',
  'video/webm': 'video',
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

function getCategoryFromType(mimeType: string): MediaCategory {
  return ACCEPTED_TYPES[mimeType] || 'images'
}

function getCategoryIcon(_category: MediaCategory) {
  return FileImage
}

// ── AI field → static config property merging (from TemplatesLibraryPanel) ──
function aiFieldTypeToConfigType(ft: AIFieldType): ConfigPropertyType {
  switch (ft) {
    case 'color':
    case 'gradient':
      return 'color'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'text-array':
      return 'text-array'
    case 'object-array':
      return 'object-array'
    default:
      return 'text'
  }
}

function aiGroupToConfigGroup(g: string): string {
  switch (g) {
    case 'Content':
    case 'Typography':
    case 'Media':
      return 'Text'
    case 'Colors':
      return 'Colors'
    case 'Animation':
      return 'Animation'
    case 'Data':
      return 'Data'
    case 'Layout':
      return 'Numbers'
    default:
      return 'Text'
  }
}

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

// ── Media panel tab type ─────────────────────────────────────────────────────
type MediaTab = 'all' | 'images' | 'videos' | 'music' | 'designs'

const MEDIA_TABS: { id: MediaTab; label: string; icon?: typeof Image }[] = [
  { id: 'all', icon: LayoutGrid, label: 'All' },
  { id: 'images', icon: Image, label: 'Images' },
  { id: 'videos', icon: Film, label: 'Videos' },
  { id: 'music', icon: Volume2, label: 'Music & SFX' },
  { id: 'designs', icon: LayoutTemplate, label: 'Motion Designs' },
]

// ── Sparkles icon (inline to avoid import conflict) ──────────────────────────
function Sparkles({ size = 14, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}

// ── Filter state types ───────────────────────────────────────────────────────

interface ImageFilters {
  imageType: PixabayImageType
  orientation: PixabayOrientation
  category: PixabayCategory | ''
  color: PixabayColor | ''
  order: PixabayOrder
  editorsChoice: boolean
}

interface VideoFilters {
  videoType: PixabayVideoType
  category: PixabayCategory | ''
  order: PixabayOrder
  editorsChoice: boolean
}

type AudioDuration = 'any' | 'short' | 'medium' | 'long'

interface AudioFilters {
  duration: AudioDuration
}

const DEFAULT_IMAGE_FILTERS: ImageFilters = {
  imageType: 'all',
  orientation: 'all',
  category: '',
  color: '',
  order: 'popular',
  editorsChoice: false,
}

const DEFAULT_VIDEO_FILTERS: VideoFilters = {
  videoType: 'all',
  category: '',
  order: 'popular',
  editorsChoice: false,
}

const DEFAULT_AUDIO_FILTERS: AudioFilters = {
  duration: 'any',
}

const PIXABAY_CATEGORIES: { value: PixabayCategory; label: string }[] = [
  { value: 'backgrounds', label: 'Backgrounds' },
  { value: 'nature', label: 'Nature' },
  { value: 'people', label: 'People' },
  { value: 'animals', label: 'Animals' },
  { value: 'food', label: 'Food' },
  { value: 'travel', label: 'Travel' },
  { value: 'buildings', label: 'Buildings' },
  { value: 'business', label: 'Business' },
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'computer', label: 'Computer' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'health', label: 'Health' },
  { value: 'education', label: 'Education' },
  { value: 'science', label: 'Science' },
  { value: 'transportation', label: 'Transport' },
  { value: 'industry', label: 'Industry' },
  { value: 'feelings', label: 'Feelings' },
  { value: 'religion', label: 'Religion' },
  { value: 'places', label: 'Places' },
]

const PIXABAY_COLORS: { value: PixabayColor; hex: string }[] = [
  { value: 'red', hex: '#ef4444' },
  { value: 'orange', hex: '#f97316' },
  { value: 'yellow', hex: '#eab308' },
  { value: 'green', hex: '#22c55e' },
  { value: 'turquoise', hex: '#06b6d4' },
  { value: 'blue', hex: '#3b82f6' },
  { value: 'lilac', hex: '#a855f7' },
  { value: 'pink', hex: '#ec4899' },
  { value: 'white', hex: '#ffffff' },
  { value: 'gray', hex: '#9ca3af' },
  { value: 'black', hex: '#1f2937' },
  { value: 'brown', hex: '#92400e' },
  { value: 'grayscale', hex: '#6b7280' },
  { value: 'transparent', hex: 'transparent' },
]

function isImageFiltersActive(f: ImageFilters): boolean {
  return (
    f.imageType !== 'all' ||
    f.orientation !== 'all' ||
    f.category !== '' ||
    f.color !== '' ||
    f.order !== 'popular' ||
    f.editorsChoice
  )
}

function isVideoFiltersActive(f: VideoFilters): boolean {
  return f.videoType !== 'all' || f.category !== '' || f.order !== 'popular' || f.editorsChoice
}

function isAudioFiltersActive(f: AudioFilters): boolean {
  return f.duration !== 'any'
}

function audioDurationToFilter(d: AudioDuration): string {
  switch (d) {
    case 'short':
      return 'duration:[0 TO 5]'
    case 'medium':
      return 'duration:[5 TO 15]'
    case 'long':
      return 'duration:[15 TO 60]'
    default:
      return 'duration:[0 TO 60]'
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export function MediaPanel() {
  const [activeTab, setActiveTab] = useState<MediaTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Per-tab filter state
  const [imageFilters, setImageFilters] = useState<ImageFilters>(DEFAULT_IMAGE_FILTERS)
  const [videoFilters, setVideoFilters] = useState<VideoFilters>(DEFAULT_VIDEO_FILTERS)
  const [audioFilters, setAudioFilters] = useState<AudioFilters>(DEFAULT_AUDIO_FILTERS)

  const hasActiveFilters =
    (activeTab === 'all' && isImageFiltersActive(imageFilters)) ||
    (activeTab === 'images' && isImageFiltersActive(imageFilters)) ||
    (activeTab === 'videos' && isVideoFiltersActive(videoFilters)) ||
    (activeTab === 'music' && isAudioFiltersActive(audioFilters))

  const showFilterButton = activeTab !== 'designs'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Icon Tab Bar (full-width, active shows label, animated with anticipation) ── */}
      <div className="shrink-0 flex items-center gap-1 px-3 py-2 border-b border-white/5">
        {MEDIA_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon!
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              style={{
                flex: isActive ? 2 : 1,
                transition:
                  'flex 300ms cubic-bezier(0.25, 1, 0.5, 1), background-color 200ms, color 200ms, padding 200ms',
              }}
              className={cn(
                'relative h-8 rounded-lg flex items-center justify-center gap-1.5 overflow-hidden',
                isActive ? 'bg-white text-black px-2' : 'text-gray-400 hover:text-white hover:bg-[#2a2a2a]',
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span
                style={{
                  transition: 'max-width 300ms cubic-bezier(0.25, 1, 0.5, 1) 50ms, opacity 200ms ease 60ms',
                }}
                className={cn(
                  'text-[11px] font-medium truncate',
                  isActive ? 'max-w-[80px] opacity-100' : 'max-w-0 opacity-0',
                )}
              >
                {tab.label}
              </span>
              {tab.id === 'videos' && !isActive && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500" />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Search Bar + Filter Button ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'all'
                  ? 'Search media...'
                  : activeTab === 'images'
                    ? 'Search images...'
                    : activeTab === 'videos'
                      ? 'Search videos...'
                      : activeTab === 'music'
                        ? 'Search sounds...'
                        : 'Search motion designs...'
              }
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-green-500/30 focus:outline-none"
            />
          </div>
          {showFilterButton && (
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn(
                'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
                filtersOpen
                  ? 'bg-green-500/20 text-green-400'
                  : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700/50',
              )}
              title="Filters"
            >
              <SlidersHorizontal size={15} />
              {hasActiveFilters && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-green-400" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Filter Panel ── */}
      {filtersOpen && showFilterButton && (
        <div className="shrink-0 px-3 pb-2">
          {(activeTab === 'all' || activeTab === 'images') && (
            <ImageFilterPanel filters={imageFilters} onChange={setImageFilters} />
          )}
          {activeTab === 'videos' && <VideoFilterPanel filters={videoFilters} onChange={setVideoFilters} />}
          {activeTab === 'music' && <AudioFilterPanel filters={audioFilters} onChange={setAudioFilters} />}
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3">
        {activeTab === 'all' && <AllTab searchQuery={searchQuery} imageFilters={imageFilters} />}
        {activeTab === 'images' && <ImagesTab searchQuery={searchQuery} imageFilters={imageFilters} />}
        {activeTab === 'videos' && <VideosTab searchQuery={searchQuery} videoFilters={videoFilters} />}
        {activeTab === 'music' && <MusicSFXTab searchQuery={searchQuery} audioFilters={audioFilters} />}
        {activeTab === 'designs' && <TemplatesTab searchQuery={searchQuery} />}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// FILTER PANELS
// ══════════════════════════════════════════════════════════════════════════════

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-[10px] text-zinc-500 w-14 shrink-0 pt-0.5">{label}</span>
      <div className="flex flex-wrap gap-1 flex-1">{children}</div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors',
        active ? 'bg-green-500/20 text-green-400' : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700',
      )}
    >
      {children}
    </button>
  )
}

function ImageFilterPanel({ filters, onChange }: { filters: ImageFilters; onChange: (f: ImageFilters) => void }) {
  const update = (patch: Partial<ImageFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="space-y-2 p-2.5 bg-zinc-800/50 rounded-lg border border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Filters</span>
        {isImageFiltersActive(filters) && (
          <button
            onClick={() => onChange(DEFAULT_IMAGE_FILTERS)}
            className="text-[9px] text-zinc-500 hover:text-zinc-300"
          >
            Reset
          </button>
        )}
      </div>

      <FilterRow label="Type">
        {(['all', 'photo', 'illustration', 'vector'] as const).map((v) => (
          <FilterChip key={v} active={filters.imageType === v} onClick={() => update({ imageType: v })}>
            {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
          </FilterChip>
        ))}
      </FilterRow>

      <FilterRow label="Orientation">
        {(['all', 'horizontal', 'vertical'] as const).map((v) => (
          <FilterChip key={v} active={filters.orientation === v} onClick={() => update({ orientation: v })}>
            {v === 'all' ? 'Any' : v === 'horizontal' ? 'Landscape' : 'Portrait'}
          </FilterChip>
        ))}
      </FilterRow>

      <FilterRow label="Sort">
        {(['popular', 'latest'] as const).map((v) => (
          <FilterChip key={v} active={filters.order === v} onClick={() => update({ order: v })}>
            {v === 'popular' ? 'Popular' : 'Latest'}
          </FilterChip>
        ))}
        <FilterChip active={filters.editorsChoice} onClick={() => update({ editorsChoice: !filters.editorsChoice })}>
          Editor&apos;s Pick
        </FilterChip>
      </FilterRow>

      <FilterRow label="Category">
        <FilterChip active={filters.category === ''} onClick={() => update({ category: '' })}>
          Any
        </FilterChip>
        {PIXABAY_CATEGORIES.map((c) => (
          <FilterChip key={c.value} active={filters.category === c.value} onClick={() => update({ category: c.value })}>
            {c.label}
          </FilterChip>
        ))}
      </FilterRow>

      <FilterRow label="Color">
        <button
          onClick={() => update({ color: '' })}
          className={cn(
            'w-5 h-5 rounded-full border-2 transition-colors flex items-center justify-center',
            filters.color === '' ? 'border-green-400' : 'border-zinc-600 hover:border-zinc-400',
          )}
          title="Any"
        >
          {filters.color === '' && <span className="w-1.5 h-1.5 rounded-full bg-green-400" />}
        </button>
        {PIXABAY_COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => update({ color: c.value })}
            className={cn(
              'w-5 h-5 rounded-full border-2 transition-colors',
              filters.color === c.value
                ? 'border-green-400 ring-1 ring-green-400/50'
                : 'border-zinc-600 hover:border-zinc-400',
              c.value === 'transparent' &&
                'bg-[repeating-conic-gradient(#808080_0%_25%,transparent_0%_50%)] bg-[length:8px_8px]',
            )}
            style={c.value !== 'transparent' ? { backgroundColor: c.hex } : undefined}
            title={c.value}
          />
        ))}
      </FilterRow>
    </div>
  )
}

function VideoFilterPanel({ filters, onChange }: { filters: VideoFilters; onChange: (f: VideoFilters) => void }) {
  const update = (patch: Partial<VideoFilters>) => onChange({ ...filters, ...patch })

  return (
    <div className="space-y-2 p-2.5 bg-zinc-800/50 rounded-lg border border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Filters</span>
        {isVideoFiltersActive(filters) && (
          <button
            onClick={() => onChange(DEFAULT_VIDEO_FILTERS)}
            className="text-[9px] text-zinc-500 hover:text-zinc-300"
          >
            Reset
          </button>
        )}
      </div>

      <FilterRow label="Type">
        {(['all', 'film', 'animation'] as const).map((v) => (
          <FilterChip key={v} active={filters.videoType === v} onClick={() => update({ videoType: v })}>
            {v === 'all' ? 'All' : v.charAt(0).toUpperCase() + v.slice(1)}
          </FilterChip>
        ))}
      </FilterRow>

      <FilterRow label="Sort">
        {(['popular', 'latest'] as const).map((v) => (
          <FilterChip key={v} active={filters.order === v} onClick={() => update({ order: v })}>
            {v === 'popular' ? 'Popular' : 'Latest'}
          </FilterChip>
        ))}
        <FilterChip active={filters.editorsChoice} onClick={() => update({ editorsChoice: !filters.editorsChoice })}>
          Editor&apos;s Pick
        </FilterChip>
      </FilterRow>

      <FilterRow label="Category">
        <FilterChip active={filters.category === ''} onClick={() => update({ category: '' })}>
          Any
        </FilterChip>
        {PIXABAY_CATEGORIES.map((c) => (
          <FilterChip key={c.value} active={filters.category === c.value} onClick={() => update({ category: c.value })}>
            {c.label}
          </FilterChip>
        ))}
      </FilterRow>
    </div>
  )
}

function AudioFilterPanel({ filters, onChange }: { filters: AudioFilters; onChange: (f: AudioFilters) => void }) {
  return (
    <div className="space-y-2 p-2.5 bg-zinc-800/50 rounded-lg border border-white/5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Filters</span>
        {isAudioFiltersActive(filters) && (
          <button
            onClick={() => onChange(DEFAULT_AUDIO_FILTERS)}
            className="text-[9px] text-zinc-500 hover:text-zinc-300"
          >
            Reset
          </button>
        )}
      </div>

      <FilterRow label="Duration">
        {[
          { value: 'any' as const, label: 'Any' },
          { value: 'short' as const, label: '0–5s' },
          { value: 'medium' as const, label: '5–15s' },
          { value: 'long' as const, label: '15–60s' },
        ].map((d) => (
          <FilterChip
            key={d.value}
            active={filters.duration === d.value}
            onClick={() => onChange({ duration: d.value })}
          >
            {d.label}
          </FilterChip>
        ))}
      </FilterRow>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// ALL TAB — Pixabay trending images (same as old "All" tab)
// ══════════════════════════════════════════════════════════════════════════════

function AllTab({ searchQuery, imageFilters }: { searchQuery: string; imageFilters: ImageFilters }) {
  return <PixabayImageBrowser externalQuery={searchQuery} filters={imageFilters} />
}

// ══════════════════════════════════════════════════════════════════════════════
// IMAGES TAB — Pixabay search + user uploads
// ══════════════════════════════════════════════════════════════════════════════

function ImagesTab({ searchQuery, imageFilters }: { searchQuery: string; imageFilters: ImageFilters }) {
  const [subTab, setSubTab] = useState<'search' | 'uploads'>('search')

  return (
    <div className="space-y-3">
      {/* Sub-tab toggle + AI generate */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setSubTab('search')}
          className={cn(
            'px-3 py-1 rounded-full text-[11px] font-medium transition-colors',
            subTab === 'search'
              ? 'bg-green-500/20 text-green-400'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5',
          )}
        >
          Search
        </button>
        <button
          onClick={() => setSubTab('uploads')}
          className={cn(
            'px-3 py-1 rounded-full text-[11px] font-medium transition-colors',
            subTab === 'uploads'
              ? 'bg-green-500/20 text-green-400'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5',
          )}
        >
          Uploads
        </button>
        <div className="flex-1" />
        <button
          onClick={() => useEditorStore.getState().setRightPanelTab('gen-image-properties')}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
        >
          <Sparkles size={10} />
          Generate
        </button>
      </div>

      {subTab === 'search' && <PixabayImageBrowser externalQuery={searchQuery} filters={imageFilters} />}
      {subTab === 'uploads' && <UploadedImagesSection />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// VIDEOS TAB — Pixabay video search + user uploads + record
// ══════════════════════════════════════════════════════════════════════════════

function VideosTab({ searchQuery, videoFilters }: { searchQuery: string; videoFilters: VideoFilters }) {
  const [subTab, setSubTab] = useState<'search' | 'uploads'>('search')

  return (
    <div className="space-y-3">
      {/* Sub-tab toggle + AI generate + record */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setSubTab('search')}
          className={cn(
            'px-3 py-1 rounded-full text-[11px] font-medium transition-colors',
            subTab === 'search'
              ? 'bg-green-500/20 text-green-400'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5',
          )}
        >
          Search
        </button>
        <button
          onClick={() => setSubTab('uploads')}
          className={cn(
            'px-3 py-1 rounded-full text-[11px] font-medium transition-colors',
            subTab === 'uploads'
              ? 'bg-green-500/20 text-green-400'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5',
          )}
        >
          Uploads
        </button>
        <div className="flex-1" />
        <button
          onClick={() => useEditorStore.getState().setRightPanelTab('gen-text-to-video-properties')}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors"
        >
          <Sparkles size={10} />
          Generate
        </button>
        <button
          onClick={() => useEditorStore.getState().openCanvasOverlay('screen-recorder')}
          className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          Record
        </button>
      </div>

      {subTab === 'search' && <PixabayVideoBrowser externalQuery={searchQuery} filters={videoFilters} />}
      {subTab === 'uploads' && <UploadedVideosSection />}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MUSIC & SFX TAB — Freesound search + AI generate
// ══════════════════════════════════════════════════════════════════════════════

const SFX_CATEGORIES = [
  { label: 'Whoosh', query: 'whoosh transition swoosh' },
  { label: 'Impact', query: 'impact hit dramatic' },
  { label: 'Nature', query: 'nature ambient birds' },
  { label: 'Crowd', query: 'crowd applause cheer' },
  { label: 'Tech', query: 'notification beep digital' },
  { label: 'Musical', query: 'musical stinger accent' },
]

function MusicSFXTab({ searchQuery, audioFilters }: { searchQuery: string; audioFilters: AudioFilters }) {
  const {
    results,
    isLoading,
    error,
    hasMore,
    currentPage,
    previewingId,
    generatePrompt,
    isGenerating,
    setSearchQuery: setSfxQuery,
    setLoading,
    setError,
    setResults,
    appendResults,
    setGeneratePrompt,
    setGenerating,
    preview,
    stopPreview,
  } = useSoundEffectStore(
    useShallow((s) => ({
      results: s.results,
      isLoading: s.isLoading,
      error: s.error,
      hasMore: s.hasMore,
      currentPage: s.currentPage,
      previewingId: s.previewingId,
      generatePrompt: s.generatePrompt,
      isGenerating: s.isGenerating,
      setSearchQuery: s.setSearchQuery,
      setLoading: s.setLoading,
      setError: s.setError,
      setResults: s.setResults,
      appendResults: s.appendResults,
      setGeneratePrompt: s.setGeneratePrompt,
      setGenerating: s.setGenerating,
      preview: s.preview,
      stopPreview: s.stopPreview,
    })),
  )

  const [addingIds, setAddingIds] = useState<number[]>([])
  const [mode, setMode] = useState<'search' | 'generate'>('search')

  const handleSearch = useCallback(
    async (query: string, page = 1) => {
      if (!query.trim()) return
      setLoading(true)
      setError(null)
      try {
        const service = getFreesoundService()
        const res = await service.search({
          query: query.trim(),
          page,
          pageSize: 20,
          filter: audioDurationToFilter(audioFilters.duration),
        })
        if (page === 1) {
          setResults(res.results, res.count, page)
        } else {
          appendResults(res.results, res.count, page)
        }
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    },
    [setLoading, setError, setResults, appendResults],
  )

  // Sync global search bar → freesound search (only in search mode)
  useEffect(() => {
    if (searchQuery.trim() && mode === 'search') {
      setSfxQuery(searchQuery)
      handleSearch(searchQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, audioFilters.duration])

  const handleAddToTimeline = useCallback(
    async (hit: FreesoundHit) => {
      setAddingIds((prev) => [...prev, hit.id])
      try {
        const service = getFreesoundService()
        const blob = await service.downloadAsBlob(hit.previews['preview-hq-mp3'])
        const assetId = `sfx_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
        const url = URL.createObjectURL(blob)

        await saveMediaBlob(assetId, blob)
        const mediaStore = useMediaStore.getState()
        mediaStore.addAsset(
          {
            id: assetId,
            name: `SFX: ${hit.name}`,
            type: 'audio/mpeg',
            size: blob.size,
            category: 'audio',
            url,
            addedAt: Date.now(),
          },
          blob,
        )
        mediaStore.addToCanvas(assetId)
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setAddingIds((prev) => prev.filter((id) => id !== hit.id))
      }
    },
    [setError],
  )

  const handleGenerate = useCallback(async () => {
    if (!generatePrompt.trim()) return
    setGenerating(true)
    setError(null)
    try {
      const result = await generateSoundEffect({
        text: generatePrompt.trim(),
        promptInfluence: 0.3,
      })

      const assetId = `sfx_gen_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const url = URL.createObjectURL(result.audioBlob)

      await saveMediaBlob(assetId, result.audioBlob)
      const mediaStore = useMediaStore.getState()
      mediaStore.addAsset(
        {
          id: assetId,
          name: `SFX: ${generatePrompt.trim()}`,
          type: 'audio/mpeg',
          size: result.audioBlob.size,
          category: 'audio',
          url,
          addedAt: Date.now(),
        },
        result.audioBlob,
      )
      mediaStore.addToCanvas(assetId)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setGenerating(false)
    }
  }, [generatePrompt, setGenerating, setError])

  return (
    <div className="space-y-3">
      {/* Mode pills: Search / AI Generate */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setMode('search')}
          className={cn(
            'px-3 py-1 rounded-full text-[11px] font-medium transition-colors',
            mode === 'search' ? 'bg-green-500/20 text-green-400' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5',
          )}
        >
          Search
        </button>
        <button
          onClick={() => setMode('generate')}
          className={cn(
            'flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium transition-colors',
            mode === 'generate'
              ? 'bg-purple-500/20 text-purple-400'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5',
          )}
        >
          <Sparkles size={10} />
          AI Generate
        </button>
      </div>

      {mode === 'search' ? (
        <>
          {/* Category Chips */}
          <div className="flex flex-wrap gap-1">
            {SFX_CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => {
                  setSfxQuery(cat.query)
                  handleSearch(cat.query)
                }}
                className="text-[10px] px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded-full hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="space-y-1">
            {error && <div className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2">{error}</div>}

            {results.map((hit) => (
              <SFXResultItem
                key={hit.id}
                hit={hit}
                isPlaying={previewingId === hit.id}
                isAdding={addingIds.includes(hit.id)}
                onPreview={() => preview(hit)}
                onStopPreview={stopPreview}
                onAdd={() => handleAddToTimeline(hit)}
              />
            ))}

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-zinc-500" />
              </div>
            )}

            {hasMore && !isLoading && (
              <button
                onClick={() => handleSearch(searchQuery, currentPage + 1)}
                className="w-full text-xs text-zinc-500 hover:text-zinc-300 py-2"
              >
                Load more...
              </button>
            )}

            {!isLoading && results.length === 0 && searchQuery.trim() && (
              <div className="text-center py-6 text-zinc-600 text-xs">No results. Try different keywords.</div>
            )}

            {!isLoading && results.length === 0 && !searchQuery.trim() && (
              <div className="text-center py-6 text-zinc-600 text-xs">
                Type in the search bar above or pick a category.
              </div>
            )}
          </div>
        </>
      ) : (
        /* AI Generate mode */
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-500 block mb-1">Describe the sound effect</label>
            <textarea
              value={generatePrompt}
              onChange={(e) => setGeneratePrompt(e.target.value)}
              placeholder="e.g. dramatic orchestral hit, coin dropping on wooden table, sci-fi whoosh transition..."
              className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-purple-500/30 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !generatePrompt.trim()}
            className={cn(
              'w-full py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2',
              isGenerating || !generatePrompt.trim()
                ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30',
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate & Add to Timeline
              </>
            )}
          </button>

          {error && <div className="text-xs text-red-400 bg-red-500/10 rounded-lg p-2">{error}</div>}

          <div className="text-[10px] text-zinc-600 leading-relaxed">
            Uses ElevenLabs AI to generate custom sound effects from text descriptions. 15 credits per generation.
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TEMPLATES TAB — Simplified template grid from marketplace store
// ══════════════════════════════════════════════════════════════════════════════

function resolveHtmlContent(item: MarketplaceItem): string | undefined {
  if (item.htmlContent) return item.htmlContent
  const builtin = BUILTIN_TEMPLATES.find((t) => t.id === item.id)
  if (builtin) return getTemplateContent(builtin.filename) ?? undefined
  return undefined
}

function idToGradient(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  const h1 = (hash >>> 0) % 360
  const h2 = (h1 + 40) % 360
  return `linear-gradient(135deg, hsl(${h1},50%,18%), hsl(${h2},60%,12%))`
}

function TemplatesTab({ searchQuery }: { searchQuery: string }) {
  const { items } = useMarketplaceStore()
  const canvasWidth = useCanvasStore((s) => s.canvasWidth)
  const canvasHeight = useCanvasStore((s) => s.canvasHeight)
  const addClip = useTimelineStore((s) => s.addClip)
  const timelineFps = useTimelineStore((s) => s.fps)
  const addVideo = useVideoLayerStore((s) => s.addVideo)
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null)

  // Filter: show all template-category items (html-templates, captions, collages), match search
  const filteredItems = useMemo(() => {
    const templateCategories = new Set(['html-templates', 'captions', 'collages'])
    const visible = items.filter((item) => templateCategories.has(item.category))
    if (!searchQuery.trim()) return visible
    const q = searchQuery.toLowerCase()
    return visible.filter(
      (item) => item.title.toLowerCase().includes(q) || (item.description || '').toLowerCase().includes(q),
    )
  }, [items, searchQuery])

  const handleUseHTMLTemplate = useCallback(
    (item: MarketplaceItem) => {
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
      if (!html) return

      const totalFrames = useTimelineStore.getState().totalFrames
      const templateId = `html-tpl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const staticConfig = parseTemplateConfig(html)
      const bridgedHtml = injectMessageBridge(html)

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

      getTemplateAnalysis(item.id, html)
        .then((analysis) => {
          if (analysis.fields.length > 0) {
            const merged = mergeAIFieldsIntoConfig(staticConfig, analysis)
            if (merged.length > staticConfig.length) {
              useHTMLTemplateLayerStore.getState().updateTemplate(templateId, { customConfig: merged })
            }
          }
        })
        .catch(() => {})
    },
    [canvasWidth, canvasHeight],
  )

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

  const handleUse = useCallback(
    (item: MarketplaceItem) => {
      setLoadingItemId(item.id)
      try {
        if (item.category === 'html-templates' || item.category === 'captions' || item.category === 'collages') {
          handleUseHTMLTemplate(item)
        } else if (item.category === 'ai-animations') {
          handleImportAIAnimation(item)
        }
      } finally {
        setTimeout(() => setLoadingItemId(null), 400)
      }
    },
    [handleUseHTMLTemplate, handleImportAIAnimation],
  )

  return (
    <div className="space-y-3">
      {filteredItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <LayoutTemplate size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-[11px]">No templates found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {filteredItems.map((item) => (
            <TemplateGridCard
              key={item.id}
              item={item}
              onUse={() => handleUse(item)}
              loading={loadingItemId === item.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TemplateGridCard({ item, onUse, loading }: { item: MarketplaceItem; onUse: () => void; loading: boolean }) {
  const isHTMLCategory =
    item.category === 'html-templates' || item.category === 'captions' || item.category === 'collages'

  return (
    <div className="rounded-lg border border-white/5 bg-[#2a2a2a]/80 overflow-hidden transition-all hover:border-gray-500/60 group">
      {/* Thumbnail */}
      <div className="aspect-[4/3] bg-[#1e1e1e] relative overflow-hidden">
        {isHTMLCategory ? (
          <div
            className="absolute inset-0 flex items-center justify-center p-2"
            style={{ background: idToGradient(item.id) }}
          >
            <span className="text-[9px] text-white/50 font-semibold text-center leading-tight line-clamp-3">
              {item.title}
            </span>
          </div>
        ) : item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <LayoutTemplate size={20} className="text-gray-600" />
          </div>
        )}
      </div>

      {/* Info + Use button */}
      <div className="p-1.5 space-y-1">
        <h4 className="text-[10px] font-semibold text-white truncate">{item.title}</h4>
        <button
          onClick={onUse}
          disabled={loading}
          className="w-full flex items-center justify-center gap-0.5 py-1 rounded bg-[#3a3a3a] hover:bg-green-500/20 hover:text-green-400 disabled:opacity-50 text-gray-300 text-[9px] font-medium transition-colors"
        >
          {loading ? <Loader2 size={9} className="animate-spin" /> : <Plus size={9} />}
          Use
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Pixabay Image Browser ─────────────────────────────────────────────────

function PixabayImageBrowser({ externalQuery, filters }: { externalQuery: string; filters: ImageFilters }) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const query = usePixabayStore((s) => s.query)
  const isLoading = usePixabayStore((s) => s.isLoading)
  const error = usePixabayStore((s) => s.error)
  const imageResults = usePixabayStore((s) => s.imageResults)
  const currentPage = usePixabayStore((s) => s.currentPage)
  const hasMore = usePixabayStore((s) => s.hasMore)
  const downloadingIds = usePixabayStore((s) => s.downloadingIds)

  const setQuery = usePixabayStore((s) => s.setQuery)
  const setLoading = usePixabayStore((s) => s.setLoading)
  const setError = usePixabayStore((s) => s.setError)
  const setImageResults = usePixabayStore((s) => s.setImageResults)
  const appendImageResults = usePixabayStore((s) => s.appendImageResults)
  const addDownloadingId = usePixabayStore((s) => s.addDownloadingId)
  const removeDownloadingId = usePixabayStore((s) => s.removeDownloadingId)

  const addAsset = useMediaStore((s) => s.addAsset)
  const addToCanvas = useMediaStore((s) => s.addToCanvas)
  const existingAssets = useMediaStore((s) => s.assets)

  const isConfigured = hasPixabayService()

  const performSearchDirect = useCallback(
    async (searchQuery: string, page: number = 1) => {
      if (!isConfigured) return
      setLoading(true)
      setError(null)
      try {
        const service = getPixabayService()
        const result = await service.searchImages({
          q: searchQuery || 'trending',
          page,
          per_page: 30,
          image_type: filters.imageType !== 'all' ? filters.imageType : undefined,
          orientation: filters.orientation !== 'all' ? filters.orientation : undefined,
          category: filters.category || undefined,
          colors: filters.color || undefined,
          order: filters.order,
          editors_choice: filters.editorsChoice || undefined,
        })
        if (page === 1) setImageResults(result.hits, result.totalHits, page)
        else appendImageResults(result.hits, result.totalHits, page)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
      } finally {
        setLoading(false)
      }
    },

    [isConfigured, setLoading, setError, setImageResults, appendImageResults, filters],
  )

  // Load trending on mount
  useEffect(() => {
    if (isConfigured && imageResults.length === 0 && !query.trim()) {
      performSearchDirect('', 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync external search query to pixabay store
  useEffect(() => {
    if (externalQuery !== query) {
      setQuery(externalQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalQuery])

  // Re-search when filters change
  const filtersKey = JSON.stringify(filters)
  const prevFiltersRef = useRef(filtersKey)
  useEffect(() => {
    if (prevFiltersRef.current !== filtersKey) {
      prevFiltersRef.current = filtersKey
      performSearchDirect(query || '', 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey])

  // Debounced search when query changes
  useEffect(() => {
    if (!isConfigured) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      debounceRef.current = setTimeout(() => performSearchDirect('', 1), 200)
    } else {
      debounceRef.current = setTimeout(() => performSearchDirect(query, 1), 400)
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const handleLoadMore = useCallback(() => {
    performSearchDirect(query || 'trending', currentPage + 1)
  }, [performSearchDirect, query, currentPage])

  const isAlreadyImported = useCallback(
    (hitId: number) => existingAssets.some((a) => a.id.startsWith(`pixabay_img_${hitId}_`)),
    [existingAssets],
  )

  const handleImportImage = useCallback(
    async (hit: PixabayImageHit) => {
      addDownloadingId(hit.id)
      try {
        const service = getPixabayService()
        const blob = await service.downloadAsBlob(hit.largeImageURL)
        const url = URL.createObjectURL(blob)

        const name = hit.tags.split(',')[0]?.trim() || `pixabay-${hit.id}`
        const asset: MediaAsset = {
          id: `pixabay_img_${hit.id}_${Date.now()}`,
          name: `${name}.jpg`,
          type: 'image/jpeg',
          size: blob.size,
          category: 'images',
          url,
          width: hit.imageWidth,
          height: hit.imageHeight,
          addedAt: Date.now(),
        }

        addAsset(asset, blob)
        addToCanvas(asset.id)
      } catch (err) {
        console.error('Failed to import Pixabay image:', err)
      } finally {
        removeDownloadingId(hit.id)
      }
    },
    [addAsset, addToCanvas, addDownloadingId, removeDownloadingId],
  )

  if (!isConfigured) {
    return (
      <div className="p-3 bg-[#2a2a2a]/80 rounded-lg border border-[#3a3a3a] text-center space-y-2">
        <Image size={20} className="text-gray-600 mx-auto" />
        <p className="text-xs text-gray-400">Add your Pixabay API key to browse free stock images.</p>
        <a
          href="https://pixabay.com/api/docs/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-[#4a7eff] hover:underline"
        >
          Get API Key <ExternalLink size={10} />
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}

      {imageResults.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {imageResults.map((hit) => (
            <PixabayImageCard
              key={hit.id}
              hit={hit}
              isDownloading={downloadingIds.includes(hit.id)}
              isImported={isAlreadyImported(hit.id)}
              onImport={() => handleImportImage(hit)}
            />
          ))}
        </div>
      )}

      {!isLoading && query.trim() && imageResults.length === 0 && !error && (
        <div className="py-6 text-center">
          <p className="text-xs text-gray-500">No images found for &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {hasMore && !isLoading && (
        <button
          onClick={handleLoadMore}
          className="w-full py-2 px-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-colors"
        >
          Load More
        </button>
      )}

      {isLoading && imageResults.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-gray-500" />
        </div>
      )}

      {imageResults.length > 0 && (
        <div className="text-center pb-1">
          <a
            href="https://pixabay.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
          >
            Free images from Pixabay <ExternalLink size={9} />
          </a>
        </div>
      )}
    </div>
  )
}

// ── Pixabay Image Card ────────────────────────────────────────────────────

function PixabayImageCard({
  hit,
  isDownloading,
  isImported,
  onImport,
}: {
  hit: PixabayImageHit
  isDownloading: boolean
  isImported: boolean
  onImport: () => void
}) {
  return (
    <div
      className="relative rounded-lg overflow-hidden group cursor-pointer"
      onClick={() => !isDownloading && !isImported && onImport()}
    >
      <div className="aspect-[4/3] bg-[#1e1e1e] overflow-hidden">
        <img
          src={hit.previewURL}
          alt={hit.tags}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {isDownloading && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 z-10">
          <Loader2 size={16} className="animate-spin text-[#4a7eff]" />
          <span className="text-[10px] text-[#4a7eff]">Adding...</span>
        </div>
      )}

      {isImported && !isDownloading && (
        <div className="absolute top-1.5 right-1.5 p-0.5 rounded-full bg-green-500">
          <Check size={8} className="text-white" />
        </div>
      )}
    </div>
  )
}

// ── Pixabay Video Browser ─────────────────────────────────────────────────

function PixabayVideoBrowser({ externalQuery, filters }: { externalQuery: string; filters: VideoFilters }) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const query = usePixabayStore((s) => s.query)
  const isLoading = usePixabayStore((s) => s.isLoading)
  const error = usePixabayStore((s) => s.error)
  const videoResults = usePixabayStore((s) => s.videoResults)
  const currentPage = usePixabayStore((s) => s.currentPage)
  const hasMore = usePixabayStore((s) => s.hasMore)
  const downloadingIds = usePixabayStore((s) => s.downloadingIds)

  const setQuery = usePixabayStore((s) => s.setQuery)
  const setLoading = usePixabayStore((s) => s.setLoading)
  const setError = usePixabayStore((s) => s.setError)
  const setVideoResults = usePixabayStore((s) => s.setVideoResults)
  const appendVideoResults = usePixabayStore((s) => s.appendVideoResults)
  const addDownloadingId = usePixabayStore((s) => s.addDownloadingId)
  const removeDownloadingId = usePixabayStore((s) => s.removeDownloadingId)

  const assets = useMediaStore((s) => s.assets)
  const addAsset = useMediaStore((s) => s.addAsset)
  const addToCanvas = useMediaStore((s) => s.addToCanvas)

  const isConfigured = hasPixabayService()

  const performSearchDirect = useCallback(
    async (searchQuery: string, page: number = 1) => {
      if (!isConfigured) return
      setLoading(true)
      setError(null)
      try {
        const service = getPixabayService()
        const result = await service.searchVideos({
          q: searchQuery || 'trending',
          page,
          per_page: 20,
          video_type: filters.videoType !== 'all' ? filters.videoType : undefined,
          category: filters.category || undefined,
          order: filters.order,
          editors_choice: filters.editorsChoice || undefined,
        })
        if (page === 1) setVideoResults(result.hits, result.totalHits, page)
        else appendVideoResults(result.hits, result.totalHits, page)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed')
      } finally {
        setLoading(false)
      }
    },

    [isConfigured, setLoading, setError, setVideoResults, appendVideoResults, filters],
  )

  // Load trending on mount
  useEffect(() => {
    if (isConfigured && videoResults.length === 0) {
      performSearchDirect('', 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync external query
  useEffect(() => {
    if (externalQuery !== query) {
      setQuery(externalQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalQuery])

  // Re-search when filters change
  const filtersKey = JSON.stringify(filters)
  const prevFiltersRef = useRef(filtersKey)
  useEffect(() => {
    if (prevFiltersRef.current !== filtersKey) {
      prevFiltersRef.current = filtersKey
      performSearchDirect(query || '', 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey])

  // Debounced search
  useEffect(() => {
    if (!isConfigured) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      debounceRef.current = setTimeout(() => performSearchDirect('', 1), 200)
    } else {
      debounceRef.current = setTimeout(() => performSearchDirect(query, 1), 400)
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  const handleLoadMore = useCallback(() => {
    performSearchDirect(query || 'trending', currentPage + 1)
  }, [performSearchDirect, query, currentPage])

  const isAlreadyImported = useCallback(
    (hitId: number) => assets.some((a) => a.id.startsWith(`pixabay_vid_${hitId}_`)),
    [assets],
  )

  const handleImportVideo = useCallback(
    async (hit: PixabayVideoHit) => {
      addDownloadingId(hit.id)
      try {
        const service = getPixabayService()
        const videoUrl = hit.videos.medium?.url || hit.videos.small?.url || hit.videos.tiny?.url
        if (!videoUrl) throw new Error('No video URL available')

        const blob = await service.downloadAsBlob(videoUrl)
        const url = URL.createObjectURL(blob)

        const name = hit.tags.split(',')[0]?.trim() || `pixabay-${hit.id}`
        const videoSize = hit.videos.medium || hit.videos.small || hit.videos.tiny
        const asset: MediaAsset = {
          id: `pixabay_vid_${hit.id}_${Date.now()}`,
          name: `${name}.mp4`,
          type: 'video/mp4',
          size: blob.size,
          category: 'video',
          url,
          width: videoSize.width,
          height: videoSize.height,
          duration: hit.duration,
          addedAt: Date.now(),
        }

        addAsset(asset, blob)
        addToCanvas(asset.id)
      } catch (err) {
        console.error('Failed to import Pixabay video:', err)
      } finally {
        removeDownloadingId(hit.id)
      }
    },
    [addAsset, addToCanvas, addDownloadingId, removeDownloadingId],
  )

  if (!isConfigured) {
    return (
      <div className="p-3 bg-[#2a2a2a]/80 rounded-lg border border-[#3a3a3a] text-center space-y-2">
        <Film size={20} className="text-gray-600 mx-auto" />
        <p className="text-xs text-gray-400">Add your Pixabay API key to browse free stock videos.</p>
        <a
          href="https://pixabay.com/api/docs/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] text-[#4a7eff] hover:underline"
        >
          Get API Key <ExternalLink size={10} />
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <span className="text-xs text-red-400">{error}</span>
        </div>
      )}

      {videoResults.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5">
          {videoResults.map((hit) => (
            <PixabayVideoCard
              key={hit.id}
              hit={hit}
              isDownloading={downloadingIds.includes(hit.id)}
              isImported={isAlreadyImported(hit.id)}
              onImport={() => handleImportVideo(hit)}
            />
          ))}
        </div>
      )}

      {!isLoading && query.trim() && videoResults.length === 0 && !error && (
        <div className="py-6 text-center">
          <p className="text-xs text-gray-500">No videos found for &ldquo;{query}&rdquo;</p>
        </div>
      )}

      {hasMore && !isLoading && (
        <button
          onClick={handleLoadMore}
          className="w-full py-2 px-3 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg text-xs text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-colors"
        >
          Load More
        </button>
      )}

      {isLoading && videoResults.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-gray-500" />
        </div>
      )}

      {videoResults.length > 0 && (
        <div className="text-center pb-1">
          <a
            href="https://pixabay.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors"
          >
            Free videos from Pixabay <ExternalLink size={9} />
          </a>
        </div>
      )}
    </div>
  )
}

// ── Pixabay Video Card ────────────────────────────────────────────────────

function PixabayVideoCard({
  hit,
  isDownloading,
  isImported,
  onImport,
}: {
  hit: PixabayVideoHit
  isDownloading: boolean
  isImported: boolean
  onImport: () => void
}) {
  const thumbnail = hit.videos.tiny?.thumbnail || hit.videos.small?.thumbnail || ''

  return (
    <div
      className="relative rounded-lg overflow-hidden group cursor-pointer"
      onClick={() => !isDownloading && !isImported && onImport()}
    >
      <div className="aspect-video bg-[#1e1e1e] overflow-hidden">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={hit.tags}
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film size={24} className="text-gray-600" />
          </div>
        )}
      </div>

      <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 rounded text-[9px] text-white font-mono">
        {formatDuration(hit.duration)}
      </div>

      {isDownloading && (
        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 z-10">
          <Loader2 size={16} className="animate-spin text-[#4a7eff]" />
          <span className="text-[10px] text-[#4a7eff]">Adding...</span>
        </div>
      )}

      {isImported && !isDownloading && (
        <div className="absolute top-1.5 right-1.5 p-0.5 rounded-full bg-green-500">
          <Check size={8} className="text-white" />
        </div>
      )}
    </div>
  )
}

// ── Uploaded Images Section ───────────────────────────────────────────────

function UploadedImagesSection() {
  const assets = useMediaStore((s) => s.assets)
  const selectedAssetId = useMediaStore((s) => s.selectedAssetId)
  const canvasItems = useMediaStore((s) => s.canvasItems)
  const addAsset = useMediaStore((s) => s.addAsset)
  const updateAsset = useMediaStore((s) => s.updateAsset)
  const removeAsset = useMediaStore((s) => s.removeAsset)
  const setSelectedAssetId = useMediaStore((s) => s.setSelectedAssetId)
  const addToCanvas = useMediaStore((s) => s.addToCanvas)
  const removeFromCanvas = useMediaStore((s) => s.removeFromCanvas)

  const {
    progress: bgProgress,
    simulatedProgress: bgSimulated,
    error: bgError,
    removeBackground: removeBg,
  } = useBackgroundRemoval()
  const [bgProcessingAssetId, setBgProcessingAssetId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleRemoveBackground = useCallback(
    async (assetId: string) => {
      setBgProcessingAssetId(assetId)
      const newAssetId = await removeBg(assetId)
      setBgProcessingAssetId(null)
      if (newAssetId) setSelectedAssetId(newAssetId)
    },
    [removeBg, setSelectedAssetId],
  )

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      Array.from(files).forEach((file) => {
        const category = getCategoryFromType(file.type)
        if (category !== 'images') return

        const url = URL.createObjectURL(file)
        const asset: MediaAsset = {
          id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          category,
          url,
          addedAt: Date.now(),
        }

        const img = new window.Image()
        img.onload = () => {
          updateAsset(asset.id, { width: img.naturalWidth, height: img.naturalHeight })
        }
        img.src = url
        addAsset(asset, file)
      })
    },
    [addAsset, updateAsset],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files)
        e.target.value = ''
      }
    },
    [addFiles],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
    },
    [addFiles],
  )

  const handleAssetDragStart = useCallback((e: React.DragEvent, asset: MediaAsset) => {
    e.dataTransfer.setData('application/x-media-asset', JSON.stringify({ id: asset.id, type: 'media' }))
    e.dataTransfer.effectAllowed = 'copy'
  }, [])

  const uploadedImages = assets.filter((a) => a.category === 'images')
  const selectedAsset = assets.find((a) => a.id === selectedAssetId)
  const isOnCanvas = selectedAsset ? canvasItems.some((c) => c.assetId === selectedAsset.id) : false

  return (
    <div className="space-y-3">
      {/* Upload button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-2 px-3 border border-dashed border-white/10 rounded-lg text-xs text-gray-400 hover:text-white hover:border-white/20 transition-colors flex items-center justify-center gap-1.5"
      >
        <Upload size={14} />
        Upload Images
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.gif,.svg"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Drop zone / grid */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="rounded-lg border-2 border-dashed transition-colors border-white/5 bg-transparent"
      >
        {uploadedImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Upload size={32} className="text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 mb-1">No images uploaded yet</p>
            <p className="text-xs text-gray-600">Drag & drop image files here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-2">
            {uploadedImages.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                isSelected={selectedAssetId === asset.id}
                isRemovingBg={bgProcessingAssetId === asset.id}
                onSelect={() => setSelectedAssetId(asset.id)}
                onRemove={() => removeAsset(asset.id)}
                onAddToCanvas={() => addToCanvas(asset.id)}
                onRemoveBackground={asset.category === 'images' ? () => handleRemoveBackground(asset.id) : undefined}
                onDragStart={(e) => handleAssetDragStart(e, asset)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected Asset Info */}
      {selectedAsset && (
        <div className="space-y-2 p-3 bg-[#2a2a2a]/80 rounded-lg border border-[#3a3a3a]">
          <div className="flex items-center gap-2">
            <Info size={14} className="text-gray-500" />
            <span className="text-xs text-gray-500 uppercase tracking-wide">File Info</span>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Name</span>
              <span className="text-gray-300 truncate ml-2 max-w-[160px]">{selectedAsset.name}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Size</span>
              <span className="text-gray-300">{formatFileSize(selectedAsset.size)}</span>
            </div>
            {selectedAsset.width && selectedAsset.height && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Dimensions</span>
                <span className="text-gray-300">
                  {selectedAsset.width} x {selectedAsset.height}
                </span>
              </div>
            )}
          </div>

          {/* BG Removal Progress */}
          {bgProcessingAssetId === selectedAsset.id && (
            <div className="space-y-1.5 p-2 bg-[#4a7eff]/10 border border-[#4a7eff]/30 rounded-lg">
              <div className="flex items-center gap-2">
                {bgSimulated.isDone ? (
                  <Check size={12} className="text-[#4a7eff]" />
                ) : (
                  <Loader2 size={12} className="animate-spin text-[#4a7eff]" />
                )}
                <span className="text-xs text-[#4a7eff]">
                  {bgSimulated.isDone
                    ? 'Done!'
                    : bgProgress?.phase === 'downloading'
                      ? `Downloading model... ${Math.round((bgProgress.progress || 0) * 100)}%`
                      : `Removing background... ${Math.round(bgSimulated.isActive ? bgSimulated.value : 0)}%`}
                </span>
              </div>
              <div className="h-1 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 bg-[#4a7eff]"
                  style={{
                    width:
                      bgProgress?.phase === 'downloading'
                        ? `${Math.round((bgProgress.progress || 0) * 100)}%`
                        : `${Math.round(bgSimulated.isActive ? bgSimulated.value : 0)}%`,
                  }}
                />
              </div>
            </div>
          )}
          {bgError && bgProcessingAssetId === null && selectedAsset.id === selectedAssetId && (
            <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
              <span className="text-xs text-red-400">{bgError}</span>
            </div>
          )}

          {/* Canvas actions */}
          {selectedAsset.category === 'images' && (
            <div className="pt-2 border-t border-[#3a3a3a]">
              {isOnCanvas ? (
                <button
                  onClick={() => {
                    const item = canvasItems.find((c) => c.assetId === selectedAsset.id)
                    if (item) removeFromCanvas(item.id)
                  }}
                  className="w-full py-1.5 px-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-xs hover:bg-red-500/30 transition-colors flex items-center justify-center gap-1.5"
                >
                  <X size={12} />
                  Remove from Canvas
                </button>
              ) : (
                <button
                  onClick={() => addToCanvas(selectedAsset.id)}
                  className="w-full py-1.5 px-3 bg-[#4a7eff]/10 border border-[#4a7eff]/30 rounded-lg text-[#4a7eff] text-xs hover:bg-[#4a7eff]/20 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={12} />
                  Add to Canvas
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Uploaded Videos Section ───────────────────────────────────────────────

function UploadedVideosSection() {
  const assets = useMediaStore((s) => s.assets)
  const addAsset = useMediaStore((s) => s.addAsset)
  const updateAsset = useMediaStore((s) => s.updateAsset)
  const addToCanvas = useMediaStore((s) => s.addToCanvas)
  const removeAsset = useMediaStore((s) => s.removeAsset)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadedVideos = assets.filter((a) => a.category === 'video')

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        Array.from(e.target.files).forEach((file) => {
          if (!file.type.startsWith('video/')) return
          const url = URL.createObjectURL(file)
          const asset: MediaAsset = {
            id: `media_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            type: file.type,
            size: file.size,
            category: 'video',
            url,
            addedAt: Date.now(),
          }
          const vid = document.createElement('video')
          vid.preload = 'metadata'
          vid.onloadedmetadata = () => {
            updateAsset(asset.id, {
              width: vid.videoWidth,
              height: vid.videoHeight,
              duration: vid.duration,
            })
            URL.revokeObjectURL(vid.src)
          }
          vid.src = URL.createObjectURL(file)
          addAsset(asset, file)
        })
        e.target.value = ''
      }
    },
    [addAsset, updateAsset],
  )

  return (
    <div className="space-y-3">
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-2 px-3 border border-dashed border-white/10 rounded-lg text-xs text-gray-400 hover:text-white hover:border-white/20 transition-colors flex items-center justify-center gap-1.5"
      >
        <Upload size={14} />
        Upload Videos
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp4,.webm"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {uploadedVideos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Upload size={32} className="text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 mb-1">No videos uploaded yet</p>
          <p className="text-xs text-gray-600">Supports MP4, WebM</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {uploadedVideos.map((asset) => (
            <div
              key={asset.id}
              className="relative rounded-lg overflow-hidden group cursor-pointer border border-[#3a3a3a] bg-[#2a2a2a]"
              onClick={() => addToCanvas(asset.id)}
            >
              <div className="aspect-video bg-[#1e1e1e] flex items-center justify-center overflow-hidden">
                <Film size={24} className="text-gray-600" />
              </div>
              {asset.duration != null && (
                <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 rounded text-[9px] text-white font-mono">
                  {formatDuration(Math.round(asset.duration))}
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    addToCanvas(asset.id)
                  }}
                  className="p-1.5 rounded bg-[#4a7eff] text-white hover:bg-[#5a8aff] transition-colors"
                  title="Add to canvas"
                >
                  <Plus size={12} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeAsset(asset.id)
                  }}
                  className="p-1.5 rounded bg-[#3a3a3a] text-gray-300 hover:text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              <div className="p-1.5">
                <div className="text-xs font-medium text-white truncate">{asset.name}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── SFX Result Item ───────────────────────────────────────────────────────

function SFXResultItem({
  hit,
  isPlaying,
  isAdding,
  onPreview,
  onStopPreview,
  onAdd,
}: {
  hit: FreesoundHit
  isPlaying: boolean
  isAdding: boolean
  onPreview: () => void
  onStopPreview: () => void
  onAdd: () => void
}) {
  return (
    <div className="flex items-center gap-2 p-2 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors group">
      <button
        onClick={isPlaying ? onStopPreview : onPreview}
        className={cn(
          'w-7 h-7 shrink-0 rounded-full flex items-center justify-center transition-colors',
          isPlaying ? 'bg-green-500/20 text-green-400' : 'bg-zinc-700 text-zinc-400 hover:text-zinc-200',
        )}
      >
        {isPlaying ? <VolumeX size={12} /> : <Volume2 size={12} />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="text-xs text-zinc-200 truncate">{hit.name}</div>
        <div className="flex items-center gap-2 text-[10px] text-zinc-500">
          <span className="flex items-center gap-0.5">
            <Clock size={9} />
            {hit.duration.toFixed(1)}s
          </span>
          <span className="truncate">{hit.username}</span>
        </div>
      </div>

      <button
        onClick={onAdd}
        disabled={isAdding}
        className={cn(
          'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors',
          isAdding
            ? 'bg-zinc-700 text-zinc-500'
            : 'bg-zinc-700 text-zinc-400 hover:bg-green-500/20 hover:text-green-400 opacity-0 group-hover:opacity-100',
        )}
      >
        {isAdding ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
      </button>
    </div>
  )
}

// ── Asset Card ────────────────────────────────────────────────────────────

interface AssetCardProps {
  asset: MediaAsset
  isSelected: boolean
  isRemovingBg?: boolean
  onSelect: () => void
  onRemove: () => void
  onAddToCanvas: () => void
  onRemoveBackground?: () => void
  onDragStart: (e: React.DragEvent) => void
}

function AssetCard({
  asset,
  isSelected,
  isRemovingBg,
  onSelect,
  onRemove,
  onAddToCanvas,
  onRemoveBackground,
  onDragStart,
}: AssetCardProps) {
  const CategoryIcon = getCategoryIcon(asset.category)

  return (
    <div
      onClick={onSelect}
      draggable
      onDragStart={onDragStart}
      className={cn(
        'relative rounded-lg border overflow-hidden cursor-pointer transition-all group',
        isSelected ? 'border-[#4a7eff] bg-[#4a7eff]/10' : 'border-[#3a3a3a] bg-[#2a2a2a] hover:border-[#3a3a3a]',
        'cursor-grab active:cursor-grabbing',
      )}
    >
      <div className="aspect-video bg-[#1e1e1e] flex items-center justify-center overflow-hidden relative">
        {asset.category === 'images' ? (
          <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
        ) : (
          <CategoryIcon size={24} className="text-gray-600" />
        )}

        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAddToCanvas()
            }}
            className="p-1.5 rounded bg-[#4a7eff] text-white hover:bg-[#4a7eff] transition-colors"
            title="Add to canvas"
          >
            <Plus size={12} />
          </button>
          {onRemoveBackground && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemoveBackground()
              }}
              className="p-1.5 rounded bg-[#4a7eff] text-white hover:bg-[#5a8aff] transition-colors"
              title="Remove background"
            >
              <Eraser size={12} />
            </button>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="p-1.5 rounded bg-[#3a3a3a] text-gray-300 hover:text-red-400 hover:bg-red-500/20 transition-colors"
            title="Delete"
          >
            <Trash2 size={12} />
          </button>
        </div>

        {isRemovingBg && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-1 z-10">
            <Loader2 size={16} className="animate-spin text-[#4a7eff]" />
            <span className="text-[10px] text-[#4a7eff]">Removing BG...</span>
          </div>
        )}
      </div>

      <div className="p-1.5">
        <div className="text-xs font-medium text-white truncate">{asset.name}</div>
        <div className="text-[10px] text-gray-500">{formatFileSize(asset.size)}</div>
      </div>
    </div>
  )
}
