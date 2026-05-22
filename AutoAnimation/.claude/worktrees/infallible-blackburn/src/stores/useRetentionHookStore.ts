/**
 * Retention Hook Store — manages visual engagement widgets on the canvas.
 *
 * Supports 5 hook types: progress-bar, countdown, chapter-marker,
 * wait-for-it, step-counter. Each has 4 style variants.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  RetentionHookType,
  RetentionHookStyle,
  RetentionHookPosition,
} from '@/types/orchestrator'

export interface RetentionHook {
  id: string
  type: RetentionHookType
  style: RetentionHookStyle
  position: RetentionHookPosition
  color: string
  /** For countdown: starting seconds */
  countdownFrom?: number
  /** For chapter-marker: labels for each chapter */
  chapters?: string[]
  /** For wait-for-it: timestamp 0-1 when text appears */
  triggerPercent?: number
  /** For wait-for-it: custom text */
  text?: string
  /** For step-counter: total steps */
  totalSteps?: number
}

interface RetentionHookState {
  hooks: RetentionHook[]

  addHook: (hook: RetentionHook) => void
  removeHook: (id: string) => void
  updateHook: (id: string, updates: Partial<RetentionHook>) => void
  setHooks: (hooks: RetentionHook[]) => void
  clearHooks: () => void
  reset: () => void
}

export const useRetentionHookStore = create<RetentionHookState>()(
  immer((set) => ({
    hooks: [],

    addHook: (hook) =>
      set((state) => {
        state.hooks.push(hook)
      }),

    removeHook: (id) =>
      set((state) => {
        state.hooks = state.hooks.filter((h) => h.id !== id)
      }),

    updateHook: (id, updates) =>
      set((state) => {
        const idx = state.hooks.findIndex((h) => h.id === id)
        if (idx >= 0) Object.assign(state.hooks[idx], updates)
      }),

    setHooks: (hooks) =>
      set((state) => {
        state.hooks = hooks
      }),

    clearHooks: () =>
      set((state) => {
        state.hooks = []
      }),

    reset: () =>
      set((state) => {
        state.hooks = []
      }),
  })),
)
