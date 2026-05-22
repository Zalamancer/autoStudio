/**
 * useAudioReactivePreview — Wires the audio reactive engine into the
 * canvas playback loop.
 *
 * When the audio reactive store's `previewMode` is enabled AND the
 * timeline is playing, this hook:
 *  1. Connects useAudioReactivePlayback to the first available audio
 *     source (dialogue voice or single-voice audio URL).
 *  2. Runs a requestAnimationFrame loop that reads the engine's
 *     latest real-time values and applies them as additive property
 *     overrides on canvas objects (text, shapes, media, etc.).
 *  3. Disconnects and restores base values when playback stops or
 *     preview mode is disabled.
 *
 * Called once in VideoCanvas.tsx alongside useKeyframePlayback.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useAudioReactivePlayback } from './useAudioReactivePlayback'
import { useAudioReactiveStore } from '@/stores/useAudioReactiveStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { getAudioReactiveEngine } from '@/services/audioReactiveEngine'

// ── Helpers ────────────────────────────────────────────────────────

/**
 * Resolve the first available audio URL from project sources.
 * Priority: dialogue lines with generated voices > single active voice.
 */
function resolveAudioUrl(): string | null {
  // 1. Dialogue mode — pick the first dialogue line that has a generated voice
  const { dialogueLines } = useMultiCharacterStore.getState()
  const { generatedVoices, activeVoiceId } = useVoiceStore.getState()

  for (const line of dialogueLines) {
    if (!line.generatedVoiceId) continue
    const voice = generatedVoices.find((v) => v.id === line.generatedVoiceId)
    if (voice?.audioUrl) return voice.audioUrl
  }

  // 2. Single-voice mode
  if (activeVoiceId) {
    const voice = generatedVoices.find((v) => v.id === activeVoiceId)
    if (voice?.audioUrl) return voice.audioUrl
  }

  // 3. First audio media item on the canvas
  const { canvasItems, assets } = useMediaStore.getState()
  for (const item of canvasItems) {
    const asset = assets.find((a) => a.id === item.assetId)
    if (asset && asset.category === 'audio' && asset.url) {
      return asset.url
    }
  }

  return null
}

/**
 * Apply additive audio-reactive values to canvas object stores.
 * The engine returns a nested map: "objectType:objectId" -> property -> value.
 * Values are additive offsets (e.g. +0.15 to scale).
 */
function applyReactiveValues(values: Map<string, Map<string, number>>): void {
  for (const [objKey, propMap] of values) {
    const colonIdx = objKey.indexOf(':')
    if (colonIdx < 0) continue
    const objectType = objKey.slice(0, colonIdx)
    const objectId = objKey.slice(colonIdx + 1)

    // Convert the Map to a plain object for easier consumption
    const props: Record<string, number> = {}
    for (const [prop, val] of propMap) {
      props[prop] = val
    }

    applyToStore(objectType, objectId, props)
  }
}

/**
 * Write additive audio-reactive property values into the appropriate store.
 * This mirrors useKeyframePlayback's applyValues but treats values as additive
 * offsets on top of the current base value.
 */
