/**
 * useNB2Store — shared Zustand store for NB2 AI character generation.
 *
 * Holds all state that was previously local to NanoBanana2Panel,
 * shared across the three split panels:
 *   - NB2ControlsSection (left panel)
 *   - NB2ImageViewer (center overlay)
 *   - NB2PromptEditor (right panel)
 */

import { create } from 'zustand'
import {
  runNB2Pipeline,
  runSingleNB2Step,
  generateVisemeCurvatures,
  cropStepResult,
  sliceAllAtOnceVisemeSheet,
  sliceSingleVisemeSheet,
  combineVisemeSheetsIntoCurved,
} from '@/services/nanoBanana2'
import {
  getDefaultPromptConfig,
  compileNB2Prompt,
  buildVisemeAllAtOncePrompt,
  type NB2PromptConfig,
} from '@/services/nb2Prompts'
import { buildVisemeSpriteMapFromCurved } from '@/services/visemeMapper'
import { useCharacterConfigStore, type CharacterPartTab } from '@/stores/useCharacterConfigStore'
import { useCharacterPartsStore } from '@/stores/useCharacterPartsStore'
import { useSavedCharactersStore, type SavedCharacter } from '@/stores/useSavedCharactersStore'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useCanvasStore } from '@/stores/useCanvasStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { removeBackgroundRecraft, vectorizeImage, isRecraftAvailable } from '@/services/recraft'
import { dataUrlToBlob, blobToDataUrl } from '@/utils/blobUtils'
import type {
  NB2StepStatus,
  NB2PipelineResult,
  NB2PartType,
  NB2Resolution,
  NB2AspectRatio,
  NB2Gender,
  NB2VisemePhase,
  NB2PipelineOptions,
  NB2GridSize,
} from '@/types/nanoBanana2'
import { NB2_PART_TYPES, NB2_PART_LABELS } from '@/types/nanoBanana2'
import type { RightPanelTab } from '@/types'

// ── Default grid sizes per step ─────────────────────────────────

export type GridSize = NB2GridSize

export const DEFAULT_GRID_SIZES: Partial<Record<NB2PartType, GridSize>> = {
  hair: { cols: 4, rows: 3 }, // female default; male overridden to 6×4 in generate()
  'viseme-sheet': { cols: 3, rows: 9 },
  'eye-strip': { cols: 3, rows: 2 },
  'eyebrow-strip': { cols: 3, rows: 2 },
  clothing: { cols: 3, rows: 3 },
}

/** Gender-specific hair grid defaults */
export const HAIR_GRID_BY_GENDER: Record<string, GridSize> = {
  male: { cols: 6, rows: 4 },
  female: { cols: 4, rows: 3 },
  neutral: { cols: 4, rows: 3 },
}

/** Grid size for part-by-part viseme mode (9 cells per curvature) */
export const VISEME_PART_BY_PART_GRID: GridSize = { cols: 3, rows: 3 }

/** Per-step aspect ratio overrides */
export const STEP_AR_OVERRIDES: Partial<Record<NB2PartType, NB2AspectRatio>> = {
  clothing: '3:2',
  'eye-strip': '16:9',
  'eyebrow-strip': '16:9',
}

// ── Module-level abort controller (mutable, not in store) ──────────

let abortRef: AbortController | null = null

// ── NB2 step → right panel tab mapping ─────────────────────────────

const STEP_TO_RIGHT_TAB: Partial<Record<NB2PartType, RightPanelTab>> = {
  concept: 'group-properties',
  body: 'body',
  head: 'head',
  hair: 'hair',
  'viseme-sheet': 'viseme',
  'eye-strip': 'eye',
  'eyebrow-strip': 'eyebrow',
  clothing: 'shirt',
}

// ── Eye / eyebrow auto-labels ──────────────────────────────────────

const EYE_LABELS = ['Neutral', 'Happy', 'Sad', 'Angry', 'Shocked', 'Suspicious']
const EYEBROW_LABELS = ['Neutral', 'Happy', 'Sad', 'Angry', 'Shocked', 'Suspicious']

// ── Post-process phase type ────────────────────────────────────────

export type NB2PostProcessPhase = 'removing-bg' | 'vectorizing' | 'cropping' | null
export type NB2VisemeMode = 'all-at-once' | 'part-by-part'

// ── Store interface ────────────────────────────────────────────────

interface NB2State {
  // Form
  characterName: string
  prompt: string
  gender: NB2Gender
  styleRef: string | null
  layoutRef: string | null
  resolution: NB2Resolution
  aspectRatio: NB2AspectRatio
  autoMode: boolean

  // Pipeline
  steps: NB2StepStatus[]
  isRunning: boolean
  regeneratingStep: string | null
  error: string | null
  result: NB2PipelineResult | null

  // Post-processing (per-step so multiple can run in parallel)
  postProcessPhases: Partial<Record<NB2PartType, 'removing-bg' | 'vectorizing' | 'cropping'>>

  // UI
  selectedStepId: NB2PartType | null
  expandedStep: string | null
  promptOverrides: Partial<Record<NB2PartType, string>>
  promptConfigs: Partial<Record<NB2PartType, NB2PromptConfig>>
  editingPromptStep: NB2PartType | null
  promptActiveTab: string | null
  gridSizes: Partial<Record<NB2PartType, GridSize>>
  clothingRowRatios: [number, number, number] // [shirt, pants, shoes] — must sum to 1.0

  // Multi-phase viseme
  visemePhase: NB2VisemePhase | null
  visemeMode: NB2VisemeMode
  visemeSheetIndex: number // 0=neutral, 1=upward, 2=downward

  // Form setters
  setCharacterName: (name: string) => void
  setPrompt: (prompt: string) => void
  setGender: (g: NB2Gender) => void
  setStyleRef: (ref: string | null) => void
  setLayoutRef: (ref: string | null) => void
  setResolution: (res: NB2Resolution) => void
  setAspectRatio: (ar: NB2AspectRatio) => void
  setAutoMode: (auto: boolean) => void
  setSelectedStepId: (id: NB2PartType | null) => void
  setExpandedStep: (id: string | null) => void
  setEditingPromptStep: (id: NB2PartType | null) => void
  setPromptActiveTab: (tab: string) => void
  setPromptOverride: (step: NB2PartType, text: string) => void
  clearPromptOverride: (step: NB2PartType) => void
  setPromptConfig: (step: NB2PartType, config: NB2PromptConfig) => void
  clearPromptConfig: (step: NB2PartType) => void
  getPromptConfig: (step: NB2PartType) => NB2PromptConfig
  setGridSize: (step: NB2PartType, size: GridSize) => void
  setClothingRowRatios: (ratios: [number, number, number]) => void
  setVisemeMode: (mode: NB2VisemeMode) => void
  setVisemeSheetIndex: (index: number) => void

