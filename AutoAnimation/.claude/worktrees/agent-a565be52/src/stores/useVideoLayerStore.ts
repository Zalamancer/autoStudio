import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface CanvasVideo {
  id: string
  sourceUrl: string
  name: string
  prompt: string
  position: { x: number; y: number }
  scale: number
  rotation: number
  opacity: number
  zIndex: number
  visible: boolean
  loop: boolean
  durationSeconds: number
  fps: number
  width: number
  height: number
}

interface VideoLayerState {
  videos: CanvasVideo[]
  selectedVideoId: string | null

  addVideo: (video: Omit<CanvasVideo, 'rotation'> & { rotation?: number }) => void
  removeVideo: (id: string) => void
  updateVideo: (id: string, updates: Partial<CanvasVideo>) => void
  setSelectedVideoId: (id: string | null) => void
  clearAll: () => void
  loadFromSnapshot: (videos: CanvasVideo[]) => void
}

export const useVideoLayerStore = create<VideoLayerState>()(
  immer((set) => ({
    videos: [],
    selectedVideoId: null,

    addVideo: (video) =>
      set((state) => {
        // Avoid duplicates
        const exists = state.videos.some((v) => v.id === video.id)
        if (!exists) {
          state.videos.push({ ...video, rotation: video.rotation ?? 0 })
        }
      }),

    removeVideo: (id) =>
      set((state) => {
        state.videos = state.videos.filter((v) => v.id !== id)
        if (state.selectedVideoId === id) {
          state.selectedVideoId = null
        }
      }),

    updateVideo: (id, updates) =>
      set((state) => {
        const video = state.videos.find((v) => v.id === id)
        if (video) {
          Object.assign(video, updates)
        }
      }),

    setSelectedVideoId: (id) =>
      set((state) => {
        state.selectedVideoId = id
      }),

    clearAll: () =>
      set((state) => {
        state.videos = []
        state.selectedVideoId = null
      }),

    loadFromSnapshot: (videos) =>
      set((state) => {
        state.videos = videos
        state.selectedVideoId = null
      }),
  }))
)
