/**
 * Quality Assurance Store
 *
 * Zustand store for managing QA state:
 * - Current QA report
 * - Pre-publish checklist
 * - Quality gate configuration
 * - Scoring history
 * - Auto-fix iteration loop
 * - A/B variant generation
 */

import { create } from 'zustand'
import type {
  QAReport,
  QualityGateConfig,
  QualityGateResult,
  PrePublishChecklist,
  GeneratedVariant,
  VariantConfig,
  AppliedFix,
} from '@/types/qualityAssurance'
import {
  generateQAReport,
  evaluateQualityGate,
  extractQAInputFromStores,
  DEFAULT_QUALITY_GATE_CONFIG,
} from '@/services/qualityAssurance/qualityGate'
import { generatePrePublishChecklist } from '@/services/qualityAssurance/prePublishChecklist'
import { autoFixAndRecheck, type AutoFixResult } from '@/services/qualityAssurance/autoFix'
import { generateVariants, applyVariant } from '@/services/qualityAssurance/variantGenerator'

interface QualityAssuranceState {
  // Current report
  report: QAReport | null
  isScoring: boolean
  lastScoredAt: number | null

  // Pre-publish checklist
  checklist: PrePublishChecklist | null

  // Quality gate
  gateConfig: QualityGateConfig
  gateResult: QualityGateResult | null

  // Auto-fix
  isAutoFixing: boolean
  autoFixResult: AutoFixResult | null
  appliedFixes: AppliedFix[]

  // A/B Variants
  isGeneratingVariants: boolean
  variants: GeneratedVariant[]
  selectedVariantIndex: number | null

  // History (last 5 reports for tracking improvement)
  reportHistory: { timestamp: number; score: number; grade: string }[]

  // Actions
  runQACheck: (platform?: string) => void
  runQualityGate: (platform?: string) => QualityGateResult
  runAutoFixLoop: (platform?: string) => AutoFixResult
  generateABVariants: (config?: Partial<VariantConfig>) => GeneratedVariant[]
  selectVariant: (index: number) => boolean
  updateGateConfig: (config: Partial<QualityGateConfig>) => void
  generateChecklist: () => PrePublishChecklist
  clearReport: () => void
}

