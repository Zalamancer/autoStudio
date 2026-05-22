/**
 * State management for character bundles.
 * Bundles are named collections of characters (any type) that can be
 * loaded together into a scene.
 *
 * Persisted to localStorage via Zustand persist middleware.
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Types ──

export interface CharacterRef {
  id: string
  type: '2d' | '3d' | '1d' | 'avatar'
}

export interface CharacterBundle {
  id: string
  name: string
  description: string
  thumbnail?: string // 1:1 vibe/mood cover
  banner?: string // 16:9 character showcase
  characters: CharacterRef[]
  createdAt: number
}

interface BundleState {
  bundles: CharacterBundle[]
  /** Currently selected bundle (for right panel details) */
  selectedBundleId: string | null
  selectBundle: (id: string | null) => void
  addBundle: (bundle: Omit<CharacterBundle, 'id' | 'createdAt'>) => string
  removeBundle: (id: string) => void
  updateBundle: (id: string, updates: Partial<CharacterBundle>) => void
  addCharacterToBundle: (bundleId: string, char: CharacterRef) => void
  removeCharacterFromBundle: (bundleId: string, charId: string) => void
}

export const useBundleStore = create<BundleState>()(
  persist(
    (set) => ({
      bundles: [],
      selectedBundleId: null,

      selectBundle: (id) => set({ selectedBundleId: id }),

      addBundle: (bundle) => {
        const id = `bundle_${Date.now()}`
        set((state) => ({
          bundles: [...state.bundles, { ...bundle, id, createdAt: Date.now() }],
        }))
        return id
      },

      removeBundle: (id) =>
        set((state) => ({
          bundles: state.bundles.filter((b) => b.id !== id),
        })),

      updateBundle: (id, updates) =>
        set((state) => ({
          bundles: state.bundles.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        })),

      addCharacterToBundle: (bundleId, char) =>
        set((state) => ({
          bundles: state.bundles.map((b) => {
            if (b.id !== bundleId) return b
            // Prevent duplicates
            if (b.characters.some((c) => c.id === char.id)) return b
            return { ...b, characters: [...b.characters, char] }
          }),
        })),

      removeCharacterFromBundle: (bundleId, charId) =>
        set((state) => ({
          bundles: state.bundles.map((b) => {
            if (b.id !== bundleId) return b
            return { ...b, characters: b.characters.filter((c) => c.id !== charId) }
          }),
        })),
    }),
    {
      name: 'character-bundles-storage',
    },
  ),
)
