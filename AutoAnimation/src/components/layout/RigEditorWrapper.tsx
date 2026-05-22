/**
 * RigEditorWrapper — lazy-loaded wrapper that provides the BoneRiggingProvider
 * context and auto-save logic for the 2D rig editor mode.
 *
 * Extracted from EditorLayout so bonerigging vendor code (~12 KB) is code-split
 * and only loaded when the user opens the rig editor tab.
 */
import { useMemo, useEffect, useRef, useState } from 'react'
import { BoneRiggingProvider, useEngineContext } from '@bonerigging/editor'
import { useRigEditorBridge } from '@/hooks/useRigEditorBridge'
import { useRigStore } from '@/stores/useRigStore'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { BoneRiggingConverter } from '@bonerigging/core'
import type { CharacterLibraryEntry } from '@bonerigging/core'
import type { SerializedRigData } from '@bonerigging/core'
import { useTimelineStore } from '@/stores/useTimelineStore'

interface SavedPartTransform {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  visible: boolean
}

/** Default layer order for compositing (bottom -> top). */
const DEFAULT_COMPOSITE_LAYER_ORDER = [
  'body',
  'shirt',
  'pants',
  'shoes',
  'head',
  'eye',
  'eyebrow',
  'viseme',
  'hair',
] as const

/**
 * Load an image from a URL. Returns null on error.
 */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/** Extract raw SVG text from a data:image/svg+xml URL (base64 or URI-encoded). */
function extractSvgSource(url: string): string | undefined {
  if (!url.startsWith('data:image/svg+xml')) return undefined
  const commaIdx = url.indexOf(',')
  if (commaIdx < 0) return undefined
  const payload = url.slice(commaIdx + 1)
  try {
    return url.includes(';base64,') ? atob(payload) : decodeURIComponent(payload)
  } catch {
    return undefined
  }
}

/**
 * Composite all character body part sprites into a single data URL,
 * applying part transforms (position, rotation, scale) so the result
 * matches what the user sees on the canvas.
 *
 * On the canvas (CharacterLayer.tsx), each part is rendered inside a
 * 200x200 container with `object-contain` and CSS transforms:
 *   transform: translate(t.x px, t.y px) rotate(t.rotation deg) scale(t.scaleX, t.scaleY)
 *   transform-origin: center center
 *
 * This function reproduces that exact behaviour on a canvas2d surface
 * sized to the body image's natural resolution.
 */
async function compositeCharacterParts(
  bodyParts: Record<string, string[]>,
  partTransforms?: Record<string, SavedPartTransform>,
  selectedSprites?: Record<string, number | null>,
  eyeVariantsNeutral?: string | null,
  layerOrder?: readonly string[],
): Promise<string> {
  // Body sprite is required
  const bodyUrl = bodyParts.body?.[0]
  if (!bodyUrl) throw new Error('No body sprite')

  const bodyImg = await loadImage(bodyUrl)
  if (!bodyImg) throw new Error('Failed to load body sprite')

  const bw = bodyImg.naturalWidth || bodyImg.width
  const bh = bodyImg.naturalHeight || bodyImg.height

  // On the canvas, all parts sit inside a SQUARE 200x200 container with
  // `object-contain`. To reproduce correct spatial relationships we render
  // on a square canvas first, then crop to the actual content bounds.
  const dim = Math.max(bw, bh)
  const tmpCanvas = document.createElement('canvas')
  tmpCanvas.width = dim
  tmpCanvas.height = dim
  const ctx = tmpCanvas.getContext('2d', { willReadFrequently: true })!

  // Uniform scale from 200px container -> square composite canvas
  const BASE = 200
  const uniScale = dim / BASE

  // Use provided layer order or fall back to default
  const order = layerOrder || DEFAULT_COMPOSITE_LAYER_ORDER

  // Draw each part in layer order
  for (const part of order) {
    const t = partTransforms?.[part]
    if (t && !t.visible) continue

    let url: string | null = null
    const sprites = bodyParts[part]
    if (sprites && sprites.length > 0) {
      const idx = selectedSprites?.[part] ?? 0
      url = sprites[idx] ?? sprites[0] ?? null
    }
    if (!url && part === 'eye' && eyeVariantsNeutral) {
      url = eyeVariantsNeutral
    }
    if (!url) continue

    const img = part === 'body' ? bodyImg : await loadImage(url)
    if (!img) continue

    const iw = img.naturalWidth || img.width
    const ih = img.naturalHeight || img.height

    // Object-contain within the square canvas (same as 200x200 container)
    const fitScale = Math.min(dim / iw, dim / ih)
    const dw = iw * fitScale
    const dh = ih * fitScale

    ctx.save()
    if (t) {
      ctx.translate(dim / 2 + t.x * uniScale, dim / 2 + t.y * uniScale)
      ctx.rotate((t.rotation * Math.PI) / 180)
      ctx.scale(t.scaleX, t.scaleY)
    } else {
      ctx.translate(dim / 2, dim / 2)
    }
    ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
    ctx.restore()
  }

  // Return the full dim x dim canvas WITHOUT cropping.
  // The compositing canvas is a scaled version of the 200x200 display container
  // (dim = max(bodyW, bodyH), scale = dim/200). Keeping it uncropped preserves
  // the 1:1 coordinate mapping. When the rig viewer renders at 200x200 with
  // cssScale = 200/dim, every part lands at the exact same visual position as
  // the original sprite display. Cropping would break this mapping, causing
  // the rigged character to appear at the wrong size.
  return tmpCanvas.toDataURL('image/png')
}

