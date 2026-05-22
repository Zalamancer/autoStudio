/**
 * State management for 3D characters placed on the canvas.
 * Parallel to useMultiCharacterStore but for 3D GLTF/GLB models.
 */
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { Character3D, VisemeFaceMapping, FaceExpressionMapping } from '@/types/character3d'

interface Character3DState {
  characters: Character3D[]
  activeCharacterId: string | null
  /** When set, the next click on a 3D character's mesh places the viseme mouth plane */
  visemePlacementCharId: string | null
  /** When set, the next click places an expression overlay (eye or eyebrow) */
  expressionPlacementCharId: string | null
  expressionPlacementPart: 'eye' | 'eyebrow' | null

  // Actions
  add3DCharacter: (character: Omit<Character3D, 'id'>) => string
  remove3DCharacter: (id: string) => void
  update3DCharacter: (id: string, updates: Partial<Character3D>) => void
  select3DCharacter: (id: string | null) => void

  // Timeline time range
  set3DCharacterTimeRange: (id: string, startFrame: number, endFrame: number) => void

  // Animation control
  playAnimation: (charId: string, animId: string) => void
  stopAnimation: (charId: string) => void

  // Viseme face mapping
  setVisemeFaceMapping: (charId: string, mapping: VisemeFaceMapping | undefined) => void
  updateVisemeFaceMappingOffset: (charId: string, offset: { x: number; y: number; z: number }) => void
  startVisemePlacement: (charId: string) => void
  stopVisemePlacement: () => void

  // Face expression mapping (eye/eyebrow overlays)
  setFaceExpressionMapping: (charId: string, mapping: FaceExpressionMapping | undefined) => void
  updateExpressionOffset: (charId: string, part: 'eye' | 'eyebrow', offset: { x: number; y: number; z: number }) => void
  startExpressionPlacement: (charId: string, part: 'eye' | 'eyebrow') => void
  stopExpressionPlacement: () => void

  // Helpers
  getActiveCharacter: () => Character3D | null
  getVisibleCharacters: () => Character3D[]

  // Reset all state (for new project)
  reset: () => void
}

const CHARACTER_3D_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

let nextColorIndex = 0

function getNextColor(): string {
  const color = CHARACTER_3D_COLORS[nextColorIndex % CHARACTER_3D_COLORS.length]
  nextColorIndex++
  return color
}

export const use3DCharacterStore = create<Character3DState>()(
  immer((set, get) => ({
    characters: [],
    activeCharacterId: null,
    visemePlacementCharId: null,
    expressionPlacementCharId: null,
    expressionPlacementPart: null,

    add3DCharacter: (character) => {
      const id = `char3d_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      const colorToUse = character.color || getNextColor()
      set((state) => {
        state.characters.push({ ...character, id, color: colorToUse })
      })
      return id
    },

    remove3DCharacter: (id) =>
      set((state) => {
        state.characters = state.characters.filter((c) => c.id !== id)
        if (state.activeCharacterId === id) {
          state.activeCharacterId = null
        }
      }),

    update3DCharacter: (id, updates) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === id)
        if (character) {
          Object.assign(character, updates)
        }
      }),

    select3DCharacter: (id) =>
      set((state) => {
        state.activeCharacterId = id
      }),

    set3DCharacterTimeRange: (id, startFrame, endFrame) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === id)
        if (character) {
          character.startFrame = startFrame
          character.endFrame = endFrame
        }
      }),

    playAnimation: (charId, animId) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === charId)
        if (character) {
          character.activeAnimationId = animId
        }
      }),

    stopAnimation: (charId) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === charId)
        if (character) {
          character.activeAnimationId = null
        }
      }),

    setVisemeFaceMapping: (charId, mapping) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === charId)
        if (character) {
          character.visemeFaceMapping = mapping
        }
      }),

    updateVisemeFaceMappingOffset: (charId, offset) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === charId)
        if (character?.visemeFaceMapping) {
          character.visemeFaceMapping.offset = offset
        }
      }),

    startVisemePlacement: (charId) =>
      set((state) => {
        state.visemePlacementCharId = charId
      }),

    stopVisemePlacement: () =>
      set((state) => {
        state.visemePlacementCharId = null
      }),

    setFaceExpressionMapping: (charId, mapping) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === charId)
        if (character) {
          character.faceExpressionMapping = mapping
        }
      }),

    updateExpressionOffset: (charId, part, offset) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === charId)
        if (character?.faceExpressionMapping) {
          character.faceExpressionMapping[part].offset = offset
        }
      }),

    startExpressionPlacement: (charId, part) =>
      set((state) => {
        state.expressionPlacementCharId = charId
        state.expressionPlacementPart = part
      }),

    stopExpressionPlacement: () =>
      set((state) => {
        state.expressionPlacementCharId = null
        state.expressionPlacementPart = null
      }),

    getActiveCharacter: () => {
      const { characters, activeCharacterId } = get()
      return characters.find((c) => c.id === activeCharacterId) || null
    },

    getVisibleCharacters: () => {
      const { characters } = get()
      return characters.filter((c) => c.visible)
    },

    reset: () =>
      set((state) => {
        state.characters = []
        state.activeCharacterId = null
        state.visemePlacementCharId = null
        state.expressionPlacementCharId = null
        state.expressionPlacementPart = null
      }),
  }))
)
