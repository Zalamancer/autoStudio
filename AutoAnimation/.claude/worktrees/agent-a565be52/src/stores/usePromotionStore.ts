import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { PromotionRequest, PromotionSubmission } from '@/types/promotions'
import {
  fetchOpenRequests,
  fetchRequestDetails,
  createRequest,
  cancelRequest,
  completeRequest,
  fetchRequestSubmissions,
  submitWork,
  withdrawSubmission,
  approveSubmission,
  rejectSubmission,
  fetchMySubmissions,
} from '@/services/promotionService'

interface PromotionState {
  // Enterprise state
  myRequests: PromotionRequest[]
  activeRequestSubmissions: PromotionSubmission[]
  isLoadingMyRequests: boolean

  // Creator state
  openRequests: PromotionRequest[]
  mySubmissions: PromotionSubmission[]
  isLoadingOpen: boolean
  isLoadingSubmissions: boolean

  // Detail view
  selectedRequest: PromotionRequest | null
  isLoadingDetail: boolean

  // Search / filter
  searchQuery: string
  nicheFilter: string[]

  // ── Enterprise Actions ──
  fetchMyRequests: () => Promise<void>
  createNewRequest: (data: {
    title: string
    description: string
    budget_credits: number
    niche_tags: string[]
    deadline?: string
    reference_media?: { url: string; type: 'image' | 'video'; caption?: string }[]
    max_submissions?: number
  }) => Promise<PromotionRequest | null>
  cancelMyRequest: (id: string) => Promise<void>
  completeMyRequest: (id: string) => Promise<void>
  fetchSubmissionsForRequest: (requestId: string) => Promise<void>
  approveSubmissionAction: (id: string, rewardCredits: number) => Promise<void>
  rejectSubmissionAction: (id: string, feedback: string) => Promise<void>

  // ── Creator Actions ──
  fetchOpenRequests: (params?: { niche_tags?: string[]; search?: string }) => Promise<void>
  fetchMySubmissions: () => Promise<void>
  submitWorkAction: (requestId: string, data: {
    title: string
    description?: string
    asset_url: string
    thumbnail_url?: string
    project_id?: string
  }) => Promise<PromotionSubmission | null>
  withdrawSubmissionAction: (id: string) => Promise<void>

  // ── Detail ──
  fetchRequestDetail: (id: string) => Promise<void>
  clearSelectedRequest: () => void

  // ── Filters ──
  setSearchQuery: (q: string) => void
  setNicheFilter: (tags: string[]) => void
}

