/**
 * Publish Store — manages social publishing state including scheduling,
 * multi-platform selection, AI metadata generation, and publish job tracking.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  SocialPlatform,
  ScheduledPost,
  PublishJob,
  MetadataGenerationResult,
} from '@/types/social'
import {
  schedulePost as apiSchedulePost,
  cancelScheduledPost as apiCancelPost,
  getScheduledPosts as apiFetchScheduled,
  getPublishStatus as apiGetStatus,
  generateMetadata as apiGenerateMetadata,
} from '@/services/socialPublish'
import { logger } from '@/utils/logger'

interface PublishState {
  scheduledPosts: ScheduledPost[]
  publishJobs: Record<string, PublishJob>
  selectedPlatforms: SocialPlatform[]
  generatedMetadata: Partial<Record<SocialPlatform, MetadataGenerationResult>>
  isLoadingScheduled: boolean
  isGeneratingMetadata: boolean

  // Actions
  fetchScheduledPosts: () => Promise<void>
  addScheduledPost: (
    platform: SocialPlatform,
    videoUrl: string,
    recordingId: string,
    options: Record<string, unknown>,
    scheduledAt: string,
  ) => Promise<void>
  cancelPost: (id: string) => Promise<void>
  togglePlatform: (platform: SocialPlatform) => void
  setPlatforms: (platforms: SocialPlatform[]) => void
  clearPlatforms: () => void

  startPublishJob: (jobId: string, platform: SocialPlatform) => void
  updatePublishJob: (jobId: string, updates: Partial<PublishJob>) => void
  removePublishJob: (jobId: string) => void
  pollPublishStatus: (jobId: string) => Promise<void>

  generateMetadataForPlatform: (
    contentSummary: string,
    platform: SocialPlatform,
    tone?: string,
  ) => Promise<MetadataGenerationResult | null>
  clearMetadata: () => void
}

export const usePublishStore = create<PublishState>()(
  immer((set, _get) => ({
    scheduledPosts: [],
    publishJobs: {},
    selectedPlatforms: [],
    generatedMetadata: {},
    isLoadingScheduled: false,
    isGeneratingMetadata: false,

    fetchScheduledPosts: async () => {
      set((s) => { s.isLoadingScheduled = true })
      try {
        const posts = await apiFetchScheduled()
        set((s) => {
          s.scheduledPosts = posts
          s.isLoadingScheduled = false
        })
      } catch (err) {
        logger.error('[PublishStore] Failed to fetch scheduled posts:', err)
        set((s) => { s.isLoadingScheduled = false })
      }
    },

    addScheduledPost: async (platform, videoUrl, recordingId, options, scheduledAt) => {
      try {
        const post = await apiSchedulePost(platform, videoUrl, recordingId, options, scheduledAt)
        set((s) => {
          s.scheduledPosts.push(post)
        })
      } catch (err) {
        logger.error('[PublishStore] Failed to schedule post:', err)
        throw err
      }
    },

    cancelPost: async (id) => {
      try {
        await apiCancelPost(id)
        set((s) => {
          s.scheduledPosts = s.scheduledPosts.filter((p) => p.id !== id)
        })
      } catch (err) {
        logger.error('[PublishStore] Failed to cancel post:', err)
        throw err
      }
    },

    togglePlatform: (platform) => {
      set((s) => {
        const idx = s.selectedPlatforms.indexOf(platform)
        if (idx >= 0) {
          s.selectedPlatforms.splice(idx, 1)
        } else {
          s.selectedPlatforms.push(platform)
        }
      })
    },

    setPlatforms: (platforms) => {
      set((s) => { s.selectedPlatforms = platforms })
    },

    clearPlatforms: () => {
      set((s) => { s.selectedPlatforms = [] })
    },

    startPublishJob: (jobId, platform) => {
      set((s) => {
        s.publishJobs[jobId] = {
          jobId,
          platform,
          status: 'uploading',
          startedAt: new Date().toISOString(),
        }
      })
    },

    updatePublishJob: (jobId, updates) => {
      set((s) => {
        const job = s.publishJobs[jobId]
        if (job) {
          Object.assign(job, updates)
        }
      })
    },

    removePublishJob: (jobId) => {
      set((s) => {
        delete s.publishJobs[jobId]
      })
    },

    pollPublishStatus: async (jobId) => {
      try {
        const status = await apiGetStatus(jobId)
        set((s) => {
          const job = s.publishJobs[jobId]
          if (job) {
            job.status = status.status
            job.postUrl = status.postUrl
            job.error = status.error
          }
        })
      } catch (err) {
        logger.error('[PublishStore] Failed to poll status:', err)
      }
    },

    generateMetadataForPlatform: async (contentSummary, platform, tone) => {
      set((s) => { s.isGeneratingMetadata = true })
      try {
        const result = await apiGenerateMetadata(contentSummary, platform, tone)
        set((s) => {
          s.generatedMetadata[platform] = result
          s.isGeneratingMetadata = false
        })
        return result
      } catch (err) {
        logger.error('[PublishStore] Failed to generate metadata:', err)
        set((s) => { s.isGeneratingMetadata = false })
        return null
      }
    },

    clearMetadata: () => {
      set((s) => { s.generatedMetadata = {} })
    },
  }))
)
