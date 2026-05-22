import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { BoilingLineSettings } from '@/types/boilingLine'
import type { PixelArtEffectSettings } from '@/types/pixelArtEffect'
import type { ActiveStyleEffect } from '@/types/styleEffects'

export type CharacterPart = 'group' | 'viseme' | 'eye' | 'eyebrow' | 'hair' | 'body' | 'head' | 'shirt' | 'pants' | 'shoes'

/** Parts that can be reordered (excludes 'group' which is the root) */
export type LayerPart = Exclude<CharacterPart, 'group'>

export interface PartTransform {
  x: number
  y: number
  rotation: number
  scaleX: number
  scaleY: number
  visible: boolean
}

// Combined part state for persistence
export interface PartState {
  position: { x: number; y: number }
  rotation: number
  scale: { x: number; y: number }
  visible: boolean
  selectedSpriteIndex: number
}

interface CharacterPartsState {
  // Transform for each part
  transforms: Record<CharacterPart, PartTransform>

  // Selected sprite index for each part
  selectedSprites: Record<Exclude<CharacterPart, 'group'>, number | null>

  // Layer draw order — index 0 is drawn first (bottom), last is drawn on top.
  // Default: body → head → viseme → hair  (user's preferred order)
  layerOrder: LayerPart[]

  // Render mode: sprite (default 4-layer) or rigged (2D mesh deformation)
  renderMode: 'sprite' | 'rigged'
  // Reference to rig in useRigStore (when renderMode is 'rigged')
  rigId: string | null
  // Whether to show the bone skeleton overlay on the rigged body
  showBones: boolean
  // Boiling line (hand-drawn sketch effect)
  boilingLine?: BoilingLineSettings
  setBoilingLine: (settings: BoilingLineSettings | undefined) => void
  // Pixel art post-processing effect
  pixelArt?: PixelArtEffectSettings
  setPixelArt: (settings: PixelArtEffectSettings | undefined) => void
  // Active Canvas 2D style effect (mutually exclusive)
  activeStyleEffect?: ActiveStyleEffect
  setActiveStyleEffect: (effect: ActiveStyleEffect | undefined) => void

  // Actions for rig mode
  setRenderMode: (mode: 'sprite' | 'rigged') => void
  setRigId: (id: string | null) => void
  setShowBones: (show: boolean) => void

  // Getter for combined part state (for persistence)
  parts: Record<string, PartState>

  // Actions
  updateTransform: (part: CharacterPart, updates: Partial<PartTransform>) => void
  resetTransform: (part: CharacterPart) => void
  resetAllTransforms: () => void
  toggleVisibility: (part: CharacterPart) => void
  setSelectedSprite: (part: Exclude<CharacterPart, 'group'>, index: number | null) => void
  moveLayerUp: (part: LayerPart) => void
  moveLayerDown: (part: LayerPart) => void
  setLayerOrder: (order: LayerPart[]) => void

  // Project persistence
  loadFromProject: (data: Record<string, {
    position: { x: number; y: number }
    rotation: number
    scale: { x: number; y: number }
    visible: boolean
    selectedSpriteIndex: number
  }>) => void
}

const createDefaultTransform = (): PartTransform => ({
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  visible: true,
})

const createInitialTransforms = (): Record<CharacterPart, PartTransform> => ({
  group: { ...createDefaultTransform(), x: 960, y: 540 }, // Center of 1920x1080
  body: createDefaultTransform(),
  head: createDefaultTransform(),
  shirt: createDefaultTransform(),
  pants: createDefaultTransform(),
  shoes: createDefaultTransform(),
  eye: createDefaultTransform(),
  eyebrow: createDefaultTransform(),
  viseme: createDefaultTransform(),
  hair: createDefaultTransform(),
})

/** Default draw order: body (bottom) → clothing → head → expression → hair (top) */
const DEFAULT_LAYER_ORDER: LayerPart[] = ['body', 'shirt', 'pants', 'shoes', 'head', 'eye', 'eyebrow', 'viseme', 'hair']

