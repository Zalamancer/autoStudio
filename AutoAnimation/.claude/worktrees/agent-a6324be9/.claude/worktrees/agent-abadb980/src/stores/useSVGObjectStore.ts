import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { SVGObject, SVGObjectComposition, SVGObjectKeyframe } from '@/types/svgObjects'

interface SVGObjectState {
  // Active composition
  composition: SVGObjectComposition | null

  // Selection
  selectedObjectId: string | null

  // Loading state
  isGenerating: boolean
  error: string | null

  // Actions
  setComposition: (comp: SVGObjectComposition) => void
  clearComposition: () => void

  // Object CRUD
  updateObject: (id: string, updates: Partial<SVGObject>) => void
  setObjectColor: (objectId: string, colorKey: string, value: string) => void
  resetObjectColors: (objectId: string) => void
  toggleObjectVisibility: (objectId: string) => void
  setObjectOpacity: (objectId: string, opacity: number) => void
  setObjectZIndex: (objectId: string, zIndex: number) => void
  setObjectTimeRange: (objectId: string, startFrame: number, endFrame: number) => void
  removeObject: (objectId: string) => void

  // Keyframe CRUD
  addKeyframe: (objectId: string, keyframe: SVGObjectKeyframe) => void
  updateKeyframe: (objectId: string, index: number, updates: Partial<SVGObjectKeyframe>) => void
  removeKeyframe: (objectId: string, index: number) => void

  // Selection
  selectObject: (id: string | null) => void

  // Generation state
  setGenerating: (v: boolean) => void
  setError: (e: string | null) => void

  // Snapshot loading
  loadFromSnapshot: (composition: SVGObjectComposition) => void
}

export const useSVGObjectStore = create<SVGObjectState>()(
  immer((set) => ({
    composition: null,
    selectedObjectId: null,
    isGenerating: false,
    error: null,

    setComposition: (comp) =>
      set((state) => {
        state.composition = comp
        state.selectedObjectId = null
      }),

    clearComposition: () =>
      set((state) => {
        state.composition = null
        state.selectedObjectId = null
      }),

    updateObject: (id, updates) =>
      set((state) => {
        if (!state.composition) return
        const obj = state.composition.objects.find((o) => o.id === id)
        if (obj) {
          Object.assign(obj, updates)
        }
      }),

    setObjectColor: (objectId, colorKey, value) =>
      set((state) => {
        if (!state.composition) return
        const obj = state.composition.objects.find((o) => o.id === objectId)
        if (obj) {
          obj.colors[colorKey] = value
        }
      }),

    resetObjectColors: (objectId) =>
      set((state) => {
        if (!state.composition) return
        const obj = state.composition.objects.find((o) => o.id === objectId)
        if (obj) {
          obj.colors = { ...obj.defaultColors }
        }
      }),

    toggleObjectVisibility: (objectId) =>
      set((state) => {
        if (!state.composition) return
        const obj = state.composition.objects.find((o) => o.id === objectId)
        if (obj) {
          obj.visible = !obj.visible
        }
      }),

    setObjectOpacity: (objectId, opacity) =>
      set((state) => {
        if (!state.composition) return
        const obj = state.composition.objects.find((o) => o.id === objectId)
        if (obj) {
          obj.opacity = Math.max(0, Math.min(1, opacity))
        }
      }),

    setObjectZIndex: (objectId, zIndex) =>
      set((state) => {
        if (!state.composition) return
        const obj = state.composition.objects.find((o) => o.id === objectId)
        if (obj) {
          obj.zIndex = zIndex
        }
      }),

    setObjectTimeRange: (objectId, startFrame, endFrame) =>
      set((state) => {
        if (!state.composition) return
        const obj = state.composition.objects.find((o) => o.id === objectId)
        if (obj) {
          obj.startFrame = startFrame
          obj.endFrame = endFrame
        }
      }),

    removeObject: (objectId) =>
      set((state) => {
        if (!state.composition) return
        state.composition.objects = state.composition.objects.filter((o) => o.id !== objectId)
        if (state.selectedObjectId === objectId) {
          state.selectedObjectId = null
        }
      }),

    // Keyframe CRUD
    addKeyframe: (objectId, keyframe) =>
      set((state) => {
        if (!state.composition) return
        const obj = state.composition.objects.find((o) => o.id === objectId)
        if (obj) {
          obj.keyframes.push(keyframe)
          // Keep keyframes sorted by time
          obj.keyframes.sort((a, b) => a.time - b.time)
        }
      }),

    updateKeyframe: (objectId, index, updates) =>
      set((state) => {
        if (!state.composition) return
        const obj = state.composition.objects.find((o) => o.id === objectId)
        if (obj && index >= 0 && index < obj.keyframes.length) {
          Object.assign(obj.keyframes[index], updates)
          // Re-sort if time changed
          if (updates.time !== undefined) {
            obj.keyframes.sort((a, b) => a.time - b.time)
          }
        }
      }),

    removeKeyframe: (objectId, index) =>
      set((state) => {
        if (!state.composition) return
        const obj = state.composition.objects.find((o) => o.id === objectId)
        if (obj && index >= 0 && index < obj.keyframes.length) {
          obj.keyframes.splice(index, 1)
        }
      }),

    selectObject: (id) =>
      set((state) => {
        state.selectedObjectId = id
      }),

    setGenerating: (v) =>
      set((state) => {
        state.isGenerating = v
      }),

    setError: (e) =>
      set((state) => {
        state.error = e
      }),

    loadFromSnapshot: (composition) =>
      set((state) => {
        state.composition = composition
        state.selectedObjectId = null
        state.isGenerating = false
        state.error = null
      }),
  }))
)
