import { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useKeyframeStore } from '@/stores/useKeyframeStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import type { CanvasObjectRef } from '@/types/keyframes'

/**
 * Applies interpolated keyframe values to canvas object stores
 * whenever the timeline's currentFrame changes.
 *
 * During record mode: skips the currently selected/being-dragged object
 * to prevent fighting with user interaction.
 * During normal playback: applies to ALL objects (including selected ones).
 */
export function useKeyframePlayback() {
  const prevFrameRef = useRef(-1)

  useEffect(() => {
    // Subscribe to store changes, only act when currentFrame changes
    const unsub = useTimelineStore.subscribe((state) => {
      const currentFrame = state.currentFrame
      if (currentFrame === prevFrameRef.current) return
      prevFrameRef.current = currentFrame

      const kfState = useKeyframeStore.getState()
      const objectRefs = kfState.getAllObjectsWithKeyframes()
      if (objectRefs.length === 0) return

      // Get currently selected objects to avoid overwriting active edits
      // (only skipped during record mode — in playback mode we animate everything)
      const isRecording = kfState.isRecordMode
      const selectedTextId = isRecording ? useTextOverlayStore.getState().selectedId : null
      const selectedMediaId = isRecording ? useMediaStore.getState().selectedCanvasItemId : null
      const selectedAnimId = isRecording ? useAnimationStore.getState().selectedActiveId : null
      const selectedVideoId = isRecording ? useVideoLayerStore.getState().selectedVideoId : null
      const activeDialogueCharId = isRecording ? useMultiCharacterStore.getState().activeCharacterId : null
      const selectedShapeId = isRecording ? useShapeStore.getState().selectedShapeId : null
      const selected3DCharId = isRecording ? use3DCharacterStore.getState().activeCharacterId : null

      // Batch all store writes into a single React reconciliation pass.
      // Without this, each applyValues() triggers a separate re-render cascade.
      ReactDOM.unstable_batchedUpdates(() => {
        for (const ref of objectRefs) {
          // Skip currently selected/interacted objects during record mode only
          if (isRecording && isSelected(ref, selectedTextId, selectedMediaId, selectedAnimId, selectedVideoId, activeDialogueCharId, selectedShapeId, selected3DCharId)) {
            continue
          }

          const values = kfState.getInterpolatedValues(ref, currentFrame)
          if (Object.keys(values).length === 0) continue

          applyValues(ref, values)
        }
      })
    })

    return unsub
  }, [])
}

function isSelected(
  ref: CanvasObjectRef,
  selectedTextId: string | null,
  selectedMediaId: string | null,
  selectedAnimId: string | null,
  selectedVideoId: string | null,
  activeDialogueCharId: string | null,
  selectedShapeId: string | null,
  selected3DCharId: string | null
): boolean {
  switch (ref.objectType) {
    case 'text':
      return ref.objectId === selectedTextId
    case 'media':
      return ref.objectId === selectedMediaId
    case 'lottie':
      return ref.objectId === selectedAnimId
    case 'video':
      return ref.objectId === selectedVideoId
    case 'dialogueCharacter':
      return ref.objectId === activeDialogueCharId
    case 'shape':
      return ref.objectId === selectedShapeId
    case 'character3d':
      return ref.objectId === selected3DCharId
    default:
      return false
  }
}