export function RigEditorWrapper({ children }: { children: React.ReactNode }) {
  const { initialData, handleSave, handleAutoSave } = useRigEditorBridge()
  const savedCharacters = useSavedCharactersStore((s) => s.characters)
  // Get the active dialogue character's savedCharacterId so the rig editor
  // auto-selects the right character instead of showing "Select Character"
  const activeDialogueChar = useMultiCharacterStore((s) =>
    s.activeCharacterId ? s.characters.find((c) => c.id === s.activeCharacterId) : null,
  )
  const activeSavedCharId = activeDialogueChar?.savedCharacterId || null

  // Get dialogue characters to resolve per-character layerOrder
  const dialogueCharacters = useMultiCharacterStore((s) => s.characters)

  // Look up existing rigs so we can attach savedRigData per character
  const rigs = useRigStore((s) => s.rigs)

  // Build saved-rig lookup: savedCharacterId → SerializedRigData
  // Used so switching characters in the editor restores existing rigs instead of auto-rigging.
  const poseTracks = useRigStore((s) => s.poseTracks)
  const savedRigByCharId = useMemo(() => {
    const map = new Map<string, SerializedRigData>()
    for (const sc of savedCharacters) {
      // 1. Find dialogue character → check explicit rigId
      const dc = dialogueCharacters.find((d) => d.savedCharacterId === sc.id)
      const rigId = dc?.rigId
      const rig = rigId ? rigs[rigId] : null

      if (rig) {
        // Prefer full-fidelity bonerigging data
        if (rig.boneriggingSerializedData) {
          try {
            map.set(sc.id, JSON.parse(rig.boneriggingSerializedData) as SerializedRigData)
            continue
          } catch {
            /* fall through */
          }
        }
        // Lossy fallback — still preserves joint positions
        try {
          const fps = useTimelineStore.getState().fps || 24
          map.set(sc.id, BoneRiggingConverter.fromAutoStudioRigData(rig, poseTracks, fps))
          continue
        } catch {
          /* ignore */
        }
      }

      // 2. No explicit rigId — try source image matching across all rigs
      const bodySprites = sc.bodyParts?.body || []
      if (bodySprites.length === 0) continue
      for (const r of Object.values(rigs)) {
        if (!r.boneriggingSerializedData) continue
        try {
          const parsed = JSON.parse(r.boneriggingSerializedData) as SerializedRigData
          if (parsed.sourceImageUrl && bodySprites.includes(parsed.sourceImageUrl)) {
            map.set(sc.id, parsed)
            break
          }
        } catch {
          /* ignore */
        }
      }
    }
    return map
  }, [savedCharacters, dialogueCharacters, rigs, poseTracks])

  // Build character list with body-only URLs first, then async-composite all parts
  const baseEntries = useMemo(() => {
    return savedCharacters
      .filter((c) => {
        if (!c._hydrated) return false
        return !!c.bodyParts?.body?.[0]
      })
      .map((c) => {
        // Find the dialogue character linked to this saved character for its layerOrder
        const dialogueChar = dialogueCharacters.find((dc) => dc.savedCharacterId === c.id)
        return {
          id: c.id,
          name: c.name,
          thumbnailUrl: c.referenceImage || c.bodyParts!.body![0],
          bodyUrl: c.bodyParts!.body![0],
          bodyParts: c.bodyParts as Record<string, string[]>,
          partTransforms: c.partTransforms as Record<string, SavedPartTransform> | undefined,
          selectedSprites: c.selectedSprites as Record<string, number | null> | undefined,
          eyeVariantsNeutral: c.eyeVariants?.neutral || null,
          layerOrder: dialogueChar?.layerOrder as readonly string[] | undefined,
        }
      })
  }, [savedCharacters, dialogueCharacters])

  // Async composite all parts into single images
  const [characterLibrary, setCharacterLibrary] = useState<CharacterLibraryEntry[]>([])

  useEffect(() => {
    let cancelled = false

    async function buildLibrary() {
      const entries: CharacterLibraryEntry[] = []
      for (const e of baseEntries) {
        let imageUrl = e.bodyUrl
        try {
          imageUrl = await compositeCharacterParts(
            e.bodyParts,
            e.partTransforms,
            e.selectedSprites,
            e.eyeVariantsNeutral,
            e.layerOrder,
          )
        } catch {
          // fallback to body only
        }
        if (cancelled) return
        entries.push({
          id: e.id,
          name: e.name,
          thumbnailUrl: e.thumbnailUrl,
          imageUrl,
          svgSource: extractSvgSource(e.bodyUrl),
          savedRigData: savedRigByCharId.get(e.id),
        })
      }
      if (!cancelled) {
        setCharacterLibrary(entries)
      }
    }

    // Provide body-only entries immediately so the editor is usable right away
    setCharacterLibrary(
      baseEntries.map((e) => ({
        id: e.id,
        name: e.name,
        thumbnailUrl: e.thumbnailUrl,
        imageUrl: e.bodyUrl,
        svgSource: extractSvgSource(e.bodyUrl),
        savedRigData: savedRigByCharId.get(e.id),
      })),
    )

    // Then async-composite all parts
    buildLibrary()

    return () => {
      cancelled = true
    }
  }, [baseEntries])

  return (
    <BoneRiggingProvider
      onSave={handleSave}
      initialData={initialData}
      characterLibrary={characterLibrary}
      activeCharacterId={activeSavedCharId}
    >
      <RigAutoSaver onAutoSave={handleAutoSave} />
      {children}
    </BoneRiggingProvider>
  )
}

