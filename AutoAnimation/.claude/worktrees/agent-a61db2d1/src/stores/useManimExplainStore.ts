import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  ManimExplainState,
  ExplanationContext,
  ConceptNode,
} from '@/services/manim/types'

interface ManimExplainStoreState extends ManimExplainState {
  // Actions
  openExplain: (context: ExplanationContext, sceneIndex: number) => void
  closeExplain: () => void
  setCurrentContext: (context: ExplanationContext, sceneIndex: number) => void
  setKnowledgeGraph: (graph: ConceptNode[]) => void
  addUserMessage: (text: string) => void
  addAssistantMessage: (text: string, supplementaryVideoUrl?: string) => void
  setLoading: (loading: boolean) => void
  clearChat: () => void
}

export const useManimExplainStore = create<ManimExplainStoreState>()(
  immer((set) => ({
    // Initial state
    isExplainOpen: false,
    currentContext: null,
    currentSceneIndex: 0,
    chatHistory: [],
    isLoading: false,
    knowledgeGraph: [],

    openExplain: (context, sceneIndex) =>
      set((state) => {
        state.isExplainOpen = true
        state.currentContext = context
        state.currentSceneIndex = sceneIndex
      }),

    closeExplain: () =>
      set((state) => {
        state.isExplainOpen = false
      }),

    setCurrentContext: (context, sceneIndex) =>
      set((state) => {
        state.currentContext = context
        state.currentSceneIndex = sceneIndex
      }),

    setKnowledgeGraph: (graph) =>
      set((state) => {
        state.knowledgeGraph = graph
      }),

    addUserMessage: (text) =>
      set((state) => {
        state.chatHistory.push({
          id: crypto.randomUUID(),
          role: 'user',
          text,
          timestamp: Date.now(),
        })
      }),

    addAssistantMessage: (text, supplementaryVideoUrl) =>
      set((state) => {
        state.chatHistory.push({
          id: crypto.randomUUID(),
          role: 'assistant',
          text,
          supplementaryVideoUrl,
          timestamp: Date.now(),
        })
      }),

    setLoading: (loading) =>
      set((state) => {
        state.isLoading = loading
      }),

    clearChat: () =>
      set((state) => {
        state.chatHistory = []
      }),
  })),
)