export const useQualityAssuranceStore = create<QualityAssuranceState>((set, get) => ({
  report: null,
  isScoring: false,
  lastScoredAt: null,
  checklist: null,
  gateConfig: { ...DEFAULT_QUALITY_GATE_CONFIG },
  gateResult: null,
  isAutoFixing: false,
  autoFixResult: null,
  appliedFixes: [],
  isGeneratingVariants: false,
  variants: [],
  selectedVariantIndex: null,
  reportHistory: [],

  runQACheck: (platform?: string) => {
    set({ isScoring: true })

    try {
      const input = extractQAInputFromStores()
      if (platform) input.platform = platform

      const report = generateQAReport(input, get().gateConfig.minimumScore)

      // Update history (keep last 5)
      const history = [
        ...get().reportHistory,
        { timestamp: report.timestamp, score: report.overallScore, grade: report.grade },
      ].slice(-5)

      set({
        report,
        isScoring: false,
        lastScoredAt: Date.now(),
        reportHistory: history,
      })
    } catch (err) {
      console.error('[QA] Scoring failed:', err)
      set({ isScoring: false })
    }
  },

  runQualityGate: (platform?: string) => {
    set({ isScoring: true })

    try {
      const input = extractQAInputFromStores()
      if (platform) input.platform = platform

      const result = evaluateQualityGate(input, get().gateConfig)

      set({
        gateResult: result,
        report: result.report,
        isScoring: false,
        lastScoredAt: Date.now(),
      })

      return result
    } catch (err) {
      console.error('[QA] Quality gate failed:', err)
      set({ isScoring: false })
      return {
        passed: false,
        report: get().report!,
        iterationsPerformed: 0,
        appliedFixes: [],
        remainingIssues: [],
      }
    }
  },

  runAutoFixLoop: (platform?: string) => {
    set({ isAutoFixing: true })

    try {
      // First, run a fresh QA check to get current state
      const input = extractQAInputFromStores()
      if (platform) input.platform = platform
      const currentReport = generateQAReport(input, get().gateConfig.minimumScore)

      // Run the auto-fix loop
      const result = autoFixAndRecheck(currentReport, get().gateConfig)

      // Update history with final score
      const history = [
        ...get().reportHistory,
        { timestamp: Date.now(), score: result.finalReport.overallScore, grade: result.finalReport.grade },
      ].slice(-5)

      set({
        autoFixResult: result,
        report: result.finalReport,
        appliedFixes: [...get().appliedFixes, ...result.appliedFixes],
        isAutoFixing: false,
        lastScoredAt: Date.now(),
        reportHistory: history,
      })

      return result
    } catch (err) {
      console.error('[QA] Auto-fix loop failed:', err)
      set({ isAutoFixing: false })
      return {
        finalReport: get().report!,
        passed: false,
        iterations: 0,
        appliedFixes: [],
        scoreProgression: [],
        remainingIssues: [],
      }
    }
  },

  generateABVariants: (config?: Partial<VariantConfig>) => {
    set({ isGeneratingVariants: true })

    try {
      const variants = generateVariants(config)
      set({
        variants,
        isGeneratingVariants: false,
        selectedVariantIndex: null,
      })
      return variants
    } catch (err) {
      console.error('[QA] Variant generation failed:', err)
      set({ isGeneratingVariants: false })
      return []
    }
  },

  selectVariant: (index: number) => {
    const { variants } = get()
    const success = applyVariant(index, variants)
    if (success) {
      set({ selectedVariantIndex: index })

      // Re-run QA check after applying variant
      const input = extractQAInputFromStores()
      const report = generateQAReport(input, get().gateConfig.minimumScore)
      set({ report, lastScoredAt: Date.now() })
    }
    return success
  },

  updateGateConfig: (config: Partial<QualityGateConfig>) => {
    set({ gateConfig: { ...get().gateConfig, ...config } })
  },

  generateChecklist: () => {
    const input = extractQAInputFromStores()
    const report = get().report

    // Lazy import stores
    const { useMultiCharacterStore } = require('@/stores/useMultiCharacterStore')
    const { useVoiceStore } = require('@/stores/useVoiceStore')
    const { useTextOverlayStore } = require('@/stores/useTextOverlayStore')
    const { useOrchestratorStore } = require('@/stores/useOrchestratorStore')

    const dialogue = useMultiCharacterStore.getState()
    const voice = useVoiceStore.getState()
    const text = useTextOverlayStore.getState()
    const orchestrator = useOrchestratorStore.getState()

    const checklist = generatePrePublishChecklist({
      hasDialogue: dialogue.dialogueLines.length > 0,
      dialogueLineCount: dialogue.dialogueLines.length,
      hasCaptions: voice.captionStyle !== 'none',
      captionStyle: voice.captionStyle,
      hasBackground: input.content.actual.hasBackground,
      characterCount: dialogue.characters.length,
      hasVoiceAudio: (voice.generatedVoices || []).length > 0,
      hasMusic: input.content.actual.hasMusic,
      aspectRatio: input.visual.aspectRatio,
      durationSeconds: input.audio.durationSeconds,
      canvasWidth: input.visual.canvasWidth,
      canvasHeight: input.visual.canvasHeight,
      textOverlayCount: (text.overlays || []).length,
      hasCTA: (text.overlays || []).some((o: { presetType?: string }) => o.presetType === 'cta'),
      overallQAScore: report?.overallScore ?? 0,
      targetPlatform: orchestrator.settings?.targetPlatform,
      hasBrandContext: !!orchestrator.settings?.brandContext,
    })

    set({ checklist })
    return checklist
  },

  clearReport: () => {
    set({
      report: null,
      gateResult: null,
      checklist: null,
      autoFixResult: null,
      variants: [],
      selectedVariantIndex: null,
    })
  },
}))