/**
 * Auto-saves the rig data to useRigStore whenever the rig editor unmounts
 * (i.e. user switches away from the rig-editor tab). This ensures animation
 * data is available in the AnimationsPanel without requiring an explicit save.
 *
 * Uses handleAutoSave (not handleSave) so it only persists rig data without
 * assigning renderMode/rigId to any dialogue character. This prevents clicking
 * a character in the rig editor library from overwriting other characters' bodies.
 */
function RigAutoSaver({ onAutoSave }: { onAutoSave: (data: SerializedRigData) => void }) {
  const engine = useEngineContext()
  const onAutoSaveRef = useRef(onAutoSave)
  onAutoSaveRef.current = onAutoSave

  const getDataRef = useRef(engine.getSerializedData)
  getDataRef.current = engine.getSerializedData

  useEffect(() => {
    const doSave = () => {
      try {
        const data = getDataRef.current()
        if (data) {
          onAutoSaveRef.current(data)
        }
      } catch {
        // Silently ignore -- serialization can fail during transitions
      }
    }

    // Save on page refresh/close — this doesn't trigger the browser's
    // "Changes may not be saved" prompt (that's only from e.preventDefault()).
    // React cleanup isn't guaranteed to run on page refresh, so beforeunload is needed.
    window.addEventListener('beforeunload', doSave)

    // Auto-save every 30 seconds + on unmount (tab switch).
    const interval = setInterval(doSave, 30_000)

    return () => {
      window.removeEventListener('beforeunload', doSave)
      clearInterval(interval)
      doSave()
    }
  }, [])

  return null
}
