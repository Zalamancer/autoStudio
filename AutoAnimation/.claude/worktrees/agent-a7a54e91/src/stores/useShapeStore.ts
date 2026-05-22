import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useTimelineStore } from './useTimelineStore'
import { useBrandKitStore } from './useBrandKitStore'
import type { CanvasShape, ShapeType } from '@/types/shapes'

const SHAPE_DEFAULTS: Record<ShapeType, Partial<CanvasShape>> = {
  rectangle: { width: 200, height: 150, fill: '#3b82f6', borderRadius: 0 },
  circle: { width: 150, height: 150, fill: '#8b5cf6' },
  triangle: { width: 150, height: 130, fill: '#10b981' },
  star: { width: 150, height: 150, fill: '#f59e0b', points: 5, innerRadius: 0.4 },
}

interface ShapeState {
  shapes: CanvasShape[]
  selectedShapeId: string | null

  addShape: (type: ShapeType) => void
  removeShape: (id: string) => void
  updateShape: (id: string, updates: Partial<CanvasShape>) => void
  setSelectedShapeId: (id: string | null) => void
  setShapeTimeRange: (id: string, startFrame: number, endFrame: number) => void
  duplicateShape: (id: string) => void
  clearShapes: () => void
  loadFromSnapshot: (shapes: CanvasShape[]) => void
}

export const useShapeStore = create<ShapeState>()(
  immer((set, _get) => ({
    shapes: [],
    selectedShapeId: null,

    addShape: (type) =>
      set((state) => {
        const { totalFrames } = useTimelineStore.getState()
        const defaults = SHAPE_DEFAULTS[type]
        const id = `shape-${Date.now()}`
        const count = state.shapes.filter((s) => s.type === type).length

        // Apply brand kit colors if active
        const brandKit = useBrandKitStore.getState().getActiveBrandKit()
        const brandFill = brandKit?.shapeDefaults?.fillColor || brandKit?.accentColor
        const brandStroke = brandKit?.shapeDefaults?.strokeColor

        const shape: CanvasShape = {
          id,
          type,
          name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${count + 1}`,
          position: { x: 100, y: 100 },
          width: defaults.width ?? 150,
          height: defaults.height ?? 150,
          rotation: 0,
          fill: brandFill || defaults.fill || '#3b82f6',
          stroke: brandStroke || 'transparent',
          strokeWidth: brandStroke ? 2 : 0,
          opacity: 1,
          zIndex: 6,
          visible: true,
          startFrame: 0,
          endFrame: totalFrames,
          borderRadius: defaults.borderRadius,
          points: defaults.points,
          innerRadius: defaults.innerRadius,
        }

        state.shapes.push(shape)
        state.selectedShapeId = id
      }),

    removeShape: (id) =>
      set((state) => {
        state.shapes = state.shapes.filter((s) => s.id !== id)
        if (state.selectedShapeId === id) {
          state.selectedShapeId = null
        }
      }),

    updateShape: (id, updates) =>
      set((state) => {
        const shape = state.shapes.find((s) => s.id === id)
        if (shape) {
          Object.assign(shape, updates)
        }
      }),

    setSelectedShapeId: (id) =>
      set((state) => {
        state.selectedShapeId = id
      }),

    setShapeTimeRange: (id, startFrame, endFrame) =>
      set((state) => {
        const shape = state.shapes.find((s) => s.id === id)
        if (shape) {
          shape.startFrame = startFrame
          shape.endFrame = endFrame
        }
      }),

    duplicateShape: (id) =>
      set((state) => {
        const source = state.shapes.find((s) => s.id === id)
        if (!source) return
        const newId = `shape-${Date.now()}`
        const clone: CanvasShape = {
          ...JSON.parse(JSON.stringify(source)),
          id: newId,
          name: `${source.name} copy`,
          position: { x: source.position.x + 20, y: source.position.y + 20 },
        }
        state.shapes.push(clone)
        state.selectedShapeId = newId
      }),

    clearShapes: () =>
      set((state) => {
        state.shapes = []
        state.selectedShapeId = null
      }),

    loadFromSnapshot: (shapes) =>
      set((state) => {
        state.shapes = shapes
        state.selectedShapeId = null
      }),
  }))
)
