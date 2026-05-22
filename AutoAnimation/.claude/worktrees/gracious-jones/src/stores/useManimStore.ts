import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  ManimPipelineState,
  ManimPipelineStep,
  ManimGenerationSettings,
  TopicScript,
  SceneSpec,
  ManimCodeResult,
  RenderJob,
  NarrationResult,
  ManimVideoMetadata,
} from '@/services/manim/types'

interface ManimStoreState extends ManimPipelineState {
  // Actions
  startGeneration: (settings: ManimGenerationSettings) => void
  setStep: (step: ManimPipelineStep) => void
  setStepProgress: (progress: number) => void
  setCurrentSceneIndex: (index: number) => void
  setTopicScript: (script: TopicScript) => void
  setSceneSpecs: (specs: SceneSpec[]) => void
  addCodeResult: (result: ManimCodeResult) => void
  updateRenderJob: (job: RenderJob) => void
  addNarrationResult: (result: NarrationResult) => void
  setFinalVideo: (url: string, metadata: ManimVideoMetadata) => void
  setError: (error: string) => void
  reset: () => void
}

const initialState: ManimPipelineState = {
  step: 'idle',
  settings: null,
  topicScript: null,
  sceneSpecs: null,
  codeResults: [],
  renderJobs: [],
  narrationResults: [],
  finalVideoUrl: null,
  videoMetadata: null,
  error: null,
  stepProgress: 0,
  currentSceneIndex: 0,
}

export const useManimStore = create<ManimStoreState>()(
  immer((set) => ({
    ...initialState,

    startGeneration: (settings) =>
      set((state) => {
        Object.assign(state, initialState)
        state.settings = settings
        state.step = 'planning-script'
      }),

    setStep: (step) =>
      set((state) => {
        state.step = step
        state.stepProgress = 0
      }),

    setStepProgress: (progress) =>
      set((state) => {
        state.stepProgress = Math.min(100, Math.max(0, progress))
      }),

    setCurrentSceneIndex: (index) =>
      set((state) => {
        state.currentSceneIndex = index
      }),

    setTopicScript: (script) =>
      set((state) => {
        state.topicScript = script
      }),

    setSceneSpecs: (specs) =>
      set((state) => {
        state.sceneSpecs = specs
        state.renderJobs = specs.map((_s, i) => ({
          jobId: '',
          sceneIndex: i,
          status: 'queued' as const,
        }))
      }),

    addCodeResult: (result) =>
      set((state) => {
        const idx = state.codeResults.findIndex((r) => r.sceneIndex === result.sceneIndex)
        if (idx >= 0) {
          state.codeResults[idx] = result
        } else {
          state.codeResults.push(result)
        }
      }),

    updateRenderJob: (job) =>
      set((state) => {
        const idx = state.renderJobs.findIndex((r) => r.sceneIndex === job.sceneIndex)
        if (idx >= 0) {
          state.renderJobs[idx] = job
        } else {
          state.renderJobs.push(job)
        }
      }),

    addNarrationResult: (result) =>
      set((state) => {
        const idx = state.narrationResults.findIndex((r) => r.sceneIndex === result.sceneIndex)
        if (idx >= 0) {
          state.narrationResults[idx] = result
        } else {
          state.narrationResults.push(result)
        }
      }),

    setFinalVideo: (url, metadata) =>
      set((state) => {
        state.finalVideoUrl = url
        state.videoMetadata = metadata
        state.step = 'completed'
      }),

    setError: (error) =>
      set((state) => {
        state.error = error
        state.step = 'error'
      }),

    reset: () => set(() => ({ ...initialState })),
  })),
)
