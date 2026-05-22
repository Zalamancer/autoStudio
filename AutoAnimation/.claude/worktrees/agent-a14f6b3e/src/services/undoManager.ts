/**
 * App-wide undo/redo manager.
 *
 * Captures snapshots of all content stores before mutations and provides
 * undo/redo that restores the full editor state. Used by both Cmd+Z
 * keyboard shortcut and copilot actions.
 *
 * Includes a small Zustand store (`useUndoManagerStore`) so UI components
 * can reactively subscribe to `canUndo` / `canRedo` state.
 */

import { createStore, useStore } from 'zustand'
import { useTextOverlayStore } from '@/stores/useTextOverlayStore'
import { useShapeStore } from '@/stores/useShapeStore'
import { useMediaStore } from '@/stores/useMediaStore'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useAnimationStore } from '@/stores/useAnimationStore'
import { useHTMLTemplateLayerStore } from '@/stores/useHTMLTemplateLayerStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useVideoLayerStore } from '@/stores/useVideoLayerStore'

// ── Reactive state ────────────────────────────────────────────────────

interface UndoManagerState {
  canUndo: boolean
  canRedo: boolean
}

const undoManagerStore = createStore<UndoManagerState>()(() => ({
  canUndo: false,
  canRedo: false,
}))

/** Reactive hook — components subscribe to `canUndo` / `canRedo`. */
export function useUndoManagerStore(): UndoManagerState
export function useUndoManagerStore<T>(selector: (s: UndoManagerState) => T): T
export function useUndoManagerStore<T>(selector?: (s: UndoManagerState) => T) {
  return useStore(undoManagerStore, selector as never)
}

/** Sync the reactive store with the current stack lengths. */
function syncReactiveState() {
  undoManagerStore.setState({
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
  })
}

// ── Snapshot infrastructure ───────────────────────────────────────────

interface Snapshot {
  textOverlays: unknown
  shapes: unknown
  mediaAssets: unknown
  mediaCanvasItems: unknown
  svgComposition: unknown
  activeAnimations: unknown
  templates: unknown
  characters: unknown
  dialogueLines: unknown
  totalFrames: number
  fps: number
  videos: unknown
}

const undoStack: Snapshot[] = []
const redoStack: Snapshot[] = []
const MAX_STACK = 50

function capture(): Snapshot {
  return {
    textOverlays: JSON.parse(JSON.stringify(useTextOverlayStore.getState().overlays)),
    shapes: JSON.parse(JSON.stringify(useShapeStore.getState().shapes)),
    mediaAssets: JSON.parse(JSON.stringify(useMediaStore.getState().assets)),
    mediaCanvasItems: JSON.parse(JSON.stringify(useMediaStore.getState().canvasItems)),
    svgComposition: JSON.parse(JSON.stringify(useSVGObjectStore.getState().composition)),
    activeAnimations: JSON.parse(JSON.stringify(useAnimationStore.getState().activeAnimations)),
    templates: JSON.parse(JSON.stringify(useHTMLTemplateLayerStore.getState().templates)),
    characters: JSON.parse(JSON.stringify(useMultiCharacterStore.getState().characters)),
    dialogueLines: JSON.parse(JSON.stringify(useMultiCharacterStore.getState().dialogueLines)),
    totalFrames: useTimelineStore.getState().totalFrames,
    fps: useTimelineStore.getState().fps,
    videos: JSON.parse(JSON.stringify(useVideoLayerStore.getState().videos)),
  }
}

function restore(snap: Snapshot) {
  useTextOverlayStore.setState({ overlays: snap.textOverlays as never })
  useShapeStore.setState({ shapes: snap.shapes as never })
  useMediaStore.setState({
    assets: snap.mediaAssets as never,
    canvasItems: snap.mediaCanvasItems as never,
  })
  useSVGObjectStore.setState({ composition: snap.svgComposition as never })
  useAnimationStore.setState({ activeAnimations: snap.activeAnimations as never })
  useHTMLTemplateLayerStore.setState({ templates: snap.templates as never })
  useMultiCharacterStore.setState({
    characters: snap.characters as never,
    dialogueLines: snap.dialogueLines as never,
  })
  useTimelineStore.getState().setTotalFrames(snap.totalFrames)
  useTimelineStore.getState().setFps(snap.fps)
  useVideoLayerStore.setState({ videos: snap.videos as never })
}

// ── Public API ────────────────────────────────────────────────────────

/**
 * Push current state onto the undo stack. Call this BEFORE making changes.
 */
export function pushUndo() {
  undoStack.push(capture())
  if (undoStack.length > MAX_STACK) undoStack.shift()
  redoStack.length = 0
  syncReactiveState()
}

/**
 * Undo the last change.
 */
export function undo() {
  if (undoStack.length === 0) return false
  redoStack.push(capture())
  restore(undoStack.pop()!)
  syncReactiveState()
  return true
}

/**
 * Redo the last undone change.
 */
export function redo() {
  if (redoStack.length === 0) return false
  undoStack.push(capture())
  restore(redoStack.pop()!)
  syncReactiveState()
  return true
}

/**
 * Check if undo/redo is available (imperative — for keyboard shortcuts).
 */
export function canUndo() { return undoStack.length > 0 }
export function canRedo() { return redoStack.length > 0 }

/**
 * Clear all undo/redo history (e.g. on project load).
 */
export function clearUndoHistory() {
  undoStack.length = 0
  redoStack.length = 0
  syncReactiveState()
}
