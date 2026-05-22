import { useState, useMemo, useCallback } from 'react'
import {
  Search,
  SlidersHorizontal,
  User,
  Square,
  Box,
  Grid3x3,
  UserCircle,
  Plus,
  Sparkles,
  Bone,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSavedCharactersStore, type SavedCharacter } from '@/stores/useSavedCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useSavedPixelArtCharactersStore } from '@/stores/useSavedPixelArtCharactersStore'
import { useSavedAvatarCharactersStore } from '@/stores/useSavedAvatarCharactersStore'
import type { Saved3DCharacter } from '@/types/character3d'
import type { SavedPixelArtCharacter } from '@/types/pixelLab'
import type { SavedAvatarCharacter } from '@/types/avatar'
import { useConfirmDialog } from '@/stores/useConfirmDialogStore'

// Canvas placement stores
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useCharacterConfigStore, useEditorStore, useCharacterPartsStore } from '@/stores'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { usePixelArtCharacterStore } from '@/stores/usePixelArtCharacterStore'
import { useAvatarCharacterStore } from '@/stores/useAvatarCharacterStore'
import { buildVisemeSpriteMapFromCurved, buildVisemeSpriteMap, type SpriteEntry } from '@/services/visemeMapper'
import { computeCharacterLayout, type AspectRatioKey } from '@/services/compositionEngine'
import type { CharacterPartTab } from '@/stores/useSavedCharactersStore'

// ── Types ──

type CharacterType = '2d' | '3d' | '1d' | 'avatar'
type SortOption = 'newest' | 'oldest' | 'a-z' | 'has-parts'

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'newest', label: 'Newest' },
  { id: 'oldest', label: 'Oldest' },
  { id: 'a-z', label: 'A–Z' },
  { id: 'has-parts', label: 'Has Parts' },
]

interface UnifiedCharacter {
  id: string
  name: string
  type: CharacterType
  createdAt: number
  /** The raw character data from the source store */
  raw2D?: SavedCharacter
  raw3D?: Saved3DCharacter
  raw1D?: SavedPixelArtCharacter
  rawAvatar?: SavedAvatarCharacter
}

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

const PART_ORDER: CharacterPartTab[] = ['body', 'head', 'eye', 'eyebrow', 'viseme', 'hair', 'shirt', 'pants', 'shoes']

// ── Helpers ──

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

// ── Component ──

