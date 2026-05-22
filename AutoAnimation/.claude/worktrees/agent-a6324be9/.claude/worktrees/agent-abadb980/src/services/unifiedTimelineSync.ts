/**
 * Unified Timeline Sync Service
 *
 * Bidirectional sync between the unified timeline store and native object stores.
 * - When objects are added/removed in native stores → create/remove clips in unified timeline
 * - When clip time ranges change in unified timeline → update native store time ranges
 * - When video tracks are reordered → update zIndex in native stores
 *
 * Uses a `_syncing` guard flag to prevent infinite update loops.
 */

import type { ClipSourceType } from '@/types/unifiedTimeline'
import { useUnifiedTimelineStore, CLIP_SOURCE_COLORS } from '@/stores/useUnifiedTimelineStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTimelineStore } from '@/stores'

// ─── Time Range Sync Adapters ────────────────────────────────────────────────
// Each adapter pushes a time range change from the unified clip back to the native store.

type TimeRangeSyncFn = (sourceId: string, startFrame: number, endFrame: number) => void

const timeRangeSyncAdapters: Record<ClipSourceType, TimeRangeSyncFn | null> = {
  text: (id, sf, ef) => useTextOverlayStore.getState().setOverlayTimeRange(id, sf, ef),
  media: (id, sf, ef) => useMediaStore.getState().setCanvasItemTimeRange(id, sf, ef),
  lottie: (id, sf, ef) => useAnimationStore.getState().setAnimationTimeRange(id, sf, ef),
  shape: (id, sf, ef) => useShapeStore.getState().setShapeTimeRange(id, sf, ef),
  svgObject: (id, sf, ef) => useSVGObjectStore.getState().setObjectTimeRange(id, sf, ef),
  character3d: (id, sf, ef) => use3DCharacterStore.getState().set3DCharacterTimeRange(id, sf, ef),
  htmlTemplate: (id, sf, ef) =>
    useHTMLTemplateLayerStore.getState().updateTemplate(id, { startFrame: sf, endFrame: ef }),
  dialogueLine: (id, sf, ef) =>
    useMultiCharacterStore.getState().updateDialogueLine(id, { startFrame: sf, endFrame: ef }),
  dialogue: null, // character presence auto-spans its dialogue lines
  video: null, // video layer has no startFrame/endFrame
}

/** Push a clip's time range change to the native store */
export function syncClipTimeRangeToNativeStore(
  sourceType: ClipSourceType,
  sourceId: string,
  startFrame: number,
  endFrame: number,
): void {
  const adapter = timeRangeSyncAdapters[sourceType]
  if (adapter) {
    const store = useUnifiedTimelineStore.getState()
    store.setSyncing(true)
    try {
      adapter(sourceId, startFrame, endFrame)
    } finally {
      store.setSyncing(false)
    }
  }
}

// ─── Z-Order Sync ────────────────────────────────────────────────────────────

type ZIndexSyncFn = (sourceId: string, zIndex: number) => void

const zIndexSyncAdapters: Partial<Record<ClipSourceType, ZIndexSyncFn>> = {
  text: (id, z) => useTextOverlayStore.getState().updateOverlay(id, { zIndex: z }),
  media: (id, z) => useMediaStore.getState().updateCanvasItem(id, { zIndex: z }),
  lottie: (id, z) => useAnimationStore.getState().updateActiveAnimation(id, { zIndex: z }),
  shape: (id, z) => useShapeStore.getState().updateShape(id, { zIndex: z }),
  svgObject: (id, z) => useSVGObjectStore.getState().setObjectZIndex(id, z),
  character3d: (id, z) => use3DCharacterStore.getState().update3DCharacter(id, { zIndex: z }),
  htmlTemplate: (id, z) => useHTMLTemplateLayerStore.getState().updateTemplate(id, { zIndex: z }),
  dialogue: (id, z) => useMultiCharacterStore.getState().updateDialogueCharacter(id, { zIndex: z }),
}

/**
 * Sync z-order from video track order to native stores.
 * V1 clips get zIndex=10, V2=20, V3=30, etc.
 */
export function syncZOrderToStores(): void {
  const { videoTracks } = useUnifiedTimelineStore.getState()

  const store = useUnifiedTimelineStore.getState()
  store.setSyncing(true)
  try {
    for (const track of videoTracks) {
      const zBase = track.number * 10
      for (const clip of track.clips) {
        const adapter = zIndexSyncAdapters[clip.sourceType]
        if (adapter) {
          adapter(clip.sourceId, zBase)
        }
      }
    }
  } finally {
    store.setSyncing(false)
  }
}

// ─── Native Store → Unified Timeline Subscriptions ───────────────────────────
// Detect object additions/removals in native stores and create/remove clips.

let unsubscribers: (() => void)[] = []