function applyToStore(objectType: string, objectId: string, props: Record<string, number>): void {
  switch (objectType) {
    case 'text': {
      const store = useTextOverlayStore.getState()
      const overlay = store.overlays.find((o) => o.id === objectId)
      if (!overlay) return
      const updates: Record<string, unknown> = {}
      if ('scale' in props) {
        // Text doesn't have a direct 'scale' — map to fontSize additive
        updates.fontSize = Math.round(overlay.fontSize + overlay.fontSize * props.scale)
      }
      if ('opacity' in props) {
        updates.opacity = Math.max(0, Math.min(1, overlay.opacity + props.opacity))
      }
      if ('position.y' in props) {
        updates.freeY = (overlay.freeY ?? overlay.fontSize) + props['position.y']
        updates.position = 'free'
      }
      if ('position.x' in props) {
        updates.freeX = (overlay.freeX ?? 0) + props['position.x']
        updates.position = 'free'
      }
      if (Object.keys(updates).length > 0) {
        store.updateOverlay(objectId, updates)
      }
      break
    }
    case 'shape': {
      const store = useShapeStore.getState()
      const shape = store.shapes.find((s) => s.id === objectId)
      if (!shape) return
      const updates: Record<string, unknown> = {}
      if ('scale' in props) {
        updates.width = shape.width + shape.width * props.scale
        updates.height = shape.height + shape.height * props.scale
      }
      if ('opacity' in props) {
        updates.opacity = Math.max(0, Math.min(1, (shape.opacity ?? 1) + props.opacity))
      }
      if ('position.y' in props) {
        updates.position = {
          x: shape.position.x,
          y: shape.position.y + props['position.y'],
        }
      }
      if ('position.x' in props) {
        updates.position = {
          x: shape.position.x + props['position.x'],
          y: (updates.position as any)?.y ?? shape.position.y,
        }
      }
      if (Object.keys(updates).length > 0) {
        store.updateShape(objectId, updates)
      }
      break
    }
    case 'media': {
      const store = useMediaStore.getState()
      const item = store.canvasItems.find((i) => i.id === objectId)
      if (!item) return
      const updates: Record<string, unknown> = {}
      if ('scale' in props) {
        updates.scale = (item.scale ?? 1) + props.scale
      }
      if ('opacity' in props) {
        updates.opacity = Math.max(0, Math.min(1, (item.opacity ?? 1) + props.opacity))
      }
      if ('position.y' in props) {
        updates.position = {
          x: item.position.x,
          y: item.position.y + props['position.y'],
        }
      }
      if ('position.x' in props) {
        updates.position = {
          x: item.position.x + props['position.x'],
          y: (updates.position as any)?.y ?? item.position.y,
        }
      }
      if (Object.keys(updates).length > 0) {
        store.updateCanvasItem(objectId, updates)
      }
      break
    }
    case 'lottie': {
      const store = useAnimationStore.getState()
      const anim = store.activeAnimations.find((a) => a.id === objectId)
      if (!anim) return
      const updates: Record<string, unknown> = {}
      if ('scale' in props) {
        updates.scale = (anim.scale ?? 1) + props.scale
      }
      if ('opacity' in props) {
        updates.opacity = Math.max(0, Math.min(1, (anim.opacity ?? 1) + props.opacity))
      }
      if (Object.keys(updates).length > 0) {
        store.updateActiveAnimation(objectId, updates)
      }
      break
    }
    case 'video': {
      const store = useVideoLayerStore.getState()
      const video = store.videos.find((v) => v.id === objectId)
      if (!video) return
      const updates: Record<string, unknown> = {}
      if ('scale' in props) {
        updates.scale = (video.scale ?? 1) + props.scale
      }
      if ('opacity' in props) {
        updates.opacity = Math.max(0, Math.min(1, (video.opacity ?? 1) + props.opacity))
      }
      if (Object.keys(updates).length > 0) {
        store.updateVideo(objectId, updates)
      }
      break
    }
    case 'character': {
      const store = useCharacterPartsStore.getState()
      const updates: Record<string, unknown> = {}
      if ('scale' in props) {
        updates.scaleX = store.transforms.group.scaleX + props.scale
        updates.scaleY = store.transforms.group.scaleY + props.scale
      }
      if (Object.keys(updates).length > 0) {
        store.updateTransform('group', updates)
      }
      break
    }
    case 'dialogueCharacter':
    case 'riggedCharacter': {
      const store = useMultiCharacterStore.getState()
      const char = store.characters.find((c) => c.id === objectId)
      if (!char) return
      const updates: Record<string, unknown> = {}
      if ('scale' in props) {
        updates.scale = char.scale + props.scale
      }
      if ('position.y' in props) {
        updates.position = {
          x: char.position.x,
          y: char.position.y + props['position.y'],
        }
      }
      if ('position.x' in props) {
        updates.position = {
          x: char.position.x + props['position.x'],
          y: (updates.position as any)?.y ?? char.position.y,
        }
      }
      if (Object.keys(updates).length > 0) {
        store.updateDialogueCharacter(objectId, updates)
      }
      break
    }
    case 'character3d': {
      const store = use3DCharacterStore.getState()
      const char = store.characters.find((c) => c.id === objectId)
      if (!char) return
      const updates: Record<string, unknown> = {}
      if ('scale' in props) {
        updates.scale = char.scale + props.scale
      }
      if (Object.keys(updates).length > 0) {
        store.update3DCharacter(objectId, updates)
      }
      break
    }
  }
}

// ── Snapshot/Restore for base values ──────────────────────────────

type BaseSnapshot = Map<string, Record<string, unknown>>

/**
 * Snapshot the base values of all objects that have audio-reactive mappings
 * so they can be restored when preview mode is disabled.
 */
function snapshotBaseValues(mappings: { targetObjectRef: { objectType: string; objectId: string }; targetProperty: string }[]): BaseSnapshot {
  const snapshot: BaseSnapshot = new Map()

  for (const mapping of mappings) {
    const { objectType, objectId } = mapping.targetObjectRef
    const key = `${objectType}:${objectId}`
    if (snapshot.has(key)) continue // already captured

    const base = captureObjectBase(objectType, objectId)
    if (base) snapshot.set(key, base)
  }

  return snapshot
}

