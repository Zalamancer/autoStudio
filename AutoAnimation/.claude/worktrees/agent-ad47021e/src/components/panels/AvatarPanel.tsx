/**
 * Avatar Character Panel — Generate realistic bust-shot avatars and create
 * lip-synced videos via AI image-to-video generation.
 *
 * Two views:
 * - List: saved avatars grid, double-click to place on canvas
 * - Create: text or photo-based generation form
 */
import { useState, useMemo, useCallback } from 'react'
import {
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  Wand2,
  Camera,
  Check,
  UserCircle,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { PanelCategoryTabs } from '@/components/ui/panel-controls'
import { useSavedAvatarCharactersStore } from '@/stores/useSavedAvatarCharactersStore'
import { useAvatarCharacterStore } from '@/stores/useAvatarCharacterStore'
import { useEditorStore } from '@/stores'
import { generateAvatarCharacter } from '@/services/avatarGenerator'
import type { AvatarResolution, AvatarAspectRatio } from '@/services/avatarGenerator'
import type { AvatarStyle, SavedAvatarCharacter } from '@/types/avatar'

type ViewMode = 'list' | 'create'
type CreateTab = 'text' | 'photo'

const AVATAR_STYLES: { id: AvatarStyle; label: string }[] = [
  { id: 'realistic', label: 'Realistic' },
  { id: 'semi-realistic', label: 'Semi-Realistic' },
  { id: 'illustrated', label: 'Illustrated' },
  { id: 'anime', label: 'Anime' },
]

const AVATAR_RESOLUTIONS: { id: AvatarResolution; label: string }[] = [
  { id: '512', label: '512px' },
  { id: '1024', label: '1024px' },
  { id: '2048', label: '2048px' },
]

const AVATAR_ASPECT_RATIOS: { id: AvatarAspectRatio; label: string }[] = [
  { id: '3:4', label: '3:4' },
  { id: '1:1', label: '1:1' },
  { id: '4:3', label: '4:3' },
  { id: '9:16', label: '9:16' },
  { id: '16:9', label: '16:9' },
]

export function AvatarPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  return viewMode === 'list' ? (
    <AvatarListView onCreateNew={() => setViewMode('create')} />
  ) : (
    <AvatarCreateView onBack={() => setViewMode('list')} />
  )
}

// ─── List View ──────────────────────────────────────────────────────────────

const AVATAR_FILTER_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'realistic', label: 'Realistic' },
  { id: 'illustrated', label: 'Illustrated' },
  { id: 'anime', label: 'Anime' },
]

