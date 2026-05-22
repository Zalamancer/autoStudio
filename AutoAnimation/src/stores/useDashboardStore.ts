import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  ClipPlan,
  OrchestratorPhase,
  OrchestratorStep,
  OrchestrationCost,
  CostEntry,
  OrchestratorSettings,
  OrchestratorAspectRatio,
} from '@/types/orchestrator'
import type { VideoCompositionProps } from '@/remotion/types'
import { generateClipPlan, buildStepsFromPlan } from '@/services/orchestrator'
import { useSavedCharactersStore } from '@/stores/useSavedCharactersStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { useLearningStore } from '@/stores/useLearningStore'
import { useOrchestratorStore } from '@/stores/useOrchestratorStore'
import { useProjectStore } from '@/stores/useProjectStore'
import { buildCompositionPropsFromStores } from '@/services/compositionBuilder'
import { exportVideo } from '@/services/videoExport'
import { useRecordingsStore } from '@/stores/useRecordingsStore'

// Gemini 3 Flash pricing (USD per 1M tokens)
const GEMINI_FLASH_INPUT_PRICE = 0.1
const GEMINI_FLASH_OUTPUT_PRICE = 0.4

const DEFAULT_SETTINGS: OrchestratorSettings = {
  aspectRatio: '16:9' as OrchestratorAspectRatio,
  durationSeconds: 0,
  fps: 0,
  useGoogleSearch: false,
  generateMusic: true,
  generateSVGAnimations: true,
  generateSVGAssets: true,
  generateStockAssets: true,
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
}

const EMPTY_COST: OrchestrationCost = { entries: [], totalCost: 0, totalCredits: 0 }

export interface DashboardClip {
  id: string
  prompt: string
  phase: OrchestratorPhase
  plan: ClipPlan | null
  steps: OrchestratorStep[]
  error: string | null
  isRunning: boolean
  cost: OrchestrationCost
  settings: OrchestratorSettings
  createdAt: number
  savedProjectId: string | null
  isSaving: boolean
  saveError: string | null
  // Royalty distribution result
  royaltyResult: { royalty_pool: number; creator_count: number } | null
  // A/B variant grouping
  variantGroupId: string | null
  variantLabel: string | null
  // Auto-export after execution
  recordingId: string | null
  isExporting: boolean
  exportError: string | null
  exportProgress: number // 0-100
  // Composition snapshot for instant Remotion Player preview
  compositionSnapshot: VideoCompositionProps | null
  // Auto-generated thumbnail URL
  thumbnailUrl: string | null
  // Series group ID (clips with the same seriesId belong to the same series)
  seriesId: string | null
}

// Composition snapshots stored outside the reactive state to avoid copying
// large VideoCompositionProps objects on every clip update.
const compositionSnapshots = new Map<string, VideoCompositionProps>()

/** Get a composition snapshot for a clip (outside reactive state) */
export function getCompositionSnapshot(clipId: string): VideoCompositionProps | null {
  return compositionSnapshots.get(clipId) ?? null
}

interface DashboardState {
  clips: DashboardClip[]
  expandedClipId: string | null

  // Execution queue (sequential, one at a time)
  executionQueue: string[]
  executingClipId: string | null

  // Clip CRUD
  addClip: () => string
  removeClip: (clipId: string) => void
  setExpandedClip: (clipId: string | null) => void

  // Per-clip actions
  setClipPrompt: (clipId: string, prompt: string) => void
  updateClipSettings: (clipId: string, updates: Partial<OrchestratorSettings>) => void
  generateClipPlanAction: (clipId: string) => Promise<void>
  resetClip: (clipId: string) => void

  // Batch actions
  addBatchClips: (prompts: string[], sharedSettings: OrchestratorSettings) => string[]
  generateAllPending: () => Promise<void>
  executeAllReviewed: () => void

  // Execution queue
  queueClipForExecution: (clipId: string) => void
  retryClipFromStep: (clipId: string, stepIndex: number) => void
  skipClipStep: (clipId: string, stepIndex: number) => void

  // Internal helpers
  _updateClip: (clipId: string, updates: Partial<DashboardClip>) => void
  _addClipCostEntry: (clipId: string, entry: CostEntry) => void
  _processQueue: () => void
}

let clipCounter = 0

function makeClipId(): string {
  clipCounter += 1
  return `clip_${Date.now()}_${clipCounter}`
}

