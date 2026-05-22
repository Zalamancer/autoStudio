import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import {
  Upload,
  Wand2,
  Loader2,
  X,
  AlertCircle,
  Save,
  User,
  Plus,
  Trash2,
  Check,
  Smile,
  ChevronDown,
  ChevronUp,
  Copy,
  Search,
  Bone,
  SlidersHorizontal,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PanelCategoryTabs } from '@/components/ui/panel-controls'
import { CreditCostTag } from '@/components/credits/CreditCostTag'
import { useCharacterConfigStore, useEditorStore, useCharacterPartsStore } from '@/stores'
import { generateAllVisemeSprites, getCurvatureLabel } from '@/services/nanoBanana'
import { generateAllEmotionHeads } from '@/services/emotionHeadGeneration'
import type { ExpressionVariantsResult } from '@/services/emotionHeadGeneration'
import type { GenerationProgress, CurvedVisemeSprites } from '@/types/nanoBanana'
import { VISEMES, CURVATURES, createEmptySpriteSet } from '@/types/nanoBanana'
import { buildVisemeSpriteMapFromCurved, buildVisemeSpriteMap, type SpriteEntry } from '@/services/visemeMapper'
import {
  EYE_VARIANTS,
  EYEBROW_VARIANTS,
  createEmptyEyeVariantSet,
  createEmptyEyebrowVariantSet,
  type EyeVariantSprites,
  type EyebrowVariantSprites,
} from '@/types/emotionHeads'
import { useSavedCharactersStore, type SavedCharacter, type CharacterPartTab } from '@/stores/useSavedCharactersStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { computeCharacterLayout, type AspectRatioKey } from '@/services/compositionEngine'
import { NB2ControlsSection } from './NB2ControlsSection'

type ViewMode = 'list' | 'create' | 'ai-generate'

const PART_LABELS: Record<CharacterPartTab, string> = {
  body: 'Body',
  head: 'Head',
  eye: 'Eye',
  eyebrow: 'Eyebrow',
  viseme: 'Mouth',
  hair: 'Hair',
  shirt: 'Shirt',
  pants: 'Pants',
  shoes: 'Shoes',
}

const PART_ORDER: CharacterPartTab[] = ['body', 'head', 'eye', 'eyebrow', 'viseme', 'hair', 'shirt', 'pants', 'shoes']

