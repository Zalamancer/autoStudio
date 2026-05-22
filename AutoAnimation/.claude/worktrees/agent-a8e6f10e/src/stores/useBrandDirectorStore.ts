import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  analyzeBusinessURL,
  fetchNicheTrends,
  generateVideoIdeas,
  buildBrandAwarePrompt,
} from '@/services/brandDirector'
import type {
  BrandProfile,
  BrandImage,
  TrendData,
  VideoIdea,
  BrandDirectorPhase,
} from '@/types/brandDirector'

interface BrandDirectorState {
  // Input
  url: string

  // Phase tracking
  phase: BrandDirectorPhase
  error: string | null

  // Results
  profile: BrandProfile | null
  images: BrandImage[]
  trends: TrendData | null
  ideas: VideoIdea[]

  // UI state
  selectedIdeaId: string | null
  isExpanded: boolean

  // Actions
  setUrl: (url: string) => void
  setExpanded: (expanded: boolean) => void
  /** Run full pipeline: analyze URL → fetch trends → generate ideas */
  analyze: () => Promise<void>
  selectIdea: (id: string) => void
  /** Build a brand-aware prompt from the selected idea */
  getSelectedIdeaPrompt: () => string | null
  reset: () => void
}

const INITIAL_STATE = {
  url: '',
  phase: 'idle' as BrandDirectorPhase,
  error: null,
  profile: null,
  images: [],
  trends: null,
  ideas: [],
  selectedIdeaId: null,
  isExpanded: false,
}

export const useBrandDirectorStore = create<BrandDirectorState>()(
  immer((set, get) => ({
    ...INITIAL_STATE,

    setUrl: (url) => set({ url }),

    setExpanded: (expanded) => set({ isExpanded: expanded }),

    analyze: async () => {
      const { url } = get()
      if (!url.trim()) {
        set({ error: 'Please enter a URL', phase: 'error' })
        return
      }

      try {
        // Phase 1: Analyze URL
        set({ phase: 'analyzing-url', error: null, ideas: [], selectedIdeaId: null, trends: null, profile: null, images: [] })

        const { profile, images } = await analyzeBusinessURL(url)
        set({ profile, images })

        // Phase 2: Fetch trends using niche keywords
        set({ phase: 'fetching-trends' })

        const keywords = [
          profile.niche,
          profile.industry,
          ...profile.products.slice(0, 2),
        ].filter(Boolean)

        const trends = await fetchNicheTrends(keywords, profile.industry, profile.niche)
        set({ trends })

        // Phase 3: Generate video ideas
        set({ phase: 'generating-ideas' })

        const { ideas } = await generateVideoIdeas(profile, trends, 5)
        set({ ideas, phase: 'ready' })
      } catch (err) {
        console.error('[BrandDirector] Pipeline error:', err)
        set({
          phase: 'error',
          error: err instanceof Error ? err.message : 'Something went wrong',
        })
      }
    },

    selectIdea: (id) => set({ selectedIdeaId: id }),

    getSelectedIdeaPrompt: () => {
      const { selectedIdeaId, ideas, profile, images } = get()
      if (!selectedIdeaId || !profile) return null

      const idea = ideas.find((i) => i.id === selectedIdeaId)
      if (!idea) return null

      return buildBrandAwarePrompt(idea, profile, images)
    },

    reset: () => set(INITIAL_STATE),
  })),
)