  // Actions
  generate: () => Promise<void>
  continueStep: (partType: NB2PartType) => Promise<void>
  regenerateStep: (partType: NB2PartType) => Promise<void>
  confirmVisemeNeutral: () => Promise<void>
  processAndSave: (startFrom: 'remove-bg' | 'vectorize' | 'crop', stepId?: NB2PartType) => Promise<void>
  cancel: () => void
  clearStepResult: (partType: NB2PartType) => void
  save: (onSaved: () => void) => Promise<void>
  resetPipelineState: () => void
  reset: () => void
}

// ── Derived selectors (exported for components) ────────────────────

export function useNB2DerivedState() {
  const steps = useNB2Store((s) => s.steps)
  const result = useNB2Store((s) => s.result)
  const autoMode = useNB2Store((s) => s.autoMode)
  const isRunning = useNB2Store((s) => s.isRunning)
  const regeneratingStep = useNB2Store((s) => s.regeneratingStep)
  const editingPromptStep = useNB2Store((s) => s.editingPromptStep)
  const promptOverrides = useNB2Store((s) => s.promptOverrides)
  const promptConfigs = useNB2Store((s) => s.promptConfigs)
  const prompt = useNB2Store((s) => s.prompt)
  const selectedStepId = useNB2Store((s) => s.selectedStepId)
  const gridSizes = useNB2Store((s) => s.gridSizes)
  const gender = useNB2Store((s) => s.gender)

  const completedCount = steps.filter((s) => s.status === 'complete').length
  const hasError = steps.some((s) => s.status === 'error')
  const allStepsDone = steps.length > 0 && steps.every((s) => s.status === 'complete' || s.status === 'error')
  const isComplete = result !== null && (autoMode || allStepsDone)

  const pipelineStarted = steps.length > 0 && steps.some((s) => s.status !== 'pending')
  const nextPendingStepId =
    !autoMode && !isRunning && !regeneratingStep && pipelineStarted
      ? (steps.find(
          (s, i) =>
            s.status === 'pending' &&
            (i === 0 || steps[i - 1].status === 'complete' || steps[i - 1].status === 'error'),
        )?.id ?? null)
      : null
  const stepByStepInProgress = !autoMode && pipelineStarted && !isRunning && steps.some((s) => s.status === 'pending')

  const activePromptStep = editingPromptStep || nextPendingStepId

  // Build prompt text: config-based (with grid sync) > raw override > default
  let activePromptText: string | null = null
  let activePromptConfig: NB2PromptConfig | null = null
  if (activePromptStep) {
    const config = promptConfigs[activePromptStep] ?? getDefaultPromptConfig(activePromptStep)
    activePromptConfig = config
    const gridSize = gridSizes[activePromptStep]
    // Raw override wins if it exists (user typed raw text)
    activePromptText =
      promptOverrides[activePromptStep] ??
      compileNB2Prompt(activePromptStep, config, prompt.trim(), gridSize, gender !== 'neutral' ? gender : undefined)
  }

  const selectedStep = steps.find((s) => s.id === selectedStepId)
  const selectedImage = selectedStep?.result || null
  const selectedIsGenerating =
    selectedStep?.status === 'generating' || (regeneratingStep != null && regeneratingStep === selectedStepId)

  return {
    completedCount,
    hasError,
    allStepsDone,
    isComplete,
    pipelineStarted,
    nextPendingStepId,
    stepByStepInProgress,
    activePromptStep,
    activePromptText,
    activePromptConfig,
    selectedStep,
    selectedImage,
    selectedIsGenerating,
  }
}

// ── Auto-populate helper ───────────────────────────────────────────

function autoPopulateStep(partType: NB2PartType, _result: NB2PipelineResult) {
  const { setRightPanelTab } = useEditorStore.getState()
  const rightTab = STEP_TO_RIGHT_TAB[partType]
  if (rightTab) setRightPanelTab(rightTab)
}

// ── Store ──────────────────────────────────────────────────────────

