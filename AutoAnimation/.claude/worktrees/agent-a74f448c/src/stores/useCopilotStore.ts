import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  CopilotChatMessage,
  CopilotPhase,
  CopilotMessageAction,
  CopilotAction,
} from '@/types/copilot'
import { callCopilot } from '@/services/copilot/copilotService'
import { executeAction } from '@/services/copilot/actionExecutor'
import { getActionSafety } from '@/services/copilot/actions'
import { useEditorStore } from '@/stores/useEditorStore'

interface CopilotState {
  isOpen: boolean
  phase: CopilotPhase
  messages: CopilotChatMessage[]
  error: string | null
}

interface CopilotActions {
  toggle: () => void
  open: () => void
  close: () => void
  sendMessage: (text: string) => Promise<void>
  confirmAction: (messageId: string, actionIndex: number) => Promise<void>
  confirmAllPending: (messageId: string) => Promise<void>
  rejectAction: (messageId: string, actionIndex: number) => void
  clearHistory: () => void
}

export const useCopilotStore = create<CopilotState & CopilotActions>()(
  immer((set, get) => ({
    isOpen: false,
    phase: 'idle',
    messages: [],
    error: null,

    toggle: () => {
      set((s) => { s.isOpen = !s.isOpen })
    },

    open: () => {
      set((s) => { s.isOpen = true })
    },

    close: () => {
      set((s) => { s.isOpen = false })
    },

    sendMessage: async (text: string) => {
      const userMessage: CopilotChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      }

      set((s) => {
        s.messages.push(userMessage)
        s.phase = 'thinking'
        s.error = null
      })

      try {
        const history = get().messages
        const response = await callCopilot(text, history)

        // Map actions with safety levels
        const messageActions: CopilotMessageAction[] = response.actions.map((action) => {
          const safety = getActionSafety(action.type)
          return {
            action,
            safety,
            description: buildActionDescription(action),
            status: safety === 'auto' ? 'pending' : 'pending',
          }
        })

        const assistantMessage: CopilotChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.message,
          timestamp: Date.now(),
          actions: messageActions.length > 0 ? messageActions : undefined,
        }

        set((s) => {
          s.messages.push(assistantMessage)
          s.phase = messageActions.some((a) => a.safety !== 'auto') ? 'confirming' : 'executing'
        })

        // Auto-execute safe actions
        const autoActions = messageActions.filter((a) => a.safety === 'auto')
        for (const ma of autoActions) {
          try {
            await executeAction(ma.action)
            set((s) => {
              const msg = s.messages.find((m) => m.id === assistantMessage.id)
              const act = msg?.actions?.find((a) => a.action.type === ma.action.type && a.description === ma.description)
              if (act) act.status = 'executed'
            })
          } catch (err) {
            set((s) => {
              const msg = s.messages.find((m) => m.id === assistantMessage.id)
              const act = msg?.actions?.find((a) => a.action.type === ma.action.type && a.description === ma.description)
              if (act) {
                act.status = 'error'
                act.error = err instanceof Error ? err.message : 'Unknown error'
              }
            })
          }
        }

        // Update phase
        set((s) => {
          const lastMsg = s.messages[s.messages.length - 1]
          const hasPending = lastMsg?.actions?.some((a) => a.status === 'pending' && a.safety !== 'auto')
          s.phase = hasPending ? 'confirming' : 'idle'
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get AI response'
        set((s) => {
          s.phase = 'idle'
          s.error = errorMsg
          s.messages.push({
            id: crypto.randomUUID(),
            role: 'system',
            content: `Error: ${errorMsg}`,
            timestamp: Date.now(),
          })
        })
      }
    },

    confirmAction: async (messageId: string, actionIndex: number) => {
      const state = get()
      const msg = state.messages.find((m) => m.id === messageId)
      const action = msg?.actions?.[actionIndex]
      if (!action || action.status !== 'pending') return

      set((s) => {
        const m = s.messages.find((m) => m.id === messageId)
        if (m?.actions?.[actionIndex]) {
          m.actions[actionIndex].status = 'confirmed'
        }
        s.phase = 'executing'
      })

      try {
        await executeAction(action.action)
        set((s) => {
          const m = s.messages.find((m) => m.id === messageId)
          if (m?.actions?.[actionIndex]) {
            m.actions[actionIndex].status = 'executed'
          }
        })
      } catch (err) {
        set((s) => {
          const m = s.messages.find((m) => m.id === messageId)
          if (m?.actions?.[actionIndex]) {
            m.actions[actionIndex].status = 'error'
            m.actions[actionIndex].error = err instanceof Error ? err.message : 'Unknown error'
          }
        })
      }

      // Check if we're done
      set((s) => {
        const m = s.messages.find((m) => m.id === messageId)
        const hasPending = m?.actions?.some((a) => a.status === 'pending')
        s.phase = hasPending ? 'confirming' : 'idle'
      })
    },

    confirmAllPending: async (messageId: string) => {
      const state = get()
      const msg = state.messages.find((m) => m.id === messageId)
      if (!msg?.actions) return

      const pendingIndices = msg.actions
        .map((a, i) => (a.status === 'pending' ? i : -1))
        .filter((i) => i !== -1)

      for (const index of pendingIndices) {
        await get().confirmAction(messageId, index)
      }
    },

    rejectAction: (messageId: string, actionIndex: number) => {
      set((s) => {
        const m = s.messages.find((m) => m.id === messageId)
        if (m?.actions?.[actionIndex]) {
          m.actions[actionIndex].status = 'rejected'
        }
        // Check if we're done
        const hasPending = m?.actions?.some((a) => a.status === 'pending')
        s.phase = hasPending ? 'confirming' : 'idle'
      })
    },

    clearHistory: () => {
      set((s) => {
        s.messages = []
        s.phase = 'idle'
        s.error = null
      })
    },
  }))
)

