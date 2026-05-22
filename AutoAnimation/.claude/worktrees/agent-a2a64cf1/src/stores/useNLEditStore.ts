/**
 * NL Edit Store — State for natural language timeline editing.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { parseCommand, executeCommand, type ParsedCommand } from '@/services/nlEditService'
import { logger } from '@/utils/logger'

export interface NLCommand {
  id: string
  text: string
  timestamp: number
  result: 'success' | 'failed' | 'pending'
  explanation?: string
  actionCount: number
}

interface NLEditState {
  commandHistory: NLCommand[]
  pendingCommand: ParsedCommand | null
  pendingText: string
  isProcessing: boolean
  lastError: string | null

  // Actions
  submitCommand: (text: string) => Promise<void>
  applyPending: () => Promise<void>
  cancelPending: () => void
  undoLastCommand: () => void
}

export const useNLEditStore = create<NLEditState>()(
  immer((set, get) => ({
    commandHistory: [],
    pendingCommand: null,
    pendingText: '',
    isProcessing: false,
    lastError: null,

    submitCommand: async (text: string) => {
      set((s) => {
        s.isProcessing = true
        s.lastError = null
        s.pendingText = text
      })

      try {
        const parsed = await parseCommand(text)

        set((s) => {
          s.pendingCommand = parsed as ParsedCommand
          s.isProcessing = false
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to parse command'
        logger.error('[NLEdit] Parse error:', err)

        set((s) => {
          s.isProcessing = false
          s.lastError = errorMsg
          s.commandHistory.push({
            id: `cmd-${Date.now()}`,
            text,
            timestamp: Date.now(),
            result: 'failed',
            explanation: errorMsg,
            actionCount: 0,
          })
        })
      }
    },

    applyPending: async () => {
      const { pendingCommand, pendingText } = get()
      if (!pendingCommand) return

      try {
        await executeCommand(pendingCommand)

        set((s) => {
          s.commandHistory.push({
            id: `cmd-${Date.now()}`,
            text: pendingText,
            timestamp: Date.now(),
            result: 'success',
            explanation: pendingCommand.explanation,
            actionCount: pendingCommand.actions.length,
          })
          s.pendingCommand = null
          s.pendingText = ''

          // Keep only last 20 commands
          if (s.commandHistory.length > 20) {
            s.commandHistory = s.commandHistory.slice(-20)
          }
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to execute command'
        logger.error('[NLEdit] Execution error:', err)

        set((s) => {
          s.lastError = errorMsg
          s.commandHistory.push({
            id: `cmd-${Date.now()}`,
            text: pendingText,
            timestamp: Date.now(),
            result: 'failed',
            explanation: errorMsg,
            actionCount: 0,
          })
          s.pendingCommand = null
          s.pendingText = ''
        })
      }
    },

    cancelPending: () => {
      set((s) => {
        s.pendingCommand = null
        s.pendingText = ''
      })
    },

    undoLastCommand: () => {
      // Trigger undo via timeline store's temporal middleware
      logger.info('[NLEdit] Undo last command')
      // The actual undo is handled by zundo middleware on the respective stores
    },
  })),
)
