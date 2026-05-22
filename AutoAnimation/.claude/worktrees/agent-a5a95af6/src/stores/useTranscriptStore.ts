/**
 * Transcript Store — Whisper transcription, editing, silence removal, and import state.
 *
 * Extended from the former useTranscriptImportStore with:
 * - Multi-provider support (whisper/deepgram/assemblyai)
 * - Speaker diarization
 * - Search/filter
 * - Segment merge/split
 * - SRT/VTT export
 * - Silence & filler detection
 * - Caption generation from transcript
 */

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import {
  transcribeAudio,
  segmentsToDialogueLines,
  detectSilences,
  detectFillers,
  type WhisperResult,
  type WhisperSegment,
  type WhisperWord,
  type TranscriptionOptions,
} from '@/services/whisperTranscript'
import { CaptionProcessor } from '@/services/captions'
import { useMultiCharacterStore } from '@/stores/useMultiCharacterStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import { useVoiceStore } from '@/stores/useVoiceStore'
import { toast } from '@/stores/useToastStore'
import type {
  SilenceRegion,
  FillerRegion,
  RemovalMode,
  TimelineEdit,
} from '@/types/silenceRemoval'

// Default filler words
const DEFAULT_FILLER_WORDS = [
  'um', 'uh', 'uhm', 'uhh', 'hmm', 'hm', 'er', 'ah',
  'like', 'you know', 'basically', 'actually', 'literally',
  'sort of', 'kind of', 'i mean', 'right', 'so',
]

// Silence thresholds per mode
const MODE_THRESHOLDS: Record<RemovalMode, number> = {
  natural: 1.5,
  fast: 0.8,
  'extra-fast': 0.3,
}

interface TranscriptState {
  // Upload
  file: File | null
  fileName: string | null

  // Processing
  isTranscribing: boolean
  error: string | null

  // Provider options
  transcriptionOptions: TranscriptionOptions

  // Result
  result: WhisperResult | null
  editedSegments: WhisperSegment[]

  // Speaker diarization
  speakers: string[]

  // Navigation
  activeSegmentId: number | null

  // Search
  searchQuery: string

  // Silence/Filler removal
  silenceThreshold: number
  fillerWords: string[]
  removalMode: RemovalMode | null
  removalPreview: TimelineEdit[]
  silenceRegions: SilenceRegion[]
  fillerRegions: FillerRegion[]
  excludedRegionIndices: Set<number>

  // Actions
  setFile: (file: File) => void
  setTranscriptionOptions: (options: Partial<TranscriptionOptions>) => void
  transcribe: (options?: TranscriptionOptions) => Promise<void>
  updateSegmentText: (segmentId: number, text: string) => void
  updateWordText: (segmentId: number, wordIndex: number, newText: string) => void
  removeSegment: (segmentId: number) => void
  mergeSegments: (ids: number[]) => void
  splitSegment: (id: number, wordIndex: number) => void
  assignSpeaker: (segmentId: number, speaker: string) => void
  renameSpeaker: (oldName: string, newName: string) => void
  mergeSpeakers: (keepName: string, removeName: string) => void
  setActiveSegmentId: (id: number | null) => void
  setSearchQuery: (query: string) => void
  importToProject: () => void
  generateCaptions: () => void
  exportAsSRT: () => string
  exportAsVTT: () => string

  // Silence removal
  setSilenceThreshold: (threshold: number) => void
  setFillerWords: (words: string[]) => void
  addFillerWord: (word: string) => void
  removeFillerWord: (word: string) => void
  detectSilencesAndFillers: (mode: RemovalMode) => void
  setRemovalMode: (mode: RemovalMode | null) => void
  toggleRegionExclusion: (index: number) => void
  clearRemovalPreview: () => void

  // Computed
  getFilteredSegments: () => WhisperSegment[]

  reset: () => void
}