export const useCharacterPartsStore = create<CharacterPartsState>()(
  immer((set, get) => ({
    transforms: createInitialTransforms(),

    selectedSprites: {
      body: null,
      head: null,
      viseme: null,
      eye: null,
      eyebrow: null,
      hair: null,
      shirt: null,
      pants: null,
      shoes: null,
    },

    layerOrder: [...DEFAULT_LAYER_ORDER],

    renderMode: 'sprite' as const,
    rigId: null as string | null,
    showBones: true,
    boilingLine: undefined as BoilingLineSettings | undefined,
    pixelArt: undefined as PixelArtEffectSettings | undefined,

    setBoilingLine: (settings) =>
      set((state) => {
        state.boilingLine = settings
      }),

    setPixelArt: (settings) =>
      set((state) => {
        state.pixelArt = settings
      }),

    activeStyleEffect: undefined as ActiveStyleEffect | undefined,
    setActiveStyleEffect: (effect) =>
      set((state) => {
        state.activeStyleEffect = effect
      }),

    setRenderMode: (mode) =>
      set((state) => {
        state.renderMode = mode
      }),

    setRigId: (id) =>
      set((state) => {
        state.rigId = id
      }),

    setShowBones: (show) =>
      set((state) => {
        state.showBones = show
      }),

    // Computed getter for persistence
    get parts() {
      const state = get()
      const result: Record<string, PartState> = {}
      const partKeys: CharacterPart[] = ['group', 'body', 'head', 'shirt', 'pants', 'shoes', 'eye', 'eyebrow', 'viseme', 'hair']

      for (const part of partKeys) {
        const transform = state.transforms[part]
        result[part] = {
          position: { x: transform.x, y: transform.y },
          rotation: transform.rotation,
          scale: { x: transform.scaleX, y: transform.scaleY },
          visible: transform.visible,
          selectedSpriteIndex: part === 'group' ? 0 : (state.selectedSprites[part as Exclude<CharacterPart, 'group'>] ?? 0),
        }
      }
      return result
    },

    updateTransform: (part, updates) =>
      set((state) => {
        const POSITION_CHILDREN: Record<string, LayerPart[]> = {
          body: ['shirt', 'pants', 'shoes'],
          head: ['eye', 'eyebrow', 'hair', 'viseme'],
          eye: [], eyebrow: [], hair: [], viseme: [],
          shirt: [], pants: [], shoes: [],
        }
        const SCALE_CHILDREN: Record<string, LayerPart[]> = {
          body: ['shirt', 'pants', 'shoes'],
          head: ['eye', 'eyebrow', 'hair', 'viseme'],
          eye: [], eyebrow: [], hair: [], viseme: [],
          shirt: [], pants: [], shoes: [],
        }

        const posChildren = (part !== 'group') ? (POSITION_CHILDREN[part] || []) : []
        const scaleChildren = (part !== 'group') ? (SCALE_CHILDREN[part] || []) : []

        const current = state.transforms[part]
        const dx = updates.x !== undefined ? updates.x - current.x : 0
        const dy = updates.y !== undefined ? updates.y - current.y : 0
        const scaleRatioX = updates.scaleX !== undefined && current.scaleX !== 0
          ? updates.scaleX / current.scaleX : 1
        const scaleRatioY = updates.scaleY !== undefined && current.scaleY !== 0
          ? updates.scaleY / current.scaleY : 1

        Object.assign(state.transforms[part], updates)

        if (dx !== 0 || dy !== 0) {
          for (const child of posChildren) {
            state.transforms[child].x += dx
            state.transforms[child].y += dy
          }
        }
        if (scaleRatioX !== 1 || scaleRatioY !== 1) {
          for (const child of scaleChildren) {
            state.transforms[child].scaleX = Math.max(0.1, Math.min(5, state.transforms[child].scaleX * scaleRatioX))
            state.transforms[child].scaleY = Math.max(0.1, Math.min(5, state.transforms[child].scaleY * scaleRatioY))
          }
        }
      }),

    resetTransform: (part) =>
      set((state) => {
        if (part === 'group') {
          state.transforms[part] = { ...createDefaultTransform(), x: 960, y: 540 }
        } else {
          state.transforms[part] = createDefaultTransform()
        }
      }),

    resetAllTransforms: () =>
      set((state) => {
        state.transforms = createInitialTransforms()
      }),

    toggleVisibility: (part) =>
      set((state) => {
        state.transforms[part].visible = !state.transforms[part].visible
      }),

    setSelectedSprite: (part, index) =>
      set((state) => {
        state.selectedSprites[part] = index
      }),

    moveLayerUp: (part) =>
      set((state) => {
        const idx = state.layerOrder.indexOf(part)
        if (idx < state.layerOrder.length - 1) {
          // Swap with the layer above (higher index = drawn on top)
          const temp = state.layerOrder[idx + 1]
          state.layerOrder[idx + 1] = part
          state.layerOrder[idx] = temp
        }
      }),

    moveLayerDown: (part) =>
      set((state) => {
        const idx = state.layerOrder.indexOf(part)
        if (idx > 0) {
          // Swap with the layer below (lower index = drawn first)
          const temp = state.layerOrder[idx - 1]
          state.layerOrder[idx - 1] = part
          state.layerOrder[idx] = temp
        }
      }),

    setLayerOrder: (order) =>
      set((state) => {
        state.layerOrder = order
      }),

    loadFromProject: (data) =>
      set((state) => {
        for (const [partKey, partData] of Object.entries(data)) {
          const part = partKey as CharacterPart
          if (state.transforms[part]) {
            state.transforms[part] = {
              x: partData.position.x,
              y: partData.position.y,
              rotation: partData.rotation,
              scaleX: partData.scale.x,
              scaleY: partData.scale.y,
              visible: partData.visible,
            }
            if (part !== 'group') {
              state.selectedSprites[part as Exclude<CharacterPart, 'group'>] = partData.selectedSpriteIndex
            }
          }
        }
      }),
  }))
)
