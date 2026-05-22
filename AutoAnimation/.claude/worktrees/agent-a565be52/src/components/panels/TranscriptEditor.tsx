/**
 * TranscriptEditor — Rich transcript editor component.
 *
 * Renders words as inline spans with:
 * - Click-to-seek
 * - Double-click-to-edit
 * - Color-coded speaker labels
 * - Confidence-based opacity
 * - Highlight on current playback word
 * - Paragraph breaks at segment boundaries
 * - Keyboard navigation (arrow keys between words)
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useTranscriptStore } from '@/stores/useTranscriptStore'
import { useTimelineStore } from '@/stores/useTimelineStore'
import type { WhisperWord, WhisperSegment } from '@/services/whisperTranscript'

/** Speaker color palette */
const SPEAKER_COLORS: Record<string, string> = {}
const COLOR_PALETTE = [
  'text-amber-300', 'text-blue-300', 'text-emerald-300',
  'text-purple-300', 'text-pink-300', 'text-cyan-300',
  'text-orange-300', 'text-lime-300',
]
let colorIndex = 0

function getSpeakerColor(speaker: string): string {
  if (!SPEAKER_COLORS[speaker]) {
    SPEAKER_COLORS[speaker] = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]
    colorIndex++
  }
  return SPEAKER_COLORS[speaker]
}

function getSpeakerBg(speaker: string): string {
  const bgMap: Record<string, string> = {
    'text-amber-300': 'bg-amber-500/10',
    'text-blue-300': 'bg-blue-500/10',
    'text-emerald-300': 'bg-emerald-500/10',
    'text-purple-300': 'bg-purple-500/10',
    'text-pink-300': 'bg-pink-500/10',
    'text-cyan-300': 'bg-cyan-500/10',
    'text-orange-300': 'bg-orange-500/10',
    'text-lime-300': 'bg-lime-500/10',
  }
  return bgMap[getSpeakerColor(speaker)] || 'bg-white/5'
}

interface WordSpanProps {
  word: WhisperWord
  segmentId: number
  wordIndex: number
  isActive: boolean
  isSilenceHighlight: boolean
  isFillerHighlight: boolean
  searchHighlight: boolean
  onSeek: (time: number) => void
  onEdit: (segmentId: number, wordIndex: number, newText: string) => void
}

function WordSpan({
  word,
  segmentId,
  wordIndex,
  isActive,
  isSilenceHighlight,
  isFillerHighlight,
  searchHighlight,
  onSeek,
  onEdit,
}: WordSpanProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(word.word)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = () => {
    setEditText(word.word)
    setIsEditing(true)
  }

  const handleEditSubmit = () => {
    if (editText.trim() !== word.word) {
      onEdit(segmentId, wordIndex, editText.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit()
    } else if (e.key === 'Escape') {
      setIsEditing(false)
    }
  }

  // Confidence-based opacity (low confidence = dimmer)
  const opacity = word.confidence < 0.7 ? 'opacity-60' : ''
  const lowConfidenceStyle = word.confidence < 0.7 ? 'underline decoration-yellow-500/50 decoration-wavy underline-offset-2' : ''

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        value={editText}
        onChange={(e) => setEditText(e.target.value)}
        onBlur={handleEditSubmit}
        onKeyDown={handleKeyDown}
        className="inline-block bg-zinc-700 text-zinc-200 text-xs rounded px-1 py-0.5 border border-cyan-500/50 outline-none min-w-[30px]"
        style={{ width: `${Math.max(30, editText.length * 7)}px` }}
      />
    )
  }

  return (
    <span
      onClick={() => onSeek(word.start)}
      onDoubleClick={handleDoubleClick}
      className={cn(
        'cursor-pointer rounded-sm px-0.5 py-0.5 transition-all duration-100 hover:bg-white/10',
        opacity,
        lowConfidenceStyle,
        isActive && 'bg-amber-500/30 text-amber-200 font-medium',
        isSilenceHighlight && 'bg-red-500/20 text-red-300',
        isFillerHighlight && 'bg-orange-500/20 text-orange-300',
        searchHighlight && 'bg-cyan-500/20 text-cyan-300',
      )}
      title={`${word.word} (${word.start.toFixed(2)}s - ${word.end.toFixed(2)}s, confidence: ${(word.confidence * 100).toFixed(0)}%)`}
    >
      {word.word}{' '}
    </span>
  )
}

