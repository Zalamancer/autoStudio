import React, { useRef, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import {
  useMultiCharacterStore,
  type DialogueCharacter,
  type DialogueLine,
  createDefaultPartTransforms,
} from '@/stores/useMultiCharacterStore'
import { useSavedCharactersStore, type SavedCharacter } from '@/stores/useSavedCharactersStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import type { Viseme } from '@/types/voice'
import type { MouthCurvature } from '@/types/nanoBanana'
import { getCurvatureFromEmotion, detectEmotionFromText, getExpressionFromEmotion } from '@/services/emotionMapping'
import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useCharacterPartsStore, type LayerPart } from '@/stores/useCharacterPartsStore'
import type { CharacterPartTab } from '@/stores/useSavedCharactersStore'
import { useKeyframeRecorder } from '@/hooks/useKeyframeRecorder'
import { SelectionTransformBox, type LiveTransformValues } from './SelectionTransformBox'
import { useLiveTransformStore } from '@/stores/useLiveTransformStore'
import { resolveVisemeSprite } from '@/services/visemeMapper'
import { useRigStore } from '@/stores/useRigStore'
import { RigPlaybackViewer, type RigPlaybackViewerHandle, type ClothingLayerInput } from '@bonerigging/editor'
import { SVGElementRigRenderer } from './SVGElementRigRenderer'
import { getComposedFilterStyle } from '@/services/boilingLineEffect'
import {
  getPixelatedFromCache,
  preCachePixelArt,
  clearPixelArtCache,
  pixelateCanvasToOverlay,
} from '@/services/pixelArtEffect'
import {
  getEffectFromCache,
  preCacheEffect,
  clearEffectCache,
  processEffectOverlay,
  getAnimatedSeed,
  isEffectEnabled,
} from '@/services/effects/effectDispatcher'
import { isSVGFilterEffect, getStyleEffectFilterStyle } from '@/services/styleEffectFilters'
import type { SerializedRigData } from '@bonerigging/core'
import { loadCachedRig } from '@/services/rigCache'

/**
 * Validate an image URL is complete and usable as an <img> src.
 * Catches truncated base64 strings from localStorage (first 200 chars only)
 * and empty strings that trigger browser re-downloads.
 */
function isValidImageSrc(url: string | null | undefined): url is string {
  if (!url || url.length < 50) return false
  if (url.startsWith('data:image/')) {
    // Must have the base64 marker and be reasonably long (truncated thumbnails are ~200 chars)
    return url.includes(';base64,') && url.length > 300
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return true
  }
  return false
}

const PART_ORDER: CharacterPartTab[] = ['body', 'head', 'eye', 'eyebrow', 'viseme', 'hair', 'shirt', 'pants', 'shoes']

/**
 * Sync a saved character's image data into useCharacterConfigStore and
 * useCharacterPartsStore so that all panels show the correct assets when
 * switching between characters on the canvas.
 */
function syncSavedCharacterToConfigStore(saved: import('@/stores/useSavedCharactersStore').SavedCharacter) {
  const configStore = useCharacterConfigStore.getState()
  const partsStore = useCharacterPartsStore.getState()

  // Sync curved visemes
  const hasVisemes = saved.curvedVisemes && Object.values(saved.curvedVisemes).some((v) => v !== null)
  if (hasVisemes) {
    configStore.setCurvedVisemes(saved.curvedVisemes)
    configStore.setUseCurvedVisemes(true)
    if (saved.visemeSpriteMap) {
      configStore.setVisemeSpriteMap(saved.visemeSpriteMap)
    }
  }

  // Sync eye/eyebrow variants
  if (saved.eyeVariants) {
    configStore.setEyeVariantSprites(saved.eyeVariants)
  }
  if (saved.eyebrowVariants) {
    configStore.setEyebrowVariantSprites(saved.eyebrowVariants)
  }

  // Sync body part sprites
  for (const part of PART_ORDER) {
    const images = saved.bodyParts?.[part] || []
    configStore.setSavedImages(part, images)
    const savedIdx = saved.selectedSprites?.[part]
    partsStore.setSelectedSprite(
      part,
      savedIdx !== null && savedIdx !== undefined ? savedIdx : images.length > 0 ? 0 : null,
    )
    const labels = saved.spriteLabels?.[part]
    if (labels) {
      for (const [idx, label] of Object.entries(labels)) {
        configStore.setSpriteLabel(part, Number(idx), label)
      }
    }
    const sheet = saved.uploadedSheets?.[part] ?? null
    configStore.setUploadedImage(part, sheet)
  }
}

interface MultiCharacterLayerProps {
  character: DialogueCharacter
  isSelected: boolean
  containerWidth: number
  containerHeight: number
}

/**
 * Renders a dialogue character on the canvas with sprite support and lip sync.
 * Replaces the old placeholder CharacterLayer for multi-character dialogue mode.
 */
