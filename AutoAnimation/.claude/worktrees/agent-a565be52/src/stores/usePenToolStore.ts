/**
 * usePenToolStore — State management for the Pen Tool feature.
 *
 * Manages vector paths with bezier control points, supports creating,
 * editing, and selecting paths. Outputs SVG path data (`d` attribute)
 * for rendering and export.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useTimelineStore } from './useTimelineStore'
import type { VectorPath, AnchorPoint } from '@/types/penTool'
import { createAnchor } from '@/types/penTool'

export type PenToolMode =
  | 'idle'          // Not in pen tool mode
  | 'drawing'       // Actively placing anchor points
  | 'editing'       // Editing existing path points
  | 'selecting'     // Selecting/moving paths

interface PenToolState {
  // ── Path collection ──
  paths: VectorPath[]
  selectedPathId: string | null
  selectedAnchorId: string | null

  // ── Tool mode ──
  mode: PenToolMode
  /** Whether pen tool is the active canvas tool */
  isActive: boolean

  // ── Drawing state ──
  /** ID of path currently being drawn */
  drawingPathId: string | null
  /** Preview point position during drawing (mouse position) */
  previewPoint: { x: number; y: number } | null

  // ── Default style ──
  defaultStroke: string
  defaultStrokeWidth: number
  defaultFill: string

  // ── Actions ──
  setMode: (mode: PenToolMode) => void
  setIsActive: (active: boolean) => void
  setPreviewPoint: (point: { x: number; y: number } | null) => void

  // Path CRUD
  startNewPath: (x: number, y: number) => string
  addAnchorToPath: (pathId: string, x: number, y: number) => void
  closePath: (pathId: string) => void
  finishDrawing: () => void
  removePath: (id: string) => void
  updatePath: (id: string, updates: Partial<VectorPath>) => void
  duplicatePath: (id: string) => void
  clearPaths: () => void
  loadFromSnapshot: (paths: VectorPath[]) => void

  // Selection
  setSelectedPathId: (id: string | null) => void
  setSelectedAnchorId: (id: string | null) => void

  // Anchor editing
  updateAnchor: (pathId: string, anchorId: string, updates: Partial<AnchorPoint>) => void
  moveAnchor: (pathId: string, anchorId: string, x: number, y: number) => void
  setHandleOut: (pathId: string, anchorId: string, dx: number, dy: number) => void
  setHandleIn: (pathId: string, anchorId: string, dx: number, dy: number) => void
  toggleAnchorType: (pathId: string, anchorId: string) => void
  deleteAnchor: (pathId: string, anchorId: string) => void
  insertAnchorAfter: (pathId: string, afterAnchorId: string, x: number, y: number) => void

  // Style defaults
  setDefaultStroke: (color: string) => void
  setDefaultStrokeWidth: (width: number) => void
  setDefaultFill: (color: string) => void
}