function AvatarListView({ onCreateNew }: { onCreateNew: () => void }) {
  const characters = useSavedAvatarCharactersStore((s) => s.characters)
  const blobUrls = useSavedAvatarCharactersStore((s) => s.blobUrls)
  const removeCharacter = useSavedAvatarCharactersStore((s) => s.removeCharacter)
  const selectedId = useSavedAvatarCharactersStore((s) => s.selectedCharacterId)
  const selectCharacter = useSavedAvatarCharactersStore((s) => s.selectCharacter)
  const addAvatarCharacter = useAvatarCharacterStore((s) => s.addAvatarCharacter)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)

  const [searchQuery, setSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')

  const hasActiveFilter = categoryFilter !== 'all'

  const filteredCharacters = useMemo(() => {
    let result = characters
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      result = result.filter((c) => c.name.toLowerCase().includes(q))
    }
    if (categoryFilter !== 'all') {
      result = result.filter((c) => c.style === categoryFilter || c.style === `semi-${categoryFilter}`)
    }
    return result
  }, [characters, searchQuery, categoryFilter])

  const handlePlaceOnCanvas = (char: SavedAvatarCharacter) => {
    // If this avatar already exists on canvas, just select it (preserves videos)
    const existing = useAvatarCharacterStore.getState().characters.find((c) => c.savedAvatarCharacterId === char.id)
    if (existing) {
      useAvatarCharacterStore.getState().selectAvatarCharacter(existing.id)
      setRightPanelTab('avatar-character-properties')
      return
    }

    const id = addAvatarCharacter({
      name: char.name,
      savedAvatarCharacterId: char.id,
      position: { x: 540, y: 540 },
      scale: 1,
      zIndex: 10,
      visible: true,
      locked: false,
      opacity: 1,
      color: '',
      videoStatus: 'idle',
    })
    useAvatarCharacterStore.getState().selectAvatarCharacter(id)
    setRightPanelTab('avatar-character-properties')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Search + Filter Toggle (Cinema standard) ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search avatars..."
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-[#4a7eff]/30 focus:outline-none"
            />
          </div>
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={cn(
              'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
              filtersOpen ? 'bg-[#4a7eff]/20 text-[#4a7eff]' : 'text-zinc-500 hover:text-zinc-200 hover:bg-[#2a2a2a]',
            )}
          >
            <SlidersHorizontal size={14} />
            {hasActiveFilter && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#4a7eff]" />}
          </button>
        </div>
      </div>

      {/* ── Category filter (hidden by default) ── */}
      {filtersOpen && (
        <div className="shrink-0 px-3 pb-2">
          <PanelCategoryTabs
            tabs={AVATAR_FILTER_CATEGORIES}
            activeTab={categoryFilter}
            onChange={(id) => setCategoryFilter(id)}
            compact
          />
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {filteredCharacters.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredCharacters.map((char) => (
              <div
                key={char.id}
                onClick={() => selectCharacter(char.id)}
                onDoubleClick={() => handlePlaceOnCanvas(char)}
                className={cn(
                  'group relative rounded-lg overflow-hidden cursor-pointer border transition-all duration-200',
                  selectedId === char.id
                    ? 'border-[#4a7eff] ring-2 ring-[#4a7eff]/30'
                    : 'border-white/5 hover:border-[#3a3a3a]',
                )}
              >
                {/* Thumbnail — prefer blob URL from IndexedDB, fall back to small thumbnail */}
                <div className="aspect-[3/4] bg-[#1e1e1e] flex items-center justify-center">
                  {blobUrls[char.baseBlobId] || char.thumbnailDataUrl ? (
                    <img
                      src={blobUrls[char.baseBlobId] || char.thumbnailDataUrl}
                      alt={char.name}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-b from-[#3a3a3a] to-[#2a2a2a] flex items-center justify-center">
                      <UserCircle size={28} className="text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Selection badge */}
                {selectedId === char.id && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-[#4a7eff] rounded-full flex items-center justify-center z-10">
                    <Check size={12} className="text-white" />
                  </div>
                )}

                {/* Name & Info */}
                <div className="p-2 bg-[#2a2a2a]">
                  <p className="text-xs text-gray-300 truncate font-medium">{char.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/20 text-amber-400 flex-shrink-0">
                      {char.style}
                    </span>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 flex-shrink-0">
                      {char.source}
                    </span>
                  </div>
                </div>

                {/* Hover action buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!window.confirm('Delete this avatar?')) return
                      removeCharacter(char.id)
                    }}
                    className="w-6 h-6 bg-[#1e1e1e]/80 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-colors"
                    title="Delete avatar"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <UserCircle size={28} className="mb-3" />
            <span className="text-sm text-gray-400">
              {characters.length === 0 ? 'No avatars yet' : 'No avatars found'}
            </span>
            <span className="text-xs text-gray-600 mt-1">
              {characters.length === 0
                ? 'Create a realistic avatar for video generation'
                : 'Try a different search or filter'}
            </span>
          </div>
        )}
      </div>

      {/* ── Footer (Cinema standard) ── */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5">
        <button
          onClick={onCreateNew}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium bg-[#4a7eff] text-white hover:bg-[#3a6aee] transition-colors"
        >
          <Plus size={13} />
          Create Avatar
        </button>
      </div>
    </div>
  )
}

// ─── Create View ────────────────────────────────────────────────────────────

function AvatarCreateView({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<CreateTab>('text')
  const [name, setName] = useState('')
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState<AvatarStyle>('semi-realistic')
  const [resolution, setResolution] = useState<AvatarResolution>('1024')
  const [aspectRatio, setAspectRatio] = useState<AvatarAspectRatio>('3:4')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [progressPct, setProgressPct] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const addSavedCharacter = useSavedAvatarCharactersStore((s) => s.addCharacter)
  const setBlobUrl = useSavedAvatarCharactersStore((s) => s.setBlobUrl)

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => setPhotoDataUrl(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleGenerate = useCallback(async () => {
    const textPrompt = activeTab === 'text' ? prompt : ''
    if (activeTab === 'text' && !textPrompt.trim()) return
    if (activeTab === 'photo' && !photoDataUrl) return

    setIsGenerating(true)
    setError(null)

    try {
      const character = await generateAvatarCharacter({
        prompt: textPrompt || 'character portrait based on reference photo',
        name: name || 'Avatar',
        style,
        resolution,
        aspectRatio,
        source: activeTab,
        sourcePhotoDataUrl: activeTab === 'photo' ? photoDataUrl! : undefined,
        onProgress: (step, pct) => {
          setProgress(step)
          setProgressPct(pct)
        },
      })

      // Register blob URL for display
      const { getAvatarBlob, blobToUrl } = await import('@/services/avatarDB')
      const blob = await getAvatarBlob(character.baseBlobId)
      if (blob) {
        setBlobUrl(character.baseBlobId, blobToUrl(blob))
      }

      addSavedCharacter(character)
      onBack()
    } catch (err: any) {
      setError(err.message || 'Generation failed')
    } finally {
      setIsGenerating(false)
      setProgress('')
      setProgressPct(0)
    }
  }, [activeTab, prompt, name, style, photoDataUrl, addSavedCharacter, setBlobUrl, onBack])

  const tabs: { id: CreateTab; label: string; icon: typeof Wand2 }[] = [
    { id: 'text', label: 'Text', icon: Wand2 },
    { id: 'photo', label: 'Photo', icon: Camera },
  ]

  return (
    <PanelLayout
      icon={UserCircle}
      title="Create Avatar"
      iconClassName="text-amber-400"
      trailing={
        <button onClick={onBack} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
          <ArrowLeft size={14} />
        </button>
      }
    >
      {/* Sub-tabs */}
      <div className="flex items-center gap-1 -mx-3 px-3 pb-3 border-b border-white/5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex-1 h-7 rounded-md flex items-center justify-center gap-1 transition-colors text-[11px] font-medium',
              activeTab === t.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5',
            )}
          >
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 pt-3">
        {/* Name field */}
        <div>
          <label className="text-[11px] text-gray-500 mb-1 block">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Avatar"
            className="w-full h-8 px-3 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-[#4a7eff]"
          />
        </div>

        {/* Text tab: description */}
        {activeTab === 'text' && (
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">Description</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="young woman with brown hair, blue eyes, wearing a red jacket..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-[#4a7eff] resize-none"
            />
          </div>
        )}

        {/* Photo tab: upload */}
        {activeTab === 'photo' && (
          <div>
            <label className="text-[11px] text-gray-500 mb-1 block">Reference Photo</label>
            {photoDataUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-[#3a3a3a]">
                <img src={photoDataUrl} alt="Reference" className="w-full h-40 object-cover" />
                <button
                  onClick={() => setPhotoDataUrl(null)}
                  className="absolute top-2 right-2 w-6 h-6 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ) : (
              <label className="block w-full h-28 border-2 border-dashed border-[#3a3a3a] rounded-lg cursor-pointer hover:border-[#4a7eff] transition-colors flex flex-col items-center justify-center gap-2">
                <Camera size={20} className="text-gray-500" />
                <span className="text-xs text-gray-500">Click to upload photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            )}
          </div>
        )}

        {/* Style selector */}
        <div>
          <label className="text-[11px] text-gray-500 mb-1 block">Style</label>
          <div className="grid grid-cols-2 gap-1.5">
            {AVATAR_STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={cn(
                  'h-7 rounded-md text-[11px] font-medium transition-colors',
                  style === s.id
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#333]',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Resolution */}
        <div>
          <label className="text-[11px] text-gray-500 mb-1 block">Resolution</label>
          <div className="grid grid-cols-3 gap-1.5">
            {AVATAR_RESOLUTIONS.map((r) => (
              <button
                key={r.id}
                onClick={() => setResolution(r.id)}
                className={cn(
                  'h-7 rounded-md text-[11px] font-medium transition-colors',
                  resolution === r.id
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#333]',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio */}
        <div>
          <label className="text-[11px] text-gray-500 mb-1 block">Aspect Ratio</label>
          <div className="grid grid-cols-5 gap-1">
            {AVATAR_ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.id}
                onClick={() => setAspectRatio(ar.id)}
                className={cn(
                  'h-7 rounded-md text-[10px] font-medium transition-colors',
                  aspectRatio === ar.id
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-[#2a2a2a] text-gray-400 hover:text-white hover:bg-[#333]',
                )}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Progress */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-amber-400" />
              <span className="text-xs text-gray-400">{progress}</span>
            </div>
            <div className="w-full h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={
            isGenerating || (activeTab === 'text' && !prompt.trim()) || (activeTab === 'photo' && !photoDataUrl)
          }
          className={cn(
            'w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2',
            isGenerating
              ? 'bg-[#3a3a3a] text-gray-500 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-600 text-black',
          )}
        >
          {isGenerating ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 size={14} />
              Generate Avatar
            </>
          )}
        </button>
      </div>
    </PanelLayout>
  )
}