export const usePromotionStore = create<PromotionState>()(
  immer((set) => ({
    myRequests: [],
    activeRequestSubmissions: [],
    isLoadingMyRequests: false,
    openRequests: [],
    mySubmissions: [],
    isLoadingOpen: false,
    isLoadingSubmissions: false,
    selectedRequest: null,
    isLoadingDetail: false,
    searchQuery: '',
    nicheFilter: [],

    // ── Enterprise ──

    fetchMyRequests: async () => {
      set((s) => { s.isLoadingMyRequests = true })
      try {
        // Fetch all requests where user is enterprise owner (server handles this)
        const { requests } = await fetchOpenRequests()
        set((s) => {
          s.myRequests = requests
          s.isLoadingMyRequests = false
        })
      } catch (err) {
        console.warn('[Promotions] Failed to fetch my requests:', err)
        set((s) => { s.isLoadingMyRequests = false })
      }
    },

    createNewRequest: async (data) => {
      try {
        const request = await createRequest(data)
        set((s) => { s.myRequests.unshift(request) })
        return request
      } catch (err) {
        console.error('[Promotions] Create request failed:', err)
        return null
      }
    },

    cancelMyRequest: async (id) => {
      try {
        await cancelRequest(id)
        set((s) => {
          const idx = s.myRequests.findIndex((r) => r.id === id)
          if (idx !== -1) s.myRequests[idx].status = 'canceled'
          if (s.selectedRequest?.id === id) s.selectedRequest.status = 'canceled'
        })
      } catch (err) {
        console.error('[Promotions] Cancel request failed:', err)
      }
    },

    completeMyRequest: async (id) => {
      try {
        await completeRequest(id)
        set((s) => {
          const idx = s.myRequests.findIndex((r) => r.id === id)
          if (idx !== -1) s.myRequests[idx].status = 'completed'
          if (s.selectedRequest?.id === id) s.selectedRequest.status = 'completed'
        })
      } catch (err) {
        console.error('[Promotions] Complete request failed:', err)
      }
    },

    fetchSubmissionsForRequest: async (requestId) => {
      set((s) => { s.isLoadingSubmissions = true })
      try {
        const submissions = await fetchRequestSubmissions(requestId)
        set((s) => {
          s.activeRequestSubmissions = submissions
          s.isLoadingSubmissions = false
        })
      } catch (err) {
        console.warn('[Promotions] Failed to fetch submissions:', err)
        set((s) => { s.isLoadingSubmissions = false })
      }
    },

    approveSubmissionAction: async (id, rewardCredits) => {
      try {
        await approveSubmission(id, rewardCredits)
        set((s) => {
          const sub = s.activeRequestSubmissions.find((s) => s.id === id)
          if (sub) {
            sub.status = 'approved'
            sub.reward_credits = rewardCredits
          }
        })
      } catch (err) {
        console.error('[Promotions] Approve submission failed:', err)
      }
    },

    rejectSubmissionAction: async (id, feedback) => {
      try {
        await rejectSubmission(id, feedback)
        set((s) => {
          const sub = s.activeRequestSubmissions.find((s) => s.id === id)
          if (sub) {
            sub.status = 'rejected'
            sub.feedback = feedback
          }
        })
      } catch (err) {
        console.error('[Promotions] Reject submission failed:', err)
      }
    },

    // ── Creator ──

    fetchOpenRequests: async (params) => {
      set((s) => { s.isLoadingOpen = true })
      try {
        const { requests } = await fetchOpenRequests(params)
        set((s) => {
          s.openRequests = requests
          s.isLoadingOpen = false
        })
      } catch (err) {
        console.warn('[Promotions] Failed to fetch open requests:', err)
        set((s) => { s.isLoadingOpen = false })
      }
    },

    fetchMySubmissions: async () => {
      try {
        const submissions = await fetchMySubmissions()
        set((s) => { s.mySubmissions = submissions })
      } catch (err) {
        console.warn('[Promotions] Failed to fetch my submissions:', err)
      }
    },

    submitWorkAction: async (requestId, data) => {
      try {
        const submission = await submitWork(requestId, data)
        set((s) => { s.mySubmissions.unshift(submission) })
        return submission
      } catch (err) {
        console.error('[Promotions] Submit work failed:', err)
        return null
      }
    },

    withdrawSubmissionAction: async (id) => {
      try {
        await withdrawSubmission(id)
        set((s) => {
          const sub = s.mySubmissions.find((s) => s.id === id)
          if (sub) sub.status = 'withdrawn'
        })
      } catch (err) {
        console.error('[Promotions] Withdraw submission failed:', err)
      }
    },

    // ── Detail ──

    fetchRequestDetail: async (id) => {
      set((s) => { s.isLoadingDetail = true })
      try {
        const request = await fetchRequestDetails(id)
        set((s) => {
          s.selectedRequest = request
          s.isLoadingDetail = false
        })
      } catch (err) {
        console.warn('[Promotions] Failed to fetch request detail:', err)
        set((s) => { s.isLoadingDetail = false })
      }
    },

    clearSelectedRequest: () => set((s) => { s.selectedRequest = null }),

    // ── Filters ──

    setSearchQuery: (q) => set((s) => { s.searchQuery = q }),
    setNicheFilter: (tags) => set((s) => { s.nicheFilter = tags }),
  }))
)
