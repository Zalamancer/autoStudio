/**
 * State management for pixel art characters placed on the canvas.
 * Parallel to use3DCharacterStore but for PixelLab pixel art characters.
 */
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { PixelArtCharacter, PixelArtDirection, PixelArtAnimationClip } from '@/types/pixelLab'

interface PixelArtCharacterState {
  characters: PixelArtCharacter[]
  activeCharacterId: string | null

  // Actions
  addPixelArtCharacter: (character: Omit<PixelArtCharacter, 'id'>) => string
  removePixelArtCharacter: (id: string) => void
  updatePixelArtCharacter: (id: string, updates: Partial<PixelArtCharacter>) => void
  selectPixelArtCharacter: (id: string | null) => void

  // Direction & animation control
  setDirection: (id: string, direction: PixelArtDirection) => void
  playAnimation: (id: string, animation: string) => void
  stopAnimation: (id: string) => void

  // Timeline time range
  setTimeRange: (id: string, startFrame: number, endFrame: number) => void

  // Animation clips
  addAnimationClip: (characterId: string, clip: Omit<PixelArtAnimationClip, 'id'>) => void
  removeAnimationClip: (characterId: string, clipId: string) => void
  updateAnimationClip: (characterId: string, clipId: string, updates: Partial<PixelArtAnimationClip>) => void

  // Helpers
  getActiveCharacter: () => PixelArtCharacter | null
  getVisibleCharacters: () => PixelArtCharacter[]

  // Reset all state (for new project)
  reset: () => void
}

const PIXEL_ART_COLORS = [
  '#10b981', // emerald
  '#f59e0b', // amber
  '#3b82f6', // blue
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

let nextColorIndex = 0

function getNextColor(): string {
  const color = PIXEL_ART_COLORS[nextColorIndex % PIXEL_ART_COLORS.length]
  nextColorIndex++
  return color
}

export const usePixelArtCharacterStore = create<PixelArtCharacterState>()(
  immer((set, get) => ({
    characters: [],
    activeCharacterId: null,

    addPixelArtCharacter: (character) => {
      const id = `px_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      const colorToUse = character.color || getNextColor()
      set((state) => {
        state.characters.push({ ...character, id, color: colorToUse, animationClips: character.animationClips ?? [] } as PixelArtCharacter)
      })
      return id
    },

    removePixelArtCharacter: (id) =>
      set((state) => {
        state.characters = state.characters.filter((c) => c.id !== id)
        if (state.activeCharacterId === id) {
          state.activeCharacterId = null
        }
      }),

    updatePixelArtCharacter: (id, updates) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === id)
        if (character) {
          Object.assign(character, updates)
        }
      }),

    selectPixelArtCharacter: (id) =>
      set((state) => {
        state.activeCharacterId = id
      }),

    setDirection: (id, direction) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === id)
        if (character) {
          character.direction = direction
        }
      }),

    playAnimation: (id, animation) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === id)
        if (character) {
          character.activeAnimation = animation
        }
      }),

    stopAnimation: (id) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === id)
        if (character) {
          character.activeAnimation = null
        }
      }),

    setTimeRange: (id, startFrame, endFrame) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === id)
        if (character) {
          character.startFrame = startFrame
          character.endFrame = endFrame
        }
      }),

    addAnimationClip: (characterId, clip) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === characterId)
        if (character) {
          if (!character.animationClips) character.animationClips = []
          const clipId = `aclip_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`
          character.animationClips.push({ ...clip, id: clipId })
        }
      }),

    removeAnimationClip: (characterId, clipId) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === characterId)
        if (character && character.animationClips) {
          character.animationClips = character.animationClips.filter((c) => c.id !== clipId)
        }
      }),

    updateAnimationClip: (characterId, clipId, updates) =>
      set((state) => {
        const character = state.characters.find((c) => c.id === characterId)
        if (character && character.animationClips) {
          const clip = character.animationClips.find((c) => c.id === clipId)
          if (clip) Object.assign(clip, updates)
        }
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
      }),
  }))
)