function applyValues(ref: CanvasObjectRef, values: Record<string, number>) {
  switch (ref.objectType) {
    case 'text': {
      const updates: Record<string, unknown> = {}
      if ('freeX' in values) updates.freeX = values.freeX
      if ('freeY' in values) updates.freeY = values.freeY
      if ('fontSize' in values) updates.fontSize = Math.round(values.fontSize)
      if ('opacity' in values) updates.opacity = values.opacity
      if ('rotation' in values) updates.rotation = values.rotation
      if ('zIndex' in values) updates.zIndex = Math.round(values.zIndex)
      if ('letterSpacing' in values) updates.letterSpacing = values.letterSpacing
      if ('lineHeight' in values) updates.lineHeight = values.lineHeight
      if ('backgroundOpacity' in values) updates.backgroundOpacity = values.backgroundOpacity
      if (('freeX' in values || 'freeY' in values) && !updates.position) {
        updates.position = 'free'
      }
      useTextOverlayStore.getState().updateOverlay(ref.objectId, updates)
      break
    }
    case 'media': {
      const updates: Record<string, unknown> = {}
      if ('position.x' in values || 'position.y' in values) {
        const current = useMediaStore.getState().canvasItems.find((i) => i.id === ref.objectId)
        updates.position = {
          x: values['position.x'] ?? current?.position.x ?? 0,
          y: values['position.y'] ?? current?.position.y ?? 0,
        }
      }
      if ('scale' in values) updates.scale = values.scale
      if ('opacity' in values) updates.opacity = values.opacity
      if ('rotation' in values) updates.rotation = values.rotation
      if ('zIndex' in values) updates.zIndex = Math.round(values.zIndex)
      useMediaStore.getState().updateCanvasItem(ref.objectId, updates)
      break
    }
    case 'lottie': {
      const updates: Record<string, unknown> = {}
      if ('position.x' in values || 'position.y' in values) {
        const current = useAnimationStore.getState().activeAnimations.find((a) => a.id === ref.objectId)
        updates.position = {
          x: values['position.x'] ?? current?.position.x ?? 0,
          y: values['position.y'] ?? current?.position.y ?? 0,
        }
      }
      if ('scale' in values) updates.scale = values.scale
      if ('opacity' in values) updates.opacity = values.opacity
      if ('zIndex' in values) updates.zIndex = Math.round(values.zIndex)
      useAnimationStore.getState().updateActiveAnimation(ref.objectId, updates)
      break
    }
    case 'video': {
      const updates: Record<string, unknown> = {}
      if ('position.x' in values || 'position.y' in values) {
        const current = useVideoLayerStore.getState().videos.find((v) => v.id === ref.objectId)
        updates.position = {
          x: values['position.x'] ?? current?.position.x ?? 0,
          y: values['position.y'] ?? current?.position.y ?? 0,
        }
      }
      if ('scale' in values) updates.scale = values.scale
      if ('opacity' in values) updates.opacity = values.opacity
      if ('rotation' in values) updates.rotation = values.rotation
      if ('zIndex' in values) updates.zIndex = Math.round(values.zIndex)
      useVideoLayerStore.getState().updateVideo(ref.objectId, updates)
      break
    }
    case 'character': {
      const updates: Record<string, unknown> = {}
      if ('x' in values) updates.x = values.x
      if ('y' in values) updates.y = values.y
      if ('rotation' in values) updates.rotation = values.rotation
      if ('scaleX' in values) updates.scaleX = values.scaleX
      if ('scaleY' in values) updates.scaleY = values.scaleY
      useCharacterPartsStore.getState().updateTransform('group', updates)
      break
    }
    case 'dialogueCharacter':
    case 'riggedCharacter': {
      const updates: Record<string, unknown> = {}
      if ('position.x' in values || 'position.y' in values) {
        const chars = useMultiCharacterStore.getState().characters
        const current = chars.find((c) => c.id === ref.objectId)
        updates.position = {
          x: values['position.x'] ?? current?.position.x ?? 0,
          y: values['position.y'] ?? current?.position.y ?? 0,
        }
      }
      if ('scale' in values) updates.scale = values.scale
      if ('rotation' in values) updates.rotation = values.rotation
      if ('zIndex' in values) updates.zIndex = Math.round(values.zIndex)
      useMultiCharacterStore.getState().updateDialogueCharacter(ref.objectId, updates)
      break
    }
    case 'shape': {
      const updates: Record<string, unknown> = {}
      if ('x' in values || 'y' in values) {
        const current = useShapeStore.getState().shapes.find((s) => s.id === ref.objectId)
        updates.position = {
          x: values.x ?? current?.position.x ?? 0,
          y: values.y ?? current?.position.y ?? 0,
        }
      }
      if ('width' in values) updates.width = values.width
      if ('height' in values) updates.height = values.height
      if ('opacity' in values) updates.opacity = values.opacity
      if ('rotation' in values) updates.rotation = values.rotation
      if ('zIndex' in values) updates.zIndex = Math.round(values.zIndex)
      if ('strokeWidth' in values) updates.strokeWidth = values.strokeWidth
      if ('borderRadius' in values) updates.borderRadius = values.borderRadius
      if ('innerRadius' in values) updates.innerRadius = values.innerRadius
      useShapeStore.getState().updateShape(ref.objectId, updates)
      break
    }
    case 'character3d': {
      const updates: Record<string, unknown> = {}
      if ('position.x' in values || 'position.y' in values || 'position.z' in values) {
        const current = use3DCharacterStore.getState().characters.find((c) => c.id === ref.objectId)
        updates.position = {
          x: values['position.x'] ?? current?.position.x ?? 0,
          y: values['position.y'] ?? current?.position.y ?? 0,
          z: values['position.z'] ?? current?.position.z ?? 0,
        }
      }
      if ('rotation.x' in values || 'rotation.y' in values || 'rotation.z' in values) {
        const current = use3DCharacterStore.getState().characters.find((c) => c.id === ref.objectId)
        updates.rotation = {
          x: values['rotation.x'] ?? current?.rotation.x ?? 0,
          y: values['rotation.y'] ?? current?.rotation.y ?? 0,
          z: values['rotation.z'] ?? current?.rotation.z ?? 0,
        }
      }
      if ('scale' in values) updates.scale = values.scale
      if ('animationSpeed' in values) updates.animationSpeed = values.animationSpeed
      use3DCharacterStore.getState().update3DCharacter(ref.objectId, updates)
      break
    }
  }
}
