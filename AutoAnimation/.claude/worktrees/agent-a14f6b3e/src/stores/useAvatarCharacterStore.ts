/**
 * State management for avatar characters placed on the canvas.
 * Parallel to usePixelArtCharacterStore but for avatar characters.
 * Avatar characters use AI image-to-video generation for lip-synced video output.
 *
 * Persists to localStorage so state survives page refreshes.
 */
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import type { AvatarCharacter } from '@/types/avatar'

interface AvatarCharacterState {
  characters: AvatarCharacter[]
  activeCharacterId: string | null

  // Actions
  addAvatarCharacter: (character: Omit<AvatarCharacter, 'id'>) => string
  removeAvatarCharacter: (id: string) => void
  updateAvatarCharacter: (id: string, updates: Partial<AvatarCharacter>) => void
  selectAvatarCharacter: (id: string | null) => void

  // Timeline time range
  setTimeRange: (id: string, startFrame: number, endFrame: number) => void

  // Helpers
  getActiveCharacter: () => AvatarCharacter | null
  getVisibleCharacters: () => AvatarCharacter[]

  // Load from project
  loadFromProject: (characters: AvatarCharacter[]) => void

  // Reset all state (for new project)
  reset: () => void
}

const AVATAR_COLORS = [
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
]

let nextColorIndex = 0

function getNextColor(): string {
  const color = AVATAR_COLORS[nextColorIndex % AVATAR_COLORS.length]
  nextColorIndex++
  return color
}

export const useAvatarCharacterStore = create<AvatarCharacterState>()(
  persist(
    immer((set, get) => ({
      characters: [],
      activeCharacterId: null,

      addAvatarCharacter: (character) => {
        const id = `av_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
        const colorToUse = character.color || getNextColor()
        set((state) => {
          state.characters.push({ ...character, id, color: colorToUse } as AvatarCharacter)
        })
        return id
      },

      removeAvatarCharacter: (id) =>
        set((state) => {
          state.characters = state.characters.filter((c) => c.id !== id)
          if (state.activeCharacterId === id) {
            state.activeCharacterId = null
          }
        }),

      updateAvatarCharacter: (id, updates) =>
        set((state) => {
          const character = state.characters.find((c) => c.id === id)
          if (character) {
            Object.assign(character, updates)
          }
        }),

      selectAvatarCharacter: (id) =>
        set((state) => {
          state.activeCharacterId = id
        }),

      setTimeRange: (id, startFrame, endFrame) =>
        set((state) => {
          const character = state.characters.find((c) => c.id === id)
          if (character) {
            character.startFrame = startFrame
            character.endFrame = endFrame
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

      loadFromProject: (characters) =>
        set((state) => {
          state.characters = characters
          state.activeCharacterId = null
        }),

      reset: () =>
        set((state) => {
          state.characters = []
          state.activeCharacterId = null
        }),
    })),
    {
      name: 'proanimate:avatar-characters',
      partialize: (state) => ({
        characters: state.characters,
      }),
    },
  )
)