export const useNB2Store = create<NB2State>()((set, get) => {
  function pipelineOptions(stepOverrideAR?: NB2AspectRatio): NB2PipelineOptions {
    const { prompt, styleRef, layoutRef, characterName, gender, resolution, aspectRatio } = get()
    return {
      prompt: prompt.trim(),
      styleReference: styleRef,
      layoutReference: layoutRef,
      characterName: characterName.trim() || undefined,
      gender: gender !== 'neutral' ? gender : undefined,
      resolution,
      aspectRatio: stepOverrideAR ?? aspectRatio,
    }
  }

  return {
    // Form defaults
    characterName: '',
    prompt: '',
    gender: 'neutral' as NB2Gender,
    styleRef: null,
    layoutRef: null,
    resolution: '1024',
    aspectRatio: '1:1' as NB2AspectRatio,
    autoMode: true,

    // Pipeline defaults
    steps: [],
    isRunning: false,
    regeneratingStep: null,
    error: null,
    result: null,
    postProcessPhases: {},

    // UI defaults
    selectedStepId: null,
    expandedStep: null,
    promptOverrides: {},
    promptConfigs: {},
    editingPromptStep: null,
    promptActiveTab: null,
    gridSizes: { ...DEFAULT_GRID_SIZES },
    clothingRowRatios: [0.35, 0.45, 0.2] as [number, number, number],
    visemePhase: null,
    visemeMode: 'all-at-once' as NB2VisemeMode,
    visemeSheetIndex: 0,

    // Form setters
    setCharacterName: (name) => set({ characterName: name }),
    setPrompt: (prompt) => set({ prompt }),
    setGender: (gender) => {
      const currentHairGrid = get().gridSizes.hair
      const defaultHairGrid = DEFAULT_GRID_SIZES.hair!
      const oldGenderGrid = HAIR_GRID_BY_GENDER[get().gender] ?? HAIR_GRID_BY_GENDER.neutral
      // Update hair grid if user hasn't customized it (still matches old gender default or overall default)
      const isDefault =
        (currentHairGrid?.cols === defaultHairGrid.cols && currentHairGrid?.rows === defaultHairGrid.rows) ||
        (currentHairGrid?.cols === oldGenderGrid.cols && currentHairGrid?.rows === oldGenderGrid.rows)
      const newGenderGrid = HAIR_GRID_BY_GENDER[gender] ?? HAIR_GRID_BY_GENDER.neutral
      set({
        gender,
        ...(isDefault ? { gridSizes: { ...get().gridSizes, hair: newGenderGrid } } : {}),
      })
    },
    setStyleRef: (ref) => set({ styleRef: ref }),
    setLayoutRef: (ref) => set({ layoutRef: ref }),
    setResolution: (res) => set({ resolution: res }),
    setAspectRatio: (ar) => set({ aspectRatio: ar }),
    setAutoMode: (auto) => set({ autoMode: auto }),
    setSelectedStepId: (id) => set({ selectedStepId: id }),
    setExpandedStep: (id) => set({ expandedStep: id }),
    setEditingPromptStep: (id) => set({ editingPromptStep: id }),
    setPromptActiveTab: (tab) => set({ promptActiveTab: tab }),
    setPromptOverride: (step, text) =>
      set((s) => ({
        promptOverrides: { ...s.promptOverrides, [step]: text },
      })),
    setGridSize: (step, size) =>
      set((s) => ({
        gridSizes: { ...s.gridSizes, [step]: size },
      })),
    setClothingRowRatios: (ratios) => set({ clothingRowRatios: ratios }),
    setVisemeSheetIndex: (index) => set({ visemeSheetIndex: index }),
    setVisemeMode: (mode) =>
      set((s) => ({
        visemeMode: mode,
        visemeSheetIndex: 0,
        gridSizes: {
          ...s.gridSizes,
          'viseme-sheet': mode === 'all-at-once' ? { cols: 3, rows: 9 } : VISEME_PART_BY_PART_GRID,
        },
      })),
    clearPromptOverride: (step) =>
      set((s) => {
        const next = { ...s.promptOverrides }
        delete next[step]
        return { promptOverrides: next }
      }),
    setPromptConfig: (step, config) =>
      set((s) => ({
        promptConfigs: { ...s.promptConfigs, [step]: config },
      })),
    clearPromptConfig: (step) =>
      set((s) => {
        const next = { ...s.promptConfigs }
        delete next[step]
        return { promptConfigs: next }
      }),
    getPromptConfig: (step) => {
      return get().promptConfigs[step] ?? getDefaultPromptConfig(step)
    },

    // ── Generate ──────────────────────────────────────────────────

    generate: async () => {
      const { prompt, autoMode, promptOverrides, promptConfigs, clothingRowRatios, visemeMode } = get()
      let gridSizes = { ...get().gridSizes }
      if (!prompt.trim()) return

      // Clear right panel assets from any previous generation
      const configStore = useCharacterConfigStore.getState()
      const clearTabs: CharacterPartTab[] = [
        'viseme',
        'eye',
        'eyebrow',
        'hair',
        'body',
        'head',
        'shirt',
        'pants',
        'shoes',
      ]
      for (const tab of clearTabs) {
        configStore.clearSavedImages(tab)
        configStore.setUploadedImage(tab, null)
      }

      // Apply gender-specific hair grid if user hasn't customized it
      const g = get().gender
      const currentHairGrid = gridSizes.hair
      const defaultHairGrid = DEFAULT_GRID_SIZES.hair!
      if (currentHairGrid?.cols === defaultHairGrid.cols && currentHairGrid?.rows === defaultHairGrid.rows) {
        // User hasn't changed from default — apply gender-specific grid
        const genderHairGrid = HAIR_GRID_BY_GENDER[g] ?? HAIR_GRID_BY_GENDER.neutral
        gridSizes = { ...gridSizes, hair: genderHairGrid }
        set({ gridSizes })
      }

      // Build compiled prompt overrides: config-based prompts + raw text overrides.
      // ALWAYS compile prompts for grid steps so the correct grid size & gender are sent to the server
      // (the server's hardcoded fallback prompts don't know about user grid sizes or gender).
      const genderParam = g !== 'neutral' ? g : undefined
      const compiledOverrides: Partial<Record<NB2PartType, string>> = {}
      const isVisemeAllAtOnce = visemeMode === 'all-at-once'
      for (const step of NB2_PART_TYPES) {
        if (promptOverrides[step]) {
          compiledOverrides[step] = promptOverrides[step]
        } else if (promptConfigs[step]) {
          compiledOverrides[step] = compileNB2Prompt(
            step,
            promptConfigs[step],
            prompt.trim(),
            gridSizes[step],
            genderParam,
          )
        } else if (step === 'viseme-sheet') {
          // Viseme always needs a compiled prompt matching the mode's grid size
          if (isVisemeAllAtOnce) {
            const vGrid = gridSizes['viseme-sheet'] ?? { cols: 3, rows: 9 }
            compiledOverrides['viseme-sheet'] = buildVisemeAllAtOncePrompt(prompt.trim(), vGrid)
          } else {
            const vGrid = gridSizes['viseme-sheet'] ?? VISEME_PART_BY_PART_GRID
            const config = getDefaultPromptConfig('viseme-sheet')
            compiledOverrides['viseme-sheet'] = compileNB2Prompt(
              'viseme-sheet',
              config,
              prompt.trim(),
              vGrid,
              genderParam,
            )
          }
        } else if (['hair', 'eye-strip', 'eyebrow-strip', 'clothing'].includes(step)) {
          // All grid steps need compiled prompts with correct grid dimensions
          const config = getDefaultPromptConfig(step as NB2PartType)
          compiledOverrides[step] = compileNB2Prompt(
            step as NB2PartType,
            config,
            prompt.trim(),
            gridSizes[step],
            genderParam,
          )
        }
      }

      set({ error: null, result: null, isRunning: true })

      const controller = new AbortController()
      abortRef = controller

      if (autoMode) {
        try {
          const pipelineResult = await runNB2Pipeline(
            pipelineOptions(),
            (updatedSteps) => {
              set({ steps: [...updatedSteps] })
              const active = [...updatedSteps]
                .reverse()
                .find((s) => s.status === 'complete' || s.status === 'generating')
              if (active) {
                set({ selectedStepId: active.id, editingPromptStep: active.id })
                autoPopulateStep(active.id, {} as any)
              }
            },
            controller.signal,
            compiledOverrides,
            gridSizes,
            clothingRowRatios,
            isVisemeAllAtOnce,
          )
          set({ result: pipelineResult })
          // Set viseme phase based on pipeline result
          if (pipelineResult.curvedVisemes) {
            set({ visemePhase: 'done' })
          } else if (pipelineResult.visemeNeutralSheet) {
            set({ visemePhase: 'confirming' })
          }
          // Auto-populate all completed steps
          for (const step of get().steps) {
            if (step.status === 'complete') {
              autoPopulateStep(step.id, pipelineResult)
            }
          }

          // Auto-process: Remove BG → Vectorize → Crop on each completed step
          // Release abort controller so cancel() doesn't interfere with processing
          abortRef = null
          set({ isRunning: false })
          const processOrder: NB2PartType[] = [
            'body',
            'head',
            'hair',
            'eye-strip',
            'eyebrow-strip',
            'viseme-sheet',
            'clothing',
          ]
          for (const stepId of processOrder) {
            const step = get().steps.find((s) => s.id === stepId)
            if (step?.status !== 'complete' || !step.result) continue
            set({ selectedStepId: stepId, editingPromptStep: stepId })
            autoPopulateStep(stepId, get().result ?? ({} as any))
            try {
              await get().processAndSave('remove-bg', stepId)
            } catch (processErr) {
              console.warn(`[NB2] Auto-process failed for ${stepId}:`, processErr)
            }
          }

          // Auto-align character parts using AI landmark detection + alpha analysis.
          // Non-fatal: if alignment fails, parts stay at defaults.
          if (pipelineResult.concept && pipelineResult.body) {
            try {
              const { autoAlignCharacterParts } = await import('@/services/spriteAutoAlign')
              const configStore = useCharacterConfigStore.getState()
              const currentResult = get().result ?? pipelineResult
              const alignParts: Record<string, string | null> = {
                head: currentResult.head,
                viseme: configStore.curvedVisemes?.neutral_Rest ?? currentResult.curvedVisemes?.neutral_Rest ?? null,
                eye: currentResult.eyeVariants?.neutral ?? null,
                eyebrow: currentResult.eyebrowVariants?.neutral ?? null,
                hair: currentResult.hair?.[0] ?? null,
              }
              const computed = await autoAlignCharacterParts(
                currentResult.concept ?? pipelineResult.concept!,
                alignParts,
              )
              const partsStore = useCharacterPartsStore.getState()
              for (const [part, transform] of Object.entries(computed)) {
                partsStore.updateTransform(part as any, transform)
              }
            } catch (alignErr) {
              console.warn('[NB2] Auto-alignment failed, using defaults:', alignErr)
            }
          }
        } catch (err) {
          if (err instanceof Error && err.message !== 'Pipeline cancelled') {
            set({ error: err.message })
          }
        } finally {
          set({ isRunning: false })
          abortRef = null
        }
      } else {
        // Step-by-step: initialize steps, run only concept
        const initialSteps: NB2StepStatus[] = NB2_PART_TYPES.map((id) => ({
          id,
          label: NB2_PART_LABELS[id],
          status: 'pending' as const,
        }))
        set({ steps: initialSteps })

        const emptyResult: NB2PipelineResult = {
          concept: null,
          body: null,
          head: null,
          hair: null,
          hairSheet: null,
          curvedVisemes: null,
          visemeSheet: null,
          visemeNeutralSheet: null,
          visemeUpwardSheet: null,
          visemeDownwardSheet: null,
          eyeVariants: null,
          eyeSheet: null,
          eyebrowVariants: null,
          eyebrowSheet: null,
          clothing: null,
          clothingSheet: null,
        }

        set((s) => ({
          steps: s.steps.map((s) => (s.id === 'concept' ? { ...s, status: 'generating' as const } : s)),
          selectedStepId: 'concept',
        }))

        try {
          const conceptCustomPrompt =
            promptOverrides['concept'] ??
            (promptConfigs['concept']
              ? compileNB2Prompt('concept', promptConfigs['concept'], prompt.trim(), gridSizes['concept'])
              : undefined)
          const { updatedResult, stepStatus } = await runSingleNB2Step(
            'concept',
            pipelineOptions(),
            null,
            null,
            emptyResult,
            controller.signal,
            conceptCustomPrompt,
            gridSizes,
            clothingRowRatios,
          )
          set((s) => ({
            result: updatedResult,
            steps: s.steps.map((st) => (st.id === 'concept' ? stepStatus : st)),
            selectedStepId: 'concept',
          }))
          autoPopulateStep('concept', updatedResult)
        } catch (err) {
          if (err instanceof Error && err.message !== 'Pipeline cancelled') {
            set({ error: err.message })
          }
        } finally {
          set({ isRunning: false })
          abortRef = null
        }
      }
    },

    // ── Continue Step ──────────────────────────────────────────────

    continueStep: async (partType) => {
      const {
        result,
        prompt,
        isRunning,
        regeneratingStep,
        promptOverrides,
        promptConfigs,
        gridSizes,
        clothingRowRatios,
        gender,
        visemeMode,
      } = get()
      if (!result || !prompt.trim() || isRunning || regeneratingStep) return

      set((s) => ({
        isRunning: true,
        steps: s.steps.map((st) =>
          st.id === partType ? { ...st, status: 'generating' as const, error: undefined } : st,
        ),
        selectedStepId: partType,
      }))

      const controller = new AbortController()
      abortRef = controller

      try {
        const gp = gender !== 'neutral' ? gender : undefined
        // Build prompt — always compile for grid steps so correct grid size & gender are sent
        let customPrompt: string | undefined
        if (promptOverrides[partType]) {
          customPrompt = promptOverrides[partType]
        } else if (partType === 'viseme-sheet') {
          if (visemeMode === 'all-at-once') {
            const vGrid = gridSizes['viseme-sheet'] ?? { cols: 3, rows: 9 }
            customPrompt = buildVisemeAllAtOncePrompt(prompt.trim(), vGrid)
          } else {
            const vGrid = gridSizes['viseme-sheet'] ?? VISEME_PART_BY_PART_GRID
            const config = promptConfigs[partType] ?? getDefaultPromptConfig(partType)
            customPrompt = compileNB2Prompt(partType, config, prompt.trim(), vGrid, gp)
          }
        } else if (['hair', 'eye-strip', 'eyebrow-strip', 'clothing'].includes(partType)) {
          const config = promptConfigs[partType] ?? getDefaultPromptConfig(partType)
          customPrompt = compileNB2Prompt(partType, config, prompt.trim(), gridSizes[partType], gp)
        } else if (promptConfigs[partType]) {
          customPrompt = compileNB2Prompt(partType, promptConfigs[partType], prompt.trim(), gridSizes[partType], gp)
        }

        // Per-step AR override (clothing=3:2, viseme all-at-once=9:16)
        let stepAR = STEP_AR_OVERRIDES[partType]
        if (partType === 'viseme-sheet' && visemeMode === 'all-at-once') stepAR = '9:16'

        const { updatedResult, stepStatus } = await runSingleNB2Step(
          partType,
          pipelineOptions(stepAR),
          result.concept,
          result.head,
          result,
          controller.signal,
          customPrompt,
          gridSizes,
          clothingRowRatios,
        )
        set((s) => ({
          result: updatedResult,
          steps: s.steps.map((st) => (st.id === partType ? stepStatus : st)),
          editingPromptStep: null,
        }))
        if (stepStatus.status === 'complete') {
          autoPopulateStep(partType, updatedResult)
          if (partType === 'viseme-sheet') {
            if (visemeMode === 'all-at-once') {
              try {
                const vGrid = gridSizes['viseme-sheet'] ?? { cols: 3, rows: 9 }
                const curvedVisemes = await sliceAllAtOnceVisemeSheet(stepStatus.result!, vGrid)
                set((s) => ({
                  result: s.result ? { ...s.result, curvedVisemes } : s.result,
                  visemePhase: 'done',
                }))
              } catch {
                set({ visemePhase: 'done' })
              }
            } else {
              set({ visemePhase: 'confirming' })
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        set((s) => ({
          steps: s.steps.map((st) => (st.id === partType ? { ...st, status: 'error' as const, error: message } : st)),
        }))
      } finally {
        set({ isRunning: false })
        abortRef = null
      }
    },

    // ── Regenerate Step ────────────────────────────────────────────

    regenerateStep: async (partType) => {
      const {
        result,
        prompt,
        regeneratingStep,
        promptOverrides,
        promptConfigs,
        gridSizes,
        clothingRowRatios,
        gender,
        visemeMode,
      } = get()
      if (!result || !prompt.trim() || regeneratingStep) return

      set((s) => ({
        regeneratingStep: partType,
        selectedStepId: partType,
        steps: s.steps.map((st) =>
          st.id === partType ? { ...st, status: 'generating' as const, error: undefined } : st,
        ),
      }))

      const controller = new AbortController()
      abortRef = controller

      try {
        const gp = gender !== 'neutral' ? gender : undefined
        // Build prompt — always compile for grid steps so correct grid size & gender are sent
        let customPrompt: string | undefined
        if (promptOverrides[partType]) {
          customPrompt = promptOverrides[partType]
        } else if (partType === 'viseme-sheet') {
          if (visemeMode === 'all-at-once') {
            const vGrid = gridSizes['viseme-sheet'] ?? { cols: 3, rows: 9 }
            customPrompt = buildVisemeAllAtOncePrompt(prompt.trim(), vGrid)
          } else {
            const vGrid = gridSizes['viseme-sheet'] ?? VISEME_PART_BY_PART_GRID
            const config = promptConfigs[partType] ?? getDefaultPromptConfig(partType)
            customPrompt = compileNB2Prompt(partType, config, prompt.trim(), vGrid, gp)
          }
        } else if (['hair', 'eye-strip', 'eyebrow-strip', 'clothing'].includes(partType)) {
          const config = promptConfigs[partType] ?? getDefaultPromptConfig(partType)
          customPrompt = compileNB2Prompt(partType, config, prompt.trim(), gridSizes[partType], gp)
        } else if (promptConfigs[partType]) {
          customPrompt = compileNB2Prompt(partType, promptConfigs[partType], prompt.trim(), gridSizes[partType], gp)
        }

        let stepAR = STEP_AR_OVERRIDES[partType]
        if (partType === 'viseme-sheet' && visemeMode === 'all-at-once') stepAR = '9:16'

        const { updatedResult, stepStatus } = await runSingleNB2Step(
          partType,
          pipelineOptions(stepAR),
          result.concept,
          result.head,
          result,
          controller.signal,
          customPrompt,
          gridSizes,
          clothingRowRatios,
        )
        set((s) => ({
          result: updatedResult,
          steps: s.steps.map((st) => (st.id === partType ? stepStatus : st)),
        }))
        if (stepStatus.status === 'complete') {
          autoPopulateStep(partType, updatedResult)
          if (partType === 'viseme-sheet') {
            if (visemeMode === 'all-at-once') {
              try {
                const vGrid = gridSizes['viseme-sheet'] ?? { cols: 3, rows: 9 }
                const curvedVisemes = await sliceAllAtOnceVisemeSheet(stepStatus.result!, vGrid)
                set((s) => ({
                  result: s.result ? { ...s.result, curvedVisemes } : s.result,
                  visemePhase: 'done',
                }))
              } catch {
                set({ visemePhase: 'done' })
              }
            } else {
              set({ visemePhase: 'confirming' })
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        set((s) => ({
          steps: s.steps.map((st) => (st.id === partType ? { ...st, status: 'error' as const, error: message } : st)),
        }))
      } finally {
        set({ regeneratingStep: null })
        abortRef = null
      }
    },

    // ── Confirm Viseme Neutral & Generate Curvatures ──────────

    confirmVisemeNeutral: async () => {
      const { result, isRunning, regeneratingStep, gridSizes } = get()
      if (!result || !result.visemeNeutralSheet || isRunning || regeneratingStep) return

      set({ visemePhase: 'curvatures', isRunning: true })

      const controller = new AbortController()
      abortRef = controller

      try {
        const opts = pipelineOptions()
        const visemeGrid = gridSizes['viseme-sheet'] ?? { cols: 3, rows: 4 }

        const { upwardSheet, downwardSheet, curvedVisemes } = await generateVisemeCurvatures(
          result.visemeNeutralSheet,
          opts,
          result.concept,
          visemeGrid,
          controller.signal,
        )

        set((s) => ({
          result: s.result
            ? {
                ...s.result,
                visemeUpwardSheet: upwardSheet,
                visemeDownwardSheet: downwardSheet,
                curvedVisemes,
              }
            : s.result,
          visemePhase: 'done',
        }))
      } catch (err) {
        if (err instanceof Error && err.message !== 'Pipeline cancelled') {
          set({ error: err.message })
        }
        set({ visemePhase: 'confirming' }) // revert on error
      } finally {
        set({ isRunning: false })
        abortRef = null
      }
    },

    // ── Process & Save (Remove BG → Vectorize → Crop) ─────────

    processAndSave: async (startFrom, stepId?) => {
      const targetStepId = stepId ?? get().selectedStepId
      const { steps, gridSizes, clothingRowRatios } = get()
      if (!targetStepId || targetStepId === 'concept') return

      const step = steps.find((s) => s.id === targetStepId)
      if (!step || step.status !== 'complete' || !step.result) return

      const setPhase = (phase: 'removing-bg' | 'vectorizing' | 'cropping' | null) => {
        set((s) => {
          const next = { ...s.postProcessPhases }
          if (phase) {
            next[targetStepId] = phase
          } else {
            delete next[targetStepId]
          }
          return { postProcessPhases: next }
        })
      }

      // Helper: run BG-remove + vectorize on a single image
      const processImage = async (src: string): Promise<string> => {
        let img = src
        if (startFrom === 'remove-bg') {
          const blob = dataUrlToBlob(img)
          const resultBlob = await removeBackgroundRecraft(blob)
          img = await blobToDataUrl(resultBlob)
        }
        if (startFrom === 'remove-bg' || startFrom === 'vectorize') {
          const recraftOk = await isRecraftAvailable()
          if (recraftOk) {
            img = await vectorizeImage(img)
          }
        }
        return img
      }

      try {
        // ── Special handling for viseme-sheet: process ALL curvature sheets ──
        if (targetStepId === 'viseme-sheet') {
          const { visemeMode, result: currentResult } = get()
          const gridSize = gridSizes['viseme-sheet']

          if (visemeMode === 'part-by-part' && currentResult) {
            // Part-by-part: process all 3 curvature sheets
            const neutralSrc = currentResult.visemeNeutralSheet
            const upwardSrc = currentResult.visemeUpwardSheet
            const downwardSrc = currentResult.visemeDownwardSheet

            if (!neutralSrc) throw new Error('No neutral viseme sheet to process')

            // Phase 1 & 2: BG-remove + vectorize each sheet
            if (startFrom !== 'crop') {
              setPhase(startFrom === 'remove-bg' ? 'removing-bg' : 'vectorizing')
            }
            const processedNeutral = startFrom === 'crop' ? neutralSrc : await processImage(neutralSrc)

            // Update step result to show processed neutral in center
            set((s) => ({
              steps: s.steps.map((st) => (st.id === 'viseme-sheet' ? { ...st, result: processedNeutral } : st)),
            }))

            if (startFrom !== 'crop') {
              setPhase('vectorizing')
            }
            const processedUpward = upwardSrc && startFrom !== 'crop' ? await processImage(upwardSrc) : upwardSrc
            const processedDownward =
              downwardSrc && startFrom !== 'crop' ? await processImage(downwardSrc) : downwardSrc

            // Phase 3: Slice all sheets and combine into curvedVisemes
            setPhase('cropping')
            const cols = gridSize?.cols ?? 4
            const rows = gridSize?.rows ?? 3
            const neutralSprites = await sliceSingleVisemeSheet(processedNeutral, cols, rows)
            const upwardSprites = processedUpward
              ? await sliceSingleVisemeSheet(processedUpward, cols, rows)
              : neutralSprites
            const downwardSprites = processedDownward
              ? await sliceSingleVisemeSheet(processedDownward, cols, rows)
              : neutralSprites
            const curvedVisemes = combineVisemeSheetsIntoCurved(neutralSprites, upwardSprites, downwardSprites)

            // Save to configStore
            const configStore = useCharacterConfigStore.getState()
            configStore.setCurvedVisemes(curvedVisemes)
            configStore.setUseCurvedVisemes(true)
            const visemeSpriteMap = buildVisemeSpriteMapFromCurved(curvedVisemes)
            configStore.setVisemeSpriteMap(visemeSpriteMap)
            // Also populate savedImages['viseme'] with processed neutral sprites so save() picks them up
            configStore.setSavedImages(
              'viseme',
              Object.values(neutralSprites).filter((s): s is string => s !== null),
            )

            // Update pipeline result
            set((s) => {
              if (!s.result) return s
              return {
                result: {
                  ...s.result,
                  visemeNeutralSheet: processedNeutral,
                  visemeUpwardSheet: processedUpward ?? s.result.visemeUpwardSheet,
                  visemeDownwardSheet: processedDownward ?? s.result.visemeDownwardSheet,
                  curvedVisemes,
                },
              }
            })
          } else if (visemeMode === 'all-at-once') {
            // All-at-once: process the single sheet, then re-slice
            let imageDataUrl = step.result

            if (startFrom !== 'crop') {
              setPhase(startFrom === 'remove-bg' ? 'removing-bg' : 'vectorizing')
              imageDataUrl = await processImage(imageDataUrl)
              set((s) => ({
                steps: s.steps.map((st) => (st.id === 'viseme-sheet' ? { ...st, result: imageDataUrl } : st)),
              }))
            }

            setPhase('cropping')
            const vGrid = gridSize ?? { cols: 3, rows: 9 }
            const curvedVisemes = await sliceAllAtOnceVisemeSheet(imageDataUrl, vGrid)

            const configStore = useCharacterConfigStore.getState()
            configStore.setCurvedVisemes(curvedVisemes)
            configStore.setUseCurvedVisemes(true)
            const visemeSpriteMap = buildVisemeSpriteMapFromCurved(curvedVisemes)
            configStore.setVisemeSpriteMap(visemeSpriteMap)
            // Also populate savedImages['viseme'] with processed neutral sprites so save() picks them up
            const neutralKeys = Object.keys(curvedVisemes).filter((k) =>
              k.startsWith('neutral_'),
            ) as (keyof typeof curvedVisemes)[]
            configStore.setSavedImages(
              'viseme',
              neutralKeys.map((k) => curvedVisemes[k]).filter((s): s is string => !!s),
            )

            set((s) => {
              if (!s.result) return s
              return {
                result: { ...s.result, visemeSheet: imageDataUrl, curvedVisemes },
              }
            })
          }

          const { setRightPanelTab } = useEditorStore.getState()
          setRightPanelTab('viseme')
          setPhase(null)
          return
        }

        // ── Standard processing for non-viseme steps ──
        let imageDataUrl = step.result

        // Phase 1: Remove background
        if (startFrom === 'remove-bg') {
          setPhase('removing-bg')
          const blob = dataUrlToBlob(imageDataUrl)
          const resultBlob = await removeBackgroundRecraft(blob)
          imageDataUrl = await blobToDataUrl(resultBlob)
          set((s) => ({
            steps: s.steps.map((st) => (st.id === targetStepId ? { ...st, result: imageDataUrl } : st)),
          }))
        }

        // Phase 2: Vectorize
        if (startFrom === 'remove-bg' || startFrom === 'vectorize') {
          const recraftOk = await isRecraftAvailable()
          if (recraftOk) {
            setPhase('vectorizing')
            imageDataUrl = await vectorizeImage(imageDataUrl)
            set((s) => ({
              steps: s.steps.map((st) => (st.id === targetStepId ? { ...st, result: imageDataUrl } : st)),
            }))
          }
        }

        // Phase 3: Crop & save to right panel
        setPhase('cropping')
        const gridSize = gridSizes[targetStepId]
        const { savedImages, labels } = await cropStepResult(targetStepId, imageDataUrl, gridSize, clothingRowRatios)

        const configStore = useCharacterConfigStore.getState()
        const { setRightPanelTab } = useEditorStore.getState()

        for (const [tab, sprites] of Object.entries(savedImages)) {
          configStore.setSavedImages(tab as any, sprites)
          const tabLabels = labels[tab]
          if (tabLabels) {
            tabLabels.forEach((label, i) => {
              configStore.setSpriteLabel(tab as any, i, label)
            })
          }
        }

        // Update the pipeline result so save() uses processed data
        set((s) => {
          if (!s.result) return s
          const r = { ...s.result }
          switch (targetStepId) {
            case 'body':
              r.body = imageDataUrl
              break
            case 'head':
              r.head = imageDataUrl
              break
            case 'hair':
              r.hairSheet = imageDataUrl
              r.hair = savedImages.hair ?? r.hair
              break
            case 'eye-strip': {
              r.eyeSheet = imageDataUrl
              const eyeSprites = savedImages.eye
              if (eyeSprites) {
                const ev: Record<string, string | null> = {}
                EYE_LABELS.forEach((label, i) => {
                  ev[label.toLowerCase()] = i < eyeSprites.length ? eyeSprites[i] : null
                })
                r.eyeVariants = ev as any
              }
              break
            }
            case 'eyebrow-strip': {
              r.eyebrowSheet = imageDataUrl
              const ebSprites = savedImages.eyebrow
              if (ebSprites) {
                const ebv: Record<string, string | null> = {}
                EYEBROW_LABELS.forEach((label, i) => {
                  ebv[label.toLowerCase()] = i < ebSprites.length ? ebSprites[i] : null
                })
                r.eyebrowVariants = ebv as any
              }
              break
            }
            case 'clothing':
              r.clothingSheet = imageDataUrl
              r.clothing = {
                shirt: savedImages.shirt ?? [],
                pants: savedImages.pants ?? [],
                shoes: savedImages.shoes ?? [],
              }
              break
          }
          return { result: r }
        })

        // Switch to the appropriate right panel tab
        const rightTab = STEP_TO_RIGHT_TAB[targetStepId]
        if (rightTab) setRightPanelTab(rightTab)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Processing failed'
        set({ error: message })
      } finally {
        setPhase(null)
      }
    },

    // ── Cancel ──────────────────────────────────────────────────

    cancel: () => {
      abortRef?.abort()
      set({ isRunning: false })
    },

    // ── Clear step result (delete generated image, show grid again) ──

    clearStepResult: (partType: NB2PartType) => {
      set((s) => {
        const newSteps = s.steps.map((st) =>
          st.id === partType ? { ...st, status: 'pending' as const, result: undefined, error: undefined } : st,
        )

        // Clear from pipeline result
        const newResult = s.result ? { ...s.result } : null
        if (newResult) {
          switch (partType) {
            case 'concept':
              newResult.concept = null
              break
            case 'body':
              newResult.body = null
              break
            case 'head':
              newResult.head = null
              break
            case 'hair':
              newResult.hair = []
              newResult.hairSheet = null
              break
            case 'viseme-sheet':
              newResult.visemeNeutralSheet = null
              newResult.visemeUpwardSheet = null
              newResult.visemeDownwardSheet = null
              newResult.curvedVisemes = null
              break
            case 'eye-strip':
              newResult.eyeVariants = null
              newResult.eyeSheet = null
              break
            case 'eyebrow-strip':
              newResult.eyebrowVariants = null
              newResult.eyebrowSheet = null
              break
            case 'clothing':
              newResult.clothing = null
              newResult.clothingSheet = null
              break
          }
        }

        return {
          steps: newSteps,
          result: newResult,
          visemePhase: partType === 'viseme-sheet' ? null : s.visemePhase,
        }
      })
    },

    // ── Save ────────────────────────────────────────────────────

    save: async (onSaved) => {
      const { result, characterName, prompt } = get()
      if (!result || !characterName.trim()) return

      // Run auto-alignment if it hasn't been run yet (e.g., step-by-step mode)
      if (result.concept && result.body) {
        try {
          const { autoAlignCharacterParts } = await import('@/services/spriteAutoAlign')
          const alignParts: Record<string, string | null> = {
            head: result.head,
            viseme: result.curvedVisemes?.neutral_Rest ?? null,
            eye: result.eyeVariants?.neutral ?? null,
            eyebrow: result.eyebrowVariants?.neutral ?? null,
            hair: result.hair?.[0] ?? null,
          }
          const computed = await autoAlignCharacterParts(result.concept, alignParts)
          const partsStore = useCharacterPartsStore.getState()
          for (const [part, transform] of Object.entries(computed)) {
            partsStore.updateTransform(part as any, transform)
          }
        } catch (alignErr) {
          console.warn('[NB2] Auto-alignment failed during save, using defaults:', alignErr)
        }
      }

      const bodyParts: Record<string, string[]> = {
        body: result.body ? [result.body] : [],
        head: result.head ? [result.head] : [],
        hair: Array.isArray(result.hair) ? result.hair : [],
        eye: [],
        eyebrow: [],
        viseme: [],
        shirt: result.clothing?.shirt || [],
        pants: result.clothing?.pants || [],
        shoes: result.clothing?.shoes || [],
      }

      if (result.eyeVariants) {
        bodyParts.eye = Object.values(result.eyeVariants).filter((v): v is string => v !== null)
      }
      if (result.eyebrowVariants) {
        bodyParts.eyebrow = Object.values(result.eyebrowVariants).filter((v): v is string => v !== null)
      }

      // Prefer processed curvedVisemes from configStore (set by processAndSave)
      // over pipeline result which may still have unprocessed sprites
      const configStore = useCharacterConfigStore.getState()
      const configCurved = configStore.curvedVisemes
      const hasProcessedVisemes = configCurved && Object.values(configCurved).some((v) => !!v)
      const finalCurvedVisemes = hasProcessedVisemes ? configCurved : result.curvedVisemes

      let visemeSpriteMap = undefined
      if (finalCurvedVisemes) {
        visemeSpriteMap = buildVisemeSpriteMapFromCurved(finalCurvedVisemes)
      }

      const newCharacter: SavedCharacter = {
        id: `char_${Date.now()}`,
        name: characterName.trim(),
        referenceImage: result.concept || result.body || '',
        stylePrompt: prompt,
        curvedVisemes: finalCurvedVisemes || ({} as any),
        eyeVariants: result.eyeVariants || undefined,
        eyebrowVariants: result.eyebrowVariants || undefined,
        createdAt: Date.now(),
        bodyParts,
        visemeSpriteMap,
      }

      const savedStore = useSavedCharactersStore.getState()
      savedStore.addCharacter(newCharacter)
      savedStore.selectCharacter(newCharacter.id)
      savedStore
        .persistImages(newCharacter.id)
        .catch((err) => console.warn('[NB2Store] Failed to persist images:', err))

      if (finalCurvedVisemes) {
        configStore.setCurvedVisemes(finalCurvedVisemes)
        configStore.setUseCurvedVisemes(true)
        if (visemeSpriteMap) {
          configStore.setVisemeSpriteMap(visemeSpriteMap)
        }
      }
      if (result.eyeVariants) configStore.setEyeVariantSprites(result.eyeVariants)
      if (result.eyebrowVariants) configStore.setEyebrowVariantSprites(result.eyebrowVariants)

      // Use processed sprites from configStore (set by processAndSave) when available,
      // fall back to unprocessed result data for parts that weren't processed
      const partOrder = ['body', 'head', 'eye', 'eyebrow', 'viseme', 'hair', 'shirt', 'pants', 'shoes'] as const
      const partsStore = useCharacterPartsStore.getState()
      for (const part of partOrder) {
        const existingProcessed = configStore.savedImages[part as CharacterPartTab]
        if (existingProcessed && existingProcessed.length > 0) {
          // Already has processed sprites from processAndSave — keep them, update bodyParts for the saved character
          bodyParts[part] = existingProcessed
          partsStore.setSelectedSprite(part as any, 0)
        } else {
          const images = bodyParts[part] || []
          configStore.setSavedImages(part as any, images)
          partsStore.setSelectedSprite(part as any, images.length > 0 ? 0 : null)
        }
      }

      // Auto-label eye/eyebrow sprites
      const eyeImages = bodyParts.eye || []
      eyeImages.forEach((_, i) => {
        if (i < EYE_LABELS.length) configStore.setSpriteLabel('eye', i, EYE_LABELS[i])
      })
      const ebImages = bodyParts.eyebrow || []
      ebImages.forEach((_, i) => {
        if (i < EYEBROW_LABELS.length) configStore.setSpriteLabel('eyebrow', i, EYEBROW_LABELS[i])
      })

      const {
        characters: dialogueChars,
        addDialogueCharacter,
        selectDialogueCharacter,
      } = useMultiCharacterStore.getState()
      const { canvasWidth, canvasHeight } = useCanvasStore.getState()
      const newDialogueId = addDialogueCharacter({
        name: newCharacter.name,
        savedCharacterId: newCharacter.id,
        position: { x: Math.round(canvasWidth / 2), y: Math.round(canvasHeight / 2) },
        scale: 1,
        zIndex: dialogueChars.length,
        visible: true,
        locked: false,
        voiceId: null,
        color: '',
      })
      selectDialogueCharacter(newDialogueId)

      // Reset NB2 pipeline state (but NOT configStore — sprites were just saved there)
      get().resetPipelineState()

      onSaved()
    },

    // ── Reset pipeline state only (no configStore clear) ─────────

    resetPipelineState: () => {
      abortRef?.abort()
      abortRef = null

      set({
        characterName: '',
        prompt: '',
        gender: 'neutral' as NB2Gender,
        styleRef: null,
        layoutRef: null,
        resolution: '1024',
        aspectRatio: '1:1' as NB2AspectRatio,
        autoMode: true,
        steps: [],
        isRunning: false,
        regeneratingStep: null,
        error: null,
        result: null,
        postProcessPhases: {},
        visemeMode: 'all-at-once' as NB2VisemeMode,
        selectedStepId: null,
        expandedStep: null,
        promptOverrides: {},
        promptConfigs: {},
        editingPromptStep: null,
        promptActiveTab: null,
        gridSizes: { ...DEFAULT_GRID_SIZES },
        clothingRowRatios: [0.35, 0.45, 0.2] as [number, number, number],
        visemePhase: null,
      })
    },

    // ── Reset (full — clears configStore too) ────────────────────

    reset: () => {
      // Clear right panel character assets so they don't leak into the next character
      const configStore = useCharacterConfigStore.getState()
      const tabs: CharacterPartTab[] = ['viseme', 'eye', 'eyebrow', 'hair', 'body', 'head', 'shirt', 'pants', 'shoes']
      for (const tab of tabs) {
        configStore.clearSavedImages(tab)
        configStore.setUploadedImage(tab, null)
      }

      get().resetPipelineState()
    },
  }
})
