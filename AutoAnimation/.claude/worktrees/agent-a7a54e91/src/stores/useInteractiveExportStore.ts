/**
 * Interactive Export Store
 *
 * Manages state for the interactive runtime export feature:
 * scene definitions, trigger configurations, export settings.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  InteractiveScene,
  InteractiveTrigger,
  InteractiveExportConfig,
  InteractiveTriggerType,
  InteractiveAction,
} from '@/types/interactiveExport'

interface InteractiveExportState {
  /** Scenes defined for the interactive export */
  scenes: InteractiveScene[]

  /** Global triggers (not tied to a specific layer) */
  globalTriggers: InteractiveTrigger[]

  /** Export configuration */
  config: InteractiveExportConfig

  /** Whether the export panel is showing */
  panelOpen: boolean

  /** Export status */
  exportStatus: 'idle' | 'building' | 'complete' | 'error'

  /** Error message */
  error: string | null
}

interface InteractiveExportActions {
  /** Add a new scene */
  addScene: (scene: InteractiveScene) => void

  /** Remove a scene by ID */
  removeScene: (sceneId: string) => void

  /** Update a scene */
  updateScene: (sceneId: string, updates: Partial<InteractiveScene>) => void

  /** Add a trigger to a layer within a scene */
  addTriggerToLayer: (
    sceneId: string,
    layerId: string,
    triggerType: InteractiveTriggerType,
    action: InteractiveAction,
    target: string,
  ) => void

  /** Remove a trigger from a layer */
  removeTriggerFromLayer: (sceneId: string, layerId: string, triggerIndex: number) => void

  /** Add a global trigger */
  addGlobalTrigger: (trigger: InteractiveTrigger) => void

  /** Update export config */
  updateConfig: (updates: Partial<InteractiveExportConfig>) => void

  /** Set export status */
  setExportStatus: (status: 'idle' | 'building' | 'complete' | 'error') => void

  /** Toggle panel */
  togglePanel: () => void

  /** Reset store */
  reset: () => void
}

const DEFAULT_CONFIG: InteractiveExportConfig = {
  format: 'html-bundle',
  inlineAssets: true,
  includePlayer: true,
  minify: false,
  playerTheme: 'dark',
  showControls: true,
  autoplay: false,
  loop: false,
  maxBundleSize: 0,
}

export const useInteractiveExportStore = create<InteractiveExportState & InteractiveExportActions>()(
  immer((set) => ({
    // Initial state
    scenes: [],
    globalTriggers: [],
    config: DEFAULT_CONFIG,
    panelOpen: false,
    exportStatus: 'idle',
    error: null,

    addScene: (scene: InteractiveScene) => {
      set((state) => {
        state.scenes.push(scene)
      })
    },

    removeScene: (sceneId: string) => {
      set((state) => {
        state.scenes = state.scenes.filter((s) => s.id !== sceneId)
      })
    },

    updateScene: (sceneId: string, updates: Partial<InteractiveScene>) => {
      set((state) => {
        const scene = state.scenes.find((s) => s.id === sceneId)
        if (scene) {
          Object.assign(scene, updates)
        }
      })
    },

    addTriggerToLayer: (
      sceneId: string,
      layerId: string,
      triggerType: InteractiveTriggerType,
      action: InteractiveAction,
      target: string,
    ) => {
      set((state) => {
        const scene = state.scenes.find((s) => s.id === sceneId)
        if (!scene) return

        const layer = scene.layers.find((l) => l.id === layerId)
        if (!layer) return

        if (!layer.triggers) {
          layer.triggers = []
        }

        layer.triggers.push({
          type: triggerType,
          target,
          action,
        })
      })
    },

    removeTriggerFromLayer: (sceneId: string, layerId: string, triggerIndex: number) => {
      set((state) => {
        const scene = state.scenes.find((s) => s.id === sceneId)
        if (!scene) return

        const layer = scene.layers.find((l) => l.id === layerId)
        if (!layer?.triggers) return

        layer.triggers.splice(triggerIndex, 1)
      })
    },

    addGlobalTrigger: (trigger: InteractiveTrigger) => {
      set((state) => {
        state.globalTriggers.push(trigger)
      })
    },

    updateConfig: (updates: Partial<InteractiveExportConfig>) => {
      set((state) => {
        Object.assign(state.config, updates)
      })
    },

    setExportStatus: (status) => {
      set((state) => {
        state.exportStatus = status
      })
    },

    togglePanel: () => {
      set((state) => {
        state.panelOpen = !state.panelOpen
      })
    },

    reset: () => {
      set((state) => {
        state.scenes = []
        state.globalTriggers = []
        state.config = DEFAULT_CONFIG
        state.panelOpen = false
        state.exportStatus = 'idle'
        state.error = null
      })
    },
  }))
)
