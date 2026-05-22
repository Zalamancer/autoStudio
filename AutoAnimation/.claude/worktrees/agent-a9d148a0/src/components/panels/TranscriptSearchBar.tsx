/**
 * TranscriptSearchBar — Search bar with find/replace for transcript editing.
 *
 * Highlights matching words, supports regex, navigate between matches.
 */

import { useState, useCallback, useMemo } from 'react'
import { Search, Replace, ChevronUp, ChevronDown, X } from 'lucide-react'
import { useTranscriptStore } from '@/stores/useTranscriptStore'

export function TranscriptSearchBar() {
  const searchQuery = useTranscriptStore((s) => s.searchQuery)
  const setSearchQuery = useTranscriptStore((s) => s.setSearchQuery)
  const editedSegments = useTranscriptStore((s) => s.editedSegments)
  const updateWordText = useTranscriptStore((s) => s.updateWordText)

  const [replaceText, setReplaceText] = useState('')
  const [showReplace, setShowReplace] = useState(false)
  const [useRegex, setUseRegex] = useState(false)
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)

  // Find all matches
  const matches = useMemo(() => {
    if (!searchQuery.trim()) return []

    const results: { segmentId: number; wordIndex: number; word: string }[] = []

    for (const seg of editedSegments) {
      for (let i = 0; i < seg.words.length; i++) {
        const word = seg.words[i].word
        let isMatch = false

        if (useRegex) {
          try {
            isMatch = new RegExp(searchQuery, 'i').test(word)
          } catch {
            isMatch = false
          }
        } else {
          isMatch = word.toLowerCase().includes(searchQuery.toLowerCase())
        }

        if (isMatch) {
          results.push({ segmentId: seg.id, wordIndex: i, word })
        }
      }
    }

    return results
  }, [searchQuery, editedSegments, useRegex])

  const navigateMatch = useCallback((direction: 'next' | 'prev') => {
    if (matches.length === 0) return

    let newIndex = currentMatchIndex
    if (direction === 'next') {
      newIndex = (currentMatchIndex + 1) % matches.length
    } else {
      newIndex = (currentMatchIndex - 1 + matches.length) % matches.length
    }
    setCurrentMatchIndex(newIndex)

    // Seek to the matched word's position
    const match = matches[newIndex]
    if (match) {
      const seg = editedSegments.find((s) => s.id === match.segmentId)
      if (seg && seg.words[match.wordIndex]) {
        const fps = 30 // Approximate for seek
        const frame = Math.round(seg.words[match.wordIndex].start * fps)
        import('@/stores/useTimelineStore').then((m) => {
          m.useTimelineStore.getState().seekToFrame(frame)
        })
      }
    }
  }, [matches, currentMatchIndex, editedSegments])

  const handleReplaceAll = useCallback(() => {
    if (!searchQuery.trim() || !replaceText) return

    for (const match of matches) {
      const seg = editedSegments.find((s) => s.id === match.segmentId)
      if (seg && seg.words[match.wordIndex]) {
        let newWord: string
        if (useRegex) {
          try {
            newWord = match.word.replace(new RegExp(searchQuery, 'gi'), replaceText)
          } catch {
            newWord = replaceText
          }
        } else {
          newWord = match.word.replace(new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), replaceText)
        }
        updateWordText(match.segmentId, match.wordIndex, newWord)
      }
    }
  }, [searchQuery, replaceText, matches, editedSegments, useRegex, updateWordText])

  return (
    <div className="space-y-1.5">
      {/* Search row */}
      <div className="flex items-center gap-1.5">
        <div className="flex-1 flex items-center gap-1.5 bg-zinc-800/60 rounded-lg px-2 py-1.5 border border-white/5 focus-within:border-cyan-500/30">
          <Search size={12} className="text-zinc-500 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentMatchIndex(0)
            }}
            placeholder="Search transcript..."
            className="flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
          />
          {searchQuery && (
            <span className="text-[10px] text-zinc-500 tabular-nums">
              {matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length}` : '0/0'}
            </span>
          )}
        </div>

        {/* Navigate between matches */}
        <button
          onClick={() => navigateMatch('prev')}
          disabled={matches.length === 0}
          className="p-1 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
          title="Previous match"
        >
          <ChevronUp size={14} />
        </button>
        <button
          onClick={() => navigateMatch('next')}
          disabled={matches.length === 0}
          className="p-1 rounded text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
          title="Next match"
        >
          <ChevronDown size={14} />
        </button>

        {/* Toggle replace */}
        <button
          onClick={() => setShowReplace(!showReplace)}
          className={`p-1 rounded transition-colors ${showReplace ? 'text-cyan-400 bg-cyan-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}
          title="Find & Replace"
        >
          <Replace size={14} />
        </button>

        {/* Toggle regex */}
        <button
          onClick={() => setUseRegex(!useRegex)}
          className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${useRegex ? 'text-cyan-400 bg-cyan-500/10' : 'text-zinc-500 hover:text-zinc-300'}`}
          title="Use regex"
        >
          .*
        </button>

        {/* Clear */}
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setCurrentMatchIndex(0) }}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Replace row */}
      {showReplace && (
        <div className="flex items-center gap-1.5">
          <div className="flex-1 flex items-center gap-1.5 bg-zinc-800/60 rounded-lg px-2 py-1.5 border border-white/5">
            <Replace size={12} className="text-zinc-500 shrink-0" />
            <input
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Replace with..."
              className="flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
            />
          </div>
          <button
            onClick={handleReplaceAll}
            disabled={matches.length === 0 || !replaceText}
            className="px-2 py-1 rounded-lg text-[10px] font-medium bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 disabled:opacity-30 whitespace-nowrap"
          >
            Replace All ({matches.length})
          </button>
        </div>
      )}
    </div>
  )
}