// Auto-close copilot when user selects a canvas object (rightPanelTab changes)
let _lastRightPanelTab = useEditorStore.getState().rightPanelTab
useEditorStore.subscribe((state) => {
  if (state.rightPanelTab !== _lastRightPanelTab) {
    _lastRightPanelTab = state.rightPanelTab
    if (useCopilotStore.getState().isOpen) {
      useCopilotStore.getState().close()
    }
  }
})

function buildActionDescription(action: CopilotAction): string {
  const p = action.params
  switch (action.type) {
    case 'add-text': return `Add text: "${p.content || 'New Text'}"`
    case 'update-text': return `Update text ${(p.id as string)?.slice(0, 8)}`
    case 'remove-text': return `Remove text ${(p.id as string)?.slice(0, 8)}`
    case 'add-shape': return `Add ${p.shapeType || 'rectangle'} shape`
    case 'update-shape': return `Update shape ${(p.id as string)?.slice(0, 8)}`
    case 'remove-shape': return `Remove shape ${(p.id as string)?.slice(0, 8)}`
    case 'update-character-part': {
      const vis = p.visible === false ? 'Hide' : p.visible === true ? 'Show' : 'Update'
      return `${vis} character ${p.part || 'part'}`
    }
    case 'add-character': return `Add character: "${p.name || 'New Character'}"`
    case 'update-character': return `Update character ${(p.id as string)?.slice(0, 8)}`
    case 'remove-character': return `Remove character ${(p.id as string)?.slice(0, 8)}`
    case 'add-dialogue': return `Add dialogue line`
    case 'update-dialogue': return `Update dialogue`
    case 'remove-dialogue': return `Remove dialogue line`
    case 'set-aspect-ratio': return `Set aspect ratio to ${p.ratio}`
    case 'set-fps': return `Set FPS to ${p.fps}`
    case 'set-duration': return `Set duration to ${p.totalFrames} frames`
    case 'navigate-panel': return `Open ${p.tab} panel`
    case 'set-schema-variable': return `Set ${p.key} = ${JSON.stringify(p.value)}`
    case 'set-schema-variable-batch': return `Update ${Object.keys(p.updates as object || {}).length} variables`
    case 'generate-voice': return `Generate voice for dialogue line`
    case 'generate-all-voices': return 'Generate all missing voices'
    case 'generate-svg': return `Generate SVG: "${p.prompt || 'illustration'}"`
    case 'search-stock-image': return `Search stock image: "${p.query || ''}"`
    case 'search-stock-video': return `Search stock video: "${p.query || ''}"`
    case 'update-media': return `Update media ${(p.id as string)?.slice(0, 8)}`
    case 'remove-media': return `Remove media from canvas`
    case 'add-lottie-animation': return `Add Lottie animation${p.name ? `: "${p.name}"` : ''}`
    case 'remove-lottie-animation': return `Remove Lottie animation`
    case 'remove-svg-object': return `Remove SVG object`
    case 'update-svg-object': return `Update SVG object`
    case 'generate-ai-video': return `Generate AI video: "${p.prompt || ''}"`
    case 'remove-video': return `Remove video layer`
    case 'add-template': return `Add template: ${p.templateId || ''}`
    case 'undo': return 'Undo'
    case 'redo': return 'Redo'
    default: return action.type
  }
}
