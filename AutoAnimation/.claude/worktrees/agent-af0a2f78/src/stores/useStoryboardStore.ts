import { create } from 'zustand'
import type {
  Storyboard,
  StoryboardSceneEntry,
  CameraAngle,
} from '@/types/storyboard'
import { generateStoryboardFromScript } from '@/services/storyboardGenerator'

interface StoryboardState {
  /** The current storyboard (null if none generated) */
  storyboard: Storyboard | null

  /** Whether storyboard generation is in progress */
  isGenerating: boolean

  /** Error message from last generation attempt */
  error: string | null

  /** History of previously generated storyboards */
  history: Storyboard[]

  // ── Actions ──

  /** Generate a new storyboard from script text */
  generateFromScript: (
    scriptText: string,
    options?: {
      targetDurationSeconds?: number
      aspectRatio?: string
      characterNames?: string[]
      style?: string
    },
  ) => Promise<void>

  /** Set a storyboard directly (e.g. from history) */
  setStoryboard: (storyboard: Storyboard | null) => void

  /** Update a specific scene */
  updateScene: (sceneId: string, updates: Partial<StoryboardSceneEntry>) => void

  /** Reorder scenes by moving a scene from one index to another */
  reorderScenes: (fromIndex: number, toIndex: number) => void

  /** Delete a scene by ID */
  deleteScene: (sceneId: string) => void

  /** Add a new blank scene at a given position */
  addScene: (afterIndex: number) => void

  /** Mark a scene as applied to timeline */
  markSceneApplied: (sceneId: string) => void

  /** Mark all scenes as applied to timeline */
  markAllScenesApplied: () => void

  /** Clear the current storyboard */
  clear: () => void

  /** Load a storyboard from history */
  loadFromHistory: (storyboardId: string) => void

  /** Delete a storyboard from history */
  deleteFromHistory: (storyboardId: string) => void
}

export const useStoryboardStore = create<StoryboardState>((set, get) => ({
  storyboard: null,
  isGenerating: false,
  error: null,
  history: [],

  generateFromScript: async (scriptText, options) => {
    if (get().isGenerating) return
    if (!scriptText.trim()) {
      set({ error: 'Script text is empty' })
      return
    }

    set({ isGenerating: true, error: null })

    try {
      const storyboard = await generateStoryboardFromScript(scriptText, options)

      set((state) => ({
        storyboard,
        isGenerating: false,
        error: null,
        // Add to history (keep last 10)
        history: [storyboard, ...state.history].slice(0, 10),
      }))
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to generate storyboard'
      console.error('[StoryboardStore] Generation failed:', err)
      set({ isGenerating: false, error: message })
    }
  },

  setStoryboard: (storyboard) => set({ storyboard, error: null }),

  updateScene: (sceneId, updates) =>
    set((state) => {
      if (!state.storyboard) return state
      const scenes = state.storyboard.scenes.map((scene) =>
        scene.id === sceneId ? { ...scene, ...updates } : scene,
      )
      const totalDurationSeconds = scenes.reduce(
        (sum, s) => sum + s.durationSeconds,
        0,
      )
      return {
        storyboard: { ...state.storyboard, scenes, totalDurationSeconds },
      }
    }),

  reorderScenes: (fromIndex, toIndex) =>
    set((state) => {
      if (!state.storyboard) return state
      const scenes = [...state.storyboard.scenes]
      const [moved] = scenes.splice(fromIndex, 1)
      scenes.splice(toIndex, 0, moved)
      // Renumber scenes
      const renumbered = scenes.map((s, i) => ({
        ...s,
        sceneNumber: i + 1,
      }))
      return {
        storyboard: { ...state.storyboard, scenes: renumbered },
      }
    }),

  deleteScene: (sceneId) =>
    set((state) => {
      if (!state.storyboard) return state
      const scenes = state.storyboard.scenes
        .filter((s) => s.id !== sceneId)
        .map((s, i) => ({ ...s, sceneNumber: i + 1 }))
      const totalDurationSeconds = scenes.reduce(
        (sum, s) => sum + s.durationSeconds,
        0,
      )
      return {
        storyboard: { ...state.storyboard, scenes, totalDurationSeconds },
      }
    }),

  addScene: (afterIndex) =>
    set((state) => {
      if (!state.storyboard) return state
      const newScene: StoryboardSceneEntry = {
        id: crypto.randomUUID(),
        sceneNumber: afterIndex + 2,
        title: 'New Scene',
        description: '',
        cameraAngle: 'medium-shot' as CameraAngle,
        characters: [],
        emotion: 'neutral',
        durationSeconds: 3,
        visualNotes: '',
        backgroundDescription: '',
        appliedToTimeline: false,
      }
      const scenes = [...state.storyboard.scenes]
      scenes.splice(afterIndex + 1, 0, newScene)
      // Renumber
      const renumbered = scenes.map((s, i) => ({
        ...s,
        sceneNumber: i + 1,
      }))
      const totalDurationSeconds = renumbered.reduce(
        (sum, s) => sum + s.durationSeconds,
        0,
      )
      return {
        storyboard: {
          ...state.storyboard,
          scenes: renumbered,
          totalDurationSeconds,
        },
      }
    }),

  markSceneApplied: (sceneId) =>
    set((state) => {
      if (!state.storyboard) return state
      const scenes = state.storyboard.scenes.map((s) =>
        s.id === sceneId ? { ...s, appliedToTimeline: true } : s,
      )
      return { storyboard: { ...state.storyboard, scenes } }
    }),

  markAllScenesApplied: () =>
    set((state) => {
      if (!state.storyboard) return state
      const scenes = state.storyboard.scenes.map((s) => ({
        ...s,
        appliedToTimeline: true,
      }))
      return { storyboard: { ...state.storyboard, scenes } }
    }),

  clear: () => set({ storyboard: null, error: null }),

  loadFromHistory: (storyboardId) => {
    const found = get().history.find((s) => s.id === storyboardId)
    if (found) {
      set({ storyboard: { ...found }, error: null })
    }
  },

  deleteFromHistory: (storyboardId) =>
    set((state) => ({
      history: state.history.filter((s) => s.id !== storyboardId),
    })),
}))