export const useDashboardStore = create<DashboardState>()(
  immer((set, get) => ({
    clips: [],
    expandedClipId: null,
    executionQueue: [],
    executingClipId: null,

    // ── CRUD ──

    addClip: () => {
      const id = makeClipId()
      const clip: DashboardClip = {
        id,
        prompt: '',
        phase: 'idle',
        plan: null,
        steps: [],
        error: null,
        isRunning: false,
        cost: { ...EMPTY_COST },
        settings: { ...DEFAULT_SETTINGS },
        createdAt: Date.now(),
        savedProjectId: null,
        isSaving: false,
        saveError: null,
        royaltyResult: null,
        variantGroupId: null,
        variantLabel: null,
        recordingId: null,
        isExporting: false,
        exportError: null,
        exportProgress: 0,
        compositionSnapshot: null,
        thumbnailUrl: null,
        seriesId: null,
      }
      set((state) => {
        state.clips.unshift(clip)
        state.expandedClipId = id
      })
      return id
    },

    removeClip: (clipId) => {
      compositionSnapshots.delete(clipId)
      set((state) => {
        state.clips = state.clips.filter((c) => c.id !== clipId)
        if (state.expandedClipId === clipId) state.expandedClipId = null
        state.executionQueue = state.executionQueue.filter((id) => id !== clipId)
      })
    },

    setExpandedClip: (clipId) => set({ expandedClipId: clipId }),

    // ── Per-clip helpers ──
    // With Immer, only the mutated clip gets a new reference — other clips keep identity.

    _updateClip: (clipId, updates) => {
      set((state) => {
        const clip = state.clips.find((c) => c.id === clipId)
        if (clip) Object.assign(clip, updates)
      })
    },

    _addClipCostEntry: (clipId, entry) => {
      set((state) => {
        const clip = state.clips.find((c) => c.id === clipId)
        if (clip) {
          clip.cost.entries.push(entry)
          clip.cost.totalCost = clip.cost.entries.reduce((sum, e) => sum + e.cost, 0)
        }
      })
    },

    // ── Per-clip actions ──

    setClipPrompt: (clipId, prompt) => get()._updateClip(clipId, { prompt }),

    updateClipSettings: (clipId, updates) => {
      set((state) => {
        const clip = state.clips.find((c) => c.id === clipId)
        if (clip) Object.assign(clip.settings, updates)
      })
    },

    generateClipPlanAction: async (clipId) => {
      const clip = get().clips.find((c) => c.id === clipId)
      if (!clip || !clip.prompt.trim() || clip.isRunning) return

      get()._updateClip(clipId, {
        phase: 'planning',
        error: null,
        isRunning: true,
        cost: { ...EMPTY_COST },
      })

      try {
        // Gather context
        const allSavedChars = useSavedCharactersStore.getState().characters
        const savedNames = allSavedChars.map((c) => c.name)
        const selectedCharacterNames = clip.settings.selectedCharacterIds
          .map((id) => allSavedChars.find((c) => c.id === id)?.name)
          .filter((name): name is string => !!name)

        // Load voices if needed
        const voiceState = useVoiceStore.getState()
        if (voiceState.availableVoices.length === 0) {
          try {
            await voiceState.fetchVoices()
          } catch {
            /* non-fatal */
          }
        }
        const voiceNames = useVoiceStore.getState().availableVoices.map((v) => v.name)

        // Auto-inject learning context when useSmartDefaults is enabled
        const effectiveSettings = { ...clip.settings }
        if (clip.settings.useSmartDefaults && !clip.settings.learningContext) {
          const learningContext = useLearningStore.getState().getLearningContext()
          if (
            learningContext.recommendedAspectRatio ||
            learningContext.recommendedDuration ||
            learningContext.performanceInsights?.length
          ) {
            effectiveSettings.learningContext = learningContext
          }
        }

        const { plan, tokenUsage } = await generateClipPlan(clip.prompt, {
          savedCharacterNames: savedNames,
          selectedCharacterNames,
          voiceNames,
          settings: effectiveSettings,
        })

        // Track cost
        if (tokenUsage) {
          const inputCost = (tokenUsage.promptTokenCount / 1_000_000) * GEMINI_FLASH_INPUT_PRICE
          const outputCost = (tokenUsage.candidatesTokenCount / 1_000_000) * GEMINI_FLASH_OUTPUT_PRICE
          get()._addClipCostEntry(clipId, {
            source: 'gemini',
            label: 'Plan Generation',
            cost: inputCost + outputCost,
            tokenUsage,
          })
        }

        const steps = buildStepsFromPlan(plan, clip.settings)

        get()._updateClip(clipId, {
          plan,
          steps,
          phase: 'reviewing',
          isRunning: false,
          error: null,
        })
      } catch (err) {
        get()._updateClip(clipId, {
          phase: 'error',
          error: err instanceof Error ? err.message : 'Failed to generate plan',
          isRunning: false,
        })
      }
    },

    resetClip: (clipId) => {
      get()._updateClip(clipId, {
        prompt: '',
        phase: 'idle',
        plan: null,
        steps: [],
        error: null,
        isRunning: false,
        cost: { ...EMPTY_COST },
        savedProjectId: null,
        isSaving: false,
        saveError: null,
        royaltyResult: null,
        variantGroupId: null,
        variantLabel: null,
        recordingId: null,
        isExporting: false,
        exportError: null,
        exportProgress: 0,
        compositionSnapshot: null,
        thumbnailUrl: null,
        seriesId: null,
      })
    },

    // ── Batch Actions ──

    addBatchClips: (prompts, sharedSettings) => {
      const ids: string[] = []
      const newClips: DashboardClip[] = prompts.map((prompt) => {
        const id = makeClipId()
        ids.push(id)
        return {
          id,
          prompt: prompt.trim(),
          phase: 'idle' as const,
          plan: null,
          steps: [],
          error: null,
          isRunning: false,
          cost: { ...EMPTY_COST },
          settings: { ...sharedSettings },
          createdAt: Date.now(),
          savedProjectId: null,
          isSaving: false,
          saveError: null,
          royaltyResult: null,
          variantGroupId: null,
          variantLabel: null,
          recordingId: null,
          isExporting: false,
          exportError: null,
          exportProgress: 0,
          compositionSnapshot: null,
          thumbnailUrl: null,
          seriesId: null,
        }
      })
      set((state) => {
        state.clips.unshift(...newClips)
        state.expandedClipId = null
      })
      return ids
    },

    generateAllPending: async () => {
      const pendingClips = get().clips.filter((c) => c.phase === 'idle' && c.prompt.trim() && !c.isRunning)
      if (pendingClips.length === 0) return

      // Fire all plan generations in parallel
      await Promise.allSettled(pendingClips.map((clip) => get().generateClipPlanAction(clip.id)))
    },

    executeAllReviewed: () => {
      const reviewedClips = get().clips.filter((c) => c.phase === 'reviewing' && c.plan)
      for (const clip of reviewedClips) {
        get().queueClipForExecution(clip.id)
      }
    },

    // ── Execution Queue ──

    queueClipForExecution: (clipId) => {
      const clip = get().clips.find((c) => c.id === clipId)
      if (!clip?.plan) return

      // Mark the clip as queued
      get()._updateClip(clipId, { phase: 'executing', isRunning: true, error: null })

      set((state) => {
        state.executionQueue.push(clipId)
      })

      // Start processing if nothing is currently executing
      if (!get().executingClipId) {
        get()._processQueue()
      }
    },

    retryClipFromStep: (clipId, stepIndex) => {
      const clip = get().clips.find((c) => c.id === clipId)
      if (!clip?.plan || clip.isRunning) return

      // Reset failed steps via Immer (but preserve skipped steps)
      set((state) => {
        const c = state.clips.find((c) => c.id === clipId)
        if (c) {
          for (let i = stepIndex; i < c.steps.length; i++) {
            if (c.steps[i].status !== 'skipped') {
              c.steps[i].status = 'pending'
              c.steps[i].error = undefined
            }
          }
          c.phase = 'executing'
          c.isRunning = true
          c.error = null
        }
      })

      // Queue for execution with a retry marker
      set((state) => {
        state.executionQueue.push(`${clipId}:retry:${stepIndex}`)
      })

      if (!get().executingClipId) {
        get()._processQueue()
      }
    },

    skipClipStep: (clipId, stepIndex) => {
      const clip = get().clips.find((c) => c.id === clipId)
      if (!clip?.plan) return

      // Mark step as skipped
      set((state) => {
        const c = state.clips.find((c) => c.id === clipId)
        if (c) {
          c.steps[stepIndex].status = 'skipped'
          c.steps[stepIndex].error = undefined
          c.error = null
        }
      })

      // If in error phase, resume from the next step
      if (clip.phase === 'error') {
        get().retryClipFromStep(clipId, stepIndex + 1)
      }
    },

    _processQueue: async () => {
      const { executionQueue } = get()
      if (executionQueue.length === 0) {
        set({ executingClipId: null })
        return
      }

      // Dequeue the next clip
      const [nextEntry, ...remainingQueue] = executionQueue
      const isRetry = nextEntry.includes(':retry:')
      const clipId = isRetry ? nextEntry.split(':retry:')[0] : nextEntry
      const retryFromIndex = isRetry ? parseInt(nextEntry.split(':retry:')[1], 10) : 0

      set({ executionQueue: remainingQueue, executingClipId: clipId })

      const clip = get().clips.find((c) => c.id === clipId)
      if (!clip?.plan) {
        // Skip invalid clip, process next
        set({ executingClipId: null })
        get()._processQueue()
        return
      }

      // Delegate execution to the singleton orchestrator store.
      // This resets global editor stores and runs the full pipeline.
      const orchStore = useOrchestratorStore

      // Every clip in a batch must save as its OWN Supabase project. Without this reset the
      // orchestrator's saveClip() sees a lingering currentProjectId from the previous clip,
      // skips create(), and overwrites that project with this clip's content — so the user
      // ends up with a single project instead of N. Also wipe content stores so clip N doesn't
      // inherit characters / overlays / media from clip N-1.
      if (!isRetry) {
        useProjectStore.getState().resetAllStores()
        useProjectStore.setState({ currentProjectId: null, currentProjectName: 'Untitled Project', lastSaved: null })
      }

      // Load the clip's plan into the singleton orchestrator.
      // IMPORTANT: phase must be 'idle' and isRunning must be false so that
      // executePlan() / retryFromStep() don't bail on their isRunning guard.
      orchStore.setState({
        prompt: clip.prompt,
        plan: clip.plan,
        steps: clip.steps.map((s, i) =>
          i < retryFromIndex ? s : { ...s, status: 'pending' as const, error: undefined },
        ),
        phase: 'idle',
        isRunning: false,
        error: null,
        cost: { ...EMPTY_COST },
        settings: clip.settings,
        isSaving: false,
        saveError: null,
        savedProjectId: null,
        royaltyResult: null,
      })

      // Subscribe to orchestrator step updates and mirror them to the dashboard clip.
      // Throttle updates to avoid cascading re-renders on every micro state change.
      let throttleTimer: ReturnType<typeof setTimeout> | null = null
      let pendingOrchState: typeof orchStore extends { getState: () => infer S } ? S : never = null as any
      const flushUpdate = () => {
        throttleTimer = null
        if (!pendingOrchState) return
        const currentClip = get().clips.find((c) => c.id === clipId)
        if (!currentClip) return
        get()._updateClip(clipId, {
          steps: pendingOrchState.steps,
          phase: pendingOrchState.phase,
          error: pendingOrchState.error,
          cost: pendingOrchState.cost,
          isRunning: pendingOrchState.isRunning,
          isSaving: pendingOrchState.isSaving,
          saveError: pendingOrchState.saveError,
          savedProjectId: pendingOrchState.savedProjectId,
        })
      }
      const unsubscribe = orchStore.subscribe((orchState) => {
        pendingOrchState = orchState
        // Always flush immediately on phase transitions (step done/error)
        const isPhaseChange = orchState.phase !== get().clips.find((c) => c.id === clipId)?.phase
        const hasNewStepDone = orchState.steps.some((s, i) => {
          const prev = get().clips.find((c) => c.id === clipId)?.steps[i]
          return prev && prev.status !== s.status && (s.status === 'done' || s.status === 'error')
        })
        if (isPhaseChange || hasNewStepDone) {
          if (throttleTimer) {
            clearTimeout(throttleTimer)
            throttleTimer = null
          }
          flushUpdate()
        } else if (!throttleTimer) {
          throttleTimer = setTimeout(flushUpdate, 150)
        }
      })

      try {
        try {
          if (isRetry) {
            await orchStore.getState().retryFromStep(retryFromIndex)
          } else {
            await orchStore.getState().executePlan()
          }
        } catch (err) {
          console.error(`[Dashboard] Execution failed for clip ${clipId}:`, err)
        }

        unsubscribe()
        if (throttleTimer) {
          clearTimeout(throttleTimer)
          throttleTimer = null
        }

        // Mirror final state
        const finalOrchState = orchStore.getState()
        get()._updateClip(clipId, {
          steps: finalOrchState.steps,
          phase: finalOrchState.phase,
          error: finalOrchState.error,
          cost: finalOrchState.cost,
          isRunning: false,
          isSaving: false,
          savedProjectId: finalOrchState.savedProjectId,
        })

        // ── Snapshot + background export ──────────────────────────────────────
        // Global stores still hold this clip's content right now.
        // 1. Snapshot composition props IMMEDIATELY (instant) for Remotion Player preview
        // 2. Fire export as non-blocking background task (don't block next clip)
        if (finalOrchState.phase === 'done') {
          const compositionProps = buildCompositionPropsFromStores()

          // Store snapshot outside reactive state (large object, avoid copy overhead)
          compositionSnapshots.set(clipId, compositionProps)
          get()._updateClip(clipId, {
            compositionSnapshot: null, // keep null in reactive state, use getCompositionSnapshot()
            isExporting: true,
            exportError: null,
            exportProgress: 0,
          })

          // Fire-and-forget: export runs in background while next clip starts
          const savedProjectId = finalOrchState.savedProjectId
          const clipPrompt = get().clips.find((c) => c.id === clipId)?.prompt || 'Clip'

          void (async () => {
            try {
              const { width: srcW, height: srcH, fps, durationInFrames } = compositionProps

              // Batch/dashboard exports target mass-production, not archival — cap the long edge at 1280px
              // (720p-class) and drop the bitrate multiplier by choosing quality 0.5. This yields ~4-5x
              // smaller files than 1080p @ quality 1.0 while staying above social-upload minimums.
              const MAX_LONG_EDGE = 1280
              const longEdge = Math.max(srcW, srcH)
              const scale = longEdge > MAX_LONG_EDGE ? MAX_LONG_EDGE / longEdge : 1
              // Video encoders require even dimensions — round to nearest even number.
              const width = Math.max(2, Math.round((srcW * scale) / 2) * 2)
              const height = Math.max(2, Math.round((srcH * scale) / 2) * 2)

              const result = await exportVideo(
                compositionProps,
                {
                  width,
                  height,
                  fps,
                  durationInFrames,
                  format: 'mp4',
                  quality: 0.5,
                },
                (progress) => {
                  // Update export progress on the clip for UI
                  get()._updateClip(clipId, {
                    exportProgress: progress.percentage,
                  })
                },
              )

              // Fetch the blob for saving to recordings store
              const resp = await fetch(result.url)
              const blob = await resp.blob()
              const recId = `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

              // Generate thumbnail from first frame
              let thumbnailBlob: Blob | undefined
              try {
                const video = document.createElement('video')
                video.src = result.url
                video.muted = true
                video.preload = 'auto'
                await new Promise<void>((res, rej) => {
                  video.onloadeddata = () => res()
                  video.onerror = () => rej()
                  setTimeout(rej, 5000)
                })
                video.currentTime = 0
                await new Promise<void>((res) => {
                  video.onseeked = () => res()
                  setTimeout(res, 2000)
                })
                const canvas = document.createElement('canvas')
                canvas.width = 320
                canvas.height = Math.round(320 * (height / width))
                const ctx = canvas.getContext('2d')
                if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                  thumbnailBlob = await new Promise<Blob | undefined>((res) =>
                    canvas.toBlob((b) => res(b ?? undefined), 'image/jpeg', 0.7),
                  )
                }
              } catch {
                // thumbnail generation failed, proceed without
              }

              // Save to recordings store
              useRecordingsStore.getState().addRecording(
                {
                  id: recId,
                  name: `Dashboard — ${clipPrompt.slice(0, 50)}`,
                  format: result.actualFormat as 'webm' | 'mp4',
                  width,
                  height,
                  fps,
                  durationSec: durationInFrames / fps,
                  fileSize: blob.size,
                  createdAt: new Date().toISOString(),
                  projectId: savedProjectId || null,
                  projectName: null,
                  thumbnailUrl: null,
                  videoUrl: null,
                },
                blob,
                thumbnailBlob,
              )

              get()._updateClip(clipId, {
                recordingId: recId,
                isExporting: false,
                exportError: null,
                exportProgress: 100,
              })

              console.log(`[Dashboard] Auto-export complete for clip ${clipId} → recording ${recId}`)
            } catch (err) {
              console.error(`[Dashboard] Auto-export failed for clip ${clipId}:`, err)
              get()._updateClip(clipId, {
                isExporting: false,
                exportError: err instanceof Error ? err.message : 'Export failed',
              })
            }
          })()
        }
      } finally {
        // Always clean up executingClipId and process next, even if an error occurs
        set({ executingClipId: null })
        get()._processQueue()
      }
    },
  })),
)
