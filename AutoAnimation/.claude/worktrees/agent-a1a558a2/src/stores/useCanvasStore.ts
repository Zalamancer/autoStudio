import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Character, Transform } from '@/types'

interface CanvasState {
  // Characters on canvas
  characters: Character[]
  selectedCharacterId: string | null

  // Canvas dimensions
  canvasWidth: number
  canvasHeight: number
  /** Alias for canvasWidth */
  width: number
  /** Alias for canvasHeight */
  height: number

  // Canvas zoom and pan
  canvasZoom: number
  canvasPanX: number
  canvasPanY: number
  /** Alias for canvasZoom */
  zoom: number
  /** Alias for canvasPanX */
  panX: number
  /** Alias for canvasPanY */
  panY: number

  // 3D orbit view
  is3DView: boolean
  orbitRotationX: number
  orbitRotationY: number
  layerSpreadFactor: number

  // Actions
  addCharacter: (character: Character) => void
  removeCharacter: (id: string) => void
  selectCharacter: (id: string | null) => void
  updateCharacterTransform: (id: string, transform: Partial<Transform>) => void
  updateCharacterExpression: (id: string, expression: string, intensity: number) => void
  toggleCharacterVisibility: (id: string) => void
  toggleCharacterLock: (id: string) => void
  setCanvasDimensions: (width: number, height: number) => void
  setCanvasZoom: (zoom: number) => void
  setCanvasPan: (x: number, y: number) => void
  resetCanvasView: () => void
  clearCanvas: () => void
  toggle3DView: () => void
  setOrbitRotation: (x: number, y: number) => void
  resetOrbitRotation: () => void
  setLayerSpreadFactor: (factor: number) => void
}

export const useCanvasStore = create<CanvasState>()(
  immer((set) => ({
    // Initial state
    characters: [],
    selectedCharacterId: null,
    canvasWidth: 1920,
    canvasHeight: 1080,
    width: 1920,
    height: 1080,
    canvasZoom: 1,
    canvasPanX: 0,
    canvasPanY: 0,
    zoom: 1,
    panX: 0,
    panY: 0,
    is3DView: false,
    orbitRotationX: -15,
    orbitRotationY: -25,
    layerSpreadFactor: 1.0,

    // Actions
    addCharacter: (character) =>
      set((state) => {
        state.characters.push(character)
      }),

    removeCharacter: (id) =>
      set((state) => {
        state.characters = state.characters.filter((c) => c.id !== id)
        if (state.selectedCharacterId === id) {
          state.selectedCharacterId = null
        }
      }),

    selectCharacter: (id) =>
      set((state) => {
        state.selectedCharacterId = id
      }),

    updateCharacterTransform: (id, transform) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === id)
        if (character && !character.locked) {
          Object.assign(character.transform, transform)
        }
      }),

    updateCharacterExpression: (id, expression, intensity) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === id)
        if (character) {
          character.expression = expression
          character.intensity = intensity
        }
      }),

    toggleCharacterVisibility: (id) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === id)
        if (character) {
          character.visible = !character.visible
        }
      }),

    toggleCharacterLock: (id) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === id)
        if (character) {
          character.locked = !character.locked
        }
      }),

    setCanvasDimensions: (width, height) =>
      set((state) => {
        state.canvasWidth = width
        state.canvasHeight = height
        state.width = width
        state.height = height
      }),

    setCanvasZoom: (zoom) =>
      set((state) => {
        const clamped = Math.min(3.0, Math.max(0.25, zoom))
        state.canvasZoom = clamped
        state.zoom = clamped
      }),

    setCanvasPan: (x, y) =>
      set((state) => {
        state.canvasPanX = x
        state.canvasPanY = y
        state.panX = x
        state.panY = y
      }),

    resetCanvasView: () =>
      set((state) => {
        state.canvasZoom = 1
        state.canvasPanX = 0
        state.canvasPanY = 0
        state.zoom = 1
        state.panX = 0
        state.panY = 0
      }),

    clearCanvas: () =>
      set((state) => {
        state.characters = []
        state.selectedCharacterId = null
      }),

    toggle3DView: () =>
      set((state) => {
        state.is3DView = !state.is3DView
        if (state.is3DView) {
          state.orbitRotationX = -15
          state.orbitRotationY = -25
          state.layerSpreadFactor = 1.0
        }
      }),

    setOrbitRotation: (x, y) =>
      set((state) => {
        state.orbitRotationX = Math.max(-60, Math.min(60, x))
        state.orbitRotationY = Math.max(-90, Math.min(90, y))
      }),

    resetOrbitRotation: () =>
      set((state) => {
        state.orbitRotationX = -15
        state.orbitRotationY = -25
      }),

    setLayerSpreadFactor: (factor) =>
      set((state) => {
        state.layerSpreadFactor = Math.max(0.2, Math.min(3.0, factor))
      }),
  }))
)

/** Formula variables exported from canvas state. */
export function getCanvasFormulaVariables(): Record<string, number> {
  const { canvasWidth, canvasHeight, canvasZoom } = useCanvasStore.getState()
  return {
    width: canvasWidth,
    height: canvasHeight,
    zoom: canvasZoom,
    centerX: canvasWidth / 2,
    centerY: canvasHeight / 2,
  }
}
