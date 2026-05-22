import { useState, useRef, useMemo, useCallback } from 'react'
import {
  Search,
  SlidersHorizontal,
  Package,
  Plus,
  X,
  ArrowLeft,
  Upload,
  Check,
  Square,
  Box,
  Grid3x3,
  UserCircle,
  User,
  Loader2,
  LayoutGrid,
  Rows3,
  RectangleHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useEditorStore } from '@/stores'
import { useBundleStore, type CharacterRef, type CharacterBundle } from '@/stores/useBundleStore'
import { generateBundleThumbnail, composeBundleBanner } from '@/services/nanoBanana2'
import { useSavedCharactersStore, type SavedCharacter } from '@/stores/useSavedCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useSavedPixelArtCharactersStore } from '@/stores/useSavedPixelArtCharactersStore'
import { useSavedAvatarCharactersStore } from '@/stores/useSavedAvatarCharactersStore'
import type { Saved3DCharacter } from '@/types/character3d'
import type { SavedPixelArtCharacter } from '@/types/pixelLab'
import type { SavedAvatarCharacter } from '@/types/avatar'

// ── Shared constants ──

type CharacterType = '2d' | '3d' | '1d' | 'avatar'

const TYPE_BADGE: Record<CharacterType, { label: string; color: string }> = {
  '2d': { label: '2D', color: 'bg-green-500/20 text-green-400' },
  '3d': { label: '3D', color: 'bg-blue-500/20 text-blue-400' },
  '1d': { label: '1D', color: 'bg-purple-500/20 text-purple-400' },
  avatar: { label: 'AV', color: 'bg-orange-500/20 text-orange-400' },
}

const TYPE_FILTERS: { id: CharacterType; label: string }[] = [
  { id: '2d', label: '2D' },
  { id: '3d', label: '3D' },
  { id: '1d', label: '1D' },
  { id: 'avatar', label: 'AV' },
]

// ── Thumbnail helpers ──

interface UnifiedCharacter {
  id: string
  name: string
  type: CharacterType
  createdAt: number
  raw2D?: SavedCharacter
  raw3D?: Saved3DCharacter
  raw1D?: SavedPixelArtCharacter
  rawAvatar?: SavedAvatarCharacter
}

const isValidSrc = (url: string | null | undefined): url is string =>
  !!url &&
  url.length > 300 &&
  (url.startsWith('http') || url.startsWith('blob:') || (url.startsWith('data:image/') && url.includes(';base64,')))

function get2DThumbnail(char: SavedCharacter): string | null {
  if (isValidSrc(char.referenceImage)) return char.referenceImage
  if (char.bodyParts) {
    const sel = char.selectedSprites
    const bodyIdx = sel?.body ?? 0
    const eyeIdx = sel?.eye ?? 0
    const candidates = [
      char.bodyParts.body?.[bodyIdx],
      char.bodyParts.body?.[0],
      char.bodyParts.eye?.[eyeIdx],
      char.bodyParts.eye?.[0],
      char.bodyParts.hair?.[0],
    ]
    for (const c of candidates) {
      if (isValidSrc(c)) return c
    }
  }
  if (char._thumbnail && char._thumbnail.startsWith('data:image/')) return char._thumbnail
  return null
}

/** Resolve a single character's thumbnail URL from the appropriate store data */
function resolveCharacterThumbnail(
  ref: CharacterRef,
  chars2D: SavedCharacter[],
  chars3D: Saved3DCharacter[],
  chars1D: SavedPixelArtCharacter[],
  charsAV: SavedAvatarCharacter[],
  blobUrlsAV: Record<string, string>,
): string | null {
  if (ref.type === '2d') {
    const c = chars2D.find((ch) => ch.id === ref.id)
    if (c) return get2DThumbnail(c)
  }
  if (ref.type === '3d') {
    const c = chars3D.find((ch) => ch.id === ref.id)
    if (c?.thumbnailDataUrl) return c.thumbnailDataUrl
  }
  if (ref.type === '1d') {
    const c = chars1D.find((ch) => ch.id === ref.id)
    if (c?.thumbnailDataUrl) return c.thumbnailDataUrl
  }
  if (ref.type === 'avatar') {
    const c = charsAV.find((ch) => ch.id === ref.id)
    if (c) return blobUrlsAV[c.baseBlobId] || c.thumbnailDataUrl || null
  }
  return null
}

