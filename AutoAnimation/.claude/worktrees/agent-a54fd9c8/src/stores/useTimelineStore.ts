import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { temporal } from 'zundo'
import type { Track, Clip } from '@/types'

// ── Timeline Marker ────────────────────────────────────────────────────
export interface TimelineMarker {
  id: string
  /** Frame position on the timeline */
  frame: number
  /** User-assigned label */
  name: string
  /** Marker color (hex) */
  color: string
}

interface TimelineState {
  // Core timeline state
  fps: number
  totalFrames: number
  currentFrame: number
  isPlaying: boolean
  isLooping: boolean
  zoom: number
  timeDisplayMode: 'seconds' | 'frames'

  // Tracks and clips
  tracks: Track[]
  selectedClipIds: string[]
  selectedKeyframeIds: string[]

  // Timeline markers (user-created named markers)
  markers: TimelineMarker[]

  // Beat snap — when enabled, clip drags snap to beat positions
  beatSnapEnabled: boolean

  // Actions
  play: () => void
  pause: () => void
  togglePlayback: () => void
  toggleLoop: () => void
  toggleTimeDisplayMode: () => void
  seekToFrame: (frame: number) => void
  stepForward: () => void
  stepBackward: () => void
  setFps: (fps: number) => void
  setTotalFrames: (totalFrames: number) => void
  setZoom: (zoom: number) => void

  // Track operations
  addTrack: (track: Track) => void
  removeTrack: (trackId: string) => void
  updateTrack: (trackId: string, updates: Partial<Track>) => void
  reorderTracks: (fromIndex: number, toIndex: number) => void

  // Clip operations
  addClip: (trackId: string, clip: Clip) => void
  removeClip: (trackId: string, clipId: string) => void
  updateClip: (trackId: string, clipId: string, updates: Partial<Clip>) => void
  moveClip: (clipId: string, newTrackId: string, newStartFrame: number) => void

  // Selection
  selectClip: (clipId: string, multiSelect?: boolean) => void
  deselectClip: (clipId: string) => void
  clearSelection: () => void

  // Marker operations
  addMarker: (marker: TimelineMarker) => void
  removeMarker: (markerId: string) => void
  updateMarker: (markerId: string, updates: Partial<Omit<TimelineMarker, 'id'>>) => void
  clearMarkers: () => void
  /** Add a marker at the current playhead position with an auto-generated name */
  addMarkerAtPlayhead: (name?: string, color?: string) => void

  // Work area in/out points
  inPoint: number | null
  outPoint: number | null
  setInPoint: (frame: number | null) => void
  setOutPoint: (frame: number | null) => void

  // Timeline editing from transcript
  applyTimelineEdits: (edits: unknown[]) => void

  // Beat snap
  setBeatSnapEnabled: (enabled: boolean) => void
  toggleBeatSnap: () => void

  // Reset to initial state (for new project)
  reset: () => void

  // Project persistence
  loadFromProject: (data: {
    fps: number
    totalFrames: number
    tracks: Array<{
      id: string
      type: 'video' | 'audio' | 'sprite'
      name?: string
      locked: boolean
      muted: boolean
      visible: boolean
      height: number
      clips: Array<{
        id: string
        startFrame: number
        endFrame: number
        sourceId?: string
        sourceInPoint: number
        sourceOutPoint: number
        color?: string
        name?: string
      }>
    }>
  }) => void
}

const createInitialTracks = (): Track[] => [
  {
    id: 'video-1',
    type: 'video',
    name: 'Video 1',
    clips: [],
    locked: false,
    muted: false,
    visible: true,
    height: 48,
  },
  {
    id: 'character-1',
    type: 'sprite',
    name: 'Character',
    clips: [],
    locked: false,
    muted: false,
    visible: true,
    height: 48,
  },
  {
    id: 'audio-1',
    type: 'audio',
    name: 'Voice',
    clips: [],
    locked: false,
    muted: false,
    visible: true,
    height: 48,
  },
  {
    id: 'audio-2',
    type: 'audio',
    name: 'Music',
    clips: [],
    locked: false,
    muted: false,
    visible: true,
    height: 48,
  },
]

// Default marker colors for cycling
const MARKER_COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']
let markerColorIndex = 0

