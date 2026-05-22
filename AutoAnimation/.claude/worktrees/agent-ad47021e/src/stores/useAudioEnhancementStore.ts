import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { AudioEnhancementConfig } from '@/types/audioExpanded'
import { getDefaultEnhancementConfig } from '@/services/audioEnhancementService'

interface AudioEnhancementPreset {
  id: string
  name: string
  config: AudioEnhancementConfig
}

const PRESETS: AudioEnhancementPreset[] = [
  {
    id: 'podcast',
    name: 'Podcast',
    config: {
      ...getDefaultEnhancementConfig(),
      autoLeveling: true,
      targetLUFS: -16,
      noiseGate: { enabled: true, threshold: -45, attack: 0.001, release: 0.05 },
      compression: { enabled: true, threshold: -20, ratio: 3, attack: 0.005, release: 0.2, makeupGain: 3 },
    },
  },
  {
    id: 'music-video',
    name: 'Music Video',
    config: {
      ...getDefaultEnhancementConfig(),
      autoLeveling: true,
      targetLUFS: -14,
      compression: { enabled: true, threshold: -12, ratio: 2, attack: 0.01, release: 0.3, makeupGain: 0 },
      ducking: { enabled: true, duckAmount: -8, fadeTime: 0.5, threshold: -25 },
    },
  },
  {
    id: 'asmr',
    name: 'ASMR',
    config: {
      ...getDefaultEnhancementConfig(),
      autoLeveling: true,
      targetLUFS: -20,
      noiseGate: { enabled: true, threshold: -55, attack: 0.002, release: 0.1 },
      spatialAudio: { enabled: true, panPosition: 0, roomSize: 0.3, reverbMix: 0.15, distanceAttenuation: 1 },
    },
  },
  {
    id: 'voiceover',
    name: 'Voiceover',
    config: {
      ...getDefaultEnhancementConfig(),
      autoLeveling: true,
      targetLUFS: -14,
      noiseGate: { enabled: true, threshold: -40, attack: 0.001, release: 0.05 },
      compression: { enabled: true, threshold: -18, ratio: 4, attack: 0.003, release: 0.25, makeupGain: 2 },
      eq: {
        enabled: true,
        bands: [
          { frequency: 80, gain: -6, q: 1, type: 'highpass' },
          { frequency: 3000, gain: 3, q: 1.5, type: 'peaking' },
        ],
      },
    },
  },
]

interface AudioEnhancementState {
  config: AudioEnhancementConfig
  activePreset: string | null
  presets: AudioEnhancementPreset[]
  isProcessing: boolean
  analysisResults: { rms: number; peak: number; estimatedLUFS: number } | null

  setConfig: (config: Partial<AudioEnhancementConfig>) => void
  applyPreset: (presetId: string) => void
  setProcessing: (processing: boolean) => void
  setAnalysisResults: (results: { rms: number; peak: number; estimatedLUFS: number } | null) => void
  reset: () => void
}

export const useAudioEnhancementStore = create<AudioEnhancementState>()(
  immer((set) => ({
    config: getDefaultEnhancementConfig(),
    activePreset: null,
    presets: PRESETS,
    isProcessing: false,
    analysisResults: null,

    setConfig: (partial) => set((s) => {
      Object.assign(s.config, partial)
      s.activePreset = null
    }),

    applyPreset: (presetId) => set((s) => {
      const preset = s.presets.find(p => p.id === presetId)
      if (preset) {
        s.config = { ...preset.config }
        s.activePreset = presetId
      }
    }),

    setProcessing: (processing) => set((s) => { s.isProcessing = processing }),

    setAnalysisResults: (results) => set((s) => { s.analysisResults = results }),

    reset: () => set((s) => {
      s.config = getDefaultEnhancementConfig()
      s.activePreset = null
      s.analysisResults = null
    }),
  }))
)
