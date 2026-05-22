import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'

// ── Types ──────────────────────────────────────────────────────

export interface OutfitLayer {
  id: string
  name: string
  spriteUrl: string
  /** Offset from character group position */
  position: { x: number; y: number }
  rotation: number
  scale: { x: number; y: number }
  visible: boolean
  /**
   * Z-order relative to the base character layers.
   * Positive values render on top; negative values render below.
   * Base layer order indices range 0-8 (body..hair).
   * Use values like 10+ to render above all base layers, or -1 to render behind body.
   */
  zOrder: number
}

export interface OutfitPreset {
  id: string
  name: string
  thumbnail?: string
  layers: OutfitLayer[]
  createdAt: number
}

interface WardrobeState {
  /** Active outfit layers on the current character */
  layers: OutfitLayer[]

  /** Saved outfit presets */
  presets: OutfitPreset[]

  // ── Actions ──

  /** Add a new outfit layer (accessory/clothing sprite) */
  addOutfitLayer: (layer: Omit<OutfitLayer, 'id'>) => string

  /** Remove an outfit layer by id */
  removeOutfitLayer: (id: string) => void

  /** Update transform (position/rotation/scale/visible) of a layer */
  updateLayerTransform: (id: string, updates: Partial<Omit<OutfitLayer, 'id' | 'name' | 'spriteUrl'>>) => void

  /** Update layer name */
  renameLayer: (id: string, name: string) => void

  /** Toggle layer visibility */
  toggleLayerVisibility: (id: string) => void

  /** Move layer up in the z-order list */
  moveLayerUp: (id: string) => void

  /** Move layer down in the z-order list */
  moveLayerDown: (id: string) => void

  /** Reorder layers (set full order) */
  reorderLayers: (orderedIds: string[]) => void

  /** Save current layers as an outfit preset */
  saveOutfitPreset: (name: string) => string

  /** Load an outfit preset (replaces current layers) */
  loadOutfitPreset: (presetId: string) => void

  /** Delete an outfit preset */
  deleteOutfitPreset: (presetId: string) => void

  /** Clear all outfit layers */
  clearAllLayers: () => void

  /** Reset to initial state */
  reset: () => void
}

let _nextId = 1
function generateId(): string {
  return `outfit-${Date.now()}-${_nextId++}`
}

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    immer((set, get) => ({
      layers: [],
      presets: [],

      addOutfitLayer: (layer) => {
        const id = generateId()
        set((state) => {
          state.layers.push({ ...layer, id })
        })
        return id
      },

      removeOutfitLayer: (id) =>
        set((state) => {
          state.layers = state.layers.filter((l) => l.id !== id)
        }),

      updateLayerTransform: (id, updates) =>
        set((state) => {
          const layer = state.layers.find((l) => l.id === id)
          if (!layer) return
          if (updates.position !== undefined) layer.position = updates.position
          if (updates.rotation !== undefined) layer.rotation = updates.rotation
          if (updates.scale !== undefined) layer.scale = updates.scale
          if (updates.visible !== undefined) layer.visible = updates.visible
          if (updates.zOrder !== undefined) layer.zOrder = updates.zOrder
        }),

      renameLayer: (id, name) =>
        set((state) => {
          const layer = state.layers.find((l) => l.id === id)
          if (layer) layer.name = name
        }),

      toggleLayerVisibility: (id) =>
        set((state) => {
          const layer = state.layers.find((l) => l.id === id)
          if (layer) layer.visible = !layer.visible
        }),

      moveLayerUp: (id) =>
        set((state) => {
          const idx = state.layers.findIndex((l) => l.id === id)
          if (idx < state.layers.length - 1) {
            const temp = state.layers[idx + 1]
            state.layers[idx + 1] = state.layers[idx]
            state.layers[idx] = temp
          }
        }),

      moveLayerDown: (id) =>
        set((state) => {
          const idx = state.layers.findIndex((l) => l.id === id)
          if (idx > 0) {
            const temp = state.layers[idx - 1]
            state.layers[idx - 1] = state.layers[idx]
            state.layers[idx] = temp
          }
        }),

      reorderLayers: (orderedIds) =>
        set((state) => {
          const layerMap = new Map(state.layers.map((l) => [l.id, l]))
          const reordered: OutfitLayer[] = []
          for (const id of orderedIds) {
            const layer = layerMap.get(id)
            if (layer) reordered.push(layer)
          }
          // Append any layers not in orderedIds (shouldn't happen, but defensive)
          for (const layer of state.layers) {
            if (!orderedIds.includes(layer.id)) reordered.push(layer)
          }
          state.layers = reordered
        }),

      saveOutfitPreset: (name) => {
        const id = generateId()
        const currentLayers = get().layers
        set((state) => {
          state.presets.push({
            id,
            name,
            layers: currentLayers.map((l) => ({ ...l })),
            createdAt: Date.now(),
          })
        })
        return id
      },

      loadOutfitPreset: (presetId) =>
        set((state) => {
          const preset = state.presets.find((p) => p.id === presetId)
          if (!preset) return
          // Deep-copy preset layers with new IDs to avoid ID collisions
          state.layers = preset.layers.map((l) => ({
            ...l,
            id: generateId(),
            position: { ...l.position },
            scale: { ...l.scale },
          }))
        }),

      deleteOutfitPreset: (presetId) =>
        set((state) => {
          state.presets = state.presets.filter((p) => p.id !== presetId)
        }),

      clearAllLayers: () =>
        set((state) => {
          state.layers = []
        }),

      reset: () =>
        set((state) => {
          state.layers = []
          // Keep presets -- they are user-created collections
        }),
    })),
    {
      name: 'wardrobe-storage',
      partialize: (state) => ({
        // Only persist presets, not active layers (those come from the project)
        presets: state.presets.map((p) => ({
          ...p,
          // Truncate large sprite URLs for localStorage (full data in IndexedDB)
          layers: p.layers.map((l) => ({
            ...l,
            spriteUrl: l.spriteUrl.length > 500 ? l.spriteUrl.slice(0, 200) : l.spriteUrl,
          })),
        })),
      }),
    }
  )
)
