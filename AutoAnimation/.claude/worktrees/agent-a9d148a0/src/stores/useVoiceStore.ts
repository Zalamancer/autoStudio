import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { useTimelineStore } from './useTimelineStore'
import type {
  ElevenLabsVoice,
  VoiceSettings,
  VisemeEvent,
  WordEvent,
  CaptionStyle,
  GeneratedVoice,
} from '@/types/voice'
import { getElevenLabsService } from '@/services/elevenlabs'
import { apiClient } from '@/services/apiClient'
import { LipSyncProcessor } from '@/services/lipSync'

export interface ClonedVoice {
  voice_id: string
  name: string
  description: string
  createdAt: number
}
import { CaptionProcessor, type SentenceEvent } from '@/services/captions'
import { buildEmotionTimeline, getEmotionAtFrame as getEmotionAtFrameFromTimeline, type EmotionEvent } from '@/services/emotionTimeline'

interface VoiceState {
  // API Status
  isApiKeyValid: boolean
  isLoading: boolean
  error: string | null

  // Available voices from ElevenLabs
  availableVoices: ElevenLabsVoice[]
  selectedVoiceId: string | null

  // Voice cloning
  clonedVoices: ClonedVoice[]
  isCloning: boolean
  cloneError: string | null

  // Voice settings
  voiceSettings: VoiceSettings

  // Script input
  script: string

  // Script history (shared with ScriptsPanel)
  scriptHistory: { id: string; text: string; topic: string; style: string; createdAt: number }[]

  // Generated voices (history)
  generatedVoices: GeneratedVoice[]
  activeVoiceId: string | null

  // Voice favorites & recently used
  favoriteVoiceIds: string[]
  recentVoiceIds: string[]
  toggleFavoriteVoice: (voiceId: string) => void

  // Caption settings
  captionStyle: CaptionStyle
  captionFontSize: number
  captionPosition: 'top' | 'center' | 'bottom'
  captionColor: string
  captionBgOpacity: number
  captionPresetId: string | null
  captionAnimationSpeed: number
  emojiMode: 'none' | 'contextual' | 'emotion-only'
  showSpeakerLabels: boolean

  // Processed data for active voice
  activeVisemeTimeline: VisemeEvent[]
  activeWordTimeline: WordEvent[]
  activeSentenceTimeline: SentenceEvent[]
  activeEmotionTimeline: EmotionEvent[]

  // Actions
  setScript: (script: string) => void
  addScriptHistory: (item: { id: string; text: string; topic: string; style: string; createdAt: number }) => void
  removeScriptHistory: (id: string) => void
  setSelectedVoice: (voiceId: string) => void
  setVoiceSettings: (settings: Partial<VoiceSettings>) => void
  setCaptionStyle: (style: CaptionStyle) => void
  setCaptionFontSize: (size: number) => void
  setCaptionPosition: (position: 'top' | 'center' | 'bottom') => void
  setCaptionColor: (color: string) => void
  setCaptionBgOpacity: (opacity: number) => void
  setCaptionPreset: (presetId: string) => void
  setCaptionAnimationSpeed: (speed: number) => void
  setEmojiMode: (mode: 'none' | 'contextual' | 'emotion-only') => void
  setShowSpeakerLabels: (show: boolean) => void

  // API Actions
  fetchVoices: () => Promise<void>
  generateVoice: (fps: number) => Promise<GeneratedVoice | null>
  setActiveVoice: (voiceId: string | null) => void
  removeGeneratedVoice: (voiceId: string) => void

  // Voice cloning actions
  cloneVoice: (name: string, description: string, files: File[]) => Promise<ClonedVoice | null>
  deleteClonedVoice: (voiceId: string) => Promise<void>
  fetchClonedVoices: () => Promise<void>

  // Playback helpers
  getVisemeAtFrame: (frame: number) => string
  getWordAtFrame: (frame: number) => WordEvent | null
  getCaptionAtFrame: (frame: number) => { text: string; highlightIndex?: number } | null
  getEmotionAtFrame: (frame: number) => string

  // Audio import for lip sync (any audio file)
  isImportingAudio: boolean
  importAudioProgress: number
  importAudioForLipSync: (file: File, fps: number, manualTranscript?: string) => Promise<GeneratedVoice | null>

  // Transcript-based timeline population
  setTimelinesFromTranscript: (wordTimeline: WordEvent[], sentenceTimeline: SentenceEvent[]) => void

  // Error handling
  setError: (error: string | null) => void
  clearError: () => void