/** Small reusable image upload slot for a body part */
function PartUploadSlot({
  part,
  images,
  onAddImage,
  onRemoveImage,
}: {
  part: CharacterPartTab
  images: string[]
  onAddImage: (part: CharacterPartTab, dataUrl: string) => void
  onRemoveImage: (part: CharacterPartTab, index: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      if (dataUrl) onAddImage(part, dataUrl)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[10px] text-gray-500 uppercase tracking-wide">{PART_LABELS[part]}</label>
        {images.length > 0 && (
          <span className="text-[10px] text-accent">
            {images.length} sprite{images.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Sprite thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="relative group w-10 h-10 bg-white rounded border border-panel-border overflow-hidden"
            >
              <img src={img} alt={`${part} ${idx}`} className="w-full h-full object-contain" />
              <button
                onClick={() => onRemoveImage(part, idx)}
                className="absolute inset-0 bg-red-500/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X size={10} className="text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const files = e.target.files
          if (files) Array.from(files).forEach(handleFile)
          e.target.value = ''
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full py-1.5 px-3 border border-dashed border-panel-border rounded text-[10px] text-gray-400 hover:border-accent/30 hover:text-accent transition-colors flex items-center justify-center gap-1"
      >
        <Upload size={10} />
        Add {PART_LABELS[part]} Sprite{images.length > 0 ? 's' : ''}
      </button>
    </div>
  )
}

export function CharacterGeneratorPanel() {
  const initialOverlay = useEditorStore((s) => s.activeCanvasOverlay)
  const [viewMode, setViewMode] = useState<ViewMode>(initialOverlay === 'character-generator' ? 'ai-generate' : 'list')
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [characterName, setCharacterName] = useState('')
  const [stylePrompt, setStylePrompt] = useState('')
  const [generatedSprites, setGeneratedSprites] = useState<CurvedVisemeSprites>(createEmptySpriteSet)
  const [generatedEyeVariants, setGeneratedEyeVariants] = useState<EyeVariantSprites>(createEmptyEyeVariantSet)
  const [generatedEyebrowVariants, setGeneratedEyebrowVariants] =
    useState<EyebrowVariantSprites>(createEmptyEyebrowVariantSet)
  const [progress, setProgress] = useState<GenerationProgress | null>(null)
  const [emotionProgress, setEmotionProgress] = useState<GenerationProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [emotionError, setEmotionError] = useState<string | null>(null)
  const [aiSectionOpen, setAiSectionOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Search & filter state (Cinema standard)
  const [characterSearchQuery, setCharacterSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Body part images state
  const [bodyParts, setBodyParts] = useState<Record<CharacterPartTab, string[]>>({
    body: [],
    head: [],
    eye: [],
    eyebrow: [],
    viseme: [],
    hair: [],
    shirt: [],
    pants: [],
    shoes: [],
  })

  const { setCurvedVisemes, setUseCurvedVisemes, setEyeVariantSprites, setEyebrowVariantSprites } =
    useCharacterConfigStore()
  const {
    characters,
    addCharacter,
    removeCharacter,
    selectCharacter,
    selectedCharacterId,
    persistImages,
    hydrateCharacter,
  } = useSavedCharactersStore()
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const activeCanvasOverlay = useEditorStore((s) => s.activeCanvasOverlay)

  // Sync viewMode back to 'list' when the character-generator overlay closes
  useEffect(() => {
    if (viewMode === 'ai-generate' && activeCanvasOverlay !== 'character-generator') {
      setViewMode('list')
    }
  }, [activeCanvasOverlay, viewMode])

  // Body part handlers
  const handleAddPartImage = useCallback((part: CharacterPartTab, dataUrl: string) => {
    setBodyParts((prev) => ({
      ...prev,
      [part]: [...prev[part], dataUrl],
    }))
  }, [])

  const handleRemovePartImage = useCallback((part: CharacterPartTab, index: number) => {
    setBodyParts((prev) => ({
      ...prev,
      [part]: prev[part].filter((_, i) => i !== index),
    }))
  }, [])

  // Handle file upload for reference image
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setReferenceImage(dataUrl)
      setError(null)
      setEmotionError(null)
      setGeneratedSprites(createEmptySpriteSet())
      setGeneratedEyeVariants(createEmptyEyeVariantSet())
      setGeneratedEyebrowVariants(createEmptyEyebrowVariantSet())
      setProgress(null)
      setEmotionProgress(null)
    }
    reader.readAsDataURL(file)
  }, [])

  // Handle drag and drop for reference image
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      setReferenceImage(dataUrl)
      setError(null)
      setEmotionError(null)
      setGeneratedSprites(createEmptySpriteSet())
      setGeneratedEyeVariants(createEmptyEyeVariantSet())
      setGeneratedEyebrowVariants(createEmptyEyebrowVariantSet())
      setProgress(null)
      setEmotionProgress(null)
    }
    reader.readAsDataURL(file)
  }, [])

  // Start viseme generation
  const handleGenerate = useCallback(async () => {
    if (!referenceImage) return

    setError(null)
    setProgress({
      total: 24,
      completed: 0,
      current: '',
      status: 'generating',
    })

    try {
      const sprites = await generateAllVisemeSprites({ referenceImage, stylePrompt }, (p) => setProgress(p))
      setGeneratedSprites(sprites)
      setProgress({
        total: 24,
        completed: 24,
        current: '',
        status: 'complete',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed')
      setProgress(null)
    }
  }, [referenceImage, stylePrompt])

  // Start eye & eyebrow expression variant generation
  const handleGenerateExpressionVariants = useCallback(async () => {
    if (!referenceImage) return

    setEmotionError(null)
    setEmotionProgress({
      total: 12,
      completed: 0,
      current: '',
      status: 'generating',
    })

    try {
      const result: ExpressionVariantsResult = await generateAllEmotionHeads({ referenceImage, stylePrompt }, (p) =>
        setEmotionProgress(p),
      )
      setGeneratedEyeVariants(result.eyeVariants)
      setGeneratedEyebrowVariants(result.eyebrowVariants)
      setEmotionProgress({
        total: 12,
        completed: 12,
        current: '',
        status: 'complete',
      })
    } catch (err) {
      setEmotionError(err instanceof Error ? err.message : 'Expression variant generation failed')
      setEmotionProgress(null)
    }
  }, [referenceImage, stylePrompt])

  // Save character
  const handleSaveCharacter = useCallback(() => {
    if (!characterName.trim()) return

    const eyeVariantCount = Object.values(generatedEyeVariants).filter((v) => v !== null).length
    const eyebrowVariantCount = Object.values(generatedEyebrowVariants).filter((v) => v !== null).length
    const visemeCount = Object.values(generatedSprites).filter((v) => v !== null).length
    const totalParts = PART_ORDER.reduce((sum, p) => sum + bodyParts[p].length, 0)

    // If user didn't upload body parts via the form, also check the config store
    // (sprites from ImageConfigPanel sprite sheet cutting go to the config store)
    let finalBodyParts = totalParts > 0 ? bodyParts : undefined
    if (!finalBodyParts) {
      const configImages = useCharacterConfigStore.getState().savedImages
      const configPartsCount = PART_ORDER.reduce((sum, p) => sum + (configImages[p]?.length || 0), 0)
      if (configPartsCount > 0) {
        finalBodyParts = {
          body: configImages.body || [],
          head: configImages.head || [],
          eye: configImages.eye || [],
          eyebrow: configImages.eyebrow || [],
          viseme: configImages.viseme || [],
          hair: configImages.hair || [],
          shirt: configImages.shirt || [],
          pants: configImages.pants || [],
          shoes: configImages.shoes || [],
        }
      }
    }

    // Build a composite thumbnail from the first sprite of each part (body→eye→eyebrow→hair→viseme)
    // If no body parts, fall back to referenceImage or a blank placeholder
    const parts = finalBodyParts || bodyParts
    const thumbnail = referenceImage || parts.body[0] || parts.eye[0] || parts.hair[0] || parts.viseme[0] || '' // empty string means no image

    // Grab sprite labels from config store so they persist with the character
    const configSpriteLabels = useCharacterConfigStore.getState().spriteLabels

    // Build pre-computed viseme sprite map for flexible name matching
    let visemeSpriteMap = undefined
    if (visemeCount > 0) {
      // Canonical path: generated sprites already use curvature_VISEME format
      visemeSpriteMap = buildVisemeSpriteMapFromCurved(generatedSprites)
    } else if (finalBodyParts?.viseme && finalBodyParts.viseme.length > 0 && configSpriteLabels?.viseme) {
      // Body-part sprites with labels — try to build a map from labels
      const entries: SpriteEntry[] = finalBodyParts.viseme.map((src, i) => ({
        key: configSpriteLabels.viseme[i] || `sprite_${i}`,
        src,
      }))
      // Use sync heuristic only (no Gemini) during save to keep it fast
      buildVisemeSpriteMap(entries, { useGemini: false })
        .then((map) => {
          const { updateCharacter: update } = useSavedCharactersStore.getState()
          update(newCharacter.id, { visemeSpriteMap: map })
          useCharacterConfigStore.getState().setVisemeSpriteMap(map)
          persistImages(newCharacter.id).catch(() => {})
        })
        .catch(() => {})
    }

    // Capture current part transforms (may include auto-aligned values from NB2 pipeline)
    const currentTransforms = useCharacterPartsStore.getState().transforms
    const savedPartTransforms: Record<string, any> = {}
    for (const part of PART_ORDER) {
      const t = currentTransforms[part]
      if (t && (t.x !== 0 || t.y !== 0 || t.scaleX !== 1 || t.scaleY !== 1 || t.rotation !== 0)) {
        savedPartTransforms[part] = {
          x: t.x,
          y: t.y,
          rotation: t.rotation,
          scaleX: t.scaleX,
          scaleY: t.scaleY,
          visible: t.visible,
        }
      }
    }

    const newCharacter: SavedCharacter = {
      id: `char_${Date.now()}`,
      name: characterName.trim(),
      referenceImage: thumbnail,
      stylePrompt,
      curvedVisemes: generatedSprites,
      eyeVariants: eyeVariantCount > 0 ? generatedEyeVariants : undefined,
      eyebrowVariants: eyebrowVariantCount > 0 ? generatedEyebrowVariants : undefined,
      createdAt: Date.now(),
      bodyParts: finalBodyParts,
      spriteLabels: configSpriteLabels,
      visemeSpriteMap,
      ...(Object.keys(savedPartTransforms).length > 0 ? { partTransforms: savedPartTransforms } : {}),
    }

    addCharacter(newCharacter)
    selectCharacter(newCharacter.id)

    // Persist all image data to IndexedDB (localStorage only keeps lightweight metadata)
    persistImages(newCharacter.id).catch((err) =>
      console.warn('[CharacterGeneratorPanel] Failed to persist images:', err),
    )

    if (visemeCount > 0) {
      setCurvedVisemes(generatedSprites)
      setUseCurvedVisemes(true)
      // Also set the pre-computed map in config store for immediate playback
      if (visemeSpriteMap) {
        useCharacterConfigStore.getState().setVisemeSpriteMap(visemeSpriteMap)
      }
    }

    // Also set eye/eyebrow variants in the config store if generated
    if (eyeVariantCount > 0) {
      setEyeVariantSprites(generatedEyeVariants)
    }
    if (eyebrowVariantCount > 0) {
      setEyebrowVariantSprites(generatedEyebrowVariants)
    }

    // Load body part sprites into the character config store so CharacterComposite can render them
    if (totalParts > 0) {
      const { setSavedImages } = useCharacterConfigStore.getState()
      const { setSelectedSprite } = useCharacterPartsStore.getState()
      for (const part of PART_ORDER) {
        const images = bodyParts[part] || []
        setSavedImages(part, images)
        setSelectedSprite(part, images.length > 0 ? 0 : null)
      }
    }

    // Place character on canvas as a dialogue character with smart positioning
    const {
      characters: dialogueChars,
      addDialogueCharacter,
      selectDialogueCharacter,
    } = useMultiCharacterStore.getState()
    const { canvasWidth, canvasHeight } = useCanvasStore.getState()
    const { aspectRatio } = useEditorStore.getState()
    const charCount = dialogueChars.length + 1
    const layouts = computeCharacterLayout(charCount, aspectRatio as AspectRatioKey)
    const layout = layouts[charCount - 1] || layouts[0]
    const newDialogueId = addDialogueCharacter({
      name: newCharacter.name,
      savedCharacterId: newCharacter.id,
      position: {
        x: Math.round((layout.position.x * canvasWidth) / 100),
        y: Math.round((layout.position.y * canvasHeight) / 100),
      },
      scale: layout.scale,
      zIndex: dialogueChars.length,
      visible: true,
      locked: false,
      voiceId: null,
      color: '',
    })
    selectDialogueCharacter(newDialogueId)

    // Reset form and go back to list
    setCharacterName('')
    setStylePrompt('')
    setReferenceImage(null)
    setGeneratedSprites(createEmptySpriteSet())
    setGeneratedEyeVariants(createEmptyEyeVariantSet())
    setGeneratedEyebrowVariants(createEmptyEyebrowVariantSet())
    setProgress(null)
    setEmotionProgress(null)
    setBodyParts({ body: [], head: [], eye: [], eyebrow: [], viseme: [], hair: [], shirt: [], pants: [], shoes: [] })
    setAiSectionOpen(false)
    setViewMode('list')
  }, [
    referenceImage,
    characterName,
    stylePrompt,
    generatedSprites,
    generatedEyeVariants,
    generatedEyebrowVariants,
    bodyParts,
    addCharacter,
    selectCharacter,
    persistImages,
    setCurvedVisemes,
    setUseCurvedVisemes,
    setEyeVariantSprites,
    setEyebrowVariantSprites,
  ])

  // Use existing character
  const handleUseCharacter = useCallback(
    async (character: SavedCharacter) => {
      selectCharacter(character.id)

      // Hydrate from IndexedDB if not already loaded (images stripped from localStorage)
      if (!character._hydrated) {
        try {
          await hydrateCharacter(character.id)
        } catch (err) {
          console.warn('[CharacterGeneratorPanel] Failed to hydrate character:', err)
        }
      }

      // Re-read the character after hydration (the store may have updated it)
      const hydratedChar = useSavedCharactersStore.getState().characters.find((c) => c.id === character.id) || character

      const hasVisemes = Object.values(hydratedChar.curvedVisemes).some((v) => v !== null)
      if (hasVisemes) {
        setCurvedVisemes(hydratedChar.curvedVisemes)
        setUseCurvedVisemes(true)

        // Set or rebuild visemeSpriteMap for flexible name matching
        if (hydratedChar.visemeSpriteMap) {
          useCharacterConfigStore.getState().setVisemeSpriteMap(hydratedChar.visemeSpriteMap)
        } else {
          // Lazy migration: build map from existing curved visemes (instant for canonical keys)
          const map = buildVisemeSpriteMapFromCurved(hydratedChar.curvedVisemes)
          useCharacterConfigStore.getState().setVisemeSpriteMap(map)
          // Cache back to the saved character and IndexedDB
          const { updateCharacter: update, persistImages: persist } = useSavedCharactersStore.getState()
          update(character.id, { visemeSpriteMap: map })
          persist(character.id).catch(() => {})
        }
      }
      if (hydratedChar.eyeVariants) {
        setEyeVariantSprites(hydratedChar.eyeVariants)
      }
      if (hydratedChar.eyebrowVariants) {
        setEyebrowVariantSprites(hydratedChar.eyebrowVariants)
      }

      // Load body part sprites into the character config store so CharacterComposite can render them
      const { setSavedImages, setSpriteLabel, setUploadedImage } = useCharacterConfigStore.getState()
      const { setSelectedSprite } = useCharacterPartsStore.getState()
      const parts: CharacterPartTab[] = PART_ORDER
      for (const part of parts) {
        const images = hydratedChar.bodyParts?.[part] || []
        setSavedImages(part, images)
        // Select the saved sprite index or first sprite if available
        const savedIdx = hydratedChar.selectedSprites?.[part]
        setSelectedSprite(part, savedIdx !== null && savedIdx !== undefined ? savedIdx : images.length > 0 ? 0 : null)
        // Restore sprite labels
        const labels = hydratedChar.spriteLabels?.[part]
        if (labels) {
          for (const [idx, label] of Object.entries(labels)) {
            setSpriteLabel(part, Number(idx), label)
          }
        }
        // Restore uploaded sprite sheet
        const sheet = hydratedChar.uploadedSheets?.[part] ?? null
        setUploadedImage(part, sheet)
      }

      // Always apply visemeSpriteMap to config store if it exists on the character
      // (even when curvedVisemes is empty — visemes may be stored as bodyParts.viseme[])
      if (hydratedChar.visemeSpriteMap && !hasVisemes) {
        const mapFilled = Object.values(hydratedChar.visemeSpriteMap).some((v) => v !== null)
        if (mapFilled) {
          useCharacterConfigStore.getState().setVisemeSpriteMap(hydratedChar.visemeSpriteMap)
        }
      }

      // Build visemeSpriteMap from body-part viseme sprites + labels if not already present
      // This handles characters whose 24 viseme sprites are stored as bodyParts.viseme[]
      // with canonical-style labels (e.g. "Upward_REST", "Neutral_A/I") instead of curvedVisemes
      if (!hydratedChar.visemeSpriteMap) {
        const visemeSprites = hydratedChar.bodyParts?.viseme || []
        const visemeLabels = hydratedChar.spriteLabels?.viseme || {}
        if (visemeSprites.length > 0 && Object.keys(visemeLabels).length > 0) {
          const entries: SpriteEntry[] = visemeSprites.map((src, i) => ({
            key: visemeLabels[i] || `sprite_${i}`,
            src,
          }))
          // Build map asynchronously (Tier 1 canonical + Tier 2 heuristic + optional Tier 3 Gemini)
          buildVisemeSpriteMap(entries, { useGemini: false })
            .then((map) => {
              const hasAny = Object.values(map).some((v) => v !== null)
              if (hasAny) {
                useCharacterConfigStore.getState().setVisemeSpriteMap(map)
                const { updateCharacter: update, persistImages: persist } = useSavedCharactersStore.getState()
                update(character.id, { visemeSpriteMap: map })
                persist(character.id).catch(() => {})
                console.log(
                  '[CharacterGeneratorPanel] Built visemeSpriteMap from body-part labels:',
                  Object.values(map).filter((v) => v !== null).length + '/24',
                )
              }
            })
            .catch(() => {})
        }
      }

      // Ensure the character is on canvas as a dialogue character
      // (If it's not already on canvas, create one at center)
      const {
        characters: dialogueChars,
        addDialogueCharacter,
        selectDialogueCharacter,
      } = useMultiCharacterStore.getState()
      const existingOnCanvas = dialogueChars.find((dc) => dc.savedCharacterId === character.id)
      if (existingOnCanvas) {
        selectDialogueCharacter(existingOnCanvas.id)
      } else {
        const { canvasWidth, canvasHeight } = useCanvasStore.getState()

        // Build defaultSpriteOverrides from saved selectedSprites
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

        // Convert SavedPartTransform to CharPartTransform for DialogueCharacter
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
        // Read timeline state for clip placement and character frame range
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

      setRightPanelTab('group-properties')
    },
    [
      selectCharacter,
      hydrateCharacter,
      setCurvedVisemes,
      setUseCurvedVisemes,
      setEyeVariantSprites,
      setEyebrowVariantSprites,
      setRightPanelTab,
    ],
  )

  // Delete character
  const handleDeleteCharacter = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      removeCharacter(id)
    },
    [removeCharacter],
  )

  // Duplicate a saved character (deep copy with new id)
  const handleDuplicateCharacter = useCallback(
    async (e: React.MouseEvent, char: SavedCharacter) => {
      e.stopPropagation()
      // Ensure the source is hydrated (images loaded from IndexedDB)
      if (!char._hydrated) {
        await hydrateCharacter(char.id)
        char = useSavedCharactersStore.getState().characters.find((c) => c.id === char.id) || char
      }
      const newId = `char_${Date.now()}`
      const duplicate: SavedCharacter = {
        ...char,
        id: newId,
        name: `${char.name} (Copy)`,
        createdAt: Date.now(),
        // Deep-copy mutable objects to avoid shared references
        curvedVisemes: { ...char.curvedVisemes },
        ...(char.bodyParts
          ? {
              bodyParts: {
                body: [...char.bodyParts.body],
                head: [...(char.bodyParts.head || [])],
                eye: [...char.bodyParts.eye],
                eyebrow: [...char.bodyParts.eyebrow],
                viseme: [...char.bodyParts.viseme],
                hair: [...char.bodyParts.hair],
                shirt: [...char.bodyParts.shirt],
                pants: [...char.bodyParts.pants],
                shoes: [...char.bodyParts.shoes],
              },
            }
          : {}),
        ...(char.eyeVariants ? { eyeVariants: { ...char.eyeVariants } } : {}),
        ...(char.eyebrowVariants ? { eyebrowVariants: { ...char.eyebrowVariants } } : {}),
        ...(char.selectedSprites ? { selectedSprites: { ...char.selectedSprites } } : {}),
        ...(char.partTransforms ? { partTransforms: JSON.parse(JSON.stringify(char.partTransforms)) } : {}),
        ...(char.spriteLabels ? { spriteLabels: JSON.parse(JSON.stringify(char.spriteLabels)) } : {}),
        ...(char.visemeSpriteMap ? { visemeSpriteMap: JSON.parse(JSON.stringify(char.visemeSpriteMap)) } : {}),
      }
      addCharacter(duplicate)
      await persistImages(newId)
      selectCharacter(newId)
    },
    [addCharacter, persistImages, selectCharacter, hydrateCharacter],
  )

  // Cancel create mode
  const handleCancelCreate = useCallback(() => {
    setCharacterName('')
    setStylePrompt('')
    setReferenceImage(null)
    setGeneratedSprites(createEmptySpriteSet())
    setGeneratedEyeVariants(createEmptyEyeVariantSet())
    setGeneratedEyebrowVariants(createEmptyEyebrowVariantSet())
    setProgress(null)
    setEmotionProgress(null)
    setError(null)
    setEmotionError(null)
    setBodyParts({ body: [], head: [], eye: [], eyebrow: [], viseme: [], hair: [], shirt: [], pants: [], shoes: [] })
    setAiSectionOpen(false)
    setViewMode('list')
  }, [])

  // Count generated sprites
  const generatedCount = Object.values(generatedSprites).filter((v) => v !== null).length
  const eyeVariantCount = Object.values(generatedEyeVariants).filter((v) => v !== null).length
  const eyebrowVariantCount = Object.values(generatedEyebrowVariants).filter((v) => v !== null).length
  const expressionVariantCount = eyeVariantCount + eyebrowVariantCount
  const totalPartSprites = PART_ORDER.reduce((sum, p) => sum + bodyParts[p].length, 0)
  const canSave = !!characterName.trim()
  const visemesComplete = generatedCount > 0 && progress?.status === 'complete'

  // ── Cinema standard: filtered characters ──
  const CHARACTER_CATEGORIES = [
    { id: 'all', label: 'All' },
    { id: 'parts', label: 'With Parts' },
    { id: 'expressions', label: 'Expressions' },
  ]

  const filteredCharacters = useMemo(() => {
    const q = characterSearchQuery.toLowerCase().trim()
    let result = characters
    if (categoryFilter === 'parts') {
      result = result.filter((c) => c.bodyParts && Object.values(c.bodyParts).some((arr) => arr.length > 0))
    } else if (categoryFilter === 'expressions') {
      result = result.filter(
        (c) =>
          (c.eyeVariants && Object.values(c.eyeVariants).some((v) => v !== null)) ||
          (c.eyebrowVariants && Object.values(c.eyebrowVariants).some((v) => v !== null)),
      )
    }
    if (q) {
      result = result.filter(
        (c) => c.name.toLowerCase().includes(q) || (c.stylePrompt?.toLowerCase().includes(q) ?? false),
      )
    }
    return result
  }, [characters, categoryFilter, characterSearchQuery])

  const hasActiveFilter = categoryFilter !== 'all'

  // Validate an image URL is complete (not truncated from localStorage thumbnail)
  const isValidSrc = (url: string | null | undefined): url is string =>
    !!url &&
    url.length > 300 &&
    (url.startsWith('http') || url.startsWith('blob:') || (url.startsWith('data:image/') && url.includes(';base64,')))

  // Get character thumbnail - prefer body parts composite, fall back to reference image, _thumbnail, then placeholder
  const getCharThumbnail = (char: SavedCharacter) => {
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
      ]
      for (const c of candidates) {
        if (isValidSrc(c)) return c
      }
    }
    // Fall back to small localStorage thumbnail (survives IndexedDB loss)
    if (char._thumbnail && char._thumbnail.startsWith('data:image/')) return char._thumbnail
    return null
  }

  // LIST VIEW - Shows saved characters in 2-column grid
  const handleCreateNew = useCallback(() => {
    setCharacterName('')
    setStylePrompt('')
    setReferenceImage(null)
    setGeneratedSprites(createEmptySpriteSet())
    setGeneratedEyeVariants(createEmptyEyeVariantSet())
    setGeneratedEyebrowVariants(createEmptyEyebrowVariantSet())
    setProgress(null)
    setEmotionProgress(null)
    setError(null)
    setEmotionError(null)
    setBodyParts({ body: [], head: [], eye: [], eyebrow: [], viseme: [], hair: [], shirt: [], pants: [], shoes: [] })
    setAiSectionOpen(false)
    const configStore = useCharacterConfigStore.getState()
    const partsStore = useCharacterPartsStore.getState()
    for (const part of PART_ORDER) {
      configStore.setSavedImages(part, [])
      partsStore.setSelectedSprite(part, null)
    }
    configStore.clearCurvedVisemes()
    configStore.clearEyeVariantSprites()
    configStore.clearEyebrowVariantSprites()
    selectCharacter(null)
    setViewMode('create')
  }, [selectCharacter])

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* ── Search + Filter Toggle (Cinema standard) ── */}
        <div className="shrink-0 px-3 py-2">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                value={characterSearchQuery}
                onChange={(e) => setCharacterSearchQuery(e.target.value)}
                placeholder="Search characters..."
                className="w-full pl-8 pr-3 py-2 bg-zinc-800 rounded-lg text-sm text-zinc-200 placeholder-zinc-600 border border-white/5 focus:border-accent/30 focus:outline-none"
              />
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn(
                'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors relative',
                filtersOpen ? 'bg-accent/20 text-accent' : 'text-zinc-500 hover:text-zinc-200 hover:bg-panel-surface',
              )}
            >
              <SlidersHorizontal size={14} />
              {hasActiveFilter && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent" />}
            </button>
          </div>
        </div>

        {/* ── Category filter (hidden by default) ── */}
        {filtersOpen && (
          <div className="shrink-0 px-3 pb-2">
            <PanelCategoryTabs
              tabs={CHARACTER_CATEGORIES}
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
              {filteredCharacters.map((char) => {
                const hasExpressions =
                  (char.eyeVariants && Object.values(char.eyeVariants).some((v) => v !== null)) ||
                  (char.eyebrowVariants && Object.values(char.eyebrowVariants).some((v) => v !== null))
                const hasBodyParts = char.bodyParts && Object.values(char.bodyParts).some((arr) => arr.length > 0)
                const thumb = getCharThumbnail(char)
                return (
                  <div
                    key={char.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/x-saved-character', JSON.stringify({ id: char.id }))
                      e.dataTransfer.effectAllowed = 'copy'
                    }}
                    onClick={() => handleUseCharacter(char)}
                    className={cn(
                      'relative group cursor-pointer rounded-lg border overflow-hidden transition-all',
                      selectedCharacterId === char.id
                        ? 'border-accent ring-2 ring-accent/30'
                        : 'border-white/5 hover:border-panel-border',
                    )}
                  >
                    {/* Character Thumbnail — composite of body parts using selected sprites + transforms */}
                    <div className="aspect-square bg-panel-bg overflow-hidden relative flex items-center justify-center">
                      {hasBodyParts && char.bodyParts ? (
                        (() => {
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
                          const bodyImg = char.bodyParts!.body?.[bodyIdx] || char.bodyParts!.body?.[0]
                          const headImg = char.bodyParts!.head?.[headIdx] || char.bodyParts!.head?.[0]
                          const eyeImg = char.bodyParts!.eye?.[eyeIdx] || char.bodyParts!.eye?.[0]
                          const eyebrowImg = char.bodyParts!.eyebrow?.[eyebrowIdx] || char.bodyParts!.eyebrow?.[0]
                          const hairImg = char.bodyParts!.hair?.[hairIdx] || char.bodyParts!.hair?.[0]
                          const visemeImg = char.bodyParts!.viseme?.[visemeIdx] || char.bodyParts!.viseme?.[0]
                          const shirtImg = char.bodyParts!.shirt?.[shirtIdx] || char.bodyParts!.shirt?.[0]
                          const pantsImg = char.bodyParts!.pants?.[pantsIdx] || char.bodyParts!.pants?.[0]
                          const shoesImg = char.bodyParts!.shoes?.[shoesIdx] || char.bodyParts!.shoes?.[0]
                          const pt = char.partTransforms as
                            | Record<
                                string,
                                {
                                  x: number
                                  y: number
                                  rotation: number
                                  scaleX: number
                                  scaleY: number
                                  visible: boolean
                                }
                              >
                            | undefined
                          // Default layer order for thumbnail z-index (9 layers)
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
                                // Scale translate from canvas pixels (200px base) to percentage of thumbnail
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
                        })()
                      ) : thumb ? (
                        <img src={thumb} alt={char.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-b from-[#2a2a3a] to-[#1e1e2e] flex flex-col items-center justify-center gap-1">
                          <span className="text-2xl font-bold text-accent/60">{char.name.charAt(0).toUpperCase()}</span>
                          <span className="text-[9px] text-gray-500">No preview</span>
                        </div>
                      )}
                    </div>

                    {/* Character Name */}
                    <div className="p-2 bg-panel-surface">
                      <p className="text-xs text-gray-300 truncate font-medium">{char.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {char.stylePrompt && (
                          <p className="text-[10px] text-gray-500 truncate flex-1">{char.stylePrompt}</p>
                        )}
                        {hasBodyParts && (
                          <span className="text-[9px] px-1 py-0.5 bg-accent/20 text-accent rounded flex-shrink-0">
                            parts
                          </span>
                        )}
                        {hasExpressions && (
                          <span className="text-[9px] px-1 py-0.5 bg-accent/10 text-accent rounded flex-shrink-0">
                            expressions
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selected Badge */}
                    {selectedCharacterId === char.id && (
                      <div className="absolute top-2 left-2 w-5 h-5 bg-accent rounded-full flex items-center justify-center">
                        <Check size={12} className="text-white" />
                      </div>
                    )}

                    {/* Action Buttons (hover) */}
                    <div
                      className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20"
                      onDragStart={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleUseCharacter(char)
                          useEditorStore.getState().setLeftPanelActiveTab('rig-editor')
                        }}
                        className="w-6 h-6 bg-panel-bg/80 rounded-full flex items-center justify-center hover:bg-green-500"
                        title="Rig character"
                      >
                        <Bone size={11} className="text-gray-400 hover:text-white" />
                      </button>
                      <button
                        onClick={(e) => handleDuplicateCharacter(e, char)}
                        className="w-6 h-6 bg-panel-bg/80 rounded-full flex items-center justify-center hover:bg-blue-500"
                        title="Duplicate character"
                      >
                        <Copy size={11} className="text-gray-400 hover:text-white" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCharacter(e, char.id)}
                        className="w-6 h-6 bg-panel-bg/80 rounded-full flex items-center justify-center hover:bg-red-500"
                        title="Delete character"
                      >
                        <Trash2 size={12} className="text-gray-400 hover:text-white" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <User size={28} className="mb-3" />
              <span className="text-sm text-gray-400">
                {characters.length === 0 ? 'No characters yet' : 'No characters found'}
              </span>
              <span className="text-xs text-gray-600 mt-1">
                {characters.length === 0 ? 'Create your first character below' : 'Try a different search or filter'}
              </span>
            </div>
          )}
        </div>

        {/* ── Footer (Cinema standard) ── */}
        <div className="shrink-0 px-3 py-2 border-t border-white/5">
          <div className="flex gap-2">
            <button
              onClick={handleCreateNew}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium bg-panel-surface text-gray-400 border border-white/5 hover:bg-panel-surface-hover hover:text-gray-200 transition-colors"
            >
              <Plus size={13} />
              Manual
            </button>
            <button
              onClick={() => {
                setViewMode('ai-generate')
                useEditorStore.getState().openCanvasOverlay('character-generator')
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              <Wand2 size={13} />
              AI Generate
            </button>
          </div>
        </div>
      </div>
    )
  }

  // AI GENERATE VIEW — NB2 controls inline in left panel
  if (viewMode === 'ai-generate') {
    return <NB2ControlsSection />
  }

  // MANUAL CREATE VIEW - upload sprites per body part (Cinema standard shell)
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Back header ── */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <button
          onClick={handleCancelCreate}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          <ArrowLeft size={14} />
          Back
        </button>
        <div className="flex items-center gap-1.5 ml-auto">
          <Plus size={14} className="text-accent" />
          <span className="text-xs font-medium text-gray-300">Create Character</span>
        </div>
      </div>

      {/* ── Scrollable form ── */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {/* Character Name */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500">Character Name *</label>
          <div className="relative">
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="e.g. Alex, Robot Helper..."
              className="w-full bg-panel-surface border border-panel-border rounded-lg py-2 pl-9 pr-3 text-sm text-white placeholder:text-gray-600 focus:border-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Style Prompt */}
        <div className="space-y-1.5">
          <label className="text-xs text-gray-500">Style Prompt (optional)</label>
          <textarea
            value={stylePrompt}
            onChange={(e) => setStylePrompt(e.target.value)}
            placeholder="e.g. anime style, cartoon, realistic..."
            rows={2}
            className="w-full bg-panel-surface border border-panel-border rounded-lg py-2 px-3 text-sm text-white placeholder:text-gray-600 focus:border-accent focus:outline-none resize-none"
          />
        </div>

        {/* ===== Body Part Sprites ===== */}
        <div className="space-y-3 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">Body Part Sprites</p>
            {totalPartSprites > 0 && <span className="text-[10px] text-accent">{totalPartSprites} total</span>}
          </div>
          <p className="text-[10px] text-gray-500">
            Upload sprites for each body layer. Layers stack: body → shoes → pants → shirt → eye → eyebrow → mouth →
            hair.
          </p>

          {PART_ORDER.map((part) => (
            <PartUploadSlot
              key={part}
              part={part}
              images={bodyParts[part]}
              onAddImage={handleAddPartImage}
              onRemoveImage={handleRemovePartImage}
            />
          ))}
        </div>

        {/* Reference Image Upload (optional, for AI generation) */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <label className="text-xs text-gray-500">Reference Image (optional, for AI generation)</label>
          <div
            className={cn(
              'relative border-2 border-dashed rounded-lg transition-colors cursor-pointer',
              'hover:border-accent/30 hover:bg-panel-surface-hover/30',
              referenceImage ? 'border-accent/30 bg-panel-surface-hover/20' : 'border-panel-border',
            )}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
          >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

            {referenceImage ? (
              <div className="p-3">
                <div className="relative aspect-square bg-white rounded-lg overflow-hidden max-w-[80px] mx-auto">
                  <img src={referenceImage ?? undefined} alt="Reference" className="w-full h-full object-contain" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setReferenceImage(null)
                      setGeneratedSprites(createEmptySpriteSet())
                      setGeneratedEyeVariants(createEmptyEyeVariantSet())
                      setGeneratedEyebrowVariants(createEmptyEyebrowVariantSet())
                      setProgress(null)
                      setEmotionProgress(null)
                    }}
                    className="absolute top-1 right-1 p-1 bg-panel-surface/80 rounded-full hover:bg-red-500/80 transition-colors"
                  >
                    <X size={10} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 text-center">
                <Upload size={16} className="mx-auto text-gray-500 mb-1" />
                <p className="text-[10px] text-gray-400">Drop image or click (for AI)</p>
              </div>
            )}
          </div>
        </div>

        {/* ===== OPTIONAL: AI Generation (collapsible) ===== */}
        <div className="pt-2 border-t border-white/5">
          <button
            onClick={() => setAiSectionOpen(!aiSectionOpen)}
            className="w-full flex items-center justify-between py-1 text-[10px] text-gray-500 uppercase tracking-wider font-medium hover:text-gray-300 transition-colors"
          >
            <span className="flex items-center gap-1">
              <Wand2 size={10} />
              AI Generation (Optional)
            </span>
            {aiSectionOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>

          {aiSectionOpen && (
            <div className="space-y-2 mt-2">
              <p className="text-[10px] text-gray-500">Requires a reference image above.</p>

              {/* Generate Viseme Button */}
              <button
                onClick={handleGenerate}
                disabled={!referenceImage || progress?.status === 'generating'}
                className={cn(
                  'w-full py-2 px-4 rounded-lg font-medium text-xs',
                  'flex items-center justify-center gap-2',
                  'transition-all duration-200',
                  referenceImage && progress?.status !== 'generating'
                    ? 'bg-accent hover:bg-accent-hover text-white'
                    : 'bg-panel-surface-hover text-gray-500 cursor-not-allowed',
                )}
              >
                {progress?.status === 'generating' ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Generating Visemes...
                  </>
                ) : visemesComplete ? (
                  <>
                    <Check size={14} />
                    Regenerate 8x3 Viseme Sheet
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    Generate 8x3 Viseme Sheet
                    <CreditCostTag operation="vertex-sprite-sheet" />
                  </>
                )}
              </button>

              {/* Viseme Progress Bar */}
              {progress?.status === 'generating' && (
                <div className="space-y-1">
                  <div className="h-1.5 bg-panel-surface-hover rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${(progress!.completed / progress!.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-500">
                    <span>{progress!.current || 'Processing...'}</span>
                    <span>
                      {progress!.completed}/{progress!.total}
                    </span>
                  </div>
                </div>
              )}

              {/* Viseme Error */}
              {error && (
                <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                  <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              {/* Generated Viseme Sprites Preview */}
              {generatedCount > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-medium text-gray-400">Viseme Sprites</h4>
                    <span className="text-[10px] text-accent">{generatedCount}/24</span>
                  </div>

                  {CURVATURES.map((curvature) => (
                    <div key={curvature} className="space-y-1">
                      <p className="text-[10px] text-gray-500">{getCurvatureLabel(curvature)}</p>
                      <div className="grid grid-cols-8 gap-0.5">
                        {VISEMES.map((viseme) => {
                          const key = `${curvature}_${viseme}` as const
                          const sprite = generatedSprites[key]
                          return (
                            <div
                              key={key}
                              className={cn(
                                'aspect-square rounded-sm border overflow-hidden',
                                sprite ? 'border-accent/30 bg-white' : 'border-panel-border bg-panel-surface/80',
                              )}
                              title={key}
                            >
                              {sprite && <img src={sprite} alt={key} className="w-full h-full object-contain" />}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Expression Variants (appears after visemes are complete) */}
              {visemesComplete && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">
                    Eye & Eyebrow Expressions (Optional)
                  </p>

                  <button
                    onClick={handleGenerateExpressionVariants}
                    disabled={!referenceImage || emotionProgress?.status === 'generating'}
                    className={cn(
                      'w-full py-2 px-4 rounded-lg font-medium text-xs',
                      'flex items-center justify-center gap-2',
                      'transition-all duration-200',
                      referenceImage && emotionProgress?.status !== 'generating'
                        ? 'bg-purple-500 hover:bg-purple-400 text-white'
                        : 'bg-panel-surface-hover text-gray-500 cursor-not-allowed',
                    )}
                  >
                    {emotionProgress?.status === 'generating' ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Generating Expressions...
                      </>
                    ) : expressionVariantCount > 0 ? (
                      <>
                        <Check size={14} />
                        Regenerate Expression Variants
                      </>
                    ) : (
                      <>
                        <Smile size={14} />
                        Generate Expression Variants
                        <CreditCostTag operation="vertex-emotion-heads" />
                      </>
                    )}
                  </button>

                  {emotionProgress?.status === 'generating' && (
                    <div className="space-y-1">
                      <div className="h-1.5 bg-panel-surface-hover rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all duration-300"
                          style={{ width: `${(emotionProgress!.completed / emotionProgress!.total) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-500">
                        <span>{emotionProgress!.current || 'Processing...'}</span>
                        <span>
                          {emotionProgress!.completed}/{emotionProgress!.total}
                        </span>
                      </div>
                    </div>
                  )}

                  {emotionError && (
                    <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                      <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-red-400">{emotionError}</p>
                    </div>
                  )}

                  {expressionVariantCount > 0 && (
                    <div className="space-y-2">
                      {/* Eye Variants */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-gray-400">Eye Variants</h4>
                        <span className="text-[10px] text-purple-400">{eyeVariantCount}/6</span>
                      </div>
                      <div className="grid grid-cols-6 gap-0.5">
                        {EYE_VARIANTS.map((variant) => {
                          const sprite = generatedEyeVariants[variant]
                          return (
                            <div
                              key={`eye_${variant}`}
                              className={cn(
                                'aspect-square rounded-sm border overflow-hidden',
                                sprite ? 'border-purple-500/30 bg-white' : 'border-panel-border bg-panel-surface/80',
                              )}
                              title={`Eye: ${variant}`}
                            >
                              {sprite && (
                                <img src={sprite} alt={`eye ${variant}`} className="w-full h-full object-contain" />
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Eyebrow Variants */}
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-medium text-gray-400">Eyebrow Variants</h4>
                        <span className="text-[10px] text-purple-400">{eyebrowVariantCount}/6</span>
                      </div>
                      <div className="grid grid-cols-6 gap-0.5">
                        {EYEBROW_VARIANTS.map((variant) => {
                          const sprite = generatedEyebrowVariants[variant]
                          return (
                            <div
                              key={`eyebrow_${variant}`}
                              className={cn(
                                'aspect-square rounded-sm border overflow-hidden',
                                sprite ? 'border-purple-500/30 bg-white' : 'border-panel-border bg-panel-surface/80',
                              )}
                              title={`Eyebrow: ${variant}`}
                            >
                              {sprite && (
                                <img src={sprite} alt={`eyebrow ${variant}`} className="w-full h-full object-contain" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Save Character Button */}
        <button
          onClick={handleSaveCharacter}
          disabled={!canSave}
          className={cn(
            'w-full py-2.5 px-4 rounded-lg font-medium text-sm',
            'flex items-center justify-center gap-2',
            'transition-all duration-200',
            canSave
              ? 'bg-blue-500 hover:bg-blue-400 text-white'
              : 'bg-panel-surface-hover text-gray-500 cursor-not-allowed',
          )}
        >
          <Save size={16} />
          {!characterName.trim()
            ? 'Enter a name to save'
            : generatedCount > 0 && expressionVariantCount > 0
              ? `Save Character (${generatedCount} visemes + ${expressionVariantCount} expressions)`
              : generatedCount > 0
                ? `Save Character (${generatedCount} visemes)`
                : totalPartSprites > 0
                  ? `Save Character (${totalPartSprites} sprites)`
                  : 'Save Character'}
        </button>
      </div>
    </div>
  )
}
