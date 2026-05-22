import { create } from 'zustand'
import type {
  ClipPlan,
  OrchestratorStep,
  OrchestratorPhase,
  OrchestrationCost,
  CostEntry,
  OrchestratorSettings,
  OrchestratorAspectRatio,
  OrchestratorReferenceMedia,
  StepType,
  ExecutedVariant,
  ViralScore,
  VariationConfig,
  VariantComparison,
} from '@/types/orchestrator'
import {
  generateClipPlan,
  buildStepsFromPlan,
  createExecutionContext,
  getStepExecutor,
  type ExecutionContext,
} from '@/services/orchestrator'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useSaved3DCharactersStore } from '@/stores/useSaved3DCharactersStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { use3DCharacterStore } from '@/stores/use3DCharacterStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useLearningStore } from '@/stores/useLearningStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { CREDIT_COSTS } from '@/types/credits'
import { useMarketplaceUsageStore } from '@/stores/useMarketplaceUsageStore'

// Gemini 2.0 Flash pricing (USD per 1M tokens)
const GEMINI_FLASH_INPUT_PRICE = 0.10  // $0.10 per 1M input tokens
const GEMINI_FLASH_OUTPUT_PRICE = 0.40 // $0.40 per 1M output tokens

// Steps that should NOT abort execution when they fail
const NON_FATAL_STEPS: Set<StepType> = new Set(['generate-music', 'setup-stock-media', 'setup-sound-effects'])

interface OrchestratorState {
  prompt: string
  phase: OrchestratorPhase
  plan: ClipPlan | null
  steps: OrchestratorStep[]
  currentStepIndex: number
  error: string | null
  isRunning: boolean

  /** Execution context shared across steps (character IDs, voice data, etc.) */
  _ctx: ExecutionContext | null

  // Cumulative cost tracking across all API calls
  cost: OrchestrationCost

  // Pre-orchestration settings
  settings: OrchestratorSettings

  // Save state
  isSaving: boolean
  saveError: string | null
  savedProjectId: string | null

  // Royalty distribution result
  royaltyResult: { royalty_pool: number; creator_count: number } | null

  // A/B variant state
  variations: ClipPlan[]
  executedVariants: ExecutedVariant[]
  isGeneratingVariations: boolean
  selectedVariantIndex: number

  // Actions
  setPrompt: (prompt: string) => void
  updateSettings: (updates: Partial<OrchestratorSettings>) => void
  toggleCharacterSelection: (savedCharacterId: string) => void
  toggleLibraryItem: (field: keyof OrchestratorSettings, itemId: string) => void
  initSettingsFromCanvas: () => void
  generatePlan: () => Promise<void>
  executePlan: () => Promise<void>
  retryFromStep: (index: number) => Promise<void>
  skipStep: (index: number) => void
  addCostEntry: (entry: CostEntry) => void
  addReferenceImage: (dataUrl: string, mimeType: string, role: string) => void
  removeReferenceMedia: (id: string) => void
  setReferenceRole: (id: string, role: string) => void
  saveClip: () => Promise<void>
  generateVariations: () => Promise<void>
  executeAllVariants: () => Promise<void>
  selectVariant: (index: number) => void
  applyVariant: (index: number) => void
  reset: () => void
}

const EMPTY_COST: OrchestrationCost = { entries: [], totalCost: 0, totalCredits: 0 }

const DEFAULT_SETTINGS: OrchestratorSettings = {
  aspectRatio: '16:9',
  durationSeconds: 0,
  fps: 0,
  useGoogleSearch: false,
  generateMusic: true,
  generateSVGAnimations: true,
  generateSVGAssets: true,
  useStockMedia: true,
  useSoundEffects: true,
  selectedCharacterIds: [],
  selected3DCharacterIds: [],
  includeCanvasItems: true,
  selectedHTMLTemplateIds: [],
  selectedCaptionIds: [],
  selectedCollageIds: [],
  selectedAIAnimationIds: [],
  selectedAnimationIds: [],
  selectedAudioIds: [],
  useSmartDefaults: true,
  beatSync: {
    enabled: true,
    intensity: 0.5,
    subdivision: 1,
    syncMediaTransitions: true,
    syncTextOverlays: true,
    syncShapeEffects: true,
    syncCameraZoom: true,
  },
}

