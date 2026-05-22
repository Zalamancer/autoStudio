import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useTimelineStore } from './useTimelineStore'

// ── Types ─────────────────────────────────────────────────────────────

export type AnnotationType =
  | 'arrow'
  | 'circle'
  | 'rectangle'
  | 'highlight'
  | 'text'
  | 'blur'
  | 'freehand'

export type AnnotationAnimation = 'none' | 'fadeIn' | 'draw'

export interface AnnotationPoint {
  x: number
  y: number
}

export interface Annotation {
  id: string
  type: AnnotationType
  /** Points defining the annotation shape (start/end for arrow/rect, path for freehand) */
  points: AnnotationPoint[]
  color: string
  thickness: number
  opacity: number
  startFrame: number
  endFrame: number
  animation: AnnotationAnimation
  visible: boolean
  /** Optional text content for 'text' type annotations */
  textContent?: string
  /** Blur radius for 'blur' type annotations */
  blurRadius?: number
}

export type AnnotationTool = AnnotationType | null

// ── Drawing state ─────────────────────────────────────────────────────

interface DrawingState {
  isDrawing: boolean
  currentPoints: AnnotationPoint[]
}

// ── Style state ───────────────────────────────────────────────────────

interface AnnotationStyle {
  color: string
  thickness: number
  opacity: number
  animation: AnnotationAnimation
}

// ── Store ─────────────────────────────────────────────────────────────

interface AnnotationState {
  annotations: Annotation[]
  selectedAnnotationId: string | null
  activeTool: AnnotationTool
  drawing: DrawingState
  style: AnnotationStyle

  // Annotation CRUD
  addAnnotation: (annotation: Omit<Annotation, 'id'>) => string
  removeAnnotation: (id: string) => void
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void
  setSelectedAnnotation: (id: string | null) => void
  toggleVisibility: (id: string) => void
  clearAnnotations: () => void
  duplicateAnnotation: (id: string) => void

  // Tool
  setTool: (tool: AnnotationTool) => void

  // Drawing
  startDrawing: (point: AnnotationPoint) => void
  addPoint: (point: AnnotationPoint) => void
  finishDrawing: () => void
  cancelDrawing: () => void

  // Style
  setColor: (color: string) => void
  setThickness: (thickness: number) => void
  setOpacity: (opacity: number) => void
  setAnimation: (animation: AnnotationAnimation) => void

  // Snapshot for project load/save
  loadFromSnapshot: (annotations: Annotation[]) => void
}

export const useAnnotationStore = create<AnnotationState>()(
  immer((set, get) => ({
    annotations: [],
    selectedAnnotationId: null,
    activeTool: null,
    drawing: {
      isDrawing: false,
      currentPoints: [],
    },
    style: {
      color: '#ef4444',
      thickness: 3,
      opacity: 1,
      animation: 'none',
    },

    // ── Annotation CRUD ─────────────────────────────────────────────

    addAnnotation: (annotation) => {
      const id = `annotation-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      set((state) => {
        state.annotations.push({ ...annotation, id })
        state.selectedAnnotationId = id
      })
      return id
    },

    removeAnnotation: (id) => {
      set((state) => {
        state.annotations = state.annotations.filter((a) => a.id !== id)
        if (state.selectedAnnotationId === id) {
          state.selectedAnnotationId = null
        }
      })
    },

    updateAnnotation: (id, updates) => {
      set((state) => {
        const annotation = state.annotations.find((a) => a.id === id)
        if (annotation) {
          Object.assign(annotation, updates)
        }
      })
    },

    setSelectedAnnotation: (id) => {
      set((state) => {
        state.selectedAnnotationId = id
      })
    },

    toggleVisibility: (id) => {
      set((state) => {
        const annotation = state.annotations.find((a) => a.id === id)
        if (annotation) {
          annotation.visible = !annotation.visible
        }
      })
    },

    clearAnnotations: () => {
      set((state) => {
        state.annotations = []
        state.selectedAnnotationId = null
      })
    },

    duplicateAnnotation: (id) => {
      const annotation = get().annotations.find((a) => a.id === id)
      if (!annotation) return
      const newId = `annotation-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      set((state) => {
        state.annotations.push({
          ...annotation,
          id: newId,
          // Offset slightly so it's visible
          points: annotation.points.map((p) => ({ x: p.x + 20, y: p.y + 20 })),
        })
        state.selectedAnnotationId = newId
      })
    },

    // ── Tool ─────────────────────────────────────────────────────────

    setTool: (tool) => {
      set((state) => {
        state.activeTool = tool
        // Clear any in-progress drawing when switching tools
        if (state.drawing.isDrawing) {
          state.drawing.isDrawing = false
          state.drawing.currentPoints = []
        }
      })
    },

    // ── Drawing ──────────────────────────────────────────────────────

    startDrawing: (point) => {
      set((state) => {
        state.drawing.isDrawing = true
        state.drawing.currentPoints = [point]
      })
    },

    addPoint: (point) => {
      set((state) => {
        if (state.drawing.isDrawing) {
          state.drawing.currentPoints.push(point)
        }
      })
    },

    finishDrawing: () => {
      const { drawing, activeTool, style } = get()
      if (!drawing.isDrawing || !activeTool || drawing.currentPoints.length < 1) {
        set((state) => {
          state.drawing.isDrawing = false
          state.drawing.currentPoints = []
        })
        return
      }

      const { totalFrames } = useTimelineStore.getState()
      const currentFrame = useTimelineStore.getState().currentFrame ?? 0

      const points = [...drawing.currentPoints]

      // For non-freehand tools, only use first and last points
      const finalPoints =
        activeTool === 'freehand' ? points : [points[0], points[points.length - 1]]

      // Ensure we have at least 2 points for shape tools
      if (activeTool !== 'freehand' && finalPoints.length < 2) {
        finalPoints.push({ x: finalPoints[0].x + 50, y: finalPoints[0].y + 50 })
      }

      const annotation: Omit<Annotation, 'id'> = {
        type: activeTool,
        points: finalPoints,
        color: style.color,
        thickness: style.thickness,
        opacity: style.opacity,
        startFrame: currentFrame,
        endFrame: totalFrames,
        animation: style.animation,
        visible: true,
        textContent: activeTool === 'text' ? 'Text' : undefined,
        blurRadius: activeTool === 'blur' ? 10 : undefined,
      }

      set((state) => {
        state.drawing.isDrawing = false
        state.drawing.currentPoints = []
      })

      get().addAnnotation(annotation)
    },

    cancelDrawing: () => {
      set((state) => {
        state.drawing.isDrawing = false
        state.drawing.currentPoints = []
      })
    },

    // ── Style ────────────────────────────────────────────────────────

    setColor: (color) => {
      set((state) => {
        state.style.color = color
      })
    },

    setThickness: (thickness) => {
      set((state) => {
        state.style.thickness = thickness
      })
    },

    setOpacity: (opacity) => {
      set((state) => {
        state.style.opacity = opacity
      })
    },

    setAnimation: (animation) => {
      set((state) => {
        state.style.animation = animation
      })
    },

    // ── Snapshot ──────────────────────────────────────────────────────

    loadFromSnapshot: (annotations) => {
      set((state) => {
        state.annotations = annotations
        state.selectedAnnotationId = null
      })
    },
  }))
)
