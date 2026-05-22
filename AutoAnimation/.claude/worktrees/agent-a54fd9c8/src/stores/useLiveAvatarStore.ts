/**
 * Live Avatar Streaming Store
 *
 * Manages state for real-time character rendering + stream output
 * for video conferencing and live streaming platforms.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type {
  LiveAvatarSettings,
  LiveStreamStatus,
  LiveStreamStats,
  StreamBackground,
  StreamQuality,
  StreamTarget,
} from '@/types/liveAvatar'
import { DEFAULT_LIVE_AVATAR_SETTINGS, createEmptyStreamStats } from '@/types/liveAvatar'

interface LiveAvatarState {
  /** Current settings */
  settings: LiveAvatarSettings
  /** Stream status */
  status: LiveStreamStatus
  /** Live stream stats (updated every second) */
  stats: LiveStreamStats
  /** Active MediaStream (for previewing or passing to WebRTC) */
  activeStream: MediaStream | null
  /** Whether webcam puppeteering (#31) is active alongside the stream */
  puppeteeringActive: boolean
  /** Error message */
  error: string | null

  // Actions
  updateSettings: (partial: Partial<LiveAvatarSettings>) => void
  setQuality: (quality: StreamQuality) => void
  setTarget: (target: StreamTarget) => void
  setBackground: (background: StreamBackground) => void
  setStatus: (status: LiveStreamStatus) => void
  setStats: (stats: LiveStreamStats) => void
  setActiveStream: (stream: MediaStream | null) => void
  setPuppeteeringActive: (active: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useLiveAvatarStore = create<LiveAvatarState>()(
  immer((set) => ({
    settings: { ...DEFAULT_LIVE_AVATAR_SETTINGS },
    status: 'idle',
    stats: createEmptyStreamStats(),
    activeStream: null,
    puppeteeringActive: false,
    error: null,

    updateSettings: (partial) => {
      set((s) => {
        Object.assign(s.settings, partial)
      })
    },

    setQuality: (quality) => {
      set((s) => {
        s.settings.quality = quality
      })
    },

    setTarget: (target) => {
      set((s) => {
        s.settings.target = target
      })
    },

    setBackground: (background) => {
      set((s) => {
        s.settings.background = background
      })
    },

    setStatus: (status) => {
      set((s) => {
        s.status = status
      })
    },

    setStats: (stats) => {
      set((s) => {
        s.stats = stats
      })
    },

    setActiveStream: (stream) => {
      set((s) => {
        s.activeStream = stream as MediaStream | null
      })
    },

    setPuppeteeringActive: (active) => {
      set((s) => {
        s.puppeteeringActive = active
      })
    },

    setError: (error) => {
      set((s) => {
        s.error = error
        if (error) s.status = 'error'
      })
    },

    reset: () => {
      set((s) => {
        s.settings = { ...DEFAULT_LIVE_AVATAR_SETTINGS }
        s.status = 'idle'
        s.stats = createEmptyStreamStats()
        s.activeStream = null
        s.puppeteeringActive = false
        s.error = null
      })
    },
  })),
)
