import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { persist } from 'zustand/middleware'
import {
  analyzeBusinessURL,
  fetchSocialPresence,
  fetchMentions,
  discoverCompetitors,
  analyzeCompetitor,
  fetchCompetitiveAnalysis,
  fetchNicheTrends,
  generateVideoIdeas,
  analyzeViralityEvidence,
  buildBrandAwarePrompt,
} from '@/services/brandDirector'
import type {
  BrandProfile,
  BrandImage,
  SocialPresence,
  MentionsSummary,
  CompetitorProfile,
  CompetitiveAnalysis,
  TrendData,
  VideoIdea,
  ViralityEvidence,
  BrandIntelSection,
  BrandIntelPhase,
} from '@/types/brandDirector'

export interface AnalysisStep {
  id: string
  label: string
  status: 'pending' | 'running' | 'done' | 'failed'
}

interface BrandIntelState {
  // Input
  brandUrl: string
  phase: BrandIntelPhase
  error: string | null
  analysisSteps: AnalysisStep[]

  // Results
  profile: BrandProfile | null
  images: BrandImage[]
  socialPresence: SocialPresence | null
  isSocialLoading: boolean
  mentionsSummary: MentionsSummary | null
  isMentionsLoading: boolean
  discoveredCompetitors: Array<{ name: string; url: string; relevance: number; reason?: string }>
  competitorProfiles: CompetitorProfile[]
  isCompetitorsLoading: boolean
  competitiveAnalysis: CompetitiveAnalysis | null
  isAnalysisLoading: boolean
  trends: TrendData | null
  isTrendsLoading: boolean
  viralityEvidence: ViralityEvidence | null
  isViralityLoading: boolean
  ideas: VideoIdea[]
  isIdeasLoading: boolean
  selectedIdeaId: string | null

  // UI
  activeSection: BrandIntelSection

  // Actions
  setBrandUrl: (url: string) => void
  setActiveSection: (section: BrandIntelSection) => void
  analyzeFullBrand: () => Promise<void>
  refreshSocialPresence: () => Promise<void>
  refreshMentions: () => Promise<void>
  refreshCompetitors: () => Promise<void>
  refreshAnalysis: () => Promise<void>
  refreshTrends: () => Promise<void>
  refreshViralityEvidence: () => Promise<void>
  refreshIdeas: () => Promise<void>
  addCompetitorManually: (url: string) => Promise<void>
  removeCompetitor: (id: string) => void
  selectIdea: (id: string) => void
  getSelectedIdeaPrompt: () => string | null
  reset: () => void
}

const ANALYSIS_STEPS: AnalysisStep[] = [
  { id: 'website', label: 'Analyzing website', status: 'pending' },
  { id: 'social', label: 'Finding social accounts', status: 'pending' },
  { id: 'trends', label: 'Scraping viral videos', status: 'pending' },
  { id: 'competitors', label: 'Discovering competitors', status: 'pending' },
  { id: 'analysis', label: 'Competitive analysis', status: 'pending' },
  { id: 'virality', label: 'Analyzing virality', status: 'pending' },
  { id: 'ideas', label: 'Generating video ideas', status: 'pending' },
]

const INITIAL_STATE = {
  brandUrl: '',
  phase: 'idle' as BrandIntelPhase,
  error: null as string | null,
  analysisSteps: [] as AnalysisStep[],
  profile: null as BrandProfile | null,
  images: [] as BrandImage[],
  socialPresence: null as SocialPresence | null,
  isSocialLoading: false,
  mentionsSummary: null as MentionsSummary | null,
  isMentionsLoading: false,
  discoveredCompetitors: [] as Array<{ name: string; url: string; relevance: number; reason?: string }>,
  competitorProfiles: [] as CompetitorProfile[],
  isCompetitorsLoading: false,
  competitiveAnalysis: null as CompetitiveAnalysis | null,
  isAnalysisLoading: false,
  trends: null as TrendData | null,
  isTrendsLoading: false,
  viralityEvidence: null as ViralityEvidence | null,
  isViralityLoading: false,
  ideas: [] as VideoIdea[],
  isIdeasLoading: false,
  selectedIdeaId: null as string | null,
  activeSection: 'overview' as BrandIntelSection,
}

