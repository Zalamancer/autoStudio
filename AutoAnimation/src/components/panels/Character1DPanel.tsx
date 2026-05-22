/**
 * 1D (Pixel Art) Character Panel — Generate, animate, and manage PixelLab pixel art characters.
 *
 * Follows Character3DPanel.tsx patterns exactly:
 * - List view: 2-column grid, same card styling, double-click to place
 * - Create view: PanelLayout with back button, AI generation form
 *
 * Character creation flow:
 * 1. Generate front-facing sprite with PixFlux
 * 2. Use Rotate endpoint to generate other direction views
 * 3. Save all direction sprites to IndexedDB + library store
 */
import { useState, useMemo, useCallback } from 'react'
import { Plus, Trash2, Loader2, ArrowLeft, Wand2, Grid3x3, Play, Image, ChevronDown, Check, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelLayout } from '@/components/ui/PanelHeader'
import { PanelSlider, PanelSelect } from '@/components/ui/panel-controls'
import { useSavedPixelArtCharactersStore } from '@/stores/useSavedPixelArtCharactersStore'
import { usePixelArtCharacterStore } from '@/stores/usePixelArtCharacterStore'
import { useEditorStore } from '@/stores'
import { useConfirmDialog } from '@/stores/useConfirmDialogStore'
import { savePixelArtBlob } from '@/services/pixelArtDB'
import * as pixelLabAPI from '@/services/pixelLabAPI'
import type {
  PixelArtOutline,
  PixelArtShading,
  PixelArtDetail,
  PixelArtView,
  PixelArtDirection,
  SavedPixelArtCharacter,
} from '@/types/pixelLab'
import { DIRECTIONS_4, DIRECTIONS_8 } from '@/types/pixelLab'

type ViewMode = 'list' | 'create'
type CreateTab = 'character' | 'animate' | 'image'

/** Convert base64 string to Blob */
function base64ToBlob(base64: string, mimeType = 'image/png'): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mimeType })
}

export function Character1DPanel() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  return viewMode === 'list' ? (
    <PixelArtListView onCreateNew={() => setViewMode('create')} />
  ) : (
    <PixelArtCreateView onBack={() => setViewMode('list')} />
  )
}

// ─── List View ──────────────────────────────────────────────────────────────

