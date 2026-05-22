import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { SocialIntegrationConfig } from '@/types/audioExpanded'

interface SocialIntegrationState {
  connectedPlatforms: SocialIntegrationConfig[]
  trendingTopics: string[]
  trendingSounds: { name: string; artist: string }[]
  activeHashtags: string[]
  postingSchedule: { day: string; hour: number; platform: string }[]
  isLoading: boolean

  setConnectedPlatforms: (platforms: SocialIntegrationConfig[]) => void
  connectPlatform: (platform: SocialIntegrationConfig) => void
  disconnectPlatform: (platformId: string) => void
  setTrendingTopics: (topics: string[]) => void
  setTrendingSounds: (sounds: { name: string; artist: string }[]) => void
  setActiveHashtags: (hashtags: string[]) => void
  addHashtag: (tag: string) => void
  removeHashtag: (tag: string) => void
  setPostingSchedule: (schedule: { day: string; hour: number; platform: string }[]) => void
  setLoading: (loading: boolean) => void
}

export const useSocialIntegrationStore = create<SocialIntegrationState>()(
  immer((set) => ({
    connectedPlatforms: [],
    trendingTopics: [],
    trendingSounds: [],
    activeHashtags: [],
    postingSchedule: [],
    isLoading: false,

    setConnectedPlatforms: (platforms) => set((s) => { s.connectedPlatforms = platforms }),

    connectPlatform: (platform) => set((s) => {
      const idx = s.connectedPlatforms.findIndex(p => p.platform === platform.platform)
      if (idx >= 0) s.connectedPlatforms[idx] = platform
      else s.connectedPlatforms.push(platform)
    }),

    disconnectPlatform: (platformId) => set((s) => {
      s.connectedPlatforms = s.connectedPlatforms.filter(p => p.platform !== platformId)
    }),

    setTrendingTopics: (topics) => set((s) => { s.trendingTopics = topics }),
    setTrendingSounds: (sounds) => set((s) => { s.trendingSounds = sounds }),
    setActiveHashtags: (hashtags) => set((s) => { s.activeHashtags = hashtags }),

    addHashtag: (tag) => set((s) => {
      if (!s.activeHashtags.includes(tag)) s.activeHashtags.push(tag)
    }),

    removeHashtag: (tag) => set((s) => {
      s.activeHashtags = s.activeHashtags.filter(t => t !== tag)
    }),

    setPostingSchedule: (schedule) => set((s) => { s.postingSchedule = schedule }),
    setLoading: (loading) => set((s) => { s.isLoading = loading }),
  }))
)
