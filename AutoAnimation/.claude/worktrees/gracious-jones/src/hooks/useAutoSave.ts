import { useEffect, useRef, useCallback, useState } from 'react'
import { projectService } from '@/services/projectService'
import { useProjectStore } from '@/stores/useProjectStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useCharacterConfigStore } from '@/stores/useCharacterConfigStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useAvatarCharacterStore } from '@/stores/useAvatarCharacterStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { useLayerTreeStore } from '@/stores/useLayerTreeStore'

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'dirty' | 'error'

/**
 * Creates a lightweight fingerprint of the current application state.
 * Used to detect whether the state has actually changed since the last save.
 * This avoids expensive deep comparisons by building a quick string signature
 * from key scalar values, array lengths, and serialized mappings.
 *
 * Intentionally excludes transient/playback state (currentFrame, isPlaying,
 * selectedClipIds, etc.) since those should not trigger auto-save.
 */
function createStateFingerprint(): string {
  try {
    const timeline = useTimelineStore.getState()
    const characterConfig = useCharacterConfigStore.getState()
    const characterParts = useCharacterPartsStore.getState()
    const voice = useVoiceStore.getState()
    const animation = useAnimationStore.getState()
    const textOverlay = useTextOverlayStore.getState()
    const shapes = useShapeStore.getState()
    const media = useMediaStore.getState()
    const multiChar = useMultiCharacterStore.getState()
    const avatar = useAvatarCharacterStore.getState()
    const svg = useSVGObjectStore.getState()
    const htmlTemplate = useHTMLTemplateLayerStore.getState()
    const keyframe = useKeyframeStore.getState()
    const layerTree = useLayerTreeStore.getState()

    const tracks = timeline.tracks ?? []
    const activeAnims = animation.activeAnimations ?? []
    const overlays = textOverlay.overlays ?? []
    const shapeList = shapes.shapes ?? []
    const canvasItems = media.canvasItems ?? []
    const chars = multiChar.characters ?? []
    const dLines = multiChar.dialogueLines ?? []
    const avatarChars = avatar.characters ?? []
    const templates = htmlTemplate.templates ?? []
    const kfTracks = keyframe.tracks ?? []
    const groups = layerTree.groups ?? []

    const parts = [
      // Timeline - structural data only (not playback position)
      timeline.fps,
      timeline.totalFrames,
      tracks.length,
      tracks.map(t =>
        `${t.id}:${(t.clips ?? []).length}:${t.locked}:${t.muted}:${t.visible}:${(t.clips ?? []).map(c => `${c.id}:${c.startFrame}:${c.endFrame}`).join(';')}`
      ).join(','),

      // Character config - sprites and mappings
      Object.values(characterConfig.savedImages ?? {}).map(arr => (arr ?? []).length).join(','),
      Object.values(characterConfig.uploadedImages ?? {}).map(v => v ? '1' : '0').join(','),
      JSON.stringify(characterConfig.visemeMapping ?? {}),
      JSON.stringify(characterConfig.spriteLabels ?? {}),

      // Character parts transforms
      Object.entries(characterParts.transforms ?? {}).map(([k, t]) =>
        `${k}:${t.x}:${t.y}:${t.rotation}:${t.scaleX}:${t.scaleY}:${t.visible}`
      ).join(','),
      Object.entries(characterParts.selectedSprites ?? {}).map(([k, v]) => `${k}:${v}`).join(','),

      // Voice - generated voices list
      (voice.generatedVoices ?? []).length,
      (voice.generatedVoices ?? []).map(v => v.id).join(','),
      voice.activeVoiceId,

      // Animations on canvas
      activeAnims.length,
      activeAnims.map(a =>
        `${a.id}:${a.animationId}:${a.position.x}:${a.position.y}:${a.scale}:${a.opacity}:${a.zIndex}:${a.loop}:${a.speed}`
      ).join(','),

      // Text overlays
      overlays.length,
      overlays.map(o => `${o.id}:${o.content}:${o.freeX}:${o.freeY}`).join(','),

      // Shapes
      shapeList.length,
      shapeList.map(s => `${s.id}:${s.type}:${s.position.x}:${s.position.y}`).join(','),

      // Media items
      canvasItems.length,
      canvasItems.map(m => `${m.id}:${m.assetId}`).join(','),

      // Multi-character dialogue
      chars.length,
      dLines.length,

      // Avatar characters
      avatarChars.length,
      avatarChars.map(c => c.id).join(','),

      // SVG objects
      svg.composition ? 1 : 0,

      // HTML template layers
      templates.length,

      // Keyframes
      kfTracks.length,

      // Layer tree
      groups.length,
    ]

    return parts.join('|')
  } catch {
    return ''
  }
}