interface NativeItem {
  id: string
  startFrame: number
  endFrame: number
  name?: string
}

function autoPlaceFromNative(
  sourceType: ClipSourceType,
  sourceId: string,
  startFrame: number,
  endFrame: number,
  name: string,
  preferredKind: 'video' | 'audio' = 'video',
): void {
  const store = useUnifiedTimelineStore.getState()
  // Skip if already tracked
  if (store.findClipBySource(sourceType, sourceId)) return

  store.autoPlaceClip(
    {
      sourceType,
      sourceId,
      startFrame,
      endFrame,
      name,
      color: CLIP_SOURCE_COLORS[sourceType],
      locked: false,
    },
    preferredKind,
  )
}

function removeFromUnified(sourceType: ClipSourceType, sourceId: string): void {
  const store = useUnifiedTimelineStore.getState()
  store.removeClipBySource(sourceType, sourceId)
}

/** Update the unified clip's time range when native store changes (native → unified direction) */
function syncNativeTimeToUnified(
  sourceType: ClipSourceType,
  sourceId: string,
  startFrame: number,
  endFrame: number,
): void {
  const store = useUnifiedTimelineStore.getState()
  const found = store.findClipBySource(sourceType, sourceId)
  if (found && (found.clip.startFrame !== startFrame || found.clip.endFrame !== endFrame)) {
    store.updateClipTimeRange(found.clip.id, startFrame, endFrame)
  }
}

/**
 * Generic differ: given previous and current arrays of items, detect adds/removes/updates.
 * Uses Map for O(n) lookup instead of Set-based O(n²).
 */
function diffItems<T extends NativeItem>(
  prev: T[],
  curr: T[],
  sourceType: ClipSourceType,
  getName: (item: T) => string,
  preferredKind: 'video' | 'audio' = 'video',
): void {
  // Short-circuit: if reference is identical (Immer preserves references on no-change), skip
  if (prev === curr) return

  const prevMap = new Map<string, T>()
  for (const item of prev) prevMap.set(item.id, item)

  const currMap = new Map<string, T>()
  for (const item of curr) currMap.set(item.id, item)

  // Additions + time range updates
  for (const item of curr) {
    if (!prevMap.has(item.id)) {
      autoPlaceFromNative(sourceType, item.id, item.startFrame, item.endFrame, getName(item), preferredKind)
    } else {
      syncNativeTimeToUnified(sourceType, item.id, item.startFrame, item.endFrame)
    }
  }

  // Removals
  for (const item of prev) {
    if (!currMap.has(item.id)) {
      removeFromUnified(sourceType, item.id)
    }
  }
}

