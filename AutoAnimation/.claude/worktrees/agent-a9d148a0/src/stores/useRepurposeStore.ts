/**
 * Repurpose Store — Long-to-short clip extraction and generation state.
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { extractBestClips, type ExtractedClip } from '@/services/clipExtractor'
import { segmentsToDialogueLines, type WhisperResult } from '@/services/whisperTranscript'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useEditorStore } from '@/stores/useEditorStore'
import { toast } from '@/stores/useToastStore'
import { logger } from '@/utils/logger'

interface SlicedPreview {
  clipId: string
  blob: Blob
  url: string
  durationSec: number
}

interface RepurposeState {
  // Source
  sourceTranscript: WhisperResult | null
  sourceVideoFile: File | null
  sourceVideoUrl: string | null
  sourceVideoDuration: number

  // Extraction
  isExtracting: boolean
  extractedClips: ExtractedClip[]
  selectedClipIds: Set<string>

  // Slicing
  isSlicing: boolean
  slicedPreviews: SlicedPreview[]

  // Generation
  isGenerating: boolean
  generationProgress: number // 0-100

  // Actions
  setSourceTranscript: (transcript: WhisperResult) => void
  uploadSourceVideo: (file: File) => Promise<void>
  slicePreview: (clipId: string) => Promise<void>
  extractClips: () => Promise<void>
  toggleClipSelection: (clipId: string) => void
  selectAllClips: () => void
  deselectAllClips: () => void
  generateShort: (clipId: string) => void
  generateShortFromClip: (clipId: string) => void
  generateSelectedShorts: () => void
  reset: () => void
}

export const useRepurposeStore = create<RepurposeState>()(
  immer((set, get) => ({
    sourceTranscript: null,
    sourceVideoFile: null,
    sourceVideoUrl: null,
    sourceVideoDuration: 0,
    isExtracting: false,
    extractedClips: [],
    selectedClipIds: new Set<string>(),
    isSlicing: false,
    slicedPreviews: [],
    isGenerating: false,
    generationProgress: 0,

    setSourceTranscript: (transcript: WhisperResult) =>
      set((s) => {
        s.sourceTranscript = transcript
        s.extractedClips = []
        s.selectedClipIds = new Set()
      }),

    uploadSourceVideo: async (file: File) => {
      const url = URL.createObjectURL(file)

      // Get video duration
      const duration = await new Promise<number>((resolve) => {
        const video = document.createElement('video')
        video.muted = true
        video.preload = 'metadata'
        video.src = url
        video.onloadedmetadata = () => resolve(video.duration)
        video.onerror = () => resolve(0)
      })

      set((s) => {
        if (s.sourceVideoUrl) URL.revokeObjectURL(s.sourceVideoUrl)
        s.sourceVideoFile = file as unknown as File
        s.sourceVideoUrl = url
        s.sourceVideoDuration = duration
        s.extractedClips = []
        s.selectedClipIds = new Set()
        s.slicedPreviews = []
      })

      toast.success(`Video loaded: ${Math.round(duration)}s`)
    },

    slicePreview: async (clipId: string) => {
      const { sourceVideoFile, extractedClips } = get()
      const clip = extractedClips.find((c) => c.id === clipId)
      if (!clip || !sourceVideoFile) return

      set((s) => { s.isSlicing = true })

      try {
        const { sliceVideo } = await import('@/services/videoSlicer')
        const result = await sliceVideo(sourceVideoFile, clip.startTime, clip.endTime)

        const url = URL.createObjectURL(result.blob)

        set((s) => {
          s.slicedPreviews.push({
            clipId,
            blob: result.blob as unknown as Blob,
            url,
            durationSec: result.durationSec,
          })
          s.isSlicing = false
        })
      } catch (err) {
        logger.error('[Repurpose] Slice failed:', err)
        set((s) => { s.isSlicing = false })
        toast.error('Video slicing failed')
      }
    },

    extractClips: async () => {
      const { sourceTranscript } = get()
      if (!sourceTranscript) return

      set((s) => {
        s.isExtracting = true
        s.extractedClips = []
      })

      try {
        const clips = await extractBestClips(
          sourceTranscript.segments,
          sourceTranscript.duration,
        )

        set((s) => {
          s.extractedClips = clips
          s.isExtracting = false
          // Auto-select top 3
          s.selectedClipIds = new Set(clips.slice(0, 3).map((c) => c.id))
        })

        toast.success(`Found ${clips.length} potential clips`)
      } catch (err) {
        logger.error('[Repurpose] Extraction failed:', err)
        set((s) => {
          s.isExtracting = false
        })
        toast.error('Clip extraction failed')
      }
    },

    toggleClipSelection: (clipId: string) =>
      set((s) => {
        if (s.selectedClipIds.has(clipId)) {
          s.selectedClipIds.delete(clipId)
        } else {
          s.selectedClipIds.add(clipId)
        }
      }),

    selectAllClips: () =>
      set((s) => {
        s.selectedClipIds = new Set(s.extractedClips.map((c) => c.id))
      }),

    deselectAllClips: () =>
      set((s) => {
        s.selectedClipIds = new Set()
      }),

    generateShort: (clipId: string) => {
      const clip = get().extractedClips.find((c) => c.id === clipId)
      if (!clip) return

      const fps = useTimelineStore.getState().fps || 30
      const multiChar = useMultiCharacterStore.getState()

      // Ensure a character exists
      let characterId = multiChar.characters[0]?.id
      if (!characterId) {
        characterId = multiChar.addDialogueCharacter({
          name: 'Speaker',
          savedCharacterId: null,
          voiceId: null,
          position: { x: 0.5, y: 0.5 },
          scale: 1,
          zIndex: 0,
          visible: true,
          locked: false,
          color: '',
        })
      }

      // Add clip's segments as dialogue lines
      const dialogueLines = segmentsToDialogueLines(clip.segments, fps)
      for (let i = 0; i < dialogueLines.length; i++) {
        const line = dialogueLines[i]
        multiChar.addDialogueLine({
          characterId,
          generatedVoiceId: null,
          order: i,
          visemeTimeline: [],
          wordTimeline: [],
          ...line,
        })
      }

      // Set duration and 9:16 aspect ratio
      const maxEndFrame = Math.max(...dialogueLines.map((l) => l.endFrame), fps)
      useTimelineStore.getState().setTotalFrames(maxEndFrame + fps)
      useEditorStore.getState().setAspectRatio('9:16')

      toast.success(`Generated short from: ${clip.title}`)
    },

    generateShortFromClip: (clipId: string) => {
      // Alias for generateShort — also usable as an entry point from ClipExtractionPanel
      get().generateShort(clipId)
    },

    generateSelectedShorts: () => {
      const { extractedClips, selectedClipIds } = get()
      const selected = extractedClips.filter((c) => selectedClipIds.has(c.id))
      if (selected.length === 0) return

      // Generate the first selected clip into the current project
      get().generateShort(selected[0].id)

      if (selected.length > 1) {
        toast.success(`Applied first clip. Use batch create for remaining ${selected.length - 1} clips.`)
      }
    },

    reset: () =>
      set((s) => {
        s.sourceTranscript = null
        if (s.sourceVideoUrl) URL.revokeObjectURL(s.sourceVideoUrl)
        s.sourceVideoFile = null
        s.sourceVideoUrl = null
        s.sourceVideoDuration = 0
        s.isExtracting = false
        s.extractedClips = []
        s.selectedClipIds = new Set()
        s.isSlicing = false
        // Clean up sliced preview URLs
        for (const preview of s.slicedPreviews) {
          URL.revokeObjectURL(preview.url)
        }
        s.slicedPreviews = []
        s.isGenerating = false
        s.generationProgress = 0
      }),
  })),
)