export const usePenToolStore = create<PenToolState>()(
  immer((set, get) => ({
    paths: [],
    selectedPathId: null,
    selectedAnchorId: null,
    mode: 'idle',
    isActive: false,
    drawingPathId: null,
    previewPoint: null,
    defaultStroke: '#ffffff',
    defaultStrokeWidth: 2,
    defaultFill: '',

    setMode: (mode) =>
      set((state) => {
        state.mode = mode
      }),

    setIsActive: (active) =>
      set((state) => {
        state.isActive = active
        if (!active) {
          state.mode = 'idle'
          state.drawingPathId = null
          state.previewPoint = null
        }
      }),

    setPreviewPoint: (point) =>
      set((state) => {
        state.previewPoint = point
      }),

    // ── Path CRUD ──

    startNewPath: (x, y) => {
      const id = `vpath-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const { totalFrames } = useTimelineStore.getState()
      const { defaultStroke, defaultStrokeWidth, defaultFill } = get()

      set((state) => {
        const path: VectorPath = {
          id,
          name: `Path ${state.paths.length + 1}`,
          anchors: [createAnchor(x, y)],
          closed: false,
          stroke: defaultStroke,
          strokeWidth: defaultStrokeWidth,
          fill: defaultFill,
          opacity: 1,
          position: { x: 0, y: 0 },
          rotation: 0,
          scale: { x: 1, y: 1 },
          zIndex: 7,
          visible: true,
          startFrame: 0,
          endFrame: totalFrames,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: [],
        }

        state.paths.push(path)
        state.drawingPathId = id
        state.selectedPathId = id
        state.mode = 'drawing'
      })

      return id
    },

    addAnchorToPath: (pathId, x, y) =>
      set((state) => {
        const path = state.paths.find((p) => p.id === pathId)
        if (!path) return

        const newAnchor = createAnchor(x, y)
        path.anchors.push(newAnchor)
        state.selectedAnchorId = newAnchor.id
      }),

    closePath: (pathId) =>
      set((state) => {
        const path = state.paths.find((p) => p.id === pathId)
        if (path && path.anchors.length >= 3) {
          path.closed = true
        }
        state.drawingPathId = null
        state.mode = 'editing'
      }),

    finishDrawing: () =>
      set((state) => {
        if (state.drawingPathId) {
          const path = state.paths.find((p) => p.id === state.drawingPathId)
          // Remove paths with fewer than 2 points
          if (path && path.anchors.length < 2) {
            state.paths = state.paths.filter((p) => p.id !== state.drawingPathId)
            state.selectedPathId = null
          }
        }
        state.drawingPathId = null
        state.mode = state.isActive ? 'selecting' : 'idle'
        state.previewPoint = null
      }),

    removePath: (id) =>
      set((state) => {
        state.paths = state.paths.filter((p) => p.id !== id)
        if (state.selectedPathId === id) {
          state.selectedPathId = null
          state.selectedAnchorId = null
        }
      }),

    updatePath: (id, updates) =>
      set((state) => {
        const path = state.paths.find((p) => p.id === id)
        if (path) {
          Object.assign(path, updates)
        }
      }),

    duplicatePath: (id) =>
      set((state) => {
        const source = state.paths.find((p) => p.id === id)
        if (!source) return
        const newId = `vpath-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        const clone: VectorPath = {
          ...JSON.parse(JSON.stringify(source)),
          id: newId,
          name: `${source.name} copy`,
          position: {
            x: source.position.x + 20,
            y: source.position.y + 20,
          },
        }
        state.paths.push(clone)
        state.selectedPathId = newId
      }),

    clearPaths: () =>
      set((state) => {
        state.paths = []
        state.selectedPathId = null
        state.selectedAnchorId = null
        state.drawingPathId = null
      }),

    loadFromSnapshot: (paths) =>
      set((state) => {
        state.paths = paths
        state.selectedPathId = null
        state.selectedAnchorId = null
      }),

    // ── Selection ──

    setSelectedPathId: (id) =>
      set((state) => {
        state.selectedPathId = id
        if (id === null) {
          state.selectedAnchorId = null
        }
      }),

    setSelectedAnchorId: (id) =>
      set((state) => {
        state.selectedAnchorId = id
      }),

    // ── Anchor editing ──

    updateAnchor: (pathId, anchorId, updates) =>
      set((state) => {
        const path = state.paths.find((p) => p.id === pathId)
        if (!path) return
        const anchor = path.anchors.find((a) => a.id === anchorId)
        if (anchor) {
          Object.assign(anchor, updates)
        }
      }),

    moveAnchor: (pathId, anchorId, x, y) =>
      set((state) => {
        const path = state.paths.find((p) => p.id === pathId)
        if (!path) return
        const anchor = path.anchors.find((a) => a.id === anchorId)
        if (anchor) {
          anchor.x = x
          anchor.y = y
        }
      }),

    setHandleOut: (pathId, anchorId, dx, dy) =>
      set((state) => {
        const path = state.paths.find((p) => p.id === pathId)
        if (!path) return
        const anchor = path.anchors.find((a) => a.id === anchorId)
        if (!anchor) return

        anchor.handleOut = { x: dx, y: dy }
        // If smooth, mirror to handleIn
        if (anchor.type === 'smooth') {
          anchor.handleIn = { x: -dx, y: -dy }
        }
      }),

    setHandleIn: (pathId, anchorId, dx, dy) =>
      set((state) => {
        const path = state.paths.find((p) => p.id === pathId)
        if (!path) return
        const anchor = path.anchors.find((a) => a.id === anchorId)
        if (!anchor) return

        anchor.handleIn = { x: dx, y: dy }
        // If smooth, mirror to handleOut
        if (anchor.type === 'smooth') {
          anchor.handleOut = { x: -dx, y: -dy }
        }
      }),

    toggleAnchorType: (pathId, anchorId) =>
      set((state) => {
        const path = state.paths.find((p) => p.id === pathId)
        if (!path) return
        const anchor = path.anchors.find((a) => a.id === anchorId)
        if (!anchor) return

        if (anchor.type === 'smooth') {
          anchor.type = 'corner'
        } else {
          anchor.type = 'smooth'
          // Mirror handles when switching to smooth
          if (anchor.handleOut) {
            anchor.handleIn = { x: -anchor.handleOut.x, y: -anchor.handleOut.y }
          }
        }
      }),

    deleteAnchor: (pathId, anchorId) =>
      set((state) => {
        const path = state.paths.find((p) => p.id === pathId)
        if (!path) return

        path.anchors = path.anchors.filter((a) => a.id !== anchorId)
        if (state.selectedAnchorId === anchorId) {
          state.selectedAnchorId = null
        }
        // Remove path if fewer than 2 anchors
        if (path.anchors.length < 2) {
          state.paths = state.paths.filter((p) => p.id !== pathId)
          if (state.selectedPathId === pathId) {
            state.selectedPathId = null
          }
        }
      }),

    insertAnchorAfter: (pathId, afterAnchorId, x, y) =>
      set((state) => {
        const path = state.paths.find((p) => p.id === pathId)
        if (!path) return

        const idx = path.anchors.findIndex((a) => a.id === afterAnchorId)
        if (idx === -1) return

        const newAnchor = createAnchor(x, y, 'smooth')
        path.anchors.splice(idx + 1, 0, newAnchor)
        state.selectedAnchorId = newAnchor.id
      }),

    // ── Style defaults ──

    setDefaultStroke: (color) =>
      set((state) => {
        state.defaultStroke = color
      }),

    setDefaultStrokeWidth: (width) =>
      set((state) => {
        state.defaultStrokeWidth = width
      }),

    setDefaultFill: (color) =>
      set((state) => {
        state.defaultFill = color
      }),
  }))
)
