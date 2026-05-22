import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'
import type { CanvasObjectRef } from '@/types/keyframes'
import type { PathConfig, Point2D } from '@/engine/path'

export type MaskType = 'rectangle' | 'ellipse' | 'path' | 'layer'

export interface MaskDefinition {
  id: string
  name: string
  type: MaskType
  // Shape properties (for rectangle, ellipse, path)
  position: { x: number; y: number }
  width: number
  height: number
  rotation: number
  // Path (for path type) -- reuses PathConfig from engine/path.ts
  pathConfig?: PathConfig
  // Layer reference (for layer type -- uses another layer's alpha)
  sourceLayerRef?: CanvasObjectRef
  // Mask properties
  inverted: boolean         // invert mask (show outside, hide inside)
  feather: number           // edge feather in pixels (0 = hard edge)
  expansion: number         // expand/contract mask boundary in pixels
  opacity: number           // mask strength (1 = full mask, 0 = no mask)
}

interface MaskState {
  masks: MaskDefinition[]
  activeEditingMaskId: string | null

  // CRUD
  addMask: (type: MaskType, targetRef: CanvasObjectRef) => string
  updateMask: (maskId: string, updates: Partial<MaskDefinition>) => void
  removeMask: (maskId: string) => void

  // Path editing (for path-type masks)
  updateMaskPathPoint: (maskId: string, pointIndex: number, point: Point2D) => void

  // Queries
  getMaskById: (maskId: string) => MaskDefinition | undefined

  // Persistence
  loadFromProject: (masks: MaskDefinition[]) => void
}

export const useMaskStore = create<MaskState>()(
  temporal(
    immer((set, get) => ({
      masks: [],
      activeEditingMaskId: null,

      addMask: (type, _targetRef) => {
        const id = `mask_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        set((state) => {
          const mask: MaskDefinition = {
            id,
            name: `Mask ${state.masks.length + 1}`,
            type,
            position: { x: 100, y: 100 },
            width: 300,
            height: 200,
            rotation: 0,
            inverted: false,
            feather: 0,
            expansion: 0,
            opacity: 1,
          }

          if (type === 'path') {
            mask.pathConfig = {
              type: 'cubic-bezier',
              points: [
                { x: 100, y: 200 },
                { x: 200, y: 100 },
                { x: 300, y: 100 },
                { x: 400, y: 200 },
              ],
              closed: true,
            }
          }

          state.masks.push(mask)
          state.activeEditingMaskId = id
        })
        return id
      },

      updateMask: (maskId, updates) =>
        set((state) => {
          const mask = state.masks.find((m) => m.id === maskId)
          if (mask) {
            Object.assign(mask, updates)
          }
        }),

      removeMask: (maskId) =>
        set((state) => {
          state.masks = state.masks.filter((m) => m.id !== maskId)
          if (state.activeEditingMaskId === maskId) {
            state.activeEditingMaskId = null
          }
        }),

      updateMaskPathPoint: (maskId, pointIndex, point) =>
        set((state) => {
          const mask = state.masks.find((m) => m.id === maskId)
          if (mask?.pathConfig?.points[pointIndex]) {
            mask.pathConfig.points[pointIndex] = { ...point }
          }
        }),

      getMaskById: (maskId) => {
        return get().masks.find((m) => m.id === maskId)
      },

      loadFromProject: (masks) =>
        set((state) => {
          state.masks = masks
          state.activeEditingMaskId = null
        }),
    })),
    { limit: 100 }
  )
)