  // Project persistence
  loadFromProject: (voices: Array<{
    id: string
    script: string
    voiceId: string
    voiceName: string
    audioUrl: string
    audioDuration: number
    alignment: Record<string, unknown> | null
    visemeTimeline: Record<string, unknown>[]
    wordTimeline: Record<string, unknown>[]
    createdAt: Date
  }>) => void

  // Reset all content state (for new project) — preserves API config and available voices
  reset: () => void
}

export const useVoiceStore = create<VoiceState>()(
  immer((set, get) => ({
    // Initial state
    isApiKeyValid: false,
    isLoading: false,
    error: null,

    availableVoices: [],
    selectedVoiceId: null,

    clonedVoices: [],
    isCloning: false,
    cloneError: null,

    voiceSettings: {
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0,
      useSpeakerBoost: true,
    },

    script: '',
    scriptHistory: [],

    generatedVoices: [],
    activeVoiceId: null,

    favoriteVoiceIds: (() => { try { return JSON.parse(localStorage.getItem('proanimate:favoriteVoices') || '[]') as string[] } catch { return [] } })(),
    recentVoiceIds: (() => { try { return JSON.parse(localStorage.getItem('proanimate:recentVoices') || '[]') as string[] } catch { return [] } })(),

    toggleFavoriteVoice: (voiceId) =>
      set((state) => {
        const idx = state.favoriteVoiceIds.indexOf(voiceId)
        if (idx >= 0) {
          state.favoriteVoiceIds.splice(idx, 1)
        } else {
          state.favoriteVoiceIds.push(voiceId)
        }
        localStorage.setItem('proanimate:favoriteVoices', JSON.stringify(state.favoriteVoiceIds))
      }),

    captionStyle: 'word-by-word' as CaptionStyle,
    captionFontSize: 48,
    captionPosition: 'bottom' as const,
    captionColor: '#ffffff',
    captionBgOpacity: 0.7,
    captionPresetId: null,
    captionAnimationSpeed: 1,
    emojiMode: 'none' as const,
    showSpeakerLabels: false,

    activeVisemeTimeline: [],
    activeWordTimeline: [],
    activeSentenceTimeline: [],
    activeEmotionTimeline: [],

    isImportingAudio: false,
    importAudioProgress: 0,

    // Basic setters
    setScript: (script) =>
      set((state) => {
        state.script = script
      }),

    addScriptHistory: (item) =>
      set((state) => {
        state.scriptHistory.unshift(item)
        if (state.scriptHistory.length > 20) state.scriptHistory.length = 20
      }),

    removeScriptHistory: (id) =>
      set((state) => {
        state.scriptHistory = state.scriptHistory.filter((h) => h.id !== id)
      }),

    setSelectedVoice: (voiceId) =>
      set((state) => {
        state.selectedVoiceId = voiceId
        // Track recently used (max 10)
        const idx = state.recentVoiceIds.indexOf(voiceId)
        if (idx >= 0) state.recentVoiceIds.splice(idx, 1)
        state.recentVoiceIds.unshift(voiceId)
        if (state.recentVoiceIds.length > 10) state.recentVoiceIds.length = 10
        localStorage.setItem('proanimate:recentVoices', JSON.stringify(state.recentVoiceIds))
      }),

    setVoiceSettings: (settings) =>
      set((state) => {
        state.voiceSettings = { ...state.voiceSettings, ...settings }
      }),

    setCaptionStyle: (style) =>
      set((state) => {
        state.captionStyle = style
      }),

    setCaptionFontSize: (size) =>
      set((state) => {
        state.captionFontSize = size
      }),

    setCaptionPosition: (position) =>
      set((state) => {
        state.captionPosition = position
      }),

    setCaptionColor: (color) =>
      set((state) => {
        state.captionColor = color
      }),

    setCaptionBgOpacity: (opacity) =>
      set((state) => {
        state.captionBgOpacity = opacity
      }),

    setCaptionPreset: (presetId) =>
      set((state) => {
        state.captionPresetId = presetId
      }),

    setCaptionAnimationSpeed: (speed) =>
      set((state) => {
        state.captionAnimationSpeed = speed
      }),

    setEmojiMode: (mode) =>
      set((state) => {
        state.emojiMode = mode
      }),

    setShowSpeakerLabels: (show) =>
      set((state) => {
        state.showSpeakerLabels = show
      }),

    // Fetch available voices from ElevenLabs + cloned voices from DB
    fetchVoices: async () => {
      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const service = getElevenLabsService()
        const voices = await service.getVoices()

        set((state) => {
          state.availableVoices = voices
          state.isApiKeyValid = true
          state.isLoading = false

          // Auto-select first voice if none selected
          if (!state.selectedVoiceId && voices.length > 0) {
            state.selectedVoiceId = voices[0].voice_id
          }
        })

        // Also load cloned voices from DB (non-blocking)
        get().fetchClonedVoices()
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to fetch voices'
          state.isLoading = false
          state.isApiKeyValid = false
        })
      }
    },

    // Generate voice with alignment
    generateVoice: async (fps: number) => {
      const { script, selectedVoiceId, voiceSettings, availableVoices } = get()

      // Clean script (emotion cues stripped) for captions/display and validation
      const cleanScript = script.replace(/\[[\w-]+\]/g, '').replace(/\s+/g, ' ').trim()

      if (!cleanScript) {
        set((state) => {
          state.error = 'Please enter a script'
        })
        return null
      }

      if (!selectedVoiceId) {
        set((state) => {
          state.error = 'Please select a voice'
        })
        return null
      }

      set((state) => {
        state.isLoading = true
        state.error = null
      })

      try {
        const service = getElevenLabsService()
        // Send script WITH emotion cues so ElevenLabs service can convert
        // them to v3 expressive annotations (e.g. [happy] → <cheerful>)
        const result = await service.generateWithAlignment(script, selectedVoiceId, voiceSettings)

        // Process alignment data using clean script (no emotion cues) for captions
        const lipSyncProcessor = new LipSyncProcessor(fps)
        const captionProcessor = new CaptionProcessor(fps)

        const visemeTimeline = lipSyncProcessor.processAlignment(result.alignment)
        const wordTimeline = captionProcessor.extractWords(cleanScript, result.alignment)
        const sentenceTimeline = captionProcessor.groupIntoSentences(cleanScript, wordTimeline)

        const voiceName =
          availableVoices.find((v) => v.voice_id === selectedVoiceId)?.name || 'Unknown'

        const generatedVoice: GeneratedVoice = {
          id: `voice_${Date.now()}`,
          script,
          voiceId: selectedVoiceId,
          voiceName,
          audioUrl: result.audioUrl,
          audioDuration: result.duration,
          alignment: result.alignment,
          visemeTimeline,
          wordTimeline,
          createdAt: Date.now(),
        }

        // Build emotion timeline from raw script (with expression cues) and word timing
        const emotionTimeline = buildEmotionTimeline(script, wordTimeline)

        set((state) => {
          state.generatedVoices.push(generatedVoice)
          state.activeVoiceId = generatedVoice.id
          state.activeVisemeTimeline = visemeTimeline
          state.activeWordTimeline = wordTimeline
          state.activeSentenceTimeline = sentenceTimeline
          state.activeEmotionTimeline = emotionTimeline
          state.isLoading = false
        })

        return generatedVoice
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to generate voice'
          state.isLoading = false
        })
        return null
      }
    },

    // Set active voice from history
    setActiveVoice: (voiceId) => {
      const { generatedVoices } = get()
      const voice = generatedVoices.find((v) => v.id === voiceId)

      if (voice) {
        // Re-process timelines (in case fps changed)
        const fps = useTimelineStore.getState().fps
        const captionProcessor = new CaptionProcessor(fps)
        // Strip emotion cues for sentence grouping — word timeline was generated from clean script
        const cleanScript = voice.script.replace(/\[[\w-]+\]/g, '').replace(/\s+/g, ' ').trim()
        const sentenceTimeline = captionProcessor.groupIntoSentences(
          cleanScript,
          voice.wordTimeline
        )
        const emotionTimeline = buildEmotionTimeline(voice.script, voice.wordTimeline)

        set((state) => {
          state.activeVoiceId = voiceId
          state.activeVisemeTimeline = voice.visemeTimeline
          state.activeWordTimeline = voice.wordTimeline
          state.activeSentenceTimeline = sentenceTimeline
          state.activeEmotionTimeline = emotionTimeline
        })
      } else {
        set((state) => {
          state.activeVoiceId = null
          state.activeVisemeTimeline = []
          state.activeWordTimeline = []
          state.activeSentenceTimeline = []
          state.activeEmotionTimeline = []
        })
      }
    },

    // Remove generated voice
    removeGeneratedVoice: (voiceId) =>
      set((state) => {
        const index = state.generatedVoices.findIndex((v) => v.id === voiceId)
        if (index !== -1) {
          // Revoke audio URL to free memory
          URL.revokeObjectURL(state.generatedVoices[index].audioUrl)
          state.generatedVoices.splice(index, 1)

          // Clear active if it was the removed one
          if (state.activeVoiceId === voiceId) {
            state.activeVoiceId = null
            state.activeVisemeTimeline = []
            state.activeWordTimeline = []
            state.activeSentenceTimeline = []
            state.activeEmotionTimeline = []
          }
        }
      }),

    // Clone a voice from audio samples
    cloneVoice: async (name, description, files) => {
      set((state) => {
        state.isCloning = true
        state.cloneError = null
      })

      try {
        const service = getElevenLabsService()
        const result = await service.cloneVoice(name, description, files)

        const clonedVoice: ClonedVoice = {
          voice_id: result.voice_id,
          name,
          description,
          createdAt: Date.now(),
        }

        // Persist to DB (best effort — don't block on failure)
        if (apiClient.isAuthenticated()) {
          apiClient.post('/api/proxy/elevenlabs/user-voices', {
            voiceId: result.voice_id,
            name,
            description,
          }).catch((err) => console.warn('[VoiceStore] Failed to persist cloned voice:', err))
        }

        set((state) => {
          state.clonedVoices.push(clonedVoice)
          state.isCloning = false
          state.selectedVoiceId = result.voice_id
        })

        // Refresh voices list to include the new cloned voice
        get().fetchVoices()

        return clonedVoice
      } catch (error) {
        set((state) => {
          state.cloneError = error instanceof Error ? error.message : 'Voice cloning failed'
          state.isCloning = false
        })
        return null
      }
    },

    // Delete a cloned voice
    deleteClonedVoice: async (voiceId) => {
      try {
        // Delete from ElevenLabs + DB via backend
        if (apiClient.isAuthenticated()) {
          await apiClient.del(`/api/proxy/elevenlabs/user-voices/${voiceId}`)
        } else {
          // Fallback: delete directly from ElevenLabs
          const service = getElevenLabsService()
          await service.deleteVoice(voiceId)
        }

        set((state) => {
          state.clonedVoices = state.clonedVoices.filter((v) => v.voice_id !== voiceId)
          if (state.selectedVoiceId === voiceId) {
            state.selectedVoiceId = state.availableVoices[0]?.voice_id || null
          }
        })

        get().fetchVoices()
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to delete voice'
        })
      }
    },

    // Fetch cloned voices from DB (cross-session persistence)
    fetchClonedVoices: async () => {
      if (!apiClient.isAuthenticated()) return

      try {
        const data = await apiClient.get<{ voices: ClonedVoice[] }>('/api/proxy/elevenlabs/user-voices')
        set((state) => {
          state.clonedVoices = data.voices
        })
      } catch (err) {
        // Silent failure — cloned voices are non-critical
        console.warn('[VoiceStore] Failed to fetch cloned voices:', err)
      }
    },

    // Import arbitrary audio for lip sync (Feature #19)
    importAudioForLipSync: async (file: File, fps: number, manualTranscript?: string) => {
      set((state) => {
        state.isImportingAudio = true
        state.importAudioProgress = 0
        state.error = null
      })

      try {
        const { processAudioForLipSync } = await import('@/services/speechToViseme')
        const result = await processAudioForLipSync(file, fps, {
          manualTranscript,
          onProgress: (p: number) => {
            set((state) => {
              state.importAudioProgress = p
            })
          },
        })

        const captionProcessor = new CaptionProcessor(fps)
        const sentenceTimeline = captionProcessor.groupIntoSentences(
          result.transcript,
          result.wordTimeline,
        )

        const generatedVoice: GeneratedVoice = {
          id: `import_${Date.now()}`,
          script: result.transcript,
          voiceId: 'imported',
          voiceName: file.name,
          audioUrl: result.audioUrl,
          audioDuration: result.audioDuration,
          alignment: {
            characters: [],
            character_start_times_seconds: [],
            character_end_times_seconds: [],
            phonemes: [],
            phoneme_start_times_seconds: [],
            phoneme_end_times_seconds: [],
          },
          visemeTimeline: result.visemeTimeline,
          wordTimeline: result.wordTimeline,
          createdAt: Date.now(),
        }

        const emotionTimeline = buildEmotionTimeline(result.transcript, result.wordTimeline)

        set((state) => {
          state.generatedVoices.push(generatedVoice)
          state.activeVoiceId = generatedVoice.id
          state.activeVisemeTimeline = result.visemeTimeline
          state.activeWordTimeline = result.wordTimeline
          state.activeSentenceTimeline = sentenceTimeline
          state.activeEmotionTimeline = emotionTimeline
          state.isImportingAudio = false
          state.importAudioProgress = 1
        })

        return generatedVoice
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Audio import failed'
          state.isImportingAudio = false
          state.importAudioProgress = 0
        })
        return null
      }
    },

    // Playback helpers
    getVisemeAtFrame: (frame: number) => {
      const { activeVisemeTimeline } = get()
      const event = activeVisemeTimeline.find(
        (e) => frame >= e.startFrame && frame < e.endFrame
      )
      return event?.viseme || 'Rest'
    },

    getWordAtFrame: (frame: number) => {
      const { activeWordTimeline } = get()
      return activeWordTimeline.find((w) => frame >= w.startFrame && frame < w.endFrame) || null
    },

    getEmotionAtFrame: (frame: number) => {
      const { activeEmotionTimeline } = get()
      return getEmotionAtFrameFromTimeline(activeEmotionTimeline, frame)
    },

    getCaptionAtFrame: (frame: number) => {
      const { captionStyle, activeWordTimeline, activeSentenceTimeline } = get()

      switch (captionStyle) {
        case 'word-by-word': {
          const word = activeWordTimeline.find(
            (w) => frame >= w.startFrame && frame < w.endFrame
          )
          return word ? { text: word.word } : null
        }

        case 'sentence': {
          const sentence = activeSentenceTimeline.find(
            (s) => frame >= s.startFrame && frame < s.endFrame
          )
          return sentence ? { text: sentence.sentence } : null
        }

        case 'karaoke': {
          const sentence = activeSentenceTimeline.find(
            (s) => frame >= s.startFrame && frame < s.endFrame
          )
          if (!sentence) return null

          const activeWordIndex = sentence.words.findIndex(
            (w) => frame >= w.startFrame && frame < w.endFrame
          )

          return {
            text: sentence.sentence,
            highlightIndex: activeWordIndex >= 0 ? activeWordIndex : undefined,
          }
        }

        default:
          return null
      }
    },

    // Error handling
    setError: (error) =>
      set((state) => {
        state.error = error
      }),

    clearError: () =>
      set((state) => {
        state.error = null
      }),

    setTimelinesFromTranscript: (wordTimeline, sentenceTimeline) =>
      set((state) => {
        state.activeWordTimeline = wordTimeline
        state.activeSentenceTimeline = sentenceTimeline
      }),

    // Load from project
    loadFromProject: (voices) =>
      set((state) => {
        state.generatedVoices = voices.map((v) => ({
          id: v.id,
          script: v.script,
          voiceId: v.voiceId,
          voiceName: v.voiceName,
          audioUrl: v.audioUrl,
          audioDuration: v.audioDuration,
          alignment: v.alignment as unknown as GeneratedVoice['alignment'],
          visemeTimeline: v.visemeTimeline as unknown as VisemeEvent[],
          wordTimeline: v.wordTimeline as unknown as WordEvent[],
          createdAt: v.createdAt.getTime(),
        }))

        // Set the most recent voice as active
        if (voices.length > 0) {
          const latestVoice = state.generatedVoices[state.generatedVoices.length - 1]
          state.activeVoiceId = latestVoice.id
          state.activeVisemeTimeline = latestVoice.visemeTimeline
          state.activeWordTimeline = latestVoice.wordTimeline

          // Re-process sentence timeline (strip emotion cues — word timeline uses clean script)
          const fps = useTimelineStore.getState().fps
          const captionProcessor = new CaptionProcessor(fps)
          const cleanScript = latestVoice.script.replace(/\[[\w-]+\]/g, '').replace(/\s+/g, ' ').trim()
          state.activeSentenceTimeline = captionProcessor.groupIntoSentences(
            cleanScript,
            latestVoice.wordTimeline
          )

          // Build emotion timeline from raw script
          state.activeEmotionTimeline = buildEmotionTimeline(
            latestVoice.script,
            latestVoice.wordTimeline
          )
        }
      }),

    // Reset all content state (for new project) — preserves API config and available voices
    reset: () =>
      set((state) => {
        state.script = ''
        state.generatedVoices = []
        state.activeVoiceId = null
        state.activeVisemeTimeline = []
        state.activeWordTimeline = []
        state.activeSentenceTimeline = []
        state.activeEmotionTimeline = []
        state.isLoading = false
        state.error = null
        // Preserve: isApiKeyValid, availableVoices, selectedVoiceId, voiceSettings, caption settings
      }),
  }))
)