/** Start all native store subscriptions */
export function startNativeStoreSubscriptions(): void {
  // Stop any existing subscriptions first
  stopNativeStoreSubscriptions()

  // Text overlays
  let prevTextOverlays = useTextOverlayStore.getState().overlays
  unsubscribers.push(
    useTextOverlayStore.subscribe((state) => {
      const curr = state.overlays
      if (!useUnifiedTimelineStore.getState()._syncing) {
        diffItems(prevTextOverlays, curr, 'text', (o) => o.content?.slice(0, 20) || o.presetType || 'Text')
      }
      prevTextOverlays = curr // always update to avoid stale diffs
    })
  )

  // Media canvas items
  let prevMediaItems = useMediaStore.getState().canvasItems
  unsubscribers.push(
    useMediaStore.subscribe((state) => {
      const curr = state.canvasItems
      if (!useUnifiedTimelineStore.getState()._syncing) {
        const mediaAssets = state.assets
        diffItems(
          prevMediaItems, curr, 'media',
          (item) => {
            const asset = mediaAssets.find((a) => a.id === item.assetId)
            return asset?.name || 'Media'
          },
        )
      }
      prevMediaItems = curr
    })
  )

  // Lottie animations
  let prevAnimations = useAnimationStore.getState().activeAnimations
  unsubscribers.push(
    useAnimationStore.subscribe((state) => {
      const curr = state.activeAnimations
      if (!useUnifiedTimelineStore.getState()._syncing) {
        const lib = state.library
        diffItems(
          prevAnimations, curr, 'lottie',
          (a) => lib.find((l) => l.id === a.animationId)?.name || 'Lottie',
        )
      }
      prevAnimations = curr
    })
  )

  // Shapes
  let prevShapes = useShapeStore.getState().shapes
  unsubscribers.push(
    useShapeStore.subscribe((state) => {
      const curr = state.shapes
      if (!useUnifiedTimelineStore.getState()._syncing) {
        diffItems(prevShapes, curr, 'shape', (s) => s.name || s.type)
      }
      prevShapes = curr
    })
  )

  // SVG Objects
  let prevSvgObjects = useSVGObjectStore.getState().composition?.objects || []
  unsubscribers.push(
    useSVGObjectStore.subscribe((state) => {
      const curr = state.composition?.objects || []
      if (!useUnifiedTimelineStore.getState()._syncing) {
        diffItems(prevSvgObjects, curr, 'svgObject', (o) => o.name || 'SVG')
      }
      prevSvgObjects = curr
    })
  )

  // 3D Characters (startFrame/endFrame are optional, default to 0/totalFrames)
  let prev3DChars = use3DCharacterStore.getState().characters
  unsubscribers.push(
    use3DCharacterStore.subscribe((state) => {
      const curr = state.characters
      if (!useUnifiedTimelineStore.getState()._syncing) {
        const tf = useTimelineStore.getState().totalFrames
        const normalized = curr.map((c) => ({
          ...c,
          startFrame: c.startFrame ?? 0,
          endFrame: c.endFrame ?? tf,
        }))
        const prevNormalized = prev3DChars.map((c) => ({
          ...c,
          startFrame: c.startFrame ?? 0,
          endFrame: c.endFrame ?? tf,
        }))
        diffItems(prevNormalized, normalized, 'character3d', (c) => c.name || '3D Character')
      }
      prev3DChars = curr
    })
  )

  // HTML Templates
  let prevTemplates = useHTMLTemplateLayerStore.getState().templates
  unsubscribers.push(
    useHTMLTemplateLayerStore.subscribe((state) => {
      const curr = state.templates
      if (!useUnifiedTimelineStore.getState()._syncing) {
        diffItems(prevTemplates, curr, 'htmlTemplate', (t) => t.name || 'Template')
      }
      prevTemplates = curr
    })
  )

  // Dialogue characters (visual presence clips)
  let prevDialogueChars = useMultiCharacterStore.getState().characters
  let prevDialogueLines = useMultiCharacterStore.getState().dialogueLines
  unsubscribers.push(
    useMultiCharacterStore.subscribe((state) => {
      const currChars = state.characters
      const currLines = state.dialogueLines

      if (!useUnifiedTimelineStore.getState()._syncing) {
        // Handle dialogue character additions/removals
        const prevCharIds = new Set(prevDialogueChars.map((c) => c.id))
        const currCharIds = new Set(currChars.map((c) => c.id))

        for (const char of currChars) {
          if (!prevCharIds.has(char.id)) {
            // New character — compute span from its lines
            const charLines = currLines.filter((l) => l.characterId === char.id)
            if (charLines.length > 0) {
              const sf = Math.min(...charLines.map((l) => l.startFrame))
              const ef = Math.max(...charLines.map((l) => l.endFrame))
              autoPlaceFromNative('dialogue', char.id, sf, ef, char.name, 'video')
            }
          }
        }

        for (const char of prevDialogueChars) {
          if (!currCharIds.has(char.id)) {
            removeFromUnified('dialogue', char.id)
          }
        }

        // Handle dialogue line additions/removals (audio clips)
        const prevLineIds = new Set(prevDialogueLines.map((l) => l.id))
        const currLineIds = new Set(currLines.map((l) => l.id))

        for (const line of currLines) {
          if (!prevLineIds.has(line.id)) {
            const char = currChars.find((c) => c.id === line.characterId)
            autoPlaceFromNative(
              'dialogueLine', line.id, line.startFrame, line.endFrame,
              `${char?.name || 'Char'}: ${line.script.slice(0, 15)}`, 'audio',
            )
          } else {
            // Sync time range updates for existing lines
            syncNativeTimeToUnified('dialogueLine', line.id, line.startFrame, line.endFrame)
          }
        }

        for (const line of prevDialogueLines) {
          if (!currLineIds.has(line.id)) {
            removeFromUnified('dialogueLine', line.id)
          }
        }

        // Update dialogue character clip spans when lines change
        for (const char of currChars) {
          const charLines = currLines.filter((l) => l.characterId === char.id)
          if (charLines.length > 0) {
            const sf = Math.min(...charLines.map((l) => l.startFrame))
            const ef = Math.max(...charLines.map((l) => l.endFrame))
            syncNativeTimeToUnified('dialogue', char.id, sf, ef)
          } else {
            // No remaining lines — remove the character presence clip
            removeFromUnified('dialogue', char.id)
          }
        }
      }

      // Always update prev references to avoid stale diffs
      prevDialogueChars = currChars
      prevDialogueLines = currLines
    })
  )
}

/** Stop all native store subscriptions */
export function stopNativeStoreSubscriptions(): void {
  for (const unsub of unsubscribers) {
    unsub()
  }
  unsubscribers = []
}

// ─── Migration: Scan Native Stores → Populate Unified Tracks ─────────────────

