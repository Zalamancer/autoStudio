import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { FaceSwapConfig, VideoFaceSwapConfig, CharacterSwapConfig } from '@/types/faceSwap'
import { swapFace } from '@/services/faceSwapService'
import { swapVideoFace } from '@/services/videoFaceSwapService'
import { swapCharacter } from '@/services/characterSwapService'

interface FaceSwapState {
  faceSwapConfig: FaceSwapConfig | null
  videoFaceSwapConfig: VideoFaceSwapConfig | null
  characterSwapConfig: CharacterSwapConfig | null
  isProcessing: boolean
  progress: number
  result: string | null
  videoFrameUrls: string[]
  error: string | null
  setFaceSwapConfig: (config: FaceSwapConfig) => void
  setVideoFaceSwapConfig: (config: VideoFaceSwapConfig) => void
  setCharacterSwapConfig: (config: CharacterSwapConfig) => void
  startFaceSwap: () => Promise<void>
  startVideoFaceSwap: () => Promise<void>
  startCharacterSwap: () => Promise<void>
  reset: () => void
}

export const useFaceSwapStore = create<FaceSwapState>()(
  immer((set, get) => ({
    faceSwapConfig: null,
    videoFaceSwapConfig: null,
    characterSwapConfig: null,
    isProcessing: false,
    progress: 0,
    result: null,
    videoFrameUrls: [],
    error: null,

    setFaceSwapConfig: (config) => set((s) => { s.faceSwapConfig = config }),
    setVideoFaceSwapConfig: (config) => set((s) => { s.videoFaceSwapConfig = config }),
    setCharacterSwapConfig: (config) => set((s) => { s.characterSwapConfig = config }),

    startFaceSwap: async () => {
      const config = get().faceSwapConfig
      if (!config) return
      set((s) => { s.isProcessing = true; s.error = null; s.progress = 0 })
      try {
        const result = await swapFace(config)
        set((s) => { s.result = result; s.progress = 1; s.isProcessing = false })
      } catch (e) {
        set((s) => { s.error = (e as Error).message; s.isProcessing = false })
      }
    },

    startVideoFaceSwap: async () => {
      const config = get().videoFaceSwapConfig
      if (!config) return
      set((s) => { s.isProcessing = true; s.error = null; s.progress = 0 })
      try {
        const result = await swapVideoFace(config, (p) => {
          set((s) => { s.progress = p })
        })
        set((s) => {
          s.videoFrameUrls = result.frameUrls
          s.progress = 1
          s.isProcessing = false
        })
      } catch (e) {
        set((s) => { s.error = (e as Error).message; s.isProcessing = false })
      }
    },

    startCharacterSwap: async () => {
      const config = get().characterSwapConfig
      if (!config) return
      set((s) => { s.isProcessing = true; s.error = null; s.progress = 0 })
      try {
        await swapCharacter(config)
        set((s) => { s.progress = 1; s.isProcessing = false })
      } catch (e) {
        set((s) => { s.error = (e as Error).message; s.isProcessing = false })
      }
    },

    reset: () => set((s) => {
      s.faceSwapConfig = null
      s.videoFaceSwapConfig = null
      s.characterSwapConfig = null
      s.isProcessing = false
      s.progress = 0
      s.result = null
      s.videoFrameUrls = []
      s.error = null
    }),
  }))
)