/** Resolve a character's name from the stores */
function resolveCharacterName(
  ref: CharacterRef,
  chars2D: SavedCharacter[],
  chars3D: Saved3DCharacter[],
  chars1D: SavedPixelArtCharacter[],
  charsAV: SavedAvatarCharacter[],
): string {
  if (ref.type === '2d') return chars2D.find((c) => c.id === ref.id)?.name ?? 'Unknown'
  if (ref.type === '3d') return chars3D.find((c) => c.id === ref.id)?.name ?? 'Unknown'
  if (ref.type === '1d') return chars1D.find((c) => c.id === ref.id)?.name ?? 'Unknown'
  if (ref.type === 'avatar') return charsAV.find((c) => c.id === ref.id)?.name ?? 'Unknown'
  return 'Unknown'
}

// ── Main Component ──

export default function BundlesPanel() {
  const [view, setView] = useState<'list' | 'create'>('list')

  return view === 'list' ? (
    <BundleListView onCreateClick={() => setView('create')} />
  ) : (
    <BundleCreateView onBack={() => setView('list')} />
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ── LIST VIEW ──
// ═══════════════════════════════════════════════════════════════════════

function BundleListView({ onCreateClick }: { onCreateClick: () => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeTypes, setActiveTypes] = useState<Set<CharacterType>>(new Set(['2d', '3d', '1d', 'avatar']))
  const [layout, setLayout] = useState<'grid' | 'list' | 'wide'>('grid')

  const bundles = useBundleStore((s) => s.bundles)
  const selectBundle = useBundleStore((s) => s.selectBundle)
  const selectedBundleId = useBundleStore((s) => s.selectedBundleId)

  const hasActiveFilter = activeTypes.size < 4

  const filteredBundles = useMemo(() => {
    let result = [...bundles]

    // Type filter: show bundles that contain at least one character of the active types
    if (hasActiveFilter) {
      result = result.filter((b) => b.characters.some((c) => activeTypes.has(c.type)))
    }

    // Search
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      result = result.filter((b) => b.name.toLowerCase().includes(q) || b.description.toLowerCase().includes(q))
    }

    // Newest first
    result.sort((a, b) => b.createdAt - a.createdAt)
    return result
  }, [bundles, activeTypes, searchQuery, hasActiveFilter])

  const toggleType = useCallback((type: CharacterType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        if (next.size > 1) next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Search + Filter Icon ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bundles..."
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-green-500/30 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
              filtersOpen ? 'bg-green-500/20 text-green-400' : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#2a2a2a]',
            )}
          >
            <SlidersHorizontal size={14} />
            {hasActiveFilter && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500" />}
          </button>
        </div>
      </div>

      {/* ── Filter Section (shown when filter icon toggled) ── */}
      {filtersOpen && (
        <div className="shrink-0 px-3 pb-2 space-y-2">
          <div>
            <span className="text-[9px] text-gray-600 uppercase tracking-wider mb-1 block">Type</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTypes(new Set(['2d', '3d', '1d', 'avatar']))}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border',
                  activeTypes.size === 4
                    ? 'bg-white text-black border-white/20'
                    : 'bg-transparent text-gray-500 border-white/5 hover:text-white hover:bg-[#2a2a2a]',
                )}
              >
                All
              </button>
              {TYPE_FILTERS.map((tf) => {
                const isActive = activeTypes.has(tf.id) && activeTypes.size < 4
                return (
                  <button
                    key={tf.id}
                    onClick={() => {
                      if (activeTypes.size < 4 && activeTypes.has(tf.id) && activeTypes.size === 1) {
                        setActiveTypes(new Set(['2d', '3d', '1d', 'avatar']))
                      } else if (activeTypes.size === 4) {
                        setActiveTypes(new Set([tf.id]))
                      } else {
                        toggleType(tf.id)
                      }
                    }}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border',
                      isActive
                        ? 'bg-white text-black border-white/20'
                        : 'bg-transparent text-gray-500 border-white/5 hover:text-white hover:bg-[#2a2a2a]',
                    )}
                  >
                    {tf.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <span className="text-[9px] text-gray-600 uppercase tracking-wider mb-1 block">Layout</span>
            <div className="flex items-center gap-1">
              {[
                { id: 'grid' as const, icon: LayoutGrid },
                { id: 'list' as const, icon: Rows3 },
                { id: 'wide' as const, icon: RectangleHorizontal },
              ].map(({ id, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setLayout(id)}
                  className={cn(
                    'w-7 h-7 rounded-md flex items-center justify-center transition-colors border',
                    layout === id
                      ? 'bg-white text-black border-white/20'
                      : 'bg-transparent text-gray-500 border-white/5 hover:text-white hover:bg-[#2a2a2a]',
                  )}
                >
                  <Icon size={13} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {filteredBundles.length > 0 ? (
          <div className={cn('grid gap-2', layout === 'grid' ? 'grid-cols-2' : 'grid-cols-1')}>
            {filteredBundles.map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                selected={selectedBundleId === bundle.id}
                layout={layout}
                onSelect={() => {
                  selectBundle(bundle.id)
                  useEditorStore.getState().setRightPanelTab('bundle-details')
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-panel-surface flex items-center justify-center mb-4">
              <Package size={24} className="text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-400 mb-1">
              {bundles.length === 0 ? 'No bundles yet' : 'No bundles found'}
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {bundles.length === 0
                ? 'Bundles are collections of characters ready to use together in a scene.'
                : 'Try a different search or filter.'}
            </p>
          </div>
        )}
      </div>

      {/* ── Create button (sticky bottom) ── */}
      <div className="shrink-0 px-3 py-3 border-t border-white/5">
        <button
          onClick={onCreateClick}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Create Bundle
        </button>
      </div>
    </div>
  )
}

// ── Bundle Card ──

function BundleCard({
  bundle,
  selected,
  layout,
  onSelect,
}: {
  bundle: CharacterBundle
  selected: boolean
  layout: 'grid' | 'list' | 'wide'
  onSelect: () => void
}) {
  const uniqueTypes = useMemo(() => {
    const types = new Set(bundle.characters.map((c) => c.type))
    return Array.from(types)
  }, [bundle.characters])

  return (
    <div
      className={cn(
        'relative group rounded-lg border overflow-hidden transition-all cursor-pointer',
        selected ? 'border-accent/40' : 'border-white/5 hover:border-panel-border',
      )}
      onClick={onSelect}
    >
      <div className={cn('bg-panel-bg overflow-hidden relative', layout === 'wide' ? 'aspect-video' : 'aspect-square')}>
        {(layout === 'wide' ? bundle.banner || bundle.thumbnail : bundle.thumbnail || bundle.banner) ? (
          <img
            src={layout === 'wide' ? (bundle.banner || bundle.thumbnail)! : (bundle.thumbnail || bundle.banner)!}
            alt={bundle.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-panel-surface-hover to-panel-surface flex flex-col items-center justify-center gap-1">
            <Package size={24} className="text-gray-500/40" />
          </div>
        )}

        {/* Pills — top right */}
        <div className="absolute top-1.5 right-1.5 flex items-center gap-1 z-10">
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm text-gray-300 font-medium">
            {bundle.characters.length}
          </span>
          {uniqueTypes.map((t) => {
            const badge = TYPE_BADGE[t]
            return (
              <span
                key={t}
                className={cn('text-[9px] px-1.5 py-0.5 rounded font-medium backdrop-blur-sm', badge.color)}
              >
                {badge.label}
              </span>
            )
          })}
        </div>

        {/* Bottom-left corner gradient — intensifies on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-90 transition-opacity pointer-events-none z-[5]" />

        {/* Bundle title — bottom left */}
        <p className="absolute bottom-2 left-2.5 text-[11px] font-semibold text-white truncate z-10 drop-shadow-lg max-w-[80%]">
          {bundle.name}
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════
// ── CREATE VIEW ──
// ═══════════════════════════════════════════════════════════════════════

function BundleCreateView({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnail, setThumbnail] = useState<string | undefined>(undefined)
  const [selectedChars, setSelectedChars] = useState<CharacterRef[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeTypes, setActiveTypes] = useState<Set<CharacterType>>(new Set(['2d', '3d', '1d', 'avatar']))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addBundle = useBundleStore((s) => s.addBundle)

  // Character stores
  const chars2D = useSavedCharactersStore((s) => s.characters)
  const chars3D = useSaved3DCharactersStore((s) => s.characters)
  const chars1D = useSavedPixelArtCharactersStore((s) => s.characters)
  const charsAV = useSavedAvatarCharactersStore((s) => s.characters)
  const blobUrlsAV = useSavedAvatarCharactersStore((s) => s.blobUrls)

  const hasActiveFilter = activeTypes.size < 4

  // Build unified list of all characters
  const allCharacters = useMemo<UnifiedCharacter[]>(() => {
    const list: UnifiedCharacter[] = []
    for (const c of chars2D) list.push({ id: c.id, name: c.name, type: '2d', createdAt: c.createdAt, raw2D: c })
    for (const c of chars3D) list.push({ id: c.id, name: c.name, type: '3d', createdAt: c.createdAt, raw3D: c })
    for (const c of chars1D) list.push({ id: c.id, name: c.name, type: '1d', createdAt: c.createdAt, raw1D: c })
    for (const c of charsAV) list.push({ id: c.id, name: c.name, type: 'avatar', createdAt: c.createdAt, rawAvatar: c })
    list.sort((a, b) => b.createdAt - a.createdAt)
    return list
  }, [chars2D, chars3D, chars1D, charsAV])

  // Filter and search
  const filteredCharacters = useMemo(() => {
    let result = allCharacters
    if (hasActiveFilter) {
      result = result.filter((c) => activeTypes.has(c.type))
    }
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      result = result.filter((c) => c.name.toLowerCase().includes(q))
    }
    return result
  }, [allCharacters, activeTypes, searchQuery, hasActiveFilter])

  const selectedIds = useMemo(() => new Set(selectedChars.map((c) => c.id)), [selectedChars])

  const toggleType = useCallback((type: CharacterType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        if (next.size > 1) next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  const toggleCharacter = useCallback((uc: UnifiedCharacter) => {
    setSelectedChars((prev) => {
      const exists = prev.some((c) => c.id === uc.id)
      if (exists) return prev.filter((c) => c.id !== uc.id)
      return [...prev, { id: uc.id, type: uc.type }]
    })
  }, [])

  const removeSelectedChar = useCallback((id: string) => {
    setSelectedChars((prev) => prev.filter((c) => c.id !== id))
  }, [])

  // Thumbnail upload
  const handleThumbnailUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setThumbnail(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const canSave = name.trim().length > 0 && selectedChars.length > 0
  const [generating, setGenerating] = useState(false)

  const handleSave = useCallback(async () => {
    if (!canSave || generating) return
    setGenerating(true)

    let thumbUrl = thumbnail // use manual upload if provided
    let bannerUrl: string | undefined

    // Auto-generate both covers in parallel
    if (!thumbUrl) {
      try {
        const charImages: string[] = []
        for (const ref of selectedChars.slice(0, 6)) {
          const url = resolveCharacterThumbnail(ref, chars2D, chars3D, chars1D, charsAV, blobUrlsAV)
          if (url) charImages.push(url)
        }
        if (charImages.length > 0) {
          const [thumb, banner] = await Promise.allSettled([
            generateBundleThumbnail(charImages, name.trim()),
            composeBundleBanner(charImages),
          ])
          if (thumb.status === 'fulfilled') thumbUrl = thumb.value
          if (banner.status === 'fulfilled') bannerUrl = banner.value
        }
      } catch (err) {
        console.warn('Bundle cover generation failed, saving without:', err)
      }
    }

    addBundle({
      name: name.trim(),
      description: description.trim(),
      thumbnail: thumbUrl,
      banner: bannerUrl,
      characters: selectedChars,
    })
    setGenerating(false)
    onBack()
  }, [
    canSave,
    generating,
    name,
    description,
    thumbnail,
    selectedChars,
    chars2D,
    chars3D,
    chars1D,
    charsAV,
    blobUrlsAV,
    addBundle,
    onBack,
  ])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="shrink-0 px-3 py-2.5 flex items-center gap-2 border-b border-white/5">
        <button
          onClick={onBack}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-200 hover:bg-panel-surface transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <span className="text-sm font-medium text-gray-200">New Bundle</span>
      </div>

      {/* ── Scrollable form ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-3 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Comedy Duo"
              className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A short note about this bundle..."
              rows={2}
              className="w-full px-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none resize-none"
            />
          </div>

          {/* Thumbnail upload */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Thumbnail (optional)</label>
            <div className="flex items-start gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'w-16 h-16 rounded-lg border border-dashed flex items-center justify-center overflow-hidden shrink-0 transition-colors',
                  thumbnail ? 'border-accent/30' : 'border-white/10 hover:border-white/20',
                )}
              >
                {thumbnail ? (
                  <img src={thumbnail} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <Upload size={18} className="text-gray-600" />
                )}
              </button>
              {thumbnail && (
                <button
                  onClick={() => setThumbnail(undefined)}
                  className="text-[10px] text-gray-500 hover:text-red-400 transition-colors mt-1"
                >
                  Remove
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleThumbnailUpload}
              />
            </div>
          </div>

          {/* ── Selected characters strip ── */}
          {selectedChars.length > 0 && (
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1.5">
                Selected ({selectedChars.length})
              </label>
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {selectedChars.map((ref) => {
                  const name = resolveCharacterName(ref, chars2D, chars3D, chars1D, charsAV)
                  const thumb = resolveCharacterThumbnail(ref, chars2D, chars3D, chars1D, charsAV, blobUrlsAV)
                  return (
                    <div key={ref.id} className="relative shrink-0 group/selected">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-panel-surface border border-white/5 flex items-center justify-center">
                        {thumb ? (
                          <img src={thumb} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={14} className="text-gray-600" />
                        )}
                      </div>
                      <button
                        onClick={() => removeSelectedChar(ref.id)}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center opacity-0 group-hover/selected:opacity-100 transition-opacity"
                      >
                        <X size={8} className="text-white" />
                      </button>
                      <p className="text-[8px] text-gray-500 text-center truncate w-12 mt-0.5">{name}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Add Characters section ── */}
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1.5">Add Characters</label>

            {/* Search + Filter */}
            <div className="flex items-center gap-1.5 mb-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search characters..."
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-800 rounded-lg text-xs text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-green-500/30 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={cn(
                  'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors relative',
                  filtersOpen
                    ? 'bg-green-500/20 text-green-400'
                    : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#2a2a2a]',
                )}
              >
                <SlidersHorizontal size={12} />
                {hasActiveFilter && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-green-500" />
                )}
              </button>
            </div>
            {filtersOpen && (
              <div className="flex items-center gap-1.5 mb-2">
                <button
                  onClick={() => setActiveTypes(new Set(['2d', '3d', '1d', 'avatar']))}
                  className={cn(
                    'px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors border',
                    activeTypes.size === 4
                      ? 'bg-white text-black border-white/20'
                      : 'bg-transparent text-gray-500 border-white/5 hover:text-white hover:bg-[#2a2a2a]',
                  )}
                >
                  All
                </button>
                {TYPE_FILTERS.map((tf) => {
                  const isActive = activeTypes.has(tf.id) && activeTypes.size < 4
                  return (
                    <button
                      key={tf.id}
                      onClick={() => {
                        if (activeTypes.size < 4 && activeTypes.has(tf.id) && activeTypes.size === 1) {
                          setActiveTypes(new Set(['2d', '3d', '1d', 'avatar']))
                        } else if (activeTypes.size === 4) {
                          setActiveTypes(new Set([tf.id]))
                        } else {
                          toggleType(tf.id)
                        }
                      }}
                      className={cn(
                        'px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors border',
                        isActive
                          ? 'bg-white text-black border-white/20'
                          : 'bg-transparent text-gray-500 border-white/5 hover:text-white hover:bg-[#2a2a2a]',
                      )}
                    >
                      {tf.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Character grid */}
            {filteredCharacters.length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5">
                {filteredCharacters.map((uc) => {
                  const isInBundle = selectedIds.has(uc.id)
                  return (
                    <CharacterPickerCard
                      key={`${uc.type}-${uc.id}`}
                      character={uc}
                      selected={isInBundle}
                      onClick={() => toggleCharacter(uc)}
                      blobUrlsAV={blobUrlsAV}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-gray-600">
                <User size={24} className="mb-2" />
                <span className="text-xs text-gray-500">
                  {allCharacters.length === 0 ? 'No characters yet' : 'No characters found'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Save button (sticky bottom) ── */}
      <div className="shrink-0 px-3 py-3 border-t border-white/5">
        <button
          onClick={handleSave}
          disabled={!canSave || generating}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
            canSave && !generating
              ? 'bg-accent hover:bg-accent/90 text-white'
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed',
          )}
        >
          {generating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating Cover...
            </>
          ) : (
            <>
              <Package size={16} />
              Save Bundle
            </>
          )}
        </button>
      </div>
    </div>
  )
}

// ── Character picker card (used in create view) ──

function CharacterPickerCard({
  character: uc,
  selected,
  onClick,
  blobUrlsAV,
}: {
  character: UnifiedCharacter
  selected: boolean
  onClick: () => void
  blobUrlsAV: Record<string, string>
}) {
  const badge = TYPE_BADGE[uc.type]

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative group cursor-pointer rounded-lg border overflow-hidden transition-all',
        selected ? 'border-accent ring-2 ring-accent/30' : 'border-white/5 hover:border-panel-border',
      )}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-panel-bg overflow-hidden relative flex items-center justify-center">
        <PickerThumbnail character={uc} blobUrlsAV={blobUrlsAV} />

        {/* Checkmark overlay when selected */}
        {selected && (
          <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Name + type badge */}
      <div className="p-1.5 bg-panel-surface">
        <p className="text-[10px] text-gray-300 truncate font-medium">{uc.name}</p>
        <span className={cn('text-[8px] px-1 py-0.5 rounded font-medium inline-block mt-0.5', badge.color)}>
          {badge.label}
        </span>
      </div>
    </div>
  )
}

// ── Thumbnail renderer for the character picker grid ──

function PickerThumbnail({
  character: uc,
  blobUrlsAV,
}: {
  character: UnifiedCharacter
  blobUrlsAV: Record<string, string>
}) {
  // 2D
  if (uc.type === '2d' && uc.raw2D) {
    const char = uc.raw2D
    const hasBodyParts = char.bodyParts && Object.values(char.bodyParts).some((arr) => arr.length > 0)

    if (hasBodyParts && char.bodyParts) {
      const sel = char.selectedSprites
      const bodyIdx = sel?.body ?? 0
      const headIdx = (sel as Record<string, number | null> | undefined)?.head ?? 0
      const eyeIdx = sel?.eye ?? 0
      const eyebrowIdx = sel?.eyebrow ?? 0
      const hairIdx = sel?.hair ?? 0
      const visemeIdx = sel?.viseme ?? 0
      const shirtIdx = sel?.shirt ?? 0
      const pantsIdx = sel?.pants ?? 0
      const shoesIdx = sel?.shoes ?? 0
      const bodyImg = char.bodyParts.body?.[bodyIdx] || char.bodyParts.body?.[0]
      const headImg = char.bodyParts.head?.[headIdx] || char.bodyParts.head?.[0]
      const eyeImg = char.bodyParts.eye?.[eyeIdx] || char.bodyParts.eye?.[0]
      const eyebrowImg = char.bodyParts.eyebrow?.[eyebrowIdx] || char.bodyParts.eyebrow?.[0]
      const hairImg = char.bodyParts.hair?.[hairIdx] || char.bodyParts.hair?.[0]
      const visemeImg = char.bodyParts.viseme?.[visemeIdx] || char.bodyParts.viseme?.[0]
      const shirtImg = char.bodyParts.shirt?.[shirtIdx] || char.bodyParts.shirt?.[0]
      const pantsImg = char.bodyParts.pants?.[pantsIdx] || char.bodyParts.pants?.[0]
      const shoesImg = char.bodyParts.shoes?.[shoesIdx] || char.bodyParts.shoes?.[0]
      const pt = char.partTransforms as
        | Record<string, { x: number; y: number; rotation: number; scaleX: number; scaleY: number; visible: boolean }>
        | undefined

      const thumbLayers: { part: string; src: string | undefined; zBase: number }[] = [
        { part: 'body', src: bodyImg, zBase: 0 },
        { part: 'shoes', src: shoesImg, zBase: 1 },
        { part: 'pants', src: pantsImg, zBase: 2 },
        { part: 'shirt', src: shirtImg, zBase: 3 },
        { part: 'head', src: headImg, zBase: 4 },
        { part: 'eye', src: eyeImg, zBase: 5 },
        { part: 'eyebrow', src: eyebrowImg, zBase: 6 },
        { part: 'viseme', src: visemeImg, zBase: 7 },
        { part: 'hair', src: hairImg, zBase: 8 },
      ]

      return (
        <>
          {thumbLayers.map(({ part, src, zBase }) => {
            if (!src || !isValidSrc(src)) return null
            const t = pt?.[part]
            if (t && !t.visible) return null
            const style: React.CSSProperties = {
              zIndex: zBase,
              ...(t
                ? {
                    transform: `translate(${(t.x / 200) * 100}%, ${(t.y / 200) * 100}%) rotate(${t.rotation}deg) scale(${t.scaleX}, ${t.scaleY})`,
                    transformOrigin: 'center center',
                  }
                : {}),
            }
            return (
              <img
                key={part}
                src={src}
                alt={part}
                className="absolute inset-0 w-full h-full object-contain"
                style={style}
              />
            )
          })}
        </>
      )
    }

    const thumb = get2DThumbnail(char)
    if (thumb) {
      return <img src={thumb} alt={char.name} className="w-full h-full object-cover" />
    }

    return (
      <div className="w-full h-full bg-gradient-to-b from-[#2a2a3a] to-[#1e1e2e] flex flex-col items-center justify-center gap-1">
        <Square size={24} className="text-green-500/40" />
        <span className="text-[9px] text-gray-500">No preview</span>
      </div>
    )
  }

  // 3D
  if (uc.type === '3d' && uc.raw3D) {
    const char = uc.raw3D
    if (char.thumbnailDataUrl) {
      return <img src={char.thumbnailDataUrl} alt={char.name} className="w-full h-full object-contain" />
    }
    return (
      <div className="w-full h-full bg-gradient-to-b from-panel-surface-hover to-panel-surface flex items-center justify-center">
        <Box size={24} className="text-blue-500/40" />
      </div>
    )
  }

  // 1D (pixel art)
  if (uc.type === '1d' && uc.raw1D) {
    const char = uc.raw1D
    if (char.thumbnailDataUrl) {
      return (
        <img
          src={char.thumbnailDataUrl}
          alt={char.name}
          className="w-full h-full object-contain"
          style={{ imageRendering: 'pixelated' }}
        />
      )
    }
    return (
      <div className="w-full h-full bg-gradient-to-b from-panel-surface-hover to-panel-surface flex items-center justify-center">
        <Grid3x3 size={24} className="text-purple-500/40" />
      </div>
    )
  }

  // Avatar
  if (uc.type === 'avatar' && uc.rawAvatar) {
    const char = uc.rawAvatar
    const imgSrc = blobUrlsAV[char.baseBlobId] || char.thumbnailDataUrl
    if (imgSrc) {
      return <img src={imgSrc} alt={char.name} className="w-full h-full object-cover" />
    }
    return (
      <div className="w-full h-full bg-gradient-to-b from-panel-surface-hover to-panel-surface flex items-center justify-center">
        <UserCircle size={24} className="text-orange-500/40" />
      </div>
    )
  }

  // Fallback
  return (
    <div className="w-full h-full bg-gradient-to-b from-[#2a2a3a] to-[#1e1e2e] flex flex-col items-center justify-center gap-1">
      <User size={24} className="text-gray-500" />
      <span className="text-[9px] text-gray-500">No preview</span>
    </div>
  )
}
