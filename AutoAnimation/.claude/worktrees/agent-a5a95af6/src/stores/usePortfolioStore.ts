/**
 * usePortfolioStore — State management for the Portfolio Platform feature.
 *
 * Manages published portfolio projects, profile settings, discovery browsing,
 * and the embeddable player configuration.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  PortfolioProject,
  PortfolioProfile,
  PortfolioDiscoveryFilters,
} from '@/types/portfolio'
import { DEFAULT_DISCOVERY_FILTERS } from '@/types/portfolio'

interface PortfolioState {
  // ── My portfolio ──
  myProfile: PortfolioProfile | null
  myProjects: PortfolioProject[]
  isLoadingProfile: boolean

  // ── Discovery / Browse ──
  discoveryProjects: PortfolioProject[]
  discoveryFilters: PortfolioDiscoveryFilters
  isLoadingDiscovery: boolean
  hasMore: boolean
  page: number

  // ── Viewing another profile ──
  viewingProfile: PortfolioProfile | null
  viewingProjects: PortfolioProject[]

  // ── Selected project (for detail view) ──
  selectedProjectId: string | null

  // ── Publishing ──
  isPublishing: boolean
  publishError: string | null

  // ── Actions ──

  // Profile
  fetchMyProfile: () => Promise<void>
  updateMyProfile: (updates: Partial<PortfolioProfile>) => Promise<void>

  // My projects
  fetchMyProjects: () => Promise<void>
  publishProject: (project: Omit<PortfolioProject, 'id' | 'userId' | 'viewCount' | 'likeCount' | 'embedUrl' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateProject: (id: string, updates: Partial<PortfolioProject>) => void
  unpublishProject: (id: string) => void
  deleteProject: (id: string) => void

  // Discovery
  fetchDiscoveryProjects: (reset?: boolean) => Promise<void>
  setDiscoveryFilters: (filters: Partial<PortfolioDiscoveryFilters>) => void

  // View profile
  fetchProfile: (username: string) => Promise<void>
  fetchProfileProjects: (userId: string) => Promise<void>

  // Interaction
  likeProject: (id: string) => Promise<void>
  followUser: (userId: string) => Promise<void>
  setSelectedProjectId: (id: string | null) => void

  // Reset
  reset: () => void
}

export const usePortfolioStore = create<PortfolioState>()(
  immer((set, get) => ({
    myProfile: null,
    myProjects: [],
    isLoadingProfile: false,
    discoveryProjects: [],
    discoveryFilters: { ...DEFAULT_DISCOVERY_FILTERS },
    isLoadingDiscovery: false,
    hasMore: true,
    page: 1,
    viewingProfile: null,
    viewingProjects: [],
    selectedProjectId: null,
    isPublishing: false,
    publishError: null,

    // ── Profile ──

    fetchMyProfile: async () => {
      set((s) => { s.isLoadingProfile = true })
      try {
        const res = await fetch('/api/portfolio/profile/me', {
          headers: await getAuthHeaders(),
        })
        if (!res.ok) throw new Error('Failed to fetch profile')
        const data = await res.json()
        set((s) => {
          s.myProfile = data.profile
          s.isLoadingProfile = false
        })
      } catch (err) {
        console.warn('[Portfolio] Failed to fetch profile:', err)
        set((s) => { s.isLoadingProfile = false })
      }
    },

    updateMyProfile: async (updates) => {
      try {
        const res = await fetch('/api/portfolio/profile/me', {
          method: 'PUT',
          headers: await getAuthHeaders(),
          body: JSON.stringify(updates),
        })
        if (!res.ok) throw new Error('Failed to update profile')
        const data = await res.json()
        set((s) => { s.myProfile = data.profile })
      } catch (err) {
        console.error('[Portfolio] Update profile failed:', err)
      }
    },

    // ── My projects ──

    fetchMyProjects: async () => {
      try {
        const res = await fetch('/api/portfolio/projects/mine', {
          headers: await getAuthHeaders(),
        })
        if (!res.ok) throw new Error('Failed to fetch projects')
        const data = await res.json()
        set((s) => { s.myProjects = data.projects })
      } catch (err) {
        console.warn('[Portfolio] Failed to fetch projects:', err)
      }
    },

    publishProject: async (project) => {
      set((s) => { s.isPublishing = true; s.publishError = null })
      try {
        const res = await fetch('/api/portfolio/projects', {
          method: 'POST',
          headers: await getAuthHeaders(),
          body: JSON.stringify(project),
        })
        if (!res.ok) {
          const errText = await res.text()
          throw new Error(errText || 'Failed to publish')
        }
        const data = await res.json()
        set((s) => {
          s.myProjects.push(data.project)
          s.isPublishing = false
        })
        return data.project.id as string
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Publish failed'
        set((s) => {
          s.isPublishing = false
          s.publishError = msg
        })
        throw err
      }
    },

    updateProject: (id, updates) =>
      set((s) => {
        const project = s.myProjects.find((p) => p.id === id)
        if (project) Object.assign(project, updates)
      }),

    unpublishProject: (id) =>
      set((s) => {
        const project = s.myProjects.find((p) => p.id === id)
        if (project) project.status = 'draft'
      }),

    deleteProject: (id) =>
      set((s) => {
        s.myProjects = s.myProjects.filter((p) => p.id !== id)
        if (s.selectedProjectId === id) s.selectedProjectId = null
      }),

    // ── Discovery ──

    fetchDiscoveryProjects: async (reset = false) => {
      set((s) => { s.isLoadingDiscovery = true })
      const page = reset ? 1 : get().page
      if (reset) set((s) => { s.page = 1; s.hasMore = true })

      try {
        const filters = get().discoveryFilters
        const params = new URLSearchParams({
          page: String(page),
          limit: '20',
          sortBy: filters.sortBy,
          timeRange: filters.timeRange,
        })
        if (filters.category) params.set('category', filters.category)
        if (filters.searchQuery) params.set('q', filters.searchQuery)
        if (filters.tags.length > 0) params.set('tags', filters.tags.join(','))

        const res = await fetch(`/api/portfolio/discover?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to fetch discovery')
        const data = await res.json()

        set((s) => {
          if (reset) {
            s.discoveryProjects = data.projects
          } else {
            s.discoveryProjects.push(...data.projects)
          }
          s.hasMore = data.hasMore
          s.page = page + 1
          s.isLoadingDiscovery = false
        })
      } catch (err) {
        console.warn('[Portfolio] Discovery fetch failed:', err)
        set((s) => { s.isLoadingDiscovery = false })
      }
    },

    setDiscoveryFilters: (filters) =>
      set((s) => {
        Object.assign(s.discoveryFilters, filters)
      }),

    // ── View profile ──

    fetchProfile: async (username) => {
      try {
        const res = await fetch(`/api/portfolio/profile/${encodeURIComponent(username)}`)
        if (!res.ok) throw new Error('Profile not found')
        const data = await res.json()
        set((s) => { s.viewingProfile = data.profile })
      } catch (err) {
        console.warn('[Portfolio] Profile fetch failed:', err)
      }
    },

    fetchProfileProjects: async (userId) => {
      try {
        const res = await fetch(`/api/portfolio/projects/user/${encodeURIComponent(userId)}`)
        if (!res.ok) throw new Error('Failed to fetch projects')
        const data = await res.json()
        set((s) => { s.viewingProjects = data.projects })
      } catch (err) {
        console.warn('[Portfolio] Profile projects fetch failed:', err)
      }
    },

    // ── Interaction ──

    likeProject: async (id) => {
      try {
        const res = await fetch(`/api/portfolio/projects/${id}/like`, {
          method: 'POST',
          headers: await getAuthHeaders(),
        })
        if (!res.ok) throw new Error('Like failed')
        const data = await res.json()

        set((s) => {
          // Update in all lists
          for (const list of [s.myProjects, s.discoveryProjects, s.viewingProjects]) {
            const project = list.find((p) => p.id === id)
            if (project) {
              project.likeCount = data.likeCount
              project.isLiked = data.isLiked
            }
          }
        })
      } catch (err) {
        console.warn('[Portfolio] Like failed:', err)
      }
    },

    followUser: async (userId) => {
      try {
        await fetch(`/api/portfolio/follow/${userId}`, {
          method: 'POST',
          headers: await getAuthHeaders(),
        })
      } catch (err) {
        console.warn('[Portfolio] Follow failed:', err)
      }
    },

    setSelectedProjectId: (id) =>
      set((s) => {
        s.selectedProjectId = id
      }),

    // ── Reset ──

    reset: () =>
      set((s) => {
        s.discoveryProjects = []
        s.discoveryFilters = { ...DEFAULT_DISCOVERY_FILTERS }
        s.isLoadingDiscovery = false
        s.hasMore = true
        s.page = 1
        s.viewingProfile = null
        s.viewingProjects = []
        s.selectedProjectId = null
      }),
  }))
)

// ── Helpers ──

async function getAuthHeaders(): Promise<HeadersInit> {
  // Dynamic import to avoid circular dependency
  const { supabase } = await import('@/services/supabase')
  const { data } = await supabase!.auth.getSession()
  const token = data.session?.access_token
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}