/** Derive orchestrator aspect ratio from the editor's current aspect ratio setting */
function getAspectRatioFromCanvas(): OrchestratorAspectRatio {
  const editorRatio = useEditorStore.getState().aspectRatio
  // All 5 aspect ratios are supported
  const supported: OrchestratorAspectRatio[] = ['16:9', '9:16', '1:1', '4:3', '21:9']
  if (supported.includes(editorRatio as OrchestratorAspectRatio)) {
    return editorRatio as OrchestratorAspectRatio
  }
  return '16:9'
}

export const useOrchestratorStore = create<OrchestratorState>((set, get) => ({
  prompt: '',
  phase: 'idle',
  plan: null,
  steps: [],
  currentStepIndex: -1,
  error: null,
  isRunning: false,
  _ctx: null,
  cost: { ...EMPTY_COST },

  settings: { ...DEFAULT_SETTINGS },

  isSaving: false,
  saveError: null,
  savedProjectId: null,
  royaltyResult: null,

  variations: [],
  executedVariants: [],
  isGeneratingVariations: false,
  selectedVariantIndex: 0,

  setPrompt: (prompt) => set({ prompt }),

  updateSettings: (updates) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),

  toggleCharacterSelection: (savedCharacterId) =>
    set((state) => {
      const ids = state.settings.selectedCharacterIds
      const isSelected = ids.includes(savedCharacterId)
      return {
        settings: {
          ...state.settings,
          selectedCharacterIds: isSelected
            ? ids.filter((id) => id !== savedCharacterId)
            : [...ids, savedCharacterId],
        },
      }
    }),

  toggleLibraryItem: (field, itemId) =>
    set((state) => {
      const current = state.settings[field]
      if (!Array.isArray(current)) return state
      const ids = current as string[]
      const isSelected = ids.includes(itemId)
      return {
        settings: {
          ...state.settings,
          [field]: isSelected
            ? ids.filter((id) => id !== itemId)
            : [...ids, itemId],
        },
      }
    }),

  initSettingsFromCanvas: () => {
    const aspectRatio = getAspectRatioFromCanvas()

    // Pre-select 2D characters that are already on canvas
    const canvasCharacters = useMultiCharacterStore.getState().characters
    const canvasCharIds = canvasCharacters
      .map((c) => c.savedCharacterId)
      .filter((id): id is string => id !== null)
    const uniqueIds = [...new Set(canvasCharIds)]

    // Pre-select 3D characters that are already on canvas
    const canvas3DCharacters = use3DCharacterStore.getState().characters
    const canvas3DCharIds = canvas3DCharacters
      .map((c) => c.saved3DCharacterId)
      .filter((id): id is string => id !== null)
    const unique3DIds = [...new Set(canvas3DCharIds)]

    set((state) => ({
      settings: {
        ...state.settings,
        aspectRatio,
        selectedCharacterIds: uniqueIds,
        selected3DCharacterIds: unique3DIds,
      },
    }))
  },

  addCostEntry: (entry: CostEntry) => {
    set((state) => {
      const entries = [...state.cost.entries, entry]
      const totalCost = entries.reduce((sum, e) => sum + e.cost, 0)
      const totalCredits = entries.reduce((sum, e) => sum + (e.refunded ? 0 : (e.credits || 0)), 0)
      return { cost: { entries, totalCost, totalCredits } }
    })
  },

  addReferenceImage: (dataUrl: string, mimeType: string, role: string) =>
    set((state) => {
      const newMedia: OrchestratorReferenceMedia = {
        id: crypto.randomUUID(),
        url: dataUrl,
        dataUrl,
        mimeType,
        role: role as OrchestratorReferenceMedia['role'],
      }
      const existing = state.settings.referenceMedia ?? []
      return {
        settings: {
          ...state.settings,
          referenceMedia: [...existing, newMedia],
        },
      }
    }),

  removeReferenceMedia: (id: string) =>
    set((state) => {
      const existing = state.settings.referenceMedia ?? []
      return {
        settings: {
          ...state.settings,
          referenceMedia: existing.filter((m) => m.id !== id),
        },
      }
    }),

  setReferenceRole: (id: string, role: string) =>
    set((state) => {
      const existing = state.settings.referenceMedia ?? []
      return {
        settings: {
          ...state.settings,
          referenceMedia: existing.map((m) =>
            m.id === id ? { ...m, role: role as OrchestratorReferenceMedia['role'] } : m,
          ),
        },
      }
    }),

  generatePlan: async () => {
    const { prompt } = get()
    if (!prompt.trim()) return
    if (get().isRunning) return

    set({ phase: 'planning', error: null, isRunning: true, cost: { ...EMPTY_COST } })

    try {
      // Gather context from stores
      const allSavedChars = useSavedCharactersStore.getState().characters
      const savedNames = allSavedChars.map((c) => c.name)

      // Gather 3D character context
      const allSaved3DChars = useSaved3DCharactersStore.getState().characters
      const saved3DNames = allSaved3DChars.map((c) => c.name)

      // Build selected character names from settings
      const { settings } = get()
      const selectedCharacterNames = settings.selectedCharacterIds
        .map((id) => allSavedChars.find((c) => c.id === id)?.name)
        .filter((name): name is string => !!name)

      const selected3DCharacterNames = settings.selected3DCharacterIds
        .map((id) => allSaved3DChars.find((c) => c.id === id)?.name)
        .filter((name): name is string => !!name)

      // Try to load voices if not already loaded
      const voiceState = useVoiceStore.getState()
      if (voiceState.availableVoices.length === 0) {
        try {
          await voiceState.fetchVoices()
        } catch {
          // Non-fatal — voices may not be configured
        }
      }
      const voiceNames = useVoiceStore.getState().availableVoices.map((v) => v.name)

      // Auto-inject learning context when useSmartDefaults is enabled
      const effectiveSettings = { ...settings }
      if (settings.useSmartDefaults && !settings.learningContext) {
        const learningContext = useLearningStore.getState().getLearningContext()
        if (learningContext.recommendedAspectRatio || learningContext.recommendedDuration || learningContext.performanceInsights?.length) {
          effectiveSettings.learningContext = learningContext
        }
      }

      const { plan, tokenUsage } = await generateClipPlan(prompt, {
        savedCharacterNames: savedNames,
        selectedCharacterNames,
        saved3DCharacterNames: saved3DNames,
        selected3DCharacterNames,
        voiceNames,
        settings: effectiveSettings,
      })

      // Track Gemini cost from plan generation
      if (tokenUsage) {
        const inputCost = (tokenUsage.promptTokenCount / 1_000_000) * GEMINI_FLASH_INPUT_PRICE
        const outputCost = (tokenUsage.candidatesTokenCount / 1_000_000) * GEMINI_FLASH_OUTPUT_PRICE
        const cost = inputCost + outputCost
        console.log(`[Orchestrator] Plan cost: $${cost.toFixed(6)} (in: ${tokenUsage.promptTokenCount}, out: ${tokenUsage.candidatesTokenCount})`)

        get().addCostEntry({
          source: 'gemini',
          label: 'Plan Generation',
          cost,
          credits: CREDIT_COSTS['orchestrator-plan'],
          tokenUsage,
        })
      }

      const steps = buildStepsFromPlan(plan, get().settings)

      set({
        plan,
        steps,
        phase: 'reviewing',
        isRunning: false,
        currentStepIndex: -1,
        error: null,
      })
    } catch (err) {
      set({
        phase: 'error',
        error: err instanceof Error ? err.message : 'Failed to generate plan',
        isRunning: false,
      })
    }
  },

  executePlan: async () => {
    const { plan, steps, settings } = get()
    if (!plan || get().isRunning) return

    const ctx = createExecutionContext(plan)
    ctx.addCostEntry = get().addCostEntry
    ctx.settings = settings
    set({ phase: 'executing', isRunning: true, error: null, _ctx: ctx })

    console.log('[Orchestrator] Starting execution with', steps.length, 'steps')

    // ── Parallel SVG generation ──
    // SVG objects use a separate API (Gemini) and don't depend on other steps,
    // so kick them off early and await the result before finalize.
    const svgStepIndex = steps.findIndex((s) => s.type === 'generate-svg-objects')
    let svgPromise: Promise<void> | null = null

    if (svgStepIndex !== -1) {
      console.log('[Orchestrator] Starting SVG object generation in parallel')
      const svgEntriesBefore = get().cost.entries.length
      set((state) => {
        const updatedSteps = [...state.steps]
        updatedSteps[svgStepIndex] = { ...updatedSteps[svgStepIndex], status: 'running' }
        return { steps: updatedSteps }
      })
      const svgExecutor = getStepExecutor('generate-svg-objects')
      svgPromise = svgExecutor(plan, ctx)
        .then(() => {
          console.log('[Orchestrator] SVG object generation — done (parallel)')
          set((state) => {
            const updatedSteps = [...state.steps]
            updatedSteps[svgStepIndex] = { ...updatedSteps[svgStepIndex], status: 'done' }
            return { steps: updatedSteps }
          })
        })
        .catch((err) => {
          const errorMsg = err instanceof Error ? err.message : 'SVG generation failed'
          console.warn('[Orchestrator] SVG object generation — failed (non-fatal):', err)
          set((state) => {
            const entries = [...state.cost.entries]
            for (let j = svgEntriesBefore; j < entries.length; j++) {
              entries[j] = { ...entries[j], refunded: true }
            }
            const totalCredits = entries.reduce((sum, e) => sum + (e.refunded ? 0 : (e.credits || 0)), 0)
            const updatedSteps = [...state.steps]
            updatedSteps[svgStepIndex] = { ...updatedSteps[svgStepIndex], status: 'error', error: errorMsg }
            return { steps: updatedSteps, cost: { ...state.cost, entries, totalCredits } }
          })
          // Don't throw — SVG failure is non-fatal, rest of the clip still works
        })
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]

      // Skip SVG step — it's running in parallel
      if (step.type === 'generate-svg-objects') continue

      console.log(`[Orchestrator] Step ${i + 1}/${steps.length}: ${step.type} — starting`)

      // Update step status to running
      set((state) => {
        const updatedSteps = [...state.steps]
        updatedSteps[i] = { ...updatedSteps[i], status: 'running' }
        return { steps: updatedSteps, currentStepIndex: i }
      })

      // Yield to browser to allow UI update between steps (single frame, not 50ms)
      await new Promise((r) => requestAnimationFrame(r))

      // Before finalize-timeline, wait for parallel SVG generation to complete
      if (step.type === 'finalize-timeline' && svgPromise) {
        console.log('[Orchestrator] Waiting for parallel SVG generation before finalize...')
        await svgPromise
        svgPromise = null
      }

      // Snapshot cost entries count before step — used to mark refunds on failure
      const costEntriesBefore = get().cost.entries.length

      try {
        const executor = getStepExecutor(step.type)
        await executor(plan, ctx)

        console.log(`[Orchestrator] Step ${i + 1}/${steps.length}: ${step.type} — done`)

        // Mark done
        set((state) => {
          const updatedSteps = [...state.steps]
          updatedSteps[i] = { ...updatedSteps[i], status: 'done' }
          return { steps: updatedSteps }
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Step failed'
        console.error(`[Orchestrator] Step ${i + 1}/${steps.length}: ${step.type} — FAILED:`, err)

        // Mark cost entries added during this step as refunded
        // (withCreditGate already refunded server-side)
        set((state) => {
          const entries = [...state.cost.entries]
          for (let j = costEntriesBefore; j < entries.length; j++) {
            entries[j] = { ...entries[j], refunded: true }
          }
          const totalCredits = entries.reduce((sum, e) => sum + (e.refunded ? 0 : (e.credits || 0)), 0)
          const updatedSteps = [...state.steps]
          updatedSteps[i] = { ...updatedSteps[i], status: 'error', error: errorMsg }
          return { steps: updatedSteps, cost: { ...state.cost, entries, totalCredits } }
        })

        // Non-fatal steps: log warning and continue to next step
        if (NON_FATAL_STEPS.has(step.type)) {
          console.warn(`[Orchestrator] Step "${step.type}" is non-fatal, continuing...`)
          continue
        }

        // Fatal steps: abort execution
        set({
          phase: 'error',
          error: `Step "${step.type}" failed: ${errorMsg}`,
          isRunning: false,
        })
        return
      }
    }

    // If SVG promise somehow wasn't awaited yet, wait now
    if (svgPromise) await svgPromise

    // Collect marketplace listing IDs from execution context
    const usedIds = ctx.usedMarketplaceListingIds
    if (usedIds.length > 0) {
      useMarketplaceUsageStore.getState().recordUsageBatch(usedIds)
    }

    console.log('[Orchestrator] All steps completed successfully')
    set({ phase: 'done', isRunning: false })

    // Auto-save the generated clip to Supabase
    try {
      await get().saveClip()
    } catch (err) {
      // Save failure is non-fatal — the clip is still in memory
      console.warn('[Orchestrator] Auto-save failed:', err)
    }

    // Distribute royalties if marketplace assets were used
    const usageStore = useMarketplaceUsageStore.getState()
    const projectId = useProjectStore.getState().currentProjectId
    const totalCredits = get().cost.totalCredits

    if (usageStore.usedListingIds.size > 0 && totalCredits > 0 && projectId) {
      try {
        await usageStore.syncToServer(projectId)
        const { distributeRoyalties } = await import('@/services/marketplaceService')
        const result = await distributeRoyalties(projectId, totalCredits)
        if (result.success && result.creator_count > 0) {
          console.log(`[Orchestrator] Royalties distributed: ${result.royalty_pool} credits to ${result.creator_count} creator(s)`)
          set({ royaltyResult: { royalty_pool: result.royalty_pool, creator_count: result.creator_count } })
          // Refresh credit balance
          try {
            const { fetchCreditBalance } = await import('@/services/creditsService')
            await fetchCreditBalance()
          } catch { /* non-fatal */ }
        }
      } catch (err) {
        console.warn('[Orchestrator] Royalty distribution failed (non-fatal):', err)
      }
    }
  },

  retryFromStep: async (index: number) => {
    const { plan, steps, settings, _ctx } = get()
    if (!plan || get().isRunning) return

    const ctx = _ctx || createExecutionContext(plan)
    ctx.addCostEntry = get().addCostEntry
    if (!ctx.settings) ctx.settings = settings
    set({ phase: 'executing', isRunning: true, error: null, _ctx: ctx })

    for (let i = index; i < steps.length; i++) {
      // Skip already-skipped steps
      if (steps[i].status === 'skipped') continue

      const costEntriesBefore = get().cost.entries.length

      set((state) => {
        const updatedSteps = [...state.steps]
        updatedSteps[i] = { ...updatedSteps[i], status: 'running', error: undefined }
        return { steps: updatedSteps, currentStepIndex: i }
      })

      // Yield to browser to allow UI update between steps
      await new Promise((r) => requestAnimationFrame(r))

      try {
        const executor = getStepExecutor(steps[i].type)
        await executor(plan, ctx)

        set((state) => {
          const updatedSteps = [...state.steps]
          updatedSteps[i] = { ...updatedSteps[i], status: 'done' }
          return { steps: updatedSteps }
        })
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Step failed'

        // Mark cost entries from this step as refunded
        set((state) => {
          const entries = [...state.cost.entries]
          for (let j = costEntriesBefore; j < entries.length; j++) {
            entries[j] = { ...entries[j], refunded: true }
          }
          const totalCredits = entries.reduce((sum, e) => sum + (e.refunded ? 0 : (e.credits || 0)), 0)
          const updatedSteps = [...state.steps]
          updatedSteps[i] = { ...updatedSteps[i], status: 'error', error: errorMsg }
          return { steps: updatedSteps, cost: { ...state.cost, entries, totalCredits } }
        })

        // Non-fatal steps: log warning and continue
        if (NON_FATAL_STEPS.has(steps[i].type)) {
          console.warn(`[Orchestrator] Step "${steps[i].type}" is non-fatal, continuing...`)
          continue
        }

        // Fatal steps: abort
        set({
          phase: 'error',
          error: `Step "${steps[i].type}" failed: ${errorMsg}`,
          isRunning: false,
        })
        return
      }
    }

    set({ phase: 'done', isRunning: false })

    // Auto-save after successful retry completion
    try {
      await get().saveClip()
    } catch (err) {
      console.warn('[Orchestrator] Auto-save after retry failed:', err)
    }
  },

  skipStep: (index: number) => {
    set((state) => {
      const updatedSteps = [...state.steps]
      updatedSteps[index] = { ...updatedSteps[index], status: 'skipped', error: undefined }
      return {
        steps: updatedSteps,
        error: null,
      }
    })

    // If in error phase, resume execution from the next step
    if (get().phase === 'error') {
      get().retryFromStep(index + 1)
    }
  },

  saveClip: async () => {
    // Dynamically import projectService to avoid circular deps
    const { projectService } = await import('@/services/projectService')

    // Skip save gracefully if Supabase is not configured
    if (!projectService.isAvailable()) {
      console.log('[Orchestrator] Supabase not configured, skipping cloud save')
      return
    }

    const projectStore = useProjectStore.getState()

    set({ isSaving: true, saveError: null })

    try {
      // Create a project if none exists — use prompt as name
      // IMPORTANT: We do NOT use projectStore.createProject() here because it
      // calls resetAllStores(), which would wipe all the content the orchestrator
      // just generated. Instead, we create the project record directly and set the
      // project store state manually.
      if (!projectStore.currentProjectId) {
        const { prompt } = get()
        const projectName = prompt.trim().slice(0, 50) || 'AI Director Clip'

        const projectId = await projectService.create(projectName)

        // Set project store state WITHOUT resetting content stores
        useProjectStore.setState({
          currentProjectId: projectId,
          currentProjectName: projectName,
          lastSaved: null,
        })
      }

      // Save all store state to Supabase
      await useProjectStore.getState().saveProject()

      set({
        isSaving: false,
        savedProjectId: useProjectStore.getState().currentProjectId,
      })

      console.log('[Orchestrator] Clip saved to project:', useProjectStore.getState().currentProjectId)
    } catch (err) {
      // Extract error message — Supabase errors are objects with .message, not Error instances
      const errorMsg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
            ? String((err as { message: unknown }).message)
            : 'Failed to save clip'
      console.error('[Orchestrator] Save failed:', err)
      set({ isSaving: false, saveError: errorMsg })
    }
  },

  generateVariations: async (variationConfig?: VariationConfig) => {
    const { plan, prompt } = get()
    if (!plan || get().isGeneratingVariations) return

    set({ isGeneratingVariations: true })

    try {
      if (variationConfig) {
        // Use the A/B variation engine with explicit config
        const { generateVariantsFromConfig } = await import('@/services/abVariationEngine')
        const variantResults = generateVariantsFromConfig(plan, variationConfig)
        // Extract just the ClipPlan objects
        const variants = variantResults.map((r) => r.plan)

        set({
          variations: variants,
          isGeneratingVariations: false,
          phase: 'comparing',
          selectedVariantIndex: 0,
        })
      } else {
        // Default: use the plan generator for random variations
        const { generatePlanVariations } = await import('@/services/orchestrator/planGenerator')
        const variantCount = get().settings.variantCount ?? 2
        const variants = await generatePlanVariations(plan, prompt, variantCount)

        set({
          variations: variants,
          isGeneratingVariations: false,
          phase: 'comparing',
          selectedVariantIndex: 0,
        })
      }
    } catch (err) {
      console.error('[Orchestrator] Variant generation failed:', err)
      set({ isGeneratingVariations: false })
    }
  },

  compareVariants: (indexA: number, indexB: number): VariantComparison | null => {
    const { plan, variations } = get()
    if (!plan) return null

    const allPlans = [plan, ...variations]
    const planA = allPlans[indexA]
    const planB = allPlans[indexB]
    if (!planA || !planB) return null

    // Compare dimensions between the two variants
    const dimensionDiffs: Record<string, number> = {}

    // Compare dialogue count
    dimensionDiffs.dialogueLines = planB.dialogue.length - planA.dialogue.length

    // Compare character count
    dimensionDiffs.characters = planB.characters.length - planA.characters.length

    // Compare text overlay count
    dimensionDiffs.textOverlays = (planB.textOverlays?.length ?? 0) - (planA.textOverlays?.length ?? 0)

    // Compare HTML template count
    dimensionDiffs.htmlTemplates = (planB.htmlTemplates?.length ?? 0) - (planA.htmlTemplates?.length ?? 0)

    return {
      variantA: indexA,
      variantB: indexB,
      dimensionDiffs,
      winner: null,
    }
  },

  executeAllVariants: async () => {
    const { plan, variations, settings } = get()
    if (!plan || get().isRunning) return

    // Build list: original + generated variations
    const allPlans: { plan: ClipPlan; label: string }[] = [
      { plan, label: 'Original' },
      ...variations.map((v, i) => ({
        plan: v,
        label: `Variant ${String.fromCharCode(65 + i)}`,
      })),
    ]

    const results: ExecutedVariant[] = []

    set({ isRunning: true, phase: 'executing', error: null })

    for (let i = 0; i < allPlans.length; i++) {
      const { plan: variantPlan, label } = allPlans[i]

      console.log(`[Orchestrator] Executing variant ${i + 1}/${allPlans.length}: ${label}`)

      // Set this plan as active and execute
      const ctx = createExecutionContext(variantPlan)
      ctx.addCostEntry = get().addCostEntry
      ctx.settings = settings
      set({ plan: variantPlan, _ctx: ctx })

      const steps = buildStepsFromPlan(variantPlan, settings)
      set({ steps, currentStepIndex: -1 })

      // Run all steps
      let hadFatalError = false
      for (let si = 0; si < steps.length; si++) {
        const step = steps[si]
        if (step.type === 'generate-svg-objects') continue

        set((state) => {
          const updatedSteps = [...state.steps]
          updatedSteps[si] = { ...updatedSteps[si], status: 'running' }
          return { steps: updatedSteps, currentStepIndex: si }
        })

        await new Promise((r) => requestAnimationFrame(r))

        try {
          const executor = getStepExecutor(step.type)
          await executor(variantPlan, ctx)

          set((state) => {
            const updatedSteps = [...state.steps]
            updatedSteps[si] = { ...updatedSteps[si], status: 'done' }
            return { steps: updatedSteps }
          })
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Step failed'
          console.warn(`[Orchestrator] Variant ${label} step ${step.type} failed:`, err)
          set((state) => {
            const updatedSteps = [...state.steps]
            updatedSteps[si] = { ...updatedSteps[si], status: 'error', error: errorMsg }
            return { steps: updatedSteps }
          })

          const NON_FATAL: Set<StepType> = new Set(['generate-music', 'setup-stock-media', 'setup-sound-effects'])
          if (!NON_FATAL.has(step.type)) {
            hadFatalError = true
            break
          }
        }
      }

      // Capture result
      let viralScore: ViralScore | null = null
      let thumbnailDataUrl: string | null = null

      if (!hadFatalError) {
        // Quick viral scoring
        try {
          const { scoreClipPlanForVirality } = await import('@/services/orchestrator/planGenerator')
          viralScore = await scoreClipPlanForVirality(variantPlan, get().prompt)
        } catch {
          console.warn(`[Orchestrator] Viral scoring failed for ${label}`)
        }

        // Capture thumbnail from current canvas
        try {
          const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
          if (canvas) {
            thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.7)
          }
        } catch {
          // thumbnail capture failed, proceed without
        }
      }

      results.push({
        index: i,
        plan: variantPlan,
        label,
        viralScore,
        thumbnailDataUrl,
        totalCredits: get().cost.totalCredits,
      })
    }

    // Restore original plan and show comparison
    set({
      plan: allPlans[0].plan,
      executedVariants: results,
      isRunning: false,
      phase: 'comparing',
      selectedVariantIndex: 0,
    })
  },

  selectVariant: (index: number) => {
    set({ selectedVariantIndex: index })
  },

  applyVariant: (index: number) => {
    const { executedVariants, variations, plan } = get()

    // Get the plan from either executedVariants or from the plans list
    let selectedPlan: ClipPlan | null = null
    if (executedVariants.length > 0) {
      selectedPlan = executedVariants[index]?.plan ?? null
    } else if (index === 0) {
      selectedPlan = plan
    } else {
      selectedPlan = variations[index - 1] ?? null
    }

    if (!selectedPlan) return

    // Set the selected plan as the active plan and go to review
    const steps = buildStepsFromPlan(selectedPlan, get().settings)
    set({
      plan: selectedPlan,
      steps,
      phase: 'reviewing',
      variations: [],
      executedVariants: [],
      selectedVariantIndex: 0,
    })
  },

  reset: () => {
    useMarketplaceUsageStore.getState().clearUsage()
    set({
      prompt: '',
      phase: 'idle',
      plan: null,
      steps: [],
      currentStepIndex: -1,
      error: null,
      isRunning: false,
      _ctx: null,
      cost: { ...EMPTY_COST },
      settings: { ...DEFAULT_SETTINGS, aspectRatio: getAspectRatioFromCanvas() },
      isSaving: false,
      saveError: null,
      savedProjectId: null,
      royaltyResult: null,
      variations: [],
      executedVariants: [],
      isGeneratingVariations: false,
      selectedVariantIndex: 0,
    })
  },
}))