export const useTranscriptStore = create<TranscriptState>()(
  immer((set, get) => ({
    file: null,
    fileName: null,
    isTranscribing: false,
    error: null,
    transcriptionOptions: { provider: 'whisper' },
    result: null,
    editedSegments: [],
    speakers: [],
    activeSegmentId: null,
    searchQuery: '',
    silenceThreshold: 1.5,
    fillerWords: [...DEFAULT_FILLER_WORDS],
    removalMode: null,
    removalPreview: [],
    silenceRegions: [],
    fillerRegions: [],
    excludedRegionIndices: new Set(),

    setFile: (file: File) =>
      set((s) => {
        s.file = file
        s.fileName = file.name
        s.result = null
        s.editedSegments = []
        s.speakers = []
        s.error = null
        s.removalMode = null
        s.removalPreview = []
        s.silenceRegions = []
        s.fillerRegions = []
      }),

    setTranscriptionOptions: (options: Partial<TranscriptionOptions>) =>
      set((s) => {
        s.transcriptionOptions = { ...s.transcriptionOptions, ...options }
      }),

    transcribe: async (options?: TranscriptionOptions) => {
      const file = get().file
      if (!file) return

      const mergedOptions = { ...get().transcriptionOptions, ...options }

      set((s) => {
        s.isTranscribing = true
        s.error = null
      })

      try {
        const result = await transcribeAudio(file, mergedOptions)
        const detectedSpeakers = new Set<string>()

        // Collect speakers from words and segments
        for (const word of result.words) {
          if (word.speaker) detectedSpeakers.add(word.speaker)
        }
        for (const seg of result.segments) {
          if (seg.speaker) detectedSpeakers.add(seg.speaker)
        }

        set((s) => {
          s.result = result
          s.editedSegments = result.segments.map((seg) => ({ ...seg }))
          s.speakers = Array.from(detectedSpeakers)
          s.isTranscribing = false
        })
        toast.success(`Transcribed: ${result.segments.length} segments (${result.language})`)
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : 'Transcription failed'
        set((s) => {
          s.isTranscribing = false
          s.error = errMsg
        })
        toast.error(errMsg)
      }
    },

    updateSegmentText: (segmentId: number, text: string) =>
      set((s) => {
        const seg = s.editedSegments.find((seg) => seg.id === segmentId)
        if (seg) seg.text = text
      }),

    updateWordText: (segmentId: number, wordIndex: number, newText: string) =>
      set((s) => {
        const seg = s.editedSegments.find((seg) => seg.id === segmentId)
        if (seg && seg.words[wordIndex]) {
          seg.words[wordIndex].word = newText
          // Rebuild segment text from words
          seg.text = seg.words.map((w) => w.word).join(' ')
        }
      }),

    removeSegment: (segmentId: number) =>
      set((s) => {
        s.editedSegments = s.editedSegments.filter((seg) => seg.id !== segmentId)
      }),

    mergeSegments: (ids: number[]) =>
      set((s) => {
        if (ids.length < 2) return
        const toMerge = s.editedSegments
          .filter((seg) => ids.includes(seg.id))
          .sort((a, b) => a.start - b.start)
        if (toMerge.length < 2) return

        const merged: WhisperSegment = {
          id: toMerge[0].id,
          text: toMerge.map((seg) => seg.text).join(' '),
          start: toMerge[0].start,
          end: toMerge[toMerge.length - 1].end,
          speaker: toMerge[0].speaker,
          words: toMerge.flatMap((seg) => seg.words),
        }

        // Remove all but first, then replace first with merged
        const mergeIds = new Set(ids.slice(1))
        s.editedSegments = s.editedSegments
          .filter((seg) => !mergeIds.has(seg.id))
          .map((seg) => (seg.id === merged.id ? merged : seg))
      }),

    splitSegment: (id: number, wordIndex: number) =>
      set((s) => {
        const segIdx = s.editedSegments.findIndex((seg) => seg.id === id)
        if (segIdx < 0) return
        const seg = s.editedSegments[segIdx]
        if (wordIndex <= 0 || wordIndex >= seg.words.length) return

        const firstWords = seg.words.slice(0, wordIndex)
        const secondWords = seg.words.slice(wordIndex)

        const newId = Math.max(...s.editedSegments.map((seg) => seg.id)) + 1

        const first: WhisperSegment = {
          id: seg.id,
          text: firstWords.map((w) => w.word).join(' '),
          start: firstWords[0].start,
          end: firstWords[firstWords.length - 1].end,
          speaker: seg.speaker,
          words: firstWords,
        }

        const second: WhisperSegment = {
          id: newId,
          text: secondWords.map((w) => w.word).join(' '),
          start: secondWords[0].start,
          end: secondWords[secondWords.length - 1].end,
          speaker: seg.speaker,
          words: secondWords,
        }

        s.editedSegments.splice(segIdx, 1, first, second)
      }),

    assignSpeaker: (segmentId: number, speaker: string) =>
      set((s) => {
        const seg = s.editedSegments.find((seg) => seg.id === segmentId)
        if (seg) {
          seg.speaker = speaker
          // Also update words in the segment
          for (const word of seg.words) {
            word.speaker = speaker
          }
        }
        // Add to speakers list if new
        if (!s.speakers.includes(speaker)) {
          s.speakers.push(speaker)
        }
      }),

    renameSpeaker: (oldName: string, newName: string) =>
      set((s) => {
        const idx = s.speakers.indexOf(oldName)
        if (idx >= 0) s.speakers[idx] = newName
        for (const seg of s.editedSegments) {
          if (seg.speaker === oldName) seg.speaker = newName
          for (const w of seg.words) {
            if (w.speaker === oldName) w.speaker = newName
          }
        }
      }),

    mergeSpeakers: (keepName: string, removeName: string) =>
      set((s) => {
        s.speakers = s.speakers.filter((sp) => sp !== removeName)
        for (const seg of s.editedSegments) {
          if (seg.speaker === removeName) seg.speaker = keepName
          for (const w of seg.words) {
            if (w.speaker === removeName) w.speaker = keepName
          }
        }
      }),

    setActiveSegmentId: (id: number | null) =>
      set((s) => {
        s.activeSegmentId = id
      }),

    setSearchQuery: (query: string) =>
      set((s) => {
        s.searchQuery = query
      }),

    getFilteredSegments: () => {
      const { editedSegments, searchQuery } = get()
      if (!searchQuery.trim()) return editedSegments

      const q = searchQuery.toLowerCase()
      return editedSegments.filter((seg) => seg.text.toLowerCase().includes(q))
    },

    importToProject: () => {
      const { editedSegments } = get()
      if (editedSegments.length === 0) return

      const fps = useTimelineStore.getState().fps || 30
      const multiChar = useMultiCharacterStore.getState()

      // Create a default character if none exist
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

      // Convert segments to dialogue lines
      const dialogueLines = segmentsToDialogueLines(editedSegments, fps)
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

      // Set total frames to cover the full transcript
      const maxEndFrame = Math.max(...dialogueLines.map((l) => l.endFrame))
      const currentTotal = useTimelineStore.getState().totalFrames
      if (maxEndFrame > currentTotal) {
        useTimelineStore.getState().setTotalFrames(maxEndFrame + fps) // +1s buffer
      }

      toast.success(`Imported ${dialogueLines.length} dialogue lines`)

      // Reset import state
      set((s) => {
        s.file = null
        s.fileName = null
        s.result = null
        s.editedSegments = []
      })
    },

    generateCaptions: () => {
      const { result, editedSegments } = get()
      if (!result || editedSegments.length === 0) return

      const fps = useTimelineStore.getState().fps || 30

      // Collect all words from edited segments
      const allWords: WhisperWord[] = editedSegments.flatMap((seg) => seg.words)

      const { wordTimeline, sentenceTimeline } = CaptionProcessor.fromTranscript(allWords, fps)

      // Populate the voice store timelines
      useVoiceStore.getState().setTimelinesFromTranscript(wordTimeline, sentenceTimeline)

      toast.success(`Generated ${wordTimeline.length} word captions from transcript`)
    },

    exportAsSRT: () => {
      const { editedSegments } = get()
      const lines: string[] = []

      editedSegments.forEach((seg, i) => {
        lines.push(`${i + 1}`)
        lines.push(`${formatSRTTime(seg.start)} --> ${formatSRTTime(seg.end)}`)
        const text = seg.speaker ? `[${seg.speaker}] ${seg.text}` : seg.text
        lines.push(text)
        lines.push('')
      })

      return lines.join('\n')
    },

    exportAsVTT: () => {
      const { editedSegments } = get()
      const lines: string[] = ['WEBVTT', '']

      editedSegments.forEach((seg, i) => {
        lines.push(`${i + 1}`)
        lines.push(`${formatVTTTime(seg.start)} --> ${formatVTTTime(seg.end)}`)
        const text = seg.speaker ? `<v ${seg.speaker}>${seg.text}` : seg.text
        lines.push(text)
        lines.push('')
      })

      return lines.join('\n')
    },

    // Silence removal
    setSilenceThreshold: (threshold: number) =>
      set((s) => {
        s.silenceThreshold = threshold
      }),

    setFillerWords: (words: string[]) =>
      set((s) => {
        s.fillerWords = words
      }),

    addFillerWord: (word: string) =>
      set((s) => {
        if (!s.fillerWords.includes(word.toLowerCase())) {
          s.fillerWords.push(word.toLowerCase())
        }
      }),

    removeFillerWord: (word: string) =>
      set((s) => {
        s.fillerWords = s.fillerWords.filter((w) => w !== word.toLowerCase())
      }),

    detectSilencesAndFillers: (mode: RemovalMode) => {
      const { editedSegments, fillerWords } = get()
      const allWords = editedSegments.flatMap((seg) => seg.words)
      if (allWords.length === 0) return

      const threshold = MODE_THRESHOLDS[mode]
      const silences = detectSilences(allWords, threshold)
      const fillers = mode === 'extra-fast' ? detectFillers(allWords, fillerWords) : []

      const fps = useTimelineStore.getState().fps || 30
      const minGapSec = 0.075 // 75ms minimum gap between clips

      const edits: TimelineEdit[] = []

      for (const silence of silences) {
        // Keep a small gap for natural breathing
        const adjustedStart = silence.startTime
        const adjustedEnd = Math.max(silence.endTime - minGapSec, silence.startTime + 0.01)
        edits.push({
          type: 'remove',
          startFrame: Math.round(adjustedStart * fps),
          endFrame: Math.round(adjustedEnd * fps),
          reason: `Silence (${silence.duration.toFixed(1)}s)`,
        })
      }

      for (const filler of fillers) {
        edits.push({
          type: 'remove',
          startFrame: Math.round(filler.startTime * fps),
          endFrame: Math.round(filler.endTime * fps),
          reason: `Filler: "${filler.word}"`,
        })
      }

      // Sort by start frame
      edits.sort((a, b) => a.startFrame - b.startFrame)

      set((s) => {
        s.removalMode = mode
        s.silenceRegions = silences
        s.fillerRegions = fillers
        s.removalPreview = edits
        s.excludedRegionIndices = new Set()
      })
    },

    setRemovalMode: (mode: RemovalMode | null) => {
      if (mode) {
        get().detectSilencesAndFillers(mode)
      } else {
        set((s) => {
          s.removalMode = null
          s.removalPreview = []
          s.silenceRegions = []
          s.fillerRegions = []
          s.excludedRegionIndices = new Set()
        })
      }
    },

    toggleRegionExclusion: (index: number) =>
      set((s) => {
        const newSet = new Set(s.excludedRegionIndices)
        if (newSet.has(index)) {
          newSet.delete(index)
        } else {
          newSet.add(index)
        }
        s.excludedRegionIndices = newSet
      }),

    clearRemovalPreview: () =>
      set((s) => {
        s.removalMode = null
        s.removalPreview = []
        s.silenceRegions = []
        s.fillerRegions = []
        s.excludedRegionIndices = new Set()
      }),

    reset: () =>
      set((s) => {
        s.file = null
        s.fileName = null
        s.isTranscribing = false
        s.error = null
        s.result = null
        s.editedSegments = []
        s.speakers = []
        s.activeSegmentId = null
        s.searchQuery = ''
        s.removalMode = null
        s.removalPreview = []
        s.silenceRegions = []
        s.fillerRegions = []
        s.excludedRegionIndices = new Set()
      }),
  })),
)

// Also export legacy name for backwards compatibility
export const useTranscriptImportStore = useTranscriptStore

// ── Helpers ───────────────────────────────────────────────────────────

function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${pad2(h)}:${pad2(m)}:${pad2(s)},${pad3(ms)}`
}

function formatVTTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.round((seconds % 1) * 1000)
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}.${pad3(ms)}`
}

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}

function pad3(n: number): string {
  return n.toString().padStart(3, '0')
}