function PixelArtListView({ onCreateNew }: { onCreateNew: () => void }) {
  const characters = useSavedPixelArtCharactersStore((s) => s.characters)
  const removeCharacter = useSavedPixelArtCharactersStore((s) => s.removeCharacter)
  const selectedId = useSavedPixelArtCharactersStore((s) => s.selectedCharacterId)
  const selectCharacter = useSavedPixelArtCharactersStore((s) => s.selectCharacter)
  const addPixelArtCharacter = usePixelArtCharacterStore((s) => s.addPixelArtCharacter)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const confirm = useConfirmDialog()

  const [searchQuery, setSearchQuery] = useState('')

  const filteredCharacters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return characters
    return characters.filter((c) => c.name.toLowerCase().includes(q))
  }, [characters, searchQuery])

  const handlePlaceOnCanvas = (char: SavedPixelArtCharacter) => {
    const id = addPixelArtCharacter({
      name: char.name,
      savedPixelArtCharacterId: char.id,
      position: { x: 540, y: 540 },
      scale: 4,
      direction: 'south',
      activeAnimation: null,
      animationSpeed: 1,
      animationClips: [],
      zIndex: 10,
      visible: true,
      locked: false,
      opacity: 1,
      color: '',
    })
    // Select the newly placed character and open properties panel
    usePixelArtCharacterStore.getState().selectPixelArtCharacter(id)
    setRightPanelTab('pixelart-character-properties')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Search (Cinema standard) ── */}
      <div className="shrink-0 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pixel art characters..."
              className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {filteredCharacters.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredCharacters.map((char) => {
              const thumbUrl = char.thumbnailDataUrl
              return (
                <div
                  key={char.id}
                  onClick={() => selectCharacter(char.id)}
                  onDoubleClick={() => handlePlaceOnCanvas(char)}
                  className={cn(
                    'group relative rounded-lg overflow-hidden cursor-pointer border transition-all duration-200',
                    selectedId === char.id
                      ? 'border-accent ring-2 ring-accent/30'
                      : 'border-white/5 hover:border-panel-border',
                  )}
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-panel-bg flex items-center justify-center">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt={char.name}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                        draggable={false}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-b from-panel-surface-hover to-panel-surface flex items-center justify-center">
                        <Grid3x3 size={28} className="text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* Selection badge */}
                  {selectedId === char.id && (
                    <div className="absolute top-2 left-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center z-10">
                      <Check size={12} className="text-white" />
                    </div>
                  )}

                  {/* Name & Info */}
                  <div className="p-2 bg-panel-surface">
                    <p className="text-xs text-gray-300 truncate font-medium">{char.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[9px] px-1 py-0.5 rounded bg-green-500/20 text-green-400 flex-shrink-0">
                        {char.size}px
                      </span>
                      <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 flex-shrink-0">
                        {char.n_directions}dir
                      </span>
                      {Object.keys(char.animationBlobIds).length > 0 && (
                        <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400 flex-shrink-0">
                          {Object.keys(char.animationBlobIds).length} anim
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover action buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (
                          !(await confirm({
                            title: 'Delete character',
                            description: 'Delete this pixel art character?',
                          }))
                        )
                          return
                        removeCharacter(char.id)
                      }}
                      className="w-6 h-6 bg-panel-bg/80 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-colors"
                      title="Delete character"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <Grid3x3 size={28} className="mb-3" />
            <span className="text-sm text-gray-400">
              {characters.length === 0 ? 'No pixel art characters yet' : 'No characters found'}
            </span>
            <span className="text-xs text-gray-600 mt-1">
              {characters.length === 0 ? 'Generate one with AI from a text prompt' : 'Try a different search term'}
            </span>
          </div>
        )}
      </div>

      {/* ── Footer (Cinema standard) ── */}
      <div className="shrink-0 px-3 py-2 border-t border-white/5">
        <button
          onClick={onCreateNew}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
        >
          <Plus size={13} />
          Create Pixel Art Character
        </button>
      </div>
    </div>
  )
}

// ─── Create View ────────────────────────────────────────────────────────────

function PixelArtCreateView({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<CreateTab>('character')

  const tabs: { id: CreateTab; label: string; icon: typeof Wand2 }[] = [
    { id: 'character', label: 'Character', icon: Wand2 },
    { id: 'animate', label: 'Animate', icon: Play },
    { id: 'image', label: 'Image', icon: Image },
  ]

  return (
    <PanelLayout
      icon={Grid3x3}
      title="Pixel Art Studio"
      iconClassName="text-green-400"
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

      {/* Tab content */}
      <div className="space-y-3 pt-3">
        {activeTab === 'character' && <CharacterCreateTab onBack={onBack} />}
        {activeTab === 'animate' && <AnimateTab />}
        {activeTab === 'image' && <ImageTab />}
      </div>
    </PanelLayout>
  )
}

// ─── Character Create Tab ───────────────────────────────────────────────────

function CharacterCreateTab({ onBack }: { onBack: () => void }) {
  const [prompt, setPrompt] = useState('')
  const [name, setName] = useState('')
  const [nDirs, setNDirs] = useState<4 | 8>(4)
  const [size, setSize] = useState(64)
  const [outline, setOutline] = useState<PixelArtOutline>('single color black outline')
  const [shading, setShading] = useState<PixelArtShading>('basic shading')
  const [detail, setDetail] = useState<PixelArtDetail>('medium detail')
  const [view, setView] = useState<PixelArtView>('low top-down')
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const addSavedCharacter = useSavedPixelArtCharactersStore((s) => s.addCharacter)
  const setBlobUrl = useSavedPixelArtCharactersStore((s) => s.setBlobUrl)

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setError(null)
    setProgress('Generating front-facing sprite...')

    const directions = nDirs === 8 ? DIRECTIONS_8 : DIRECTIONS_4

    try {
      // Step 1: Generate south-facing (front) sprite with PixFlux
      const frontResult = await pixelLabAPI.generatePixflux({
        description: prompt.trim(),
        image_size: { width: size, height: size },
        outline,
        shading,
        detail,
        view,
        direction: 'south',
        no_background: true,
      })

      const frontBase64 = frontResult.image.base64
      const thumbnailDataUrl = `data:image/png;base64,${frontBase64}`

      // Save front sprite to IndexedDB
      const directionBlobIds: Partial<Record<PixelArtDirection, string>> = {}
      const frontBlobId = `px_${Date.now()}_south`
      const frontBlob = base64ToBlob(frontBase64)
      await savePixelArtBlob(frontBlobId, frontBlob)
      directionBlobIds['south'] = frontBlobId
      setBlobUrl(frontBlobId, URL.createObjectURL(frontBlob))

      // Step 2: Rotate to generate other directions
      const otherDirs = directions.filter((d) => d !== 'south')
      for (let i = 0; i < otherDirs.length; i++) {
        const dir = otherDirs[i]
        setProgress(`Rotating to ${dir}... (${i + 1}/${otherDirs.length})`)

        try {
          const rotResult = await pixelLabAPI.rotateImage({
            image_size: { width: size, height: size },
            from_image: { type: 'base64', base64: frontBase64 },
            from_direction: 'south',
            to_direction: dir,
            from_view: view,
            to_view: view,
          })

          const blobId = `px_${Date.now()}_${dir}`
          const blob = base64ToBlob(rotResult.image.base64)
          await savePixelArtBlob(blobId, blob)
          directionBlobIds[dir] = blobId
          setBlobUrl(blobId, URL.createObjectURL(blob))
        } catch (rotErr) {
          console.warn(`[PixelLab] Failed to rotate to ${dir}:`, rotErr)
        }
      }

      // Step 3: Save to library
      const savedChar: SavedPixelArtCharacter = {
        id: `spx_${Date.now()}`,
        name: name.trim() || prompt.trim().slice(0, 30),
        description: prompt.trim(),
        size,
        n_directions: nDirs,
        thumbnailDataUrl,
        directionBlobIds,
        animationBlobIds: {},
        style: { outline, shading, detail, view },
        createdAt: Date.now(),
      }

      addSavedCharacter(savedChar)
      onBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
      setProgress('')
    }
  }, [prompt, name, nDirs, size, outline, shading, detail, view, addSavedCharacter, setBlobUrl, onBack])

  return (
    <div className="space-y-3">
      {/* Character Name */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Character Name</label>
        <div className="relative">
          <Grid3x3 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Blue Wizard"
            className="w-full bg-panel-surface border border-panel-border rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-600 focus:border-accent focus:outline-none"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Description</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., cute wizard with blue robes and a magic staff"
          className="w-full h-20 bg-panel-surface border border-panel-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 resize-none focus:border-accent focus:outline-none"
        />
      </div>

      {/* Directions & Size */}
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1.5">Directions</label>
          <div className="flex gap-1">
            {([4, 8] as const).map((n) => (
              <button
                key={n}
                onClick={() => setNDirs(n)}
                className={cn(
                  'flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all border',
                  nDirs === n
                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                    : 'bg-black/20 text-zinc-500 border-white/5 hover:border-green-500/20',
                )}
              >
                {n} dirs
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1.5">Size</label>
          <div className="flex gap-1">
            {([16, 32, 64, 128] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={cn(
                  'flex-1 py-1.5 rounded-md text-[11px] font-medium transition-all border',
                  size === s
                    ? 'bg-green-500/20 text-green-300 border-green-500/30'
                    : 'bg-black/20 text-zinc-500 border-white/5 hover:border-green-500/20',
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced settings toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ChevronDown size={12} className={cn('transition-transform', showAdvanced && 'rotate-180')} />
        Advanced Settings
      </button>

      {showAdvanced && (
        <div className="space-y-2 pl-3 border-l-2 border-panel-border">
          <PanelSelect
            label="View"
            value={view}
            onChange={(v) => setView(v as PixelArtView)}
            options={[
              { value: 'low top-down', label: 'Low Top-Down' },
              { value: 'high top-down', label: 'High Top-Down' },
              { value: 'side', label: 'Side' },
            ]}
          />
          <PanelSelect
            label="Outline"
            value={outline}
            onChange={(v) => setOutline(v as PixelArtOutline)}
            options={[
              { value: 'single color black outline', label: 'Black Outline' },
              { value: 'single color outline', label: 'Color Outline' },
              { value: 'selective outline', label: 'Selective' },
              { value: 'lineless', label: 'Lineless' },
            ]}
          />
          <PanelSelect
            label="Shading"
            value={shading}
            onChange={(v) => setShading(v as PixelArtShading)}
            options={[
              { value: 'flat shading', label: 'Flat' },
              { value: 'basic shading', label: 'Basic' },
              { value: 'medium shading', label: 'Medium' },
              { value: 'detailed shading', label: 'Detailed' },
            ]}
          />
          <PanelSelect
            label="Detail"
            value={detail}
            onChange={(v) => setDetail(v as PixelArtDetail)}
            options={[
              { value: 'low detail', label: 'Low' },
              { value: 'medium detail', label: 'Medium' },
              { value: 'highly detailed', label: 'High' },
            ]}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">{error}</div>
      )}

      {/* Progress */}
      {isGenerating && progress && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-panel-surface rounded-lg">
          <Loader2 size={12} className="text-accent animate-spin" />
          <p className="text-[11px] text-accent">{progress}</p>
        </div>
      )}

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        className={cn(
          'w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2',
          !prompt.trim() || isGenerating
            ? 'bg-panel-surface-hover text-gray-500 cursor-not-allowed'
            : 'bg-accent hover:bg-accent-hover text-white',
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
            Generate Character
          </>
        )}
      </button>
    </div>
  )
}

// ─── Animate Tab ────────────────────────────────────────────────────────────

function AnimateTab() {
  const characters = useSavedPixelArtCharactersStore((s) => s.characters)
  const blobUrls = useSavedPixelArtCharactersStore((s) => s.blobUrls)
  const updateCharacter = useSavedPixelArtCharactersStore((s) => s.updateCharacter)
  const setBlobUrl = useSavedPixelArtCharactersStore((s) => s.setBlobUrl)
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null)
  const [action, setAction] = useState('walking')
  const [nFrames, setNFrames] = useState(4)
  const [isAnimating, setIsAnimating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedChar = characters.find((c) => c.id === selectedCharId)

  const handleAnimate = useCallback(async () => {
    if (!selectedChar) return

    const southBlobId = selectedChar.directionBlobIds['south']
    if (!southBlobId) {
      setError('Character has no front-facing sprite for reference')
      return
    }

    const blobUrl = blobUrls[southBlobId]
    if (!blobUrl) {
      setError('Character sprite not loaded')
      return
    }

    setIsAnimating(true)
    setError(null)

    try {
      const response = await fetch(blobUrl)
      const blob = await response.blob()
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          resolve(result.split(',')[1])
        }
        reader.readAsDataURL(blob)
      })

      const result = await pixelLabAPI.animateWithText({
        image_size: { width: 64, height: 64 },
        description: selectedChar.description,
        action,
        reference_image: { type: 'base64', base64 },
        n_frames: nFrames,
        direction: 'south',
      })

      const animName = action.replace(/\s+/g, '-').toLowerCase()
      const frameBlobIds: string[] = []

      for (let i = 0; i < result.images.length; i++) {
        const frameBase64 = result.images[i].base64
        const blobId = `px_${selectedChar.id}_${animName}_f${i}`
        const frameBlob = base64ToBlob(frameBase64)
        await savePixelArtBlob(blobId, frameBlob)
        frameBlobIds.push(blobId)
        setBlobUrl(blobId, URL.createObjectURL(frameBlob))
      }

      const newAnimBlobIds = {
        ...selectedChar.animationBlobIds,
        [animName]: [{ direction: 'south' as PixelArtDirection, frameBlobIds }],
      }
      updateCharacter(selectedChar.id, { animationBlobIds: newAnimBlobIds })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Animation failed')
    } finally {
      setIsAnimating(false)
    }
  }, [selectedChar, action, nFrames, blobUrls, updateCharacter, setBlobUrl])

  return (
    <div className="space-y-3">
      {/* Character selector */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Character</label>
        {characters.length === 0 ? (
          <p className="text-xs text-gray-600">Create a character first</p>
        ) : (
          <PanelSelect
            value={selectedCharId || ''}
            onChange={(v) => setSelectedCharId(v || null)}
            options={[
              { value: '', label: 'Select character...' },
              ...characters.map((c) => ({ value: c.id, label: c.name })),
            ]}
            fullWidth
          />
        )}
      </div>

      {/* Action description */}
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Action</label>
        <input
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="e.g., walking, running, attacking"
          className="w-full bg-panel-surface border border-panel-border rounded-lg py-2 px-3 text-sm text-white placeholder:text-gray-600 focus:border-accent focus:outline-none"
        />
      </div>

      {/* Frame count */}
      <PanelSlider
        label="Frames"
        value={nFrames}
        onChange={(v) => setNFrames(Math.round(v))}
        min={2}
        max={20}
        step={1}
        compact
      />

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">{error}</div>
      )}

      <button
        onClick={handleAnimate}
        disabled={!selectedChar || isAnimating}
        className={cn(
          'w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2',
          !selectedChar || isAnimating
            ? 'bg-panel-surface-hover text-gray-500 cursor-not-allowed'
            : 'bg-accent hover:bg-accent-hover text-white',
        )}
      >
        {isAnimating ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Animating...
          </>
        ) : (
          <>
            <Play size={14} /> Generate Animation
          </>
        )}
      </button>

      {/* Show existing animations */}
      {selectedChar && Object.keys(selectedChar.animationBlobIds).length > 0 && (
        <div>
          <label className="block text-xs text-gray-500 mb-1.5">Saved Animations</label>
          <div className="flex flex-wrap gap-1">
            {Object.keys(selectedChar.animationBlobIds).map((animName) => (
              <span key={animName} className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400">
                {animName}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Image Tab ──────────────────────────────────────────────────────────────

function ImageTab() {
  const [prompt, setPrompt] = useState('')
  const [engine, setEngine] = useState<'pixflux' | 'bitforge'>('pixflux')
  const [width, setWidth] = useState(64)
  const [height, setHeight] = useState(64)
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return
    setIsGenerating(true)
    setError(null)
    setResult(null)

    try {
      if (engine === 'pixflux') {
        const data = await pixelLabAPI.generatePixflux({
          description: prompt.trim(),
          image_size: { width, height },
          no_background: true,
        })
        setResult(data.image.base64)
      } else {
        const data = await pixelLabAPI.generateBitforge({
          description: prompt.trim(),
          image_size: { width, height },
          no_background: true,
        })
        setResult(data.image.base64)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }, [prompt, engine, width, height])

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1.5">Description</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., treasure chest with gold coins"
          className="w-full h-16 bg-panel-surface border border-panel-border rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 resize-none focus:border-accent focus:outline-none"
        />
      </div>

      <div className="flex gap-2">
        <div className="flex-1">
          <PanelSelect
            label="Engine"
            value={engine}
            onChange={(v) => setEngine(v as 'pixflux' | 'bitforge')}
            options={[
              { value: 'pixflux', label: 'PixFlux' },
              { value: 'bitforge', label: 'BitForge' },
            ]}
          />
        </div>
        <PanelSlider
          label="W"
          value={width}
          onChange={(v) => setWidth(Math.round(v))}
          min={16}
          max={engine === 'pixflux' ? 400 : 200}
          step={1}
          inline
          suffix="px"
        />
        <PanelSlider
          label="H"
          value={height}
          onChange={(v) => setHeight(Math.round(v))}
          min={16}
          max={engine === 'pixflux' ? 400 : 200}
          step={1}
          inline
          suffix="px"
        />
      </div>

      {error && (
        <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">{error}</div>
      )}

      {result && (
        <div className="flex items-center justify-center p-4 bg-panel-bg rounded-lg">
          <img
            src={`data:image/png;base64,${result}`}
            alt="Generated pixel art"
            style={{ imageRendering: 'pixelated', maxWidth: '100%' }}
          />
        </div>
      )}

      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || isGenerating}
        className={cn(
          'w-full py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2',
          !prompt.trim() || isGenerating
            ? 'bg-panel-surface-hover text-gray-500 cursor-not-allowed'
            : 'bg-accent hover:bg-accent-hover text-white',
        )}
      >
        {isGenerating ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Generating...
          </>
        ) : (
          <>
            <Image size={14} /> Generate Image
          </>
        )}
      </button>
    </div>
  )
}
