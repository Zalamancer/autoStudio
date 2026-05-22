import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { processEditCommand, type ChatMessage, type EditActionResult } from '@/services/aiEditService'
import { toast } from '@/stores/useToastStore'

interface AIEditState {
  messages: ChatMessage[]
  isProcessing: boolean
  error: string | null

  sendMessage: (userMessage: string) => Promise<void>
  clearHistory: () => void
}

export type { ChatMessage, EditActionResult }

export const useAIEditStore = create<AIEditState>()(
  immer((set, get) => ({
    messages: [],
    isProcessing: false,
    error: null,

    sendMessage: async (userMessage: string) => {
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: userMessage,
        timestamp: Date.now(),
      }

      set((state) => {
        state.messages.push(userMsg)
        state.isProcessing = true
        state.error = null
      })

      try {
        const result = await processEditCommand(userMessage, get().messages)

        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-assistant`,
          role: 'assistant',
          content: result.reply,
          timestamp: Date.now(),
          actions: result.actions,
        }

        set((state) => {
          state.messages.push(assistantMsg)
          state.isProcessing = false
        })

        // Show toast for successful actions
        const successCount = result.actions.filter((a) => a.success).length
        if (successCount > 0) {
          toast.success(`Applied ${successCount} edit${successCount > 1 ? 's' : ''}`)
        }
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : 'Failed to process command'
        set((state) => {
          state.error = errMsg
          state.isProcessing = false
          state.messages.push({
            id: `msg-${Date.now()}-error`,
            role: 'assistant',
            content: `Sorry, I encountered an error: ${errMsg}`,
            timestamp: Date.now(),
          })
        })
      }
    },

    clearHistory: () =>
      set((state) => {
        state.messages = []
        state.error = null
      }),
  })),
)
