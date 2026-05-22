import { useEffect } from 'react'
import { useTimelineStore } from '@/stores'
import { useProjectStore } from '@/stores'
import { useKeyframeStore } from '@/stores'
import { useCanvasStore } from '@/stores'
import { useEditorStore } from '@/stores'
import { useTextOverlayStore } from '@/stores'
import { useShapeStore } from '@/stores'
import { useMediaStore } from '@/stores'
import { useHTMLTemplateLayerStore } from '@/stores'
import { useAnimationStore } from '@/stores'
import { useSVGObjectStore } from '@/stores/useSVGObjectStore'
import { useVideoLayerStore } from '@/stores'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useMotionTrackingStore } from '@/stores/useMotionTrackingStore'
import { saveThroughMutex, isSaveMutexLocked } from '@/hooks/useAutoSave'
import { useCopilotStore } from '@/stores/useCopilotStore'
import { undo as globalUndo, redo as globalRedo } from '@/services/undoManager'

/**
 * Global keyboard shortcuts for the video editor.
 *
 * Playback:
 * - Space: Toggle play/pause
 * - Left Arrow: Step backward one frame
 * - Right Arrow: Step forward one frame
 * - Shift+Left: Step backward 10 frames
 * - Shift+Right: Step forward 10 frames
 * - Home: Go to first frame (frame 0)
 * - End: Go to last frame
 *
 * Editing:
 * - Ctrl/Cmd+Z: Undo (timeline undo via Zundo)
 * - Ctrl/Cmd+Shift+Z: Redo
 * - Delete/Backspace: Delete selected clips
 * - Ctrl/Cmd+S: Save project
 * - Escape: Clear selection
 *
 * UI / Timeline Zoom:
 * - Ctrl/Cmd+Plus (=): Zoom in timeline
 * - Ctrl/Cmd+Minus: Zoom out timeline
 *
 * Canvas:
 * - 3: Toggle 3D layer view
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs, textareas, or contenteditable
      const target = e.target as HTMLElement
      const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if (isInputFocused) {
        // Still allow Escape, Ctrl/Cmd+S, and Ctrl/Cmd+K in inputs
        if (
          e.key !== 'Escape' &&
          !(e.key === 's' && (e.metaKey || e.ctrlKey)) &&
          !((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey))
        ) {
          return
        }
      }

      const isMod = e.metaKey || e.ctrlKey

      switch (e.key) {
        // ========================
        // Playback
        // ========================

        case ' ':
          e.preventDefault()
          useTimelineStore.getState().togglePlayback()
          break

        case 'ArrowLeft':
          e.preventDefault()
          if (e.shiftKey) {
            // Shift+Left: Step back 10 frames
            const { currentFrame, seekToFrame } = useTimelineStore.getState()
            seekToFrame(currentFrame - 10)
          } else {
            useTimelineStore.getState().stepBackward()
          }
          break

        case 'ArrowRight':
          e.preventDefault()
          if (e.shiftKey) {
            // Shift+Right: Step forward 10 frames
            const { currentFrame, seekToFrame } = useTimelineStore.getState()
            seekToFrame(currentFrame + 10)
          } else {
            useTimelineStore.getState().stepForward()
          }
          break

        case 'Home':
          e.preventDefault()
          useTimelineStore.getState().seekToFrame(0)
          break

        case 'End': {
          e.preventDefault()
          const { totalFrames } = useTimelineStore.getState()
          useTimelineStore.getState().seekToFrame(totalFrames - 1)
          break
        }

        // ========================
        // Editing
        // ========================

        // Undo/Redo
        case 'z':
        case 'Z':
          if (isMod) {
            e.preventDefault()
            if (e.shiftKey) {
              // Try global undo manager first, fall back to timeline temporal
              if (!globalRedo()) {
                const { redo, futureStates } = useTimelineStore.temporal.getState()
                if (futureStates.length > 0) redo()
              }
            } else {
              if (!globalUndo()) {
                const { undo, pastStates } = useTimelineStore.temporal.getState()
                if (pastStates.length > 0) undo()
              }
            }
          }
          break

        // Save — goes through the shared save mutex so it can't overlap
        // with an in-progress autosave (or vice-versa)
        case 's':
        case 'S':
          if (isMod) {
            e.preventDefault()
            const projectStore = useProjectStore.getState()
            if (projectStore.currentProjectId && !isSaveMutexLocked()) {
              saveThroughMutex(() => projectStore.saveProject()).catch(console.error)
            }
          }
          break

        // Toggle keyframe record mode
        case 'k':
        case 'K':
          if (isMod) {
            // Cmd+K: Toggle AI Copilot
            e.preventDefault()
            useCopilotStore.getState().toggle()
          } else {
            // K: Toggle keyframe record mode
            e.preventDefault()
            useKeyframeStore.getState().toggleRecordMode()
          }
          break

        // Delete selected items (keyframes > clips > canvas objects)
        case 'Delete':
        case 'Backspace': {
          if (isInputFocused) break

          // 1. Delete selected keyframes first
          const kfStore = useKeyframeStore.getState()
          if (kfStore.selectedKeyframeIds.length > 0) {
            e.preventDefault()
            kfStore.deleteSelectedKeyframes()
            break
          }

          // 2. Delete selected timeline clips
          const { selectedClipIds, tracks, removeClip, clearSelection } = useTimelineStore.getState()
          if (selectedClipIds.length > 0) {
            e.preventDefault()
            for (const clipId of selectedClipIds) {
              for (const track of tracks) {
                if (track.clips.some((c) => c.id === clipId)) {
                  removeClip(track.id, clipId)
                  break
                }
              }
            }
            clearSelection()
            break
          }

          // 3. Delete selected canvas objects
          {
            const textStore = useTextOverlayStore.getState()
            if (textStore.selectedId) {
              e.preventDefault()
              const id = textStore.selectedId
              textStore.setSelectedId(null)
              textStore.removeOverlay(id)
              break
            }

            const shapeStore = useShapeStore.getState()
            if (shapeStore.selectedShapeId) {
              e.preventDefault()
              const id = shapeStore.selectedShapeId
              shapeStore.setSelectedShapeId(null)
              shapeStore.removeShape(id)
              break
            }

            const mediaStore = useMediaStore.getState()
            if (mediaStore.selectedCanvasItemId) {
              e.preventDefault()
              const id = mediaStore.selectedCanvasItemId
              mediaStore.setSelectedCanvasItemId(null)
              mediaStore.removeFromCanvas(id)
              break
            }

            const templateStore = useHTMLTemplateLayerStore.getState()
            if (templateStore.selectedTemplateId) {
              e.preventDefault()
              const id = templateStore.selectedTemplateId
              templateStore.setSelectedTemplateId(null)
              templateStore.removeTemplate(id)
              break
            }

            const animStore = useAnimationStore.getState()
            if (animStore.selectedActiveId) {
              e.preventDefault()
              const id = animStore.selectedActiveId
              animStore.setSelectedActiveId(null)
              animStore.removeFromCanvas(id)
              break
            }

            const svgStore = useSVGObjectStore.getState()
            if (svgStore.selectedObjectId) {
              e.preventDefault()
              const id = svgStore.selectedObjectId
              svgStore.selectObject(null)
              svgStore.removeObject(id)
              break
            }

            const videoStore = useVideoLayerStore.getState()
            if (videoStore.selectedVideoId) {
              e.preventDefault()
              const id = videoStore.selectedVideoId
              videoStore.setSelectedVideoId(null)
              videoStore.removeVideo(id)
              break
            }

            const char3DStore = use3DCharacterStore.getState()
            if (char3DStore.activeCharacterId) {
              e.preventDefault()
              const id = char3DStore.activeCharacterId
              char3DStore.select3DCharacter(null)
              char3DStore.remove3DCharacter(id)
              break
            }
          }
          break
        }

        // Work area in/out points (toggle: press again at same frame to clear)
        case '[': {
          e.preventDefault()
          const { currentFrame, inPoint, setInPoint } = useTimelineStore.getState()
          setInPoint(inPoint === currentFrame ? null : currentFrame)
          break
        }

        case ']': {
          e.preventDefault()
          const { currentFrame, outPoint, setOutPoint } = useTimelineStore.getState()
          setOutPoint(outPoint === currentFrame ? null : currentFrame)
          break
        }

        // Clear selection
        case 'Escape':
          useTimelineStore.getState().clearSelection()
          break

        // ========================
        // UI / Timeline Zoom
        // ========================

        case '=':
        case '+': {
          if (isMod) {
            e.preventDefault()
            const { zoom, setZoom } = useTimelineStore.getState()
            setZoom(zoom * 1.2)
          }
          break
        }

        case '-': {
          if (isMod) {
            e.preventDefault()
            const { zoom, setZoom } = useTimelineStore.getState()
            setZoom(zoom / 1.2)
          }
          break
        }

        // ========================
        // Canvas
        // ========================

        case '3':
          if (!isMod) {
            e.preventDefault()
            useCanvasStore.getState().toggle3DView()
          }
          break

        // ========================
        // Motion Tracking (Perform Mode)
        // ========================

        // Ctrl/Cmd+Shift+T: Toggle motion tracking
        case 't':
        case 'T':
          if (isMod && e.shiftKey) {
            e.preventDefault()
            const mt = useMotionTrackingStore.getState()
            if (mt.isActive) {
              mt.stopTracking()
            } else {
              mt.startTracking()
              useEditorStore.getState().setLeftPanelActiveTab('motion-tracking')
            }
          }
          break

        // Ctrl/Cmd+Shift+C: Calibrate motion tracking
        case 'c':
        case 'C':
          if (isMod && e.shiftKey) {
            e.preventDefault()
            const mt = useMotionTrackingStore.getState()
            if (mt.isActive) {
              mt.calibrate()
            }
          }
          break

        // Ctrl/Cmd+Shift+R: Start/stop recording take
        case 'r':
        case 'R':
          if (isMod && e.shiftKey) {
            e.preventDefault()
            const mt = useMotionTrackingStore.getState()
            if (mt.isActive) {
              if (mt.isRecording) {
                mt.stopRecording()
              } else {
                const frame = useTimelineStore.getState().currentFrame
                mt.startRecording(frame)
              }
            }
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