interface UseAutoSaveReturn {
  status: AutoSaveStatus
  lastSaved: Date | null
  isDirty: boolean
  isSaving: boolean
  saveNow: () => Promise<void>
  error: string | null
}

/**
 * Custom hook that watches for changes in key stores and auto-saves
 * after a period of inactivity (debounced).
 *
 * How it works:
 * 1. Subscribes to all relevant Zustand stores for any state changes.
 * 2. On each change, computes a lightweight state fingerprint.
 * 3. If the fingerprint differs from the last saved fingerprint, marks state as "dirty".
 * 4. After `debounceMs` milliseconds of no further changes, triggers a save via projectService.
 * 5. On successful save, updates the fingerprint and marks state as "saved".
 *
 * @param debounceMs - Milliseconds of inactivity before auto-saving (default: 30000 = 30s)
 */
export function useAutoSave(debounceMs = 5000): UseAutoSaveReturn {
  const [status, setStatus] = useState<AutoSaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedFingerprintRef = useRef<string>('')
  const isMountedRef = useRef(true)
  const isSavingRef = useRef(false)
  const isDirtyRef = useRef(false)

  // Keep isDirtyRef in sync with status for the beforeunload handler
  useEffect(() => {
    isDirtyRef.current = status === 'dirty' || status === 'saving'
  }, [status])

  // Warn user before closing/navigating away with unsaved changes
  // and attempt to trigger a last-chance save
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        // Trigger save attempt (async, may not complete before unload)
        const projectState = useProjectStore.getState()
        if (!isSavingRef.current) {
          projectState.saveProject().catch(() => {})
        }
        e.preventDefault()
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Initialize fingerprint and lastSaved from project store on mount
  useEffect(() => {
    const projectState = useProjectStore.getState()
    if (projectState.lastSaved) {
      setLastSaved(projectState.lastSaved)
      setStatus('saved')
    }
    // Capture the initial fingerprint so we don't immediately mark as dirty
    savedFingerprintRef.current = createStateFingerprint()
  }, [])

  // The actual save function
  const performSave = useCallback(async () => {
    const projectState = useProjectStore.getState()

    // Only save if a project is loaded (or allow localStorage fallback for local dev)
    if (!projectState.currentProjectId && projectService.isAvailable()) return
    // Don't double-save
    if (isSavingRef.current) return

    const currentFingerprint = createStateFingerprint()
    // Don't save if nothing actually changed
    if (currentFingerprint === savedFingerprintRef.current) {
      if (isMountedRef.current) {
        setStatus('saved')
      }
      return
    }

    isSavingRef.current = true
    if (isMountedRef.current) {
      setStatus('saving')
      setError(null)
    }

    try {
      await projectState.saveProject()

      // Update fingerprint after successful save
      savedFingerprintRef.current = createStateFingerprint()

      if (isMountedRef.current) {
        const now = new Date()
        setLastSaved(now)
        setStatus('saved')
        setError(null)
      }
    } catch (err) {
      console.error('Auto-save failed:', err)
      if (isMountedRef.current) {
        const message = err instanceof Error ? err.message : 'Auto-save failed'
        setError(message)
        setStatus('error')
      }
    } finally {
      isSavingRef.current = false
    }
  }, [])

  // Manual save - clears any pending debounce and saves immediately
  const saveNow = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    await performSave()
  }, [performSave])

  // Debounced change handler - called on every store change
  const handleChange = useCallback(() => {
    const projectState = useProjectStore.getState()
    // Only track changes if a project is loaded (or allow localStorage fallback)
    if (!projectState.currentProjectId && projectService.isAvailable()) return

    const currentFingerprint = createStateFingerprint()
    if (currentFingerprint === savedFingerprintRef.current) {
      return // No meaningful change (e.g., just playback position changed)
    }

    if (isMountedRef.current && !isSavingRef.current) {
      setStatus('dirty')
    }

    // Reset debounce timer - save after `debounceMs` of inactivity
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      performSave()
    }, debounceMs)
  }, [debounceMs, performSave])

  // Subscribe to all relevant stores using Zustand v5 vanilla subscribe
  useEffect(() => {
    isMountedRef.current = true

    const unsubscribers = [
      // Timeline store changes (includes playback state, but fingerprint filters it out)
      useTimelineStore.subscribe(() => handleChange()),

      // Character config changes (sprites, viseme mappings, labels, etc.)
      useCharacterConfigStore.subscribe(() => handleChange()),

      // Character parts changes (transforms, sprite selections)
      useCharacterPartsStore.subscribe(() => handleChange()),

      // Voice store changes (generated voices)
      useVoiceStore.subscribe(() => handleChange()),

      // Animation store changes (active animations on canvas)
      useAnimationStore.subscribe(() => handleChange()),

      // Text overlay changes
      useTextOverlayStore.subscribe(() => handleChange()),

      // Shape changes
      useShapeStore.subscribe(() => handleChange()),

      // Media changes
      useMediaStore.subscribe(() => handleChange()),

      // Multi-character dialogue changes
      useMultiCharacterStore.subscribe(() => handleChange()),

      // Avatar character changes
      useAvatarCharacterStore.subscribe(() => handleChange()),

      // SVG object changes
      useSVGObjectStore.subscribe(() => handleChange()),

      // HTML template layer changes
      useHTMLTemplateLayerStore.subscribe(() => handleChange()),

      // Keyframe changes
      useKeyframeStore.subscribe(() => handleChange()),

      // Layer tree changes
      useLayerTreeStore.subscribe(() => handleChange()),

      // Project store - watch for project loading/switching
      useProjectStore.subscribe((state, prevState) => {
        // When project ID changes (loaded a different project or created new)
        if (state.currentProjectId !== prevState.currentProjectId) {
          if (state.currentProjectId) {
            // Re-capture fingerprint for the newly loaded project
            savedFingerprintRef.current = createStateFingerprint()
            if (state.lastSaved) {
              setLastSaved(state.lastSaved)
              setStatus('saved')
            } else {
              setStatus('idle')
            }
          } else {
            setStatus('idle')
            savedFingerprintRef.current = ''
          }
        }

        // When a manual save completes via Ctrl+S (not through our auto-save)
        if (
          state.lastSaved !== prevState.lastSaved &&
          state.currentProjectId === prevState.currentProjectId &&
          !isSavingRef.current
        ) {
          savedFingerprintRef.current = createStateFingerprint()
          if (state.lastSaved) {
            setLastSaved(state.lastSaved)
            setStatus('saved')
          }
          // Clear any pending auto-save since save just happened
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current)
            debounceTimerRef.current = null
          }
        }
      }),
    ]

    return () => {
      isMountedRef.current = false
      unsubscribers.forEach(unsub => unsub())
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [handleChange])

  return {
    status,
    lastSaved,
    isDirty: status === 'dirty',
    isSaving: status === 'saving',
    saveNow,
    error,
  }
}
