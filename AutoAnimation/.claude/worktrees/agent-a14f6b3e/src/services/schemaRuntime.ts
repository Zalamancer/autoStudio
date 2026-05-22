import type { SchemaBinding } from '@/types/projectSchema'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { usePlaybackStore } from '@/stores/usePlaybackStore'
import ReactDOM from 'react-dom'

/**
 * Dispatch a single binding — sets the value on the appropriate store.
 * Pattern from useKeyframePlayback.ts:applyValues()
 */
function applyStoreActionBinding(binding: SchemaBinding, value: unknown): void {
  switch (binding.targetStore) {
    case 'text-overlay': {
      if (binding.entityId && binding.property) {
        useTextOverlayStore.getState().updateOverlay(binding.entityId, { [binding.property]: value })
      }
      break
    }
    case 'shape': {
      if (binding.entityId && binding.property) {
        useShapeStore.getState().updateShape(binding.entityId, { [binding.property]: value })
      }
      break
    }
    case 'html-template': {
      if (binding.entityId && binding.property) {
        useHTMLTemplateLayerStore.getState().updateTemplateConfig(binding.entityId, binding.property, value)
      }
      break
    }
    case 'multi-character': {
      if (binding.entityId && binding.property) {
        if (binding.action === 'updateDialogueLine') {
          useMultiCharacterStore.getState().updateDialogueLine(binding.entityId, { [binding.property]: value })
        } else {
          useMultiCharacterStore.getState().updateDialogueCharacter(binding.entityId, { [binding.property]: value })
        }
      }
      break
    }
    case 'canvas': {
      if (binding.property === 'canvasWidth' || binding.property === 'canvasHeight') {
        const store = useCanvasStore.getState()
        const w = binding.property === 'canvasWidth' ? (value as number) : store.canvasWidth
        const h = binding.property === 'canvasHeight' ? (value as number) : store.canvasHeight
        store.setCanvasDimensions(w, h)
      } else if (binding.property === 'canvasZoom') {
        useCanvasStore.getState().setCanvasZoom(value as number)
      }
      break
    }
    case 'editor': {
      if (binding.property === 'aspectRatio') {
        useEditorStore.getState().setAspectRatio(value as '16:9' | '9:16' | '1:1' | '4:3' | '21:9')
      }
      break
    }
    case 'voice': {
      if (binding.property === 'selectedVoiceId') {
        useVoiceStore.getState().setSelectedVoice(value as string)
      } else if (binding.property === 'captionStyle') {
        useVoiceStore.getState().setCaptionStyle(value as 'word-by-word' | 'sentence' | 'karaoke')
      } else if (binding.property === 'captionColor') {
        useVoiceStore.getState().setCaptionColor(value as string)
      } else if (binding.property === 'captionFontSize') {
        useVoiceStore.getState().setCaptionFontSize(value as number)
      } else if (binding.property === 'captionPosition') {
        useVoiceStore.getState().setCaptionPosition(value as 'top' | 'center' | 'bottom')
      }
      break
    }
    case 'animation': {
      if (binding.entityId) {
        useAnimationStore.getState().updateActiveAnimation(binding.entityId, { [binding.property!]: value })
      }
      break
    }
    case 'media': {
      if (binding.entityId && binding.property) {
        useMediaStore.getState().updateCanvasItem(binding.entityId, { [binding.property]: value })
      }
      break
    }
    case 'video-layer': {
      if (binding.entityId && binding.property) {
        useVideoLayerStore.getState().updateVideo(binding.entityId, { [binding.property]: value })
      }
      break
    }
    case 'svg-object': {
      if (binding.entityId && binding.property) {
        useSVGObjectStore.getState().updateObject(binding.entityId, { [binding.property]: value })
      }
      break
    }
    case 'timeline': {
      if (binding.property === 'fps') {
        useTimelineStore.getState().setFps(value as number)
      } else if (binding.property === 'totalFrames') {
        useTimelineStore.getState().setTotalFrames(value as number)
      }
      break
    }
    case 'playback': {
      if (binding.property === 'volume') {
        usePlaybackStore.getState().setVolume(value as number)
      } else if (binding.property === 'duration') {
        usePlaybackStore.getState().setDuration(value as number)
      }
      break
    }
  }
}

/**
 * Dispatch all bindings for a set of changed variable keys.
 * Batches updates into a single React render pass.
 */
export function dispatchSchemaBindings(
  changedKeys: string[],
  variables: Map<string, unknown>,
  bindings: SchemaBinding[]
): void {
  const affectedBindings = bindings.filter((b) => changedKeys.includes(b.variableKey))
  if (affectedBindings.length === 0) return

  ReactDOM.unstable_batchedUpdates(() => {
    for (const binding of affectedBindings) {
      const value = variables.get(binding.variableKey)
      if (value === undefined) continue

      if (binding.mode === 'store-action') {
        applyStoreActionBinding(binding, value)
      }
      // snapshot-path mode could be added later for dot-notation path setting
    }
  })
}
