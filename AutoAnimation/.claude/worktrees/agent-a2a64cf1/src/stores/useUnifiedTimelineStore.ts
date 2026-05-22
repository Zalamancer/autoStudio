import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'
import { logger } from '@/utils/logger'
import type { UnifiedTrack, UnifiedTrackKind, UnifiedClip, ClipSourceType } from '@/types/unifiedTimeline'

/** Color palette per source type */
export const CLIP_SOURCE_COLORS: Record<ClipSourceType, string> = {
  text: '#f97316', // orange
  media: '#22c55e', // green
  lottie: '#a855f7', // purple
  shape: '#3b82f6', // blue
  svgObject: '#ec4899', // pink
  character3d: '#14b8a6', // teal
  htmlTemplate: '#eab308', // yellow
  dialogue: '#6366f1', // indigo
  dialogueLine: '#6366f1', // indigo
  video: '#ef4444', // red
}

interface UnifiedTimelineState {
  videoTracks: UnifiedTrack[]
  audioTracks: UnifiedTrack[]

  // Selection
  selectedClipId: string | null
  selectedTrackId: string | null

  // Guard flag for sync — prevents infinite loops
  _syncing: boolean
}

interface UnifiedTimelineActions {
  // Track management
  addVideoTrack: () => string
  addAudioTrack: () => string
  removeTrack: (trackId: string) => void
  reorderVideoTrack: (fromIndex: number, toIndex: number) => void
  toggleTrackVisible: (trackId: string) => void
  toggleTrackLocked: (trackId: string) => void
  toggleTrackMuted: (trackId: string) => void
  toggleTrackExpanded: (trackId: string) => void
  setTrackHeight: (trackId: string, height: number) => void

  // Clip management
  addClip: (trackId: string, clip: UnifiedClip) => void
  removeClip: (clipId: string) => void
  removeClipBySource: (sourceType: ClipSourceType, sourceId: string) => void
  moveClip: (clipId: string, targetTrackId: string, newStartFrame?: number) => void
  updateClipTimeRange: (clipId: string, startFrame: number, endFrame: number) => void
  updateClipName: (clipId: string, name: string) => void

  // Auto-placement
  autoPlaceClip: (clip: Omit<UnifiedClip, 'id'>, preferredKind: UnifiedTrackKind) => string

  // Selection
  selectClip: (clipId: string | null) => void
  selectTrack: (trackId: string | null) => void

  // Getters
  findClipById: (clipId: string) => { track: UnifiedTrack; clip: UnifiedClip } | null
  findClipBySource: (sourceType: ClipSourceType, sourceId: string) => { track: UnifiedTrack; clip: UnifiedClip } | null
  getTrackById: (trackId: string) => UnifiedTrack | null
  getAllTracks: () => UnifiedTrack[]

  // Sync helpers
  setSyncing: (val: boolean) => void

  // Persistence
  loadFromProject: (data: { videoTracks: UnifiedTrack[]; audioTracks: UnifiedTrack[] }) => void
  reset: () => void
}

function makeTrackId() {
  return `utrack_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function makeClipId() {
  return `uclip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function createDefaultTrack(kind: UnifiedTrackKind, number: number): UnifiedTrack {
  const prefix = kind === 'video' ? 'V' : 'A'
  return {
    id: makeTrackId(),
    kind,
    number,
    name: `${prefix}${number}`,
    clips: [],
    visible: true,
    locked: false,
    muted: false,
    height: 48,
    expanded: false,
  }
}

/** Check if two frame ranges overlap */
function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd
}

function createInitialState(): UnifiedTimelineState {
  return {
    videoTracks: [createDefaultTrack('video', 1), createDefaultTrack('video', 2)],
    audioTracks: [createDefaultTrack('audio', 1), createDefaultTrack('audio', 2)],
    selectedClipId: null,
    selectedTrackId: null,
    _syncing: false,
  }
}