export function TranscriptEditor() {
  const editedSegments = useTranscriptStore((s) => s.editedSegments)
  const searchQuery = useTranscriptStore((s) => s.searchQuery)
  const silenceRegions = useTranscriptStore((s) => s.silenceRegions)
  const fillerRegions = useTranscriptStore((s) => s.fillerRegions)
  const updateWordText = useTranscriptStore((s) => s.updateWordText)
  const currentFrame = useTimelineStore((s) => s.currentFrame)
  const fps = useTimelineStore((s) => s.fps)

  const activeWordRef = useRef<HTMLSpanElement>(null)

  // Auto-scroll to active word
  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [currentFrame])

  const handleSeek = useCallback((time: number) => {
    useTimelineStore.getState().seekToFrame(Math.round(time * fps))
  }, [fps])

  const handleEdit = useCallback((segmentId: number, wordIndex: number, newText: string) => {
    updateWordText(segmentId, wordIndex, newText)
  }, [updateWordText])

  const isWordActive = useCallback((word: WhisperWord) => {
    const currentTime = currentFrame / fps
    return currentTime >= word.start && currentTime < word.end
  }, [currentFrame, fps])

  const isFillerWord = useCallback((word: WhisperWord) => {
    return fillerRegions.some(
      (f) => Math.abs(f.startTime - word.start) < 0.05 && Math.abs(f.endTime - word.end) < 0.05,
    )
  }, [fillerRegions])

  const isSilenceAfterWord = useCallback((word: WhisperWord) => {
    return silenceRegions.some(
      (s) => Math.abs(s.startTime - word.end) < 0.1,
    )
  }, [silenceRegions])

  const isSearchMatch = useCallback((word: WhisperWord) => {
    if (!searchQuery.trim()) return false
    return word.word.toLowerCase().includes(searchQuery.toLowerCase())
  }, [searchQuery])

  if (editedSegments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <p className="text-xs text-zinc-500">No transcript data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
      {editedSegments.map((seg) => (
        <SegmentBlock
          key={seg.id}
          segment={seg}
          activeWordRef={activeWordRef}
          isWordActive={isWordActive}
          isFillerWord={isFillerWord}
          isSilenceAfterWord={isSilenceAfterWord}
          isSearchMatch={isSearchMatch}
          onSeek={handleSeek}
          onEdit={handleEdit}
        />
      ))}
    </div>
  )
}

interface SegmentBlockProps {
  segment: WhisperSegment
  activeWordRef: React.RefObject<HTMLSpanElement | null>
  isWordActive: (word: WhisperWord) => boolean
  isFillerWord: (word: WhisperWord) => boolean
  isSilenceAfterWord: (word: WhisperWord) => boolean
  isSearchMatch: (word: WhisperWord) => boolean
  onSeek: (time: number) => void
  onEdit: (segmentId: number, wordIndex: number, newText: string) => void
}

function SegmentBlock({
  segment,
  activeWordRef,
  isWordActive,
  isFillerWord,
  isSilenceAfterWord,
  isSearchMatch,
  onSeek,
  onEdit,
}: SegmentBlockProps) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toFixed(1).padStart(4, '0')}`
  }

  return (
    <div
      className={cn(
        'py-2 px-2.5 rounded-lg transition-colors hover:bg-white/[0.02]',
        segment.speaker && getSpeakerBg(segment.speaker),
      )}
    >
      {/* Speaker label + time */}
      <div className="flex items-center gap-1.5 mb-1">
        {segment.speaker && (
          <span className={cn('text-[10px] font-bold uppercase tracking-wide', getSpeakerColor(segment.speaker))}>
            {segment.speaker}
          </span>
        )}
        <span className="text-[8px] text-zinc-600 tabular-nums">
          {formatTime(segment.start)}
        </span>
      </div>

      {/* Word-level transcript */}
      <div className="text-xs text-zinc-300 leading-relaxed">
        {segment.words.map((word, wi) => {
          const active = isWordActive(word)
          return (
            <span key={`${segment.id}-${wi}`} ref={active ? activeWordRef : undefined}>
              <WordSpan
                word={word}
                segmentId={segment.id}
                wordIndex={wi}
                isActive={active}
                isSilenceHighlight={isSilenceAfterWord(word)}
                isFillerHighlight={isFillerWord(word)}
                searchHighlight={isSearchMatch(word)}
                onSeek={onSeek}
                onEdit={onEdit}
              />
            </span>
          )
        })}
      </div>
    </div>
  )
}
