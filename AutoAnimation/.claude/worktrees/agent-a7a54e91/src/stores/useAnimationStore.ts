import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useTimelineStore } from './useTimelineStore'
import { generateSVGAnimation, type ModelTier } from '@/services/svgAnimationAI'
import { safeLocalStorageSet } from '@/utils/storage'
import type { BlendMode } from '@/types/blendModes'
import type { BlurType } from '@/types/blurEffect'

export interface AnimationItem {
  id: string
  name: string
  url: string // .lottie or .json URL
  thumbnail?: string
  category: 'background' | 'overlay' | 'transition'
  tags: string[]
  duration?: number // in seconds
  description?: string
  animationData?: object // inline Lottie JSON (takes priority over url)
  svgHtml?: string // SVG+CSS animation HTML (takes priority over url and animationData)
  sourcePrompt?: string // Original AI prompt (for iteration)
  modelTier?: ModelTier // Model tier used to generate this animation
}

export interface GenerationJob {
  id: string
  prompt: string
  tier: ModelTier
  category?: 'background' | 'overlay' | 'transition'
  status: 'generating' | 'done' | 'error'
  progress: number // 0-1
  error?: string
  startedAt: number
  /** If iterating, the library item id being replaced */
  iterateTargetId?: string
}

// Expected durations per tier (seconds) — used for simulated progress
const TIER_EXPECTED_DURATION: Record<ModelTier, number> = {
  fast: 8,
  quality: 20,
  ultra: 45,
}

export interface ActiveAnimation {
  id: string
  animationId: string
  position: { x: number; y: number }
  scale: number
  opacity: number
  zIndex: number
  loop: boolean
  speed: number
  isPlaying: boolean
  startFrame: number
  endFrame: number
  blendMode?: BlendMode
  blur?: number
  blurType?: BlurType
  motionBlurAngle?: number
}

interface AnimationState {
  // Library of available animations
  library: AnimationItem[]

  // Currently active animations on canvas
  activeAnimations: ActiveAnimation[]

  // Selected animation in library
  selectedLibraryId: string | null

  // Selected active animation for editing
  selectedActiveId: string | null

  // Filter state
  categoryFilter: 'all' | 'background' | 'overlay' | 'transition'
  searchQuery: string

  // AI generation (parallel jobs)
  generationJobs: GenerationJob[]
  /** True if any job is currently generating (backward compat) */
  isGenerating: boolean
  generationError: string | null

  // Actions
  setLibrary: (animations: AnimationItem[]) => void
  /** Merge sample animations with persisted AI items (call once on mount) */
  initLibrary: (sampleAnimations: AnimationItem[]) => void
  addToLibrary: (animation: AnimationItem) => void
  removeFromLibrary: (id: string) => void

  addToCanvas: (animationId: string) => void
  removeFromCanvas: (id: string) => void
  updateActiveAnimation: (id: string, updates: Partial<ActiveAnimation>) => void
  clearCanvas: () => void

  setSelectedLibraryId: (id: string | null) => void
  setSelectedActiveId: (id: string | null) => void
  setCategoryFilter: (category: 'all' | 'background' | 'overlay' | 'transition') => void
  setSearchQuery: (query: string) => void

  // AI generation (parallel jobs)
  generateFromPrompt: (prompt: string, category?: 'background' | 'overlay' | 'transition', tier?: ModelTier) => void
  iterateAnimation: (id: string, newPrompt: string) => void
  dismissJob: (jobId: string) => void
  clearGenerationError: () => void

  // Time range
  setAnimationTimeRange: (id: string, startFrame: number, endFrame: number) => void

  // Playback sync
  playAllAnimations: () => void
  pauseAllAnimations: () => void

  // Computed
  getFilteredLibrary: () => AnimationItem[]
  getBackgroundAnimations: () => ActiveAnimation[]
  getOverlayAnimations: () => ActiveAnimation[]

  // Project persistence
  loadFromProject: (animations: Array<{
    id: string
    animationId: string
    url: string
    name: string
    category: 'background' | 'overlay'
    position: { x: number; y: number }
    scale: number
    opacity: number
    zIndex: number
    loop: boolean
    speed: number
  }>) => void

  // Template snapshot loading (same as loadFromProject)
  loadFromSnapshot: (animations: Array<{
    id: string
    animationId: string
    url: string
    name: string
    category: 'background' | 'overlay'
    position: { x: number; y: number }
    scale: number
    opacity: number
    zIndex: number
    loop: boolean
    speed: number
  }>) => void
}

// ── localStorage persistence for AI-generated animations ──

const STORAGE_KEY = 'proanimate:ai-animations'

function _loadPersistedAIItems(): AnimationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch { return [] }
}

function _persistAIItems(library: AnimationItem[]) {
  const aiItems = library.filter((a) => a.sourcePrompt)
  safeLocalStorageSet(STORAGE_KEY, JSON.stringify(aiItems))
}