export const MultiCharacterLayer = React.memo(function MultiCharacterLayer({
  character,
  isSelected,
  containerWidth: _containerWidth,
  containerHeight: _containerHeight,
}: MultiCharacterLayerProps) {
  const selectDialogueCharacter = useMultiCharacterStore((s) => s.selectDialogueCharacter)
  const removeDialogueCharacter = useMultiCharacterStore((s) => s.removeDialogueCharacter)
  const updateDialogueCharacter = useMultiCharacterStore((s) => s.updateDialogueCharacter)
  const selectSavedCharacter = useSavedCharactersStore((s) => s.selectCharacter)
  const setRightPanelTab = useEditorStore((s) => s.setRightPanelTab)
  const { recordIfEnabled } = useKeyframeRecorder()
  const targetRef = useRef<HTMLDivElement>(null)
  const visemeImgRefA = useRef<HTMLImageElement>(null)
  const visemeImgRefB = useRef<HTMLImageElement>(null)
  const activeVisemeSlot = useRef<'A' | 'B'>('A')
  const eyeImgRef = useRef<HTMLImageElement>(null)
  const eyebrowImgRef = useRef<HTMLImageElement>(null)
  const setLiveTransform = useLiveTransformStore((s) => s.setLiveTransform)
  const clearLiveTransform = useLiveTransformStore((s) => s.clearLiveTransform)

  // Per-character part transforms and layer order (with backwards-compat defaults)
  const DEFAULT_LAYER_ORDER: LayerPart[] = [
    'body',
    'shirt',
    'pants',
    'shoes',
    'head',
    'eye',
    'eyebrow',
    'viseme',
    'hair',
  ]
  const layerOrder = character.layerOrder || DEFAULT_LAYER_ORDER
  const partTransforms = useMemo(
    () => character.partTransforms || createDefaultPartTransforms(),
    [character.partTransforms],
  )

  // Auto-load cached rig for characters that have been rigged before.
  // Runs once on mount so the rigged character appears on the canvas
  // without the user needing to open the rig editor tab first.
  useEffect(() => {
    if (character.renderMode === 'rigged' && character.rigId) return
    if (!character.savedCharacterId) return
    loadCachedRig(character.savedCharacterId, character.id).catch(() => {})
  }, [character.savedCharacterId, character.id, character.renderMode, character.rigId])

  // Per-character rig values only — no global fallback.
  // The global useCharacterPartsStore is for single-character mode (CharacterComposite).
  // In multi-character mode each DialogueCharacter carries its own renderMode/rigId
  // so that rigging one character doesn't leak to every other character on the canvas.
  const effectiveRigId = character.rigId || null
  const effectiveRenderMode = character.renderMode || undefined

  // Pre-parse serialized rig data so we can read image dimensions for bounding box
  const rigStoreData = useRigStore((s) => (effectiveRigId ? s.rigs[effectiveRigId] : null))
  // Detect SVG-native rig: vector source with element skinning data
  const hasSvgRig = !!rigStoreData?.svgSource && !!rigStoreData?.svgElementSkinning
  const activePoseTrackId = useRigStore((s) => s.activePoseTrackId)
  const charPoseTrackId = useRigStore((s) => s.characterPoseTrackIds[character.id])
  // Select only this character's pose tracks with a stable reference.
  // Uses a ref to avoid returning a new array when the filtered tracks haven't changed.
  const allPoseTracks = useRigStore((s) => s.poseTracks)
  const prevPoseTracksRef = useRef<typeof allPoseTracks>([])
  const rigPoseTracks = useMemo(() => {
    const filtered = allPoseTracks.filter((t) => t.characterId === character.id || t.characterId === 'primary')
    // Return previous reference if contents are identical (same track objects)
    const prev = prevPoseTracksRef.current
    if (filtered.length === prev.length && filtered.every((t, i) => t === prev[i])) {
      return prev
    }
    prevPoseTracksRef.current = filtered
    return filtered
  }, [allPoseTracks, character.id])
  // Stabilize serializedRigData: keep a ref to avoid re-parsing the same JSON string.
  // JSON.parse creates new object references even for identical strings, which would
  // cause RigPlaybackViewer to re-deserialize (expensive) on every parent re-render.
  const serializedRigDataRef = useRef<{ str: string; parsed: SerializedRigData } | null>(null)
  const serializedRigData = useMemo<SerializedRigData | null>(() => {
    const str = rigStoreData?.boneriggingSerializedData
    if (!str) return null
    // Return cached parse if the string hasn't changed
    if (serializedRigDataRef.current?.str === str) return serializedRigDataRef.current.parsed
    try {
      const parsed = JSON.parse(str) as SerializedRigData
      serializedRigDataRef.current = { str, parsed }
      return parsed
    } catch {
      return null
    }
  }, [rigStoreData?.boneriggingSerializedData])

  // Resolve which animation index to play and its loop/duration settings.
  // Use per-character track ID if set, otherwise fall back to global activePoseTrackId.
  // This prevents one character's selection from affecting another character.
  const effectiveTrackId = charPoseTrackId ?? activePoseTrackId
  const rigAnimMeta = useMemo(() => {
    const empty = {
      index: 0,
      loop: false,
      durationSec: 0,
      startFrame: 0,
      animRanges: [] as { animIndex: number; startFrame: number; endFrame: number; loop: boolean }[],
    }
    if (!serializedRigData?.animations?.length) return empty

    // rigPoseTracks is already filtered to this character's tracks
    const seen = new Set<string>()
    const charTracks = rigPoseTracks.filter((t) => {
      if (seen.has(t.id)) return false
      seen.add(t.id)
      return true
    })

    // Build a range for every track so the RAF loop can pick the right animation per frame.
    const animRanges = charTracks.map((track, idx) => {
      const frames = track.keyframes.map((kf) => kf.frame)
      const startFrame = frames.length ? Math.min(...frames) : 0
      const endFrame = frames.length ? Math.max(...frames) : 0
      const anim = serializedRigData.animations[idx]
      return {
        animIndex: Math.min(idx, serializedRigData.animations.length - 1),
        startFrame,
        endFrame,
        loop: anim?.loop ?? false,
      }
    })

    // Selected animation (drives panel UI highlight — not playback directly)
    let selectedIdx = 0
    if (effectiveTrackId) {
      const idx = charTracks.findIndex((t) => t.id === effectiveTrackId)
      if (idx >= 0) selectedIdx = idx
    }
    const selectedAnim = serializedRigData.animations[selectedIdx] || serializedRigData.animations[0]
    const selectedRange = animRanges[selectedIdx]

    return {
      index: Math.min(selectedIdx, serializedRigData.animations.length - 1),
      loop: selectedAnim?.loop ?? false,
      durationSec: selectedAnim?.duration ?? 0,
      startFrame: selectedRange?.startFrame ?? 0,
      animRanges,
    }
  }, [serializedRigData, effectiveTrackId, rigPoseTracks])

  const isPlaying = useTimelineStore((s) => s.isPlaying)
  const isPlayingRef = useRef(false)
  isPlayingRef.current = isPlaying

  // Imperative ref to RigPlaybackViewer — drives rendering without React re-renders.
  const rigCanvasRef = useRef<RigPlaybackViewerHandle>(null)
  const rigAnimMetaRef = useRef(rigAnimMeta)
  rigAnimMetaRef.current = rigAnimMeta

  // Rigged mode flag — computed early so RAF loops can branch on it
  const isRiggedMode = effectiveRenderMode === 'rigged' && !!effectiveRigId && !!serializedRigData
  const isRiggedModeRef = useRef(isRiggedMode)
  isRiggedModeRef.current = isRiggedMode

  // Trigger initial recomposite once PixiJS is ready — ensures the rig texture
  // includes all current sprites (clothing, face) rather than the stale sourceImageUrl.
  const handleRigViewerReady = useCallback(() => {
    // Invalidate composite + clothing caches — viewer just (re-)initialized
    lastCompositeKeyRef.current = ''
    lastClothingKeyRef.current = ''
    recompositeRigTextureRef.current(
      currentRigVisemeSrcRef.current,
      currentRigEyeSrcRef.current,
      currentRigEyebrowSrcRef.current,
    )
  }, [])

  // --- Rig texture re-compositing (face animation in rigged mode) ---
  // Instead of sprite overlays (which float and misalign with the mesh),
  // we re-composite the full character texture with updated face sprites
  // and upload to WebGL via updateTexture().
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const compositingCanvasRef = useRef<HTMLCanvasElement | null>(null)
  // Fingerprint of the last successful composite — skip redundant composites + GPU uploads
  const lastCompositeKeyRef = useRef<string>('')
  const currentRigVisemeSrcRef = useRef<string | null>(null)
  const currentRigEyeSrcRef = useRef<string | null>(null)
  const currentRigEyebrowSrcRef = useRef<string | null>(null)

  // Shared computation — converts a timeline frame into rig playback params
  // and drives the canvas imperatively (zero React re-renders).
  // Includes transition blending when crossing animation boundaries.
  const BLEND_FRAMES = 6 // ~0.25s at 24fps — duration of crossfade transition
  const computePlaybackRef = useRef<(frame: number) => void>(() => {})
  computePlaybackRef.current = (frame: number) => {
    const fps = useTimelineStore.getState().fps || 24
    const meta = rigAnimMetaRef.current
    const activeRange = meta.animRanges.find((r) => frame >= r.startFrame && frame <= r.endFrame)
    const animIndex = activeRange?.animIndex ?? meta.index
    const startFrame = activeRange?.startFrame ?? meta.startFrame
    const t = Math.max(0, (frame - startFrame) / fps)

    // Check if we're within BLEND_FRAMES of the NEXT animation range boundary
    const nextRange = meta.animRanges.find(
      (r) => r.startFrame > frame && r.startFrame - frame <= BLEND_FRAMES && r.animIndex !== animIndex,
    )

    if (nextRange && rigCanvasRef.current?.setBlendedTime) {
      // We're in a transition window — blend from current anim to next
      const blendStart = nextRange.startFrame - BLEND_FRAMES
      const blend = Math.max(0, Math.min(1, (frame - blendStart) / BLEND_FRAMES))
      const tB = 0 // next animation starts from time 0
      rigCanvasRef.current.setBlendedTime(animIndex, t, nextRange.animIndex, tB, blend)
    } else {
      // Normal single-animation playback
      rigCanvasRef.current?.setTime(t, animIndex)
    }
  }

  // RAF loop — only runs during playback for smooth frame sync
  useEffect(() => {
    if (!effectiveRigId || !isPlaying) return
    let rafId: number
    const update = () => {
      computePlaybackRef.current(useTimelineStore.getState().currentFrame)
      rafId = requestAnimationFrame(update)
    }
    rafId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(rafId)
  }, [effectiveRigId, isPlaying])

  // Subscription — handles scrubbing when paused (no RAF overhead)
  useEffect(() => {
    if (!effectiveRigId) return
    // Compute once for current frame on mount
    computePlaybackRef.current(useTimelineStore.getState().currentFrame)
    // Subscribe for scrubbing when paused
    let lastFrame = useTimelineStore.getState().currentFrame
    const unsub = useTimelineStore.subscribe((state) => {
      if (!isPlayingRef.current && state.currentFrame !== lastFrame) {
        lastFrame = state.currentFrame
        computePlaybackRef.current(state.currentFrame)
      }
    })
    return unsub
  }, [effectiveRigId])

  // Get the saved character's sprites.
  // Memoize the selector to avoid creating a new closure on every render.
  // The persist middleware store returns the same object reference for
  // unchanged characters, so this avoids re-renders when OTHER characters update.
  const savedCharSelector = useCallback(
    (s: { characters: SavedCharacter[] }) => s.characters.find((c) => c.id === character.savedCharacterId),
    [character.savedCharacterId],
  )
  const savedCharacter: SavedCharacter | undefined = useSavedCharactersStore(savedCharSelector)

  // On-demand hydration: if saved character exists but hasn't been hydrated from IndexedDB yet
  useEffect(() => {
    if (savedCharacter && !savedCharacter._hydrated && character.savedCharacterId) {
      useSavedCharactersStore
        .getState()
        .hydrateCharacter(character.savedCharacterId)
        .catch(() => {})
    }
  }, [savedCharacter?._hydrated, character.savedCharacterId])

  // Lazy migration: build visemeSpriteMap for characters that don't have one yet
  useEffect(() => {
    if (!savedCharacter?._hydrated || savedCharacter.visemeSpriteMap) return

    const hasCurved = Object.values(savedCharacter.curvedVisemes).some((v) => v !== null)
    if (hasCurved) {
      // Build from curvedVisemes (24-sprite AI-generated system)
      import('@/services/visemeMapper')
        .then(({ buildVisemeSpriteMapFromCurved }) => {
          const map = buildVisemeSpriteMapFromCurved(savedCharacter.curvedVisemes)
          const { updateCharacter, persistImages } = useSavedCharactersStore.getState()
          updateCharacter(savedCharacter.id, { visemeSpriteMap: map })
          persistImages(savedCharacter.id).catch(() => {})
        })
        .catch(() => {})
      return
    }

    // Build from body-part viseme sprites + labels (e.g. 24 sprites with canonical labels)
    const visemeSprites = savedCharacter.bodyParts?.viseme || []
    const visemeLabels = savedCharacter.spriteLabels?.viseme || {}
    if (visemeSprites.length > 1 && Object.keys(visemeLabels).length > 0) {
      import('@/services/visemeMapper')
        .then(({ buildVisemeSpriteMap }) => {
          const entries = visemeSprites.map((src, i) => ({
            key: visemeLabels[i] || `sprite_${i}`,
            src,
          }))
          buildVisemeSpriteMap(entries, { useGemini: false })
            .then((map) => {
              const hasAny = Object.values(map).some((v) => v !== null)
              if (hasAny) {
                const { updateCharacter, persistImages } = useSavedCharactersStore.getState()
                updateCharacter(savedCharacter.id, { visemeSpriteMap: map })
                persistImages(savedCharacter.id).catch(() => {})
              }
            })
            .catch(() => {})
        })
        .catch(() => {})
    }
  }, [
    savedCharacter?._hydrated,
    savedCharacter?.id,
    savedCharacter?.visemeSpriteMap,
    savedCharacter?.curvedVisemes,
    savedCharacter?.bodyParts,
    savedCharacter?.spriteLabels,
  ])

  // REMOVED: currentFrame subscription — lip sync / emotion head loops already use RAF with getState()
  // activeLineAtFrame is now tracked via subscription to avoid per-frame React re-renders

  // Get dialogue lines for this character to drive lip sync
  // Fetch the full array (stable Immer reference), then filter in useMemo to avoid
  // creating a new array reference on every selector call (causes infinite re-render)
  const allDialogueLines = useMultiCharacterStore((s) => s.dialogueLines)
  const activeVisemeTimeline = useVoiceStore((s) => s.activeVisemeTimeline)
  const activeVoiceId = useVoiceStore((s) => s.activeVoiceId)
  const dialogueLines = useMemo(() => {
    const charLines = allDialogueLines.filter((l) => l.characterId === character.id)
    // Fallback: if no dialogue lines exist but useVoiceStore has an active viseme timeline,
    // create a synthetic dialogue line so lip sync works from simple voice generation too
    if (charLines.length === 0 && activeVisemeTimeline.length > 0 && activeVoiceId) {
      const lastEvent = activeVisemeTimeline[activeVisemeTimeline.length - 1]
      return [
        {
          id: '__voice_fallback__',
          characterId: character.id,
          script: '',
          generatedVoiceId: activeVoiceId,
          startFrame: 0,
          endFrame: (lastEvent?.endFrame ?? 0) + 10,
          order: 0,
          visemeTimeline: activeVisemeTimeline,
          wordTimeline: [],
        },
      ] as DialogueLine[]
    }
    return charLines
  }, [allDialogueLines, character.id, activeVisemeTimeline, activeVoiceId])

  // Track which dialogue line is active at the current frame (for sprite overrides).
  // Uses refs + a subscription — only triggers a React re-render when the sprite
  // overrides actually change (not on every dialogue line boundary). Most lines
  // share the same overrides (or none), so this eliminates 90%+ of re-renders.
  const activeLineIdRef = useRef<string | null>(null)
  const activeLineRef = useRef<DialogueLine | null>(null)
  const dialogueLinesRef = useRef(dialogueLines)
  dialogueLinesRef.current = dialogueLines
  // Only re-render when the serialized overrides hash changes
  const [activeOverridesKey, setActiveOverridesKey] = useState('')

  useEffect(() => {
    const checkLine = (frame: number) => {
      const lines = dialogueLinesRef.current
      const line = lines.find((l) => frame >= l.startFrame && frame < l.endFrame) || null
      const lineId = line?.id ?? null
      if (lineId !== activeLineIdRef.current) {
        activeLineIdRef.current = lineId
        activeLineRef.current = line
        // Only trigger re-render if the sprite overrides actually changed
        const newKey = line?.spriteOverrides ? JSON.stringify(line.spriteOverrides) : ''
        setActiveOverridesKey((prev) => (prev === newKey ? prev : newKey))
      }
    }

    // Check once for current frame
    checkLine(useTimelineStore.getState().currentFrame)

    // Subscribe to store changes — only check when currentFrame changes.
    // Unlike a RAF loop, this is idle when the timeline is paused.
    let lastFrame = useTimelineStore.getState().currentFrame
    const unsub = useTimelineStore.subscribe((state) => {
      if (state.currentFrame !== lastFrame) {
        lastFrame = state.currentFrame
        checkLine(state.currentFrame)
      }
    })
    return unsub
  }, [dialogueLines])

  // --- Sprite Resolution ---
  // Use the saved character's curved visemes (24-sprite system)
  const curvedVisemes = savedCharacter?.curvedVisemes || null
  const hasCurvedSprites = curvedVisemes ? Object.values(curvedVisemes).some((v) => v !== null) : false

  // Static sprite: neutral REST when not speaking (validate to avoid truncated base64)
  const rawStaticViseme = hasCurvedSprites && curvedVisemes ? curvedVisemes['neutral_Rest'] : null
  const staticVisemeSprite = isValidImageSrc(rawStaticViseme) ? rawStaticViseme : null

  // Reference image as fallback display (only use if fully hydrated / valid)
  const referenceImage = isValidImageSrc(savedCharacter?.referenceImage) ? savedCharacter.referenceImage : null

  // Body part sprites (4-layer composite system)
  // Each character uses ONLY its own saved character's bodyParts.
  // No fallback to global config store — that caused cross-character contamination
  // in multi-character mode (config store reflects whichever character was last selected).
  const savedBodyParts = savedCharacter?.bodyParts || null
  const hasSavedBodyParts = savedBodyParts ? Object.values(savedBodyParts).some((arr) => arr.length > 0) : false
  const bodyParts = hasSavedBodyParts ? savedBodyParts : null
  const hasBodyParts = hasSavedBodyParts

  // Body-part viseme mapping: maps viseme names (REST, AI, E, ...) to sprite indices in bodyParts.viseme[]
  const visemeMapping = useCharacterConfigStore((s) => s.visemeMapping)
  // Check if character has usable body-part viseme sprites (fallback when no curved visemes)
  const bodyPartVisemeSprites = bodyParts?.viseme || []
  const bodyPartEyeSprites = bodyParts?.eye || []
  const bodyPartEyebrowSprites = bodyParts?.eyebrow || []
  const hasBodyPartVisemes = !hasCurvedSprites && bodyPartVisemeSprites.length > 1

  // Eye/eyebrow variant sprites (6 each — new expression system)
  const eyeVariantSprites = savedCharacter?.eyeVariants || null
  const hasEyeVariantSprites = eyeVariantSprites ? Object.values(eyeVariantSprites).some((v) => v !== null) : false
  const eyebrowVariantSprites = savedCharacter?.eyebrowVariants || null
  const hasEyebrowVariantSprites = eyebrowVariantSprites
    ? Object.values(eyebrowVariantSprites).some((v) => v !== null)
    : false
  // Expression switching: works with dedicated 6-variant sprites OR multiple bodyParts sprites
  const hasMultipleEyeSprites = (bodyParts?.eye?.length ?? 0) > 1
  const hasMultipleEyebrowSprites = (bodyParts?.eyebrow?.length ?? 0) > 1
  const canSwitchExpressions =
    hasEyeVariantSprites || hasEyebrowVariantSprites || hasMultipleEyeSprites || hasMultipleEyebrowSprites

  // Manual sprite overrides from dialogue character (user-selected index takes priority over expression system)
  const manualEyeIdx = character.defaultSpriteOverrides?.eye ?? null
  const manualEyebrowIdx = character.defaultSpriteOverrides?.eyebrow ?? null
  const manualEyeSprite = manualEyeIdx != null && bodyParts?.eye?.[manualEyeIdx] ? bodyParts.eye[manualEyeIdx] : null
  const manualEyebrowSprite =
    manualEyebrowIdx != null && bodyParts?.eyebrow?.[manualEyebrowIdx] ? bodyParts.eyebrow[manualEyebrowIdx] : null

  // Default eye/eyebrow sprites: manual selection overrides neutral variant / first-from-bodyParts
  const defaultEyeSprite = manualEyeSprite || eyeVariantSprites?.neutral || bodyParts?.eye?.[0] || null
  const defaultEyebrowSprite = manualEyebrowSprite || eyebrowVariantSprites?.neutral || bodyParts?.eyebrow?.[0] || null

  // Pre-computed viseme sprite map from saved character (handles non-canonical names)
  const visemeSpriteMap = savedCharacter?.visemeSpriteMap || null
  const hasVisemeSpriteMap = visemeSpriteMap ? Object.values(visemeSpriteMap).some((v) => v !== null) : false

  // Resolve eye and eyebrow sprites for a given emotion.
  // Priority: eyeVariants (6-variant emotion system) > bodyParts index mapping > default
  const resolveExpressionSprites = useCallback(
    (emotion: string): { eye: string | null; eyebrow: string | null } => {
      const expression = getExpressionFromEmotion(emotion)

      // Try dedicated variant sprites first
      let eye: string | null = eyeVariantSprites?.[expression.eye] || null
      let eyebrow: string | null = eyebrowVariantSprites?.[expression.eyebrow] || null

      // Fallback: map emotion to bodyParts index (neutral=0, happy=1, sad=2, angry=3, shocked=4, suspicious=5)
      if (!eye && bodyPartEyeSprites.length > 1) {
        const variantOrder = ['neutral', 'happy', 'sad', 'angry', 'shocked', 'suspicious']
        const idx = variantOrder.indexOf(expression.eye)
        if (idx >= 0 && idx < bodyPartEyeSprites.length) {
          eye = isValidImageSrc(bodyPartEyeSprites[idx]) ? bodyPartEyeSprites[idx] : null
        }
      }
      if (!eyebrow && bodyPartEyebrowSprites.length > 1) {
        const variantOrder = ['neutral', 'happy', 'sad', 'angry', 'shocked', 'suspicious']
        const idx = variantOrder.indexOf(expression.eyebrow)
        if (idx >= 0 && idx < bodyPartEyebrowSprites.length) {
          eyebrow = isValidImageSrc(bodyPartEyebrowSprites[idx]) ? bodyPartEyebrowSprites[idx] : null
        }
      }

      return {
        eye: eye || defaultEyeSprite,
        eyebrow: eyebrow || defaultEyebrowSprite,
      }
    },
    [
      eyeVariantSprites,
      eyebrowVariantSprites,
      defaultEyeSprite,
      defaultEyebrowSprite,
      bodyPartEyeSprites,
      bodyPartEyebrowSprites,
    ],
  )

  // --- Lip sync animation loop ---
  // Works with curved visemes (24-sprite), visemeSpriteMap (3-tier), AND body-part visemes (sprite-sheet cut)
  const canLipSync = hasCurvedSprites || hasBodyPartVisemes || hasVisemeSpriteMap

  // REST sprite for idle state
  // REST sprite for idle state — validate each fallback to avoid truncated base64
  const rawRestSprite =
    resolveVisemeSprite('Rest', 'neutral', visemeSpriteMap, curvedVisemes, bodyPartVisemeSprites, visemeMapping) ||
    staticVisemeSprite ||
    bodyPartVisemeSprites[visemeMapping.Rest ?? 0] ||
    bodyPartVisemeSprites[0] ||
    null
  const restSpriteSrc = isValidImageSrc(rawRestSprite) ? rawRestSprite : null

  // Resolve a viseme to a sprite URL — uses unified resolveVisemeSprite with 3-tier map
  const getVisemeSprite = useCallback(
    (viseme: Viseme, curvature: MouthCurvature): string | null => {
      return resolveVisemeSprite(
        viseme,
        curvature,
        visemeSpriteMap,
        curvedVisemes,
        bodyPartVisemeSprites,
        visemeMapping,
      )
    },
    [visemeSpriteMap, curvedVisemes, bodyPartVisemeSprites, visemeMapping],
  )

  // isPlayingRef is declared earlier (near rig playback) — keep it in sync here too

  // --- Refs for RAF-consumed values ---
  // Store latest sprite-resolution callbacks/values in refs so RAF loops can
  // always read the latest without restarting when the callbacks change identity.
  const getVisemeSpriteRef = useRef(getVisemeSprite)
  getVisemeSpriteRef.current = getVisemeSprite

  const resolveExpressionSpritesRef = useRef(resolveExpressionSprites)
  resolveExpressionSpritesRef.current = resolveExpressionSprites

  const restSpriteSrcRef = useRef(restSpriteSrc)
  restSpriteSrcRef.current = restSpriteSrc

  const defaultEyeSpriteRef = useRef(defaultEyeSprite)
  defaultEyeSpriteRef.current = defaultEyeSprite

  const defaultEyebrowSpriteRef = useRef(defaultEyebrowSprite)
  defaultEyebrowSpriteRef.current = defaultEyebrowSprite

  // --- Pre-load sprite images for rig texture re-compositing ---
  // After all images are cached, trigger a recomposite so the rig texture
  // reflects the latest sprites (handles new uploads, generated assets, variant changes).
  useEffect(() => {
    if (!isRiggedMode) return
    let cancelled = false
    const cache = imageCacheRef.current
    const promises: Promise<void>[] = []
    const load = (url: unknown) => {
      if (typeof url !== 'string' || !isValidImageSrc(url)) return
      if (cache.has(url)) return
      promises.push(
        new Promise<void>((resolve) => {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            cache.set(url, img)
            resolve()
          }
          img.onerror = () => resolve()
          img.src = url
        }),
      )
    }
    if (bodyParts) {
      for (const sprites of Object.values(bodyParts)) {
        sprites.forEach(load)
      }
    }
    if (eyeVariantSprites) Object.values(eyeVariantSprites).forEach(load)
    if (eyebrowVariantSprites) Object.values(eyebrowVariantSprites).forEach(load)
    if (curvedVisemes) Object.values(curvedVisemes).forEach(load)
    if (visemeSpriteMap) Object.values(visemeSpriteMap).forEach(load)

    const triggerRecomposite = () => {
      if (cancelled) return
      recompositeRigTextureRef.current(
        currentRigVisemeSrcRef.current,
        currentRigEyeSrcRef.current,
        currentRigEyebrowSrcRef.current,
      )
    }

    if (promises.length > 0) {
      Promise.all(promises).then(triggerRecomposite)
    } else {
      // All images already cached — recomposite immediately
      triggerRecomposite()
    }
    return () => {
      cancelled = true
    }
  }, [isRiggedMode, bodyParts, eyeVariantSprites, eyebrowVariantSprites, curvedVisemes, visemeSpriteMap])

  // --- Rig texture re-compositing function (kept in ref for RAF access) ---
  // Body is composited into the rig base texture. Clothing (shirt, pants, shoes)
  // gets its own deformable mesh layer via setClothingLayers.
  // Face parts (head, eye, eyebrow, viseme, hair) are DOM overlays for animation.
  const RIG_MESH_PARTS: Set<string> = new Set(['body'])
  const RIG_CLOTHING_PARTS: Set<string> = new Set(['shirt', 'pants', 'shoes'])
  /** Z-order for clothing layers relative to body (body mesh is always at z=0). */
  const CLOTHING_Z_ORDER: Record<string, number> = { pants: 1, shoes: 2, shirt: 3 }
  /** Fit looseness — controls bone influence radius for clothing deformation.
   *  1.0 = skin-tight, >1 = baggy/loose. */
  const CLOTHING_FIT: Record<string, number> = { shirt: 1.2, pants: 1.0, shoes: 0.8 }
  const rigRecompositeRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Track last clothing layer key to avoid redundant setClothingLayers calls. */
  const lastClothingKeyRef = useRef<string>('')

  const recompositeRigTextureRef = useRef<(vs: string | null, es: string | null, ebs: string | null) => void>(() => {})
  recompositeRigTextureRef.current = (_visemeSrc, _eyeSrc, _eyebrowSrc) => {
    // Clear any pending retry
    if (rigRecompositeRetryRef.current) {
      clearTimeout(rigRecompositeRetryRef.current)
      rigRecompositeRetryRef.current = null
    }

    // Bail and retry if prerequisites aren't ready
    if (!rigCanvasRef.current || !bodyParts) {
      rigRecompositeRetryRef.current = setTimeout(() => {
        recompositeRigTextureRef.current(
          currentRigVisemeSrcRef.current,
          currentRigEyeSrcRef.current,
          currentRigEyebrowSrcRef.current,
        )
      }, 200)
      return
    }

    const cache = imageCacheRef.current
    const overrides = activeLineRef.current?.spriteOverrides || character.defaultSpriteOverrides
    const bodyUrl = bodyParts.body?.[overrides?.body ?? 0] || bodyParts.body?.[0]
    if (!bodyUrl) return
    const bodyImg = cache.get(bodyUrl)
    if (!bodyImg) {
      // Body image not cached yet — retry after preloading has a chance to finish
      rigRecompositeRetryRef.current = setTimeout(() => {
        recompositeRigTextureRef.current(
          currentRigVisemeSrcRef.current,
          currentRigEyeSrcRef.current,
          currentRigEyebrowSrcRef.current,
        )
      }, 200)
      return
    }

    // --- Fingerprint check: skip composite + GPU upload if inputs unchanged ---
    const savedChar = savedCharacter
    const transforms = savedChar?.partTransforms as Record<
      string,
      { x: number; y: number; rotation: number; scaleX: number; scaleY: number; visible: boolean }
    > | null
    const selected = savedChar?.selectedSprites as Record<string, number | null> | null
    const compositeOrder = layerOrder || DEFAULT_LAYER_ORDER

    const keyParts: string[] = []
    for (const part of compositeOrder) {
      // Include both body and clothing parts in the fingerprint — clothing changes
      // must also trigger a run so setClothingLayers gets called below.
      if (!RIG_MESH_PARTS.has(part) && !RIG_CLOTHING_PARTS.has(part)) continue
      const t = transforms?.[part]
      if (t && !t.visible) {
        keyParts.push(`${part}:hidden`)
        continue
      }
      const sprites = (bodyParts as Record<string, string[]>)[part]
      if (!sprites || sprites.length === 0) continue
      const idx = (overrides as Record<string, number | undefined>)?.[part] ?? selected?.[part] ?? 0
      const url = sprites[idx] ?? sprites[0] ?? ''
      // Use URL + whether it's cached (uncached = will retry later)
      const isCached = cache.has(url)
      const tKey = t ? `${t.x},${t.y},${t.rotation},${t.scaleX},${t.scaleY}` : 'default'
      keyParts.push(`${part}:${url.slice(-32)}:${idx}:${tKey}:${isCached}`)
    }
    const compositeKey = keyParts.join('|')
    if (compositeKey === lastCompositeKeyRef.current) return // nothing changed
    // --- End fingerprint check ---

    const bw = bodyImg.naturalWidth || bodyImg.width
    const bh = bodyImg.naturalHeight || bodyImg.height
    const dim = Math.max(bw, bh)

    if (!compositingCanvasRef.current) compositingCanvasRef.current = document.createElement('canvas')
    const cv = compositingCanvasRef.current
    if (cv.width !== dim) cv.width = dim
    if (cv.height !== dim) cv.height = dim
    const ctx = cv.getContext('2d')!
    ctx.clearRect(0, 0, dim, dim)

    const BASE = 200
    const uniScale = dim / BASE

    const bodyFitScale = Math.min(dim / bw, dim / bh)
    const bodyDw = bw * bodyFitScale
    const bodyDh = bh * bodyFitScale

    // Draw body + clothing into the rig texture in layer order
    let hasMissing = false
    for (const part of compositeOrder) {
      if (!RIG_MESH_PARTS.has(part)) continue

      const t = transforms?.[part]
      if (t && !t.visible) continue

      const sprites = (bodyParts as Record<string, string[]>)[part]
      if (!sprites || sprites.length === 0) continue
      const overrideIdx = (overrides as Record<string, number | undefined>)?.[part] ?? selected?.[part] ?? 0
      const url = sprites[overrideIdx] ?? sprites[0] ?? null
      if (!url || !isValidImageSrc(url)) continue
      const img = cache.get(url)
      if (!img) {
        hasMissing = true
        continue
      }

      ctx.save()
      if (t) {
        ctx.translate(dim / 2 + t.x * uniScale, dim / 2 + t.y * uniScale)
        ctx.rotate((t.rotation * Math.PI) / 180)
        ctx.scale(t.scaleX, t.scaleY)
      } else {
        ctx.translate(dim / 2, dim / 2)
      }
      ctx.drawImage(img, -bodyDw / 2, -bodyDh / 2, bodyDw, bodyDh)
      ctx.restore()
    }

    // Upload composited texture to the rig's WebGL renderer.
    // The viewer's internal PixiJS state may not be ready yet (race with init),
    // so catch and retry if updateTexture fails.
    try {
      rigCanvasRef.current.updateTexture(cv)
    } catch {
      // PixiJS renderer not ready — retry after it finishes initializing
      rigRecompositeRetryRef.current = setTimeout(() => {
        recompositeRigTextureRef.current(
          currentRigVisemeSrcRef.current,
          currentRigEyeSrcRef.current,
          currentRigEyebrowSrcRef.current,
        )
      }, 200)
      return
    }

    // Only cache the fingerprint when all images were present — incomplete
    // composites will retry and the key must remain stale so the retry proceeds.
    if (!hasMissing) lastCompositeKeyRef.current = compositeKey

    // If clothing images weren't cached yet, retry so they get included once loaded
    if (hasMissing) {
      rigRecompositeRetryRef.current = setTimeout(() => {
        recompositeRigTextureRef.current(
          currentRigVisemeSrcRef.current,
          currentRigEyeSrcRef.current,
          currentRigEyebrowSrcRef.current,
        )
      }, 300)
    }

    // --- Set clothing as separate deformable layers ---
    const clothingInputs: ClothingLayerInput[] = []
    const clothingKeyParts: string[] = []
    for (const part of compositeOrder) {
      if (!RIG_CLOTHING_PARTS.has(part)) continue
      const t = transforms?.[part]
      if (t && !t.visible) continue
      const sprites = (bodyParts as Record<string, string[]>)[part]
      if (!sprites || sprites.length === 0) continue
      const idx = (overrides as Record<string, number | undefined>)?.[part] ?? selected?.[part] ?? 0
      const url = sprites[idx] ?? sprites[0] ?? null
      if (!url || !isValidImageSrc(url)) continue
      const img = cache.get(url)
      if (!img) continue
      clothingKeyParts.push(`${part}:${url.slice(-32)}:${idx}`)
      clothingInputs.push({
        id: part,
        image: img,
        zOrder: CLOTHING_Z_ORDER[part] ?? 1,
        fitLooseness: CLOTHING_FIT[part],
      })
    }
    // Only call setClothingLayers if the set of clothing changed
    const clothingKey = clothingKeyParts.join('|')
    if (clothingKey !== lastClothingKeyRef.current) {
      lastClothingKeyRef.current = clothingKey
      rigCanvasRef.current.setClothingLayers(clothingInputs)
    }
  }

  // Clean up recomposite retry timer on unmount
  useEffect(() => {
    return () => {
      if (rigRecompositeRetryRef.current) clearTimeout(rigRecompositeRetryRef.current)
    }
  }, [])

  // --- Recomposite when active dialogue line changes (spriteOverrides) ---
  // In rigged mode, when a new dialogue line becomes active, its spriteOverrides
  // may specify different eye/eyebrow/viseme indices. Trigger a recomposite.
  useEffect(() => {
    if (!isRiggedMode || !activeOverridesKey) return
    recompositeRigTextureRef.current(
      currentRigVisemeSrcRef.current,
      currentRigEyeSrcRef.current,
      currentRigEyebrowSrcRef.current,
    )
  }, [isRiggedMode, activeOverridesKey])

  // --- Recomposite when saved character's sprite selections change ---
  // Clothing (shirt/pants/shoes) and other part selections are baked into the
  // rig texture. When the user selects a different variant, recomposite to show it.
  const selectedSpritesKey = savedCharacter?.selectedSprites ? JSON.stringify(savedCharacter.selectedSprites) : null
  useEffect(() => {
    if (!isRiggedMode || !selectedSpritesKey) return
    recompositeRigTextureRef.current(
      currentRigVisemeSrcRef.current,
      currentRigEyeSrcRef.current,
      currentRigEyebrowSrcRef.current,
    )
  }, [isRiggedMode, selectedSpritesKey])

  // Compute the idle viseme source at the top level so it's available to both
  // the useLayoutEffect (initial render) and the lip sync useEffect (reset on stop).
  // This is the user's manually selected viseme sprite, or restSpriteSrc as fallback.
  // Read from ref — re-render only triggered when activeOverridesKey changes (rare)
  void activeOverridesKey // referenced to suppress unused-var lint; drives re-render
  const activeOverrides = activeLineRef.current?.spriteOverrides || character.defaultSpriteOverrides
  const rawIdleViseme = bodyParts?.viseme?.[activeOverrides?.viseme ?? 0]
  const idleVisemeSrc = isValidImageSrc(rawIdleViseme) ? rawIdleViseme : restSpriteSrc

  const idleVisemeSrcRef = useRef(idleVisemeSrc)
  idleVisemeSrcRef.current = idleVisemeSrc

  // --- Imperative viseme img management ---
  // The cross-fade <img> elements do NOT have React-controlled `src` or `style.opacity`.
  // This prevents React re-renders from fighting with the RAF loop.
  // Runs only when idle sprite sources actually change — NOT on every render.
  // The RAF cleanup function handles the playing→idle transition.
  useLayoutEffect(() => {
    if (isPlayingRef.current) return // RAF manages during playback
    const src = idleVisemeSrcRef.current || restSpriteSrcRef.current || ''
    if (visemeImgRefA.current) {
      visemeImgRefA.current.src = src
      visemeImgRefA.current.style.transition = 'none'
      visemeImgRefA.current.style.opacity = '1'
    }
    if (visemeImgRefB.current) {
      visemeImgRefB.current.src = src
      visemeImgRefB.current.style.transition = 'none'
      visemeImgRefB.current.style.opacity = '0'
    }
    activeVisemeSlot.current = 'A'
  }, [idleVisemeSrc, restSpriteSrc])

  // --- Imperative eye/eyebrow img management ---
  // Sets initial eye/eyebrow sprites when idle. Only re-runs when the
  // default sprites change — NOT on every render. RAF handles playback.
  useLayoutEffect(() => {
    if (isPlayingRef.current || !canSwitchExpressions) return
    if (eyeImgRef.current && defaultEyeSprite) {
      eyeImgRef.current.src = defaultEyeSprite
    }
    if (eyebrowImgRef.current && defaultEyebrowSprite) {
      eyebrowImgRef.current.src = defaultEyebrowSprite
    }
  }, [canSwitchExpressions, defaultEyeSprite, defaultEyebrowSprite])

  // dialogue lines dependency tracked via dialogueLines used in playback effect below

  useEffect(() => {
    console.log('[CharacterLayer Viseme] Effect triggered:', {
      isPlaying,
      canLipSync,
      dialogueLinesCount: dialogueLines.length,
      hasCurvedSprites,
      hasBodyPartVisemes,
      hasVisemeSpriteMap,
      savedCharId: savedCharacter?.id,
      curvedVisemesKeys: curvedVisemes
        ? Object.keys(curvedVisemes).filter((k) => (curvedVisemes as Record<string, unknown>)[k] !== null)
        : [],
      visemeSpriteMapKeys: visemeSpriteMap
        ? Object.keys(visemeSpriteMap).filter((k) => (visemeSpriteMap as Record<string, unknown>)[k] !== null)
        : [],
      bodyPartVisemeCount: bodyPartVisemeSprites.length,
    })
    if (dialogueLines.length > 0) {
      console.log(
        '[CharacterLayer Viseme] Dialogue lines:',
        dialogueLines.map((l) => ({
          id: l.id,
          charId: l.characterId,
          script: l.script?.substring(0, 30),
          startFrame: l.startFrame,
          endFrame: l.endFrame,
          visemeTimelineLength: l.visemeTimeline?.length ?? 0,
        })),
      )
    }
    if (!isPlaying || !canLipSync || dialogueLines.length === 0) {
      console.log('[CharacterLayer Viseme] Early return:', {
        isPlaying,
        canLipSync,
        noLines: dialogueLines.length === 0,
      })
      // Reset viseme to idle when not playing (DOM overlays in both modes)
      const idleSrc = idleVisemeSrcRef.current || restSpriteSrcRef.current
      if (idleSrc) {
        if (visemeImgRefA.current) {
          visemeImgRefA.current.style.transition = 'none'
          visemeImgRefA.current.src = idleSrc
          visemeImgRefA.current.style.opacity = '1'
        }
        if (visemeImgRefB.current) {
          visemeImgRefB.current.style.transition = 'none'
          visemeImgRefB.current.src = idleSrc
          visemeImgRefB.current.style.opacity = '0'
        }
        activeVisemeSlot.current = 'A'
      }
      return
    }

    let animationId: number
    let lastSpriteKey = ''
    let rafCount = 0

    const updateViseme = () => {
      const currentFrame = useTimelineStore.getState().currentFrame

      // Find active dialogue line for this character at current frame.
      // When overlapping lines exist for the same character, use the later-starting one.
      const candidateLines = dialogueLines.filter((l) => currentFrame >= l.startFrame && currentFrame < l.endFrame)
      const activeLine =
        candidateLines.length <= 1
          ? (candidateLines[0] ?? null)
          : candidateLines.reduce((latest, l) => (l.startFrame > latest.startFrame ? l : latest))

      if (rafCount < 10) {
        console.log('[CharacterLayer RAF]', {
          frame: currentFrame,
          activeLine: !!activeLine,
          visemeCount: activeLine?.visemeTimeline?.length ?? 0,
        })
        rafCount++
      }

      if (!activeLine || activeLine.visemeTimeline.length === 0) {
        // Not speaking - show REST
        const rest = restSpriteSrcRef.current
        if (rest) {
          const restKey = 'rest_static'
          if (lastSpriteKey !== restKey) {
            // Always use DOM cross-fade for viseme (overlays in both rigged and sprite modes)
            const transitionMs = useCharacterConfigStore.getState().visemeTransitionMs
            const incoming = activeVisemeSlot.current === 'A' ? visemeImgRefB : visemeImgRefA
            const outgoing = activeVisemeSlot.current === 'A' ? visemeImgRefA : visemeImgRefB
            if (incoming.current) {
              incoming.current.src = rest
              incoming.current.style.transition = `opacity ${transitionMs}ms ease-in-out`
              incoming.current.style.opacity = '1'
            }
            if (outgoing.current) {
              outgoing.current.style.transition = `opacity ${transitionMs}ms ease-in-out`
              outgoing.current.style.opacity = '0'
            }
            activeVisemeSlot.current = activeVisemeSlot.current === 'A' ? 'B' : 'A'
            lastSpriteKey = restKey
          }
        }
      } else {
        // Speaking - find viseme at relative frame position within this line
        const relativeFrame = currentFrame - activeLine.startFrame
        const event = activeLine.visemeTimeline.find((e) => relativeFrame >= e.startFrame && relativeFrame < e.endFrame)
        const currentViseme: Viseme = (event?.viseme as Viseme) || 'Rest'

        // Get emotion from dialogue line
        let currentEmotion = 'Neutral'
        if (activeLine.emotion && activeLine.emotion !== 'Auto') {
          currentEmotion = activeLine.emotion
        } else {
          currentEmotion = detectEmotionFromText(activeLine.script)
        }
        const curvature = getCurvatureFromEmotion(currentEmotion)

        const spriteKey = `${curvature}_${currentViseme}`
        if (spriteKey !== lastSpriteKey) {
          let newSrc = getVisemeSpriteRef.current(currentViseme, curvature)
          if (rafCount < 30) {
            console.log('[CharacterLayer Viseme Switch]', {
              viseme: currentViseme,
              curvature,
              spriteKey,
              hasSrc: !!newSrc,
              isRigged: isRiggedModeRef.current,
            })
          }
          if (newSrc) {
            // Apply style effect via sync cache lookup (RAF-safe)
            const ase = character.activeStyleEffect
            const pa = character.pixelArt
            if (ase && ase.settings?.enabled) {
              const seed = getAnimatedSeed(currentFrame, ase)
              newSrc = getEffectFromCache(newSrc, ase, seed) || newSrc
            } else if (pa?.enabled) {
              newSrc = getPixelatedFromCache(newSrc, pa) || newSrc
            }
            // Always use DOM cross-fade for viseme (overlays in both rigged and sprite modes)
            const transitionMs = useCharacterConfigStore.getState().visemeTransitionMs
            const incoming = activeVisemeSlot.current === 'A' ? visemeImgRefB : visemeImgRefA
            const outgoing = activeVisemeSlot.current === 'A' ? visemeImgRefA : visemeImgRefB
            if (incoming.current) {
              incoming.current.src = newSrc
              incoming.current.style.transition = `opacity ${transitionMs}ms ease-in-out`
              incoming.current.style.opacity = '1'
            }
            if (outgoing.current) {
              outgoing.current.style.transition = `opacity ${transitionMs}ms ease-in-out`
              outgoing.current.style.opacity = '0'
            }
            activeVisemeSlot.current = activeVisemeSlot.current === 'A' ? 'B' : 'A'
          }
          lastSpriteKey = spriteKey
        }
      }

      if (useTimelineStore.getState().isPlaying) {
        animationId = requestAnimationFrame(updateViseme)
      }
    }

    animationId = requestAnimationFrame(updateViseme)

    return () => {
      cancelAnimationFrame(animationId)
      // Reset viseme to idle when stopping (DOM overlays in both modes)
      const idleSrc = idleVisemeSrcRef.current || restSpriteSrcRef.current
      if (idleSrc) {
        if (visemeImgRefA.current) {
          visemeImgRefA.current.style.transition = 'none'
          visemeImgRefA.current.src = idleSrc
          visemeImgRefA.current.style.opacity = '1'
        }
        if (visemeImgRefB.current) {
          visemeImgRefB.current.style.transition = 'none'
          visemeImgRefB.current.src = idleSrc
          visemeImgRefB.current.style.opacity = '0'
        }
        activeVisemeSlot.current = 'A'
      }
    }
  }, [isPlaying, canLipSync, dialogueLines])

  // --- Eye/eyebrow expression animation loop ---
  // Swaps eye and eyebrow sprites based on dialogue line emotion.
  // Uses refs for sprite callbacks/defaults to avoid RAF restart on identity changes.
  useEffect(() => {
    if (!isPlaying || !canSwitchExpressions || dialogueLines.length === 0) {
      // Reset to default when not playing (DOM overlays in both modes)
      const defEye = defaultEyeSpriteRef.current
      const defBrow = defaultEyebrowSpriteRef.current
      if (eyeImgRef.current && defEye) {
        eyeImgRef.current.src = defEye
      }
      if (eyebrowImgRef.current && defBrow) {
        eyebrowImgRef.current.src = defBrow
      }
      return
    }

    let animationId: number
    let lastEmotion = ''

    const updateExpression = () => {
      const currentFrame = useTimelineStore.getState().currentFrame

      // Support overlapping lines: use the later-starting one for expression
      const exprCandidates = dialogueLines.filter((l) => currentFrame >= l.startFrame && currentFrame < l.endFrame)
      const activeLine =
        exprCandidates.length <= 1
          ? (exprCandidates[0] ?? null)
          : exprCandidates.reduce((latest, l) => (l.startFrame > latest.startFrame ? l : latest))

      let currentEmotion = 'Neutral'
      if (activeLine) {
        if (activeLine.emotion && activeLine.emotion !== 'Auto') {
          currentEmotion = activeLine.emotion
        } else {
          currentEmotion = detectEmotionFromText(activeLine.script)
        }
      }

      if (currentEmotion !== lastEmotion) {
        const { eye: eyeSrc, eyebrow: eyebrowSrc } = resolveExpressionSpritesRef.current(currentEmotion)

        // Always use DOM refs for eye/eyebrow (overlays in both rigged and sprite modes)
        const ase = character.activeStyleEffect
        const pa = character.pixelArt
        let effEye = eyeSrc
        let effBrow = eyebrowSrc
        if (ase && ase.settings?.enabled) {
          const seed = getAnimatedSeed(useTimelineStore.getState().currentFrame, ase)
          if (effEye) effEye = getEffectFromCache(effEye, ase, seed) || effEye
          if (effBrow) effBrow = getEffectFromCache(effBrow, ase, seed) || effBrow
        } else if (pa?.enabled) {
          if (effEye) effEye = getPixelatedFromCache(effEye, pa) || effEye
          if (effBrow) effBrow = getPixelatedFromCache(effBrow, pa) || effBrow
        }
        if (eyeImgRef.current && effEye) {
          if (eyeImgRef.current.src !== effEye) {
            eyeImgRef.current.src = effEye
          }
        }
        if (eyebrowImgRef.current && effBrow) {
          if (eyebrowImgRef.current.src !== effBrow) {
            eyebrowImgRef.current.src = effBrow
          }
        }

        lastEmotion = currentEmotion
      }

      if (useTimelineStore.getState().isPlaying) {
        animationId = requestAnimationFrame(updateExpression)
      }
    }

    animationId = requestAnimationFrame(updateExpression)

    return () => {
      cancelAnimationFrame(animationId)
      // Reset to default (DOM overlays in both rigged and sprite modes)
      const defEye = defaultEyeSpriteRef.current
      const defBrow = defaultEyebrowSpriteRef.current
      if (eyeImgRef.current && defEye) {
        eyeImgRef.current.src = defEye
      }
      if (eyebrowImgRef.current && defBrow) {
        eyebrowImgRef.current.src = defBrow
      }
    }
  }, [isPlaying, canSwitchExpressions, dialogueLines])

  // --- Base size for scale computation (intrinsic character size in px) ---
  const BASE_CHARACTER_SIZE = 200

  // --- Calculate bounding box by scanning actual opaque pixels per image ---
  // Each part image may have large transparent regions. We draw each image to an
  // offscreen canvas, find the tight opaque bounding rect, then map it into the
  // base container coordinate space accounting for object-contain + part transform.
  //
  // The computed bounds are in BASE_CHARACTER_SIZE (unscaled) space and remain
  // constant regardless of character.scale. The outer div uses these to size and
  // position itself, and the inner parts are rendered with a CSS transform offset
  // so we don't need a separate wrapper div (which breaks Moveable resize).
  const contentRef = useRef<HTMLDivElement>(null)
  const [computedBounds, setComputedBounds] = useState<{
    width: number
    height: number
    offsetX: number
    offsetY: number
  } | null>(null)
  const boundsRafRef = useRef<number>(0)
  const computeBoundsRef = useRef<(() => void) | null>(null)
  // Cache opaque bounds per image src to avoid re-scanning
  const opaqueBoundsCache = useRef<Map<string, { left: number; top: number; right: number; bottom: number } | null>>(
    new Map(),
  )

  // Compute tight bounding box from opaque pixels — result is in BASE_CHARACTER_SIZE space
  // and does NOT depend on character.scale (uses only natural image dimensions + constants).
  const computeBoundsFromImages = useCallback(() => {
    if (!contentRef.current) return

    const container = contentRef.current
    const imgs = container.querySelectorAll('img')
    if (imgs.length === 0) return

    const baseW = BASE_CHARACTER_SIZE
    const baseH = BASE_CHARACTER_SIZE
    const seen = new Set<string>()

    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    const work: Array<{ img: HTMLImageElement; partKey: string }> = []

    imgs.forEach((img) => {
      if (!img.naturalWidth || !img.naturalHeight) return

      // Find the direct child of contentRef that contains this img
      let directChild: HTMLElement | null = img
      while (directChild && directChild.parentElement !== container) {
        directChild = directChild.parentElement
      }
      if (!directChild) return
      const childKey = Array.prototype.indexOf.call(container.children, directChild)
      if (seen.has(String(childKey))) return
      seen.add(String(childKey))

      // Read the part's key from data attribute to look up transform from store
      const partKey = directChild.getAttribute('data-part') || ''
      work.push({ img, partKey })
    })

    if (work.length === 0) return

    for (const { img, partKey } of work) {
      const nw = img.naturalWidth
      const nh = img.naturalHeight

      // Get or compute opaque bounds (normalized 0-1 within natural dimensions)
      let opaque = opaqueBoundsCache.current.get(img.src)
      if (opaque === undefined) {
        const scanSize = 128
        const sw = Math.min(nw, scanSize)
        const sh = Math.min(nh, scanSize)
        const canvas = document.createElement('canvas')
        canvas.width = sw
        canvas.height = sh
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) {
          opaqueBoundsCache.current.set(img.src, null)
          continue
        }

        try {
          ctx.drawImage(img, 0, 0, sw, sh)
          const data = ctx.getImageData(0, 0, sw, sh).data

          let oLeft = sw,
            oTop = sh,
            oRight = 0,
            oBottom = 0
          let found = false
          for (let y = 0; y < sh; y++) {
            for (let x = 0; x < sw; x++) {
              const alpha = data[(y * sw + x) * 4 + 3]
              if (alpha > 10) {
                if (x < oLeft) oLeft = x
                if (x > oRight) oRight = x
                if (y < oTop) oTop = y
                if (y > oBottom) oBottom = y
                found = true
              }
            }
          }

          if (found) {
            opaque = {
              left: oLeft / sw,
              top: oTop / sh,
              right: (oRight + 1) / sw,
              bottom: (oBottom + 1) / sh,
            }
          } else {
            opaque = null
          }
        } catch {
          opaque = { left: 0, top: 0, right: 1, bottom: 1 }
        }
        opaqueBoundsCache.current.set(img.src, opaque)
      }

      if (!opaque) continue

      // Compute object-contain layout within the base container
      const imgAspect = nw / nh
      const containerAspect = baseW / baseH
      let renderW: number, renderH: number
      if (imgAspect > containerAspect) {
        renderW = baseW
        renderH = baseW / imgAspect
      } else {
        renderH = baseH
        renderW = baseH * imgAspect
      }
      const renderLeft = (baseW - renderW) / 2
      const renderTop = (baseH - renderH) / 2

      // Map opaque bounds into container space
      const contentLeft = renderLeft + opaque.left * renderW
      const contentTop = renderTop + opaque.top * renderH
      const contentRight = renderLeft + opaque.right * renderW
      const contentBottom = renderTop + opaque.bottom * renderH

      // Look up part transform from store data (not from DOM styles)
      const t = partKey
        ? (partTransforms as Record<string, { x: number; y: number; scaleX: number; scaleY: number }>)[partKey]
        : null
      const tx = t?.x ?? 0
      const ty = t?.y ?? 0
      const sx = t?.scaleX ?? 1
      const sy = t?.scaleY ?? 1

      // Apply part transform (transformOrigin: center center)
      const cx = baseW / 2
      const cy = baseH / 2
      const sLeft = cx + (contentLeft - cx) * sx + tx
      const sTop = cy + (contentTop - cy) * sy + ty
      const sRight = cx + (contentRight - cx) * sx + tx
      const sBottom = cy + (contentBottom - cy) * sy + ty

      minX = Math.min(minX, sLeft, sRight)
      minY = Math.min(minY, sTop, sBottom)
      maxX = Math.max(maxX, sLeft, sRight)
      maxY = Math.max(maxY, sTop, sBottom)
    }

    if (minX < Infinity) {
      const pad = 2
      minX -= pad
      minY -= pad
      maxX += pad
      maxY += pad
      const totalWidth = maxX - minX
      const totalHeight = maxY - minY
      if (totalWidth > 0 && totalHeight > 0) {
        const newW = Math.ceil(totalWidth)
        const newH = Math.ceil(totalHeight)
        const newOX = Math.floor(minX)
        const newOY = Math.floor(minY)
        setComputedBounds((prev) => {
          if (prev && prev.width === newW && prev.height === newH && prev.offsetX === newOX && prev.offsetY === newOY) {
            return prev
          }
          return { width: newW, height: newH, offsetX: newOX, offsetY: newOY }
        })
      }
    }
  }, [partTransforms])

  // Keep ref in sync so the RAF callback always calls the latest version
  computeBoundsRef.current = computeBoundsFromImages

  // Debounced image-load handler: schedules bounds computation via RAF instead of
  // triggering a React state update (which was causing infinite re-render loops).
  const handlePartImageLoad = useCallback(() => {
    cancelAnimationFrame(boundsRafRef.current)
    boundsRafRef.current = requestAnimationFrame(() => {
      computeBoundsRef.current?.()
    })
  }, [])

  // Run bounds computation when parts change
  useEffect(() => {
    computeBoundsFromImages()
  }, [computeBoundsFromImages, hasBodyParts, character.id])

  // Persist computed bounds to store so export pipelines can use them without a drag event
  useEffect(() => {
    if (!computedBounds) return
    const bw = computedBounds.width
    const bh = computedBounds.height
    // Only update when bounds differ from what's stored (avoids infinite loop)
    if (character.boundsWidth === bw && character.boundsHeight === bh) return
    updateDialogueCharacter(character.id, { boundsWidth: bw, boundsHeight: bh })
  }, [computedBounds, character.id, character.boundsWidth, character.boundsHeight, updateDialogueCharacter])

  // In rigged mode, the rig mesh (PixiJS canvas) fills the full BASE_CHARACTER_SIZE area
  // but isn't an <img> element so computedBounds (which scans <img> nodes) misses it.
  // Force bounds to cover the full content area so the container and content transform
  // don't shrink/shift based on only the sprite overlays (shirt/pants/shoes).
  const effectiveBounds = isRiggedMode
    ? { width: BASE_CHARACTER_SIZE, height: BASE_CHARACTER_SIZE, offsetX: 0, offsetY: 0 }
    : computedBounds

  // Bounding box base width (unscaled) — used to convert DOM pixel width back to scale factor
  const boundsBaseWidth = effectiveBounds ? effectiveBounds.width : BASE_CHARACTER_SIZE
  const boundsBaseHeight = effectiveBounds ? effectiveBounds.height : BASE_CHARACTER_SIZE

  // --- SelectionTransformBox: live transform handler ---
  const handleLiveTransform = useCallback(
    (values: LiveTransformValues) => {
      const newScale = Math.max(0.01, values.width / boundsBaseWidth)
      // Convert to center-point for display (store uses center coordinates)
      setLiveTransform({
        type: 'media', // reuse media type for live transform display
        id: character.id,
        x: values.left + values.width / 2,
        y: values.top + values.height / 2,
        rotation: Math.round(values.rotation),
        scale: newScale,
      })
    },
    [character.id, setLiveTransform, boundsBaseWidth],
  )

  // --- SelectionTransformBox: commit handler ---
  const handleTransformEnd = useCallback(() => {
    const el = targetRef.current
    if (!el) return

    clearLiveTransform()

    // Read final position from DOM (Moveable sets left/top directly)
    const finalLeft = parseFloat(el.style.left) || 0
    const finalTop = parseFloat(el.style.top) || 0
    const finalWidth = el.offsetWidth
    const newScale = Math.max(0.01, finalWidth / boundsBaseWidth)

    // Read rotation from CSS transform (Moveable sets rotate via transform)
    const transformStr = el.style.transform || ''
    const rotateMatch = transformStr.match(/rotate\(([^)]+)deg\)/)
    const newRotation = rotateMatch ? Math.round(parseFloat(rotateMatch[1])) : character.rotation || 0

    // Convert back to center-point coordinates (store uses center position)
    const centerX = Math.round(finalLeft + finalWidth / 2)
    const centerY = Math.round(finalTop + el.offsetHeight / 2)

    updateDialogueCharacter(character.id, {
      position: { x: centerX, y: centerY },
      scale: newScale,
      rotation: newRotation,
      boundsWidth: boundsBaseWidth,
      boundsHeight: boundsBaseHeight,
    })

    // Record keyframes
    recordIfEnabled(
      { objectType: 'dialogueCharacter', objectId: character.id },
      { 'position.x': centerX, 'position.y': centerY, scale: newScale, rotation: newRotation },
      {
        'position.x': character.position.x,
        'position.y': character.position.y,
        scale: character.scale,
        rotation: character.rotation || 0,
      },
    )
  }, [
    character.id,
    character.position.x,
    character.position.y,
    character.scale,
    character.rotation,
    updateDialogueCharacter,
    clearLiveTransform,
    recordIfEnabled,
    boundsBaseWidth,
  ])

  // --- Click to select ---
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      selectDialogueCharacter(character.id)

      // Select the linked saved character and switch to character properties panel
      if (character.savedCharacterId) {
        selectSavedCharacter(character.savedCharacterId)

        // Sync saved character data into config stores so panels show the correct assets.
        // Without this, clicking character A while character B was last synced leaves
        // the panels showing B's sprites/visemes/etc.
        const saved = useSavedCharactersStore.getState().characters.find((c) => c.id === character.savedCharacterId)
        if (saved) {
          syncSavedCharacterToConfigStore(saved)
        }
      }
      setRightPanelTab('group-properties')
    },
    [character.id, character.savedCharacterId, selectDialogueCharacter, selectSavedCharacter, setRightPanelTab],
  )

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeDialogueCharacter(character.id)
  }

  // --- Displayed size in px ---
  // (isRiggedMode is computed earlier — near rigCanvasRef — so RAF loops can use it)

  // Defer RigPlaybackViewer mount by one frame so the container has layout dimensions.
  // The vendor PixiViewport.init(container) needs a container with real pixel size;
  // mounting immediately can cause a race where the image loads before PixiJS finishes init.
  const [rigViewerReady, setRigViewerReady] = useState(false)
  useEffect(() => {
    if (!isRiggedMode) {
      setRigViewerReady(false)
      return
    }
    // Wait for next frame so the outer div has been painted with real dimensions
    const id = requestAnimationFrame(() => setRigViewerReady(true))
    return () => cancelAnimationFrame(id)
  }, [isRiggedMode])

  // Base display dimensions (used for the inner content area where parts are positioned)
  // In both sprite and rigged mode, the inner wrapper is BASE_CHARACTER_SIZE x BASE_CHARACTER_SIZE.
  // This ensures body part transforms (head, hair, viseme) stay in the same coordinate space
  // regardless of render mode — switching to rigged mode must not alter part positioning.
  const baseDisplayWidth = BASE_CHARACTER_SIZE * character.scale
  const baseDisplayHeight = BASE_CHARACTER_SIZE * character.scale

  // Outer bounding box dimensions — encompasses all parts including their transforms
  const displayWidth = effectiveBounds ? effectiveBounds.width * character.scale : baseDisplayWidth
  const displayHeight = effectiveBounds ? effectiveBounds.height * character.scale : baseDisplayHeight

  // --- Inner container scale (both sprite and rigged mode) ---
  // The inner contentRef is always BASE_CHARACTER_SIZE x BASE_CHARACTER_SIZE in its own space.
  // After translating by (-offsetX, -offsetY), the tight bounds region occupies
  // computedBounds.width px. We scale that to fill the outer div's width.
  // A ResizeObserver directly updates the DOM transform (no React re-render) so
  // it doesn't fight with Moveable's direct DOM mutations during drag.
  // Both modes share the same inner wrapper to keep part positioning consistent.
  const boundsW = effectiveBounds?.width ?? BASE_CHARACTER_SIZE
  useEffect(() => {
    const el = targetRef.current
    const content = contentRef.current
    if (!el || !content) return
    const bw = boundsW
    const ox = effectiveBounds?.offsetX ?? 0
    const oy = effectiveBounds?.offsetY ?? 0
    const update = () => {
      const w = el.offsetWidth
      if (w > 0) {
        const s = w / bw
        content.style.transform = `scale(${s}) translate(${-ox}px, ${-oy}px)`
      }
    }
    update() // set initial
    const observer = new ResizeObserver(() => update())
    observer.observe(el)
    return () => observer.disconnect()
  }, [boundsW, effectiveBounds?.offsetX, effectiveBounds?.offsetY])

  // Boiling line + SVG style effect — imperatively update CSS filter on the outer wrapper
  // via RAF so the seed cycles per frameHold without React re-renders.
  const charSvgStyleEffectForFilter = (() => {
    const fx = character.activeStyleEffect
    return fx && fx.settings?.enabled && isSVGFilterEffect(fx.type) ? fx : undefined
  })()
  useEffect(() => {
    const boil = character.boilingLine
    const hasBoil = boil?.enabled
    const hasSvgFx = !!charSvgStyleEffectForFilter
    if (!hasBoil && !hasSvgFx) {
      if (targetRef.current) targetRef.current.style.filter = ''
      return
    }
    let rafId: number
    let lastFilterStyle = ''
    const update = () => {
      const frame = useTimelineStore.getState().currentFrame
      const parts: string[] = []
      if (hasSvgFx) parts.push(getStyleEffectFilterStyle(frame, charSvgStyleEffectForFilter!))
      if (hasBoil) parts.push(getComposedFilterStyle(frame, boil!))
      const filterStyle = parts.filter(Boolean).join(' ')
      if (filterStyle !== lastFilterStyle) {
        if (targetRef.current) targetRef.current.style.filter = filterStyle
        lastFilterStyle = filterStyle
      }
      rafId = requestAnimationFrame(update)
    }
    rafId = requestAnimationFrame(update)
    return () => {
      cancelAnimationFrame(rafId)
      if (targetRef.current) targetRef.current.style.filter = ''
    }
  }, [character.boilingLine, charSvgStyleEffectForFilter])

  // Style effect / pixel art — pre-cache sprites when settings change
  // SVG-filter effects skip caching entirely (handled via CSS filter on wrapper div).
  const charPixelArt = character.pixelArt
  const charStyleEffect = character.activeStyleEffect
  const charHasStyleEffect = isEffectEnabled(charStyleEffect)
  const charHasSvgFilterEffect = charHasStyleEffect && isSVGFilterEffect(charStyleEffect!.type)
  const charHasCanvasEffect = charHasStyleEffect && !charHasSvgFilterEffect
  const [pixelCacheTick, setPixelCacheTick] = useState(0)
  useEffect(() => {
    const hasPA = charPixelArt?.enabled
    if (!hasPA && !charHasCanvasEffect) {
      setPixelCacheTick(0)
      return
    }
    // Gather ALL possible sprite sources
    const sources: string[] = []
    if (bodyParts) {
      for (const arr of Object.values(bodyParts)) {
        if (Array.isArray(arr)) {
          for (const s of arr) {
            if (isValidImageSrc(s)) sources.push(s)
          }
        }
      }
    }
    if (referenceImage) sources.push(referenceImage)
    if (restSpriteSrc) sources.push(restSpriteSrc)
    if (curvedVisemes) {
      for (const v of Object.values(curvedVisemes)) {
        if (isValidImageSrc(v)) sources.push(v!)
      }
    }
    if (visemeSpriteMap) {
      for (const v of Object.values(visemeSpriteMap)) {
        if (isValidImageSrc(v)) sources.push(v!)
      }
    }
    if (eyeVariantSprites) {
      for (const v of Object.values(eyeVariantSprites)) {
        if (isValidImageSrc(v)) sources.push(v!)
      }
    }
    if (eyebrowVariantSprites) {
      for (const v of Object.values(eyebrowVariantSprites)) {
        if (isValidImageSrc(v)) sources.push(v!)
      }
    }
    if (charHasCanvasEffect) {
      clearEffectCache(charStyleEffect!.type)
      preCacheEffect(sources, charStyleEffect!)
        .then(() => setPixelCacheTick((t) => t + 1))
        .catch(() => {})
    } else if (hasPA) {
      clearPixelArtCache()
      preCachePixelArt(sources, charPixelArt)
        .then(() => setPixelCacheTick((t) => t + 1))
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    charPixelArt?.enabled,
    charPixelArt?.pixelSize,
    charPixelArt?.colorLevels,
    charPixelArt?.outline,
    charStyleEffect,
  ])

  /** Get effective src: Canvas 2D effected (from cache) or original.
   *  SVG-filter effects return the original src — CSS filter handles the visual. */
  const getEffectiveSrc = useCallback(
    (src: string | null): string | null => {
      if (!src) return src
      if (charHasCanvasEffect) {
        const seed = getAnimatedSeed(useTimelineStore.getState().currentFrame, charStyleEffect!)
        return getEffectFromCache(src, charStyleEffect!, seed) || src
      }
      if (charPixelArt?.enabled) return getPixelatedFromCache(src, charPixelArt) || src
      return src
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [charPixelArt, charStyleEffect, pixelCacheTick],
  )

  // Canvas overlay for rigged mode (pixel art or Canvas 2D style effects only).
  // SVG-filter effects are handled via CSS filter on wrapper div — no overlay needed.
  const effectOverlayRef = useRef<HTMLCanvasElement | null>(null)
  useEffect(() => {
    const hasOverlay = isRiggedMode && (charPixelArt?.enabled || charHasCanvasEffect)
    if (!hasOverlay || !contentRef.current) {
      if (effectOverlayRef.current) effectOverlayRef.current.style.display = 'none'
      return
    }
    let rafId: number
    const OVERLAY_ATTR = 'data-effect-overlay'
    const RIG_CANVAS_SELECTOR = `canvas:not([${OVERLAY_ATTR}])`
    const update = () => {
      const container = contentRef.current
      if (!container) {
        rafId = requestAnimationFrame(update)
        return
      }
      const rigCanvas = container.querySelector(RIG_CANVAS_SELECTOR) as HTMLCanvasElement | null
      if (!rigCanvas || rigCanvas.width === 0) {
        rafId = requestAnimationFrame(update)
        return
      }

      if (!effectOverlayRef.current) {
        const overlay = document.createElement('canvas')
        overlay.setAttribute(OVERLAY_ATTR, 'true')
        overlay.style.position = 'absolute'
        overlay.style.inset = '0'
        overlay.style.width = '100%'
        overlay.style.height = '100%'
        overlay.style.pointerEvents = 'none'
        overlay.style.imageRendering = 'pixelated'
        overlay.style.zIndex = '999'
        container.appendChild(overlay)
        effectOverlayRef.current = overlay
      }

      const overlay = effectOverlayRef.current
      overlay.style.display = ''
      let applied = false
      if (charHasCanvasEffect) {
        const seed = getAnimatedSeed(useTimelineStore.getState().currentFrame, charStyleEffect!)
        applied = processEffectOverlay(rigCanvas, overlay, charStyleEffect!, seed)
      } else {
        applied = pixelateCanvasToOverlay(rigCanvas, overlay, charPixelArt!)
      }
      rigCanvas.style.opacity = applied ? '0' : ''

      rafId = requestAnimationFrame(update)
    }
    rafId = requestAnimationFrame(update)
    return () => {
      cancelAnimationFrame(rafId)
      const container = contentRef.current
      if (container) {
        const rigCanvas = container.querySelector(RIG_CANVAS_SELECTOR) as HTMLCanvasElement | null
        if (rigCanvas) rigCanvas.style.opacity = ''
      }
      if (effectOverlayRef.current) {
        effectOverlayRef.current.style.display = 'none'
      }
    }
  }, [
    isRiggedMode,
    charPixelArt?.enabled,
    charPixelArt?.pixelSize,
    charPixelArt?.colorLevels,
    charPixelArt?.outline,
    charStyleEffect,
  ])

  if (!character.visible) return null

  // Element style: pixel-based positioning like MediaLayer
  const charRotation = character.rotation || 0
  const style: React.CSSProperties = {
    position: 'absolute',
    left: character.position.x - displayWidth / 2,
    top: character.position.y - displayHeight / 2,
    width: displayWidth,
    height: displayHeight,
    zIndex: character.zIndex,
    cursor: character.locked ? 'default' : 'move',
    transform: charRotation !== 0 ? `rotate(${charRotation}deg)` : undefined,
  }

  return (
    <>
      <div ref={targetRef} data-canvas-element="character" style={style} onClick={handleClick}>
        {/* Inner wrapper: Fixed at BASE_CHARACTER_SIZE x BASE_CHARACTER_SIZE and scaled via
            CSS transform (managed by ResizeObserver — avoids fighting Moveable during drag).
            All child pixel-based part transforms scale uniformly with resize.
            Both sprite and rigged modes share this wrapper so switching modes
            does not alter body part positioning or the bounding box. */}
        <div
          ref={contentRef}
          className="select-none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: BASE_CHARACTER_SIZE,
            height: BASE_CHARACTER_SIZE,
            transformOrigin: '0 0',
            // Initial transform uses character.scale; the ResizeObserver effect
            // above will override this imperatively during Moveable drag.
            transform: `scale(${character.scale}) translate(${effectiveBounds ? -effectiveBounds.offsetX : 0}px, ${effectiveBounds ? -effectiveBounds.offsetY : 0}px)`,
          }}
        >
          {effectiveRenderMode === 'rigged' && effectiveRigId ? (
            /* Rigged mode: body deforms via RigPlaybackViewer; all other parts
               (head, hair, eye, eyebrow, viseme, shirt, pants, shoes) render as
               DOM sprite overlays so they are always visible regardless of
               rig-texture compositing timing. */
            (() => {
              const serializedData = serializedRigData
              const overrides = activeLineRef.current?.spriteOverrides || character.defaultSpriteOverrides
              const pixelArtStyle = charPixelArt?.enabled ? ('pixelated' as const) : undefined

              // Build sprite URL map for non-body parts (same logic as sprite mode)
              const rigSpriteMap: Record<LayerPart, string | null> = {
                body: null, // body rendered by RigPlaybackViewer
                head: getEffectiveSrc(
                  isValidImageSrc(bodyParts?.head?.[overrides?.head ?? 0])
                    ? bodyParts!.head[overrides?.head ?? 0]
                    : null,
                ),
                eye: getEffectiveSrc(
                  isValidImageSrc(overrides?.eye != null ? bodyParts?.eye?.[overrides.eye] : null)
                    ? bodyParts!.eye[overrides!.eye!]
                    : isValidImageSrc(defaultEyeSprite)
                      ? defaultEyeSprite
                      : null,
                ),
                eyebrow: getEffectiveSrc(
                  isValidImageSrc(overrides?.eyebrow != null ? bodyParts?.eyebrow?.[overrides.eyebrow] : null)
                    ? bodyParts!.eyebrow[overrides!.eyebrow!]
                    : isValidImageSrc(defaultEyebrowSprite)
                      ? defaultEyebrowSprite
                      : null,
                ),
                hair: getEffectiveSrc(
                  isValidImageSrc(bodyParts?.hair?.[overrides?.hair ?? 0])
                    ? bodyParts!.hair[overrides?.hair ?? 0]
                    : null,
                ),
                viseme: getEffectiveSrc(
                  isValidImageSrc(bodyParts?.viseme?.[overrides?.viseme ?? 0])
                    ? bodyParts!.viseme[overrides?.viseme ?? 0]
                    : null,
                ),
                shirt: getEffectiveSrc(
                  isValidImageSrc(bodyParts?.shirt?.[overrides?.shirt ?? 0])
                    ? bodyParts!.shirt[overrides?.shirt ?? 0]
                    : null,
                ),
                pants: getEffectiveSrc(
                  isValidImageSrc(bodyParts?.pants?.[overrides?.pants ?? 0])
                    ? bodyParts!.pants[overrides?.pants ?? 0]
                    : null,
                ),
                shoes: getEffectiveSrc(
                  isValidImageSrc(bodyParts?.shoes?.[overrides?.shoes ?? 0])
                    ? bodyParts!.shoes[overrides?.shoes ?? 0]
                    : null,
                ),
              }
              return (
                <>
                  {layerOrder.map((part, idx) => {
                    const t = partTransforms[part]
                    if (!t.visible) return null

                    // Body: render via RigPlaybackViewer (mesh deformation)
                    if (part === 'body') {
                      if (hasSvgRig && effectiveRigId) {
                        return (
                          <div
                            key="body"
                            data-part="body"
                            className="absolute inset-0 w-full h-full"
                            style={{
                              zIndex: idx,
                              transform: `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scaleX}, ${t.scaleY})`,
                              transformOrigin: 'center center',
                              overflow: 'visible',
                            }}
                          >
                            <SVGElementRigRenderer
                              rigId={effectiveRigId}
                              characterId={character.id}
                              width={BASE_CHARACTER_SIZE}
                              height={BASE_CHARACTER_SIZE}
                            />
                          </div>
                        )
                      }
                      if (!serializedData) return null
                      if (!rigViewerReady) return null
                      return (
                        <div
                          key="body"
                          data-part="body"
                          className="absolute inset-0 w-full h-full"
                          style={{
                            zIndex: idx,
                            transform: `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scaleX}, ${t.scaleY})`,
                            transformOrigin: 'center center',
                            overflow: 'visible',
                          }}
                        >
                          <RigPlaybackViewer
                            ref={rigCanvasRef}
                            data={serializedData}
                            width={BASE_CHARACTER_SIZE}
                            height={BASE_CHARACTER_SIZE}
                            showBones={character.showBones !== false}
                            isPlaying={false}
                            padRatio={0}
                            onReady={handleRigViewerReady}
                          />
                        </div>
                      )
                    }

                    // Non-body parts: render as DOM sprite overlays
                    const partStyle: React.CSSProperties = {
                      zIndex: idx,
                      transform: `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scaleX}, ${t.scaleY})`,
                      transformOrigin: 'center center',
                      imageRendering: pixelArtStyle,
                    }

                    if (part === 'eye') {
                      const src = rigSpriteMap.eye
                      if (!src && !canSwitchExpressions) return null
                      return (
                        <img
                          key="eye"
                          data-part="eye"
                          ref={eyeImgRef}
                          {...(canSwitchExpressions ? {} : { src: src! })}
                          alt="Eye"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          draggable={false}
                          onLoad={handlePartImageLoad}
                          style={partStyle}
                        />
                      )
                    }

                    if (part === 'eyebrow') {
                      const src = rigSpriteMap.eyebrow
                      if (!src && !canSwitchExpressions) return null
                      return (
                        <img
                          key="eyebrow"
                          data-part="eyebrow"
                          ref={eyebrowImgRef}
                          {...(canSwitchExpressions ? {} : { src: src! })}
                          alt="Eyebrow"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          draggable={false}
                          onLoad={handlePartImageLoad}
                          style={partStyle}
                        />
                      )
                    }

                    if (part === 'viseme') {
                      if (canLipSync) {
                        return (
                          <div
                            key="viseme"
                            data-part="viseme"
                            className="absolute inset-0 w-full h-full"
                            style={partStyle}
                          >
                            <img
                              ref={visemeImgRefA}
                              alt="Mouth"
                              className="w-full h-full object-contain pointer-events-none"
                              draggable={false}
                              onLoad={handlePartImageLoad}
                            />
                            <img
                              ref={visemeImgRefB}
                              alt="Mouth"
                              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                              draggable={false}
                            />
                          </div>
                        )
                      }
                      const src = rigSpriteMap.viseme
                      if (!src) return null
                      return (
                        <img
                          key="viseme"
                          data-part="viseme"
                          src={src}
                          alt="Mouth"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          draggable={false}
                          onLoad={handlePartImageLoad}
                          style={partStyle}
                        />
                      )
                    }

                    // head, hair, shirt, pants, shoes
                    const src = rigSpriteMap[part]
                    if (!src) return null
                    return (
                      <img
                        key={part}
                        data-part={part}
                        src={src}
                        alt={part}
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        draggable={false}
                        onLoad={handlePartImageLoad}
                        style={partStyle}
                      />
                    )
                  })}
                </>
              )
            })()
          ) : hasBodyParts && bodyParts ? (
            /* 8-layer body composite: layer order driven by store */
            (() => {
              const overrides = activeLineRef.current?.spriteOverrides || character.defaultSpriteOverrides
              const rawBody = bodyParts.body?.[overrides?.body ?? 0]
              const rawHead = bodyParts.head?.[overrides?.head ?? 0]
              const rawEye = (overrides?.eye != null ? bodyParts.eye?.[overrides.eye] : null) || defaultEyeSprite
              const rawEyebrow =
                (overrides?.eyebrow != null ? bodyParts.eyebrow?.[overrides.eyebrow] : null) || defaultEyebrowSprite
              const rawHair = bodyParts.hair?.[overrides?.hair ?? 0]
              const rawViseme = bodyParts.viseme?.[overrides?.viseme ?? 0]
              const rawShirt = bodyParts.shirt?.[overrides?.shirt ?? 0]
              const rawPants = bodyParts.pants?.[overrides?.pants ?? 0]
              const rawShoes = bodyParts.shoes?.[overrides?.shoes ?? 0]
              const pixelArtStyle = charPixelArt?.enabled ? ('pixelated' as const) : undefined
              const spriteMap: Record<LayerPart, string | null> = {
                body: getEffectiveSrc(isValidImageSrc(rawBody) ? rawBody : null),
                head: getEffectiveSrc(isValidImageSrc(rawHead) ? rawHead : null),
                eye: getEffectiveSrc(isValidImageSrc(rawEye) ? rawEye : null),
                eyebrow: getEffectiveSrc(isValidImageSrc(rawEyebrow) ? rawEyebrow : null),
                hair: getEffectiveSrc(isValidImageSrc(rawHair) ? rawHair : null),
                viseme: getEffectiveSrc(isValidImageSrc(rawViseme) ? rawViseme : null),
                shirt: getEffectiveSrc(isValidImageSrc(rawShirt) ? rawShirt : null),
                pants: getEffectiveSrc(isValidImageSrc(rawPants) ? rawPants : null),
                shoes: getEffectiveSrc(isValidImageSrc(rawShoes) ? rawShoes : null),
              }
              return (
                <>
                  {layerOrder.map((part, idx) => {
                    const src = spriteMap[part]
                    const t = partTransforms[part]
                    if (!t.visible) return null

                    const partStyle: React.CSSProperties = {
                      zIndex: idx,
                      transform: `translate(${t.x}px, ${t.y}px) rotate(${t.rotation}deg) scale(${t.scaleX}, ${t.scaleY})`,
                      transformOrigin: 'center center',
                      imageRendering: pixelArtStyle,
                    }

                    if (part === 'eye') {
                      // When canSwitchExpressions, src is managed imperatively by expression RAF.
                      // Do NOT set React src — re-renders would overwrite RAF-set expression sprites.
                      // Eye element must render even if src is null — RAF will set src via ref.
                      if (!src && !canSwitchExpressions) return null
                      return (
                        <img
                          key="eye"
                          data-part="eye"
                          ref={eyeImgRef}
                          {...(canSwitchExpressions ? {} : { src: src! })}
                          alt="Eye"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          draggable={false}
                          onLoad={handlePartImageLoad}
                          style={partStyle}
                        />
                      )
                    }

                    if (part === 'eyebrow') {
                      // When canSwitchExpressions, src is managed imperatively by expression RAF.
                      if (!src && !canSwitchExpressions) return null
                      return (
                        <img
                          key="eyebrow"
                          data-part="eyebrow"
                          ref={eyebrowImgRef}
                          {...(canSwitchExpressions ? {} : { src: src! })}
                          alt="Eyebrow"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          draggable={false}
                          onLoad={handlePartImageLoad}
                          style={partStyle}
                        />
                      )
                    }

                    if (part === 'viseme') {
                      if (canLipSync) {
                        // ALWAYS render when canLipSync — RAF manages src imperatively via refs.
                        // Do NOT skip based on spriteMap.viseme — the RAF resolves sprites independently.
                        return (
                          <div
                            key="viseme"
                            data-part="viseme"
                            className="absolute inset-0 w-full h-full"
                            style={partStyle}
                          >
                            <img
                              ref={visemeImgRefA}
                              alt="Mouth"
                              className="w-full h-full object-contain pointer-events-none"
                              draggable={false}
                              onLoad={handlePartImageLoad}
                            />
                            <img
                              ref={visemeImgRefB}
                              alt="Mouth"
                              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                              draggable={false}
                            />
                          </div>
                        )
                      }
                      if (!src) return null
                      return (
                        <img
                          key="viseme"
                          data-part="viseme"
                          src={src}
                          alt="Mouth"
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                          draggable={false}
                          onLoad={handlePartImageLoad}
                          style={partStyle}
                        />
                      )
                    }

                    // All other parts: skip if no src
                    if (!src) return null
                    return (
                      <img
                        key={part}
                        data-part={part}
                        src={src}
                        alt={part}
                        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                        draggable={false}
                        onLoad={handlePartImageLoad}
                        style={partStyle}
                      />
                    )
                  })}
                </>
              )
            })()
          ) : canLipSync && restSpriteSrc ? (
            /* Single layer: viseme sprites with dual images for cross-fade transitions.
             src and opacity managed imperatively by RAF + useLayoutEffect — NOT set here. */
            <>
              <img
                ref={visemeImgRefA}
                alt={character.name}
                className="w-full h-full object-contain pointer-events-none"
                draggable={false}
                style={{ imageRendering: charPixelArt?.enabled ? 'pixelated' : undefined }}
              />
              <img
                ref={visemeImgRefB}
                alt={character.name}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                draggable={false}
                style={{ imageRendering: charPixelArt?.enabled ? 'pixelated' : undefined }}
              />
            </>
          ) : referenceImage ? (
            /* Reference image fallback */
            <img
              src={getEffectiveSrc(referenceImage) || referenceImage}
              alt={character.name}
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
              style={{ imageRendering: charPixelArt?.enabled ? 'pixelated' : undefined }}
            />
          ) : (
            /* Placeholder */
            <div className="w-full h-full bg-gradient-to-b from-zinc-600 to-zinc-700 rounded-lg flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full mb-2" style={{ backgroundColor: character.color || '#52525b' }} />
              <span className="text-xs text-zinc-400">{character.name}</span>
            </div>
          )}
        </div>

        {/* Character Name Label */}
        <div
          className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap pointer-events-none"
          style={{
            backgroundColor: character.color + '33',
            color: character.color,
            borderColor: character.color + '55',
            borderWidth: '1px',
          }}
        >
          {character.name}
        </div>

        {/* Remove Button — centered above the rotate handle */}
        {isSelected && !character.locked && (
          <button
            onClick={handleRemove}
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-9 h-9 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg z-10"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Moveable control box — only shown when selected */}
      {isSelected && !character.locked && (
        <SelectionTransformBox
          targetRef={targetRef}
          onTransformEnd={handleTransformEnd}
          onLiveTransform={handleLiveTransform}
          keepRatio={true}
          color="#4a7eff"
        />
      )}
    </>
  )
})