export const useTimelineStore = create<TimelineState>()(
  temporal(
    immer((set) => ({
      // Initial state
      fps: 60,
      totalFrames: 1800, // 30 seconds at 60fps — grows dynamically with content
      currentFrame: 0,
      isPlaying: false,
      isLooping: false,
      zoom: 1,
      timeDisplayMode: 'seconds',
      tracks: createInitialTracks(),
      selectedClipIds: [],
      selectedKeyframeIds: [],
      markers: [],
      beatSnapEnabled: false,
      inPoint: null,
      outPoint: null,

      // Playback actions
      play: () => set({ isPlaying: true }),

      pause: () => set({ isPlaying: false }),

      togglePlayback: () =>
        set((state) => {
          state.isPlaying = !state.isPlaying
        }),

      toggleLoop: () =>
        set((state) => {
          state.isLooping = !state.isLooping
        }),

      toggleTimeDisplayMode: () =>
        set((state) => {
          state.timeDisplayMode = state.timeDisplayMode === 'seconds' ? 'frames' : 'seconds'
        }),

      seekToFrame: (frame) =>
        set((state) => {
          state.currentFrame = Math.max(0, Math.min(frame, state.totalFrames - 1))
        }),

      stepForward: () =>
        set((state) => {
          state.currentFrame = Math.min(state.currentFrame + 1, state.totalFrames - 1)
        }),

      stepBackward: () =>
        set((state) => {
          state.currentFrame = Math.max(state.currentFrame - 1, 0)
        }),

      setFps: (fps) =>
        set((state) => {
          state.fps = fps
        }),

      setTotalFrames: (totalFrames) =>
        set((state) => {
          state.totalFrames = totalFrames
        }),

      setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(zoom, 10)) }),

      // Track operations
      addTrack: (track) =>
        set((state) => {
          state.tracks.push(track)
        }),

      removeTrack: (trackId) =>
        set((state) => {
          state.tracks = state.tracks.filter((t) => t.id !== trackId)
        }),

      updateTrack: (trackId, updates) =>
        set((state) => {
          const track = state.tracks.find((t) => t.id === trackId)
          if (track) {
            Object.assign(track, updates)
          }
        }),

      reorderTracks: (fromIndex, toIndex) =>
        set((state) => {
          if (
            fromIndex === toIndex ||
            fromIndex < 0 ||
            toIndex < 0 ||
            fromIndex >= state.tracks.length ||
            toIndex >= state.tracks.length
          ) {
            return
          }
          const [removed] = state.tracks.splice(fromIndex, 1)
          state.tracks.splice(toIndex, 0, removed)
        }),

      // Clip operations
      addClip: (trackId, clip) =>
        set((state) => {
          const track = state.tracks.find((t) => t.id === trackId)
          if (track) {
            track.clips.push(clip)
          }
        }),

      removeClip: (trackId, clipId) =>
        set((state) => {
          const track = state.tracks.find((t) => t.id === trackId)
          if (track) {
            track.clips = track.clips.filter((c) => c.id !== clipId)
          }
          state.selectedClipIds = state.selectedClipIds.filter((id) => id !== clipId)
        }),

      updateClip: (trackId, clipId, updates) =>
        set((state) => {
          const track = state.tracks.find((t) => t.id === trackId)
          if (track) {
            const clip = track.clips.find((c) => c.id === clipId)
            if (clip) {
              Object.assign(clip, updates)
            }
          }
        }),

      moveClip: (clipId, newTrackId, newStartFrame) =>
        set((state) => {
          // Find and remove clip from current track
          let movedClip: Clip | undefined
          for (const track of state.tracks) {
            const clipIndex = track.clips.findIndex((c) => c.id === clipId)
            if (clipIndex !== -1) {
              movedClip = track.clips.splice(clipIndex, 1)[0]
              break
            }
          }

          // Add to new track
          if (movedClip) {
            const newTrack = state.tracks.find((t) => t.id === newTrackId)
            if (newTrack) {
              movedClip.trackId = newTrackId
              movedClip.startFrame = newStartFrame
              newTrack.clips.push(movedClip)
            }
          }
        }),

      // Selection
      selectClip: (clipId, multiSelect = false) =>
        set((state) => {
          if (multiSelect) {
            if (!state.selectedClipIds.includes(clipId)) {
              state.selectedClipIds.push(clipId)
            }
          } else {
            state.selectedClipIds = [clipId]
          }
        }),

      deselectClip: (clipId) =>
        set((state) => {
          state.selectedClipIds = state.selectedClipIds.filter((id) => id !== clipId)
        }),

      clearSelection: () =>
        set((state) => {
          state.selectedClipIds = []
          state.selectedKeyframeIds = []
        }),

      // ── Marker operations ──────────────────────────────────────────────

      addMarker: (marker) =>
        set((state) => {
          state.markers.push(marker)
          // Sort markers by frame position
          state.markers.sort((a, b) => a.frame - b.frame)
        }),

      removeMarker: (markerId) =>
        set((state) => {
          state.markers = state.markers.filter((m) => m.id !== markerId)
        }),

      updateMarker: (markerId, updates) =>
        set((state) => {
          const marker = state.markers.find((m) => m.id === markerId)
          if (marker) {
            Object.assign(marker, updates)
          }
          // Re-sort if frame changed
          if (updates.frame !== undefined) {
            state.markers.sort((a, b) => a.frame - b.frame)
          }
        }),

      clearMarkers: () =>
        set((state) => {
          state.markers = []
        }),

      addMarkerAtPlayhead: (name, color) =>
        set((state) => {
          const markerColor = color || MARKER_COLORS[markerColorIndex++ % MARKER_COLORS.length]
          const markerName = name || `Marker ${state.markers.length + 1}`
          state.markers.push({
            id: `marker-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            frame: state.currentFrame,
            name: markerName,
            color: markerColor,
          })
          state.markers.sort((a, b) => a.frame - b.frame)
        }),

      // ── Work area in/out points ────────────────────────────────────────

      setInPoint: (frame) =>
        set((state) => {
          state.inPoint = frame
        }),

      setOutPoint: (frame) =>
        set((state) => {
          state.outPoint = frame
        }),

      // ── Timeline editing from transcript ──────────────────────────────

      applyTimelineEdits: (_edits) => {
        // Stub: applies transcript-based edits to timeline clips
      },

      // ── Beat snap ──────────────────────────────────────────────────────

      setBeatSnapEnabled: (enabled) =>
        set((state) => {
          state.beatSnapEnabled = enabled
        }),

      toggleBeatSnap: () =>
        set((state) => {
          state.beatSnapEnabled = !state.beatSnapEnabled
        }),

      // Reset to initial state (for new project)
      reset: () =>
        set((state) => {
          state.fps = 60
          state.totalFrames = 1800
          state.currentFrame = 0
          state.isPlaying = false
          state.zoom = 1
          state.timeDisplayMode = 'seconds'
          state.tracks = createInitialTracks()
          state.selectedClipIds = []
          state.selectedKeyframeIds = []
          state.markers = []
          state.beatSnapEnabled = false
          state.inPoint = null
          state.outPoint = null
        }),

      // Load from project
      loadFromProject: (data) =>
        set((state) => {
          state.fps = data.fps
          state.totalFrames = data.totalFrames
          state.currentFrame = 0
          state.isPlaying = false
          state.timeDisplayMode = 'seconds'
          state.tracks = data.tracks.map((t) => ({
            id: t.id,
            type: t.type,
            name: t.name || `Track ${t.id}`,
            locked: t.locked,
            muted: t.muted,
            visible: t.visible,
            height: t.height,
            clips: t.clips.map((c) => ({
              id: c.id,
              trackId: t.id,
              startFrame: c.startFrame,
              endFrame: c.endFrame,
              sourceId: c.sourceId || '',
              sourceInPoint: c.sourceInPoint,
              sourceOutPoint: c.sourceOutPoint,
              color: c.color || '#22c55e',
              name: c.name || '',
            })),
          }))
          state.selectedClipIds = []
          state.selectedKeyframeIds = []
          state.markers = []
          state.beatSnapEnabled = false
        }),
    })),
    { limit: 100 }, // Keep 100 undo states
  ),
)

// Export undo/redo functionality
export const useTimelineUndo = () => {
  const { undo, redo, pastStates, futureStates } = useTimelineStore.temporal.getState()
  return {
    undo,
    redo,
    canUndo: pastStates.length > 0,
    canRedo: futureStates.length > 0,
  }
}