/**
 * Start an interval that updates simulated progress for a generation job.
 * Uses an asymptotic curve: progress = 1 - e^(-elapsed / expected * 3)
 * This approaches ~95% at the expected duration and never hits 100% until snapped.
 */
function _startProgressTimer(
  jobId: string,
  tier: ModelTier,
  set: (fn: (state: AnimationState) => void) => void,
): ReturnType<typeof setInterval> {
  const expectedMs = TIER_EXPECTED_DURATION[tier] * 1000
  const startedAt = Date.now()
  return setInterval(() => {
    const elapsed = Date.now() - startedAt
    const progress = Math.min(0.95, 1 - Math.exp((-elapsed / expectedMs) * 3))
    set((state) => {
      const j = state.generationJobs.find((j) => j.id === jobId)
      if (j && j.status === 'generating') j.progress = progress
    })
  }, 300)
}

export const useAnimationStore = create<AnimationState>()(
  immer((set, get) => ({
    library: _loadPersistedAIItems(),
    activeAnimations: [],
    selectedLibraryId: null,
    selectedActiveId: null,
    categoryFilter: 'all',
    searchQuery: '',
    generationJobs: [],
    isGenerating: false,
    generationError: null,

    setLibrary: (animations) =>
      set((state) => {
        state.library = animations
      }),

    initLibrary: (sampleAnimations) =>
      set((state) => {
        // Keep existing AI-generated items, add samples that aren't already present
        const existingIds = new Set(state.library.map((a) => a.id))
        for (const sample of sampleAnimations) {
          if (!existingIds.has(sample.id)) {
            state.library.push(sample)
          }
        }
      }),

    addToLibrary: (animation) =>
      set((state) => {
        state.library.push(animation)
      }),

    removeFromLibrary: (id) => {
      set((state) => {
        const index = state.library.findIndex((a) => a.id === id)
        if (index !== -1) {
          state.library.splice(index, 1)
        }
      })
      _persistAIItems(get().library)
    },

    addToCanvas: (animationId) =>
      set((state) => {
        const animation = state.library.find((a) => a.id === animationId)
        if (!animation) return

        // Determine zIndex based on category
        const zIndex = animation.category === 'background' ? -1 : 10

        const totalFrames = useTimelineStore.getState().totalFrames

        const activeAnimation: ActiveAnimation = {
          id: `active_${Date.now()}`,
          animationId,
          position: { x: 0, y: 0 },
          scale: 1,
          opacity: 1,
          zIndex,
          loop: true,
          speed: 1,
          isPlaying: true,
          startFrame: 0,
          endFrame: totalFrames,
        }

        state.activeAnimations.push(activeAnimation)
        state.selectedActiveId = activeAnimation.id
      }),

    removeFromCanvas: (id) =>
      set((state) => {
        const index = state.activeAnimations.findIndex((a) => a.id === id)
        if (index !== -1) {
          state.activeAnimations.splice(index, 1)
        }
        if (state.selectedActiveId === id) {
          state.selectedActiveId = null
        }
      }),

    updateActiveAnimation: (id, updates) =>
      set((state) => {
        const animation = state.activeAnimations.find((a) => a.id === id)
        if (animation) {
          Object.assign(animation, updates)
        }
      }),

    clearCanvas: () =>
      set((state) => {
        state.activeAnimations = []
        state.selectedActiveId = null
      }),

    setSelectedLibraryId: (id) =>
      set((state) => {
        state.selectedLibraryId = id
      }),

    setSelectedActiveId: (id) =>
      set((state) => {
        state.selectedActiveId = id
      }),

    setCategoryFilter: (category) =>
      set((state) => {
        state.categoryFilter = category
      }),

    setSearchQuery: (query) =>
      set((state) => {
        state.searchQuery = query
      }),

    generateFromPrompt: (prompt, category, tier) => {
      const t = tier ?? 'fast'
      const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const job: GenerationJob = {
        id: jobId,
        prompt,
        tier: t,
        category,
        status: 'generating',
        progress: 0,
        startedAt: Date.now(),
      }
      set((state) => {
        state.generationJobs.push(job)
        state.isGenerating = true
        state.generationError = null
      })

      // Start simulated progress
      const progressInterval = _startProgressTimer(jobId, t, set)

      // Fire async generation
      generateSVGAnimation({ prompt, category, tier: t }).then((result) => {
        clearInterval(progressInterval)
        const id = `ai_svg_${Date.now()}`
        set((state) => {
          const j = state.generationJobs.find((j) => j.id === jobId)
          if (j) { j.status = 'done'; j.progress = 1 }
          state.isGenerating = state.generationJobs.some((j) => j.status === 'generating')
          state.library.push({
            id,
            name: result.name,
            url: '',
            category: result.category,
            tags: [...result.tags, 'ai-generated'],
            svgHtml: result.svgHtml,
            sourcePrompt: prompt,
            modelTier: t,
          })
        })
        _persistAIItems(get().library)
      }).catch((err: any) => {
        clearInterval(progressInterval)
        set((state) => {
          const j = state.generationJobs.find((j) => j.id === jobId)
          if (j) { j.status = 'error'; j.error = err?.message || 'Generation failed' }
          state.isGenerating = state.generationJobs.some((j) => j.status === 'generating')
          state.generationError = err?.message || 'Generation failed'
        })
      })
    },

    iterateAnimation: (id, newPrompt) => {
      const item = get().library.find((a) => a.id === id)
      if (!item) return
      const t = item.modelTier ?? 'fast'
      const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
      const job: GenerationJob = {
        id: jobId,
        prompt: newPrompt,
        tier: t,
        category: item.category,
        status: 'generating',
        progress: 0,
        startedAt: Date.now(),
        iterateTargetId: id,
      }
      set((state) => {
        state.generationJobs.push(job)
        state.isGenerating = true
        state.generationError = null
      })

      const progressInterval = _startProgressTimer(jobId, t, set)

      generateSVGAnimation({ prompt: newPrompt, category: item.category, tier: t }).then((result) => {
        clearInterval(progressInterval)
        set((state) => {
          const j = state.generationJobs.find((j) => j.id === jobId)
          if (j) { j.status = 'done'; j.progress = 1 }
          state.isGenerating = state.generationJobs.some((j) => j.status === 'generating')
          const target = state.library.find((a) => a.id === id)
          if (target) {
            target.svgHtml = result.svgHtml
            target.name = result.name
            target.tags = [...result.tags, 'ai-generated']
            target.sourcePrompt = newPrompt
          }
        })
        _persistAIItems(get().library)
      }).catch((err: any) => {
        clearInterval(progressInterval)
        set((state) => {
          const j = state.generationJobs.find((j) => j.id === jobId)
          if (j) { j.status = 'error'; j.error = err?.message || 'Iteration failed' }
          state.isGenerating = state.generationJobs.some((j) => j.status === 'generating')
          state.generationError = err?.message || 'Iteration failed'
        })
      })
    },

    dismissJob: (jobId) =>
      set((state) => {
        const idx = state.generationJobs.findIndex((j) => j.id === jobId)
        if (idx !== -1) state.generationJobs.splice(idx, 1)
      }),

    clearGenerationError: () =>
      set((state) => { state.generationError = null }),

    setAnimationTimeRange: (id, startFrame, endFrame) =>
      set((state) => {
        const anim = state.activeAnimations.find((a) => a.id === id)
        if (anim) {
          anim.startFrame = startFrame
          anim.endFrame = endFrame
        }
      }),

    playAllAnimations: () =>
      set((state) => {
        state.activeAnimations.forEach((a) => {
          a.isPlaying = true
        })
      }),

    pauseAllAnimations: () =>
      set((state) => {
        state.activeAnimations.forEach((a) => {
          a.isPlaying = false
        })
      }),

    getFilteredLibrary: () => {
      const { library, categoryFilter, searchQuery } = get()
      return library.filter((animation) => {
        // Category filter
        if (categoryFilter !== 'all' && animation.category !== categoryFilter) {
          return false
        }
        // Search filter
        if (searchQuery) {
          const query = searchQuery.toLowerCase()
          return (
            animation.name.toLowerCase().includes(query) ||
            animation.tags.some((tag) => tag.toLowerCase().includes(query)) ||
            animation.description?.toLowerCase().includes(query)
          )
        }
        return true
      })
    },

    getBackgroundAnimations: () => {
      const { activeAnimations, library } = get()
      return activeAnimations.filter((active) => {
        const libraryItem = library.find((a) => a.id === active.animationId)
        return libraryItem?.category === 'background'
      })
    },

    getOverlayAnimations: () => {
      const { activeAnimations, library } = get()
      return activeAnimations.filter((active) => {
        const libraryItem = library.find((a) => a.id === active.animationId)
        return libraryItem?.category === 'overlay'
      })
    },

    // Load from project
    loadFromProject: (animations) =>
      set((state) => {
        // Add animations to library if they don't exist
        for (const anim of animations) {
          if (!state.library.find((l) => l.url === anim.url)) {
            state.library.push({
              id: anim.animationId,
              name: anim.name,
              url: anim.url,
              category: anim.category,
              tags: [],
            })
          }
        }

        const totalFrames = useTimelineStore.getState().totalFrames

        // Set active animations
        state.activeAnimations = animations.map((anim) => ({
          id: anim.id,
          animationId: anim.animationId,
          position: anim.position,
          scale: anim.scale,
          opacity: anim.opacity,
          zIndex: anim.zIndex,
          loop: anim.loop,
          speed: anim.speed,
          isPlaying: true,
          startFrame: (anim as any).startFrame ?? 0,
          endFrame: (anim as any).endFrame ?? totalFrames,
        }))
      }),

    // loadFromSnapshot is an alias for loadFromProject
    loadFromSnapshot: (animations) => {
      get().loadFromProject(animations)
    },
  }))
)
