/**
 * Style Transfer Store — manages video-to-video style transfer workflow.
 */

import { create } from 'zustand'
import type { StyleTransferStyle } from '@/services/styleTransfer'

interface StyleTransferState {
  /** Source video blob URL */
  sourceVideoUrl: string | null
  /** Source video blob */
  sourceVideoBlob: Blob | null
  /** Selected target style */
  targetStyle: StyleTransferStyle
  /** Style intensity (0-1) */
  intensity: number
  /** Custom style prompt */
  customPrompt: string
  /** Whether transfer is in progress */
  isProcessing: boolean
  /** Progress percentage */
  progress: number
  /** Status message */
  statusMessage: string | null
  /** Result video blob URL */
  resultVideoUrl: string | null
  /** Result video blob */
  resultVideoBlob: Blob | null
  /** Error message */
  error: string | null

  // Actions
  setSourceVideo: (blob: Blob) => void
  clearSourceVideo: () => void
  setTargetStyle: (style: StyleTransferStyle) => void
  setIntensity: (intensity: number) => void
  setCustomPrompt: (prompt: string) => void
  setProcessing: (processing: boolean) => void
  setProgress: (progress: number, message?: string) => void
  setResult: (blob: Blob) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useStyleTransferStore = create<StyleTransferState>((set) => ({
  sourceVideoUrl: null,
  sourceVideoBlob: null,
  targetStyle: 'anime',
  intensity: 0.8,
  customPrompt: '',
  isProcessing: false,
  progress: 0,
  statusMessage: null,
  resultVideoUrl: null,
  resultVideoBlob: null,
  error: null,

  setSourceVideo: (blob) => {
    const state = useStyleTransferStore.getState()
    if (state.sourceVideoUrl) URL.revokeObjectURL(state.sourceVideoUrl)
    if (state.resultVideoUrl) URL.revokeObjectURL(state.resultVideoUrl)
    const url = URL.createObjectURL(blob)
    set({ sourceVideoUrl: url, sourceVideoBlob: blob, resultVideoUrl: null, resultVideoBlob: null, error: null })
  },

  clearSourceVideo: () => {
    const state = useStyleTransferStore.getState()
    if (state.sourceVideoUrl) URL.revokeObjectURL(state.sourceVideoUrl)
    if (state.resultVideoUrl) URL.revokeObjectURL(state.resultVideoUrl)
    set({ sourceVideoUrl: null, sourceVideoBlob: null, resultVideoUrl: null, resultVideoBlob: null })
  },

  setTargetStyle: (targetStyle) => set({ targetStyle }),
  setIntensity: (intensity) => set({ intensity: Math.max(0, Math.min(1, intensity)) }),
  setCustomPrompt: (customPrompt) => set({ customPrompt }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setProgress: (progress, message) => set({ progress, statusMessage: message || null }),

  setResult: (blob) => {
    const oldUrl = useStyleTransferStore.getState().resultVideoUrl
    if (oldUrl) URL.revokeObjectURL(oldUrl)
    const url = URL.createObjectURL(blob)
    set({ resultVideoUrl: url, resultVideoBlob: blob, isProcessing: false, progress: 100 })
  },

  setError: (error) => set({ error, isProcessing: false }),

  reset: () => {
    const state = useStyleTransferStore.getState()
    if (state.sourceVideoUrl) URL.revokeObjectURL(state.sourceVideoUrl)
    if (state.resultVideoUrl) URL.revokeObjectURL(state.resultVideoUrl)
    set({
      sourceVideoUrl: null,
      sourceVideoBlob: null,
      targetStyle: 'anime',
      intensity: 0.8,
      customPrompt: '',
      isProcessing: false,
      progress: 0,
      statusMessage: null,
      resultVideoUrl: null,
      resultVideoBlob: null,
      error: null,
    })
  },
}))
