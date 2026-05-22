/**
 * Agent Workflow Store — Tracks multi-step workflow execution state.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  executeWorkflow,
  WORKFLOW_DEFINITIONS,
  type WorkflowId,
  type WorkflowStep,
  type WorkflowResult,
} from '@/services/agentWorkflows'
import { toast } from '@/stores/useToastStore'

interface AgentWorkflowState {
  // Current execution
  activeWorkflowId: WorkflowId | null
  steps: WorkflowStep[]
  isRunning: boolean
  summary: string | null
  error: string | null

  // History
  history: WorkflowResult[]

  // Internal — not serialized
  _abortController: AbortController | null

  // Actions
  startWorkflow: (workflowId: WorkflowId) => Promise<void>
  cancelWorkflow: () => void
  clearHistory: () => void
}

export const useAgentWorkflowStore = create<AgentWorkflowState>()(
  immer((set, get) => ({
    activeWorkflowId: null,
    steps: [],
    isRunning: false,
    summary: null,
    error: null,
    history: [],
    _abortController: null,

    startWorkflow: async (workflowId: WorkflowId) => {
      if (get().isRunning) return

      const definition = WORKFLOW_DEFINITIONS.find((w) => w.id === workflowId)
      if (!definition) return

      const abortController = new AbortController()

      set((s) => {
        s.activeWorkflowId = workflowId
        s.isRunning = true
        s.summary = null
        s.error = null
        s._abortController = abortController
        s.steps = definition.steps.map((step) => ({
          ...step,
          status: 'pending' as const,
        }))
      })

      try {
        const result = await executeWorkflow(workflowId, (stepId, update) => {
          if (abortController.signal.aborted) return
          set((s) => {
            const step = s.steps.find((st) => st.id === stepId)
            if (step) Object.assign(step, update)
          })
        })

        if (abortController.signal.aborted) return

        set((s) => {
          s.isRunning = false
          s._abortController = null
          s.summary = result.summary
          s.history.push(result)
        })

        toast.success(`Workflow complete: ${definition.name}`)
      } catch (err) {
        if (abortController.signal.aborted) return
        const errMsg = err instanceof Error ? err.message : 'Workflow failed'
        set((s) => {
          s.isRunning = false
          s._abortController = null
          s.error = errMsg
        })
        toast.error(errMsg)
      }
    },

    cancelWorkflow: () => {
      const { _abortController } = get()
      if (_abortController) _abortController.abort()
      set((s) => {
        s.isRunning = false
        s.activeWorkflowId = null
        s._abortController = null
        s.steps = []
      })
      toast.info('Workflow cancelled')
    },

    clearHistory: () =>
      set((s) => {
        s.history = []
      }),
  })),
)
