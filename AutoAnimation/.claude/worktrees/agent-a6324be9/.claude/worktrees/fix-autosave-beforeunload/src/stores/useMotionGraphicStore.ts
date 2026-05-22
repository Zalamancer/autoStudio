import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { MotionDesignDescription } from '@/types/motionDesign'

export interface MotionGraphicInstance {
  id: string
  templateId: string
  name?: string
  config: Record<string, unknown>
  position: { x: number; y: number }
  scale: number
  opacity: number
  zIndex: number
  rotation: number
  visible: boolean
  startFrame: number
  endFrame: number
  /** For AI-generated motion designs — persists the description for project save/load */
  dynamicDescription?: MotionDesignDescription
  /** Flow transition type when this instance overlaps with the next one */
  flowTransition?: string
  /** Flow role for visual sequencing */
  flowRole?: string
  /** Color palette applied to this instance */
  palette?: {
    primary: string
    secondary: string
    accent: string
    background: string
    text: string
  }
}

interface MotionGraphicState {
  instances: MotionGraphicInstance[]
  selectedInstanceId: string | null
  addInstance: (instance: MotionGraphicInstance) => void
  removeInstance: (id: string) => void
  updateInstance: (id: string, updates: Partial<MotionGraphicInstance>) => void
  updateConfig: (id: string, key: string, value: unknown) => void
  setSelectedInstanceId: (id: string | null) => void
  clear: () => void
}

export const useMotionGraphicStore = create<MotionGraphicState>()(
  immer((set) => ({
    instances: [],
    selectedInstanceId: null,

    addInstance: (instance) =>
      set((state) => {
        state.instances.push(instance)
      }),

    removeInstance: (id) =>
      set((state) => {
        state.instances = state.instances.filter((i) => i.id !== id)
        if (state.selectedInstanceId === id) state.selectedInstanceId = null
      }),

    updateInstance: (id, updates) =>
      set((state) => {
        const inst = state.instances.find((i) => i.id === id)
        if (inst) Object.assign(inst, updates)
      }),

    updateConfig: (id, key, value) =>
      set((state) => {
        const inst = state.instances.find((i) => i.id === id)
        if (inst) inst.config[key] = value
      }),

    setSelectedInstanceId: (id) =>
      set((state) => {
        state.selectedInstanceId = id
      }),

    clear: () =>
      set((state) => {
        state.instances = []
        state.selectedInstanceId = null
      }),
  })),
)