export default function UnifiedCharacterList({
  onManual,
  onAIGenerate,
}: {
  onManual?: () => void
  onAIGenerate?: () => void
} = {}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [activeTypes, setActiveTypes] = useState<Set<CharacterType>>(new Set(['2d', '3d', '1d', 'avatar']))
  const [sortBy, setSortBy] = useState<SortOption>('newest')

  // All four stores
  const chars2D = useSavedCharactersStore((s) => s.characters)
  const chars3D = useSaved3DCharactersStore((s) => s.characters)
  const chars1D = useSavedPixelArtCharactersStore((s) => s.characters)
  const charsAV = useSavedAvatarCharactersStore((s) => s.characters)
  const blobUrlsAV = useSavedAvatarCharactersStore((s) => s.blobUrls)

  // Selected IDs from each store
  const selected2D = useSavedCharactersStore((s) => s.selectedCharacterId)
  const selected3D = useSaved3DCharactersStore((s) => s.selectedCharacterId)
  const selected1D = useSavedPixelArtCharactersStore((s) => s.selectedCharacterId)
  const selectedAV = useSavedAvatarCharactersStore((s) => s.selectedCharacterId)

  const hasActiveFilter = activeTypes.size < 4 || sortBy !== 'newest'

  // Build unified list
  const allCharacters = useMemo<UnifiedCharacter[]>(() => {
    const list: UnifiedCharacter[] = []

    for (const c of chars2D) {
      list.push({ id: c.id, name: c.name, type: '2d', createdAt: c.createdAt, raw2D: c })
    }
    for (const c of chars3D) {
      list.push({ id: c.id, name: c.name, type: '3d', createdAt: c.createdAt, raw3D: c })
    }
    for (const c of chars1D) {
      list.push({ id: c.id, name: c.name, type: '1d', createdAt: c.createdAt, raw1D: c })
    }
    for (const c of charsAV) {
      list.push({ id: c.id, name: c.name, type: 'avatar', createdAt: c.createdAt, rawAvatar: c })
    }

    // Sort by creation time, newest first
    list.sort((a, b) => b.createdAt - a.createdAt)
    return list
  }, [chars2D, chars3D, chars1D, charsAV])

  // Filter, search, and sort
  const filteredCharacters = useMemo(() => {
    let result = allCharacters

    // Type filter
    if (activeTypes.size < 4) {
      result = result.filter((c) => activeTypes.has(c.type))
    }

    // Search
    const q = searchQuery.trim().toLowerCase()
    if (q) {
      result = result.filter((c) => c.name.toLowerCase().includes(q))
    }

    // Sort
    result = [...result]
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => a.createdAt - b.createdAt)
        break
      case 'a-z':
        result.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'has-parts': {
        const hasParts = (c: UnifiedCharacter) => {
          if (c.type === '2d' && c.raw2D?.bodyParts) {
            return Object.values(c.raw2D.bodyParts).some((arr) => arr.length > 0) ? 0 : 1
          }
          return c.type === '3d' || c.type === 'avatar' ? 0 : 1
        }
        result.sort((a, b) => hasParts(a) - hasParts(b) || b.createdAt - a.createdAt)
        break
      }
      default: // 'newest'
        result.sort((a, b) => b.createdAt - a.createdAt)
    }

    return result
  }, [allCharacters, activeTypes, searchQuery, sortBy])

  const toggleType = useCallback((type: CharacterType) => {
    setActiveTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        // Don't allow unchecking all
        if (next.size > 1) next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  // ── Click handlers ──

  const handleClick2D = useCallback(async (char: SavedCharacter) => {
    const { selectCharacter, hydrateCharacter } = useSavedCharactersStore.getState()
    selectCharacter(char.id)

    if (!char._hydrated) {
      try {
        await hydrateCharacter(char.id)
      } catch (err) {
        console.warn('[UnifiedCharacterList] Failed to hydrate 2D character:', err)
      }
    }

    const hydratedChar = useSavedCharactersStore.getState().characters.find((c) => c.id === char.id) || char

    // Set visemes
    const hasVisemes = Object.values(hydratedChar.curvedVisemes).some((v) => v !== null)
    if (hasVisemes) {
      useCharacterConfigStore.getState().setCurvedVisemes(hydratedChar.curvedVisemes)
      useCharacterConfigStore.getState().setUseCurvedVisemes(true)
      if (hydratedChar.visemeSpriteMap) {
        useCharacterConfigStore.getState().setVisemeSpriteMap(hydratedChar.visemeSpriteMap)
      } else {
        const map = buildVisemeSpriteMapFromCurved(hydratedChar.curvedVisemes)
        useCharacterConfigStore.getState().setVisemeSpriteMap(map)
        useSavedCharactersStore.getState().updateCharacter(char.id, { visemeSpriteMap: map })
        useSavedCharactersStore
          .getState()
          .persistImages(char.id)
          .catch(() => {})
      }
    }
    if (hydratedChar.eyeVariants) {
      useCharacterConfigStore.getState().setEyeVariantSprites(hydratedChar.eyeVariants)
    }
    if (hydratedChar.eyebrowVariants) {
      useCharacterConfigStore.getState().setEyebrowVariantSprites(hydratedChar.eyebrowVariants)
    }

    // Load body parts
    const { setSavedImages, setSpriteLabel, setUploadedImage } = useCharacterConfigStore.getState()
    const { setSelectedSprite } = useCharacterPartsStore.getState()
    for (const part of PART_ORDER) {
      const images = hydratedChar.bodyParts?.[part] || []
      setSavedImages(part, images)
      const savedIdx = hydratedChar.selectedSprites?.[part]
      setSelectedSprite(part, savedIdx !== null && savedIdx !== undefined ? savedIdx : images.length > 0 ? 0 : null)
      const labels = hydratedChar.spriteLabels?.[part]
      if (labels) {
        for (const [idx, label] of Object.entries(labels)) {
          setSpriteLabel(part, Number(idx), label)
        }
      }
      const sheet = hydratedChar.uploadedSheets?.[part] ?? null
      setUploadedImage(part, sheet)
    }

    // VisemeSpriteMap from bodyParts if needed
    if (hydratedChar.visemeSpriteMap && !hasVisemes) {
      const mapFilled = Object.values(hydratedChar.visemeSpriteMap).some((v) => v !== null)
      if (mapFilled) {
        useCharacterConfigStore.getState().setVisemeSpriteMap(hydratedChar.visemeSpriteMap)
      }
    }
    if (!hydratedChar.visemeSpriteMap) {
      const visemeSprites = hydratedChar.bodyParts?.viseme || []
      const visemeLabels = hydratedChar.spriteLabels?.viseme || {}
      if (visemeSprites.length > 0 && Object.keys(visemeLabels).length > 0) {
        const entries: SpriteEntry[] = visemeSprites.map((src, i) => ({
          key: visemeLabels[i] || `sprite_${i}`,
          src,
        }))
        buildVisemeSpriteMap(entries, { useGemini: false })
          .then((map) => {
            const hasAny = Object.values(map).some((v) => v !== null)
            if (hasAny) {
              useCharacterConfigStore.getState().setVisemeSpriteMap(map)
              useSavedCharactersStore.getState().updateCharacter(char.id, { visemeSpriteMap: map })
              useSavedCharactersStore
                .getState()
                .persistImages(char.id)
                .catch(() => {})
            }
          })
          .catch(() => {})
      }
    }

    // Place on canvas
    const {
      characters: dialogueChars,
      addDialogueCharacter,
      selectDialogueCharacter,
    } = useMultiCharacterStore.getState()
    const existingOnCanvas = dialogueChars.find((dc) => dc.savedCharacterId === char.id)
    if (existingOnCanvas) {
      selectDialogueCharacter(existingOnCanvas.id)
    } else {
      const { canvasWidth, canvasHeight } = useCanvasStore.getState()
      const savedSelections = hydratedChar.selectedSprites
      const defaultSpriteOverrides = savedSelections
        ? {
            hair: savedSelections.hair ?? 0,
            body: savedSelections.body ?? 0,
            head: (savedSelections as Record<string, number | null>).head ?? 0,
            eye: savedSelections.eye ?? 0,
            eyebrow: savedSelections.eyebrow ?? 0,
            shirt: savedSelections.shirt ?? 0,
            pants: savedSelections.pants ?? 0,
            shoes: savedSelections.shoes ?? 0,
          }
        : undefined

      const defaultPT = { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, visible: true }
      const savedPT = hydratedChar.partTransforms as
        | Record<string, { x: number; y: number; rotation: number; scaleX: number; scaleY: number; visible: boolean }>
        | undefined
      const partTransforms = savedPT
        ? {
            body: savedPT.body || defaultPT,
            head: savedPT.head || defaultPT,
            eye: savedPT.eye || defaultPT,
            eyebrow: savedPT.eyebrow || defaultPT,
            viseme: savedPT.viseme || defaultPT,
            hair: savedPT.hair || defaultPT,
            shirt: savedPT.shirt || defaultPT,
            pants: savedPT.pants || defaultPT,
            shoes: savedPT.shoes || defaultPT,
          }
        : undefined

      const { aspectRatio } = useEditorStore.getState()
      const useCharCount = dialogueChars.length + 1
      const useLayouts = computeCharacterLayout(useCharCount, aspectRatio as AspectRatioKey)
      const useLayout = useLayouts[useCharCount - 1] || useLayouts[0]
      const { fps, currentFrame, addClip } = useTimelineStore.getState()
      const durationFrames = fps * 4

      const newId = addDialogueCharacter({
        name: hydratedChar.name,
        savedCharacterId: hydratedChar.id,
        position: {
          x: Math.round((useLayout.position.x * canvasWidth) / 100),
          y: Math.round((useLayout.position.y * canvasHeight) / 100),
        },
        scale: useLayout.scale,
        zIndex: dialogueChars.length,
        visible: true,
        locked: false,
        voiceId: null,
        color: '',
        partTransforms,
        defaultSpriteOverrides,
        startFrame: currentFrame,
        endFrame: currentFrame + durationFrames,
      })
      selectDialogueCharacter(newId)
      addClip('character-1', {
        id: `char-clip-${newId}`,
        trackId: 'character-1',
        startFrame: currentFrame,
        endFrame: currentFrame + durationFrames,
        sourceId: hydratedChar.id,
        sourceInPoint: 0,
        sourceOutPoint: durationFrames,
        color: '#22c55e',
        name: hydratedChar.name,
      })
    }
  }, [])

  const handleClick3D = useCallback((char: Saved3DCharacter) => {
    useSaved3DCharactersStore.getState().selectCharacter(char.id)
    use3DCharacterStore.getState().add3DCharacter({
      name: char.name,
      saved3DCharacterId: char.id,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: 1,
      zIndex: 0,
      visible: true,
      locked: false,
      activeAnimationId: null,
      animationSpeed: 1,
      voiceId: null,
      color: '',
      visemeFaceMapping: char.defaultVisemeFaceMapping,
    })
  }, [])

  const handleClick1D = useCallback((char: SavedPixelArtCharacter) => {
    useSavedPixelArtCharactersStore.getState().selectCharacter(char.id)
    const id = usePixelArtCharacterStore.getState().addPixelArtCharacter({
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
    usePixelArtCharacterStore.getState().selectPixelArtCharacter(id)
    useEditorStore.getState().setRightPanelTab('pixelart-character-properties')
  }, [])

  const handleClickAvatar = useCallback((char: SavedAvatarCharacter) => {
    useSavedAvatarCharactersStore.getState().selectCharacter(char.id)
    const existing = useAvatarCharacterStore.getState().characters.find((c) => c.savedAvatarCharacterId === char.id)
    if (existing) {
      useAvatarCharacterStore.getState().selectAvatarCharacter(existing.id)
      useEditorStore.getState().setRightPanelTab('avatar-character-properties')
      return
    }
    const id = useAvatarCharacterStore.getState().addAvatarCharacter({
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
    useEditorStore.getState().setRightPanelTab('avatar-character-properties')
  }, [])

  const handleCharacterClick = useCallback(
    (uc: UnifiedCharacter) => {
      if (uc.type === '2d' && uc.raw2D) handleClick2D(uc.raw2D)
      else if (uc.type === '3d' && uc.raw3D) handleClick3D(uc.raw3D)
      else if (uc.type === '1d' && uc.raw1D) handleClick1D(uc.raw1D)
      else if (uc.type === 'avatar' && uc.rawAvatar) handleClickAvatar(uc.rawAvatar)
    },
    [handleClick2D, handleClick3D, handleClick1D, handleClickAvatar],
  )

  const isSelected = useCallback(
    (uc: UnifiedCharacter) => {
      if (uc.type === '2d') return selected2D === uc.id
      if (uc.type === '3d') return selected3D === uc.id
      if (uc.type === '1d') return selected1D === uc.id
      if (uc.type === 'avatar') return selectedAV === uc.id
      return false
    },
    [selected2D, selected3D, selected1D, selectedAV],
  )

  // ── Render ──

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
              placeholder="Search characters..."
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
          {/* Type */}
          <div>
            <span className="text-[9px] text-gray-600 uppercase tracking-wider mb-1 block">Type</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setActiveTypes(new Set(['2d', '3d', '1d', 'avatar']))
                  setSortBy('newest')
                }}
                className={cn(
                  'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border',
                  activeTypes.size === 4 && sortBy === 'newest'
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
          {/* Sort */}
          <div>
            <span className="text-[9px] text-gray-600 uppercase tracking-wider mb-1 block">Sort by</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border',
                    sortBy === opt.id
                      ? 'bg-white text-black border-white/20'
                      : 'bg-transparent text-gray-500 border-white/5 hover:text-white hover:bg-[#2a2a2a]',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Grid ── */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {filteredCharacters.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {filteredCharacters.map((uc) => (
              <CharacterCard
                key={`${uc.type}-${uc.id}`}
                character={uc}
                onClick={() => handleCharacterClick(uc)}
                selected={isSelected(uc)}
                blobUrlsAV={blobUrlsAV}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600">
            <User size={28} className="mb-3" />
            <span className="text-sm text-gray-400">
              {allCharacters.length === 0 ? 'No characters yet' : 'No characters found'}
            </span>
            <span className="text-xs text-gray-600 mt-1">
              {allCharacters.length === 0
                ? 'Create your first character from the type panels'
                : 'Try a different search or filter'}
            </span>
          </div>
        )}
      </div>

      {/* ── Footer Actions ── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-t border-white/5">
        <button
          onClick={onManual ?? (() => useEditorStore.getState().setRightPanelTab('body'))}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium bg-[#2a2a2a] border border-white/5 text-gray-400 hover:text-white hover:bg-[#3a3a3a] transition-colors"
        >
          <Plus size={12} />
          Manual
        </button>
        <button
          onClick={onAIGenerate ?? (() => useEditorStore.getState().openCanvasOverlay('character-generator'))}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium bg-green-600 hover:bg-green-500 text-white transition-colors"
        >
          <Sparkles size={12} />
          AI Generate
        </button>
      </div>
    </div>
  )
}

// ── Character Card ──

function CharacterCard({
  character: uc,
  onClick,
  selected,
  blobUrlsAV,
}: {
  character: UnifiedCharacter
  onClick: () => void
  selected: boolean
  blobUrlsAV: Record<string, string>
}) {
  const badge = TYPE_BADGE[uc.type]
  const confirm = useConfirmDialog()
  const remove2D = useSavedCharactersStore((s) => s.removeCharacter)
  const remove3D = useSaved3DCharactersStore((s) => s.removeCharacter)
  const remove1D = useSavedPixelArtCharactersStore((s) => s.removeCharacter)
  const removeAV = useSavedAvatarCharactersStore((s) => s.removeCharacter)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!(await confirm({ title: 'Delete character', description: `Delete "${uc.name}"?` }))) return
    const removers = { '2d': remove2D, '3d': remove3D, '1d': remove1D, avatar: removeAV }
    removers[uc.type](uc.id)
  }

  const handleRig = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (uc.type === '3d') {
      useSaved3DCharactersStore.getState().selectCharacter(uc.id)
      useEditorStore.getState().setLeftPanelActiveTab('rig-editor-3d')
    } else if (uc.type === '2d') {
      useEditorStore.getState().setLeftPanelActiveTab('rig-editor')
    }
  }

  const canRig = uc.type === '2d' || uc.type === '3d'

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
        <CharacterThumbnail character={uc} blobUrlsAV={blobUrlsAV} />
      </div>

      {/* Name + type badge */}
      <div className="p-2 bg-panel-surface">
        <p className="text-xs text-gray-300 truncate font-medium">{uc.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-medium', badge.color)}>{badge.label}</span>
        </div>
      </div>

      {/* Hover action buttons */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        {canRig && (
          <button
            onClick={handleRig}
            className="w-6 h-6 bg-panel-bg/80 rounded-full flex items-center justify-center text-gray-400 hover:bg-green-500 hover:text-white transition-colors"
            title="Rig character"
          >
            <Bone size={11} />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="w-6 h-6 bg-panel-bg/80 rounded-full flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-colors"
          title="Delete character"
        >
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  )
}

// ── Thumbnail renderer per type ──

function CharacterThumbnail({
  character: uc,
  blobUrlsAV,
}: {
  character: UnifiedCharacter
  blobUrlsAV: Record<string, string>
}) {
  // 2D — composite body parts or fallback
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