export const useUnifiedTimelineStore = create<UnifiedTimelineState & UnifiedTimelineActions>()(
  temporal(
    immer((set, get) => ({
      ...createInitialState(),

      // ── Track Management ────────────────────────────────────────────────

      addVideoTrack: () => {
        const nextNumber = get().videoTracks.length + 1
        const track = createDefaultTrack('video', nextNumber)
        set((state) => {
          state.videoTracks.push(track)
        })
        return track.id
      },

      addAudioTrack: () => {
        const nextNumber = get().audioTracks.length + 1
        const track = createDefaultTrack('audio', nextNumber)
        set((state) => {
          state.audioTracks.push(track)
        })
        return track.id
      },

      removeTrack: (trackId) =>
        set((state) => {
          const vi = state.videoTracks.findIndex((t) => t.id === trackId)
          if (vi !== -1) {
            // Only remove empty tracks
            if (state.videoTracks[vi].clips.length === 0) {
              state.videoTracks.splice(vi, 1)
              // Renumber
              state.videoTracks.forEach((t, i) => {
                t.number = i + 1
                t.name = `V${i + 1}`
              })
            }
            return
          }
          const ai = state.audioTracks.findIndex((t) => t.id === trackId)
          if (ai !== -1 && state.audioTracks[ai].clips.length === 0) {
            state.audioTracks.splice(ai, 1)
            state.audioTracks.forEach((t, i) => {
              t.number = i + 1
              t.name = `A${i + 1}`
            })
          }
        }),

      reorderVideoTrack: (fromIndex, toIndex) =>
        set((state) => {
          if (fromIndex === toIndex) return
          const [moved] = state.videoTracks.splice(fromIndex, 1)
          state.videoTracks.splice(toIndex, 0, moved)
          // Renumber
          state.videoTracks.forEach((t, i) => {
            t.number = i + 1
            t.name = `V${i + 1}`
          })
        }),

      toggleTrackVisible: (trackId) =>
        set((state) => {
          const track = [...state.videoTracks, ...state.audioTracks].find((t) => t.id === trackId)
          if (track) track.visible = !track.visible
        }),

      toggleTrackLocked: (trackId) =>
        set((state) => {
          const track = [...state.videoTracks, ...state.audioTracks].find((t) => t.id === trackId)
          if (track) track.locked = !track.locked
        }),

      toggleTrackMuted: (trackId) =>
        set((state) => {
          const track = [...state.videoTracks, ...state.audioTracks].find((t) => t.id === trackId)
          if (track) track.muted = !track.muted
        }),

      toggleTrackExpanded: (trackId) =>
        set((state) => {
          const track = [...state.videoTracks, ...state.audioTracks].find((t) => t.id === trackId)
          if (track) track.expanded = !track.expanded
        }),

      setTrackHeight: (trackId, height) =>
        set((state) => {
          const track = [...state.videoTracks, ...state.audioTracks].find((t) => t.id === trackId)
          if (track) track.height = Math.max(20, Math.min(80, height))
        }),

      // ── Clip Management ─────────────────────────────────────────────────

      addClip: (trackId, clip) =>
        set((state) => {
          const track = [...state.videoTracks, ...state.audioTracks].find((t) => t.id === trackId)
          if (track) {
            track.clips.push(clip)
          }
        }),

      removeClip: (clipId) =>
        set((state) => {
          for (const track of [...state.videoTracks, ...state.audioTracks]) {
            const idx = track.clips.findIndex((c) => c.id === clipId)
            if (idx !== -1) {
              track.clips.splice(idx, 1)
              return
            }
          }
        }),

      removeClipBySource: (sourceType, sourceId) =>
        set((state) => {
          for (const track of [...state.videoTracks, ...state.audioTracks]) {
            const idx = track.clips.findIndex((c) => c.sourceType === sourceType && c.sourceId === sourceId)
            if (idx !== -1) {
              track.clips.splice(idx, 1)
              return
            }
          }
        }),

      moveClip: (clipId, targetTrackId, newStartFrame) =>
        set((state) => {
          // Find and remove from source track
          let clip: UnifiedClip | null = null
          for (const track of [...state.videoTracks, ...state.audioTracks]) {
            const idx = track.clips.findIndex((c) => c.id === clipId)
            if (idx !== -1) {
              clip = { ...track.clips[idx] }
              track.clips.splice(idx, 1)
              break
            }
          }
          if (!clip) return

          // Update start frame if provided
          if (newStartFrame !== undefined) {
            const duration = clip.endFrame - clip.startFrame
            clip.startFrame = Math.max(0, newStartFrame)
            clip.endFrame = clip.startFrame + duration
          }

          // Add to target track
          const target = [...state.videoTracks, ...state.audioTracks].find((t) => t.id === targetTrackId)
          if (target) {
            target.clips.push(clip)
          }
        }),

      updateClipTimeRange: (clipId, startFrame, endFrame) =>
        set((state) => {
          for (const track of [...state.videoTracks, ...state.audioTracks]) {
            const clip = track.clips.find((c) => c.id === clipId)
            if (clip) {
              clip.startFrame = startFrame
              clip.endFrame = endFrame
              return
            }
          }
        }),

      updateClipName: (clipId, name) =>
        set((state) => {
          for (const track of [...state.videoTracks, ...state.audioTracks]) {
            const clip = track.clips.find((c) => c.id === clipId)
            if (clip) {
              clip.name = name
              return
            }
          }
        }),

      // ── Auto-placement ──────────────────────────────────────────────────

      autoPlaceClip: (clipData, preferredKind) => {
        const clipId = makeClipId()

        // Validate bounds
        const normalizedStart = Math.max(0, clipData.startFrame)
        const normalizedEnd = Math.max(normalizedStart + 1, clipData.endFrame)
        if (clipData.endFrame <= clipData.startFrame) {
          logger.warn(
            `[UnifiedTimeline] Zero/negative-duration clip corrected: ${clipData.name} (${clipData.startFrame}→${clipData.endFrame})`,
          )
        }

        const clip: UnifiedClip = { ...clipData, id: clipId, startFrame: normalizedStart, endFrame: normalizedEnd }

        const state = get()
        const tracks = preferredKind === 'video' ? state.videoTracks : state.audioTracks

        // Find first track where clip doesn't overlap any existing clip
        for (const track of tracks) {
          const hasOverlap = track.clips.some((existing) =>
            rangesOverlap(clip.startFrame, clip.endFrame, existing.startFrame, existing.endFrame),
          )
          if (!hasOverlap) {
            set((s) => {
              const targetTracks = preferredKind === 'video' ? s.videoTracks : s.audioTracks
              const t = targetTracks.find((tr) => tr.id === track.id)
              if (t) t.clips.push(clip)
            })
            return clipId
          }
        }

        // All tracks occupied — create a new one
        const addTrack = preferredKind === 'video' ? get().addVideoTrack : get().addAudioTrack
        const newTrackId = addTrack()

        set((s) => {
          const targetTracks = preferredKind === 'video' ? s.videoTracks : s.audioTracks
          const t = targetTracks.find((tr) => tr.id === newTrackId)
          if (t) t.clips.push(clip)
        })

        return clipId
      },

      // ── Selection ───────────────────────────────────────────────────────

      selectClip: (clipId) =>
        set((state) => {
          state.selectedClipId = clipId
        }),

      selectTrack: (trackId) =>
        set((state) => {
          state.selectedTrackId = trackId
        }),

      // ── Getters ─────────────────────────────────────────────────────────

      findClipById: (clipId) => {
        const state = get()
        for (const track of [...state.videoTracks, ...state.audioTracks]) {
          const clip = track.clips.find((c) => c.id === clipId)
          if (clip) return { track, clip }
        }
        return null
      },

      findClipBySource: (sourceType, sourceId) => {
        const state = get()
        for (const track of [...state.videoTracks, ...state.audioTracks]) {
          const clip = track.clips.find((c) => c.sourceType === sourceType && c.sourceId === sourceId)
          if (clip) return { track, clip }
        }
        return null
      },

      getTrackById: (trackId) => {
        const state = get()
        return (
          state.videoTracks.find((t) => t.id === trackId) || state.audioTracks.find((t) => t.id === trackId) || null
        )
      },

      getAllTracks: () => {
        const state = get()
        return [...state.videoTracks, ...state.audioTracks]
      },

      // ── Sync ────────────────────────────────────────────────────────────

      setSyncing: (val) =>
        set((state) => {
          state._syncing = val
        }),

      // ── Persistence ─────────────────────────────────────────────────────

      loadFromProject: (data) =>
        set((state) => {
          state.videoTracks = data.videoTracks
          state.audioTracks = data.audioTracks
          state.selectedClipId = null
          state.selectedTrackId = null
        }),

      reset: () => set(() => createInitialState()),
    })),
    {
      limit: 100,
      partialize: (state) => {
        // Exclude internal flags and selection from undo history
        const { _syncing, selectedClipId: _selectedClipId, selectedTrackId: _selectedTrackId, ...rest } = state
        return rest as typeof state
      },
    },
  ),
)