export const useBrandIntelStore = create<BrandIntelState>()(
  persist(
    immer((set, get) => ({
      ...INITIAL_STATE,

      setBrandUrl: (url) => set({ brandUrl: url }),

      setActiveSection: (section) => set({ activeSection: section }),

      analyzeFullBrand: async () => {
        const { brandUrl } = get()
        if (!brandUrl.trim()) {
          set({ error: 'Please enter a URL', phase: 'error' })
          return
        }

        const stepUpdate = (stepId: string, status: AnalysisStep['status']) => {
          set((s) => {
            const step = s.analysisSteps.find((st) => st.id === stepId)
            if (step) step.status = status
          })
        }

        try {
          set({ phase: 'analyzing', error: null, activeSection: 'overview', analysisSteps: ANALYSIS_STEPS.map((s) => ({ ...s, status: 'pending' as const })) })

          // Step 1: Analyze URL
          stepUpdate('website', 'running')
          const { profile, images } = await analyzeBusinessURL(brandUrl)
          set({ profile, images })
          stepUpdate('website', 'done')

          // Step 2: In parallel — social presence, mentions, competitor discovery
          const keywords = [profile.niche, profile.industry, ...profile.products.slice(0, 2)].filter(Boolean)

          set({ isSocialLoading: true, isMentionsLoading: true, isCompetitorsLoading: true, isTrendsLoading: true })
          stepUpdate('social', 'running')
          stepUpdate('trends', 'running')
          stepUpdate('competitors', 'running')

          const [socialResult, mentionsResult, competitorsResult, trendsResult] = await Promise.allSettled([
            fetchSocialPresence(profile.businessName, brandUrl),
            fetchMentions(profile.businessName, keywords, profile.industry),
            discoverCompetitors(profile.businessName, profile.industry, profile.niche, profile.products),
            fetchNicheTrends(keywords, profile.industry, profile.niche),
          ])

          if (socialResult.status === 'fulfilled') {
            set({ socialPresence: socialResult.value })
          }
          set({ isSocialLoading: false })
          stepUpdate('social', socialResult.status === 'fulfilled' ? 'done' : 'failed')

          if (mentionsResult.status === 'fulfilled') {
            set({ mentionsSummary: mentionsResult.value })
          }
          set({ isMentionsLoading: false })

          if (trendsResult.status === 'fulfilled') {
            set({ trends: trendsResult.value })
          } else {
            console.error('[BrandIntel] Trends fetch failed:', trendsResult.reason)
          }
          set({ isTrendsLoading: false })
          stepUpdate('trends', trendsResult.status === 'fulfilled' ? 'done' : 'failed')

          // Step 3: Analyze each discovered competitor
          let competitorProfiles: CompetitorProfile[] = []
          if (competitorsResult.status === 'fulfilled') {
            const discovered = competitorsResult.value
            set({ discoveredCompetitors: discovered, isCompetitorsLoading: true })

            const analyzeResults = await Promise.allSettled(
              discovered.slice(0, 5).map((c) => analyzeCompetitor(c.url))
            )
            competitorProfiles = analyzeResults
              .filter((r): r is PromiseFulfilledResult<CompetitorProfile> => r.status === 'fulfilled')
              .map((r) => r.value)
            set({ competitorProfiles })
          }
          set({ isCompetitorsLoading: false })
          stepUpdate('competitors', competitorProfiles.length > 0 ? 'done' : (competitorsResult.status === 'fulfilled' ? 'done' : 'failed'))

          // Step 4: Competitive analysis
          if (competitorProfiles.length > 0) {
            stepUpdate('analysis', 'running')
            set({ isAnalysisLoading: true })
            try {
              const analysis = await fetchCompetitiveAnalysis(profile, competitorProfiles)
              set({ competitiveAnalysis: analysis })
              stepUpdate('analysis', 'done')
            } catch (err) {
              console.warn('[BrandIntel] Competitive analysis failed:', err)
              stepUpdate('analysis', 'failed')
            }
            set({ isAnalysisLoading: false })
          } else {
            stepUpdate('analysis', 'done')
          }

          // Step 5: Analyze virality of trending videos
          const { trends } = get()
          let evidence: ViralityEvidence | null = null
          if (trends && trends.items.length > 0) {
            stepUpdate('virality', 'running')
            set({ isViralityLoading: true })
            try {
              evidence = await analyzeViralityEvidence(trends.items, profile.industry, profile.niche)
              set({ viralityEvidence: evidence })
              stepUpdate('virality', 'done')
            } catch (err) {
              console.warn('[BrandIntel] Virality analysis failed:', err)
              stepUpdate('virality', 'failed')
            }
            set({ isViralityLoading: false })
          } else {
            stepUpdate('virality', 'done')
          }

          // Step 6: Generate ideas (with virality evidence)
          const latestTrends = get().trends
          if (latestTrends && latestTrends.items.length > 0) {
            stepUpdate('ideas', 'running')
            set({ isIdeasLoading: true })
            try {
              const { ideas } = await generateVideoIdeas(profile, latestTrends, 6, evidence)
              set({ ideas })
              stepUpdate('ideas', 'done')
            } catch (err) {
              console.warn('[BrandIntel] Idea generation failed:', err)
              stepUpdate('ideas', 'failed')
            }
            set({ isIdeasLoading: false })
          } else {
            stepUpdate('ideas', 'done')
          }

          set({ phase: 'ready' })
        } catch (err) {
          console.error('[BrandIntel] Pipeline error:', err)
          set({
            phase: 'error',
            error: err instanceof Error ? err.message : 'Something went wrong',
            isSocialLoading: false,
            isMentionsLoading: false,
            isCompetitorsLoading: false,
            isAnalysisLoading: false,
            isTrendsLoading: false,
            isViralityLoading: false,
            isIdeasLoading: false,
          })
        }
      },

      refreshSocialPresence: async () => {
        const { profile, brandUrl } = get()
        if (!profile) return
        set({ isSocialLoading: true })
        try {
          const result = await fetchSocialPresence(profile.businessName, brandUrl)
          set({ socialPresence: result })
        } catch (err) {
          console.warn('[BrandIntel] Social refresh failed:', err)
        }
        set({ isSocialLoading: false })
      },

      refreshMentions: async () => {
        const { profile } = get()
        if (!profile) return
        set({ isMentionsLoading: true })
        try {
          const keywords = [profile.niche, profile.industry, ...profile.products.slice(0, 2)].filter(Boolean)
          const result = await fetchMentions(profile.businessName, keywords, profile.industry)
          set({ mentionsSummary: result })
        } catch (err) {
          console.warn('[BrandIntel] Mentions refresh failed:', err)
        }
        set({ isMentionsLoading: false })
      },

      refreshCompetitors: async () => {
        const { profile } = get()
        if (!profile) return
        set({ isCompetitorsLoading: true })
        try {
          const discovered = await discoverCompetitors(profile.businessName, profile.industry, profile.niche, profile.products)
          set({ discoveredCompetitors: discovered })
          const results = await Promise.allSettled(discovered.slice(0, 5).map((c) => analyzeCompetitor(c.url)))
          const profiles = results
            .filter((r): r is PromiseFulfilledResult<CompetitorProfile> => r.status === 'fulfilled')
            .map((r) => r.value)
          set({ competitorProfiles: profiles })
        } catch (err) {
          console.warn('[BrandIntel] Competitors refresh failed:', err)
        }
        set({ isCompetitorsLoading: false })
      },

      refreshAnalysis: async () => {
        const { profile, competitorProfiles } = get()
        if (!profile || competitorProfiles.length === 0) return
        set({ isAnalysisLoading: true })
        try {
          const analysis = await fetchCompetitiveAnalysis(profile, competitorProfiles)
          set({ competitiveAnalysis: analysis })
        } catch (err) {
          console.warn('[BrandIntel] Analysis refresh failed:', err)
        }
        set({ isAnalysisLoading: false })
      },

      refreshTrends: async () => {
        const { profile } = get()
        if (!profile) return
        set({ isTrendsLoading: true })
        try {
          const keywords = [profile.niche, profile.industry, ...profile.products.slice(0, 2)].filter(Boolean)
          const trends = await fetchNicheTrends(keywords, profile.industry, profile.niche)
          set({ trends })
        } catch (err) {
          console.warn('[BrandIntel] Trends refresh failed:', err)
        }
        set({ isTrendsLoading: false })
      },

      refreshViralityEvidence: async () => {
        const { profile, trends } = get()
        if (!profile || !trends || trends.items.length === 0) return
        set({ isViralityLoading: true })
        try {
          const evidence = await analyzeViralityEvidence(trends.items, profile.industry, profile.niche)
          set({ viralityEvidence: evidence })
        } catch (err) {
          console.warn('[BrandIntel] Virality refresh failed:', err)
        }
        set({ isViralityLoading: false })
      },

      refreshIdeas: async () => {
        const { profile, trends, viralityEvidence } = get()
        if (!profile || !trends) return
        set({ isIdeasLoading: true })
        try {
          const { ideas } = await generateVideoIdeas(profile, trends, 6, viralityEvidence)
          set({ ideas })
        } catch (err) {
          console.warn('[BrandIntel] Ideas refresh failed:', err)
        }
        set({ isIdeasLoading: false })
      },

      addCompetitorManually: async (url) => {
        set({ isCompetitorsLoading: true })
        try {
          const profile = await analyzeCompetitor(url)
          profile.source = 'manual'
          set((s) => { s.competitorProfiles.push(profile) })
        } catch (err) {
          console.warn('[BrandIntel] Manual competitor add failed:', err)
        }
        set({ isCompetitorsLoading: false })
      },

      removeCompetitor: (id) => {
        set((s) => {
          s.competitorProfiles = s.competitorProfiles.filter((c) => c.id !== id)
        })
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
    {
      name: 'proanimate-brand-intel',
      partialize: (state) => ({
        brandUrl: state.brandUrl,
        profile: state.profile,
        images: state.images,
        socialPresence: state.socialPresence,
        mentionsSummary: state.mentionsSummary,
        discoveredCompetitors: state.discoveredCompetitors,
        competitorProfiles: state.competitorProfiles,
        competitiveAnalysis: state.competitiveAnalysis,
        trends: state.trends,
        viralityEvidence: state.viralityEvidence,
        ideas: state.ideas,
        selectedIdeaId: state.selectedIdeaId,
        activeSection: state.activeSection,
        phase: state.phase === 'analyzing' ? 'idle' : state.phase,
      }),
    },
  ),
)