/**
 * Migrate all existing objects from native stores into the unified timeline.
 * Called when loading a project that doesn't have unified timeline data.
 */
export function migrateNativeStoresToUnifiedTimeline(): void {
  const store = useUnifiedTimelineStore.getState()

  // Reset to defaults first
  store.reset()

  const tf = useTimelineStore.getState().totalFrames

  // Text overlays
  for (const overlay of useTextOverlayStore.getState().overlays) {
    store.autoPlaceClip(
      {
        sourceType: 'text',
        sourceId: overlay.id,
        startFrame: overlay.startFrame,
        endFrame: overlay.endFrame,
        name: overlay.content?.slice(0, 20) || overlay.presetType || 'Text',
        color: CLIP_SOURCE_COLORS.text,
        locked: false,
      },
      'video',
    )
  }

  // Media canvas items
  const mediaState = useMediaStore.getState()
  for (const item of mediaState.canvasItems) {
    const asset = mediaState.assets.find((a) => a.id === item.assetId)
    store.autoPlaceClip(
      {
        sourceType: 'media',
        sourceId: item.id,
        startFrame: item.startFrame,
        endFrame: item.endFrame,
        name: asset?.name || 'Media',
        color: CLIP_SOURCE_COLORS.media,
        locked: false,
      },
      'video',
    )
  }

  // Lottie animations
  const animState = useAnimationStore.getState()
  for (const anim of animState.activeAnimations) {
    const libEntry = animState.library.find((l) => l.id === anim.animationId)
    store.autoPlaceClip(
      {
        sourceType: 'lottie',
        sourceId: anim.id,
        startFrame: anim.startFrame,
        endFrame: anim.endFrame,
        name: libEntry?.name || 'Lottie',
        color: CLIP_SOURCE_COLORS.lottie,
        locked: false,
      },
      'video',
    )
  }

  // Shapes
  for (const shape of useShapeStore.getState().shapes) {
    store.autoPlaceClip(
      {
        sourceType: 'shape',
        sourceId: shape.id,
        startFrame: shape.startFrame,
        endFrame: shape.endFrame,
        name: shape.name || shape.type,
        color: CLIP_SOURCE_COLORS.shape,
        locked: false,
      },
      'video',
    )
  }

  // SVG Objects
  const svgObjects = useSVGObjectStore.getState().composition?.objects || []
  for (const obj of svgObjects) {
    store.autoPlaceClip(
      {
        sourceType: 'svgObject',
        sourceId: obj.id,
        startFrame: obj.startFrame,
        endFrame: obj.endFrame,
        name: obj.name || 'SVG',
        color: CLIP_SOURCE_COLORS.svgObject,
        locked: false,
      },
      'video',
    )
  }

  // 3D Characters
  for (const char of use3DCharacterStore.getState().characters) {
    store.autoPlaceClip(
      {
        sourceType: 'character3d',
        sourceId: char.id,
        startFrame: char.startFrame ?? 0,
        endFrame: char.endFrame ?? tf,
        name: char.name || '3D Character',
        color: CLIP_SOURCE_COLORS.character3d,
        locked: false,
      },
      'video',
    )
  }

  // HTML Templates
  for (const tpl of useHTMLTemplateLayerStore.getState().templates) {
    store.autoPlaceClip(
      {
        sourceType: 'htmlTemplate',
        sourceId: tpl.id,
        startFrame: tpl.startFrame,
        endFrame: tpl.endFrame,
        name: tpl.name || 'Template',
        color: CLIP_SOURCE_COLORS.htmlTemplate,
        locked: false,
      },
      'video',
    )
  }

  // Dialogue characters + lines
  const mcState = useMultiCharacterStore.getState()
  for (const char of mcState.characters) {
    const charLines = mcState.dialogueLines.filter((l) => l.characterId === char.id)
    if (charLines.length > 0) {
      const sf = Math.min(...charLines.map((l) => l.startFrame))
      const ef = Math.max(...charLines.map((l) => l.endFrame))

      // Character presence = video clip
      store.autoPlaceClip(
        {
          sourceType: 'dialogue',
          sourceId: char.id,
          startFrame: sf,
          endFrame: ef,
          name: char.name,
          color: CLIP_SOURCE_COLORS.dialogue,
          locked: false,
        },
        'video',
      )

      // Each dialogue line = audio clip
      for (const line of charLines) {
        store.autoPlaceClip(
          {
            sourceType: 'dialogueLine',
            sourceId: line.id,
            startFrame: line.startFrame,
            endFrame: line.endFrame,
            name: `${char.name}: ${line.script.slice(0, 15)}`,
            color: CLIP_SOURCE_COLORS.dialogueLine,
            locked: false,
          },
          'audio',
        )
      }
    }
  }

  // Sync z-order after migration
  syncZOrderToStores()
}
