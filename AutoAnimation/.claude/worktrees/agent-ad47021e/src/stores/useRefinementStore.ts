/**
 * Refinement Store — manages chat-based video refinement after orchestration.
 */

import { create } from 'zustand'
import type { ClipPlan } from '@/types/orchestrator'

export interface RefinementMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  /** Which plan sections were changed in this refinement */
  changedSections?: string[]
  timestamp: number
}

interface RefinementState {
  messages: RefinementMessage[]
  isRefining: boolean
  error: string | null
  /** Snapshots of the plan before each refinement for undo */
  planHistory: ClipPlan[]

  addUserMessage: (content: string) => void
  addAssistantMessage: (content: string, changedSections?: string[]) => void
  pushPlanSnapshot: (plan: ClipPlan) => void
  undoLastRefinement: () => ClipPlan | null
  setRefining: (isRefining: boolean) => void
  setError: (error: string | null) => void
  canUndo: () => boolean
  reset: () => void
}

export const useRefinementStore = create<RefinementState>((set, get) => ({
  messages: [],
  isRefining: false,
  error: null,
  planHistory: [],

  addUserMessage: (content) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `msg_${Date.now()}_u`,
          role: 'user',
          content,
          timestamp: Date.now(),
        },
      ],
    })),

  addAssistantMessage: (content, changedSections) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          id: `msg_${Date.now()}_a`,
          role: 'assistant',
          content,
          changedSections,
          timestamp: Date.now(),
        },
      ],
    })),

  pushPlanSnapshot: (plan) =>
    set((state) => ({
      planHistory: [...state.planHistory, JSON.parse(JSON.stringify(plan))],
    })),

  undoLastRefinement: () => {
    const { planHistory } = get()
    if (planHistory.length === 0) return null
    const previousPlan = planHistory[planHistory.length - 1]
    set((state) => ({
      planHistory: state.planHistory.slice(0, -1),
      messages: state.messages.slice(0, -2), // remove last user + assistant pair
    }))
    return previousPlan
  },

  setRefining: (isRefining) => set({ isRefining }),
  setError: (error) => set({ error }),
  canUndo: () => get().planHistory.length > 0,

  reset: () =>
    set({
      messages: [],
      isRefining: false,
      error: null,
      planHistory: [],
    }),
}))