function captureObjectBase(objectType: string, objectId: string): Record<string, unknown> | null {
  switch (objectType) {
    case 'text': {
      const o = useTextOverlayStore.getState().overlays.find((o) => o.id === objectId)
      if (!o) return null
      return { fontSize: o.fontSize, opacity: o.opacity, freeX: o.freeX, freeY: o.freeY, position: o.position }
    }
    case 'shape': {
      const s = useShapeStore.getState().shapes.find((s) => s.id === objectId)
      if (!s) return null
      return { width: s.width, height: s.height, opacity: s.opacity, position: { ...s.position } }
    }
    case 'media': {
      const i = useMediaStore.getState().canvasItems.find((i) => i.id === objectId)
      if (!i) return null
      return { scale: i.scale, opacity: i.opacity, position: { ...i.position } }
    }
    case 'lottie': {
      const a = useAnimationStore.getState().activeAnimations.find((a) => a.id === objectId)
      if (!a) return null
      return { scale: a.scale, opacity: a.opacity }
    }
    case 'video': {
      const v = useVideoLayerStore.getState().videos.find((v) => v.id === objectId)
      if (!v) return null
      return { scale: v.scale, opacity: v.opacity }
    }
    case 'character': {
      const g = useCharacterPartsStore.getState().transforms.group
      return { scaleX: g.scaleX, scaleY: g.scaleY }
    }
    case 'dialogueCharacter':
    case 'riggedCharacter': {
      const c = useMultiCharacterStore.getState().characters.find((c) => c.id === objectId)
      if (!c) return null
      return { scale: c.scale, position: { ...c.position } }
    }
    case 'character3d': {
      const c = use3DCharacterStore.getState().characters.find((c) => c.id === objectId)
      if (!c) return null
      return { scale: c.scale }
    }
    default:
      return null
  }
}

/**
 * Restore objects to their base values from a snapshot.
 */
function restoreBaseValues(snapshot: BaseSnapshot): void {
  for (const [key, base] of snapshot) {
    const colonIdx = key.indexOf(':')
    if (colonIdx < 0) continue
    const objectType = key.slice(0, colonIdx)
    const objectId = key.slice(colonIdx + 1)

    switch (objectType) {
      case 'text':
        useTextOverlayStore.getState().updateOverlay(objectId, base)
        break
      case 'shape':
        useShapeStore.getState().updateShape(objectId, base)
        break
      case 'media':
        useMediaStore.getState().updateCanvasItem(objectId, base)
        break
      case 'lottie':
        useAnimationStore.getState().updateActiveAnimation(objectId, base)
        break
      case 'video':
        useVideoLayerStore.getState().updateVideo(objectId, base)
        break
      case 'character':
        useCharacterPartsStore.getState().updateTransform('group', base)
        break
      case 'dialogueCharacter':
      case 'riggedCharacter':
        useMultiCharacterStore.getState().updateDialogueCharacter(objectId, base)
        break
      case 'character3d':
        use3DCharacterStore.getState().update3DCharacter(objectId, base)
        break
    }
  }
}

// ── Main Hook ─────────────────────────────────────────────────────

export function useAudioReactivePreview(): void {
  const { connect, disconnect } = useAudioReactivePlayback()

  const rafRef = useRef<number>(0)
  const snapshotRef = useRef<BaseSnapshot | null>(null)
  const connectedRef = useRef(false)

  // Subscribe to reactive store & timeline store to drive connect/disconnect
  const previewMode = useAudioReactiveStore((s) => s.previewMode)
  const mappings = useAudioReactiveStore((s) => s.mappings)
  const isPlaying = useTimelineStore((s) => s.isPlaying)

  const shouldRun = previewMode && isPlaying && mappings.length > 0

  // Apply loop — reads engine values and pushes to stores
  const applyLoop = useCallback(() => {
    const engine = getAudioReactiveEngine()
    const values = engine.getLastRealtimeValues()

    if (values.size > 0) {
      // First restore base values, then apply additive offsets
      // This ensures we always apply offsets relative to the base,
      // not compounding on top of previously modified values.
      if (snapshotRef.current) {
        restoreBaseValues(snapshotRef.current)
      }
      applyReactiveValues(values)
    }

    rafRef.current = requestAnimationFrame(applyLoop)
  }, [])

  // Connect/disconnect based on shouldRun
  useEffect(() => {
    if (shouldRun) {
      const audioUrl = resolveAudioUrl()
      if (!audioUrl) {
        console.warn('[AudioReactivePreview] No audio source available for preview')
        return
      }

      // Snapshot base values before we start modifying them
      const currentMappings = useAudioReactiveStore.getState().mappings
      snapshotRef.current = snapshotBaseValues(currentMappings)

      // Activate the engine
      useAudioReactiveStore.getState().setActive(true)

      // Connect audio analyser
      connect(audioUrl)
      connectedRef.current = true

      // Start the apply loop
      rafRef.current = requestAnimationFrame(applyLoop)

      console.log('[AudioReactivePreview] Connected — preview active')
    } else {
      // Stop the apply loop
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }

      // Disconnect audio analyser
      if (connectedRef.current) {
        disconnect()
        connectedRef.current = false

        // Restore base values
        if (snapshotRef.current) {
          restoreBaseValues(snapshotRef.current)
          snapshotRef.current = null
        }

        // Reset engine smoothing so next activation starts fresh
        getAudioReactiveEngine().resetSmoothing()

        console.log('[AudioReactivePreview] Disconnected — preview inactive')
      }

      // Deactivate
      useAudioReactiveStore.getState().setActive(false)
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = 0
      }
      if (connectedRef.current) {
        disconnect()
        connectedRef.current = false

        if (snapshotRef.current) {
          restoreBaseValues(snapshotRef.current)
          snapshotRef.current = null
        }

        getAudioReactiveEngine().resetSmoothing()
        useAudioReactiveStore.getState().setActive(false)
      }
    }
  }, [shouldRun, connect, disconnect, applyLoop])
}
