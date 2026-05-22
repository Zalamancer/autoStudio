/**
 * A/B Test Store — Configuration, execution, and result tracking for A/B testing video variations.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { ABTestConfig, ABTestResult } from '@/types/abTest'
import { logger } from '@/utils/logger'

interface ABTestState {
  testConfig: ABTestConfig | null
  testResults: ABTestResult[]
  activeComparison: { variantA: number; variantB: number } | null
  isRunning: boolean

  // Actions
  configureTest: (config: ABTestConfig) => void
  startTest: () => void
  setComparison: (a: number, b: number) => void
  pickWinner: (variantIndex: number) => void
  saveTestResult: (result: ABTestResult) => void
  reset: () => void
}

export const useABTestStore = create<ABTestState>()(
  immer((set, get) => ({
    testConfig: null,
    testResults: [],
    activeComparison: null,
    isRunning: false,

    configureTest: (config: ABTestConfig) => {
      set((s) => {
        s.testConfig = config
        s.activeComparison = null
      })
    },

    startTest: () => {
      const { testConfig } = get()
      if (!testConfig) {
        logger.warn('[ABTest] Cannot start test without config')
        return
      }

      set((s) => {
        s.isRunning = true
      })

      // The actual generation is triggered via useOrchestratorStore.generateVariations
      // This store just tracks the config and results
      logger.info('[ABTest] Test started with config:', testConfig)
    },

    setComparison: (a: number, b: number) => {
      set((s) => {
        s.activeComparison = { variantA: a, variantB: b }
      })
    },

    pickWinner: (variantIndex: number) => {
      const { testConfig } = get()
      if (!testConfig) return

      // Save test result
      const result: ABTestResult = {
        id: `test-${Date.now()}`,
        timestamp: Date.now(),
        config: testConfig,
        variants: [], // Populated externally
        winnerId: variantIndex,
      }

      set((s) => {
        s.testResults.push(result)
        s.isRunning = false
        s.activeComparison = null
      })

      logger.info(`[ABTest] Winner picked: variant ${variantIndex}`)
    },

    saveTestResult: (result: ABTestResult) => {
      set((s) => {
        s.testResults.push(result)
        s.isRunning = false
      })
    },

    reset: () => {
      set((s) => {
        s.testConfig = null
        s.activeComparison = null
        s.isRunning = false
      })
    },
  })),
)
